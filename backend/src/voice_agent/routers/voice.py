import os
import uuid
from fastapi import APIRouter
from livekit import api

router = APIRouter(prefix="/api/voice", tags=["Voice Token"])

@router.post("/token")
def get_token():
    api_key = os.getenv("LIVEKIT_API_KEY", "devkey")
    api_secret = os.getenv("LIVEKIT_API_SECRET", "secret")
    livekit_url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")

    room_name = f"consult-{uuid.uuid4().hex[:8]}"
    identity = f"patient-{uuid.uuid4().hex[:6]}"

    token = (
        api.AccessToken(api_key, api_secret)
        .with_identity(identity)
        .with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True
        ))
        .to_jwt()
    )

    return {
        "token": token,
        "room": room_name,
        "url": livekit_url
    }
