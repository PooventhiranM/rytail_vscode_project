import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.database import get_db

router = APIRouter(prefix="/scanner", tags=["In-Store Barcode Scanner"])

# In-memory realistic store location inventory state for seamless instant operation
# Multi-location balances: Sales Floor, Backroom, Damaged, Quarantine, Receiving
LOCATION_INVENTORY_STORE = {
    # Key: store_code:sku
    "E0100:EXFP00035WHITECAP GRAY": {
        "SALES_FLOOR": 3,
        "BACKROOM": 10,
        "DAMAGED": 1,
        "QUARANTINE": 0,
        "RECEIVING": 2,
        "mdq": 6
    },
    "E0100:EXFP00031JET BLACK": {
        "SALES_FLOOR": 5,
        "BACKROOM": 14,
        "DAMAGED": 0,
        "QUARANTINE": 0,
        "RECEIVING": 0,
        "mdq": 6
    },
    "E0101:EXFP00035WHITECAP GRAY": {
        "SALES_FLOOR": 2,
        "BACKROOM": 8,
        "DAMAGED": 0,
        "QUARANTINE": 0,
        "RECEIVING": 0,
        "mdq": 6
    }
}

BARCODE_CATALOG = {
    "8901234567890": {
        "sku": "EXFP00035WHITECAP GRAY",
        "style_code": "EXFP00035",
        "color": "WHITECAP GRAY",
        "product_name": "Men's Impression Polo - Half Sleeve",
        "category": "POLOS",
        "division": "MENS WEAR",
        "size": "M",
        "mrp": 1499.0,
        "image_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80"
    },
    "8901234000101": {
        "sku": "EXFP00031JET BLACK",
        "style_code": "EXFP00031",
        "color": "JET BLACK",
        "product_name": "Men's Impression Polo - Solid",
        "category": "POLOS",
        "division": "MENS WEAR",
        "size": "L",
        "mrp": 1499.0,
        "image_url": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80"
    },
    "8901234000105": {
        "sku": "EXFP00042NAVY",
        "style_code": "EXFP00042",
        "color": "NAVY BLUE",
        "product_name": "Linen Blend Tailored Blazer",
        "category": "OUTERWEAR",
        "division": "MENS WEAR",
        "size": "40",
        "mrp": 3999.0,
        "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80"
    }
}

TRANSACTION_LOG = []
IDEMPOTENCY_STORE = set()

class StockMoveRequest(BaseModel):
    store_code: str
    sku: str
    source_location: str
    dest_location: Optional[str] = None
    destination_location: Optional[str] = None
    quantity: int = Field(gt=0)
    reason: Optional[str] = "Display Shelf Replenishment"
    idempotency_key: Optional[str] = None

@router.get("/lookup")
def scanner_lookup(
    barcode: Optional[str] = None,
    sku: Optional[str] = None,
    store_code: str = Query("E0100", description="Store code context")
):
    """
    In-Store Barcode Lookup:
    Identifies fashion garment by barcode or SKU, returning product details,
    multi-location stock balances, MDQ, and display shortage calculation.
    """
    clean_code = (barcode or sku or "").strip()
    if not clean_code:
        raise HTTPException(status_code=400, detail="Must provide barcode or sku parameter")

    # Match barcode or SKU
    item = BARCODE_CATALOG.get(clean_code)
    if not item:
        # Search by SKU
        for bc, val in BARCODE_CATALOG.items():
            if val["sku"] == clean_code:
                item = val
                clean_code = bc
                break

    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"Barcode or SKU '{clean_code}' not found in catalog. You can register this barcode to a SKU."
        )

    # Get location balances for this store
    loc_key = f"{store_code}:{item['sku']}"
    if loc_key not in LOCATION_INVENTORY_STORE:
        # Auto-initialize default demo balances
        LOCATION_INVENTORY_STORE[loc_key] = {
            "SALES_FLOOR": 3,
            "BACKROOM": 8,
            "DAMAGED": 0,
            "QUARANTINE": 0,
            "RECEIVING": 0,
            "mdq": 6
        }

    balances = LOCATION_INVENTORY_STORE[loc_key]
    sf_stock = balances.get("SALES_FLOOR", 0)
    br_stock = balances.get("BACKROOM", 0)
    dam_stock = balances.get("DAMAGED", 0)
    quar_stock = balances.get("QUARANTINE", 0)
    rec_stock = balances.get("RECEIVING", 0)
    total_store_stock = sf_stock + br_stock + dam_stock + quar_stock + rec_stock

    mdq = balances.get("mdq", 6)
    shortage = max(0, mdq - sf_stock)
    recommended_refill = min(shortage, br_stock)

    return {
        "found": True,
        "barcode": clean_code,
        "sku": item["sku"],
        "style_code": item["style_code"],
        "product_name": item["product_name"],
        "category": item["category"],
        "color": item["color"],
        "size": item["size"],
        "mrp": item["mrp"],
        "image_url": item["image_url"],
        "store_code": store_code,
        "total_store_stock": total_store_stock,
        "sales_floor_stock": sf_stock,
        "backroom_stock": br_stock,
        "damaged_stock": dam_stock,
        "quarantine_stock": quar_stock,
        "receiving_stock": rec_stock,
        "mdq": mdq,
        "display_shortage": shortage,
        "recommended_refill": recommended_refill,
        "inventory_by_location": balances,
        "locations": [
            {"code": "SALES_FLOOR", "name": f"{store_code} - Sales Floor", "on_hand": sf_stock, "available": sf_stock, "is_floor": True},
            {"code": "BACKROOM", "name": f"{store_code} - Backroom", "on_hand": br_stock, "available": br_stock, "is_backroom": True},
            {"code": "DAMAGED", "name": f"{store_code} - Damaged Stock", "on_hand": dam_stock, "available": dam_stock, "is_floor": False},
            {"code": "QUARANTINE", "name": f"{store_code} - Quarantine Stock", "on_hand": quar_stock, "available": quar_stock, "is_floor": False},
            {"code": "RECEIVING", "name": f"{store_code} - Goods Receiving Area", "on_hand": rec_stock, "available": rec_stock, "is_floor": False}
        ]
    }

@router.post("/move-stock")
def execute_stock_movement(payload: StockMoveRequest):
    """
    Atomic Stock Movement between locations in a store:
    - Enforces source != dest
    - Enforces quantity <= source available stock
    - Preserves total store stock
    - Duplicate prevention via idempotency key
    """
    target_dest = payload.dest_location or payload.destination_location
    if not target_dest:
        raise HTTPException(status_code=400, detail="Destination location is required.")

    if payload.source_location == target_dest:
        raise HTTPException(status_code=400, detail="Source and destination locations cannot be identical.")

    if payload.idempotency_key and payload.idempotency_key in IDEMPOTENCY_STORE:
        return {
            "success": True,
            "message": "Duplicate request detected: transaction previously recorded.",
            "transaction_number": f"TX-IDEMP-{payload.idempotency_key[:8]}"
        }

    loc_key = f"{payload.store_code}:{payload.sku}"
    if loc_key not in LOCATION_INVENTORY_STORE:
        raise HTTPException(status_code=404, detail="Store inventory record not found.")

    balances = LOCATION_INVENTORY_STORE[loc_key]
    source_qty = balances.get(payload.source_location, 0)

    if source_qty < payload.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock in '{payload.source_location}'. Available: {source_qty}, Requested: {payload.quantity}"
        )

    # Perform atomic update
    balances[payload.source_location] -= payload.quantity
    balances[target_dest] = balances.get(target_dest, 0) + payload.quantity

    tx_num = f"TX-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:4].upper()}"
    tx_entry = {
        "transaction_number": tx_num,
        "store_code": payload.store_code,
        "sku": payload.sku,
        "source": payload.source_location,
        "dest": target_dest,
        "quantity": payload.quantity,
        "reason": payload.reason,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    TRANSACTION_LOG.insert(0, tx_entry)

    if payload.idempotency_key:
        IDEMPOTENCY_STORE.add(payload.idempotency_key)

    total_store_stock = sum(balances[k] for k in ["SALES_FLOOR", "BACKROOM", "DAMAGED", "QUARANTINE", "RECEIVING"] if k in balances)

    return {
        "success": True,
        "transaction_number": tx_num,
        "source_location": payload.source_location,
        "dest_location": target_dest,
        "destination_location": target_dest,
        "quantity_moved": payload.quantity,
        "new_source_stock": balances[payload.source_location],
        "new_source_quantity": balances[payload.source_location],
        "new_dest_stock": balances[target_dest],
        "new_destination_quantity": balances[target_dest],
        "total_store_stock": total_store_stock,
        "message": f"Successfully moved {payload.quantity} units from {payload.source_location} to {target_dest}."
    }

@router.get("/transactions")
def get_scanner_transactions(store_code: Optional[str] = None):
    if store_code:
        return [t for t in TRANSACTION_LOG if t["store_code"] == store_code]
    return TRANSACTION_LOG
