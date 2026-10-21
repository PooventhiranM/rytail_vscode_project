from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import PlanningParameter

router = APIRouter(prefix="/config", tags=["Configuration"])

@router.get("")
def get_all_config(db: Session = Depends(get_db)):
    params = db.query(PlanningParameter).all()
    return {p.param_key: {"value": p.param_value, "type": p.param_type, "description": p.description} for p in params}

@router.post("")
def update_config_parameter(key: str, value: str, db: Session = Depends(get_db)):
    p = db.query(PlanningParameter).filter(PlanningParameter.param_key == key).first()
    if not p:
        p = PlanningParameter(param_key=key, param_value=value)
        db.add(p)
    else:
        p.param_value = value
    db.commit()
    return {"message": f"Parameter '{key}' updated to '{value}'."}
