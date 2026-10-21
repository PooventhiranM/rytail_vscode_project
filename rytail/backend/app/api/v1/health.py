from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.config import settings
from datetime import datetime
import os

router = APIRouter(tags=["Health & Telemetry"])

@router.get("/healthz", summary="Liveness Probe")
def liveness_check():
    """Returns 200 if the FastAPI application process is alive."""
    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/readyz", summary="Readiness Probe")
def readiness_check(db: Session = Depends(get_db)):
    """
    Returns 200 if the application is ready to accept traffic,
    verifying database connectivity and table access.
    """
    try:
        # Verify database connection
        db.execute(text("SELECT 1")).scalar()
        
        # Verify key table existence
        stores_count = db.execute(text("SELECT COUNT(*) FROM stores")).scalar()
        products_count = db.execute(text("SELECT COUNT(*) FROM products")).scalar()

        return {
            "status": "READY",
            "database": "CONNECTED",
            "metrics": {
                "stores_registered": stores_count,
                "products_cataloged": products_count
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "NOT_READY",
                "database": "UNREACHABLE",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )
