from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.auth.routes import router as auth_router
from app.routes.document_route import router as document_route
from app.routes.extract_document_router import router


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





# Routers
app.include_router(auth_router)
app.include_router(document_route)
app.include_router(router)


# Root route
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}