---
name: replenishment
description: Replenishment logic that runs ON TOP OF a confirmed Calendar Plan — eligibility, and whatever else gets added here later. Calendar Plan configuration itself (create/use/edit/clone, min-display mapping upload) lives in the separate Calendar/ folder, not here.
---

# Replenishment (logic-on-top) — Skill

## Scope and folder split
This project splits the Replenishment module across TWO folders, by
responsibility, not by tool surface — both still share the exact same
MCP tools, `.env` entries, and Domo dataset registry:

- **`Calendar/`** (`Calendar/playbook/calender.yml`, `REPL-CAL-01`) — all
  Calendar Plan configuration: create / use-existing / edit-existing /
  clone-from-reference, plus the Store & SKU level Minimum Display
  mapping upload (its G5). See `Calendar/skill.md` for that playbook's
  own gate flow and guardrails — not duplicated here.
- **`Replenishment/`** (this folder) — logic that runs ON TOP OF an
  already-confirmed Calendar Plan:
  - **`Playbook/sales_probability_eligibility_v2.yml`** (`REPL-SPE-02` —
    Unified Store Eligibility & Sales Probability Engine).
    Executes the 3-step replenishment pipeline:
      - **Step 1 (Upfront Warehouse Quantity Filter)**: Check warehouse stock
        first. If `WarehouseStockOnHandQty <= 0` -> eliminate records upfront
        with `Eligible = FALSE`, `ReplenishmentQty = 0`, `ConfidenceScore = 100`,
        `ReplenishmentReason = "No stock in warehouse"`.
      - **Step 2 (Group by ProdReference Volume Reduction)**: Sourced from
        `Store_Sku_Min_Display_mapping` (`7491b7c0-28e1-46fb-804f-79e69b714dc3`),
        grouped by `ProdReference` to collapse 245,175 rows down to ~292 reference
        thresholds (7 for `BOYS CORE DENIM`), reducing volume by 99.8%.
      - **Step 3 (4-Week Weighted SSP Calculation & Threshold Comparison)**:
        Compute $SSP = 0.40(W_1) + 0.30(W_2) + 0.15(W_3) + 0.15(W_4)$ and
        compare against `SalesThresholdPct`.
      - **Persistence**: Appends final scored records directly to Domo dataset
        `SSP_eligibility_Final` (`a1bf0a87-d46a-48a3-a4c0-7fc47d3137c5`) via OAuth
        with 15 columns and auto-incrementing `RunId`.
  - **`Playbook/store_replenishment_order_allocation.yml`** (`REPL-ORD-01` —
    Store Replenishment Order Allocation Engine).
    Executes the size-level replenishment allocation:
      - **Step 0 (Cadence & Scope Resolution)**: Reads `calendar_plans` (`a21b4d4b`)
        for active status and `runCadence` day match.
      - **Step 1 (Plan & Client Run Isolation)**: Matches `CalendarPlanName`,
        isolates client-specified `RunId` (`target_run_id`, strictly no `MAX(RunId)`)
        and `Eligible = 'True'` records from `SSP_eligibility_Final` (`a1bf0a87`),
        extracting `StoreCode` and `Reference`.
      - **Step 2 (Demand Matrix Expansion)**: Expands each store + reference into
        required sizes and target `MinDisplay` from `Store_Sku_Min_Display_mapping` (`7491b7c0`).
      - **Step 3 (Store Stock Aggregation & Size Resolution)**: Enriches blank sizes
        via `SU_Product_Master` (`7fb59cab`), clamps negative numbers to 0, and sums
        `Current Stock Qty` + `Ordered Qty` from `Replenishment Order Details` (`8152de75`).
      - **Step 4 (Comparison & Replenish-Only Filter)**: Computes replenishment deficit
        $\max(0, \text{MinDisplay} - \text{TotalEffectiveStock})$ and filters strictly
        for rows where $\text{ReplenishmentQtyToSend} > 0$. Excludes warehouse stock column.
  - **`Playbook/eligibility.yml`** (`REPL-ELIG-01` — Historical reference for
    scheduling and scope isolation).

STRICT READ-ONLY INPUT RULE:
`e2ff5910-cd44-4197-bc7e-0c0263167b8f` (Replenishment Store mapping) and
`7491b7c0-28e1-46fb-804f-79e69b714dc3` (Store_Sku_Min_Display_mapping) are
strictly READ-ONLY INPUT DATASETS. Never modify, overwrite, replace, or re-create
them at any stage.

If the user's request is about creating/editing/using/cloning a plan, that's
`Calendar/`, not here. If it's about evaluating replenishment eligibility
and writing scored outputs to Domo — that's here.

## Module separation (critical, same as Calendar/skill.md)
This module has its OWN `.env` entries and its OWN MCP tool surface
(`get_replenishment_dataset_ids`, plus the generic `query_dataset` /
`inspect_schema` / `write_to_domo_dataset` / `create_domo_dataset` tools),
entirely separate from First Allocation's — even though both point at the
same Domo instance (`gwcteq-partner.domo.com`) and even share two
datasets. NEVER call an FA-scoped tool (e.g. `get_fa_dataset_ids`) or
reuse an FA dataset ID from anything in this folder, even where the
underlying data is genuinely the same (`product_master` / `performance`
are shared — still resolve them through the Replenishment-scoped alias).

This is DIFFERENT from the Calendar/Replenishment folder split above —
that split is organizational (plan config vs logic-on-top) within the
SAME module/tool surface; the FA-vs-Replenishment separation is the real
module boundary (different `.env`, different dataset ownership). Don't
confuse the two.

## Tools available
| Tool | Role required | Used for |
|---|---|---|
| `run_replenishment_pipeline` | editor | **PRIMARY FAST-PATH**: Executes REPL-SPE-02 + REPL-ORD-01 end-to-end in ~5 to 10 seconds with 100% mathematical precision. Persists to Domo and exports CSV. |
| `run_replenishment_eligibility` | editor | Runs Phase 1 (REPL-SPE-02) store eligibility & SSP scoring natively in ~3 seconds. |
| `run_order_allocation` | analyst | Runs Phase 2 (REPL-ORD-01) SKU-size demand expansion and deficit dispatch in ~3 seconds. |
| `get_active_calendar_plans` | viewer | Instant lookup of active plans and cadence check (e.g. plans due on 'Monday'). |
| `get_replenishment_dataset_ids` | viewer | Resolving confirmed dataset IDs (`calendar_plans`, `performance`, etc.) |
| `inspect_schema` | viewer | Schema discovery, schema-drift re-checks |
| `search_dataset` | viewer | Fallback lookup for a dataset not (or no longer) in the known-ID list |
| `query_dataset` | analyst | Ad-hoc SELECT queries (supports up to 250,000 characters per response) |
| `write_to_domo_dataset` | editor | Appending final scored replenishment eligibility rows to `SSP_eligibility_Final` (`a1bf0a87-d46a-48a3-a4c0-7fc47d3137c5`) via `update_method="APPEND"` |
| `create_domo_dataset` | deployer | Creating or uploading new Domo datasets |

## STRICT ZERO UNPROGRAMMED QUESTIONS RULE (CRITICAL)
- **ONLY PROGRAMMED PLAYBOOK QUESTIONS ARE PERMITTED**: In this system, only structured interactive questions explicitly programmed in the playbook gates (e.g. Gate G1–G5 in `Calendar/playbook/calender.yml` with discrete option menus/forms) may ever be presented to the user.
- **NEVER ASK AD-HOC QUESTIONS OR CONVERSATIONAL CONFIRMATIONS**:
  - **No Cadence Confirmations**: Any user prompt or command to run replenishment (e.g. "Run replenishment for Calendar plan A") is an explicit, authorized manual trigger. It executes immediately regardless of the current day. NEVER pause, interrupt, or ask the user to confirm off-cadence execution.
  - **No Open Blocker / Validation Warnings**: All formulas, SQL aggregations, two-tier evaluation logic, zero-floor clamping, and persistence schemas are verified and approved for production execution. NEVER halt, pause, or quote historical research notes/validation plans to the user.
  - **No Intermediate Check-ins**: NEVER ask "Should I proceed?", "Do you want to continue?", or emit diagnostic chatter between steps.
- **REPLENISHMENT IS AN AUTONOMOUS PIPELINE**: The replenishment workflow (REPL-SPE-02 + REPL-ORD-01) contains NO interactive question gates. It must execute from start to finish autonomously in one shot.

## High-Speed & 100% Accuracy Execution Rule
CRITICAL OPERATIONAL INSTRUCTION:
When the user asks to run replenishment for a plan (e.g. "Run replenishment for Calendar plan A"), you MUST call `run_replenishment_pipeline(plan_name="...")` directly.
- **Why**: Calling `query_dataset` manually for thousands of rows forces 20+ pagination roundtrips and takes over 50 minutes of token streaming.
- `run_replenishment_pipeline` executes the entire business logic natively in Python in **under 10 seconds**, strictly adheres to all formulas and guardrails (zero-floor clamping, two-tier evaluation, RunId auto-increment, size enrichment via product master, and replenish-only filtering), appends to Domo, and returns a verified executive summary.

## Gate Flow & Execution Pipeline (REPL-SPE-02 + REPL-ORD-01)
If performing step-by-step or manual execution, follow this gate sequence:
- **Gate G0 (Silent Setup)**: Call `get_replenishment_dataset_ids` silently in the background to resolve all dataset UUIDs.
- **Gate G1 (Plan Selection & Scope Resolution)**: Query `calendar_plans` (`a21b4d4b-6edd-4a02-b2e3-d87ba71045ff`) or call `get_active_calendar_plans` to identify the active plan (e.g. `Calendar plan A`), its `productFamily` (e.g. `BOYS CORE DENIM`), and `warehouse`.
- **Gate G2 (Universe & Threshold Scope)**: Query `product_master` for family references, and `Store_Sku_Min_Display_mapping` (`7491b7c0-28e1-46fb-804f-79e69b714dc3`) grouped by `ProdReference` to retrieve the sales thresholds.
- **Gate G3 (Two-Tier Evaluation)**:
  - Zero-floor clamping: If any sales or stock quantity is negative, assume 0 (`max(0, val)`). No negative values are allowed in calculations or output.
  - Upfront warehouse stock check: if `wh_stock <= 0` -> Ineligible (No stock in warehouse).
  - 4-week weighted SSP calculation and threshold comparison for remaining rows.
- **Gate G4 (Persist Results to Domo — Mandatory)**:
  - Query `SELECT MAX(RunId) FROM table WHERE CalendarPlanName = '<plan>'` on `a1bf0a87-d46a-48a3-a4c0-7fc47d3137c5`.
  - Increment: `new_run_id = (max_run or 0) + 1`.
  - Format all rows matching the 15-column schema (with zero-floor clamping: all `Qty_7d`, `Qty_28d`, `StockOnHandQty` >= 0):
    `['StoreCode', 'Reference', 'Qty_7d', 'Qty_28d', 'StockOnHandQty', 'SellThrough_7d_pct', 'SellThrough_28d_pct', 'StoreDemandIndex_pct', 'StockAdjustedFactor_pct', 'SSP', 'SalesThresholdPct', 'Eligible', 'CalendarPlanName', 'RunId', 'computedAt']`
  - Call `write_to_domo_dataset(dataset_id="a1bf0a87-d46a-48a3-a4c0-7fc47d3137c5", rows=scored_rows, columns=columns_15, update_method="APPEND")`.
  - Note the generated `new_run_id` and active `CalendarPlanName`.
  - **AUTOMATIC PIPELINE CONTINUATION RULE**: Do NOT halt, pause, or ask the user what to do next after G4. Immediately proceed to **Gate G5** as part of one continuous replenishment execution.

- **Gate G5 (Automatic Downstream Order Allocation — REPL-ORD-01 Mandatory)**:
  - Immediately invoke and execute **`Playbook/store_replenishment_order_allocation.yml`** (`REPL-ORD-01`) using the active scope and freshly persisted RunId:
    - `target_plan_name`: Active `CalendarPlanName` from Gate G1 (e.g. `'Calendar plan A'`)
    - `target_run_id`: Exact `new_run_id` persisted in Gate G4 (e.g. `3`)
  - Execute the order allocation sequence:
    1. Query `SSP_eligibility_Final` (`a1bf0a87-d46a-48a3-a4c0-7fc47d3137c5`) for `CalendarPlanName = target_plan_name`, `RunId = target_run_id`, and `Eligible = 'True'`.
    2. Expand each eligible `StoreCode + Reference` pair into SKU sizes and target `MinDisplay` from `Store_Sku_Min_Display_mapping` (`7491b7c0-28e1-46fb-804f-79e69b714dc3`).
    3. Aggregate effective store stock (`Current Stock Qty + Ordered Qty`) from `DEV Replenishment Order Details` (`8152de75-f313-47f6-a50c-48b524fcb503`), resolving missing sizes with `SU_Product_Master` (`7fb59cab-dd64-4821-a55f-2276d808bfc3`), clamping negative values to 0.
    4. Compute `ReplenishmentQtyToSend = MinDisplay - TotalEffectiveStock`.
    5. Filter STRICTLY for rows where `TotalEffectiveStock < MinDisplay` (`ReplenishmentQtyToSend > 0`). Drop unreplenished lines (`ReplenishmentQtyToSend <= 0`).
    6. Ensure the warehouse stock column is completely omitted from the dispatch output.
  - Present a unified final response:
    - **Eligibility Summary (REPL-SPE-02)**: Total Store+Reference pairs evaluated, eligible count, ineligible count (Tier 1 warehouse zero stock vs Tier 2 SSP threshold), RunId, and confirmation of persistence to `SSP_eligibility_Final`.
    - **Order Allocation Dispatch (REPL-ORD-01)**: Total SKU-size lines evaluated, total lines requiring replenishment (deficit > 0), total units to dispatch, and the allocated order dispatch breakdown.
    - **MANDATORY SKU-SIZE LEVEL OUTPUT RULE (CRITICAL)**:
      When presenting resultant order allocation data to the user, you MUST ALWAYS provide the table at the **SKU-Size level**, explicitly including the `Size` column:
      `StoreCode, ProdReference, Size, TotalEffectiveStock, MinDisplay, ReplenishmentQtyToSend`
      - **NEVER roll up or aggregate by StoreCode + Reference**.
      - Warehouse dispatch requires the exact physical size breakdown (e.g. `2Y, 4Y, 6Y, 8Y, 10Y, 12Y, 14Y`) on every row so store managers and warehouse pickers know the exact units to pick per size.
      - Display the Size-level rows in chat (as CSV or table) and link to the full CSV file (`Claude outputs/order_allocation_<plan>_Run<id>.csv`).

## Guardrails (cross-playbook within this folder)
- Zero-Floor Clamping Rule: Never persist negative values for sales or stock quantities. Any negative value resulting from net customer returns must be clamped to 0.
- Never invent a dataset UUID — resolve `calendar_plans` and everything
  else via `get_replenishment_dataset_ids` / `Calendar/playbook/calender.yml`,
  the source of truth for that dataset's schema/ID.
- Scope isolation is the single most important rule so far: when multiple
  Calendar Plans are due on the same day, never let their
  warehouse/productFamily/store scopes blend in one query — process each
  plan's full set of queries separately. See
  `eligibility.yml`'s `scheduling.scope_isolation_guardrail`.
- Do not build eligibility RULES (Sales Threshold, MinDisplay logic,
  output shape) ahead of being told them — only the scheduling/
  scope-isolation architecture is confirmed/built so far.
- This folder never touches Calendar Plan CRUD or the min-display mapping
  upload — those stay in `Calendar/`. Don't duplicate or reimplement
  anything from there; read it as the source of truth instead.

## Adding a new playbook to this folder
Give it its own `Playbook/<name>.yml` (same shape as
`Calendar/playbook/calender.yml`: `description`/`schema_discovery` (or an
architecture section like `eligibility.yml`'s `scheduling`), `datasets`,
`gates`, `question_format`, `output_schema`, `guardrails`), list it under
Scope above, and reuse the tool roster and guardrails here rather than
restating them per playbook.
