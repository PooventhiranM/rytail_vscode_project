from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import AllocationRun, ReplenishmentRun, TransferRun, RunStatusEnum

router = APIRouter(prefix="/approvals", tags=["Approvals Queue"])

@router.get("/pending")
def get_pending_approvals(db: Session = Depends(get_db)):
    alloc = db.query(AllocationRun).filter(AllocationRun.status == RunStatusEnum.DRAFT.value).all()
    repl = db.query(ReplenishmentRun).filter(ReplenishmentRun.status == RunStatusEnum.DRAFT.value).all()
    trf = db.query(TransferRun).filter(TransferRun.status == RunStatusEnum.DRAFT.value).all()
    
    items = []
    for a in alloc:
        items.append({
            "run_id": a.run_id, "type": "FIRST_ALLOCATION", "target": a.target_sku,
            "units": a.total_allocated_units, "created_at": a.created_at, "requested_by": a.run_by_user
        })
    for r in repl:
        items.append({
            "run_id": r.run_id, "type": "REPLENISHMENT", "target": "Network Stores",
            "units": r.total_recommended_units, "created_at": r.created_at, "requested_by": r.run_by_user
        })
    for t in trf:
        items.append({
            "run_id": t.run_id, "type": "STORE_TRANSFER", "target": "Network Balancing",
            "units": t.total_transfer_units, "created_at": t.created_at, "requested_by": t.run_by_user
        })
        
    return {"pending_count": len(items), "items": items}
