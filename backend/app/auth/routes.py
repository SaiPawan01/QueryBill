from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.models.user import User as UserModel
from app.schemas.user_schemas import UserCreate, UserOut, Token, LoginRequest, UserUpdate
from app.auth.security import hash_password, verify_password
from app.auth.jwt import create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES


router = APIRouter(prefix="/auth", tags=["Authentication"])
# tokenUrl should point to an endpoint that accepts OAuth2PasswordRequestForm (we expose /auth/token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def get_user_by_email(db: Session, email_id: str) -> UserModel | None:
    return db.query(UserModel).filter(UserModel.email_id == email_id).first()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserModel:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: subject missing")
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token error: {str(e)}")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    try:
        user = db.get(UserModel, int(user_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user id in token")

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED,summary="Register a New User")
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    """
       Allows a new user to register by providing their first name, last name, email, and password. 
       It checks if the email already exists, securely hashes the password, saves the user in the database, 
       and returns the user details (excluding the password).
    """
    existing = get_user_by_email(db, payload.email_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = UserModel(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email_id=payload.email_id,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token,summary="User Login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates a user using email and password and returns a JWT token."""
    user = get_user_by_email(db, payload.email_id)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    access_token = create_access_token({"sub": str(user.id)}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}



@router.post("/token", response_model=Token,summary="Generate OAuth2 Token")
def token(payload: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2-compatible token endpoint for Swagger / clients that submit form data."""
    user = get_user_by_email(db, payload.username)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    access_token = create_access_token({"sub": str(user.id)}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}



@router.get("/me", response_model=UserOut,summary="Get Current User")
def read_me(current_user: UserModel = Depends(get_current_user)):
    """Fetches the details of the currently authenticated user using the access token."""
    return current_user


@router.put("/me", response_model=UserOut,summary="Update Current User Details")
def update_me(payload: UserUpdate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates the currently logged-in user's profile details such as first name, last name, and email."""
    # If email change is requested, ensure it's not already taken
    if payload.email_id and payload.email_id != current_user.email_id:
        existing = get_user_by_email(db, payload.email_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")

    if payload.first_name is not None:
        current_user.first_name = payload.first_name
    if payload.last_name is not None:
        current_user.last_name = payload.last_name
    if payload.email_id is not None:
        current_user.email_id = payload.email_id

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


