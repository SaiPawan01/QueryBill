from pydantic import BaseModel
from datetime import datetime


class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    document_id: int
    user_id: int
    message: str
    response: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
    total: int


class ChatResponse(BaseModel):
    response: str
    message_id: int

