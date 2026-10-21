from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "Admin"
    MERCHANDISER = "Merchandiser"
    SUPPLY_CHAIN_PLANNER = "Supply Chain / Planner"
    BUSINESS_USER = "Business User"
    DATA_TECHNICAL_USER = "Data/Technical User"

class RunStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class RunTypeEnum(str, enum.Enum):
    FIRST_ALLOCATION = "FIRST_ALLOCATION"
    REPLENISHMENT = "REPLENISHMENT"
    STORE_TRANSFER = "STORE_TRANSFER"

class PriorityLevelEnum(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

# --- User & Role Management ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=RoleEnum.MERCHANDISER.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Store Master ---
class Store(Base):
    __tablename__ = "stores"
    id = Column(Integer, primary_key=True, index=True)
    store_code = Column(String(50), unique=True, index=True, nullable=False)
    store_name = Column(String(255), nullable=False)
    country = Column(String(100), default="India")
    region = Column(String(100), index=True, nullable=False)
    state = Column(String(100), nullable=False)
    city = Column(String(100), index=True, nullable=False)
    store_type = Column(String(50), default="Exclusive")  # Exclusive, MBO, Flagship
    store_grade = Column(String(10), default="A") # A, B, C, D
    cluster = Column(String(50), default="Metro High Demand")
    floor_area_sqft = Column(Float, default=2500.0)
    store_capacity = Column(Integer, default=5000)
    category_capacity = Column(JSON, default=dict) # e.g. {"MENS WEAR": 2000}
    is_active = Column(Boolean, default=True)
    is_eligible = Column(Boolean, default=True)
    exclusion_reason = Column(String(255), nullable=True)
    opening_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Warehouse Master ---
class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_code = Column(String(50), unique=True, index=True, nullable=False)
    warehouse_name = Column(String(255), nullable=False)
    region = Column(String(100), nullable=False)
    capacity = Column(Integer, default=500000)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Product Master ---
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    style_code = Column(String(100), index=True, nullable=False)
    color = Column(String(100), index=True, nullable=False)
    sku = Column(String(200), unique=True, index=True, nullable=False) # Style + Color
    product_name = Column(String(255), nullable=False)
    brand = Column(String(100), default="RYTAIL BRANDS")
    division = Column(String(100), index=True, nullable=False)   # e.g. MENS WEAR
    department = Column(String(100), index=True, nullable=False) # e.g. EXPLORER TEES
    category = Column(String(100), index=True, nullable=False)   # e.g. POLOS
    subcategory = Column(String(100), nullable=True)
    product_type = Column(String(100), index=True, nullable=False) # e.g. IMPRESSION POLO
    gender = Column(String(50), default="Men")
    fit = Column(String(50), default="REGULAR FIT")
    sleeve = Column(String(50), default="HALF SLEEVE")
    pattern = Column(String(50), default="SOLID")
    length = Column(String(50), default="REGULAR")
    season = Column(String(50), default="SS2026")
    lifecycle_status = Column(String(50), default="NEW_LAUNCH") # NEW_LAUNCH, ACTIVE, CARRYOVER, DISCONTINUED
    cost_price = Column(Float, default=499.0)
    selling_price = Column(Float, default=1299.0)
    mrp = Column(Float, default=1499.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sizes = relationship("ProductSize", back_populates="product", cascade="all, delete-orphan")

class ProductSize(Base):
    __tablename__ = "product_sizes"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    size_code = Column(String(20), nullable=False) # S, M, L, XL, XXL
    sort_order = Column(Integer, default=1)
    
    product = relationship("Product", back_populates="sizes")

# --- Inventory & Stock Position ---
class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    location_type = Column(String(20), index=True, nullable=False) # WAREHOUSE, STORE
    location_code = Column(String(50), index=True, nullable=False) # e.g. H01 or E0100
    sku = Column(String(200), index=True, nullable=False)
    size_code = Column(String(20), index=True, nullable=False)
    available_stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0)
    in_transit_stock = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow)

# --- Sales History ---
class SalesDaily(Base):
    __tablename__ = "sales_daily"
    id = Column(Integer, primary_key=True, index=True)
    sale_date = Column(DateTime, index=True, nullable=False)
    store_code = Column(String(50), index=True, nullable=False)
    sku = Column(String(200), index=True, nullable=False)
    size_code = Column(String(20), index=True, nullable=False)
    sales_qty = Column(Integer, default=0)
    sales_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)

# --- Comparable Product Mapping ---
class ComparableProduct(Base):
    __tablename__ = "comparable_products"
    id = Column(Integer, primary_key=True, index=True)
    target_sku = Column(String(200), index=True, nullable=False)
    comparable_sku = Column(String(200), index=True, nullable=False)
    similarity_score = Column(Float, nullable=False) # e.g. 0.99
    rank = Column(Integer, default=1)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Size Curves ---
class SizeCurve(Base):
    __tablename__ = "size_curves"
    id = Column(Integer, primary_key=True, index=True)
    hierarchy_level = Column(String(50), nullable=False) # STORE_PRODUCT, STORE_CATEGORY, CLUSTER_CATEGORY, NETWORK_CATEGORY, NETWORK_DEFAULT
    level_key = Column(String(200), nullable=False) # e.g. "E0100|POLOS" or "GLOBAL"
    size_ratios = Column(JSON, nullable=False) # {"S": 0.1096, "M": 0.2498, "L": 0.3367, "XL": 0.2104, "XXL": 0.0936}
    updated_at = Column(DateTime, default=datetime.utcnow)

# --- Planning Runs ---
class AllocationRun(Base):
    __tablename__ = "allocation_runs"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. FA-20260924-001
    run_type = Column(String(50), default=RunTypeEnum.FIRST_ALLOCATION.value)
    version = Column(String(20), default="1.0")
    target_sku = Column(String(200), nullable=False)
    warehouse_code = Column(String(50), nullable=False)
    planning_horizon_days = Column(Integer, default=12)
    allocation_pool_pct = Column(Float, default=52.4)
    total_warehouse_stock = Column(Integer, nullable=False)
    allocation_pool_units = Column(Integer, nullable=False)
    total_allocated_units = Column(Integer, default=0)
    store_count = Column(Integer, default=0)
    status = Column(String(50), default=RunStatusEnum.DRAFT.value)
    input_snapshot = Column(JSON, default=dict)
    run_by_user = Column(String(100), default="System User")
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

class AllocationResult(Base):
    __tablename__ = "allocation_results"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), ForeignKey("allocation_runs.run_id"), nullable=False)
    store_code = Column(String(50), index=True, nullable=False)
    comparable_sku = Column(String(200), nullable=False)
    similarity_score = Column(Float, default=1.0)
    first_5_week_sales = Column(Float, default=0.0)
    weekly_velocity = Column(Float, default=0.0)
    planning_demand = Column(Float, default=0.0)
    store_weight = Column(Float, default=0.0)
    base_allocation = Column(Integer, default=0)
    surplus_allocation = Column(Integer, default=0)
    final_allocation = Column(Integer, default=0)
    override_quantity = Column(Integer, nullable=True)
    override_reason = Column(String(255), nullable=True)
    fallback_flag = Column(Boolean, default=False)
    calculation_trace = Column(JSON, default=dict)

class AllocationSizeResult(Base):
    __tablename__ = "allocation_size_results"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), index=True, nullable=False)
    store_code = Column(String(50), index=True, nullable=False)
    size_code = Column(String(20), nullable=False)
    allocated_qty = Column(Integer, default=0)
    slot_score = Column(Float, default=0.0)

# --- Replenishment Runs ---
class ReplenishmentRun(Base):
    __tablename__ = "replenishment_runs"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default=RunStatusEnum.DRAFT.value)
    total_recommended_units = Column(Integer, default=0)
    total_recommended_value = Column(Float, default=0.0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    input_snapshot = Column(JSON, default=dict)
    run_by_user = Column(String(100), default="System User")
    created_at = Column(DateTime, default=datetime.utcnow)

class ReplenishmentResult(Base):
    __tablename__ = "replenishment_results"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), ForeignKey("replenishment_runs.run_id"), nullable=False)
    store_code = Column(String(50), index=True, nullable=False)
    sku = Column(String(200), index=True, nullable=False)
    size_code = Column(String(20), nullable=False)
    current_stock = Column(Integer, default=0)
    in_transit_stock = Column(Integer, default=0)
    average_daily_sales = Column(Float, default=0.0)
    ros = Column(Float, default=0.0)
    wos = Column(Float, default=0.0)
    target_stock = Column(Integer, default=0)
    raw_replenishment_qty = Column(Integer, default=0)
    recommended_qty = Column(Integer, default=0)
    priority_level = Column(String(20), default=PriorityLevelEnum.MEDIUM.value)
    calculation_trace = Column(JSON, default=dict)

# --- Transfer Runs ---
class TransferRun(Base):
    __tablename__ = "transfer_runs"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default=RunStatusEnum.DRAFT.value)
    total_transfer_units = Column(Integer, default=0)
    recommendation_count = Column(Integer, default=0)
    input_snapshot = Column(JSON, default=dict)
    run_by_user = Column(String(100), default="System User")
    created_at = Column(DateTime, default=datetime.utcnow)

class TransferRecommendation(Base):
    __tablename__ = "transfer_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), ForeignKey("transfer_runs.run_id"), nullable=False)
    donor_store_code = Column(String(50), index=True, nullable=False)
    receiver_store_code = Column(String(50), index=True, nullable=False)
    sku = Column(String(200), index=True, nullable=False)
    size_code = Column(String(20), nullable=False)
    donor_current_stock = Column(Integer, default=0)
    donor_wos = Column(Float, default=0.0)
    receiver_current_stock = Column(Integer, default=0)
    receiver_wos = Column(Float, default=0.0)
    receiver_demand_qty = Column(Float, default=0.0)
    transfer_qty = Column(Integer, default=0)
    transfer_score = Column(Float, default=0.0)
    distance_km = Column(Float, default=50.0)
    reason = Column(Text, nullable=False)

# --- Configuration & Governance ---
class PlanningParameter(Base):
    __tablename__ = "planning_parameters"
    id = Column(Integer, primary_key=True, index=True)
    param_key = Column(String(100), unique=True, nullable=False)
    param_value = Column(String(255), nullable=False)
    param_type = Column(String(50), default="STRING") # INT, FLOAT, STRING, JSON, BOOL
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    run_id = Column(String(100), nullable=True)
    entity_type = Column(String(100), nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class DataQualityLog(Base):
    __tablename__ = "data_quality_logs"
    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False)
    severity = Column(String(50), default="ERROR") # WARNING, ERROR, CRITICAL
    invalid_record_count = Column(Integer, default=0)
    details = Column(JSON, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), index=True, nullable=False)
    endpoint = Column(String(255), index=True, nullable=False)
    request_hash = Column(String(64), nullable=False)
    response_json = Column(JSON, nullable=True)
    status = Column(String(50), default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)

