# Rytail Data Model

All tables: `id UUID PK`, `created_at`, `updated_at` (except append-only tables, which have no
`updated_at`), and `is_demo BOOLEAN` where demo seeding applies. Use Alembic for every change.

## Identity & access
- `users` (email UNIQUE, name, password_hash, is_active)
- `roles` (name UNIQUE), `permissions` (code UNIQUE), `role_permissions`, `user_roles`
- `user_store_scopes` (user_id, store_id) UNIQUE(user_id, store_id)

## Network
- `warehouses` (code UNIQUE, name, lat, lon, capacity, is_active)
- `stores` (code UNIQUE, name, region, state, city, store_type, lat, lon, status, assigned_warehouse_id FK)
- `inventory_locations` (store_id FK, type ENUM[SALES_FLOOR, BACKROOM, DAMAGED, QUARANTINE, GOODS_RECEIVING, IN_TRANSIT], code) UNIQUE(store_id, type)
- `route_cache` (warehouse_id, store_id, provider, road_km, eta_min, fetched_at) UNIQUE(warehouse_id, store_id, provider)

## Product hierarchy: Style → Colour → Size → SKU → Barcode
- `styles` (code UNIQUE, name, category, season, brand)
- `colours` (style_id, code, name) UNIQUE(style_id, code)
- `skus` (code UNIQUE, style_id, colour_id, size, is_active)
- `barcodes` (code UNIQUE, sku_id FK, is_primary)
- `comparable_products` (target_style_id, comparable_sku_id, relevance_score, source, approved_by, approved_at) UNIQUE(target_style_id, comparable_sku_id)

## Sales & stock
- `sales_history` (store_id, sku_id, sale_date, units, net_value, source lineage cols) UNIQUE(store_id, sku_id, sale_date, source_system)
  INDEX(sku_id, sale_date), INDEX(store_id, sale_date)
- `inventory_balances` (store_id, location_id, sku_id, qty CHECK(qty >= 0), version) **UNIQUE(store_id, location_id, sku_id)**
- `inventory_transactions` (append-only) (type ENUM[INTERNAL_MOVE, ADJUSTMENT, TRANSFER_DISPATCH, TRANSFER_RECEIPT, RECEIPT, SALE, REVERSAL, IMPORT_OPENING], store_id, sku_id, from_location_id, to_location_id, qty CHECK(qty > 0), reference_type, reference_id, reverses_transaction_id FK NULL, idempotency_key UNIQUE, reason, posted_by, posted_at)
  — revoke UPDATE/DELETE for the app role or enforce with a trigger.
- `mdq_rules` (scope ENUM[SKU_STORE, SKU, CATEGORY_STORETYPE, CATEGORY], sku_id, store_id, category, store_type, mdq, rule_version, effective_from)

## Allocation
- `allocation_scenarios` (style_id/sku_id, pool, status, config_json, algorithm_version, data_as_of, version, parent_scenario_id, created_by)
- `allocation_results` (scenario_id, store_id, weekly_velocity, demand, share, preliminary, final_qty, eligibility, constraint_impact_json, note) UNIQUE(scenario_id, store_id)
- `nextail_results` (style_id/sku_id, store_id, qty, run_reference, import_job_id) UNIQUE(sku_id, store_id, run_reference)

## Replenishment
- `replenishment_rules` (scope, target_stock, safety_stock, lead_time_days, pack_size, horizon_days, status ENUM[CONFIRMED, ASSUMED, BLOCKED], rule_version)
- `replenishment_runs` (config_json, algorithm_version, data_as_of, status)
- `replenishment_tasks` (run_id, store_id, sku_id, inventory_position, days_of_cover, target, display_shortage, required_qty, recommended_qty, reason_codes, status, workflow_id)

## Store operations
- `stock_counts` (store_id, location_id NULL, status ENUM[OPEN, COUNTING, SUBMITTED, RECOUNT, APPROVED, POSTED, CANCELLED], started_by)
- `stock_count_lines` (count_id, sku_id, system_qty_snapshot, counted_qty, recount_qty, variance) UNIQUE(count_id, sku_id, location_id)
- `stock_adjustments` (count_id NULL, store_id, location_id, sku_id, qty_delta, reason, status, approved_by, transaction_id)
- `transfers` (from_store_id, to_store_id, status ENUM[DRAFT, PENDING_APPROVAL, APPROVED, DISPATCHED, PARTIALLY_RECEIVED, RECEIVED, EXCEPTION, CANCELLED], created_by, approved_by)
- `transfer_lines` (transfer_id, sku_id, qty_requested, qty_dispatched, qty_received, exception_reason)

## Data integration
- `import_jobs` (dataset, file_name, checksum, mode ENUM[REPLACE, APPEND, UPSERT], scope_json, mapping_version, status, counts_json, created_by)
- `staging_<dataset>` (import_job_id, row_number, raw_json, parsed cols, errors_json, warnings_json)
- `column_mappings` (dataset, version, mapping_json) UNIQUE(dataset, version)
- `connectors` (type, name, config_json, secret_ref, status ENUM[NOT_CONFIGURED, SIMULATED, ACTIVE, ERROR, DISABLED], schedule_cron, source_priority)
- `sync_runs` (connector_id, status, started_at, finished_at, processed, inserted, updated, errors, last_error, cursor)
- Lineage columns on every imported table: `source_system, source_record_id, import_job_id, source_updated_at, mapping_version`

## Governance
- `business_rules` (key UNIQUE per version, value_json, status ENUM[CONFIRMED, ASSUMED, BLOCKED_PENDING_CONFIRMATION], version, confirmed_by, confirmed_at)
- `workflows` (type, state, entity_type, entity_id, rule_versions_json, created_by)
- `workflow_events` (append-only: workflow_id, from_state, to_state, actor_type ENUM[USER, AGENT, SYSTEM], actor_id, reason, at)
- `approvals` (workflow_id, requested_by, approver_id, decision, comment, decided_at, threshold_rule_id)
- `agent_runs` (user_id, command, status, orchestrator_plan_json, final_summary_json, started_at, finished_at)
- `agent_steps` (run_id, agent, tool, input_json, output_json, status, error, duration_ms)
- `audit_logs` (append-only: actor, action, entity_type, entity_id, before_json, after_json, correlation_id, at)
- `idempotency_keys` (key, user_id, endpoint, request_hash, response_json, status) UNIQUE(key, user_id, endpoint)

## Demo seed (APP_ENV=demo only, is_demo=true)
3 stores (valid Indian coordinates, e.g. Chennai, Bengaluru, Coimbatore), 1+ warehouse,
5 locations per store (+ in-transit), 20 styles, multiple colours/sizes, ≥50 SKUs with barcodes,
8+ weeks sales, balances, comparable mappings, allocation scenarios, replenishment rules & tasks,
moves, counts, transfers, demo users: admin / planner / store manager / associate.
Seed must be idempotent (re-running doesn't duplicate).
