from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import json
from app.database import get_db
from app.models.document import Document
from app.models.extracted_data import ExtractedData
from app.schemas.extracted_data_schemas import ExtractedDataOut
from app.services.extract_data_service import ExtractionService
from app.auth.routes import get_current_user

router = APIRouter(prefix="/document/extract", tags=["extract"])

@router.post("/{doc_id}", response_model=ExtractedDataOut)
def extract_sync(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # 1. Confirm document ownership
    doc = db.query(Document).filter(
        Document.id == doc_id, Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # 2. Existing extraction
    existing = db.query(ExtractedData).filter(ExtractedData.document_id == doc_id).first()
    if existing:
        return existing
    # 3. Process extraction
    try:
        data = ExtractionService.process_extraction(doc, db)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{doc_id}", response_model=ExtractedDataOut)
def get_extracted(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == doc_id, Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    data = db.query(ExtractedData).filter(ExtractedData.document_id == doc_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="Extraction not found")
    
    # Ensure JSON fields are properly parsed
    for field in ['customer', 'seller', 'items', 'summary', 'extraction_metadata']:
        value = getattr(data, field)
        if isinstance(value, str):
            try:
                setattr(data, field, json.loads(value))
            except:
                setattr(data, field, None)
    
    return data
