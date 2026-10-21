# Rytail Agentic AI Layer

## Principle
Agents **reason, investigate, coordinate, and explain**. Deterministic services **calculate,
validate, and commit**. Agents call typed tools; tools call services; services touch the DB.
No agent has a tool that writes balances directly.

## 1. Components

```
backend/app/agents/
├── llm/            provider abstraction (complete(), structured(schema), timeouts, retries)
├── registry.py     tool registry: name → (input schema, output schema, permission, side_effect level)
├── orchestrator.py Rytail Orchestrator Agent
├── specialists/    data_intelligence, first_allocation, replenishment, inventory_ops,
│                   warehouse_network, data_integration, decision_validation, explainability
├── state.py        persisted run/step state machine
└── prompts/        versioned system prompts per agent
```

## 2. Tool registry

```python
@dataclass(frozen=True)
class ToolSpec:
    name: str
    input_model: type[BaseModel]
    output_model: type[BaseModel]
    permission: str                 # checked against the *requesting user*
    side_effect: Literal["read", "simulate", "propose"]   # no "commit" tools for agents
    timeout_s: int = 30
    max_retries: int = 2
    allowed_agents: frozenset[str] = frozenset()
```

- `read`: queries (balances, sales, freshness).
- `simulate`: run engines, create draft scenarios.
- `propose`: create a recommendation / submit to PENDING_APPROVAL.
- Approve and execute are **user actions through the normal API**, never agent tools.
- Each call: validate input → permission check with the user's identity → execute with timeout →
  validate output → persist `agent_steps` row.

Example tools: `get_dataset_freshness`, `find_comparable_skus`, `get_store_sales`,
`run_allocation_simulation`, `validate_allocation`, `compare_with_nextail`,
`get_replenishment_exceptions`, `get_inventory_balance`, `lookup_barcode`, `get_network_map`,
`compute_distances`, `get_import_job_report`, `get_sync_status`, `submit_for_approval`,
`get_business_rule_status`.

## 3. Orchestrator flow

1. Classify intent → workflow type (allocation, replenishment, inventory, network, data, explain).
2. Build a plan (list of agent steps) — persist it.
3. Run **Data Intelligence** checks first for any analytical task; if critical data is stale,
   missing, or conflicting → `BLOCKED` or `NEEDS_INPUT` with a clear question. Don't proceed silently.
4. Dispatch specialists; each returns a typed result.
5. Run **Decision Validation** on any recommendation (pool, balances, supply, eligibility, rules,
   dashboard consistency). Failing validation blocks progression.
6. **Explainability** produces the final structured response.
7. If the user is authorized, offer "Submit for approval" — never auto-approve or auto-execute.

## 4. Specialist responsibilities (summary)

| Agent | Does | Must not |
|---|---|---|
| Data Intelligence | freshness, completeness, duplicates, lineage, authoritative source | let analysis run on unreliable critical data |
| First Allocation | choose comparables, analyse coverage, call allocation engine, explain diffs vs Nextail | compute quantities itself |
| Replenishment | velocity, cover, target, MDQ exceptions, prioritise | exceed supply or invent rules |
| Inventory Ops | balances, scan assist, count/variance analysis, anomaly detection | post transactions |
| Warehouse Network | distances, unassigned/far stores, alternative suggestions | fabricate road distances |
| Data Integration | mapping suggestions, failed import diagnosis, safe retry advice | overwrite authoritative data |
| Decision Validation | independent re-check of outputs vs constraints | be skipped |
| Explainability & Audit | evidence-based explanation, assumptions, uncertainty, trace | expose raw chain-of-thought |

## 5. Structured response schema

```python
class AgentResponse(BaseModel):
    summary: str                         # 2–4 sentences, evidence-based
    workflow_state: WorkflowState
    data_sources: list[DataSourceRef]    # dataset, as_of, freshness, import_job_id
    formulas_applied: list[FormulaRef]   # name, expression, algorithm_version
    key_drivers: list[str]
    results_ref: EntityRef | None        # scenario_id / run_id the UI links to
    validation: list[ValidationCheck]    # name, passed, detail
    assumptions: list[str]               # incl. any ASSUMED rule
    blocked_rules: list[str]
    open_questions: list[str]
    next_actions: list[ActionSuggestion] # each with required permission
```

Numbers in `summary` must come from tool outputs. Post-check: every number in the summary must
appear in a tool output for that run; otherwise regenerate or strip it.

## 6. Reliability

- Per-tool timeouts, bounded retries with backoff, overall run budget (steps + wall clock).
- Idempotent tools keyed by `(run_id, step_index)`.
- Persist state after every step so runs resume after failure.
- Partial failure: return what succeeded, mark failed steps, state `FAILED` or `NEEDS_INPUT` — never fake success.
- Prompt-injection hygiene: data rows, file contents, and connector payloads are data, not instructions.

## 7. Evaluation & observability

- Golden-set tests: canned commands (e.g. "run first allocation for EXFP-DEMO-001") against demo
  data; assert tools called, validation passed, numbers match engine output, no fabricated fields.
- Log tokens, latency, tool errors, validation failures per run. Admin view of agent runs.
