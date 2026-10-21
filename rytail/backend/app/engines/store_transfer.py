from typing import List, Dict, Any

def run_store_transfers(
    store_inventories: List[Dict[str, Any]],
    donor_wos_threshold: float = 6.0,
    receiver_wos_threshold: float = 2.0,
    max_transfer_qty: int = 50,
    min_transfer_qty: int = 1
) -> List[Dict[str, Any]]:
    """
    Store-to-Store Transfer Optimization Engine.
    
    Identifies excess stock at donor stores (high WOS, excess over target)
    and transfers to receiver stores experiencing stock-outs or high demand.
    """
    donors = []
    receivers = []
    
    # 1. Classify Donors and Receivers by SKU x Size
    for item in store_inventories:
        store_code = item["store_code"]
        sku = item["sku"]
        size_code = item["size_code"]
        current_stock = int(item.get("available_stock", 0))
        target_stock = int(item.get("target_stock", 5))
        avg_daily_sales = float(item.get("average_daily_sales", 0.0))
        region = item.get("region", "Default")
        
        weekly_sales = avg_daily_sales * 7.0
        wos = (current_stock / weekly_sales) if weekly_sales > 0 else 99.0
        
        excess = max(0, current_stock - target_stock)
        shortage = max(0, target_stock - current_stock)
        
        if excess > 0 and wos >= donor_wos_threshold:
            donors.append({
                "store_code": store_code,
                "sku": sku,
                "size_code": size_code,
                "current_stock": current_stock,
                "target_stock": target_stock,
                "wos": wos,
                "excess": excess,
                "region": region
            })
            
        elif shortage > 0 and wos <= receiver_wos_threshold:
            receivers.append({
                "store_code": store_code,
                "sku": sku,
                "size_code": size_code,
                "current_stock": current_stock,
                "target_stock": target_stock,
                "wos": wos,
                "shortage": shortage,
                "avg_daily_sales": avg_daily_sales,
                "region": region
            })

    # 2. Match Donors to Receivers by exact SKU and Size
    recommendations = []
    
    for r in receivers:
        matching_donors = [
            d for d in donors 
            if d["sku"] == r["sku"] and d["size_code"] == r["size_code"] and d["excess"] > 0
        ]
        
        if not matching_donors:
            continue
            
        # Sort donors by excess stock descending and regional proximity
        matching_donors.sort(
            key=lambda d: (-d["excess"], 0 if d["region"] == r["region"] else 1)
        )
        
        remaining_shortage = r["shortage"]
        
        for donor in matching_donors:
            if remaining_shortage <= 0:
                break
                
            transfer_qty = min(donor["excess"], remaining_shortage, max_transfer_qty)
            
            if transfer_qty >= min_transfer_qty:
                distance = 45.0 if donor["region"] == r["region"] else 250.0
                score = round(
                    (r["shortage"] * 2.0) + (donor["excess"] * 1.5) + (r["avg_daily_sales"] * 10.0) - (distance * 0.05),
                    2
                )
                
                reason = (
                    f"Donor {donor['store_code']} has excess {donor['excess']} units (WOS: {round(donor['wos'], 1)}wks). "
                    f"Receiver {r['store_code']} has shortage of {r['shortage']} units (WOS: {round(r['wos'], 1)}wks, ADS: {r['avg_daily_sales']}). "
                    f"Recommending transfer of {transfer_qty} units of {r['sku']} size {r['size_code']}."
                )
                
                recommendations.append({
                    "donor_store_code": donor["store_code"],
                    "receiver_store_code": r["store_code"],
                    "sku": r["sku"],
                    "size_code": r["size_code"],
                    "donor_current_stock": donor["current_stock"],
                    "donor_wos": round(donor["wos"], 1),
                    "receiver_current_stock": r["current_stock"],
                    "receiver_wos": round(r["wos"], 1),
                    "receiver_demand_qty": r["avg_daily_sales"] * 12.0,
                    "transfer_qty": transfer_qty,
                    "transfer_score": score,
                    "distance_km": distance,
                    "reason": reason
                })
                
                donor["excess"] -= transfer_qty
                remaining_shortage -= transfer_qty
                
    # Sort recommendations by transfer score descending
    recommendations.sort(key=lambda x: x["transfer_score"], reverse=True)
    return recommendations
