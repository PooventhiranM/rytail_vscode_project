import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.gcs_service import gcs_service

router = APIRouter(prefix="/gcs", tags=["Google Cloud Storage (GCS) Live Data"])

class GCSConfigureRequest(BaseModel):
    project_id: str = Field("gcp-styleunion-prod", description="Google Cloud Project ID")
    bucket_name: str = Field("styleunion-live-inventory", description="GCS Bucket Name (with or without gs://)")
    prefix: Optional[str] = Field("live-feeds/", description="Subfolder / Object prefix")
    auth_mode: Optional[str] = Field("ADC", description="Authentication mode: ADC, SERVICE_ACCOUNT_KEY, or PUBLIC_STREAM")
    credentials_json: Optional[str] = Field(None, description="Optional Service Account Key JSON content")
    key_file_path: Optional[str] = Field(None, description="Optional path to credentials JSON file on disk")

class GCSIngestRequest(BaseModel):
    blob_name: str = Field("live-feeds/inventory_stream_latest.csv", description="GCS object blob to fetch")
    target_table: str = Field("inventory", description="Target Rytail table: inventory, sales, products")

class GCSExportRequest(BaseModel):
    export_type: str = Field("first_allocation", description="Type of export: first_allocation, replenishment, transfers")
    payload: Optional[Dict[str, Any]] = None

@router.get("/status")
def get_gcs_status():
    """Get current Google Cloud Storage connection status and telemetry"""
    test_res = gcs_service.test_connection()
    return {
        "project_id": gcs_service.project_id,
        "bucket_name": gcs_service.bucket_name,
        "gcs_uri": f"gs://{gcs_service.bucket_name}/{gcs_service.prefix}",
        "prefix": gcs_service.prefix,
        "auth_mode": gcs_service.auth_mode,
        "is_connected": test_res.get("connected", True),
        "latency_ms": test_res.get("latency_ms", 15.0),
        "last_sync_time": gcs_service.last_sync_time,
        "last_sync_summary": gcs_service.last_sync_summary,
        "connection_details": test_res
    }

@router.post("/configure")
def configure_gcs(req: GCSConfigureRequest):
    """Update Google Cloud Storage project, bucket, and credential settings"""
    return gcs_service.configure(
        project_id=req.project_id,
        bucket_name=req.bucket_name,
        prefix=req.prefix,
        auth_mode=req.auth_mode,
        credentials_json=req.credentials_json,
        key_file_path=req.key_file_path
    )

@router.post("/test-connection")
def test_gcs_connection():
    """Ping Google Cloud Storage bucket to verify permissions and latency"""
    return gcs_service.test_connection()

@router.get("/objects")
def list_gcs_objects():
    """List available dataset files in the configured GCS bucket"""
    objects = gcs_service.list_objects()
    return {
        "bucket": f"gs://{gcs_service.bucket_name}",
        "prefix": gcs_service.prefix,
        "total_objects": len(objects),
        "objects": objects
    }

@router.post("/sync-live-data")
def sync_gcs_live_data(req: GCSIngestRequest, db: Session = Depends(get_db)):
    """Fetch live data file from GCS and ingest into Rytail database"""
    return gcs_service.fetch_and_ingest(
        blob_name=req.blob_name,
        target_table=req.target_table,
        db=db
    )

@router.post("/export-snapshot")
def export_snapshot_to_gcs(req: GCSExportRequest):
    """Write Rytail planning results or snapshot to GCS bucket"""
    sample_payload = req.payload or {
        "system": "Rytail Agentic AI Retail Platform",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "exported_records": 193,
        "status": "APPROVED",
        "sample_item": "EXFP00035WHITECAP GRAY"
    }
    return gcs_service.export_snapshot_to_gcs(
        export_type=req.export_type,
        payload=sample_payload
    )
