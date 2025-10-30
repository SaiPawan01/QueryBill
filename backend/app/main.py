from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.models.user import User
from app.auth.routes import router as auth_router


# FastAPI app instance
app = FastAPI()


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # domains that can access the backend
    allow_credentials=True,         # allow cookies / tokens
    allow_methods=["*"],            # allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],            # allow all request headers
)


# creates all table in db
Base.metadata.create_all(bind=engine)

# Root route
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}


# Routers
app.include_router(auth_router)