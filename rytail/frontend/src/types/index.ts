export type UserRole = 
  | 'Admin'
  | 'Merchandiser'
  | 'Supply Chain / Planner'
  | 'Business User'
  | 'Data/Technical User';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface Store {
  id: number;
  store_code: string;
  store_name: string;
  country: string;
  region: string;
  state: string;
  city: string;
  store_type: string;
  store_grade: string;
  cluster: string;
  floor_area_sqft: number;
  store_capacity: number;
  category_capacity: Record<string, number>;
  is_active: boolean;
  is_eligible: boolean;
}

export interface Product {
  id: number;
  style_code: string;
  color: string;
  sku: string;
  product_name: string;
  brand: string;
  division: string;
  department: string;
  category: string;
  subcategory?: string;
  product_type: string;
  gender: string;
  fit: string;
  sleeve: string;
  pattern: string;
  length: string;
  season: string;
  lifecycle_status: string;
  cost_price: number;
  selling_price: number;
  mrp: number;
  is_active: boolean;
}

export interface AllocationResult {
  store_code: string;
  comparable_sku: string;
  similarity_score: number;
  first_5_week_sales: number;
  weekly_velocity: number;
  planning_demand: number;
  store_weight: number;
  base_allocation: number;
  surplus_allocation: number;
  final_allocation: number;
  override_quantity?: number;
  override_reason?: string;
  fallback_flag: boolean;
  size_split?: Record<string, number>;
  calculation_trace?: {
    explanation: string;
    store_weight_pct: number;
    planning_demand: number;
    base_units_per_size: number;
    surplus_units_received: number;
  };
}

export interface AllocationRun {
  run_id: string;
  version: string;
  target_sku: string;
  warehouse_code: string;
  planning_horizon_days: number;
  allocation_pool_pct: number;
  total_warehouse_stock: number;
  allocation_pool_units: number;
  total_allocated_units: number;
  store_count: number;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'APPROVED' | 'REJECTED';
  created_at: string;
  store_results: AllocationResult[];
}

export interface ReplenishmentResult {
  store_code: string;
  sku: string;
  size_code: string;
  current_stock: number;
  in_transit_stock: number;
  average_daily_sales: number;
  ros: number;
  wos: number;
  target_stock: number;
  raw_replenishment_qty: number;
  recommended_qty: number;
  priority_level: 'Critical' | 'High' | 'Medium' | 'Low';
  calculation_trace?: {
    explanation: string;
    target_formula: string;
    wos_weeks: number;
  };
}

export interface ReplenishmentRun {
  run_id: string;
  status: string;
  total_recommended_units: number;
  total_recommended_value: number;
  critical_count: number;
  high_count: number;
  created_at: string;
  results: ReplenishmentResult[];
}

export interface TransferRecommendation {
  donor_store_code: string;
  receiver_store_code: string;
  sku: string;
  size_code: string;
  donor_current_stock: number;
  donor_wos: number;
  receiver_current_stock: number;
  receiver_wos: number;
  receiver_demand_qty: number;
  transfer_qty: number;
  transfer_score: number;
  distance_km: number;
  reason: string;
}

export interface TransferRun {
  run_id: string;
  status: string;
  total_transfer_units: number;
  recommendation_count: number;
  created_at: string;
  recommendations: TransferRecommendation[];
}

export interface DataQualityReport {
  data_health_score: number;
  total_records_checked: number;
  invalid_records_count: number;
  issue_summary: Array<{
    rule: string;
    severity: string;
    count: number;
    details: any[];
  }>;
}

export interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  run_id?: string;
  entity_type?: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
  timestamp: string;
}
