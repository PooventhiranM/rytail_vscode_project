from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- Auth & User Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

# --- Master Data Schemas ---
class StoreOut(BaseModel):
    id: int
    store_code: str
    store_name: str
    country: str
    region: str
    state: str
    city: str
    store_type: str
    store_grade: str
    cluster: str
    floor_area_sqft: float
    store_capacity: int
    category_capacity: Dict[str, Any]
    is_active: bool
    is_eligible: bool

    class Config:
        from_attributes = True

class ProductSizeOut(BaseModel):
    size_code: str
    sort_order: int

    class Config:
        from_attributes = True

class ProductOut(BaseModel):
    id: int
    style_code: str
    color: str
    sku: str
    product_name: str
    brand: str
    division: str
    department: str
    category: str
    subcategory: Optional[str] = None
    product_type: str
    gender: str
    fit: str
    sleeve: str
    pattern: str
    length: str
    season: str
    lifecycle_status: str
    cost_price: float
    selling_price: float
    mrp: float
    is_active: bool
    sizes: List[ProductSizeOut] = []

    class Config:
        from_attributes = True

# --- Inventory & Sales ---
class InventoryOut(BaseModel):
    id: int
    location_type: str
    location_code: str
    sku: str
    size_code: str
    available_stock: int
    reserved_stock: int
    in_transit_stock: int
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Allocation Engine Schemas ---
class AllocationRunRequest(BaseModel):
    target_sku: str = Field("EXFP00035WHITECAP GRAY", description="New SKU to allocate")
    warehouse_code: str = Field("H01", description="Source warehouse code")
    planning_horizon_days: int = Field(12, description="Planning horizon in days")
    allocation_pool_pct: float = Field(52.4, description="Allocation pool percentage of available stock")
    min_units_per_size: int = Field(2, description="Minimum units per size per store")
    max_units_per_size: int = Field(10, description="Maximum units per size per store")
    store_group: Optional[str] = Field(None, description="Optional store region/grade filter")
    comparable_sku: Optional[str] = Field(None, description="Optional forced comparable SKU")
    recalculate_weights: bool = Field(False, description="Recalculate store weights even if previous run exists")

class AllocationResultOut(BaseModel):
    store_code: str
    comparable_sku: str
    similarity_score: float
    first_5_week_sales: float
    weekly_velocity: float
    planning_demand: float
    store_weight: float
    base_allocation: int
    surplus_allocation: int
    final_allocation: int
    override_quantity: Optional[int] = None
    override_reason: Optional[str] = None
    fallback_flag: bool
    size_split: Optional[Dict[str, int]] = None
    calculation_trace: Optional[Dict[str, Any]] = None

class AllocationRunResponse(BaseModel):
    run_id: str
    version: str
    target_sku: str
    warehouse_code: str
    planning_horizon_days: int
    allocation_pool_pct: float
    total_warehouse_stock: int
    allocation_pool_units: int
    total_allocated_units: int
    store_count: int
    status: str
    created_at: datetime
    store_results: List[AllocationResultOut] = []

class AllocationOverrideRequest(BaseModel):
    store_code: str
    new_quantity: int
    reason: str

# --- Replenishment Schemas ---
class ReplenishmentRunRequest(BaseModel):
    target_sku: Optional[str] = None
    lead_time_days: int = 5
    review_period_days: int = 7
    safety_stock_units: int = 3
    store_group: Optional[str] = None

class ReplenishmentResultOut(BaseModel):
    store_code: str
    sku: str
    size_code: str
    current_stock: int
    in_transit_stock: int
    average_daily_sales: float
    ros: float
    wos: float
    target_stock: int
    raw_replenishment_qty: int
    recommended_qty: int
    priority_level: str
    calculation_trace: Optional[Dict[str, Any]] = None

class ReplenishmentRunResponse(BaseModel):
    run_id: str
    status: str
    total_recommended_units: int
    total_recommended_value: float
    critical_count: int
    high_count: int
    created_at: datetime
    results: List[ReplenishmentResultOut] = []

# --- Transfer Schemas ---
class TransferRunRequest(BaseModel):
    target_sku: Optional[str] = None
    donor_wos_threshold: float = 6.0
    receiver_wos_threshold: float = 2.0

class TransferRecommendationOut(BaseModel):
    donor_store_code: str
    receiver_store_code: str
    sku: str
    size_code: str
    donor_current_stock: int
    donor_wos: float
    receiver_current_stock: int
    receiver_wos: float
    receiver_demand_qty: float
    transfer_qty: int
    transfer_score: float
    distance_km: float
    reason: str

class TransferRunResponse(BaseModel):
    run_id: str
    status: str
    total_transfer_units: int
    recommendation_count: int
    created_at: datetime
    recommendations: List[TransferRecommendationOut] = []

# --- Simulation Schemas ---
class SimulationRequest(BaseModel):
    base_run_id: str
    warehouse_stock: Optional[int] = None
    allocation_pool_pct: Optional[float] = None
    min_units_per_size: Optional[int] = None
    max_units_per_size: Optional[int] = None
    planning_horizon_days: Optional[int] = None
    comparable_sku: Optional[str] = None

# --- AI Copilot Schemas ---
class CopilotQueryRequest(BaseModel):
    query: str

class CopilotQueryResponse(BaseModel):
    query: str
    answer: str
    tool_calls_made: List[Dict[str, Any]] = []
    data: Optional[Dict[str, Any]] = None
    active_agent: Optional[str] = "Rytail Orchestrator Agent"
    workflow_state: Optional[str] = "RECOMMENDATION"
    lifecycle_timeline: Optional[List[Dict[str, Any]]] = None
