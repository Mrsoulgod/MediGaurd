# DESIGN — MediGuard AI

**Theme:** orange and white. Minimal, intuitive, no fluff.
**Rule of thumb:** if an element doesn't help someone decide or act, remove it.

## 1. Principles

1. **White space is the design.** White canvas, one accent (orange), generous spacing. No gradients, shadows-for-show, illustrations, or decorative icons.
2. **One primary action per view.** Exactly one filled orange button in any region. Everything else is outline or text.
3. **Evidence next to the verdict.** Each recommendation shows its numbers and dates beside the conclusion.
4. **Projected ≠ realized.** Estimates are labeled "Projected". Never "saved".
5. **Orange means "act here", not "danger".** Risk uses its own colors (see §3) so brand and alarm never get confused.
6. **Honest uncertainty.** Show `Low data`, `Stale count`, `Insufficient data` instead of confident-looking visuals.
7. **Obvious in 5 seconds.** A new user should find the next action without reading help text.

## 2. Tokens

### Color
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | App background |
| `--surface-alt` | `#FAFAF9` | Table header, subtle panels |
| `--border` | `#E7E5E4` | 1px dividers and card borders |
| `--text` | `#1C1917` | Body and headings |
| `--muted` | `#78716C` | Secondary text, labels |
| `--brand` | `#C2410C` | Primary button fill, links, active nav, focus ring |
| `--brand-hover` | `#9A3412` | Hover/pressed |
| `--brand-accent` | `#EA580C` | Charts, large icons, active-nav bar (never small text) |
| `--brand-tint` | `#FFF7ED` | Selected row, active nav background, info strip |
| `--brand-tint-2` | `#FFEDD5` | Hover on tinted surfaces |

**Contrast note:** `#EA580C` on white is only ~3.6:1, which fails for text and buttons. Use `--brand` (`#C2410C`, ~5.2:1) for anything with text. `--brand-accent` is for graphics only.

### Risk colors (separate from brand)
| State | Text | Background | Label |
|---|---|---|---|
| Expired / blocked / stockout | `#B91C1C` | `#FEE2E2` | `Expired`, `Blocked`, `Stockout` |
| Warning | `#A16207` | `#FEF9C3` | `≤30d`, `Low stock` |
| OK / executed | `#15803D` | `#DCFCE7` | `OK`, `Executed` |
| Neutral / inactive | `#57534E` | `#F5F5F4` | `≤60d`, `Pending` |

Warning is **yellow, not orange**, on purpose: orange is the brand and can't also mean "caution". Always pair color with a text label (never color alone).

Expiry bands (thresholds come from settings, never hard-coded in components): ≤7d red filled · ≤15d red outline · ≤30d yellow · ≤60d neutral · >60d no badge.

### Type & spacing
- **Font:** Inter (fallback `system-ui`). Numbers use `font-variant-numeric: tabular-nums`, right-aligned in tables.
- **Scale:** 12 · 14 (body) · 16 · 20 · 28. Weights 400 / 500 / 600 only.
- **Spacing:** 4-pt grid (4, 8, 12, 16, 24, 32, 48).
- **Radius:** 8 for everything (inputs, buttons, cards).
- **Elevation:** none. Use 1px borders. The only shadow allowed is on dialogs/popovers.
- **Motion:** 150ms opacity/transform for dialogs and hovers only. Respect `prefers-reduced-motion`.
- **Icons:** one set (Lucide), 16–20px, only where they carry meaning (status, actions). No decorative icons.

## 3. Layout

- **Desktop:** left sidebar (220px, white, 1px right border) with 5 text items; top bar with filters + user/role. Content max-width 1200px.
- **Active nav item:** `--brand-tint` background + 3px `--brand-accent` left bar + `--brand` text.
- **Mobile:** bottom tab bar (5 items), filters in a bottom sheet, modals become full-screen drawers.
- Nav: Overview · Inventory · Risks · Procurement · Insights. Admin lives as tabs inside Insights.
- Role badge visible in top bar. Actions a role can't use are hidden **and** blocked server-side.

## 4. Screens (what's on each, nothing more)

### `/dashboard` — Overview
- 6 KPI tiles in one row (wraps on small screens): Active medicines · Active batches · Low-stock items · Near-expiry units · At-risk value *(Projected)* · Pending approvals. Plain number, small label, no icon, no sparkline. Each tile links to its filtered list.
- 3 charts: consumption vs forecast (line, forecast dashed), risk by location (bar), expiry value by window (bar). All charts use orange (`--brand-accent`) as the main series and stone grays for the rest.
- Alerts list (top 5) and recent actions. "Last updated" timestamp visible.
- "Load demo scenario" is a small text button in the top bar, with a confirm dialog. A "Synthetic data" pill sits beside the page title in demo mode.

### `/inventory`
- Table of medicines with expandable rows showing batch × location balances, expiry badge, unit, cost.
- Primary button: **Record movement**. Secondary: **Scan**, **Import**, **Export**.
- Tabs: Stock · Counts · Movements. Edit forms for medicines/batches have **no quantity field**.
- Movement flow (modal): type → batch (scan/search) → quantity, location, reason → summary showing before → after → **Confirm**.
- Scanner: camera view with a simple frame; if denied, the primary button becomes **Enter code manually**.

### `/risks`
- Two tabs: **Expiry** | **Shortage** (never merged into one score).
- Row → side drawer: days to expiry, projected unused units, projected value, FEFO allocation, forecast curve, data-quality badge.
- **Recommendation card** (§5) per feasible action. Infeasible actions live in a collapsed "Not feasible — why" list.
- Transfer dialog: donor/recipient balances before → after, checklist of compatibility checks, approval note.

### `/procurement`
- Ranked table. Expand a row to see every term: daily estimate · coverage days · target · eligible stock · incoming · approved transfers · safety · **suggested qty**.
- Status stepper: Requested → Approved → Ordered → Received. Helper text under Approve: "Approval doesn't change stock. Receiving does."
- Manager actions: Approve · Reject (reason required) · Mark ordered · Receive.
- Supplier comparison table + projected savings panel.

### `/insights`
- Copilot: input, 3 suggested questions, answer with evidence chips (IDs link to real records), "Limitations" line. If AI fails: deterministic explanation + "AI summary unavailable".
- Admin tabs: Locations · Rules · Supplier policies · Users · Audit log.

## 5. Components

**Buttons:** Primary = `--brand` fill, white text. Secondary = 1px `--brand` border, `--brand` text. Tertiary = text only. Destructive = red outline (filled only inside confirm dialogs). Disabled = 40% opacity, with the reason in a tooltip.

**Inputs:** white, 1px `--border`, 8px radius; focus = 2px `--brand` ring. Labels above fields. Errors below in red text, linked with `aria-describedby`.

**Tables:** no zebra, 1px row dividers, `--surface-alt` header, sticky header, selected row `--brand-tint`.

**Badges:** one `StatusBadge` component (risk, data quality, workflow state), text + color, 12px, 6px radius.

**Recommendation card:**
```
TRANSFER · Ceftriaxone 1g · Batch B-2041
Central Pharmacy → ICU                   Needs manager approval
Move 200 units
Why   Expires in 25 days · 280 units projected unused · ICU runs out in 6 days
Checks   ✓ storage  ✓ shelf life  ✓ donor surplus  ✓ batch eligible
Projected value preserved: ₹X          Data: Good
[ Propose transfer ]  View evidence  Dismiss
```
One primary button. No icons beyond ✓/✗.

**ConfirmDialog:** states exactly what changes (before → after), primary button uses the action name ("Approve transfer"), never "OK".
**EvidenceChip:** record ID that opens its drawer.
**ProjectedValue:** wraps any estimate, adds the "Projected" label.
**Empty / Error / Skeleton:** required on every data component.
**Toast:** only after a confirmed server commit.

## 6. Required states
| State | Rule |
|---|---|
| Loading | Skeleton sized to final content, no layout shift |
| Empty | One sentence on why + the next action |
| Error | Plain language + Retry; no stack traces |
| Success | Say what changed (before → after) and link to the audit entry |
| Pending | Visible "Pending…" until server commit |
| Forbidden | "Manager approval required" style message |

## 7. Copy rules
- Short, factual, with units (`units`, `days`, `₹`). Sentence case everywhere.
- Words: **Projected / Estimated**. Never "saved", "guaranteed", "probability".
- Currency `₹` with Indian grouping (`en-IN`). Dates `DD MMM YYYY` in hospital timezone.
- AI text is labeled "AI-generated summary" and sits next to deterministic evidence.
- Inventory language only. No clinical advice.

## 8. Accessibility & responsive
- Keyboard-complete; visible 2px `--brand` focus ring; dialogs trap focus and close on `Esc`.
- Charts have a table toggle. Status is never color-only.
- Touch targets ≥ 44px on mobile. No horizontal page scroll at 360px; tables become card lists below 768px or scroll inside their own container.

## 9. Easy-to-miss details
- **Orange text on white fails contrast.** Use `#C2410C` for text and buttons, `#EA580C` only for graphics.
- **Don't let brand color carry risk.** Yellow = warning, red = danger, orange = "this is the action".
- **Explain empty recommendations** ("No eligible donor: other locations are below safety stock"). Silence looks like a bug.
- **Show before → after on every confirm.** It's the cheapest trust signal in a demo.
- **Tabular, right-aligned numbers** make the UI look precise.
- **Single-orange discipline:** if a screen has more than one filled orange element, one of them is wrong.
