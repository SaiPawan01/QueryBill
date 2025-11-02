from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserBase(BaseModel):
    """Base user schema with common fields."""
    first_name: str = Field(..., min_length=1, max_length=100, description="User's first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User's last name")
    email_id: EmailStr = Field(..., description="User's email address")


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=6, description="User's password (min 6 characters)")


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Updated first name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Updated last name")
    email_id: Optional[EmailStr] = Field(None, description="Updated email address")


class LoginRequest(BaseModel):
    """Schema for user login."""
    email_id: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class UserOut(UserBase):
    """Schema for user response (excludes password)."""
    id: int
    class Config:
        # Allow reading ORM objects directly
        orm_mode = True


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")