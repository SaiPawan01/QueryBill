import json
import os
from typing import List, Optional
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from app.models.extracted_data import ExtractedData
from app.models.chat_message import ChatMessage
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=GEMINI_API_KEY, temperature=0.7)


class ChatService:
    @staticmethod
    def get_extracted_data_for_document(db: Session, document_id: int) -> ExtractedData | None:
        """Retrieve extracted data for a document."""
        return db.query(ExtractedData).filter(ExtractedData.document_id == document_id).first()
    
    @staticmethod
    def format_extracted_data_for_context(extracted_data: ExtractedData | None) -> str:
        """Format extracted data as a readable context string for the AI."""
        if not extracted_data:
            return "No extracted data available for this document yet."
        
        # Convert SQLAlchemy model to dict, handling JSON fields
        # Handle line_items which might be stored as JSON string or already parsed
        line_items = []
        if extracted_data.line_items:
            if isinstance(extracted_data.line_items, (list, dict)):
                line_items = extracted_data.line_items if isinstance(extracted_data.line_items, list) else [extracted_data.line_items]
            elif isinstance(extracted_data.line_items, str):
                try:
                    parsed = json.loads(extracted_data.line_items)
                    line_items = parsed if isinstance(parsed, list) else [parsed]
                except:
                    line_items = []
        
        data_dict = {
            "vendor_name": extracted_data.vendor_name,
            "customer_name": extracted_data.customer_name,
            "account_number": extracted_data.account_number,
            "receipt_number": extracted_data.receipt_number,
            "transaction_id": extracted_data.transaction_id,
            "transaction_date": extracted_data.transaction_date,
            "amount": extracted_data.amount,
            "currency": extracted_data.currency,
            "payment_status": extracted_data.payment_status,
            "payment_method": extracted_data.payment_method,
            "linked_bill_number": extracted_data.linked_bill_number,
            "billing_period_start": extracted_data.billing_period_start,
            "billing_period_end": extracted_data.billing_period_end,
            "tax_amount": extracted_data.tax_amount,
            "other_charges": extracted_data.other_charges,
            "total_amount": extracted_data.total_amount,
            "generated_at": extracted_data.generated_at,
            "remarks": extracted_data.remarks,
            "line_items": line_items
        }
        
        # Format as readable text
        context_parts = ["Document Information:\n"]
        
        if data_dict.get("vendor_name"):
            context_parts.append(f"Vendor: {data_dict['vendor_name']}")
        if data_dict.get("customer_name"):
            context_parts.append(f"Customer: {data_dict['customer_name']}")
        if data_dict.get("account_number"):
            context_parts.append(f"Account Number: {data_dict['account_number']}")
        if data_dict.get("receipt_number"):
            context_parts.append(f"Receipt Number: {data_dict['receipt_number']}")
        if data_dict.get("transaction_id"):
            context_parts.append(f"Transaction ID: {data_dict['transaction_id']}")
        if data_dict.get("transaction_date"):
            context_parts.append(f"Transaction Date: {data_dict['transaction_date']}")
        if data_dict.get("amount") is not None:
            context_parts.append(f"Amount: {data_dict['amount']} {data_dict.get('currency', '')}")
        if data_dict.get("payment_status"):
            context_parts.append(f"Payment Status: {data_dict['payment_status']}")
        if data_dict.get("payment_method"):
            context_parts.append(f"Payment Method: {data_dict['payment_method']}")
        if data_dict.get("linked_bill_number"):
            context_parts.append(f"Linked Bill Number: {data_dict['linked_bill_number']}")
        if data_dict.get("billing_period_start"):
            context_parts.append(f"Billing Period: {data_dict['billing_period_start']} to {data_dict.get('billing_period_end', 'N/A')}")
        if data_dict.get("tax_amount") is not None:
            context_parts.append(f"Tax: {data_dict['tax_amount']}")
        if data_dict.get("other_charges") is not None:
            context_parts.append(f"Other Charges: {data_dict['other_charges']}")
        if data_dict.get("total_amount") is not None:
            context_parts.append(f"Total Amount: {data_dict['total_amount']} {data_dict.get('currency', '')}")
        if data_dict.get("remarks"):
            context_parts.append(f"Remarks: {data_dict['remarks']}")
        
        # Format line items
        line_items = data_dict.get("line_items", [])
        if line_items:
            context_parts.append("\nLine Items:")
            if isinstance(line_items, list):
                for idx, item in enumerate(line_items, 1):
                    if isinstance(item, dict):
                        desc = item.get("description", "N/A")
                        qty = item.get("quantity", "N/A")
                        rate = item.get("unit_rate", "N/A")
                        amount = item.get("amount", "N/A")
                        context_parts.append(f"  {idx}. {desc} - Qty: {qty}, Rate: {rate}, Amount: {amount}")
        
        return "\n".join(context_parts)
    
    @staticmethod
    def generate_response(
        user_question: str, 
        extracted_data: ExtractedData | None, 
        conversation_history: Optional[List[ChatMessage]] = None,
        db: Session | None = None
    ) -> str:
        """Generate AI response to user question based on extracted data and conversation history."""
        context = ChatService.format_extracted_data_for_context(extracted_data)
        
        system_prompt = (
            "You are a helpful assistant that answers questions about utility bills and receipts. "
            "You have access to extracted data from a document. Answer questions accurately based on this data. "
            "You also have access to previous conversation history, so you can understand references to earlier "
            "questions and answers (e.g., 'them', 'that', 'the vendor I asked about'). "
            "If the information is not available in the data or conversation history, say so clearly. "
            "Be concise and friendly in your responses."
        )
        
        # Build message history
        messages = [SystemMessage(content=system_prompt)]
        
        # Add conversation history if available
        if conversation_history:
            for chat_msg in conversation_history:
                # Add user message
                messages.append(HumanMessage(content=chat_msg.message))
                # Add AI response
                messages.append(AIMessage(content=chat_msg.response))
        
        # Add document context as a human message for clarity
        context_message = (
            f"Document Information:\n{context}\n\n"
            "Use this document information and the conversation history above to answer the following question."
        )
        messages.append(HumanMessage(content=context_message))
        
        # Add current user question
        messages.append(HumanMessage(content=user_question))
        
        try:
            response = llm.invoke(messages)
            return response.content.strip()
        except Exception as e:
            return f"I apologize, but I encountered an error while processing your question: {str(e)}. Please try again."

