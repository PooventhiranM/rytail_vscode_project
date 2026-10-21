from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db.models import Store, Product, Inventory, SalesDaily, DataQualityLog

def run_data_quality_audit(db: Session) -> Dict[str, Any]:
    """
    Validates data integrity across stores, products, inventory, and sales tables.
    Returns summary statistics and logs issues to DataQualityLog.
    """
    issues = []
    
    # 1. Stores Validation
    stores = db.query(Store).all()
    missing_store_codes = [s.id for s in stores if not s.store_code]
    invalid_capacity = [s.store_code for s in stores if s.store_capacity <= 0]
    
    if missing_store_codes:
        issues.append({"rule": "Missing Store Code", "severity": "ERROR", "count": len(missing_store_codes), "details": missing_store_codes})
    if invalid_capacity:
        issues.append({"rule": "Invalid Store Capacity", "severity": "WARNING", "count": len(invalid_capacity), "details": invalid_capacity[:10]})
        
    # 2. Products Validation
    products = db.query(Product).all()
    missing_skus = [p.id for p in products if not p.sku]
    invalid_prices = [p.sku for p in products if p.selling_price <= 0 or p.cost_price <= 0]
    
    if missing_skus:
        issues.append({"rule": "Missing Product SKU", "severity": "ERROR", "count": len(missing_skus), "details": missing_skus})
    if invalid_prices:
        issues.append({"rule": "Invalid Price or Cost", "severity": "ERROR", "count": len(invalid_prices), "details": invalid_prices[:10]})
        
    # 3. Inventory Validation
    inventories = db.query(Inventory).all()
    negative_stock = [f"{i.location_code}:{i.sku}:{i.size_code}" for i in inventories if i.available_stock < 0]
    invalid_sizes = [i.id for i in inventories if i.size_code not in ["S", "M", "L", "XL", "XXL"]]
    
    if negative_stock:
        issues.append({"rule": "Negative Inventory Stock", "severity": "CRITICAL", "count": len(negative_stock), "details": negative_stock[:10]})
    if invalid_sizes:
        issues.append({"rule": "Invalid Size Code", "severity": "ERROR", "count": len(invalid_sizes), "details": invalid_sizes[:10]})
        
    # 4. Sales Validation
    sales = db.query(SalesDaily).all()
    negative_sales = [f"{s.store_code}:{s.sku}" for s in sales if s.sales_qty < 0]
    if negative_sales:
        issues.append({"rule": "Negative Sales Quantity", "severity": "WARNING", "count": len(negative_sales), "details": negative_sales[:10]})
        
    # Log to DB
    for issue in issues:
        log_entry = DataQualityLog(
            rule_name=issue["rule"],
            severity=issue["severity"],
            invalid_record_count=issue["count"],
            details={"samples": issue["details"]}
        )
        db.add(log_entry)
        
    db.commit()
    
    total_invalid_records = sum(i["count"] for i in issues)
    health_score = max(0.0, round(100.0 - (total_invalid_records * 0.5), 1))
    
    return {
        "data_health_score": health_score,
        "total_records_checked": len(stores) + len(products) + len(inventories) + len(sales),
        "invalid_records_count": total_invalid_records,
        "issue_summary": issues
    }
