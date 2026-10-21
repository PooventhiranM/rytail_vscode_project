from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.services.warehouse_service import WarehouseNetworkService, DEFAULT_WAREHOUSES

router = APIRouter(prefix="/warehouses", tags=["Warehouse Network"])

@router.get("")
def list_warehouses():
    """List all national and regional distribution hubs"""
    return DEFAULT_WAREHOUSES

@router.get("/network-map")
def get_warehouse_network_map(
    warehouse_code: Optional[str] = Query(None, description="Filter connections by active warehouse hub")
):
    """
    Retrieve warehouse-to-store connectivity map data, geographic coordinates,
    straight-line & estimated road distances, freight transit times, and distance threshold alerts.
    """
    return WarehouseNetworkService.get_network_analytics(selected_wh_code=warehouse_code)
