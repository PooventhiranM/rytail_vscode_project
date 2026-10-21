from typing import List, Dict, Any, Optional

def calculate_store_demand(
    sales_data: List[Dict[str, Any]],
    planning_horizon_days: int = 12,
    existing_store_weights: Optional[Dict[str, float]] = None,
    recalculate_weights: bool = False
) -> Dict[str, Any]:
    """
    Calculates Store-Level Velocity, Demand, and Store Weights based on comparable sales history.
    
    Formula:
      - First 5 Week Sales Qty (S5)
      - Weekly Velocity (Vs) = S5 / 5
      - Planning Demand (Ds) = Vs * (Planning Horizon Days / 7.0)
      - Store Weight (Ws) = Ds / Total Network Demand
      
    If existing_store_weights is provided and recalculate_weights is False,
    preserves previous store weights.
    """
    if existing_store_weights and not recalculate_weights:
        # Re-use existing store weights
        total_w = sum(existing_store_weights.values())
        normalized_weights = {s: w / total_w for s, w in existing_store_weights.items()} if total_w > 0 else existing_store_weights
        return {
            "store_metrics": {},
            "store_weights": normalized_weights,
            "total_network_demand": 0.0,
            "weight_source": "PRESERVED_PREVIOUS_RUN"
        }

    store_metrics = {}
    total_network_demand = 0.0
    
    for row in sales_data:
        store_code = row["store_code"]
        first_5_wk_sales = float(row.get("first_5_week_sales", row.get("sales_qty", 0)))
        
        velocity = first_5_wk_sales / 5.0
        demand = velocity * (planning_horizon_days / 7.0)
        
        store_metrics[store_code] = {
            "store_code": store_code,
            "first_5_week_sales": first_5_wk_sales,
            "weekly_velocity": round(velocity, 4),
            "planning_demand": round(demand, 4)
        }
        total_network_demand += demand
        
    store_weights = {}
    num_stores = len(store_metrics)
    
    if total_network_demand > 0:
        for store_code, metrics in store_metrics.items():
            store_weights[store_code] = round(metrics["planning_demand"] / total_network_demand, 8)
    else:
        # Fallback to uniform weights if total demand is 0
        uniform_weight = round(1.0 / num_stores, 8) if num_stores > 0 else 0.0
        for store_code in store_metrics:
            store_weights[store_code] = uniform_weight
            
    # Normalize weights so they sum strictly to 1.0
    sum_w = sum(store_weights.values())
    if sum_w > 0:
        store_weights = {s: round(w / sum_w, 8) for s, w in store_weights.items()}
        
    return {
        "store_metrics": store_metrics,
        "store_weights": store_weights,
        "total_network_demand": round(total_network_demand, 2),
        "weight_source": "CALCULATED_FROM_COMPARABLE_SALES"
    }
