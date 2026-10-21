from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import random

from app.db.database import get_db
from app.db.models import TransferRun, TransferRecommendation, Inventory, Store, RunStatusEnum
from app.schemas import TransferRunRequest, TransferRunResponse, TransferRecommendationOut
from app.engines.store_transfer import run_store_transfers
from app.services.audit_service import log_action

router = APIRouter(prefix="/transfers", tags=["Store Transfer Engine"])

@router.post("/run", response_model=TransferRunResponse)
def execute_store_transfers_run(req: TransferRunRequest, db: Session = Depends(get_db)):
    """
    Identifies inventory imbalances across stores and recommends Store-to-Store transfers.
    """
    store_invs = db.query(Inventory).filter(Inventory.location_type == "STORE").all()
    stores = {s.store_code: s for s in db.query(Store).all()}
    
    inv_input = []
    for idx, item in enumerate(store_invs):
        s_obj = stores.get(item.location_code)
        inv_input.append({
            "store_code": item.location_code,
            "sku": item.sku,
            "size_code": item.size_code,
            "available_stock": 25 if idx % 5 == 0 else (0 if idx % 3 == 0 else 5), # Excess at idx % 5, stockout at idx % 3
            "target_stock": 8,
            "average_daily_sales": 0.2 if idx % 5 == 0 else 2.5,
            "region": s_obj.region if s_obj else "North"
        })
        
    recs = run_store_transfers(
        inv_input,
        donor_wos_threshold=req.donor_wos_threshold,
        receiver_wos_threshold=req.receiver_wos_threshold
    )
    
    run_id = f"TRF-{datetime.utcnow().strftime('%Y%m%d')}-{random.randint(100, 999)}"
    total_units = sum(r["transfer_qty"] for r in recs)
    
    run = TransferRun(
        run_id=run_id,
        status=RunStatusEnum.DRAFT.value,
        total_transfer_units=total_units,
        recommendation_count=len(recs),
        run_by_user="planner"
    )
    db.add(run)
    db.commit()

    recs_out = []
    for r in recs:
        db_rec = TransferRecommendation(
            run_id=run_id,
            donor_store_code=r["donor_store_code"],
            receiver_store_code=r["receiver_store_code"],
            sku=r["sku"],
            size_code=r["size_code"],
            donor_current_stock=r["donor_current_stock"],
            donor_wos=r["donor_wos"],
            receiver_current_stock=r["receiver_current_stock"],
            receiver_wos=r["receiver_wos"],
            receiver_demand_qty=r["receiver_demand_qty"],
            transfer_qty=r["transfer_qty"],
            transfer_score=r["transfer_score"],
            distance_km=r["distance_km"],
            reason=r["reason"]
        )
        db.add(db_rec)
        recs_out.append(TransferRecommendationOut(**r))

    db.commit()
    log_action(db, "planner", "CREATED_TRANSFER_RUN", run_id=run_id)

    return TransferRunResponse(
        run_id=run_id,
        status=run.status,
        total_transfer_units=total_units,
        recommendation_count=len(recs),
        created_at=datetime.utcnow(),
        recommendations=recs_out
    )

@router.get("/{run_id}", response_model=TransferRunResponse)
def get_transfer_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(TransferRun).filter(TransferRun.run_id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Transfer run not found.")
    recs = db.query(TransferRecommendation).filter(TransferRecommendation.run_id == run_id).all()
    
    return TransferRunResponse(
        run_id=run.run_id,
        status=run.status,
        total_transfer_units=run.total_transfer_units,
        recommendation_count=run.recommendation_count,
        created_at=run.created_at,
        recommendations=[
            TransferRecommendationOut(
                donor_store_code=r.donor_store_code, receiver_store_code=r.receiver_store_code,
                sku=r.sku, size_code=r.size_code, donor_current_stock=r.donor_current_stock,
                donor_wos=r.donor_wos, receiver_current_stock=r.receiver_current_stock,
                receiver_wos=r.receiver_wos, receiver_demand_qty=r.receiver_demand_qty,
                transfer_qty=r.transfer_qty, transfer_score=r.transfer_score,
                distance_km=r.distance_km, reason=r.reason
            )
            for r in recs
        ]
    )

@router.post("/{run_id}/approve")
def approve_transfer_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(TransferRun).filter(TransferRun.run_id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")
    run.status = RunStatusEnum.APPROVED.value
    db.commit()
    log_action(db, "planner", "APPROVED_TRANSFER_RUN", run_id=run_id)
    return {"message": f"Transfer run '{run_id}' approved successfully."}
