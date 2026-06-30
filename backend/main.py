from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

app = FastAPI(title="TestMocker API")

@app.middleware("http")
async def limit_payload_size(request: Request, call_next):
    # Limit size to 5MB (5 * 1024 * 1024 bytes)
    MAX_SIZE = 5 * 1024 * 1024
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_SIZE:
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={"detail": "Payload too large"}
                )
        except ValueError:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Invalid Content-Length header"}
            )
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since Next handles cookies via its own API wrapper
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "TestMocker Backend API is running. Access the API docs at /docs",
        "frontend_url": "http://localhost:3000"
    }

# Connect to MongoDB
@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(settings.mongodb_url)
    app.mongodb = app.mongodb_client[settings.database_name]

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

from routes import auth, pdf, sessions, answers, hints, analysis

app.include_router(auth.router)
app.include_router(pdf.router)
app.include_router(sessions.router)
app.include_router(answers.router)
app.include_router(hints.router)
app.include_router(analysis.router)
