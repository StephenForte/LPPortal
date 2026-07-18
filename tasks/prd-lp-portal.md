# PRD: LP Portal for a Small VC Fund

## 1. Introduction / Overview

A clean, modern web portal for a small venture fund's Limited Partners (LPs) and General Partners (GPs). LPs log in via magic link and see their capital account, look-through portfolio positions, quarterly updates, and approved company news. GPs use an admin area to manage funds, LPs, portfolio companies, valuations, and to compose quarterly LP updates (with AI drafting assistance and Pipedrive/news data in later phases) that are emailed to LPs and archived in the portal.

The problem this solves: existing LP portals are dated, expensive, and built for large funds. This is a purpose-built, low-cost (<$30/mo infra) portal for a small fund with a small LP base, prioritizing design quality and GP workflow speed.

**Key modeling decision:** many positions are SAFEs, so there are no share counts. A position is modeled as *the fund's mark on a company* plus *the LP's percentage of the fund*. An LP's look-through value in a company = `LP ownership % of fund × fund's current mark on that position`. Share counts are optional metadata for priced rounds only.

## 2. Goals

- LPs can self-serve: capital account, look-through positions, quarterly updates, approved news — in under 3 clicks from login.
- LPs in multiple funds can toggle between a consolidated view and a per-fund view.
- GPs can update a company's mark once and have every affected LP's dashboard (across all funds holding that company) reflect it immediately.
- GPs can compose, review, and email a quarterly update to all LPs of a fund without leaving the app.
- Total recurring infrastructure cost under $30/month (AI + search API usage billed to existing Anthropic/Tavily accounts, outside this budget).
- Visual design that reads as modern consumer-grade software, not 2005 enterprise.

## 3. Phasing

| Phase | Contents |
|---|---|
| **Phase 1** | Auth (magic link), LP dashboard (capital account, positions, fund selector), update composer (manual writing), publish + email, update archive, full admin CRUD |
| **Phase 2** | Pipedrive MCP integration (weekly pull + on-demand), AI drafting assistant with configurable style guide, Pipedrive data summarized in composer |
| **Phase 3** | Weekly internet news scan (Tavily), aggregation/dedupe, GP approval queue, LP-facing news feed, audit log |

---

## 4. User Stories — Phase 1

### US-001: Database schema and migrations
**Description:** As a developer, I need the core data model so all features have a foundation.

**Acceptance Criteria:**
- [ ] Tables created: `users`, `magic_link_tokens`, `funds`, `lps`, `lp_fund_positions`, `companies`, `fund_company_positions`, `updates`, `update_sections`, `settings`
- [ ] `users` has `role` ('gp' | 'lp') and links to `lps` for LP users
- [ ] `lp_fund_positions`: `lp_id`, `fund_id`, `committed`, `called`, `distributed`, `ownership_pct` (numeric, 4 decimal places). `outstanding` is computed (`committed - called`), not stored
- [ ] `fund_company_positions`: `fund_id`, `company_id`, `instrument_type` ('safe' | 'equity' | 'note'), `cost_basis`, `current_mark`, `mark_date`, `shares` (nullable), `pro_rata_rights` (boolean), `pro_rata_notes` (text, nullable), `tags` (text array)
- [ ] Same `company_id` can appear in multiple funds' positions (cross-fund holding)
- [ ] `updates`: `fund_id`, `title`, `quarter`, `status` ('draft' | 'published'), `published_at`, `intro_text`, `closing_text`
- [ ] `update_sections`: `update_id`, `company_id`, `blurb`, `sort_order`
- [ ] All money columns are integer cents or `numeric` — never floats
- [ ] Migration runs cleanly on a fresh Postgres database
- [ ] Typecheck passes

### US-002: Magic link authentication
**Description:** As an LP or GP, I want to log in with just my email so there are no passwords to manage.

**Acceptance Criteria:**
- [ ] Login page accepts email; if it matches a `users` row, sends a magic link via Resend
- [ ] Unknown emails receive the same on-screen confirmation (no user enumeration)
- [ ] Tokens are single-use, expire after 15 minutes, and are stored hashed
- [ ] Successful link click creates a session (httpOnly, secure cookie) lasting 30 days
- [ ] Login attempts rate-limited to 5 per email per hour
- [ ] GP users land on `/admin`, LP users land on `/dashboard`
- [ ] LP users cannot access any `/admin` route (server-side check, not just hidden UI)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: LP dashboard — capital account
**Description:** As an LP, I want to see my committed, called, outstanding, and distributed capital so I know where I stand.

**Acceptance Criteria:**
- [ ] Dashboard shows four figures per fund: Committed, Called, Outstanding (computed), Distributed
- [ ] Shows estimated current value: sum of (`ownership_pct` × each position's `current_mark`) for that fund — computed, never stored per LP
- [ ] Shows simple multiple: estimated value ÷ called capital, displayed to 2 decimals (e.g., "1.42x")
- [ ] All currency formatted with thousands separators, no decimals for whole-dollar amounts
- [ ] LP can only ever see their own rows (every query filtered by session's `lp_id` server-side)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: LP dashboard — positions (look-through)
**Description:** As an LP, I want to see each portfolio company and my share of its value so I understand what I actually own.

**Acceptance Criteria:**
- [ ] Position list per fund shows: company name, logo (optional), instrument type badge (SAFE / Equity / Note), fund's current mark, LP's look-through value (`ownership_pct` × mark), mark date
- [ ] Share counts shown only when `shares` is non-null (priced rounds)
- [ ] Sorted by look-through value descending by default
- [ ] Sum of look-through values matches the estimated value figure in US-003 exactly
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Multi-fund LPs — consolidated and per-fund views
**Description:** As an LP in more than one fund, I want a consolidated view or a single-fund view so I can see my whole picture or drill in.

**Acceptance Criteria:**
- [ ] Fund selector appears only when the LP has positions in 2+ funds; options: "All Funds" + each fund name
- [ ] Consolidated capital account sums committed/called/outstanding/distributed/value across funds
- [ ] Consolidated positions merge by company: a company held in Fund I and Fund II shows one row with combined look-through value, expandable to show the per-fund breakdown (fund name, that fund's mark, LP's % of that fund, look-through)
- [ ] Selection persists in URL param (`?fund=all` or `?fund=<id>`)
- [ ] LPs in exactly one fund see no selector
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Admin — funds CRUD
**Description:** As a GP, I want to create and edit funds so the portal reflects our structure.

**Acceptance Criteria:**
- [ ] List, create, edit funds: name, vintage year, fund size, currency, status (investing/harvesting/closed)
- [ ] Deleting a fund is blocked if it has LP positions or company positions (show explanatory error)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Admin — companies and positions CRUD
**Description:** As a GP, I want to manage portfolio companies and each fund's position in them, so marks and tags stay current.

**Acceptance Criteria:**
- [ ] Companies: name, website, logo URL, one-line description, sector tags, status (active/exited/written-off)
- [ ] From a company page, GP can add/edit a position per fund: instrument type, cost basis, current mark, mark date, shares (optional), pro-rata rights flag + notes, tags
- [ ] A company can hold positions in multiple funds; the company page lists all of them
- [ ] Editing a mark takes effect immediately on all LP dashboards (no cache/stale data)
- [ ] Mark edits require a `mark_date`; the UI defaults it to today
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Admin — LPs CRUD
**Description:** As a GP, I want to manage LPs and their fund positions so capital accounts are accurate.

**Acceptance Criteria:**
- [ ] LPs: name, entity name (optional), email, notes
- [ ] Creating an LP with an email creates a matching `users` row (role 'lp') so they can log in
- [ ] From an LP page, GP can add/edit positions per fund: committed, called, distributed, ownership %
- [ ] Warning (non-blocking) if a fund's LP ownership percentages sum to more than 100%
- [ ] GP can deactivate an LP (blocks login, retains data)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Admin — team members
**Description:** As a GP, I want to add other GPs/admins so the team shares the workload.

**Acceptance Criteria:**
- [ ] List, invite (by email), and deactivate GP users
- [ ] Cannot deactivate yourself or the last active GP
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Update composer (manual)
**Description:** As a GP, I want to compose a quarterly update by selecting portcos and writing a blurb for each, so LPs get a consistent, well-structured update.

**Acceptance Criteria:**
- [ ] Create update: choose fund, quarter label (e.g., "Q3 2026"), title
- [ ] Composer pre-populates a section per active company in that fund's portfolio; GP can remove sections, reorder them, and add any other company
- [ ] Each section: company name auto-filled, freeform blurb (markdown supported: bold, italics, links, lists)
- [ ] Intro and closing text blocks
- [ ] Drafts autosave; status stays 'draft' until published
- [ ] Live preview pane rendering exactly what LPs/email will show
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Publish and email update
**Description:** As a GP, I want to publish an update so it emails all LPs of that fund and appears in their portal.

**Acceptance Criteria:**
- [ ] Publish requires an explicit confirmation dialog listing recipient count
- [ ] On publish: status → 'published', `published_at` set, email sent via Resend to every active LP with a position in the fund
- [ ] Email is a clean HTML render of the update with a "View in portal" link; includes plaintext fallback
- [ ] Send failures per recipient are logged and shown to the GP with a per-recipient retry button
- [ ] Published updates cannot be edited; GP can "duplicate as new draft" for corrections
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: LP update archive
**Description:** As an LP, I want to read current and past quarterly updates in the portal.

**Acceptance Criteria:**
- [ ] "Updates" section lists published updates for the LP's fund(s), newest first
- [ ] Multi-fund LPs see updates from all their funds, labeled by fund
- [ ] Update detail page renders intro, per-company sections, closing
- [ ] LPs never see drafts or updates for funds they're not in
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Visual design system
**Description:** As a user, I want the portal to feel modern and calm so it inspires confidence.

**Acceptance Criteria:**
- [ ] Single design system applied across LP and admin: one sans-serif typeface (Inter or Geist), generous whitespace, max content width ~1100px, subtle borders over heavy shadows
- [ ] Light theme default; neutral background (not pure white), one accent color used sparingly
- [ ] Numbers set in tabular figures so columns align
- [ ] Fully responsive — LP dashboard is comfortable on a phone
- [ ] No stock dashboard clutter: no fake sparklines, no unused widgets, every element earns its place
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## 5. User Stories — Phase 2

### US-014: Pipedrive weekly sync (cron)
**Description:** As a GP, I want portco data pulled from Pipedrive weekly so the composer has fresh context.

**Acceptance Criteria:**
- [ ] Weekly cron job (Render Cron) pulls notes, activities, and deal fields from Pipedrive for each company with a stored Pipedrive org/deal ID
- [ ] Raw pulls stored in `company_data_snapshots` (`company_id`, `source` = 'pipedrive', `payload` JSONB, `fetched_at`)
- [ ] Admin company page has a "Sync now" button for on-demand refresh of one company
- [ ] Companies without a Pipedrive ID are skipped without error
- [ ] Job failures logged and surfaced in an admin "System" page
- [ ] Typecheck passes

### US-015: Pipedrive mapping in admin
**Description:** As a GP, I want to link each portco to its Pipedrive record so the sync knows what to pull.

**Acceptance Criteria:**
- [ ] Company edit form gains a Pipedrive org/deal ID field with a "test connection" check
- [ ] Pipedrive API token stored as an environment variable, never in the database or client
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-016: AI drafting assistant in composer
**Description:** As a GP, I want AI help writing each portco blurb, grounded in recent Pipedrive data and following our style guide, so updates are faster to produce and consistent in voice.

**Acceptance Criteria:**
- [ ] Each composer section shows a collapsible "Context" panel: summarized recent Pipedrive activity for that company (summarized server-side via Anthropic API)
- [ ] "Draft with AI" button generates a blurb from the context + style guide; GP can regenerate, edit freely, or discard
- [ ] AI output is always inserted as editable text — never auto-published
- [ ] Style guide and drafting rules (tone, length, banned phrases, structure) editable by GPs in admin settings, stored in `settings`, and injected into every drafting prompt
- [ ] Anthropic API key from environment variable; per-request token cap; drafting calls rate-limited to a configurable daily max
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## 6. User Stories — Phase 3

### US-017: Weekly news scan (cron)
**Description:** As a GP, I want a weekly automated scan of approved sources for each portco so news gathering is zero-effort.

**Acceptance Criteria:**
- [ ] Admin-managed "approved sources" list (domains) plus general web search via Tavily, per company, weekly cron
- [ ] Each hit stored in `news_items`: `company_id`, `url`, `source_domain`, `title`, `ai_summary`, `published_at` (best effort), `status` = 'pending'
- [ ] Dedupe: same URL never stored twice; near-duplicate titles for the same company in the same week collapsed to one item
- [ ] AI summary generated at ingest (2–3 sentences, neutral tone)
- [ ] Per-run caps: max N items per company (configurable, default 5) to bound API usage
- [ ] Typecheck passes

### US-018: GP approval queue
**Description:** As a GP, I want to approve or reject scanned news before LPs see anything, so nothing embarrassing or wrong reaches LPs.

**Acceptance Criteria:**
- [ ] Admin queue lists pending items grouped by company: title, summary, source, link out
- [ ] Approve / reject per item; bulk actions for a company's batch
- [ ] GP can edit the summary text before approving
- [ ] Nothing with status ≠ 'approved' is ever visible to LPs (enforced in queries, not UI)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-019: LP news feed
**Description:** As an LP, I want to see approved news about the companies I hold, so I stay informed between quarterly updates.

**Acceptance Criteria:**
- [ ] Dashboard "News" section shows approved items only for companies in the LP's fund(s), newest first
- [ ] Each item: company name, title, summary, source, external link
- [ ] Respects the fund selector (consolidated vs single fund)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-020: Audit log
**Description:** As a GP, I want a record of who changed marks and capital figures, so there's accountability when numbers are questioned.

**Acceptance Criteria:**
- [ ] Append-only log of changes to marks, LP capital figures, and ownership %: who, when, field, old value, new value
- [ ] Viewable in admin, filterable by company/LP
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## 7. Functional Requirements

**Auth & access**
- FR-1: The system must authenticate all users via emailed magic links (single-use, 15-min expiry, hashed at rest).
- FR-2: The system must enforce role separation server-side: LPs can access only their own data; GPs can access everything.
- FR-3: The system must rate-limit magic link requests (5/email/hour) and must not reveal whether an email exists.

**LP experience**
- FR-4: The system must display, per LP per fund: committed, called, outstanding (computed as committed − called), distributed, and estimated value.
- FR-5: The system must compute estimated value as Σ(ownership_pct × current_mark) over the fund's positions — never from a stored per-LP value field.
- FR-6: The system must display look-through positions per company, supporting SAFEs (no share count) and priced equity (optional shares).
- FR-7: For LPs in multiple funds, the system must offer a consolidated view (sums + positions merged by company with per-fund expansion) and single-fund views.
- FR-8: The system must show published updates and (Phase 3) approved news scoped to the LP's funds.

**Admin**
- FR-9: GPs must be able to CRUD funds, companies, per-fund positions (with marks, instrument type, pro-rata rights, tags), LPs, LP capital figures, ownership %, and team members.
- FR-10: A mark update must propagate to all affected LP views across all funds immediately.
- FR-11: The system must warn (non-blocking) when a fund's ownership percentages exceed 100%.

**Updates**
- FR-12: GPs must be able to compose an update per fund with per-company sections, intro, and closing, with autosave and preview.
- FR-13: Publishing must email all active LPs of the fund via Resend (HTML + plaintext) and archive the update in the portal; per-recipient failures must be retryable.
- FR-14: Published updates must be immutable; corrections happen via "duplicate as draft."

**Integrations & automation**
- FR-15 (P2): A weekly cron must sync Pipedrive data per linked company into JSONB snapshots; on-demand sync per company must be available.
- FR-16 (P2): The composer must summarize recent Pipedrive data per company and offer AI blurb drafting governed by a GP-editable style guide; AI output is always editable, never auto-published.
- FR-17 (P3): A weekly cron must scan approved sources + Tavily search per company, dedupe, summarize, and queue items as 'pending'.
- FR-18 (P3): Only GP-approved news items may appear to LPs; approval status must be enforced at the query layer.
- FR-19: All secrets (Pipedrive, Anthropic, Tavily, Resend, DB) must live in environment variables.
- FR-20: All AI and search calls must respect configurable per-day caps.

## 8. Non-Goals (Out of Scope)

- No capital call **workflow** (issuing calls, tracking wires, reminders) — capital figures are admin-entered balances. A transaction ledger is a possible future migration; the schema keeps capital figures in `lp_fund_positions` so a ledger can later compute into it.
- No distributions waterfall math, carry, or management fee calculations.
- No document vault in v1 (K-1s, subscription docs) — updates only. (Candidate for Phase 3+ if needed.)
- No LP-side write actions of any kind (no messages, no acknowledgments, no e-sign).
- No multi-currency math — one currency per fund, no FX conversion in consolidated views (flag in UI if funds differ).
- No public marketing pages; the portal is login-only.
- No native mobile apps — responsive web only.
- No SOC 2 / penetration-test formal compliance program (follow the security practices in FR-1–3, FR-19 regardless).

## 9. Design Considerations

- **Tone:** calm, editorial, confidence-inspiring. Reference points: Mercury, Linear, Carta's cleaner pages — not legacy fund-admin portals.
- Typography-led hierarchy; one accent color; neutral warm-gray background; subtle 1px borders; tabular figures for all numbers.
- LP dashboard is the flagship screen: capital account summary as a single clean strip at top, positions as a refined table/card hybrid below, updates and news as secondary tabs or sections.
- Admin can be denser and more utilitarian but must share the same design tokens.
- Empty states designed deliberately (new LP, no news yet, no updates yet).
- Email template mirrors portal typography as closely as HTML email allows; single-column, no images required.

## 10. Technical Considerations

- **Stack:** Next.js (App Router) single app serving LP portal, admin, and API routes. Postgres via Drizzle or Prisma. Deployed on Render.
- **Jobs:** Render Cron Job services hitting internal job endpoints (or standalone scripts) for weekly Pipedrive sync and news scan. Cron services on Render bill only for runtime — near-zero for weekly jobs.
- **Email:** Resend (free tier: 3,000/mo, 100/day) — comfortably covers a small LP base including magic links.
- **AI:** Anthropic API (existing account, off-budget). Use a small model (Haiku-class) for news summarization; a stronger model for blurb drafting. Token caps per request; daily call caps in `settings`.
- **Search:** Tavily (existing account, off-budget), weekly, capped per company.
- **Pipedrive:** REST API with API token (the "MCP connection" requirement is satisfied by direct API integration server-side; an MCP server wrapper is unnecessary complexity for a cron job).
- **Money:** integer cents or `numeric` columns; `ownership_pct` as numeric(7,4).
- **Estimated monthly cost:** Render web service $7 + Render Postgres ~$7 + cron runtime <$1 + Resend $0 + domain ~$1 amortized ≈ **$16/mo**, leaving headroom under the $30 cap.
- **Backups:** Render Postgres daily backups included on paid tier; additionally a weekly `pg_dump` to object storage is a cheap belt-and-suspenders option (open question below).
- **Data isolation:** every LP-facing query joins through the session's `lp_id`; add integration tests specifically asserting an LP cannot fetch another LP's or another fund's data.

## 11. Success Metrics

- LP can find their outstanding capital and estimated value within 3 clicks of the magic link email.
- GP can produce and send a quarterly update for a 15-company fund in under 60 minutes (Phase 2 target with AI drafting: under 30).
- Mark update → LP dashboard reflects it in the same request cycle (no cache lag).
- Infra bill ≤ $30/mo every month; AI/search usage stays within configured daily caps.
- Zero cross-LP data leakage (verified by automated tests on every deploy).

## 12. Open Questions

1. **Distributions display:** capital account includes a `distributed` field — confirm LPs should see it (DPI implied) or whether v1 hides it until distributions actually happen.
2. **Valuation history:** do you want mark history retained (chart per company over time), or is latest-mark-only fine for v1? Schema keeps `mark_date`, so history is a small add.
3. **Fund-level docs:** any near-term need for uploading PDFs (K-1s, audited financials)? Currently out of scope; changes storage requirements if added.
4. **Approved sources list:** seed list of domains for the news scan (TechCrunch, company blogs, press-release wires?) — needed before Phase 3 build.
5. **Backup posture:** is Render's built-in daily backup sufficient, or add weekly off-site dump (~$0–1/mo on Cloudflare R2)?
6. **Custom domain + email domain:** confirm the sending domain for Resend (SPF/DKIM setup on your DNS) — deliverability to LP inboxes matters more than anything else in feature 10.
