"""Short link sharing endpoints — now persisted via SQLite."""

import random
import string
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.database import db_service

router = APIRouter(prefix="/share", tags=["share"])


def _generate_id(length: int = 6) -> str:
    """Generate a short alphanumeric ID."""
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


class ShareCreateRequest(BaseModel):
    result: dict[str, Any]


@router.post("")
async def create_share(req: ShareCreateRequest):
    """Save a simulation result and return a short share ID."""
    sid = _generate_id()
    await db_service.save_share(sid, req.result)
    return {"success": True, "id": sid}


@router.get("/{share_id}")
async def get_share(share_id: str):
    """Retrieve a shared simulation result by its short ID."""
    result = await db_service.get_share(share_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Share link not found or expired.")
    return {"success": True, "result": result}
