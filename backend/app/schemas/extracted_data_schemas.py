from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class Item(BaseModel):
    item_name: str
    hsn_sac: Optional[str]
    quantity: float
    gross_amount: float
    discount: Optional[float]
    taxable_value: float
    cgst: Optional[float]
    sgst: Optional[float]
    igst: Optional[float]
    total_amount: float

class BillingPeriod(BaseModel):
    start_date: Optional[str]
    end_date: Optional[str]

class Customer(BaseModel):
    name: str
    address: str

class Seller(BaseModel):
    name: str
    gstin: Optional[str]
    address: str

class Summary(BaseModel):
    subtotal: float
    cgst_total: Optional[float]
    sgst_total: Optional[float]
    igst_total: Optional[float]
    total_tax: float
    shipping_charges: Optional[float]
    grand_total: float

class Metadata(BaseModel):
    source: str
    extraction_method: str
    confidence_score: float
    uploaded_by: str
    extraction_date: str

class ExtractedDataBase(BaseModel):
    bill_id: Optional[str] = None
    bill_type: Optional[str] = None
    invoice_number: Optional[str] = None
    order_id: Optional[str] = None
    order_date: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    payment_status: Optional[str] = None
    customer: Optional[dict] = None
    seller: Optional[dict] = None
    items: Optional[List[dict]] = None
    summary: Optional[dict] = None
    extraction_metadata: Optional[dict] = None

class ExtractedDataOut(ExtractedDataBase):
    id: int
    document_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat() if dt else None
        }

    class Config:
        from_attributes = True