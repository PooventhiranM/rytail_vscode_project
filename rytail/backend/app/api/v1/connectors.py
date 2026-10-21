import datetime
import uuid
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter(prefix="/connectors", tags=["Data Upload & Multi-Platform Connectors"])

CONNECTORS_CATALOG = [
    {
        "id": "conn-erp-01",
        "name": "SAP S/4HANA Enterprise Connector",
        "type": "ERP",
        "category": "Master Data & POs",
        "status": "HEALTHY",
        "schedule": "Every 6 hours",
        "last_sync": (datetime.datetime.utcnow() - datetime.timedelta(minutes=45)).isoformat(),
        "records_synced_today": 12450,
        "error_count": 0,
        "endpoint": "https://erp.styleunion.internal/odata/v4/retail",
        "auth_type": "OAuth 2.0 mTLS"
    },
    {
        "id": "conn-pos-02",
        "name": "Innoviti / PineLabs Store POS Feed",
        "type": "POS",
        "category": "Hourly Sales Transactions",
        "status": "HEALTHY",
        "schedule": "Hourly (Real-time stream)",
        "last_sync": (datetime.datetime.utcnow() - datetime.timedelta(minutes=12)).isoformat(),
        "records_synced_today": 48920,
        "error_count": 2,
        "endpoint": "https://pos-gateway.styleunion.internal/events",
        "auth_type": "API Key / HMAC"
    },
    {
        "id": "conn-wms-03",
        "name": "Manhattan SCALE WMS Connector",
        "type": "WMS",
        "category": "DC Inventory & Dispatches",
        "status": "HEALTHY",
        "schedule": "Every 30 minutes",
        "last_sync": (datetime.datetime.utcnow() - datetime.timedelta(minutes=8)).isoformat(),
        "records_synced_today": 18200,
        "error_count": 0,
        "endpoint": "https://wms-hub.styleunion.internal/api/v2",
        "auth_type": "Bearer Token"
    },
    {
        "id": "conn-bq-04",
        "name": "Google BigQuery Data Lakehouse",
        "type": "Data Lake",
        "category": "Historical Demand & Elasticity",
        "status": "HEALTHY",
        "schedule": "Nightly batch (02:00 IST)",
        "last_sync": (datetime.datetime.utcnow() - datetime.timedelta(hours=14)).isoformat(),
        "records_synced_today": 1420800,
        "error_count": 0,
        "endpoint": "bigquery://gcp-styleunion-prod:retail_dw",
        "auth_type": "Google Cloud ADC"
    },
    {
        "id": "conn-sftp-05",
        "name": "Vendor Inbound EDI / Flat Files (SFTP)",
        "type": "SFTP",
        "category": "Advanced Shipping Notices (ASN)",
        "status": "WARNING",
        "schedule": "Daily (06:00 IST)",
        "last_sync": (datetime.datetime.utcnow() - datetime.timedelta(hours=10)).isoformat(),
        "records_synced_today": 840,
        "error_count": 4,
        "endpoint": "sftp://edi.styleunion.in:22/inbound",
        "auth_type": "SSH Key Pair"
    }
]

RECENT_UPLOADS = [
    {
        "id": "up-01",
        "file_name": "styleunion_ss26_first_allocation_master.csv",
        "dataset_type": "Product & Size Curves",
        "mode": "UPSERT",
        "total_records": 1930,
        "valid_records": 1928,
        "rejected_records": 2,
        "uploaded_by": "Merchandiser Lead",
        "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(hours=3)).isoformat(),
        "status": "COMPLETED"
    }
]

class ImportRequest(BaseModel):
    dataset_type: str
    mode: str # REPLACE, APPEND, UPSERT
    mapped_columns: Dict[str, str]
    records_count: int

@router.get("")
def list_connectors():
    """List multi-platform retail connector status and synchronization telemetry"""
    return {
        "connectors": CONNECTORS_CATALOG,
        "recent_uploads": RECENT_UPLOADS,
        "metrics": {
            "total_connectors": len(CONNECTORS_CATALOG),
            "healthy_count": sum(1 for c in CONNECTORS_CATALOG if c["status"] == "HEALTHY"),
            "warning_count": sum(1 for c in CONNECTORS_CATALOG if c["status"] == "WARNING"),
            "total_records_today": sum(c["records_synced_today"] for c in CONNECTORS_CATALOG)
        }
    }

@router.post("/{connector_id}/sync")
def trigger_sync(connector_id: str):
    """Trigger manual or on-demand connector synchronization"""
    conn = next((c for c in CONNECTORS_CATALOG if c["id"] == connector_id), None)
    if not conn:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    conn["last_sync"] = datetime.datetime.utcnow().isoformat()
    conn["records_synced_today"] += 350
    return {
        "success": True,
        "connector": conn["name"],
        "status": "SYNCED",
        "records_fetched": 350,
        "message": f"Successfully synchronized {conn['name']}. No schema drift detected."
    }

@router.post("/execute-import")
def execute_import(payload: ImportRequest):
    """Execute dataset import with Replace / Append / Upsert modes and validation report"""
    upload_id = f"UP-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"
    new_record = {
        "id": upload_id,
        "file_name": f"{payload.dataset_type.lower().replace(' ', '_')}_batch.csv",
        "dataset_type": payload.dataset_type,
        "mode": payload.mode,
        "total_records": payload.records_count,
        "valid_records": payload.records_count,
        "rejected_records": 0,
        "uploaded_by": "Authorized Planner",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "status": "COMPLETED"
    }
    RECENT_UPLOADS.insert(0, new_record)
    return {
        "success": True,
        "upload_id": upload_id,
        "mode": payload.mode,
        "processed_records": payload.records_count,
        "message": f"Successfully processed {payload.records_count} records using {payload.mode} mode."
    }
