import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.auth.routes import router as auth_router
from app.routes.document_route import router as document_route
from app.routes.extract_document_router import router as extract_router
from app.routes.chat_route import router as chat_router


# FastAPI app instance
app = FastAPI()

# CORS configuration
# In development, we'll explicitly list localhost origins
origins = [
    "http://localhost:5173",    # Vite default
    "http://localhost:3000",    # Alternative React port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Add any production origins from environment variable
if os.getenv("CORS_ORIGINS"):
    origins.extend(os.getenv("CORS_ORIGINS").split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# creates all table in db
Base.metadata.create_all(bind=engine)





# Routers
app.include_router(auth_router)
app.include_router(document_route)
app.include_router(extract_router)
app.include_router(chat_router)


# Root route
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}