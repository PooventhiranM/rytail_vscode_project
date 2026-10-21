from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.data_quality import run_data_quality_audit
from app.db.models import DataQualityLog

router = APIRouter(prefix="/data-quality", tags=["Data Quality"])

@router.get("/audit")
def trigger_data_quality_audit(db: Session = Depends(get_db)):
    return run_data_quality_audit(db)

@router.get("/logs")
def get_data_quality_logs(db: Session = Depends(get_db)):
    logs = db.query(DataQualityLog).order_by(DataQualityLog.checked_at.desc()).limit(100).all()
    return logs
