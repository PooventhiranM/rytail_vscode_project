from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import SalesDaily, ComparableProduct, Product
from app.engines.comparable_sku import find_comparable_skus

router = APIRouter(prefix="/sales", tags=["Sales Analytics & Comparables"])

@router.get("/summary")
def get_sales_summary(
    sku: Optional[str] = None,
    store_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SalesDaily)
    if sku:
        query = query.filter(SalesDaily.sku == sku)
    if store_code:
        query = query.filter(SalesDaily.store_code == store_code)
    
    records = query.all()
    total_qty = sum(r.sales_qty for r in records)
    total_revenue = sum(r.sales_amount for r in records)
    
    return {
        "record_count": len(records),
        "total_sales_qty": total_qty,
        "total_sales_revenue": total_revenue,
        "weekly_velocity": round(total_qty / 5.0, 2)
    }

@router.get("/comparables/{sku}")
def get_comparable_products(sku: str, db: Session = Depends(get_db)):
    target = db.query(Product).filter(Product.sku == sku).first()
    if not target:
        # Fallback target definition if not in DB
        target_dict = {
            "sku": sku, "division": "MENS WEAR", "department": "EXPLORER TEES",
            "product_type": "IMPRESSION POLO", "sleeve": "HALF SLEEVE", "fit": "REGULAR FIT",
            "length": "REGULAR", "pattern": "SOLID", "selling_price": 1299.0, "season": "SS2026"
        }
    else:
        target_dict = {
            "sku": target.sku, "division": target.division, "department": target.department,
            "product_type": target.product_type, "sleeve": target.sleeve, "fit": target.fit,
            "length": target.length, "pattern": target.pattern, "selling_price": target.selling_price,
            "season": target.season
        }
        
    all_prods = db.query(Product).filter(Product.sku != sku).all()
    cand_list = [
        {
            "sku": c.sku, "product_name": c.product_name, "style_code": c.style_code, "color": c.color,
            "division": c.division, "department": c.department, "product_type": c.product_type,
            "sleeve": c.sleeve, "fit": c.fit, "length": c.length, "pattern": c.pattern,
            "selling_price": c.selling_price, "season": c.season
        }
        for c in all_prods
    ]
    
    results = find_comparable_skus(target_dict, cand_list, top_n=5)
    return {"target_sku": sku, "comparables": results}
