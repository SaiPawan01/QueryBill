from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.database import get_db
from app.models.chat_message import ChatMessage
from app.models.document import Document
from app.schemas.chat_schemas import ChatMessageCreate, ChatMessageResponse, ChatHistoryResponse, ChatResponse
from app.auth.routes import get_current_user
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/{document_id}/message", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    document_id: int,
    message_data: ChatMessageCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get AI response. Store in chat history."""
    # Verify document exists and belongs to user
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or you don't have access to it"
        )
    
    # Get extracted data for the document
    extracted_data = ChatService.get_extracted_data_for_document(db, document_id)
    
    # Get previous conversation history (ordered chronologically, oldest first)
    # Limit to last 20 messages to avoid token limits while maintaining context
    # Get most recent messages first, then reverse to chronological order
    recent_messages = db.query(ChatMessage).filter(
        ChatMessage.document_id == document_id,
        ChatMessage.user_id == current_user.id
    ).order_by(desc(ChatMessage.created_at)).limit(20).all()
    
    # Reverse to get chronological order (oldest to newest)
    conversation_history = list(reversed(recent_messages))
    
    # Generate AI response with conversation context
    ai_response = ChatService.generate_response(
        user_question=message_data.message,
        extracted_data=extracted_data,
        conversation_history=conversation_history if conversation_history else None,
        db=db
    )
    
    # Store message and response in database
    chat_message = ChatMessage(
        document_id=document_id,
        user_id=current_user.id,
        message=message_data.message,
        response=ai_response
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    
    return ChatResponse(
        response=ai_response,
        message_id=chat_message.id
    )


@router.get("/{document_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    document_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for a specific document."""
    # Verify document exists and belongs to user
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or you don't have access to it"
        )
    
    # Get all chat messages for this document, ordered by created_at descending
    messages = db.query(ChatMessage).filter(
        ChatMessage.document_id == document_id,
        ChatMessage.user_id == current_user.id
    ).order_by(desc(ChatMessage.created_at)).all()
    
    return ChatHistoryResponse(
        messages=[ChatMessageResponse.model_validate(msg) for msg in messages],
        total=len(messages)
    )

