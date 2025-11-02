import os
import json
import warnings
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from app.models.document import Document
from app.models.extracted_data import ExtractedData

import easyocr
import pdfplumber

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=GEMINI_API_KEY, temperature=0)

class ExtractionService:
    # Lazy initialization of EasyOCR reader to avoid slow startup
    _easyocr_reader = None
    
    @classmethod
    def _get_easyocr_reader(cls):
        """Lazy-load EasyOCR reader only when needed."""
        if cls._easyocr_reader is None:
            # Suppress pin_memory warning during initialization
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=UserWarning, message=".*pin_memory.*")
                cls._easyocr_reader = easyocr.Reader(["en"], gpu=False)
        return cls._easyocr_reader
    
    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        ext = Path(file_path).suffix.lower()
        if ext in [".pdf"]:
            return ExtractionService._extract_text_pdf(file_path)
        elif ext in [".jpg", ".jpeg", ".png"]:
            return ExtractionService._extract_text_image(file_path)
        else:
            raise ValueError("Unsupported file type for extraction")

    @staticmethod
    def _extract_text_pdf(file_path: str) -> str:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
        return text.strip()

    @staticmethod
    def _extract_text_image(file_path: str) -> str:
        # Lazy-load reader when actually needed
        reader = ExtractionService._get_easyocr_reader()
        results = reader.readtext(file_path, detail=0, paragraph=True)
        return "\n".join([r.strip() for r in results if isinstance(r, str) and r.strip()])

    @staticmethod
    def extract_from_document(doc: Document) -> dict:
        try:
            extracted_text = ExtractionService.extract_text_from_file(doc.file_path)
            
            prompt = (
                "Extract ALL information from the following bill or receipt (plain text content) and return ONLY valid JSON with the following structure:\n"
                "{\n"
                '  "bill_id": "string (unique identifier for bill)",\n'
                '  "bill_type": "string (e.g., Product Invoice, Service Invoice)",\n'
                '  "invoice_number": "string",\n'
                '  "order_id": "string (if applicable)",\n'
                '  "order_date": "YYYY-MM-DD",\n'
                '  "invoice_date": "YYYY-MM-DD",\n'
                '  "due_date": "YYYY-MM-DD or null",\n'
                '  "payment_status": "string",\n'
                '  "customer": {"name": "string", "address": "string"},\n'
                '  "seller": {"name": "string", "gstin": "string (if available)", "address": "string"},\n'
                '  "items": [{\n'
                '    "item_name": "string",\n'
                '    "hsn_sac": "string",\n'
                '    "quantity": number,\n'
                '    "gross_amount": number,\n'
                '    "discount": number,\n'
                '    "taxable_value": number,\n'
                '    "cgst": number,\n'
                '    "sgst": number,\n'
                '    "igst": number,\n'
                '    "total_amount": number\n'
                '  }],\n'
                '  "summary": {\n'
                '    "subtotal": number,\n'
                '    "cgst_total": number,\n'
                '    "sgst_total": number,\n'
                '    "igst_total": number,\n'
                '    "total_tax": number,\n'
                '    "shipping_charges": number,\n'
                '    "grand_total": number\n'
                '  },\n'
                '  "extraction_metadata": {\n'
                '    "source": "string (e.g., Flipkart Invoice PDF)",\n'
                '    "extraction_method": "string",\n'
                '    "confidence_score": number (0 to 1),\n'
                '    "uploaded_by": "string",\n'
                '    "extraction_date": "YYYY-MM-DD"\n'
                '  }\n'
                "}\n\n"
                "Return ONLY valid JSON with all fields as shown above. NO markdown, NO extra text. Parse from TEXT:\n"
                f"'''{extracted_text}'''"
            )
            
            message = HumanMessage(content=prompt)
            response = llm.invoke([message])
            text = response.content.strip()
            
            # Clean up the response
            # Remove markdown code block markers if present
            if text.startswith("```json"):
                text = text[7:]
            elif text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            # Parse and validate JSON
            json_text = text.strip()
            extracted_data = json.loads(json_text)
            
            # Validate that it's a dictionary
            if not isinstance(extracted_data, dict):
                raise ValueError("Extracted data must be a dictionary")
            
            # Ensure required fields exist with proper types
            extracted_data.setdefault('items', [])
            extracted_data.setdefault('customer', {})
            extracted_data.setdefault('seller', {})
            extracted_data.setdefault('summary', {})
            extracted_data.setdefault('extraction_metadata', {
                'source': f"{doc.file_type.upper()} Document",
                'extraction_method': "OCR + LLM",
                'confidence_score': 0.8,
                'uploaded_by': "System",
                'extraction_date': datetime.utcnow().strftime('%Y-%m-%d')
            })
            
            # Ensure items is a list
            if not isinstance(extracted_data['items'], list):
                extracted_data['items'] = []
                
            return extracted_data
            
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse LLM response as JSON: {str(e)}")
        except Exception as e:
            raise RuntimeError(f"Error during extraction: {str(e)}")

    @classmethod
    def process_extraction(cls, doc: Document, db: Session) -> ExtractedData:
        # Extract data from document
        raw_extracted = cls.extract_from_document(doc)
        
        # Ensure raw_extracted is a dictionary
        if not isinstance(raw_extracted, dict):
            raise ValueError(f"Expected dictionary from extraction, got {type(raw_extracted)}")
        
        # Prepare the data for database
        extracted = {
            'document_id': doc.id,
            'bill_id': raw_extracted.get('bill_id'),
            'bill_type': raw_extracted.get('bill_type'),
            'invoice_number': raw_extracted.get('invoice_number'),
            'order_id': raw_extracted.get('order_id'),
            'order_date': raw_extracted.get('order_date'),
            'invoice_date': raw_extracted.get('invoice_date'),
            'due_date': raw_extracted.get('due_date'),
            'payment_status': raw_extracted.get('payment_status'),
            
            # Store nested objects as JSON, ensure they're dicts/lists
            'customer': raw_extracted.get('customer', {}),
            'seller': raw_extracted.get('seller', {}),
            'items': raw_extracted.get('items', []),
            'summary': raw_extracted.get('summary', {}),
            'extraction_metadata': raw_extracted.get('extraction_metadata', {})
        }
        
        # Type validation and conversion
        if not isinstance(extracted['items'], list):
            extracted['items'] = []
        if not isinstance(extracted['customer'], dict):
            extracted['customer'] = {}
        if not isinstance(extracted['seller'], dict):
            extracted['seller'] = {}
        if not isinstance(extracted['summary'], dict):
            extracted['summary'] = {}
        if not isinstance(extracted['extraction_metadata'], dict):
            extracted['extraction_metadata'] = {}
        
        # Create and save the object
        try:
            data_obj = ExtractedData(**extracted)
            db.add(data_obj)
            db.commit()
            db.refresh(data_obj)
            return data_obj
        except Exception as e:
            db.rollback()
            raise ValueError(f"Failed to save extracted data: {str(e)}")
