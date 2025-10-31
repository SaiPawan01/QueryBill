from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    original_filename = Column(String)
    file_path = Column(String, unique=True)
    file_size = Column(Integer)
    file_type = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    extractions = relationship("ExtractedData", back_populates="document", cascade="all, delete-orphan")