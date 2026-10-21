import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.db.models import (
    User, Store, Warehouse, Product, ProductSize, Inventory, SalesDaily,
    ComparableProduct, SizeCurve, AllocationRun, AllocationResult, AllocationSizeResult,
    ReplenishmentRun, ReplenishmentResult, TransferRun, TransferRecommendation,
    PlanningParameter, DataQualityLog, RoleEnum, PriorityLevelEnum, RunStatusEnum
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if already seeded
        if db.query(User).filter(User.username == "admin").first():
            print("Database already seeded.")
            return

        print("Seeding database with realistic retail dataset...")

        # 1. Users & Roles
        users = [
            User(username="admin", email="admin@rytail.com", full_name="System Admin", hashed_password="adminpassword", role=RoleEnum.ADMIN.value),
            User(username="merchandiser", email="merch@rytail.com", full_name="Main Merchandiser", hashed_password="merchpassword", role=RoleEnum.MERCHANDISER.value),
            User(username="planner", email="planner@rytail.com", full_name="Supply Chain Planner", hashed_password="plannerpassword", role=RoleEnum.SUPPLY_CHAIN_PLANNER.value),
            User(username="business", email="business@rytail.com", full_name="Business Analyst", hashed_password="businesspassword", role=RoleEnum.BUSINESS_USER.value),
            User(username="data_eng", email="data@rytail.com", full_name="Data Engineer", hashed_password="datapassword", role=RoleEnum.DATA_TECHNICAL_USER.value),
        ]
        db.add_all(users)

        # 2. Warehouse Master
        wh01 = Warehouse(
            warehouse_code="H01",
            warehouse_name="Central Distribution Warehouse H01",
            region="National Hub",
            capacity=500000,
            is_active=True
        )
        db.add(wh01)

        # 3. Store Master (193 Stores: E0100 to E0292)
        stores = []
        regions = ["North", "South", "East", "West", "Central"]
        grades = ["A", "B", "C", "D"]
        cities = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Lucknow"]
        
        for i in range(100, 293):
            store_code = f"E{i:04d}"
            region = regions[i % len(regions)]
            city = cities[i % len(cities)]
            grade = grades[0] if i == 100 else grades[i % len(grades)] # E0100 is Grade A
            
            s = Store(
                store_code=store_code,
                store_name=f"Rytail Flagship {city} #{i-99}",
                country="India",
                region=region,
                state=f"State {region}",
                city=city,
                store_type="Exclusive" if grade in ["A", "B"] else "MBO",
                store_grade=grade,
                cluster="Metro High Demand" if grade == "A" else "Standard Retail",
                floor_area_sqft=4000.0 if grade == "A" else 2000.0,
                store_capacity=6000 if grade == "A" else 3000,
                category_capacity={"POLOS": 1500, "EXPLORER TEES": 2500},
                is_active=True,
                is_eligible=True
            )
            stores.append(s)
        db.add_all(stores)
        db.commit()

        # 4. Product Master
        # Target new launch: EXFP00035WHITECAP GRAY
        # Comparable SKU: EXFP00031JET BLACK
        target_product = Product(
            style_code="EXFP00035",
            color="WHITECAP GRAY",
            sku="EXFP00035WHITECAP GRAY",
            product_name="Explorer Impression Polo - Whitecap Gray",
            brand="RYTAIL BRANDS",
            division="MENS WEAR",
            department="EXPLORER TEES",
            category="POLOS",
            subcategory="SHORT SLEEVE POLOS",
            product_type="IMPRESSION POLO",
            gender="Men",
            fit="REGULAR FIT",
            sleeve="HALF SLEEVE",
            pattern="SOLID",
            length="REGULAR",
            season="SS2026",
            lifecycle_status="NEW_LAUNCH",
            cost_price=450.0,
            selling_price=1299.0,
            mrp=1499.0,
            is_active=True
        )
        
        comparable_product = Product(
            style_code="EXFP00031",
            color="JET BLACK",
            sku="EXFP00031JET BLACK",
            product_name="Explorer Impression Polo - Jet Black",
            brand="RYTAIL BRANDS",
            division="MENS WEAR",
            department="EXPLORER TEES",
            category="POLOS",
            subcategory="SHORT SLEEVE POLOS",
            product_type="IMPRESSION POLO",
            gender="Men",
            fit="REGULAR FIT",
            sleeve="HALF SLEEVE",
            pattern="SOLID",
            length="REGULAR",
            season="SS2026",
            lifecycle_status="ACTIVE",
            cost_price=430.0,
            selling_price=1299.0,
            mrp=1499.0,
            is_active=True
        )
        
        additional_product = Product(
            style_code="EXFP00010",
            color="NAVY BLUE",
            sku="EXFP00010NAVY BLUE",
            product_name="Classic Pique Polo - Navy Blue",
            brand="RYTAIL BRANDS",
            division="MENS WEAR",
            department="EXPLORER TEES",
            category="POLOS",
            subcategory="SHORT SLEEVE POLOS",
            product_type="CLASSIC POLO",
            gender="Men",
            fit="SLIM FIT",
            sleeve="HALF SLEEVE",
            pattern="STRIPED",
            length="REGULAR",
            season="SS2026",
            lifecycle_status="ACTIVE",
            cost_price=480.0,
            selling_price=1399.0,
            mrp=1599.0,
            is_active=True
        )
        
        db.add_all([target_product, comparable_product, additional_product])
        db.commit()

        # Sizes for products
        sizes_list = ["S", "M", "L", "XL", "XXL"]
        for p in [target_product, comparable_product, additional_product]:
            for idx, sz in enumerate(sizes_list):
                db.add(ProductSize(product_id=p.id, size_code=sz, sort_order=idx+1))

        # 5. Warehouse Inventory (Warehouse H01 has 4435 units of Target Product)
        # Size distribution at Warehouse H01
        wh_size_distribution = {"S": 486, "M": 1108, "L": 1493, "XL": 933, "XXL": 415} # Sum = 4435
        for sz, qty in wh_size_distribution.items():
            db.add(Inventory(
                location_type="WAREHOUSE",
                location_code="H01",
                sku="EXFP00035WHITECAP GRAY",
                size_code=sz,
                available_stock=qty,
                reserved_stock=0,
                in_transit_stock=0
            ))

        # Add warehouse stock for comparable product
        for sz in sizes_list:
            db.add(Inventory(
                location_type="WAREHOUSE",
                location_code="H01",
                sku="EXFP00031JET BLACK",
                size_code=sz,
                available_stock=1000,
                reserved_stock=50,
                in_transit_stock=0
            ))

        # 6. Store Inventory & Sales History for Comparable Product EXFP00031JET BLACK
        # For Store E0100: First 5 Week Sales = 34 units (Vs = 6.8, Ds = 11.66)
        today = datetime.utcnow()
        for s_idx, store in enumerate(stores):
            s_code = store.store_code
            
            # E0100 gets 34 units first 5 week sales; others vary around 25-45 units
            if s_code == "E0100":
                f5_sales = 34.0
            else:
                f5_sales = 25.0 + ((s_idx * 7) % 25)
                
            # Create daily sales records over past 35 days (5 weeks)
            daily_qty = f5_sales / 35.0
            for day in range(35):
                s_date = today - timedelta(days=day)
                db.add(SalesDaily(
                    sale_date=s_date,
                    store_code=s_code,
                    sku="EXFP00031JET BLACK",
                    size_code=sizes_list[day % len(sizes_list)],
                    sales_qty=int(math.ceil(daily_qty)),
                    sales_amount=round(daily_qty * 1299.0, 2)
                ))
                
            # Store inventory positions for Replenishment & Transfer demo
            curr_stock = 12 if s_code == "E0100" else (20 if s_idx % 2 == 0 else 2)
            for sz_idx, sz in enumerate(sizes_list):
                db.add(Inventory(
                    location_type="STORE",
                    location_code=s_code,
                    sku="EXFP00035WHITECAP GRAY" if s_idx % 3 == 0 else "EXFP00031JET BLACK",
                    size_code=sz,
                    available_stock=max(0, curr_stock + (sz_idx - 2)),
                    reserved_stock=0,
                    in_transit_stock=1 if s_idx % 4 == 0 else 0
                ))

        # 7. Size Curves (Network Default: S=10.96%, M=24.98%, L=33.67%, XL=21.04%, XXL=9.36%)
        network_curve = SizeCurve(
            hierarchy_level="NETWORK_DEFAULT",
            level_key="NETWORK_DEFAULT",
            size_ratios={"S": 0.1096, "M": 0.2498, "L": 0.3367, "XL": 0.2104, "XXL": 0.0936}
        )
        db.add(network_curve)

        # 8. Comparable Mapping
        comp_map = ComparableProduct(
            target_sku="EXFP00035WHITECAP GRAY",
            comparable_sku="EXFP00031JET BLACK",
            similarity_score=0.99,
            rank=1,
            reason="Passed all hard gates (Division: MENS WEAR, Dept: EXPLORER TEES, Type: IMPRESSION POLO, Sleeve: HALF SLEEVE, Fit: REGULAR FIT). Matched soft attributes 99%."
        )
        db.add(comp_map)

        # 9. Initial Seed Allocation Run (FA-20260924-001)
        # Pool = 4435 * 52.4% = 2323 units.
        # 193 stores x 5 sizes x 2 base = 1930 base units.
        # Surplus = 393 units distributed to highest ranked slots.
        alloc_run = AllocationRun(
            run_id="FA-20260924-001",
            run_type="FIRST_ALLOCATION",
            version="1.0",
            target_sku="EXFP00035WHITECAP GRAY",
            warehouse_code="H01",
            planning_horizon_days=12,
            allocation_pool_pct=52.4,
            total_warehouse_stock=4435,
            allocation_pool_units=2323,
            total_allocated_units=2323,
            store_count=193,
            status=RunStatusEnum.APPROVED.value,
            input_snapshot={"comparable_sku": "EXFP00031JET BLACK", "allocation_pool_pct": 52.4},
            run_by_user="merchandiser",
            approved_at=today
        )
        db.add(alloc_run)
        db.commit()

        # Add Allocation Results for E0100 and sample stores
        # Store E0100 gets 13 units (S:2, M:3, L:3, XL:3, XXL:2)
        e100_res = AllocationResult(
            run_id="FA-20260924-001",
            store_code="E0100",
            comparable_sku="EXFP00031JET BLACK",
            similarity_score=0.99,
            first_5_week_sales=34.0,
            weekly_velocity=6.8,
            planning_demand=11.66,
            store_weight=0.00659,
            base_allocation=10,
            surplus_allocation=3,
            final_allocation=13,
            calculation_trace={
                "explanation": "E0100 received 13 units because its comparable SKU demand generated a store weight of 0.66%. The allocation uses a 2-unit base for all sizes and an additional unit for M, L and XL based on the highest store-size demand scores."
            }
        )
        db.add(e100_res)

        for sz, qty in [("S", 2), ("M", 3), ("L", 3), ("XL", 3), ("XXL", 2)]:
            db.add(AllocationSizeResult(
                run_id="FA-20260924-001",
                store_code="E0100",
                size_code=sz,
                allocated_qty=qty,
                slot_score=0.00659 * (0.2498 if sz == "M" else 0.20)
            ))

        # 10. Planning Parameters Defaults
        params = [
            PlanningParameter(param_key="planning_horizon_days", param_value="12", param_type="INT", description="Default planning horizon in days"),
            PlanningParameter(param_key="allocation_pool_pct", param_value="52.4", param_type="FLOAT", description="Default warehouse allocation pool percentage"),
            PlanningParameter(param_key="min_units_per_size", param_value="2", param_type="INT", description="Minimum display quantity per size per store"),
            PlanningParameter(param_key="max_units_per_size", param_value="10", param_type="INT", description="Maximum allowed stock per size per store"),
            PlanningParameter(param_key="lead_time_days", param_value="5", param_type="INT", description="Supplier / Warehouse to Store lead time"),
            PlanningParameter(param_key="review_period_days", param_value="7", param_type="INT", description="Replenishment review cycle period"),
            PlanningParameter(param_key="safety_stock_units", param_value="3", param_type="INT", description="Buffer safety stock units"),
        ]
        db.add_all(params)
        db.commit()

        print("Database seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
