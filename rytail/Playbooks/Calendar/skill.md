---
name: calendar_plan_config
description: Calendar Plan configuration (create/use/edit/clone) plus the store-mapping and Store & SKU Minimum Display mapping files that back them. Entry point for anything the user asks about Replenishment calendar plans, warehouse/product-family setup, or mapping uploads. Logic that runs ON TOP OF a confirmed plan (eligibility, etc.) lives in the separate Replenishment/ folder, not here — see Replenishment/skill.md.
---

# Calendar Plan Configuration — Skill

## Scope
This skill covers Calendar Plan configuration specifically — creating,
selecting, editing, and cloning plans, plus the min-display mapping
upload. It is part of the broader Replenishment module, which is split
across two folders by responsibility (same MCP tools/`.env`/dataset
registry either way — see Module separation below):
  - **`Calendar/`** (this folder) — plan configuration, covered here.
  - **`Replenishment/`** (sibling folder) — logic that runs ON TOP OF an
    already-confirmed plan (eligibility, and whatever gets added after
    it). See `Replenishment/skill.md` — do not build that kind of logic
    against this playbook.

One playbook lives in this folder so far:

- **`playbook/calender.yml`** (`REPL-CAL-01` — Calendar Plan Configuration
  Agent). Trigger: the user wants to create a Replenishment Calendar Plan,
  pull up/confirm an existing one, edit one in place, clone one into a new
  plan, OR upload/update the Store & SKU level Minimum Display mapping.
  Full gate flow (G0–G5), dataset schemas, validation rules, and
  guardrails live there — this skill file does not duplicate them, only
  points to them.

  This playbook's scope is deliberately narrow: Calendar Plan CRUD (G1–G4)
  and the min-display mapping upload (G5) ONLY. The actual eligibility
  computation (Sales Threshold rule, MinDisplay logic, eligibility grain,
  output) is explicitly OUT OF SCOPE here — it's planned to live in its
  own separate skill/playbook later, not yet built. Don't invent or
  attempt that logic against this playbook's gates.

  Five G1 paths:
    - `create_new` (G2A): brand-new plan, brand-new planName.
    - `use_existing` (G2B): READ-ONLY — select + confirm as-is, nothing
      written to Domo.
    - `edit_existing` (G2D): genuine in-place edit of
      warehouse/productFamily/runCadence/status; planName and the mapping
      file are NOT editable there.
    - `clone_from_reference` (G2C): pre-fill from an existing plan, edit
      freely, always saves as a brand-new planName.
    - G5 (min-display mapping upload) is INDEPENDENT of the G1 menu —
      it's opt-in, triggered only by the user's own wording (e.g. "update
      the mapping," "upload a new min display file"), not offered as a
      standing menu option or automatic follow-up to anything above, and
      needs no plan selected first (the dataset is shared/global, not
      per-plan).

## Module separation (critical)
Replenishment has its OWN `.env` entries and its OWN MCP tool surface
(`get_replenishment_dataset_ids`, plus the generic `query_dataset` /
`inspect_schema` / `write_to_domo_dataset` / `create_domo_dataset` tools),
entirely separate from First Allocation's — even though both point at the
same Domo instance (`gwcteq-partner.domo.com`) and even share two
datasets. NEVER call an FA-scoped tool (e.g. `get_fa_dataset_ids`) or
reuse an FA dataset ID from this skill, even where the underlying data is
genuinely the same (`product_master` / `performance` are shared — still
resolve them through the Replenishment-scoped alias, not the FA one).

## Gate G0 — schema discovery, always first (Strictly Silent)
Gate G0 is 100% SILENT internal execution. Never ask the user any questions, do
not show dialogs/menus, and do not emit diagnostic messages at G0. The very
first turn presented to the user must be Gate G1 directly.
1. Call `get_replenishment_dataset_ids()` silently in the background to get
   every Replenishment dataset ID this server currently knows about.
2. Cross-check whichever playbook is running against its own `schema_discovery`
   section silently.
3. Call `inspect_schema()` ONCE with every needed ID comma-separated and hold
   the column lists in memory for the rest of the session.
4. Immediately output Gate G1 as the first user-facing response.

## Tools available to this skill
| Tool | Role required | Used for |
|---|---|---|
| `get_replenishment_dataset_ids` | viewer | Gate G0 |
| `inspect_schema` | viewer | Gate G0, schema discovery |
| `search_dataset` | viewer | Fallback lookup for a dataset not in the known-ID list |
| `query_dataset` | analyst | Every SELECT this skill runs — dropdown sourcing, plan lookups, uniqueness checks, reading master store mapping (`e2ff5910-...`) and min display mapping (`7491b7c0-...`) |
| `write_to_domo_dataset` | editor | Writing to `calendar_plans` (`a21b4d4b-...`) with `update_method="APPEND"`. Never write or replace mapping datasets. |
| `create_domo_dataset` | deployer | Not used during standard operation — calendar_plans and mapping datasets already exist. |

No dedicated pipeline tool exists for Calendar Plan Configuration — the
agent builds every query itself with the generic tools above, following
the exact gates, validation rules, and schema in the playbook.

## Strict Input Protection & Operational Guardrails
- **Zero File Upload Prompts**: Do NOT ask the user to upload mapping files.
  The system queries `Replenishment Store mapping` (`e2ff5910-cd44-4197-bc7e-0c0263167b8f`)
  and `Store_Sku_Min_Display_mapping` (`7491b7c0-28e1-46fb-804f-79e69b714dc3`)
  directly from Domo via MCP.
- **Strict Read-Only Input Protection**: `e2ff5910-cd44-4197-bc7e-0c0263167b8f` and
  `7491b7c0-28e1-46fb-804f-79e69b714dc3` are PERMANENT READ-ONLY INPUT FILES.
  Make sure you DO NOT change any of this data at any stage. Consider them purely input files.
  Never call `write_to_domo_dataset`, `create_domo_dataset`, or `update_method="REPLACE"`
  against either dataset.
- **Interactive Question Formatting (No Raw JSON)**:
  Gate questions must be asked as clean, interactive conversational prompts
  (formatted cleanly with markdown tables, bold headers, and numbered/bulleted choices),
  NEVER as raw JSON objects or diagnostic dumps.
- **Silent Gate G0**:
  Gate G0 runs schema discovery 100% silently in the background with zero user-facing diagnostic text or questions.
- **Single Shared Calendar Plans Dataset**:
  `calendar_plans` is a SINGLE shared dataset across every plan (`a21b4d4b-6edd-4a02-b2e3-d87ba71045ff`).
  Every save is `write_to_domo_dataset` against that one ID with `storeMappingFileId: "e2ff5910-cd44-4197-bc7e-0c0263167b8f"`.
- This playbook's scope is Calendar Plan CRUD (G1-G4). Sourcing of min-display thresholds and store replenishment eligibility runs under Replenishment/Playbook/sales_probability_eligibility_v2.yml.

## Adding a new playbook
If it's Calendar Plan configuration (another way to create/read/modify a
plan, or another file upload tied to plan setup), give it its own
`playbook/<name>.yml` in THIS folder (same shape as `calender.yml`:
`schema_discovery`, `datasets`, `gates`, `question_format`,
`output_schema`, `guardrails`), list it under Scope above, and reuse the
tool roster and dataset-creation guardrails here rather than restating
them per playbook.

If it's logic that runs ON TOP OF an already-confirmed plan (eligibility,
quantity-calc, anything downstream), it does NOT belong here — add it to
the sibling `Replenishment/` folder instead (see `Replenishment/skill.md`
and `Replenishment/Playbook/eligibility.yml`, `REPL-ELIG-01`, which
already exists there with the scheduling/scope-isolation architecture
built and the actual eligibility rules still TBD).
