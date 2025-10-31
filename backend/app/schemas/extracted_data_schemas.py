from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LineItem(BaseModel):
    description: Optional[str]
    quantity: Optional[float]
    unit_rate: Optional[float]
    amount: Optional[float]

class ExtractedDataBase(BaseModel):
    vendor_name: Optional[str]
    customer_name: Optional[str]
    account_number: Optional[str]
    receipt_number: Optional[str]
    transaction_id: Optional[str]
    transaction_date: Optional[str]
    amount: Optional[float]
    currency: Optional[str] = "INR"
    payment_status: Optional[str]
    payment_method: Optional[str]
    linked_bill_number: Optional[str]
    billing_period_start: Optional[str]
    billing_period_end: Optional[str]
    line_items: Optional[List[LineItem]]
    tax_amount: Optional[float]
    other_charges: Optional[float]
    total_amount: Optional[float]
    generated_at: Optional[str]
    remarks: Optional[str]

class ExtractedDataOut(ExtractedDataBase):
    id: int
    document_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True