import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .seed import seed_database
from .routers import booking, voice

app = FastAPI(
    title="Hospital Voice Agent API Engine",
    description="FastAPI Backend for LiveKit bilingual voice assistant and appointment booking",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    seed_database()

app.include_router(booking.router)
app.include_router(voice.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Voice Agent FastAPI Engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.src.voice_agent.main:app", host="0.0.0.0", port=8000, reload=True)
