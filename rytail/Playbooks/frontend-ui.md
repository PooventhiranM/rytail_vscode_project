# Rytail Frontend & UI Reference

## Contents
1. Design tokens
2. Typography & spacing
3. App shell & navigation
4. Component library
5. The five UI states
6. AI content styling
7. Module screens
8. Scanner UX (mobile-first)
9. Map UI
10. Data tables & charts
11. Forms & validation
12. Permissions in the UI
13. Accessibility checklist
14. Frontend code conventions

The look: an enterprise retail operations console + inventory intelligence platform + AI
decision workspace. Premium, calm, dense-but-readable. **Not** a chat-only AI app. Avoid heavy
gradients, glassmorphism, decorative clutter, and neon.

---

## 1. Design tokens

Define once in `src/design/tokens.css`. Never hard-code hex values in components.

```css
:root {
  /* Brand */
  --ry-primary: #176B45;        /* Forest Green — primary actions, active nav */
  --ry-primary-hover: #12573A;
  --ry-primary-pressed: #0E4630;
  --ry-accent: #2F9E62;         /* Accent Green — highlights, positive deltas */
  --ry-sage: #E8F3EC;           /* Sage — selected rows, subtle fills, nav hover */
  --ry-sage-strong: #D3E8DA;

  /* Surfaces */
  --ry-bg: #FAFBF9;             /* app background */
  --ry-card: #FFFFFF;
  --ry-border: #DDE5DE;
  --ry-border-strong: #C5D1C8;

  /* Text */
  --ry-text: #27352E;
  --ry-text-muted: #69766D;
  --ry-text-on-primary: #FFFFFF;

  /* Semantic */
  --ry-warning: #B7791F;  --ry-warning-bg: #FEF6E7;   /* amber */
  --ry-danger:  #C53030;  --ry-danger-bg:  #FDECEC;   /* red — errors, critical shortage */
  --ry-info:    #2B6CB0;  --ry-info-bg:    #EBF4FD;   /* blue */
  --ry-success: #2F9E62;  --ry-success-bg: #E8F3EC;
  --ry-inactive:#8A948D;  --ry-inactive-bg:#F1F3F1;   /* gray */

  /* AI suggestion */
  --ry-ai: #5B4FC4;       --ry-ai-bg: #F3F1FD;        /* distinct from verified data */

  /* Shape & depth */
  --ry-radius-sm: 6px; --ry-radius: 10px; --ry-radius-lg: 14px;
  --ry-shadow-sm: 0 1px 2px rgba(39,53,46,.06);
  --ry-shadow:    0 2px 8px rgba(39,53,46,.08);

  /* Layout */
  --ry-sidebar-w: 248px; --ry-sidebar-w-collapsed: 68px; --ry-topbar-h: 56px;
}

/* Future dark mode: override tokens only, no component changes */
[data-theme="dark"] { /* --ry-bg: …; --ry-card: …; etc. */ }
```

Map them in `tailwind.config.ts`:

```ts
theme: { extend: {
  colors: {
    primary: { DEFAULT: 'var(--ry-primary)', hover: 'var(--ry-primary-hover)' },
    accent: 'var(--ry-accent)', sage: { DEFAULT: 'var(--ry-sage)', strong: 'var(--ry-sage-strong)' },
    bg: 'var(--ry-bg)', card: 'var(--ry-card)', border: 'var(--ry-border)',
    ink: { DEFAULT: 'var(--ry-text)', muted: 'var(--ry-text-muted)' },
    warning: 'var(--ry-warning)', danger: 'var(--ry-danger)', info: 'var(--ry-info)',
    ai: { DEFAULT: 'var(--ry-ai)', bg: 'var(--ry-ai-bg)' },
  },
  borderRadius: { sm: 'var(--ry-radius-sm)', DEFAULT: 'var(--ry-radius)', lg: 'var(--ry-radius-lg)' },
  boxShadow: { sm: 'var(--ry-shadow-sm)', DEFAULT: 'var(--ry-shadow)' },
  fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'ui-monospace', 'monospace'] },
}}
```

Status colour rule: colour is never the only signal — always pair with an icon or text label.

---

## 2. Typography & spacing

| Role | Size / weight |
|---|---|
| Page title | 22px / 600 |
| Section title | 16px / 600 |
| Body | 14px / 400 |
| Table cell | 13px / 400, `tabular-nums` |
| Label / caption | 12px / 500, muted |
| KPI value | 28px / 600, `tabular-nums` |

- 4px base grid; common gaps 8 / 12 / 16 / 24.
- Card padding 16px (dense) or 20px (default). Page padding 24px desktop, 16px mobile.
- All numbers right-aligned in tables, with thousands separators (`en-IN` locale → 1,07,000 style
  only if the business wants Indian grouping; confirm, default to `en-IN`).
- SKU, barcode, store codes in `font-mono`.

---

## 3. App shell & navigation

Desktop: fixed left sidebar + compact top bar. Mobile: top bar + bottom nav for store roles.

Sidebar groups (show only what the role can access):

```
Overview
AI Command Center
─ Planning
  First Allocation
  Replenishment
  Recommendations & Approvals
─ Store Operations
  Barcode Scanner
  Inventory
  Stock Counts
  Transfers
─ Network
  Warehouse Map
─ Data
  Uploads
  Connectors & Sync
  Data Quality
─ Governance
  Reports & Scenarios
  Audit History
  Admin (Users, Roles, Rules, Stores, Products)
```

Top bar: global search (SKU / barcode / store / scenario ID), active store selector (for store
roles), environment badge (`DEMO` in amber when demo data is active), notifications, user menu.

Active nav item: `bg-sage text-primary font-medium` with a 3px left primary bar.

---

## 4. Component library (`src/design` + `src/components`)

Build primitives once, reuse everywhere:

- **Button** — variants: `primary` (forest fill), `secondary` (white + border), `ghost`, `danger`;
  sizes sm/md/lg; `loading` prop shows spinner and disables.
- **Card** — white, 1px border, `shadow-sm`, radius 10. Optional header with title + actions.
- **KpiCard** — label, value, delta (accent if good, danger if bad — direction configurable),
  sparkline optional, "as of" timestamp.
- **StatusPill** — one component for every workflow state. Map:
  - Recommended / Pending approval → info
  - Approved → primary outline
  - Executed / Reconciled → success
  - Needs input / Blocked → warning
  - Rejected / Failed → danger
  - Cancelled / Inactive → inactive
- **DataTable** — TanStack Table wrapper: server pagination, sorting, column filters, sticky
  header, column visibility, row selection, CSV export, density toggle, empty/error states.
- **FreshnessBadge** — "Synced 12 min ago" (success) / "Stale: 2 days" (warning) / "Failed" (danger).
- **AiSuggestionCard / AiBadge** — see §6.
- **ConfirmDialog** — for every consequential action; shows exactly what will change
  (e.g. "Backroom 8 → 4, Sales Floor 2 → 6"). Requires typed reason for adjustments/reversals.
- **EvidencePanel** — formula, inputs, outputs, data sources, rule version.
- **Drawer** — right-side detail panel for store/SKU drill-downs without losing table context.
- **Stepper** — for multi-step flows (allocation wizard, import wizard).
- **Toast** — success/error feedback; errors keep a "details" link with the correlation ID.

---

## 5. The five UI states (mandatory on every data view)

| State | Pattern |
|---|---|
| Loading | Skeletons matching final layout (not a lone spinner) |
| Empty | Icon + one-line explanation + primary next action ("Upload sales data") |
| Error | Danger banner with human message, retry button, correlation ID |
| Disabled | Reduced opacity + tooltip explaining *why* (missing permission, blocked rule, invalid data) |
| Success | Toast + inline state change (status pill updates, row highlights briefly) |

A blocked business rule renders as a warning banner: "MOQ rule not confirmed — allocation can
be simulated but not approved."

---

## 6. AI content styling

Users must never confuse AI suggestions with verified data or completed actions.

- AI recommendations live in `AiSuggestionCard`: `bg-ai-bg`, left border `--ry-ai`, sparkle icon,
  label **"AI recommendation — not yet approved"**.
- Numbers inside AI cards come from the deterministic engine result object; show a link
  "View calculation" opening the EvidencePanel.
- Never render "Done" / "Executed" from an AI message — status comes only from the backend
  workflow/transaction record.
- Show assumptions and unresolved questions as a separate amber list inside the card.
- Explanations are concise evidence summaries, not raw chain-of-thought.

---

## 7. Module screens

### Overview dashboard
KPI row (total stock, stores below MDQ, stockout risk count, pending approvals, last sync
health) → charts (stock by location type, days-of-cover distribution) → "Needs attention" table
→ recent workflow runs. Every KPI is clickable to its filtered source list, and every figure
must match backend totals.

### AI Command Center
Three-column on desktop (stacks on mobile):
- Left: history of conversations & workflow runs, suggested tasks.
- Centre: command input + response stream. Responses are structured cards (summary, evidence
  table/chart, risks, validation results, next actions), not just paragraphs.
- Right: **Agent execution timeline** (each agent step with status pill, duration, tools called),
  data sources with FreshnessBadges, approval actions (if authorized), transaction references.
Every entity mentioned (store, SKU, scenario, import job) is a link to its page.

### First Allocation (Stepper)
1. Select product/variant → 2. Comparable SKUs (relevance, sales, store coverage) →
3. Pool entry/import → 4. Simulate (store table: velocity, 12-day demand, share, preliminary,
final, constraint impact) → 5. Validate (pool reconciliation card: pool / allocated / remaining /
unmet demand) → 6. Compare with Nextail → 7. Submit for approval / Export.
Include a "Store count by allocated quantity" bar chart and scenario version selector.

### Nextail comparison
Summary KPIs (totals, stores evaluated, covered, exact matches, only-Rytail, only-Nextail),
side-by-side store table with difference column (colour + sign), quantity frequency chart (two
series), and a quantity filter ("stores at 13 units": Nextail vs Rytail lists).

### Replenishment
Exceptions-first table sorted by business impact: store, SKU, days of cover, inventory position,
target, MDQ shortage, recommended qty, available supply, constraint flags, status. Drawer shows
the calculation for that store–SKU.

### Inventory / Stock counts / Transfers
Inventory grid by Store → Location → SKU with location columns (Floor, Backroom, Damaged,
Quarantine, Receiving, Total). Count sessions show system vs counted vs variance; adjustments
go through approval. Transfers show a status timeline (Created → Approved → Dispatched →
In transit → Received/Partial → Closed) and in-transit qty separately.

### Uploads (Stepper)
Dataset → file → worksheet → preview (first 50 rows) → column mapping (auto-suggest, save
mapping version) → validation (errors/warnings counts, downloadable rejected-records CSV) →
mode (Replace/Append/Upsert with business key shown) → confirm → reconciliation summary.

### Connectors & Sync
Card per connector: status, last success, next run, processed, errors, last error, "View history".
Unconfigured connectors show **"Not configured"** — never fake a green status.

---

## 8. Scanner UX (mobile-first, scanner-gun friendly)

USB/Bluetooth scanner guns act as keyboards and send the code followed by Enter.

```tsx
// Keep focus, process on terminator, dedupe rapid repeats
const inputRef = useRef<HTMLInputElement>(null);
const lastScan = useRef<{ code: string; at: number }>({ code: '', at: 0 });

useEffect(() => {
  const refocus = () => { if (!dialogOpen) inputRef.current?.focus(); };
  refocus();
  window.addEventListener('click', refocus);
  return () => window.removeEventListener('click', refocus);
}, [dialogOpen]);

function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key !== 'Enter' && e.key !== 'Tab') return;          // configurable terminators
  e.preventDefault();
  const code = e.currentTarget.value.trim();
  e.currentTarget.value = '';
  if (!code) return;
  const now = Date.now();
  if (code === lastScan.current.code && now - lastScan.current.at < DEDUPE_MS) return;
  lastScan.current = { code, at: now };
  handleScan(code);
}
```

Screen layout (phone/handheld):
- Header: store name (locked to user scope), Source **Backroom** → Destination **Sales Floor** chips.
- Big scan field (always focused), large feedback area: green flash + beep-style vibration on
  success, red with reason on unknown barcode.
- Product card: image, style/colour/size, SKU, barcode, Floor qty, Backroom qty, MDQ,
  **Suggested refill** (computed by backend).
- Quantity stepper (min 1, max = backroom stock) with large 48px touch targets.
- Confirm shows before/after balances. Submit generates a client idempotency key (UUID) per line.
- Bulk mode: pending lines list, edit qty, remove line, "Submit all" (one idempotent batch).
- After success: toast, return to scan-ready instantly.
- Posted moves can only be reversed via "Reverse movement" (permission + reason), never deleted.

---

## 9. Map UI

- react-leaflet with OpenStreetMap tiles, initial bounds = India.
- Warehouse marker: square, primary fill. Store marker: circle, coloured by status
  (assigned = accent, unassigned = warning, invalid/alert = danger). Cluster stores.
- Connectivity lines warehouse→store; dashed when beyond distance threshold.
- Filters: region, state, warehouse, store status, distance threshold. Location search.
- Side panel: warehouse coverage (store count, avg/max distance), alerts list (unassigned,
  invalid coordinates, too far), alternative-warehouse suggestions (AI style, review only).
- Distance labels must say **"Straight-line (km)"** vs **"Road (km) · ETA"**. If no routing
  provider is configured, show "Road distance unavailable — routing not configured". Never estimate.

---

## 10. Data tables & charts

- Server-side pagination/sort/filter for anything that can exceed ~500 rows.
- Sticky first column (store/SKU) on wide tables; horizontal scroll inside the card.
- Negative or shortage values: danger text with a minus sign or "Short 4"; never rely on colour.
- Charts: Recharts, primary + accent + neutral greys; Nextail series in a neutral slate,
  Rytail in primary. Always label axes and units, show tooltip with exact values.

---

## 11. Forms & validation

- React Hook Form + Zod schemas mirroring backend Pydantic schemas (generate types from
  OpenAPI where possible).
- Inline field errors, plus a top summary for server-side validation errors.
- Disable submit while pending; buttons show loading state.

---

## 12. Permissions in the UI

- Fetch the user's permissions once (`/me`), expose `can('allocation.approve')`.
- Hide nav items the role can't access; disable (with tooltip) actions the role can see but not do.
- This is UX only — the backend re-checks every request.

---

## 13. Accessibility checklist

- Text contrast ≥ 4.5:1 (all tokens above pass on white/#FAFBF9).
- Visible focus ring: `outline: 2px solid var(--ry-accent); outline-offset: 2px`.
- Every icon-only button has `aria-label`. Tables use proper `<th scope>`.
- Scanner feedback announced via `aria-live="assertive"`.
- Touch targets ≥ 44px on store screens.

---

## 14. Frontend code conventions

- One folder per feature: `features/allocation/{pages,components,hooks,api.ts,types.ts}`.
- Server state only in TanStack Query; avoid duplicating it in global stores.
- Query keys: `['allocation','scenario', id]`. Invalidate precisely after mutations.
- No business math in components (display formatting only). If you need a number, the API returns it.
- Format helpers in `lib/format.ts` (`formatQty`, `formatKm`, `formatDate`, `formatPct`).
- Strict TypeScript, no `any`. ESLint + Prettier. Component tests with Vitest + Testing Library;
  e2e with Playwright for scanner, allocation, import, and approval flows.
