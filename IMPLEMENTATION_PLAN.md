# IMPLEMENTATION PLAN — MediGuard AI

Phases are **relative** (submission cutoff unverified: PDF says 9–5, earlier text says 10–6 → confirm with organizers). Always reserve the final 15% for stabilization + demo.

**Strategy: vertical slice first.** Get one flow working end-to-end (near-expiry → transfer → approve → atomic post → audit → refreshed UI) before breadth. Everything else plugs into that spine.

---

## Phase 1 — Contract + scaffold (0–10%)

- [ ] `npx create-next-app` (TypeScript, App Router, Tailwind, ESLint, `src/` dir). **Don't upgrade frameworks mid-build.**
- [ ] Install: `@supabase/supabase-js @supabase/ssr zod papaparse recharts @google/genai @zxing/browser qrcode` + dev: `vitest @types/papaparse`; init shadcn/ui.
- [ ] Create folder layout from `ARCHITECTURE.md §9`; add `RULES.md`, `AGENTS.md` (points to RULES.md), `.env.example`.
- [ ] Define **shared types + Zod schemas** in `src/schemas` / `src/types` for: Medicine, Batch, Movement, TransferRequest, ProcurementRequest, Candidate, Settings. *Everyone codes against these.*
- [ ] Supabase project created; env vars set locally + on Vercel; first Vercel deploy (empty app) to catch deploy issues early.
- [ ] App shell: sidebar/tab bar, 5 routes with placeholders, login page.
- [ ] Add scripts: `lint`, `typecheck`, `test`, `build`, `seed`, `reset-demo`.

**Exit:** deployed blank app with login route; schemas agreed; `npm run build` green.

## Phase 2 — Data foundation (10–28%)

- [ ] Migration 001: tables + enums + CHECK constraints (`quantity >= 0`, `qty > 0`), FKs, unique keys (`sku`, `(medicine_id, batch_code, supplier_id)`, `idempotency_key`).
- [ ] Migration 002: **RLS enabled on every table** + policies per role/location; no direct write policy on `stock_balances`/`stock_movements`/`audit_events`.
- [ ] Migration 003: `post_movement` RPC (see `ARCHITECTURE.md §3`), `assert_can_move`, audit trigger/blocks, state-transition functions for transfers/procurement (`decide_transfer`, `execute_transfer`, `decide_procurement`, `receive_procurement`).
- [ ] Migration 004: derived views (`current_usable_stock`, `near_expiry_batches`, `daily_consumption`).
- [ ] `scripts/generate-demo-data.ts` → `supabase/seed.sql` with **relative dates** (see §6).
- [ ] Auth: create demo users (admin, manager, 2 staff w/ different locations) via Supabase Auth; `user_profiles` rows seeded.
- [ ] `requireUser()` helper + `services/movements.ts` calling RPC.
- [ ] **Write tests #1, #2, #3, #11, #12 now** (SQL/API level) — before any UI.

**Exit:** can post a transfer via API as manager; staff blocked; balances right; audit row exists.

## Phase 3 — Dashboard + intelligence core (28–52%)

*Parallel: UI track + Engine track (agree on types first).*

**Engine track (pure TS + Vitest)**
- [ ] `expiry.ts` — days to expiry (hospital TZ), bands, expired status.
- [ ] `fefo.ts` — eligible sort, daily simulation, `projected_at_risk_units/value`.
- [ ] `demand.ts` — 0.6/0.4 blend, sparse fallback, `LOW_DATA_CONFIDENCE`, adjustments.
- [ ] `reorder.ts` — coverage, target, effective supply (excl. pending), pack rounding, `insufficient_data`.
- [ ] `priority.ts` — separate shortage/waste 0–100 + data-quality label.
- [ ] `transfer.ts` — donor/recipient feasibility checks.
- [ ] `mdi.ts` — candidate generation + feasible-only ranking.
- [ ] Tests #4–#7, #9 passing.

**UI/API track**
- [ ] `GET /api/dashboard`, `/api/expiry`, `/api/forecasts`, `/api/recommendations` wired to services → engines.
- [ ] Dashboard KPIs + 3 charts + alert list (real data only).
- [ ] `/risks` two tabs + batch drawer + MDI cards + transfer dialog.
- [ ] `/inventory` catalog + expandable batches.

**Exit:** open near-expiry batch → see projected waste, FEFO, and a transfer candidate **from live data**.

## Phase 4 — Action workflows (52–70%)

- [ ] Transfer: propose (staff/manager) → manager decision → RPC executes → UI refresh → audit link.
- [ ] Procurement: request from reorder suggestion → approve/reject → ordered → **receive via RECEIPT movement**.
- [ ] Return/disposal requests (policy-gated; disposal is *review* only).
- [ ] Physical count → discrepancy → manager approval → `ADJUSTMENT` movement.
- [ ] Movement modal (issue/receipt/transfer/return) with before→after confirm + idempotency key.
- [ ] Audit log view (`/insights` admin tab) + per-batch trace chain.
- [ ] Tests #8, #10, #15 passing.

**Exit:** the full promise loop works for transfer and procurement.

## Phase 5 — Extended integration (70–85%)

- [ ] QR: scanner component, resolve code → batch, manual fallback, QR generator on batch detail.
- [ ] CSV: one schema, preview with row errors, commit valid rows, exports with formula escaping (test #13).
- [ ] Supplier analytics table (F14), financial scenario panel (F15).
- [ ] Rules admin UI (F17) — audited changes; engines read from settings.
- [ ] Gemini adapter: minimized payload → structured JSON → Zod → ID validation → fallback (test #14). Copilot UI + daily summary export.
- [ ] Realtime subscription + polling fallback.

**Exit:** all 19 features have a working, truthful (even if narrow) implementation.

## Phase 6 — Stabilization + demo (85–100%)

- [ ] `npm run lint && npm run typecheck && npm run build && npm test` green.
- [ ] RLS + function-privilege review checklist (§8).
- [ ] Empty/error/loading states on every actionable component.
- [ ] Mobile pass at 360px (no horizontal overflow); QR flow on a real phone over the public URL.
- [ ] Seed/reset rehearsed on the **deployed** DB; confirm reset refuses other projects.
- [ ] Demo rehearsal ×3 with the script in §9; record local screen video + screenshots of the real verified flow.
- [ ] Submission assets: repo, live URL, problem ID (PS-56), feature summary, screenshots, setup guide, teammate roles.

---

## 5. Cut-line (only if time is short)

Never cut: **atomic RPC, auth/RLS, FEFO, forecast baseline, MDI, transfer approval, audit.** If squeezed, keep contracts but go narrow-and-truthful:

| Feature | Narrow version |
|---|---|
| F03 CSV | One schema, preview + commit + export |
| F04 QR | One code format = batch UUID/`batch_code`; manual fallback always |
| F12 Returns | One configured supplier policy; others show "no policy recorded" |
| F08 Forecast | 7/30 blend only |
| F14 Supplier analytics | Lead time + price + sample-size table |
| F16 Copilot | One "Explain this risk" button + 3 suggested questions |
| Locations | 3–5 synthetic |
| Procurement | Single-line requests |

Polish order: transaction integrity → MDI logic → live demo flow → visuals.

## 6. Seed data design (synthetic, labeled)

- **Locations (5):** Central Pharmacy, ICU, Emergency, Pediatrics Ward, OT Satellite Store. Include one with cold-chain capability only at Central + ICU.
- **Medicines (20–25):** mix of criticality tiers and storage types (ambient, cold chain); generic names only.
- **Suppliers (3–4):** different lead times; **one** accepts returns with a window, others don't.
- **History:** 45 days of `ISSUE` events per medicine-location (so 7/30 blend works); make 2 medicine-locations deliberately sparse to trigger `LOW_DATA_CONFIDENCE`.
- **Batches:** staggered expiries using `current_date + interval 'N days'` — include one expired, one blocked, one recalled.
- **Hero scenario (must exist):**
  1. Central Pharmacy: batch A (medicine M) qty 400, expires in ~25 days, forecast uses ~120 → ~280 projected unused.
  2. ICU: medicine M on-hand covers ~6 days; lead time 5 + review 3 → shortage flagged.
  3. Cold-chain/compatibility passes; transfer of ~200 recommended; residual reorder smaller.
  4. A second medicine with stale count to trigger `RECONCILE`.
- Every seed row tagged `is_demo = true`; reset only deletes those.

## 7. Critical tests (must pass before submission)

1. Same idempotency key cannot post twice.
2. Over-issue rejected, balance unchanged.
3. Transfer changes both locations exactly once or neither.
4. Expired/blocked lots never in FEFO candidates.
5. FEFO consumes nearest eligible expiry first, multi-batch.
6. Forecast fallback + low-data flag with missing history.
7. Reorder respects lead time, incoming, **approved** transfers (not pending).
8. Procurement approval doesn't add stock; receiving does.
9. Return recommendation never appears without recorded policy.
10. Financial impact updates after confirmed actions; labeled prospective.
11. STAFF cannot approve manager-only actions via direct API.
12. Users can't read/mutate another location's restricted data.
13. CSV rejects invalid/duplicate batches with actionable errors.
14. Gemini outage leaves dashboards + deterministic recommendations working.
15. Movement history reconciles with balances and actions (sum of ledger = balance).

**E2E acceptance:** seed → dashboard correct → near-expiry batch shows waste/FEFO/candidate → manager approves transfer → source↓ destination↑ audit exists → risk cards refresh → scan/manual issue → procurement request approved without stock change → reconciliation with approval → AI explanation cites real IDs → simulate Gemini failure → refresh deployed URL, re-login, repeat, verify persistence.

## 8. Release checklist

- [ ] `lint`, `typecheck`, `build`, engine tests, targeted API tests green.
- [ ] Public Vercel URL works on laptop + phone; Supabase connection verified.
- [ ] `.env.example` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, server-only `GEMINI_API_KEY`; no real secrets committed (`git log -p | grep -i key` check).
- [ ] RLS enabled on all tables; policies reviewed; `execute` revoked from `public`/`anon` on every function; no service key in client bundle (search `.next/static`).
- [ ] Demo users have correct role + location scope.
- [ ] Camera-denied + Gemini-failure states handled; empty/error states present.
- [ ] Approval actions have confirmation + backend authorization; logs mask secrets, no patient data.
- [ ] Import/export handle malformed + excessive rows (cap file size/rows); formula-injection escaped.
- [ ] Seed/reset guarded by project-ref check.

## 9. Demo script (3–4 min)

| Time | Beat | Show |
|---|---|---|
| 0:00–0:20 | Problem + data | Dashboard seeded: 5 locations, ~20 medicines, staggered batches |
| 0:20–0:50 | Spot risk | Near-expiry surplus batch at Central; shortage at ICU |
| 0:50–1:25 | Explain | Actual usage, expiry exposure, FEFO, projected value, MDI suggestion |
| 1:25–2:05 | Decide | Compatible transfer; before/after forecast; manager approval |
| 2:05–2:40 | Execute | Post → both balances change, indicators refresh, audit entry |
| 2:40–3:15 | Extend | QR/manual scan; ranked procurement; grounded Gemini answer |
| 3:15–3:35 | Result | Before/after exposure; "nothing automated without staff review" |

**Backup:** seed CSV exported · "Load demo scenario" button · local screen recording + screenshots of the **real** verified flow.

## 10. Team split (adapt to size; one merge owner)

| Role | Owns |
|---|---|
| A — Backend/DB | Migrations, RLS, RPC, auth, services, APIs |
| B — UI | Shell, 5 screens, components, responsiveness |
| C — Intelligence | Engines, MDI, unit tests |
| D — Integrations | Gemini, QR, CSV, supplier/procurement, integration tests, pitch |

2–3 people: merge adjacent roles. **Freeze shared types/schemas after Phase 1**; changes go through the merge owner. Small commits, frequent integration, rebase before push.

## 11. Hidden things people forget

- **Deploy on minute 1, not hour 6.** Env var / build issues on Vercel eat the final window.
- **Make seed idempotent + relative-dated** so you can reset between rehearsals without hand-editing.
- **Write the RPC and its tests before the UI.** UI bugs are cosmetic; ledger bugs end the demo.
- **Test the phone flow on the public URL**, not localhost — camera permissions differ.
- **Ledger = balance check query** (`sum(in) − sum(out) = balance`) as a one-click admin diagnostic; great for proving integrity live.
- **Pre-warm everything** (login sessions in two browsers: manager + staff) before presenting — the role-switch moment is your strongest demo beat, and fresh logins cost 20 seconds.
- **Keep a "known limitations" slide/README section.** Judges respect honesty more than overreach.
