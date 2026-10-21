import math
from typing import List, Dict, Any

def run_replenishment(
    inventory_items: List[Dict[str, Any]],
    lead_time_days: int = 5,
    review_period_days: int = 7,
    safety_stock_units: int = 3,
    pack_size: int = 1,
    moq: int = 1,
    critical_wos_threshold: float = 1.0,
    high_wos_threshold: float = 2.0,
    medium_wos_threshold: float = 3.5
) -> List[Dict[str, Any]]:
    """
    Replenishment Engine working at Store x SKU x Size level.
    
    Formula:
      Target Stock = ceil(Average Daily Sales * (Lead Time + Review Period) + Safety Stock)
      Raw Replenishment Qty = MAX(0, Target Stock - Available Stock)
      Apply Pack Size rounding, MOQ, and Store Capacity constraints.
    """
    results = []
    
    for item in inventory_items:
        store_code = item["store_code"]
        sku = item["sku"]
        size_code = item["size_code"]
        current_stock = int(item.get("available_stock", 0))
        in_transit = int(item.get("in_transit_stock", 0))
        avg_daily_sales = float(item.get("average_daily_sales", 0.0))
        store_capacity = int(item.get("store_capacity", 9999))
        warehouse_avail = int(item.get("warehouse_avail", 9999))
        is_active = bool(item.get("is_active", True))
        
        if not is_active:
            continue  # Guardrail: skip inactive stores/products
            
        available_total = current_stock + in_transit
        weekly_sales = avg_daily_sales * 7.0
        ros = avg_daily_sales # Rate of Sale
        wos = (available_total / weekly_sales) if weekly_sales > 0 else 99.0
        
        # 1. Target Stock Calculation
        target_stock = math.ceil(avg_daily_sales * (lead_time_days + review_period_days) + safety_stock_units)
        
        # 2. Raw Replenishment Need
        raw_need = max(0, target_stock - available_total)
        
        # 3. Apply Pack Size and MOQ
        recommended_qty = 0
        if raw_need > 0:
            if raw_need < moq:
                recommended_qty = moq
            else:
                # Round up to nearest pack size
                recommended_qty = math.ceil(raw_need / float(pack_size)) * pack_size
                
        # 4. Apply Guardrails (Warehouse Stock & Store Capacity)
        recommended_qty = min(recommended_qty, warehouse_avail)
        if (current_stock + recommended_qty) > store_capacity:
            recommended_qty = max(0, store_capacity - current_stock)
            
        # 5. Priority Classification
        if available_total == 0 and avg_daily_sales > 0:
            priority = "Critical"
        elif wos < critical_wos_threshold:
            priority = "Critical"
        elif wos < high_wos_threshold:
            priority = "High"
        elif wos < medium_wos_threshold:
            priority = "Medium"
        else:
            priority = "Low"
            
        trace = (
            f"Store {store_code} SKU {sku} Size {size_code}: Stock={current_stock}, ADS={round(avg_daily_sales, 2)}, "
            f"WOS={round(wos, 2)}wks. Target Stock={target_stock} (ADS * ({lead_time_days}+{review_period_days}) + {safety_stock_units}). "
            f"Raw Need={raw_need} -> Recommended={recommended_qty} [{priority} Priority]."
        )
        
        results.append({
            "store_code": store_code,
            "sku": sku,
            "size_code": size_code,
            "current_stock": current_stock,
            "in_transit_stock": in_transit,
            "average_daily_sales": round(avg_daily_sales, 2),
            "ros": round(ros, 2),
            "wos": round(wos, 2),
            "target_stock": target_stock,
            "raw_replenishment_qty": raw_need,
            "recommended_qty": recommended_qty,
            "priority_level": priority,
            "calculation_trace": {
                "explanation": trace,
                "target_formula": f"{round(avg_daily_sales, 2)} * ({lead_time_days}+{review_period_days}) + {safety_stock_units}",
                "wos_weeks": round(wos, 2)
            }
        })
        
    return results
