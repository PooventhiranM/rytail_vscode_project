from typing import Dict, Any, List
from app.engines.first_allocation import run_first_allocation
from app.engines.store_demand import calculate_store_demand

def run_allocation_simulation(
    base_run: Dict[str, Any],
    simulation_params: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes what-if simulation by comparing actual run result with modified parameter run.
    Does NOT modify or overwrite production DB records.
    """
    # 1. Base parameters extracted from base run
    warehouse_stock = int(simulation_params.get("warehouse_stock", base_run.get("total_warehouse_stock", 4435)))
    alloc_pct = float(simulation_params.get("allocation_pool_pct", base_run.get("allocation_pool_pct", 52.4)))
    min_units = int(simulation_params.get("min_units_per_size", 2))
    max_units = int(simulation_params.get("max_units_per_size", 10))
    horizon = int(simulation_params.get("planning_horizon_days", base_run.get("planning_horizon_days", 12)))
    
    # Extract store demand dictionary
    input_snap = base_run.get("input_snapshot", {})
    stores_demand = input_snap.get("stores_demand", {})
    size_curves = input_snap.get("size_curves", {})
    comp_sku = simulation_params.get("comparable_sku", input_snap.get("comparable_sku", "EXFP00031JET BLACK"))
    
    # Optional store filter override
    selected_stores = simulation_params.get("store_codes")
    if selected_stores:
        stores_demand = {s: stores_demand[s] for s in selected_stores if s in stores_demand}
        size_curves = {s: size_curves[s] for s in selected_stores if s in size_curves}
        
    # Re-calculate simulation allocation
    sim_output = run_first_allocation(
        warehouse_stock=warehouse_stock,
        allocation_pool_pct=alloc_pct,
        stores_demand_data=stores_demand,
        size_curves_by_store=size_curves,
        min_units_per_size=min_units,
        max_units_per_size=max_units,
        comparable_sku_used=comp_sku
    )
    
    # Comparison summary
    current_allocated = base_run.get("total_allocated_units", 0)
    current_pool = base_run.get("allocation_pool_units", 0)
    
    sim_allocated = sim_output["total_allocated_units"]
    sim_pool = sim_output["allocation_pool_units"]
    
    diff_units = sim_allocated - current_allocated
    diff_pool = sim_pool - current_pool
    
    return {
        "is_simulation": True,
        "base_run_id": base_run.get("run_id"),
        "simulation_parameters": {
            "warehouse_stock": warehouse_stock,
            "allocation_pool_pct": alloc_pct,
            "min_units_per_size": min_units,
            "max_units_per_size": max_units,
            "planning_horizon_days": horizon,
            "comparable_sku": comp_sku
        },
        "current_result": {
            "allocation_pool_units": current_pool,
            "total_allocated_units": current_allocated,
            "store_count": base_run.get("store_count", 0)
        },
        "simulated_result": {
            "allocation_pool_units": sim_pool,
            "total_allocated_units": sim_allocated,
            "store_count": sim_output["store_count"]
        },
        "variance": {
            "allocation_pool_diff": diff_pool,
            "total_allocated_diff": diff_units,
            "pct_change": round((diff_units / current_allocated * 100.0), 2) if current_allocated > 0 else 0.0
        },
        "simulated_store_results": sim_output["store_results"][:15] # Top 15 sample comparison
    }
