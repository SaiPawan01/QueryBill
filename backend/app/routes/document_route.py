import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.models.document import Document
from app.auth.routes import get_current_user
from app.database import get_db



router = APIRouter(prefix="/documents",tags=["Document"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)



def validate_file(file: UploadFile):
    ext = Path(file.filename).suffix.lower()
    allowed = {".pdf", ".jpg", ".jpeg", ".png"}
    mime_allowed = {"application/pdf", "image/jpeg", "image/png"}
    
    if ext not in allowed:
        return False, "Invalid file type"
    if file.content_type not in mime_allowed:
        return False, "Invalid MIME type"
    return True, None



@router.post("/upload")
async def upload(file: UploadFile = File(...), user = Depends(get_current_user), db: Session = Depends(get_db)):
    valid, error = validate_file(file)
    if not valid:
        raise HTTPException(status_code=400, detail=error)
    
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    
    ext = Path(file.filename).suffix.lower()
    filename = f"{Path(file.filename).stem}_{uuid.uuid4()}_{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    doc = Document(
        user_id=user.id,
        filename=filename,
        original_filename=file.filename,
        file_path=filepath,
        file_size=len(content),
        file_type="pdf" if ext == ".pdf" else "image"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return {"id": doc.id, "filename": doc.filename, "size": doc.file_size}



@router.get("/list")
async def list_docs(user = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id == user.id).all()
    return [{"id": d.id, "name": d.original_filename, "size": d.file_size} for d in docs]

@router.get("/{doc_id}")
async def get_doc(doc_id: int, user = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404)
    return FileResponse(doc.file_path, filename=doc.original_filename)



@router.delete("/{doc_id}")
async def delete_doc(doc_id: int, user = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404)
    
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"message": "Deleted"}