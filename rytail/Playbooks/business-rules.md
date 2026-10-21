# Rytail Business Rules & Calculation Engines

## Contents
1. First allocation (formulas, integer algorithm, reference engine)
2. Nextail comparison
3. Replenishment
4. Minimum Display Quantity (MDQ)
5. Warehouse distance
6. Unconfirmed rules — never invent these
7. Reproducibility requirements

All logic here lives in `backend/app/engines/` as pure functions with unit tests.

---

## 1. First Allocation

### Baseline formulas (configurable parameters in brackets)

```
Weekly Velocity        = Comparable SKU Sales over [5] weeks / [5]
12-Day Demand          = Weekly Velocity × [12] / 7
Store Demand Share     = Store 12-Day Demand / Σ 12-Day Demand (eligible stores)
Preliminary Allocation = Available Pool × Store Demand Share
Constraint:            Σ Final Allocation ≤ Available Pool
```

Config object (persist with every scenario):
```python
class AllocationConfig(BaseModel):
    observation_weeks: int = 5
    planning_horizon_days: int = 12
    comparable_aggregation: Literal["sum", "mean"] = "mean"   # across multiple comparables
    missing_data_policy: Literal["exclude_store", "use_category_avg", "flag_only"] = "flag_only"
    min_alloc_per_store: int | None = None     # BLOCKED until business confirms
    max_alloc_per_store: int | None = None
    pack_size: int | None = None               # BLOCKED until business confirms
    rounding: Literal["largest_remainder"] = "largest_remainder"
```

### Multiple comparables & missing data
- Use multiple comparables to improve store coverage. Aggregate per store across comparables that
  *have observations* for that store.
- A store with **no observations** is NOT zero demand. Apply `missing_data_policy` and report
  the store in a "missing observations" list. `flag_only` keeps the store out of the share
  calculation and surfaces it for review.
- A store that had the comparable on sale and sold 0 *is* a real zero (distinguish via
  stock/range presence data if available; otherwise flag).

### Deterministic integer allocation (largest remainder)

1. `raw_i = pool × share_i`
2. `base_i = floor(raw_i)`
3. `remaining = pool − Σ base_i`
4. Give +1 to stores ordered by: fractional part desc → demand desc → store_code asc (tie-break
   guarantees determinism) until `remaining = 0`.
5. Apply constraints (min/max/pack) with explicit impact records; units freed by constraints
   are redistributed by the same ordering, or left as **remaining pool** — never silently dropped.
6. Assert `Σ final ≤ pool` and `Σ final + remaining_pool == pool`.

Reference engine:

```python
from decimal import Decimal, ROUND_FLOOR
from dataclasses import dataclass

ALGORITHM_VERSION = "alloc-v1.0.0"

@dataclass(frozen=True)
class StoreInput:
    store_code: str
    sales_obs_weeks: Decimal | None   # comparable sales over the observation window; None = missing

@dataclass(frozen=True)
class StoreResult:
    store_code: str
    weekly_velocity: Decimal | None
    demand: Decimal | None
    share: Decimal
    preliminary: Decimal
    final: int
    note: str | None = None

def allocate(stores: list[StoreInput], pool: int, weeks: int = 5, horizon_days: int = 12):
    if pool < 0: raise ValueError("POOL_NEGATIVE")
    rows, missing = [], []
    for s in stores:
        if s.sales_obs_weeks is None:
            missing.append(s.store_code); continue
        v = s.sales_obs_weeks / weeks
        rows.append((s.store_code, v, v * horizon_days / 7))
    total = sum((d for _, _, d in rows), Decimal(0))
    if total == 0:
        return [], pool, missing, ALGORITHM_VERSION     # nothing to allocate on; report, don't guess

    prelim = [(c, v, d, d / total, pool * d / total) for c, v, d in rows]
    base = {c: int(p.to_integral_value(ROUND_FLOOR)) for c, _, _, _, p in prelim}
    remaining = pool - sum(base.values())
    order = sorted(prelim, key=lambda r: (-(r[4] - int(r[4])), -r[2], r[0]))
    for c, *_ in order[:remaining]:
        base[c] += 1

    results = [StoreResult(c, v, d, sh, p, base[c]) for c, v, d, sh, p in prelim]
    allocated = sum(r.final for r in results)
    assert allocated <= pool
    return results, pool - allocated, missing, ALGORITHM_VERSION
```

### Worked example
Pool = 10; three stores with 5-week comparable sales 30, 20, 10.
Velocity 6, 4, 2 → demand 10.286, 6.857, 3.429 → shares 0.5, 0.333, 0.167 →
preliminary 5.0, 3.333, 1.667 → floor 5, 3, 1 (=9) → remaining 1 → highest fraction is
store 3 (0.667) → final 5, 3, 2 = 10. ✅

### Output shown to users
Per store: eligibility, comparables used, velocity, demand, share, preliminary, final, constraint
impact. Totals: pool, allocated, remaining pool, unmet demand (Σ demand − allocated, if > 0),
stores with missing observations, store count by allocated quantity.

---

## 2. Nextail comparison

Inputs: Rytail scenario results + imported/synced Nextail results for the same product & store set.

Outputs:
- Total Rytail units, total Nextail units, stores evaluated, stores covered by each.
- Per store: rytail_qty, nextail_qty, diff = rytail − nextail, category:
  `EXACT_MATCH | BOTH_DIFFERENT | ONLY_RYTAIL | ONLY_NEXTAIL | NEITHER`.
- Quantity frequency: `{qty: (store_count_rytail, store_count_nextail)}`.
- Quantity filter: e.g. qty=13 → stores Nextail gave 13 vs stores Rytail gave 13, plus overlap.
- Explanations must cite actual data (demand share, comparables, constraints). Never claim to
  know Nextail's internal algorithm.

Historical reference only (not live data, not a test assertion against live systems):
EXFP00035 WHITECAP GRAY — 193 stores, 1,070 Rytail units vs 2,322 Nextail units.

---

## 3. Replenishment

```
Daily Sales Velocity = Units Sold / Observation Days
Days of Cover        = Usable Stock / Daily Demand            (∞ / "no demand" if demand = 0)
Inventory Position   = Usable On-Hand + Eligible Incoming − Reserved
Required Quantity    = MAX(0, Target Stock − Inventory Position)
Final Recommended    = MIN(Required, Available Supply), then pack/MOQ rules (if confirmed)
```

Stock-bucket treatment (make explicit in config; default shown):

| Bucket | Usable on-hand? | In inventory position? |
|---|---|---|
| Sales Floor | Yes | Yes |
| Backroom | Yes | Yes |
| Goods Receiving (received, not put away) | Yes | Yes |
| Damaged | No | No |
| Quarantine | No | No |
| In transit **to** store | No | Yes if "eligible incoming" (ETA within horizon) |
| Reserved | Subtract | Subtract |

Never count the same unit twice (e.g. in-transit at both sender and receiver).

Supply allocation when multiple stores need the same constrained supply: prioritise by business
impact (lowest days of cover, then highest velocity, then store_code) — the ordering itself is
config and is recorded on the result.

Every recommendation carries a reason code: `STOCKOUT_RISK`, `BELOW_TARGET`, `DISPLAY_SHORTAGE`,
`SUPPLY_LIMITED`, etc.

---

## 4. Minimum Display Quantity (MDQ)

Resolution order: SKU+store → SKU → category+store-type → category → none (flag).

```
Display Shortage         = MAX(0, MDQ − Sales-Floor Stock)
Recommended Internal Refill = MIN(Display Shortage, Available Backroom Stock)
```

Example: floor 2, backroom 8, MDQ 6 → shortage 4 → refill 4 → floor 6, backroom 4, total stays 10.
If backroom = 1 → refill 1, remaining shortage 3 → raise replenishment need.

MDQ is a *target*, not a measurement. Actual floor stock comes from balances only.

---

## 5. Warehouse distance

- Straight-line: haversine, Earth radius 6371.0088 km, rounded to 0.1 km. Label "Straight-line".
- Road distance & ETA: only from a configured routing provider (e.g. OSRM/ORS/Google), cached with
  provider + timestamp. If unavailable → `null` + reason. Never estimate road from straight-line.
- Coordinate validation: lat ∈ [6, 37.5], lon ∈ [68, 97.5] for India; reject (0,0), swapped
  lat/lon, and nulls → "invalid coordinates" alert.
- Coverage per warehouse: store count, avg & max distance, stores over threshold (config).
- Alternative assignment suggestions are review-only and must check warehouse capacity/constraints.

---

## 6. Unconfirmed rules — never invent these

Keep each as a config entry with `status: CONFIRMED | ASSUMED | BLOCKED_PENDING_CONFIRMATION`.

| Rule | Default handling |
|---|---|
| Sales Threshold — formula & purpose | BLOCKED. Don't implement a formula. |
| SSP — meaning, formula, components | BLOCKED. Don't guess the acronym. |
| Final replenishment planning horizon | ASSUMED (configurable), labelled in UI |
| Store eligibility rules | ASSUMED "all active stores", labelled |
| MOQ, min allocation, pack sizes, rounding | BLOCKED for approval; simulation allowed |
| Exact Nextail methodology | Unknown — compare outputs only |
| Missing-data treatment | ASSUMED `flag_only`, labelled |
| Authoritative data source per dataset | Config; BLOCKED for prod until confirmed |
| Warehouse assignment policy | Config; suggestions review-only |
| Approval thresholds | Config; conservative defaults (approval always required) |

A workflow depending on a `BLOCKED` rule can simulate but **cannot reach APPROVED**. UI shows
the warning banner; agents must state the assumption explicitly.

---

## 7. Reproducibility

Every allocation/replenishment result stores: scenario_id, algorithm_version, config snapshot
(JSON), rule versions, input data snapshot reference (import job IDs / data-as-of timestamp),
created_by, created_at. Re-running with the same snapshot must produce identical output —
add a test for this.
