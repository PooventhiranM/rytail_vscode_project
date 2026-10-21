import hashlib
import json
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.db.models import IdempotencyKey
from fastapi import HTTPException

def generate_request_hash(payload: Any) -> str:
    """Computes SHA-256 hash of canonicalized JSON request payload."""
    try:
        if isinstance(payload, bytes):
            return hashlib.sha256(payload).hexdigest()
        serialized = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    except Exception:
        return hashlib.sha256(str(payload).encode("utf-8")).hexdigest()

def check_idempotency(
    db: Session,
    key: str,
    endpoint: str,
    request_payload: Any
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Checks if idempotency key has been executed.
    Returns:
      (is_cached, cached_response)
    Raises 409 if key is currently IN_PROGRESS or reused with a different payload.
    """
    req_hash = generate_request_hash(request_payload)
    existing = db.query(IdempotencyKey).filter(
        IdempotencyKey.key == key,
        IdempotencyKey.endpoint == endpoint
    ).first()

    if not existing:
        # Register new key in IN_PROGRESS state
        new_entry = IdempotencyKey(
            key=key,
            endpoint=endpoint,
            request_hash=req_hash,
            status="IN_PROGRESS"
        )
        db.add(new_entry)
        db.commit()
        return False, None

    if existing.request_hash != req_hash:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "IDEMPOTENCY_KEY_REUSED",
                "message": "Idempotency key was reused with a different request payload."
            }
        )

    if existing.status == "IN_PROGRESS":
        raise HTTPException(
            status_code=409,
            detail={
                "code": "IDEMPOTENCY_IN_PROGRESS",
                "message": "A request with this idempotency key is currently processing. Retry shortly."
            }
        )

    return True, existing.response_json

def commit_idempotency(
    db: Session,
    key: str,
    endpoint: str,
    response_payload: Any,
    status: str = "COMPLETED"
):
    """Stores the response payload for a completed idempotent operation."""
    entry = db.query(IdempotencyKey).filter(
        IdempotencyKey.key == key,
        IdempotencyKey.endpoint == endpoint
    ).first()

    if entry:
        entry.response_json = response_payload
        entry.status = status
        db.commit()
