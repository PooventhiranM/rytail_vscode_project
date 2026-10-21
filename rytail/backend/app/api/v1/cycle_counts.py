import uuid
import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional

router = APIRouter(prefix="/cycle-counts", tags=["Physical Stock Counting"])

CYCLE_SESSIONS = [
    {
        "id": 1,
        "session_number": "CC-20261014-001",
        "store_code": "E0100",
        "location": "SALES_FLOOR",
        "status": "APPROVED",
        "created_by": "Floor Associate",
        "reviewed_by": "Store Manager",
        "notes": "Morning Tops Rack Cycle Count",
        "created_at": (datetime.datetime.utcnow() - datetime.timedelta(hours=4)).isoformat(),
        "lines": [
            {"id": 1, "sku": "EXFP00035WHITECAP GRAY", "product_name": "Men's Impression Polo - Half Sleeve", "system_qty": 3, "counted_qty": 3, "variance": 0, "notes": "Verified"},
            {"id": 2, "sku": "EXFP00031JET BLACK", "product_name": "Men's Impression Polo - Solid", "system_qty": 5, "counted_qty": 4, "variance": -1, "notes": "1 unit missing"}
        ]
    }
]

class CreateSessionRequest(BaseModel):
    store_code: str
    location: str
    notes: Optional[str] = "Routine Physical Cycle Count"

class RecordScanRequest(BaseModel):
    sku: str
    counted_qty: int = Field(ge=0)
    notes: Optional[str] = None

class ReviewSessionRequest(BaseModel):
    approve: bool
    notes: Optional[str] = None

@router.get("")
@router.get("/sessions")
def list_cycle_count_sessions(store_code: Optional[str] = None):
    if store_code:
        return [s for s in CYCLE_SESSIONS if s["store_code"] == store_code]
    return CYCLE_SESSIONS

@router.post("")
@router.post("/sessions")
def create_cycle_count_session(payload: CreateSessionRequest):
    session_num = f"CC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"
    new_sess = {
        "id": len(CYCLE_SESSIONS) + 1,
        "session_number": session_num,
        "store_code": payload.store_code,
        "location": payload.location,
        "status": "IN_PROGRESS",
        "created_by": "Store Associate",
        "reviewed_by": None,
        "notes": payload.notes,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "lines": []
    }
    CYCLE_SESSIONS.insert(0, new_sess)
    return new_sess

@router.post("/{session_id}/scan")
@router.post("/sessions/{session_id}/scan")
def record_count_scan(session_id: int, payload: RecordScanRequest):
    sess = next((s for s in CYCLE_SESSIONS if s["id"] == session_id), None)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if sess["status"] != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail=f"Cannot add items to session with status {sess['status']}")

    # Baseline system quantity simulation
    system_qty = 3 if "EXFP00035" in payload.sku else 5
    variance = payload.counted_qty - system_qty

    existing = next((l for l in sess["lines"] if l["sku"] == payload.sku), None)
    if existing:
        existing["counted_qty"] = payload.counted_qty
        existing["variance"] = variance
        existing["notes"] = payload.notes or existing["notes"]
    else:
        sess["lines"].append({
            "id": len(sess["lines"]) + 1,
            "sku": payload.sku,
            "product_name": "Men's Impression Polo - Half Sleeve",
            "system_qty": system_qty,
            "counted_qty": payload.counted_qty,
            "variance": variance,
            "notes": payload.notes
        })

    return sess

@router.post("/{session_id}/submit")
@router.post("/sessions/{session_id}/submit")
def submit_cycle_count(session_id: int):
    sess = next((s for s in CYCLE_SESSIONS if s["id"] == session_id), None)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    sess["status"] = "SUBMITTED"
    return {"success": True, "message": "Cycle count submitted for manager review", "session": sess}

@router.post("/{session_id}/review")
@router.post("/sessions/{session_id}/review")
def review_cycle_count(session_id: int, payload: ReviewSessionRequest):
    sess = next((s for s in CYCLE_SESSIONS if s["id"] == session_id), None)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if payload.approve:
        sess["status"] = "APPROVED"
        sess["reviewed_by"] = "Store Manager"
        tx_num = f"ADJ-{str(uuid.uuid4())[:6].upper()}"
        return {
            "success": True,
            "status": "APPROVED",
            "adjustment_transaction": tx_num,
            "message": f"Approved count adjustments. Transaction {tx_num} posted to inventory ledger."
        }
    else:
        sess["status"] = "REJECTED"
        sess["reviewed_by"] = "Store Manager"
        return {"success": True, "status": "REJECTED", "message": "Count session rejected."}
