"""Short link sharing endpoints."""

import random
import string
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/share", tags=["share"])

# In-memory store: { short_id: simulation_result_dict }
_share_store: dict[str, Any] = {}


def _generate_id(length: int = 6) -> str:
    """Generate a short alphanumeric ID."""
    chars = string.ascii_letters + string.digits
    while True:
        sid = "".join(random.choices(chars, k=length))
        if sid not in _share_store:
            return sid


class ShareCreateRequest(BaseModel):
    result: dict[str, Any]


@router.post("")
def create_share(req: ShareCreateRequest):
    """Save a simulation result and return a short share ID."""
    if len(_share_store) > 10_000:
        # Prune oldest 20% when store gets large
        keys = list(_share_store.keys())
        for k in keys[: len(keys) // 5]:
            del _share_store[k]

    sid = _generate_id()
    _share_store[sid] = req.result
    return {"success": True, "id": sid}


@router.get("/{share_id}")
def get_share(share_id: str):
    """Retrieve a shared simulation result by its short ID."""
    result = _share_store.get(share_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Share link not found or expired.")
    return {"success": True, "result": result}
