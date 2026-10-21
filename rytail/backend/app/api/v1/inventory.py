from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.db.database import get_db
from app.db.models import Inventory, Warehouse, Store
from app.schemas import InventoryOut

router = APIRouter(prefix="/inventory", tags=["Inventory & Network Position"])

@router.get("", response_model=List[InventoryOut])
def get_inventory(
    location_code: Optional[str] = None,
    sku: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Inventory)
    if location_code:
        query = query.filter(Inventory.location_code == location_code)
    if sku:
        query = query.filter(Inventory.sku == sku)
    return query.limit(500).all()

@router.get("/network-balancing")
def get_network_balancing_view(sku: str = "EXFP00035WHITECAP GRAY", db: Session = Depends(get_db)):
    """
    Returns complete multi-echelon network view for a SKU across Warehouse and Stores.
    """
    items = db.query(Inventory).filter(Inventory.sku == sku).all()
    
    locations = {}
    for item in items:
        loc = item.location_code
        if loc not in locations:
            locations[loc] = {
                "location_code": loc,
                "location_type": item.location_type,
                "total_stock": 0,
                "reserved_stock": 0,
                "in_transit_stock": 0,
                "size_breakdown": {}
            }
        locations[loc]["total_stock"] += item.available_stock
        locations[loc]["reserved_stock"] += item.reserved_stock
        locations[loc]["in_transit_stock"] += item.in_transit_stock
        locations[loc]["size_breakdown"][item.size_code] = item.available_stock

    return {
        "sku": sku,
        "location_count": len(locations),
        "total_network_stock": sum(l["total_stock"] for l in locations.values()),
        "network_positions": list(locations.values())
    }
