from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.database import get_db
from app.db.models import AllocationRun, ReplenishmentRun, TransferRun
from app.schemas import SimulationRequest
from app.services.simulation_service import run_allocation_simulation

router = APIRouter(prefix="/planning", tags=["Planning Runs & Simulation"])

@router.get("/runs")
def list_all_planning_runs(db: Session = Depends(get_db)):
    alloc_runs = db.query(AllocationRun).all()
    repl_runs = db.query(ReplenishmentRun).all()
    trf_runs = db.query(TransferRun).all()
    
    runs = []
    for r in alloc_runs:
        runs.append({
            "run_id": r.run_id, "type": "FIRST_ALLOCATION", "target_sku": r.target_sku,
            "version": r.version, "status": r.status, "units": r.total_allocated_units,
            "store_count": r.store_count, "run_by": r.run_by_user, "created_at": r.created_at
        })
    for r in repl_runs:
        runs.append({
            "run_id": r.run_id, "type": "REPLENISHMENT", "target_sku": "NETWORK",
            "version": "1.0", "status": r.status, "units": r.total_recommended_units,
            "store_count": 193, "run_by": r.run_by_user, "created_at": r.created_at
        })
    for r in trf_runs:
        runs.append({
            "run_id": r.run_id, "type": "STORE_TRANSFER", "target_sku": "NETWORK",
            "version": "1.0", "status": r.status, "units": r.total_transfer_units,
            "store_count": r.recommendation_count, "run_by": r.run_by_user, "created_at": r.created_at
        })
        
    runs.sort(key=lambda x: str(x["created_at"]), reverse=True)
    return runs

@router.post("/simulate")
def simulate_first_allocation(req: SimulationRequest, db: Session = Depends(get_db)):
    base_run = db.query(AllocationRun).filter(AllocationRun.run_id == req.base_run_id).first()
    if not base_run:
        raise HTTPException(status_code=404, detail=f"Base run '{req.base_run_id}' not found.")
        
    base_dict = {
        "run_id": base_run.run_id,
        "total_warehouse_stock": base_run.total_warehouse_stock,
        "allocation_pool_pct": base_run.allocation_pool_pct,
        "planning_horizon_days": base_run.planning_horizon_days,
        "total_allocated_units": base_run.total_allocated_units,
        "allocation_pool_units": base_run.allocation_pool_units,
        "store_count": base_run.store_count,
        "input_snapshot": base_run.input_snapshot or {}
    }
    
    sim_params = req.dict(exclude_none=True)
    return run_allocation_simulation(base_dict, sim_params)
