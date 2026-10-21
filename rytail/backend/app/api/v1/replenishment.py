from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import random

from app.db.database import get_db
from app.db.models import ReplenishmentRun, ReplenishmentResult, Inventory, Store, RunStatusEnum
from app.schemas import ReplenishmentRunRequest, ReplenishmentRunResponse, ReplenishmentResultOut
from app.engines.replenishment import run_replenishment
from app.services.audit_service import log_action
from app.services.idempotency import check_idempotency, commit_idempotency

router = APIRouter(prefix="/replenishment", tags=["Replenishment Engine"])

@router.post("/run", response_model=ReplenishmentRunResponse)
def execute_replenishment_run(
    req: ReplenishmentRunRequest,
    db: Session = Depends(get_db),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    """
    Executes Store x SKU x Size Replenishment optimization using current store inventory,
    average daily sales, lead time, review period, and safety stock.
    Supports Idempotency-Key header for duplicate execution prevention.
    """
    endpoint = "/api/v1/replenishment/run"
    if idempotency_key:
        is_cached, cached_data = check_idempotency(db, idempotency_key, endpoint, req.model_dump())
        if is_cached and cached_data:
            return ReplenishmentRunResponse(**cached_data)

    store_invs = db.query(Inventory).filter(Inventory.location_type == "STORE").all()
    
    inv_input = []
    for item in store_invs:
        # Zero-floor clamping on stock
        safe_stock = max(0, item.available_stock or 0)
        safe_transit = max(0, item.in_transit_stock or 0)
        inv_input.append({
            "store_code": item.location_code,
            "sku": item.sku,
            "size_code": item.size_code,
            "available_stock": safe_stock,
            "in_transit_stock": safe_transit,
            "average_daily_sales": 1.5 if safe_stock > 5 else 3.2,
            "store_capacity": 5000,
            "warehouse_avail": 1000,
            "is_active": True
        })
        
    repl_results = run_replenishment(
        inv_input,
        lead_time_days=req.lead_time_days,
        review_period_days=req.review_period_days,
        safety_stock_units=req.safety_stock_units
    )
    
    run_id = f"REP-{datetime.utcnow().strftime('%Y%m%d')}-{random.randint(100, 999)}"
    total_recommended = sum(r["recommended_qty"] for r in repl_results)
    critical_count = sum(1 for r in repl_results if r["priority_level"] == "Critical")
    high_count = sum(1 for r in repl_results if r["priority_level"] == "High")
    
    run = ReplenishmentRun(
        run_id=run_id,
        status=RunStatusEnum.DRAFT.value,
        total_recommended_units=total_recommended,
        total_recommended_value=total_recommended * 1299.0,
        critical_count=critical_count,
        high_count=high_count,
        input_snapshot=req.model_dump(),
        run_by_user="planner"
    )
    db.add(run)
    db.commit()

    results_out = []
    for r in repl_results:
        db_res = ReplenishmentResult(
            run_id=run_id,
            store_code=r["store_code"],
            sku=r["sku"],
            size_code=r["size_code"],
            current_stock=r["current_stock"],
            in_transit_stock=r["in_transit_stock"],
            average_daily_sales=r["average_daily_sales"],
            ros=r["ros"],
            wos=r["wos"],
            target_stock=r["target_stock"],
            raw_replenishment_qty=r["raw_replenishment_qty"],
            recommended_qty=r["recommended_qty"],
            priority_level=r["priority_level"],
            calculation_trace=r["calculation_trace"]
        )
        db.add(db_res)
        results_out.append(ReplenishmentResultOut(**r))

    db.commit()
    log_action(db, "planner", "CREATED_REPLENISHMENT_RUN", run_id=run_id)

    response_data = ReplenishmentRunResponse(
        run_id=run_id,
        status=run.status,
        total_recommended_units=total_recommended,
        total_recommended_value=total_recommended * 1299.0,
        critical_count=critical_count,
        high_count=high_count,
        created_at=datetime.utcnow(),
        results=results_out
    )

    if idempotency_key:
        commit_idempotency(db, idempotency_key, endpoint, response_data.model_dump(mode="json"))

    return response_data

@router.get("/{run_id}", response_model=ReplenishmentRunResponse)
def get_replenishment_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ReplenishmentRun).filter(ReplenishmentRun.run_id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=404,
            detail=f"Replenishment run '{run_id}' not found."
        )
    results = db.query(ReplenishmentResult).filter(ReplenishmentResult.run_id == run_id).all()
    
    return ReplenishmentRunResponse(
        run_id=run.run_id,
        status=run.status,
        total_recommended_units=run.total_recommended_units,
        total_recommended_value=run.total_recommended_value,
        critical_count=run.critical_count,
        high_count=run.high_count,
        created_at=run.created_at,
        results=[
            ReplenishmentResultOut(
                store_code=r.store_code, sku=r.sku, size_code=r.size_code, current_stock=r.current_stock,
                in_transit_stock=r.in_transit_stock, average_daily_sales=r.average_daily_sales, ros=r.ros,
                wos=r.wos, target_stock=r.target_stock, raw_replenishment_qty=r.raw_replenishment_qty,
                recommended_qty=r.recommended_qty, priority_level=r.priority_level, calculation_trace=r.calculation_trace
            )
            for r in results
        ]
    )

@router.post("/{run_id}/approve")
def approve_replenishment_run(
    run_id: str,
    db: Session = Depends(get_db),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    endpoint = f"/api/v1/replenishment/{run_id}/approve"
    if idempotency_key:
        is_cached, cached = check_idempotency(db, idempotency_key, endpoint, {"run_id": run_id})
        if is_cached and cached:
            return cached

    run = db.query(ReplenishmentRun).filter(ReplenishmentRun.run_id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Replenishment run '{run_id}' not found.")
    
    run.status = RunStatusEnum.APPROVED.value
    db.commit()
    log_action(db, "planner", "APPROVED_REPLENISHMENT_RUN", run_id=run_id)
    
    result = {"message": f"Replenishment run '{run_id}' approved successfully.", "status": "APPROVED"}
    if idempotency_key:
        commit_idempotency(db, idempotency_key, endpoint, result)
        
    return result
