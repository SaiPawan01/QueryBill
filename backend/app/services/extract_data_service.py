import os
import json
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
    # Initialize EasyOCR reader once to avoid repeated model loads
    _easyocr_reader = easyocr.Reader(["en"], gpu=False)
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
        results = ExtractionService._easyocr_reader.readtext(file_path, detail=0, paragraph=True)
        return "\n".join([r.strip() for r in results if isinstance(r, str) and r.strip()])

    @staticmethod
    def extract_from_document(doc: Document) -> dict:
        extracted_text = ExtractionService.extract_text_from_file(doc.file_path)
        # print(extracted_text)
        prompt = (
            "Extract ALL information from the following bill or receipt (plain text content) and return ONLY valid JSON with the following keys: "
            "vendor_name, customer_name, account_number, receipt_number, transaction_id, transaction_date, amount, "
            "currency, payment_status, payment_method, linked_bill_number, billing_period_start, billing_period_end, "
            "line_items, tax_amount, other_charges, total_amount, generated_at, remarks. "
            "The 'line_items' key must be a list of objects with description, quantity, unit_rate, amount. "
            "NO extra text, NO markdown. TEXT:\n"
            f"'''{extracted_text}'''"
        )
        message = HumanMessage(content=prompt)
        response = llm.invoke([message])
        text = response.content.strip()
        # Remove markdown/codeblock if present
        if text.startswith("```"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        json_text = text.strip()
        try:
            print(json.loads(json_text))
            return json.loads(json_text)
        except Exception as e:
            raise RuntimeError(f"LLM did not return valid JSON: {text[:500]} ... Error: {e}")

    @classmethod
    def process_extraction(cls, doc: Document, db: Session) -> ExtractedData:
        extracted = cls.extract_from_document(doc)
        data_obj = ExtractedData(document_id=doc.id, **extracted)
        db.add(data_obj)
        db.commit()
        db.refresh(data_obj)
        return data_obj
