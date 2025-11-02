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
        data_dict = {
            "bill_id": extracted_data.bill_id,
            "bill_type": extracted_data.bill_type,
            "invoice_number": extracted_data.invoice_number,
            "order_id": extracted_data.order_id,
            "order_date": extracted_data.order_date,
            "invoice_date": extracted_data.invoice_date,
            "due_date": extracted_data.due_date,
            "payment_status": extracted_data.payment_status,
            "customer": extracted_data.customer,
            "seller": extracted_data.seller,
            "items": extracted_data.items,
            "summary": extracted_data.summary,
            "extraction_metadata": extracted_data.extraction_metadata
        }
        
        # Handle JSON fields that might be stored as strings
        for field in ['customer', 'seller', 'items', 'summary', 'extraction_metadata']:
            if isinstance(data_dict[field], str):
                try:
                    data_dict[field] = json.loads(data_dict[field])
                except:
                    data_dict[field] = None
        
        # Format as readable text
        context_parts = ["Document Information:\n"]
        
        # Basic bill information
        if data_dict.get("bill_id"):
            context_parts.append(f"Bill ID: {data_dict['bill_id']}")
        if data_dict.get("bill_type"):
            context_parts.append(f"Bill Type: {data_dict['bill_type']}")
        if data_dict.get("invoice_number"):
            context_parts.append(f"Invoice Number: {data_dict['invoice_number']}")
        if data_dict.get("order_id"):
            context_parts.append(f"Order ID: {data_dict['order_id']}")
        if data_dict.get("order_date"):
            context_parts.append(f"Order Date: {data_dict['order_date']}")
        if data_dict.get("invoice_date"):
            context_parts.append(f"Invoice Date: {data_dict['invoice_date']}")
        if data_dict.get("due_date"):
            context_parts.append(f"Due Date: {data_dict['due_date']}")
        if data_dict.get("payment_status"):
            context_parts.append(f"Payment Status: {data_dict['payment_status']}")
        
        # Customer information
        customer = data_dict.get("customer", {})
        if customer:
            context_parts.append("\nCustomer Information:")
            if customer.get("name"):
                context_parts.append(f"Name: {customer['name']}")
            if customer.get("address"):
                context_parts.append(f"Address: {customer['address']}")
        
        # Seller information
        seller = data_dict.get("seller", {})
        if seller:
            context_parts.append("\nSeller Information:")
            if seller.get("name"):
                context_parts.append(f"Name: {seller['name']}")
            if seller.get("gstin"):
                context_parts.append(f"GSTIN: {seller['gstin']}")
            if seller.get("address"):
                context_parts.append(f"Address: {seller['address']}")
        
        # Items
        items = data_dict.get("items", [])
        if items:
            context_parts.append("\nItems:")
            for idx, item in enumerate(items, 1):
                if isinstance(item, dict):
                    context_parts.append(f"  {idx}. {item.get('item_name', 'N/A')}")
                    context_parts.append(f"     HSN/SAC: {item.get('hsn_sac', 'N/A')}")
                    context_parts.append(f"     Quantity: {item.get('quantity', 'N/A')}")
                    context_parts.append(f"     Gross Amount: ₹{item.get('gross_amount', 'N/A')}")
                    if item.get('discount'):
                        context_parts.append(f"     Discount: ₹{item.get('discount')}")
                    context_parts.append(f"     Taxable Value: ₹{item.get('taxable_value', 'N/A')}")
                    context_parts.append(f"     CGST: ₹{item.get('cgst', 'N/A')}")
                    context_parts.append(f"     SGST: ₹{item.get('sgst', 'N/A')}")
                    context_parts.append(f"     IGST: ₹{item.get('igst', 'N/A')}")
                    context_parts.append(f"     Total Amount: ₹{item.get('total_amount', 'N/A')}\n")
        
        # Summary
        summary = data_dict.get("summary", {})
        if summary:
            context_parts.append("\nBill Summary:")
            context_parts.append(f"Subtotal: ₹{summary.get('subtotal', 'N/A')}")
            if summary.get('cgst_total'):
                context_parts.append(f"CGST Total: ₹{summary['cgst_total']}")
            if summary.get('sgst_total'):
                context_parts.append(f"SGST Total: ₹{summary['sgst_total']}")
            if summary.get('igst_total'):
                context_parts.append(f"IGST Total: ₹{summary['igst_total']}")
            context_parts.append(f"Total Tax: ₹{summary.get('total_tax', 'N/A')}")
            if summary.get('shipping_charges'):
                context_parts.append(f"Shipping Charges: ₹{summary['shipping_charges']}")
            context_parts.append(f"Grand Total: ₹{summary.get('grand_total', 'N/A')}")
        
        # Metadata
        extraction_metadata = data_dict.get("extraction_metadata", {})
        if extraction_metadata:
            context_parts.append("\nMetadata:")
            if extraction_metadata.get("source"):
                context_parts.append(f"Source: {extraction_metadata['source']}")
            if extraction_metadata.get("extraction_method"):
                context_parts.append(f"Extraction Method: {extraction_metadata['extraction_method']}")
            if extraction_metadata.get("confidence_score") is not None:
                context_parts.append(f"Confidence Score: {extraction_metadata['confidence_score']:.2f}")
            if extraction_metadata.get("uploaded_by"):
                context_parts.append(f"Uploaded By: {extraction_metadata['uploaded_by']}")
            if extraction_metadata.get("extraction_date"):
                context_parts.append(f"Extraction Date: {extraction_metadata['extraction_date']}")
        
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

