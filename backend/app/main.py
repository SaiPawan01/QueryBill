import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.auth.routes import router as auth_router
from app.routes.document_route import router as document_route
from app.routes.extract_document_router import router
from app.routes.chat_route import router as chat_router


# FastAPI app instance
app = FastAPI()

# CORS configuration for development
# Check if we're in development mode (allow all localhost origins)
# In production, set specific origins via environment variable
is_development = os.getenv("ENVIRONMENT", "development").lower() == "development"

if is_development:
    # In development: allow all localhost origins (common ports)
    # Note: Using ["*"] requires allow_credentials=False
    # For Bearer token auth, credentials flag is not strictly needed
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],          # Allow all origins in development
        allow_credentials=False,      # Required when using ["*"] - Bearer tokens work fine without this
        allow_methods=["*"],          # Allow all HTTP methods
        allow_headers=["*"],          # Allow all request headers
    )
else:
    # In production: use specific origins
    origins = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []
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
app.include_router(router)
app.include_router(chat_router)


# Root route
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}