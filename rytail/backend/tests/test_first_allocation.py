from app.engines.comparable_sku import find_comparable_skus
from app.engines.store_demand import calculate_store_demand
from app.engines.first_allocation import run_first_allocation
from app.engines.replenishment import run_replenishment
from app.engines.store_transfer import run_store_transfers

def test_allocation_pool_exact_math():
    """
    Tests exact prompt deterministic scenario:
    Warehouse Stock = 4435, Allocation % = 52.4%
    Expected Allocation Pool = 2323 units.
    Base (193 stores * 5 sizes * 2 units) = 1930 units.
    Surplus = 393 units.
    Total allocated MUST be exactly 2323 units (<= 2323 Hard Gate).
    """
    wh_stock = 4435
    alloc_pct = 52.4
    
    stores_data = {}
    for i in range(1, 194):
        s_code = f"E{i:04d}"
        w = 0.00659 if s_code == "E0100" else (1.0 - 0.00659) / 192.0
        stores_data[s_code] = {"demand": 11.66 if s_code == "E0100" else 9.0, "weight": w}
        
    size_curves = {
        s: {"S": 0.1096, "M": 0.2498, "L": 0.3367, "XL": 0.2104, "XXL": 0.0936}
        for s in stores_data
    }

    result = run_first_allocation(
        warehouse_stock=wh_stock,
        allocation_pool_pct=alloc_pct,
        stores_demand_data=stores_data,
        size_curves_by_store=size_curves,
        min_units_per_size=2,
        max_units_per_size=10
    )

    assert result["allocation_pool_units"] == 2323
    assert result["total_allocated_units"] == 2323
    assert result["surplus_distributed"] == 393
    assert result["total_allocated_units"] <= result["allocation_pool_units"]

def test_store_e0100_allocation_trace():
    """
    Verifies store E0100 receives exactly 13 units (Base 10 + 3 Surplus).
    """
    wh_stock = 4435
    alloc_pct = 52.4
    
    stores_data = {}
    for i in range(1, 194):
        s_code = f"E{i:04d}"
        w = 0.00659 if s_code == "E0100" else (1.0 - 0.00659) / 192.0
        stores_data[s_code] = {"demand": 11.66 if s_code == "E0100" else 9.0, "weight": w}
        
    size_curves = {
        s: {"S": 0.1096, "M": 0.2498, "L": 0.3367, "XL": 0.2104, "XXL": 0.0936}
        for s in stores_data
    }

    res = run_first_allocation(
        warehouse_stock=wh_stock,
        allocation_pool_pct=alloc_pct,
        stores_demand_data=stores_data,
        size_curves_by_store=size_curves,
        min_units_per_size=2
    )

    e100_res = next(r for r in res["store_results"] if r["store_code"] == "E0100")
    assert e100_res["final_allocation"] == 13
    assert e100_res["base_allocation"] == 10
    assert e100_res["surplus_allocation"] == 3
    assert "E0100 allocated 13 units" in e100_res["calculation_trace"]["explanation"]

def test_hard_gate_violation_rejection():
    stores_data = {f"E{i:04d}": {"demand": 10.0, "weight": 0.5} for i in range(1, 3)}
    size_curves = {s: {"S":0.2,"M":0.2,"L":0.2,"XL":0.2,"XXL":0.2} for s in stores_data}
    
    res = run_first_allocation(
        warehouse_stock=10,
        allocation_pool_pct=10.0,
        stores_demand_data=stores_data,
        size_curves_by_store=size_curves,
        min_units_per_size=1
    )
    assert res["total_allocated_units"] <= res["allocation_pool_units"]

def test_comparable_sku_hard_gates():
    target = {
        "sku": "NEW_POLO", "division": "MENS WEAR", "department": "EXPLORER TEES",
        "product_type": "IMPRESSION POLO", "sleeve": "HALF SLEEVE", "fit": "REGULAR FIT",
        "length": "REGULAR", "pattern": "SOLID", "selling_price": 1299.0, "season": "SS2026"
    }
    candidates = [
        {
            "sku": "MATCH_POLO", "division": "MENS WEAR", "department": "EXPLORER TEES",
            "product_type": "IMPRESSION POLO", "sleeve": "HALF SLEEVE", "fit": "REGULAR FIT",
            "length": "REGULAR", "pattern": "SOLID", "selling_price": 1299.0, "season": "SS2026"
        },
        {
            "sku": "WRONG_DEPT", "division": "MENS WEAR", "department": "WOMENS TEES",
            "product_type": "IMPRESSION POLO", "sleeve": "HALF SLEEVE", "fit": "REGULAR FIT",
            "length": "REGULAR", "pattern": "SOLID", "selling_price": 1299.0, "season": "SS2026"
        }
    ]
    results = find_comparable_skus(target, candidates)
    assert len(results) == 1
    assert results[0]["comparable_sku"] == "MATCH_POLO"
    assert results[0]["similarity_pct"] == 100.0

def test_replenishment_formula():
    inv_items = [{
        "store_code": "E0100", "sku": "EXFP00035WHITECAP GRAY", "size_code": "M",
        "available_stock": 12, "in_transit_stock": 0, "average_daily_sales": 2.0,
        "store_capacity": 100, "warehouse_avail": 100, "is_active": True
    }]
    recs = run_replenishment(inv_items, lead_time_days=5, review_period_days=7, safety_stock_units=3)
    assert recs[0]["target_stock"] == 27
    assert recs[0]["recommended_qty"] == 15
