# PRD — MediGuard AI

**Version:** 1.0 · **Date:** 24 Oct 2026 · **Challenge:** PS-56 Medical Inventory Expiry Monitor (Tech Yuva × GDG Gurugram Build-a-thon)
**Source of truth:** `MediGuard_AI_Final_Features_Architecture_Plan.md`. If this file and the plan disagree, the plan wins; update both together.

---

## 1. Product

**MediGuard AI** — Intelligent Medical Inventory, Expiry Prevention and Procurement Decision Support.

**Problem.** Healthcare facilities hold expiring stock, suffer preventable shortages, keep inaccurate records and decide procurement in fragments. A list of alerts doesn't tell staff *which action is feasible and worth doing*.

**Promise (the one contract everything serves):**

> **Record → Detect → Forecast → Evaluate feasible actions → Explain → Review/Approve → Execute atomically → Verify outcome + audit.**

**Differentiator.** The **MDI (MediGuard Decision Intelligence) Engine**: expiry-aware FEFO allocation + demand-based shortage analysis + inter-location redistribution + procurement suggestions + supplier return eligibility + simulated financial outcome. **Gemini only explains verified findings. It never computes authoritative numbers and never commits stock changes.**

## 2. Goals / Non-goals

**Goals**
1. Show a near-expiry batch, a different location's shortage, and a justified *transfer-before-purchase* — approved by a manager and posted atomically to both locations with an audit event.
2. Every number in the UI comes from database state + pure TypeScript engines.
3. Core app works when Gemini, camera, or realtime fails.
4. Live public URL with real auth, real persistence.

**Non-goals (hard)**
- No patient records, clinical advice, treatment/substitution suggestions.
- No automatic purchase, disposal, return, or stock edit.
- No custom ML training, microservices, Docker, Redis, FastAPI.
- No realized-savings claims — only *projected* values.
- No mock buttons presented as integrations.

## 3. Users & roles

| Role | Can | Cannot |
|---|---|---|
| `ADMIN` | Manage locations, items, suppliers, rules, users, import config; read audit | Bypass ledger/traceability rules |
| `MANAGER` | Review risk/procurement queues; approve/reject transfers, returns, adjustments, purchase requests; cross-location view (as authorized) | Silently edit historical ledger rows |
| `STAFF` | View assigned-location stock; scan & propose movements; record usage & counts; view recommendations | Finalize privileged approvals; change global rules |

Auth is real (Supabase Auth). Permissions are enforced **server-side + Postgres RLS**. A client-side role dropdown is never acceptable.

## 4. Feature catalog (all 19 in scope; P0/P1 = build order, not exclusion)

| ID | Feature | Acceptance criteria | Stage |
|---|---|---|---|
| F01 | Live Inventory Analytics Dashboard | Totals, stockout risk, expiry exposure, near-expiry batches, purchase queue, recent actions from real state; filter by location/date | P0 |
| F02 | Medicine, Supplier & Batch Management | Create/edit/search; validate date, identifier, unit, duplicate keys; **never edit balances directly** | P0 |
| F03 | CSV Import/Export & API | Upload with preview + error rows; import authorized records; export inventory & recommendations; guarded JSON endpoints | P1 |
| F04 | QR/Barcode Movements | Scan or type code → resolve batch → propose issue/receipt/transfer/return → validate → confirm → transaction; camera-denied fallback | P1 |
| F05 | Physical Reconciliation & Exceptions | Staff submits count; discrepancy shown; manager approves adjustment; stale/anomalous usage visible | P1 |
| F06 | Intelligent Expiry Monitoring | Configurable 7/15/30/60-day bands, expired status, per-batch value, projected unconsumed units, filterable alerts | P0 |
| F07 | FEFO Batch Allocation | Eligible stock sorted by earliest expiry; excludes expired/blocked/insufficient; editable + confirmed | P0 |
| F08 | Department-Wise Demand Forecasting | 7/30-day baseline, adjustments, assumptions visible; sparse-data fallback; per-location projected usage | P0 |
| F09 | Shortage Prediction & Adaptive Reordering | Predict depletion before lead-time coverage; show coverage window, eligible on-hand, incoming, safety units, proposed qty | P0 |
| F10 | Explainable Shortage/Waste Risk Prioritization | Separate shortage and waste indicators; no unsupported probabilities; factors + data-quality flag shown | P0 |
| F11 | Inter-Department Stock Redistribution | Eligible donor/recipient; recommended amount; approval required; out/in post atomically with full trace | P0 |
| F12 | Supplier Return & Disposal Recommendations | Return only if policy/window recorded; disposal *review* for expired/damaged/blocked; never automatic | P1 |
| F13 | Procurement Approval & Action Tracking | Ranked queue; approve/reject; requested→approved→ordered→received; stock added **only** via receipt movement | P0 |
| F14 | Supplier Performance Analytics | Lead-time assumptions, quoted price, reliability sample history, return eligibility; no invented quality rating | P1 |
| F15 | Financial Loss & Savings Simulation | No-action vs feasible transfer/return/use; values labeled *projected* | P1 |
| F16 | Gemini Inventory Copilot | Answers from bounded DB context; cites batch/action IDs; explains calculations; never executes | P1 |
| F17 | Configurable Rules & Location Mgmt | Admin edits expiry windows, safety stock, criticality, lead time, review period, transfer restrictions; audited | P1 |
| F18 | Batch Traceability & Audit Trail | Receipt→issue/transfer/return/disposal/adjustment chain with actor, time, source/dest, qty, reason, linked request | P0 |
| F19 | MDI Best-Next-Action Engine | Per issue: evaluates FEFO/use, transfer, eligible return, reorder, review/disposal; ranks *feasible* candidates with evidence, trade-offs, approval gate | P0 |

### Feature boundaries (avoid duplicate logic)
- **F09** recommends *quantities*; **F13** creates/approves requests. A purchase request adds no stock until a receipt is posted (F04/F18).
- **F06/F07** detect + propose FEFO; **F11** executes approved redistribution; **F15** quantifies benefit.
- **F10** scores risk; **F19** decides feasible actions. High risk alone never proves a purchase/transfer is appropriate.
- **F16** explains; deterministic modules (F06–F15, F19) stay authoritative.

## 5. Key user stories

| As a… | I want… | So that… |
|---|---|---|
| Manager | to see a near-expiry batch with projected waste value, FEFO option and transfer candidate | I act before stock expires |
| Manager | to approve a transfer and see both balances change + audit entry | I trust the system |
| Manager | a ranked purchase queue showing every term of the calculation | I can audit the suggestion |
| Staff | to scan a QR (or type the code) and record an issue | usage data stays accurate |
| Staff | to submit a physical count and see the discrepancy | stale records are caught |
| Admin | to change expiry windows/safety stock and see the change in audit | rules are controlled |
| Any | to ask the copilot "why is X flagged?" and get cited record IDs | explanations are verifiable |

## 6. Core flows

1. **Transfer-before-purchase:** open near-expiry batch → see projected waste → MDI lists feasible candidates (TRANSFER ranked above REORDER where donor surplus exists) → staff proposes → manager approves → atomic RPC posts out/in → dashboards refresh → residual reorder recomputed.
2. **Scan & issue:** scan/enter code → resolve batch → choose issue → server validates → confirm → ledger + balance + audit → consumption feeds forecast.
3. **Procurement:** reorder suggestion → request → approve → ordered → **receipt movement** adds stock.
4. **Reconciliation:** staff count → discrepancy → manager approve → `ADJUSTMENT` movement (never overwrite).
5. **AI explain:** server builds minimized payload → Gemini returns Zod-validated JSON → UI links IDs to real records; on failure show deterministic explanation.

## 7. Success criteria

**Live demo (3–4 min, synthetic data)** — all must work:
near-expiry batch · department shortage · justified transfer · manager approval · atomic update in both locations · audit event · refreshed indicators · AI explanation · QR scan (or manual fallback).

**Engineering criteria:** the 15 critical tests in `IMPLEMENTATION_PLAN.md §7` pass; `lint`, `typecheck`, `build` pass; RLS reviewed; public URL works on laptop + phone.

## 8. Constraints

- Single Next.js monolith (App Router, TS). Supabase (Postgres + Auth + RLS). Vercel hosting. Gemini via `@google/genai`, server-side only.
- Data: synthetic/authorized only; demo seed clearly labeled.
- Expiry policy: batch is **unusable starting on its recorded expiry date**.
- Timezone: hospital timezone setting, default `Asia/Kolkata`; document it.
- Submission cutoff unverified (PDF says 9–5, earlier text says 10–6) → **confirm with organizers**; plan in relative phases.

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Scope (19 features, one day) | Vertical slice first; narrow-but-truthful versions of P1; see cut-line in `IMPLEMENTATION_PLAN.md` |
| Stock-integrity bug in demo | All writes via one RPC; idempotency keys; tests #1–#3 before any UI polish |
| Gemini/API/camera failure on stage | Deterministic fallback text; manual code entry; scripted scenario button; recorded backup video |
| Demo data goes stale (batches "expire" before judging) | Seed dates are **relative to today**, not hard-coded |
| Supabase free project paused / cold | Open the app 10 min before demo; keep CSV seed + local screen recording |
| Fabricated-looking numbers lose credibility | Label projected vs realized; show formula terms; show `insufficient_data` instead of guessing |

## 10. Hidden things people forget (read once)

- **Expiry cutoff & timezone** — a batch expiring "today" at 11 PM is unusable by policy; compute days in hospital TZ, not UTC.
- **Transfer is not free** — check destination storage compatibility (cold chain) and delivery time vs remaining shelf life.
- **Approved ≠ executed** — count *approved inbound transfers* as supply, never *pending suggestions*, or reorder under-buys.
- **Low-data honesty** — sparse history must show `LOW_DATA_CONFIDENCE`, not a confident curve.
- **Counts can invalidate recommendations** — stale/discrepant stock triggers `RECONCILE` before `REORDER`.
- **Exported CSVs are an attack surface** — escape cells starting with `= + - @`.
- **Camera needs HTTPS** (Vercel is fine; local needs `localhost`).
