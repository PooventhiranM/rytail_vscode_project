# Rytail Backend & API Reference

## Contents
1. Layering
2. API conventions
3. Auth & RBAC
4. Idempotency
5. Atomic inventory posting
6. Workflow & approvals
7. Imports
8. Connector framework
9. Long-running jobs
10. Errors, logging, observability
11. Configuration & deployment

---

## 1. Layering

```
routes (thin)  →  services (orchestrate, validate, persist)  →  engines (pure math)
                              ↓
                        repositories / ORM  →  PostgreSQL
agents → tool registry → services   (agents NEVER touch ORM or SQL directly)
```

- **Routes**: parse/validate input, check permission, call one service method, return schema.
- **Services**: transactional boundaries, load data, call engines, validation, persistence, audit events.
- **Engines**: pure, deterministic, no I/O. Inputs and outputs are Pydantic/dataclass objects.
  Each engine has `ALGORITHM_VERSION = "alloc-v1.0.0"` stored on every result.

---

## 2. API conventions

- Base path `/api/v1`. Resource-oriented, plural nouns.
- Pydantic v2 schemas for every request and response; no raw dicts out of routes.
- Lists: `?page=&page_size=&sort=&filter...` → `{ items, total, page, page_size }`. Max page_size 500.
- IDs are UUIDs; business codes (store_code, sku_code) are separate unique fields.
- Timestamps UTC ISO-8601; the UI localizes.
- Quantities are integers. Money/ratios as `Decimal`, never float in persistence.
- State-changing POSTs that post inventory or approve require `Idempotency-Key` header.

Example endpoints:

```
POST /api/v1/allocation/scenarios                 create scenario (draft)
POST /api/v1/allocation/scenarios/{id}/simulate   run engine → results
POST /api/v1/allocation/scenarios/{id}/validate   decision validation
POST /api/v1/allocation/scenarios/{id}/submit     → PENDING_APPROVAL
POST /api/v1/approvals/{id}/approve | /reject
GET  /api/v1/allocation/scenarios/{id}/nextail-comparison?qty=13
GET  /api/v1/replenishment/recommendations
POST /api/v1/inventory/movements                  (Idempotency-Key)
POST /api/v1/inventory/movements/{id}/reverse     (Idempotency-Key)
POST /api/v1/stock-counts | /{id}/lines | /{id}/submit
POST /api/v1/transfers | /{id}/dispatch | /{id}/receive
GET  /api/v1/barcodes/{code}/lookup?store_id=
POST /api/v1/imports  (upload) → /{id}/mapping → /{id}/validate → /{id}/commit
GET  /api/v1/network/map?region=&warehouse_id=
POST /api/v1/agent/runs   (natural-language command)   GET /api/v1/agent/runs/{id}
GET  /api/v1/audit?entity_type=&entity_id=
GET  /api/v1/me
```

---

## 3. Auth & RBAC

- JWT access (short-lived) + refresh token, or session cookie — follow existing workspace.
- Passwords hashed with argon2/bcrypt. Never log tokens or credentials.
- Permission strings, assigned to roles, checked by dependency:

```python
def require_permission(perm: str):
    def dep(user: User = Depends(current_user)):
        if perm not in user.permissions:
            raise HTTPException(403, detail={"code": "FORBIDDEN", "permission": perm})
        return user
    return dep

@router.post("/movements")
def post_movement(body: MovementIn, idem: str = Header(alias="Idempotency-Key"),
                  user: User = Depends(require_permission("inventory.move.internal"))):
    ...
```

- **Scope**: store roles are limited to assigned stores. Services enforce
  `assert_store_scope(user, store_id)` — a valid permission for the wrong store is still 403.

Baseline role → permission map (configurable in DB):

| Role | Key permissions |
|---|---|
| Admin | `*` (users, roles, rules, stores, products, warehouses, connectors, audit) |
| Merchandiser/Planner | `allocation.*`, `replenishment.recommend`, `nextail.compare`, `reports.view` |
| Store Manager | `inventory.view`, `inventory.move.internal`, `stockcount.*`, `adjustment.request`, `adjustment.approve` (threshold), `transfer.*`, `replenishment.task.act` |
| Store Associate | `scanner.use`, `inventory.move.internal`, `stockcount.count` |

Approval thresholds (e.g. adjustment variance > N units needs Admin) are config rows, not code.

---

## 4. Idempotency

Table `idempotency_keys(key, user_id, endpoint, request_hash, response_json, status, created_at)`,
unique on `(key, user_id, endpoint)`.

- First request: insert row `IN_PROGRESS` inside the same transaction as the work; store response on commit.
- Repeat with same hash: return stored response (HTTP 200, same body).
- Repeat with different hash: 409 `IDEMPOTENCY_KEY_REUSED`.
- Concurrent duplicate: unique violation → 409 `IN_PROGRESS`, client retries.

Also add a unique `idempotency_key` column on `inventory_transactions` as a second safety net.

---

## 5. Atomic inventory posting

All stock changes go through one service: `InventoryLedger.post(...)`.

```python
def post_internal_move(db, *, store_id, sku_id, from_loc, to_loc, qty, user, idem_key, reason=None):
    if qty <= 0: raise ValidationError("QTY_MUST_BE_POSITIVE")
    if from_loc == to_loc: raise ValidationError("SAME_LOCATION")
    with db.begin():
        # lock both balance rows in deterministic order to avoid deadlocks
        locs = sorted([from_loc, to_loc])
        rows = {r.location_id: r for r in db.execute(
            select(InventoryBalance)
            .where(InventoryBalance.store_id == store_id,
                   InventoryBalance.sku_id == sku_id,
                   InventoryBalance.location_id.in_(locs))
            .order_by(InventoryBalance.location_id)
            .with_for_update()).scalars()}
        src = rows.get(from_loc) or raise_(ValidationError("NO_SOURCE_BALANCE"))
        dst = rows.get(to_loc) or create_zero_balance(db, store_id, to_loc, sku_id)
        if src.qty < qty: raise ValidationError("INSUFFICIENT_STOCK", available=src.qty)

        before_total = src.qty + dst.qty
        txn = InventoryTransaction(type="INTERNAL_MOVE", store_id=store_id, sku_id=sku_id,
                                   from_location_id=from_loc, to_location_id=to_loc, qty=qty,
                                   idempotency_key=idem_key, posted_by=user.id, reason=reason)
        db.add(txn)
        src.qty -= qty; dst.qty += qty
        assert src.qty + dst.qty == before_total          # store total preserved
        audit(db, "inventory.move", txn, user)
    return txn
```

Rules:
- Transactions are **insert-only**. A reversal is a new transaction with `reverses_transaction_id`.
- DB `CHECK (qty >= 0)` on balances (unless an audited negative-stock override is configured).
- Transfers: dispatch moves qty from sender's location → `IN_TRANSIT` bucket (not available at
  either store); receipt moves from in-transit to receiver's Goods Receiving. Partial receipts
  leave the remainder in transit with an exception record.
- Stock-count adjustments post `ADJUSTMENT` transactions only after approval; the count session
  never overwrites balances directly.
- Nightly (or on-demand) reconciliation job: `SUM(transactions) == balance` per store/location/SKU;
  mismatches create a data-quality incident, never auto-fix silently.

---

## 6. Workflow & approvals

Generic `workflows` table: `id, type, state, entity_type, entity_id, created_by, rule_version, …`
and `workflow_events` (append-only state transitions with actor and reason).

Allowed transitions are declared per workflow type:

```python
TRANSITIONS = {
  "allocation": {
    "REQUESTED": {"DATA_VALIDATION"}, "DATA_VALIDATION": {"ANALYSIS","BLOCKED","NEEDS_INPUT"},
    "ANALYSIS": {"RECOMMENDATION","FAILED"}, "RECOMMENDATION": {"VALIDATION"},
    "VALIDATION": {"PENDING_APPROVAL","BLOCKED"}, "PENDING_APPROVAL": {"APPROVED","REJECTED","CANCELLED"},
    "APPROVED": {"EXECUTED"}, "EXECUTED": {"RECONCILED","FAILED"},
  }, ...
}
```

- Transition function checks permission + allowed edge + preconditions (e.g. validation passed).
- Approver ≠ requester when configured (four-eyes).
- `EXECUTED` is only set by the service that actually posted the transactions, with transaction refs.

---

## 7. Imports

Pipeline: **upload → stage → map → validate → commit → reconcile**

- Accept CSV, XLSX (openpyxl), XLS (xlrd/pandas where available). Size limit configurable. Detect encoding.
- Store raw file (object storage or DB blob) with checksum; reject duplicate checksum unless forced.
- Parse into `staging_<dataset>` rows with `import_job_id`, `row_number`, raw values.
- Mapping saved as versioned `column_mappings` (dataset, version, source→target).
- Validation per row: required fields, types, FK existence (store/SKU/barcode), duplicates within
  file, business-key conflicts, date ranges. Output errors (block) and warnings (allow).
- Modes, per dataset business key (e.g. sales: store_code+sku_code+date):
  - **Append**: insert; key conflict → reject row.
  - **Upsert**: insert or update on key — but **do not overwrite** a row whose source has higher
    priority or newer `source_updated_at`; record the skip.
  - **Replace**: replace within an explicit scope (dataset + date range/store set), confirmed by user.
- Commit in one transaction (or chunked with job-level rollback marker). Every committed row keeps
  `source_system, source_record_id, import_job_id, mapping_version, imported_at`.
- Reconciliation summary: received / valid / rejected / inserted / updated / skipped; rejected-records CSV.

---

## 8. Connector framework

```python
class Connector(Protocol):
    type: str                      # "pos", "erp", "wms", "rest", "db", "gcs", "sftp", "bi"
    def test_connection(self) -> ConnectionResult: ...
    def discover_schema(self) -> SchemaInfo: ...
    def fetch(self, since: datetime | None, cursor: str | None) -> Iterable[Batch]: ...
```

- Credentials in a secrets manager; DB stores only a secret reference.
- Every sync = `sync_runs` row (status, started/finished, processed, errors, last_error, cursor).
- Fetched data enters the same staging + validation pipeline as file imports.
- Incremental sync by cursor/updated_at; retries with exponential backoff (bounded, e.g. 5);
  processing idempotent by `(source_system, source_record_id)`.
- A connector with no real credentials/schema is registered as `NOT_CONFIGURED` or `SIMULATED`
  and reports that status honestly. Build real adapters only once access is confirmed.

---

## 9. Long-running jobs

Use a job queue for allocation runs over many stores, imports, syncs, reconciliation, and agent
runs that exceed request timeouts. Jobs persist status in DB, are retry-safe (idempotent), have
timeouts, and expose `GET /jobs/{id}` for UI polling. Don't add a queue until a task actually
exceeds a normal request budget.

---

## 10. Errors, logging, observability

Error envelope:
```json
{ "error": { "code": "INSUFFICIENT_STOCK", "message": "Backroom has 3, requested 4",
             "details": {"available": 3}, "correlation_id": "c0f…" } }
```
- Stable machine codes; human message safe to show.
- Structured JSON logs with correlation_id, user_id, route, latency; no PII/credentials.
- `/health/live`, `/health/ready` (DB + queue checks).
- Metrics: request latency, job durations, sync failures, agent tool-call counts and failures.

---

## 11. Configuration & deployment

- Pydantic `Settings` from env; `.env.example` committed, real `.env` never committed.
- `APP_ENV` = `demo | dev | staging | prod`; demo seed runs only when `APP_ENV=demo` and writes
  `is_demo=true`. Prod refuses to start if demo rows exist.
- Alembic migrations for every schema change; never `create_all()` in prod.
- Dockerfiles for frontend (static build behind nginx) and backend (uvicorn/gunicorn), docker-compose
  for local (app, db, queue). Document setup in `README.md` and `docs/DEPLOYMENT.md`.
- Security: CORS allow-list, rate limiting on auth, file-upload type/size checks, SQL only via ORM
  or bound parameters, dependency audit (`pip-audit`, `npm audit`).
