# Rytail Testing & Status Reporting

## 1. Test layers

| Layer | Tool | Focus |
|---|---|---|
| Engine unit | pytest (+ hypothesis for property tests) | formulas, rounding, edge cases, determinism |
| Service integration | pytest + real Postgres (testcontainers or docker) | transactions, locking, constraints, idempotency |
| API | pytest + httpx TestClient | schemas, status codes, RBAC allowed/denied, store scope |
| Agent | pytest with fake LLM + real tools | correct tools, no fabrication, blocked on bad data |
| Frontend component | Vitest + Testing Library | states, permissions gating, formatting |
| E2E | Playwright | allocation wizard, scanner flow, import wizard, approval flow |

Never test inventory concurrency against SQLite — use PostgreSQL.

## 2. Required acceptance tests

Allocation
- [ ] Same inputs + config → identical results (run twice, compare)
- [ ] Σ final ≤ pool (property test over random inputs); Σ final + remaining == pool
- [ ] Largest-remainder tie-break is deterministic
- [ ] Missing observations not treated as zero; reported
- [ ] Zero total demand → no allocation, clear message
- [ ] Constraint impact recorded; freed units not silently dropped

Nextail
- [ ] Exact match / only-Rytail / only-Nextail / different classification correct
- [ ] Quantity filter (e.g. 13) returns correct store sets

Replenishment & MDQ
- [ ] Required = max(0, target − position); never exceeds supply
- [ ] Damaged/quarantine excluded; in-transit not double-counted
- [ ] MDQ example: floor 2, back 8, MDQ 6 → move 4 → floor 6, back 4, total 10
- [ ] MDQ resolution order respected

Inventory
- [ ] Internal move updates both locations atomically; total preserved
- [ ] Insufficient stock rejected; no negative balance
- [ ] Same idempotency key twice → one transaction
- [ ] Concurrent moves on same balance don't oversell (parallel test)
- [ ] Reversal creates new transaction; original untouched
- [ ] Count adjustments only post after approval; full audit trail
- [ ] Transfer partial receipt leaves remainder in transit; in-transit not available at either store

Map
- [ ] Haversine correct vs known pair (e.g. Chennai–Bengaluru ≈ 290 km straight-line)
- [ ] Invalid/swapped coordinates flagged
- [ ] Road distance null when routing not configured

Imports & connectors
- [ ] Bad rows rejected with row number + reason; rejected CSV downloadable
- [ ] Upsert doesn't overwrite newer/higher-priority data
- [ ] Re-processing same batch is idempotent
- [ ] Connector failure → retries bounded, status ERROR, last_error shown

Security & workflow
- [ ] Every mutating endpoint returns 403 for unauthorized role and out-of-scope store
- [ ] Workflow can't skip states; blocked rule prevents APPROVED
- [ ] Agent tools reject calls without the user's permission
- [ ] Dashboard KPIs equal backend aggregate queries

## 3. PROJECT_STATUS.md template

Update at the end of every phase or significant task. Be honest — failures and gaps are required content.

```markdown
# Rytail — Project Status
_Last updated: YYYY-MM-DD · Phase N_

## Architecture snapshot
(stack, services, key decisions, deviations from the target layout and why)

## Implemented
- Feature — endpoint(s) — screen(s)

## Tests
- Passed: N  ·  Failed: N  ·  Skipped: N
- Failing tests and reason:

## Simulated vs live
| Integration | Status (SIMULATED / NOT_CONFIGURED / LIVE) | Needed to go live |

## Unresolved business rules
| Rule | Current handling (ASSUMED/BLOCKED) | Owner / question |

## Known issues

## Next steps
```

Do not claim a phase complete unless its acceptance tests above pass.
