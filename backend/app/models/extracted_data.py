from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class ExtractedData(Base):
    __tablename__ = "extracted_data"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    vendor_name = Column(String)
    customer_name = Column(String)
    account_number = Column(String)
    receipt_number = Column(String)
    transaction_id = Column(String)
    transaction_date = Column(String)
    amount = Column(Float)
    currency = Column(String)
    payment_status = Column(String)
    payment_method = Column(String)
    linked_bill_number = Column(String)
    billing_period_start = Column(String)
    billing_period_end = Column(String)
    line_items = Column(JSON)
    tax_amount = Column(Float)
    other_charges = Column(Float)
    total_amount = Column(Float)
    generated_at = Column(String)
    remarks = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="extractions")