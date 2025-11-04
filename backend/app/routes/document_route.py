import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.models.document import Document
from app.auth.routes import get_current_user
from app.database import get_db
from sqlalchemy import text



router = APIRouter(prefix="/documents",tags=["Document"])
# Use absolute path relative to backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)



def validate_file(file: UploadFile):
    if not file.filename:
        return False, "Filename is required"
    ext = Path(file.filename).suffix.lower()
    allowed = {".pdf", ".jpg", ".jpeg", ".png"}
    mime_allowed = {"application/pdf", "image/jpeg","image/jpg","image/png"}
    
    if ext not in allowed:
        return False, "Invalid file type"
    if file.content_type not in mime_allowed:
        return False, "Invalid MIME type"
    return True, None




@router.post("/upload")
async def upload(file: UploadFile = File(...), user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Upload a document (PDF or image) for the authenticated user."""
    valid, error = validate_file(file)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 50MB limit. Please upload a smaller file."
        )
    
    ext = Path(file.filename).suffix.lower()
    filename = f"{Path(file.filename).stem}_{uuid.uuid4()}{ext}"
    filepath = str(UPLOAD_DIR / filename)
    
    try:
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
    except Exception as e:
        # Clean up file if database operation fails
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document. Please try again."
        )



@router.get("/list")
async def list_docs(
    q: Optional[str] = None,
    file_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
    user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get documents for the authenticated user with optional search and filters.

    Query params:
    - q: search term against original filename
    - file_type: 'pdf' or 'image'
    - status: 'active' or 'archived'
    - offset, limit: pagination
    """
    try:
        query = db.query(Document).filter(Document.user_id == user.id)
        if q:
            like = f"%{q.lower()}%"
            query = query.filter(Document.original_filename.ilike(like))
        if file_type:
            query = query.filter(Document.file_type == file_type)
        if status_filter:
            query = query.filter(Document.status == status_filter)
        docs = query.order_by(Document.uploaded_at.desc()).offset(offset).limit(limit).all()

        def to_dict(d: Document):
            # Get name without extension
            name_without_ext = os.path.splitext(d.original_filename)[0]
            return {
                "id": d.id,
                "name": name_without_ext,
                "filename": d.filename,
                "size": d.file_size,
                "file_type": d.file_type,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
                "status": d.status,
            }
        return [to_dict(d) for d in docs]
    except Exception as e:
        # Log full traceback to help debugging in development
        import traceback
        traceback.print_exc()
        # surface the original error message in the response for local debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve documents: {str(e)}"
        )

@router.get("/{doc_id}")
async def get_doc(doc_id: int, user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Download a specific document by ID."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or you don't have permission to access it."
        )
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found on server. It may have been deleted."
        )
    
    return FileResponse(doc.file_path, filename=doc.original_filename)



@router.delete("/{doc_id}")
async def delete_doc(doc_id: int, user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a document and its associated chat messages."""
    
    # First check if document exists and belongs to user
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Delete associated chat messages first
        db.execute(
            text("DELETE FROM chat_messages WHERE document_id = :doc_id"), 
            {"doc_id": doc_id}
        )
        
        # Delete the document from database
        db.delete(doc)
        
        # Try to delete the physical file
        if os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception as e:
                # Log file deletion error but continue with DB commit
                print(f"Error deleting file {doc.file_path}: {str(e)}")
        
        # Commit all changes
        db.commit()
        
        return {"message": "Document and associated data deleted successfully"}
        
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete document: {str(e)}"
        )


@router.post("/archive/{doc_id}")
async def archive_doc(doc_id: int, user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Archive a document (soft state change)."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        doc.status = "archived"
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return {"message": "Archived", "id": doc.id}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to archive document")


@router.post("/unarchive/{doc_id}")
async def unarchive_doc(doc_id: int, user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Unarchive a document (set status back to active)."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        doc.status = "active"
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return {"message": "Unarchived", "id": doc.id}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to unarchive document")