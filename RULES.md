# RULES — MediGuard AI (for every human and AI agent working in this repo)

Read `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `IMPLEMENTATION_PLAN.md` before coding. These rules override convenience. If a rule blocks you, **stop and report**; don't work around it.

## 0. The contract
> Record → Detect → Forecast → Evaluate feasible actions → Explain → Review/Approve → Execute atomically → Verify outcome + audit.

Every change must serve this loop. If it doesn't, don't build it.

## 1. Absolute rules (never break)

1. **No direct balance writes.** Stock changes only through the `post_movement` RPC (and its sibling state functions). No `UPDATE stock_balances` from app code, no generic CRUD on balances or ledger.
2. **No hardcoded business values in UI or engines**: no inventory quantities, risk values, procurement decisions, thresholds, entity names. Thresholds come from `rule_configs`. Demo data lives only in seed, labeled `is_demo`.
3. **Gemini never decides or executes.** It explains verified, deterministic findings. No AI output touches stock, approvals or numbers.
4. **Human approval** for purchases, transfers, returns, adjustments, disposal. Ordinary issue/receipt still need confirmation + audit.
5. **Expired / quarantined / recalled / blocked stock is never recommended for use or transfer.** Expiry = unusable from `expires_on`.
6. **No clinical advice, no substitution suggestions, no patient data.** Inventory language only.
7. **No fabricated claims**: no fake accuracy, fake savings, fake urgency, fake probabilities, mock buttons shown as integrations, or "done/working" statements you haven't verified.
8. **No secrets in client or repo.** `GEMINI_API_KEY` and service keys are server-only. Never commit `.env*` except `.env.example`.
9. **No unreviewed destructive migrations.** Never `DROP`, `TRUNCATE`, or destructive `ALTER` without explicit human sign-off in the task.
10. **No business formulas duplicated** between client and server. One implementation in `src/engines/`.

## 2. Code standards

- TypeScript strict. No `any` (use `unknown` + Zod). No `// @ts-ignore` without a comment explaining why.
- **Engines are pure**: input → output; no DB, network, or `Date.now()` (accept `now`/`settings` params). Every engine function has Vitest tests including edge cases.
- **Routes are thin**: `requireUser()` → Zod parse → service call → typed error mapping. No formulas in routes or components.
- **Schemas** in `src/schemas/`, reused by server + UI. Never re-declare a shape inline.
- **Money**: decimal-safe (`numeric(12,2)` in DB; integer paise or a decimal lib in code). Never float math for currency.
- **Quantities**: integers unless the medicine explicitly supports fractions.
- **DB numerics arrive as strings** — convert in one mapper layer, not in components.
- **Dates**: `timestamptz` UTC in DB; `expires_on` is `date`; compute day differences in the hospital timezone (`HOSPITAL_TIMEZONE`, default `Asia/Kolkata`).
- Error shape: `{ error: { code, message, fields? } }`. No stack traces to client.
- Naming: files `kebab-case` for components, `camelCase` for functions, `SCREAMING_SNAKE` for movement/action enums.
- Prefer small, focused files; no giant "utils" dumping ground.

## 3. Database rules

- RLS enabled on **every** table. New table ⇒ policies in the same migration.
- `security definer` functions **must** `set search_path = public`; `revoke execute from public, anon`; `grant` only to `authenticated`.
- Derive actor from `auth.uid()` inside the function. Never accept `actor_id` from input.
- Lock rows `for update` in `(batch_id, location_id)` order. Enforce `quantity >= 0` with CHECK **and** guard.
- `stock_movements` and `audit_events` are append-only (no UPDATE/DELETE grants; trigger blocks). Corrections = new entries.
- Idempotency key is mandatory on every posting; created client-side when a dialog **opens**.
- Legal state transitions only (e.g., EXECUTED can't re-execute; procurement approval never adds stock).
- Migrations are additive, ordered, reviewed. Seed/reset must refuse to run unless `SEED_ALLOWED_PROJECT_REF` matches.

## 4. Security rules

- Every API route authenticates and authorizes by **role + location** server-side; hiding UI is never enough.
- Staff cannot call manager-only actions even with a hand-crafted request (tested).
- Validate all inputs with Zod; cap CSV size/rows; reject malformed rows with actionable messages.
- **CSV export**: escape cells starting with `=`, `+`, `-`, `@`, tab, CR.
- Logs: mask secrets; never log patient data, tokens, or full AI prompts containing IDs of real people (there should be none).
- Gemini payload: minimized factual fields only (IDs, quantities, risk factors, proposals, uncertainty).

## 5. AI (Gemini) rules

- Server-side only via `@google/genai`; timeout + `AbortController`; one retry max.
- Request structured JSON → validate with Zod → **drop any `source_record_ids` not present in the input payload**.
- Prompt must forbid: inventing facts, authorizing purchases, prescribing, overriding hard rules, presenting estimates as certain.
- On any failure render the deterministic explanation + a small "AI summary unavailable" notice. The app must remain fully usable.
- Label AI text "AI-generated summary". Never present it as a recommendation engine output.

## 6. UI rules

- Follow `DESIGN.md` tokens; use shadcn/ui; don't invent new colors.
- Risk color/labels from the single shared mapping; thresholds from settings.
- Every actionable component has **loading, empty, error, success** states.
- Confirmation dialogs show exact **before → after** quantities and a specific action label.
- Success toast only **after** server commit. Pending state is visibly "Pending…".
- Estimates always wrapped in `ProjectedValue` ("Projected"). Never "saved/realized".
- Edit forms for batches/medicines have **no quantity field**.
- Responsive to 360px with no horizontal page overflow. Camera-denied → manual entry.
- Accessibility: keyboard, focus ring, labels, non-color-only status.

## 7. Testing rules

- Engines: Vitest, deterministic, injected `now`. Add a test with every bug fix.
- The 15 critical tests in `IMPLEMENTATION_PLAN.md §7` are release gates. Don't delete or skip them.
- Before declaring a task done run: `npm run lint && npm run typecheck && npm test && npm run build`.
- Never mark something "working" based on reading code. Run it. If you can't, say so.

## 8. Workflow rules

- Work on one task at a time; small cohesive commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- Don't mix framework upgrades, broad refactors or unused infra into feature work.
- Don't add dependencies without a one-line justification; prefer what's already in the stack.
- Don't build endpoints/components nobody uses.
- Shared types/schemas are frozen after Phase 1; propose changes to the merge owner.
- Any architecture change updates `ARCHITECTURE.md`, the DB/API contract and tests **in the same change**.
- Ask before: deleting files, changing RLS, changing migrations already applied, adding services.

## 9. Required completion report (every task, no exceptions)

```
### Task: <name>
Changed files: <list>
Commands run: <lint / typecheck / test / build + results>
Tests added/updated: <list>
Behavior verified (how): <what you actually ran/clicked>
Failures / not verified: <honest list>
Remaining blockers / follow-ups: <list>
Assumptions made: <list>
```

If something failed or wasn't run, say so plainly. "Should work" is not a status.

## 10. Do-not list (quick scan)

- ❌ Mock interactions claiming integration
- ❌ Gemini → inventory update
- ❌ Fake forecast accuracy / savings / urgency / clinical risk
- ❌ Client + server copies of the same formula
- ❌ Generic CRUD update on balances
- ❌ Counting expired/blocked as usable
- ❌ Assuming a supplier accepts returns without recorded policy
- ❌ Ignoring storage compatibility on transfers
- ❌ Counting *pending* transfer suggestions as supply
- ❌ Real patient/protected clinical data
- ❌ Committing secrets or running seed against an unintended DB
- ❌ Reporting success without running the check

## 11. Easy-to-miss traps

- Approved ≠ executed ≠ received. Three different states; only receipt/execution moves stock.
- A discrepancy or stale count can make a recommendation wrong → surface `RECONCILE` first.
- `LOW_DATA_CONFIDENCE` must visibly downgrade trust in forecasts and candidates.
- Seed dates must be relative to today, or the demo "expires" overnight.
- Double-click safety = idempotency key made on dialog open + disabled button while pending.
- Test with two different-role sessions side by side; most auth bugs only show there.
