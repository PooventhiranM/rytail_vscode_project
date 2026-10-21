import math
from typing import List, Dict, Any, Optional

STANDARD_SIZES = ["S", "M", "L", "XL", "XXL"]

def run_first_allocation(
    warehouse_stock: int,
    allocation_pool_pct: float,
    stores_demand_data: Dict[str, Dict[str, Any]], # store_code -> {demand, weight, store_grade, capacity}
    size_curves_by_store: Dict[str, Dict[str, float]], # store_code -> size_pct_dict
    min_units_per_size: int = 2,
    max_units_per_size: int = 10,
    store_capacities: Optional[Dict[str, int]] = None,
    comparable_sku_used: str = "EXFP00031JET BLACK",
    similarity_score: float = 0.99
) -> Dict[str, Any]:
    """
    Core First Allocation Engine.
    
    Hard Rules:
    1. Allocation Pool = floor(Warehouse Stock * Allocation %)
    2. Total Allocated MUST be <= Allocation Pool.
    3. Base Allocation = min_units_per_size per size per store.
    4. Surplus Allocation = Rank (Store x Size) by Slot Score = Store Weight * Size %.
    5. Deterministic tie breaking.
    """
    if warehouse_stock <= 0:
        raise ValueError("Warehouse stock must be greater than zero for allocation.")
    if allocation_pool_pct <= 0 or allocation_pool_pct > 100:
        raise ValueError("Allocation pool percentage must be between 0 and 100.")
        
    # Step 1: Calculate Allocation Pool Hard Limit
    allocation_pool = math.floor(warehouse_stock * (allocation_pool_pct / 100.0))
    
    if allocation_pool <= 0:
        raise ValueError(f"Calculated allocation pool is 0 units (Stock: {warehouse_stock}, Pct: {allocation_pool_pct}%).")
        
    store_codes = sorted(list(stores_demand_data.keys()))
    num_stores = len(store_codes)
    
    if num_stores == 0:
        raise ValueError("No eligible stores provided for allocation.")
        
    # Step 2: Calculate Base Allocation
    # Base allocation per size per store
    base_qty_per_size = min_units_per_size
    base_per_store = base_qty_per_size * len(STANDARD_SIZES)
    total_base_allocation = base_per_store * num_stores
    
    # Check if base allocation exceeds pool
    if total_base_allocation > allocation_pool:
        # Scale down base allocation to fit pool if pool is too small
        base_qty_per_size = max(0, math.floor(allocation_pool / (num_stores * len(STANDARD_SIZES))))
        base_per_store = base_qty_per_size * len(STANDARD_SIZES)
        total_base_allocation = base_per_store * num_stores

    surplus_pool = allocation_pool - total_base_allocation
    
    # Initialize allocation table: store_code -> size_code -> qty
    allocations = {s: {z: base_qty_per_size for z in STANDARD_SIZES} for s in store_codes}
    
    # Step 3: Rank All (Store x Size) Slots for Surplus Allocation
    slot_scores = []
    
    for store_code in store_codes:
        s_data = stores_demand_data[store_code]
        s_weight = float(s_data.get("weight", 0.0))
        s_demand = float(s_data.get("demand", 0.0))
        s_curve = size_curves_by_store.get(store_code, {z: 0.20 for z in STANDARD_SIZES})
        
        for size_idx, size_code in enumerate(STANDARD_SIZES):
            size_pct = float(s_curve.get(size_code, 0.20))
            score = s_weight * size_pct
            
            slot_scores.append({
                "store_code": store_code,
                "size_code": size_code,
                "score": score,
                "store_weight": s_weight,
                "store_demand": s_demand,
                "size_pct": size_pct,
                "size_order": size_idx # S=0, M=1, L=2, XL=3, XXL=4
            })
            
    # Deterministic Tie-Breaking Sort:
    # 1. Slot Score desc
    # 2. Store Weight desc
    # 3. Store Demand desc
    # 4. Store Code asc
    # 5. Size Order asc
    slot_scores.sort(
        key=lambda x: (
            -x["score"],
            -x["store_weight"],
            -x["store_demand"],
            x["store_code"],
            x["size_order"]
        )
    )
    
    # Step 4: Distribute Surplus Units to Top Ranked Slots
    surplus_allocated = 0
    slot_idx = 0
    num_slots = len(slot_scores)
    
    while surplus_allocated < surplus_pool and num_slots > 0:
        slot = slot_scores[slot_idx % num_slots]
        s_code = slot["store_code"]
        z_code = slot["size_code"]
        
        # Check store capacity and max units per size guardrails
        current_store_total = sum(allocations[s_code].values())
        max_cap = store_capacities.get(s_code, 999999) if store_capacities else 999999
        
        if allocations[s_code][z_code] < max_units_per_size and current_store_total < max_cap:
            allocations[s_code][z_code] += 1
            surplus_allocated += 1
            
        slot_idx += 1
        # Safety break if all slots hit max cap
        if slot_idx >= surplus_pool * 10:
            break
            
    # Step 5: HARD GATE VALIDATION
    total_allocated = sum(sum(size_dict.values()) for size_dict in allocations.values())
    
    if total_allocated > allocation_pool:
        raise ValueError(f"HARD GATE VIOLATION: Total allocated units ({total_allocated}) exceeds allocation pool ({allocation_pool}). Run aborted.")

    # Step 6: Build Detailed Results & Calculation Traces
    store_results = []
    
    for store_code in store_codes:
        s_data = stores_demand_data[store_code]
        s_weight = float(s_data.get("weight", 0.0))
        s_demand = float(s_data.get("demand", 0.0))
        size_split = allocations[store_code]
        store_total = sum(size_split.values())
        
        base_alloc_store = base_qty_per_size * len(STANDARD_SIZES)
        surplus_alloc_store = store_total - base_alloc_store
        
        trace = (
            f"{store_code} allocated {store_total} units (Base: {base_alloc_store}, Surplus: {surplus_alloc_store}) "
            f"based on Store Weight {round(s_weight * 100, 4)}% derived from comparable {comparable_sku_used} demand ({round(s_demand, 2)} units). "
            f"Size breakdown: {', '.join([f'{z}:{qty}' for z, qty in size_split.items()])}."
        )
        
        store_results.append({
            "store_code": store_code,
            "comparable_used": comparable_sku_used,
            "similarity_score": similarity_score,
            "store_weight": s_weight,
            "planning_demand": s_demand,
            "size_split": size_split,
            "base_allocation": base_alloc_store,
            "surplus_allocation": surplus_alloc_store,
            "final_allocation": store_total,
            "calculation_trace": {
                "explanation": trace,
                "store_weight_pct": round(s_weight * 100, 4),
                "planning_demand": s_demand,
                "base_units_per_size": base_qty_per_size,
                "surplus_units_received": surplus_alloc_store
            }
        })

    return {
        "warehouse_stock": warehouse_stock,
        "allocation_pool_pct": allocation_pool_pct,
        "allocation_pool_units": allocation_pool,
        "total_allocated_units": total_allocated,
        "surplus_distributed": surplus_allocated,
        "store_count": num_stores,
        "store_results": store_results
    }
