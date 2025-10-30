from pydantic import BaseModel


class UserBase(BaseModel):
    first_name: str
    last_name: str
    email_id: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email_id: str
    password: str


class LoginRequest(BaseModel):
    email_id: str
    password: str


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"