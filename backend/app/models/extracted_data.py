from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class ExtractedData(Base):
    __tablename__ = "extracted_data"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    bill_id = Column(String)
    bill_type = Column(String)
    invoice_number = Column(String)
    order_id = Column(String)
    order_date = Column(String)
    invoice_date = Column(String)
    due_date = Column(String)
    payment_status = Column(String)
    
    # Customer details
    customer = Column(JSON)  # {name, address}
    
    # Seller details
    seller = Column(JSON)  # {name, gstin, address}
    
    # Items and summary
    items = Column(JSON)  # List of items with details
    summary = Column(JSON)  # Totals and tax details
    
    # Metadata
    extraction_metadata = Column(JSON)  # {source, extraction_method, confidence_score, uploaded_by, extraction_date}
    
    # System timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="extractions")