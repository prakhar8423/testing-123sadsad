# PLAN.md — Fieldpost

## APP
- Name: Fieldpost
- An IT service-desk workspace for support agents and leads: work a live ticket queue,
  run incidents end-to-end, fulfill service requests, search a knowledge base, and watch
  SLA health — all in one dense, fast console.
- Target users: IT support agents (primary) and service-desk leads (secondary) at a
  small-to-midsize company. Internal, single-tenant, private.
- Primary device: desktop (data-dense workspace); layout stays usable down to tablet and
  degrades gracefully on mobile (queue becomes stacked cards, sidebar collapses).

## FEATURES

1. **Ticket queue & triage**
   Central table of all tickets showing ID, subject, requester, priority, status,
   category, assignee, SLA due (relative, with breach highlight), and updated time.
   Multi-facet filtering (status, priority, category, assignee, "my tickets",
   "unassigned", "SLA at risk"), full-text search over subject/requester, and column
   sorting. Bulk-select rows to reassign or change status.
   *Acceptance:* Filters and search combine and update the row count live; sorting by any
   sortable column works both directions; "SLA at risk" shows only tickets due within
   4h or already breached; bulk actions apply to all selected rows and toast the result;
   empty result shows a "no tickets match these filters" state with a clear-filters
   action.

2. **Create & edit ticket**
   Dialog to log a new incident: subject (required), description, requester (select from
   people), category (Hardware / Software / Network / Access / Email / Other), priority
   (Low / Medium / High / Urgent), assignee (optional). Priority + category derive an SLA
   due date via a resolution-target matrix. Editing changes status, assignee, priority
   inline from the detail page.
   *Acceptance:* Subject required and trimmed non-empty; new ticket gets a sequential ID
   (INC-####), status New, computed SLA due, and a "created" timeline event; validation
   errors shown inline; on save the ticket appears in the queue and a toast confirms.

3. **Ticket detail & timeline**
   Full incident view: header (ID, subject, priority/status/category badges), a live SLA
   clock (time remaining or overdue), requester + assignee panel, and a chronological
   activity timeline mixing system events (created, status changed, reassigned, SLA
   breached) and agent comments. Compose box to add a public reply or internal note.
   Attach a knowledge-base article to the ticket.
   *Acceptance:* Status/assignee/priority changes write a timeline event and update the
   queue; adding a comment appends to the timeline with author + timestamp and clears the
   box; internal notes are visually distinct from public replies; resolving a ticket sets
   status Resolved and stops the SLA clock.

4. **Service catalog**
   Grid of request items grouped by category (e.g. "New laptop", "Software license",
   "VPN access", "New-hire onboarding", "Password reset"), each with title, description,
   icon, and typical fulfillment time. Ordering an item opens a short request form and
   creates a linked service-request ticket (type = Request) in the queue.
   *Acceptance:* Each catalog item opens its form; submitting creates a ticket of type
   Request with the item name as subject prefix and category mapped; the new ticket is
   findable in the queue; catalog search filters items live.

5. **Knowledge base**
   Searchable list of articles (title, category, excerpt, updated date, view count) with
   a reader view showing full body, related articles, and "was this helpful" feedback.
   Agents search and open articles, and can attach one to a ticket from the detail page.
   *Acceptance:* Search filters by title/body; opening an article shows full content and
   increments a view count in state; empty search shows a "no articles found" state;
   article reader has a back-to-list affordance.

6. **Dashboard**
   Lead/agent landing view: KPI stat row (open tickets, SLA breached, resolved today,
   avg. first-response), an open-tickets-by-priority bar chart, a tickets-by-status
   donut, a 14-day ticket volume line (created vs resolved), an "SLA at risk" shortlist,
   and a recent-activity feed. All cards deep-link into a filtered queue.
   *Acceptance:* KPIs compute from ticket data; charts render with real seed data (recharts,
   `var(--chart-1..5)`); clicking a priority bar navigates to the queue pre-filtered to
   that priority; loading shows skeletons, never layout shift.

7. **Reports**
   Analytics view: resolution-time trend, tickets by category, agent leaderboard
   (assigned / resolved / avg resolution), and SLA compliance rate over time, with a
   time-range selector (7 / 30 / 90 days).
   *Acceptance:* Changing the range recomputes every chart/table; agent table sortable by
   each metric; empty range shows an informative empty state.

## SCREENS
- **Dashboard** (`/`) — KPI row, charts, SLA-at-risk list, activity feed. Empty state
  (fresh install, no tickets): illustration-free panel inviting the user to create the
  first ticket or open the catalog.
- **Ticket queue** (`/tickets`) — filter bar + toolbar (search, saved views, bulk
  actions) above a dense sortable table. Empty state: "no tickets match" with clear
  filters; true-empty: "your queue is clear."
- **Ticket detail** (`/tickets/:id`) — two-column: main timeline + compose on the left,
  metadata/SLA/assignee panel on the right. Not-found state for bad IDs.
- **Service catalog** (`/catalog`) — searchable category-grouped card grid; per-item
  request dialog. Empty search state.
- **Knowledge base** (`/kb`) — search + article list; **article reader** (`/kb/:id`) with
  body, related, helpfulness. Empty search + not-found states.
- **Reports** (`/reports`) — range selector + charts + agent table. Empty-range state.
- **App shell** — persistent left sidebar (nav + collapse), top bar (global search,
  "New ticket" button, theme toggle, current-user chip). All screens: loading skeletons,
  error state (retry), empty state, data state.

## DATA MODEL & STATE
- **PERSISTENCE: local** — all data lives in the browser via localStorage (zustand,
  persisted). No backend. Seed on first run; a "reset demo data" action restores seeds.
- **AUTH: public** — no sign-in. Internal single-user demo workspace; a fixed current
  agent ("you") is assumed for authored comments/assignment. No login page.

Entities (localStorage shapes; seed generously, dates as ISO strings, IDs stable):
- **Ticket** — `id` (INC-#### / REQ-####), `type` ('incident' | 'request'), `subject`,
  `description`, `requesterId`, `assigneeId | null`, `category` ('hardware' | 'software' |
  'network' | 'access' | 'email' | 'other'), `priority` ('low' | 'medium' | 'high' |
  'urgent'), `status` ('new' | 'open' | 'in_progress' | 'on_hold' | 'resolved' |
  'closed'), `createdAt`, `updatedAt`, `slaDueAt`, `slaBreached` (bool),
  `firstResponseAt | null`, `catalogItemId | null`, `attachedArticleIds` (string[]).
  **Seed 45+ tickets** spread across all statuses/priorities/categories, with realistic
  subjects ("Laptop won't boot after update", "Request: VPN access for contractor",
  "Outlook not syncing on mobile"), timestamps over the last ~30 days, a mix of assigned/
  unassigned and several SLA-breached/at-risk.
- **TimelineEvent** — `id`, `ticketId`, `kind` ('created' | 'status_changed' |
  'assigned' | 'priority_changed' | 'comment' | 'internal_note' | 'sla_breached' |
  'resolved'), `actorId`, `body` (for comments/notes), `meta` (from/to values),
  `createdAt`. **Seed 4–10 events per ticket** so timelines look alive.
- **Person** — `id`, `name`, `email`, `role` ('agent' | 'requester'), `team`, `avatarHue`
  (number, for generated initials avatar). **Seed ~8 agents + ~20 requesters.**
- **CatalogItem** — `id`, `title`, `description`, `category`, `icon` (lucide name),
  `fulfillmentDays`. **Seed ~10 items** across categories.
- **Article** — `id`, `title`, `category`, `excerpt`, `body` (markdown-ish paragraphs),
  `updatedAt`, `views`, `helpfulYes`, `helpfulNo`. **Seed ~14 articles.**
- **UI state (zustand, not persisted):** active filters, search text, selected rows,
  open dialogs, sort column/direction, report range, sidebar collapsed.
- **SLA matrix (named constants):** resolution targets in hours by priority
  (urgent 4h, high 8h, medium 24h, low 72h); "at risk" = due within 4h and not resolved.

## COMPONENTS
- **Table** — ticket queue, agent leaderboard, article list.
- **Card** — dashboard KPIs/charts, catalog items, detail panels.
- **Dialog** — create ticket, catalog request form, bulk-action confirm, reset data.
- **Badge** — status, priority, category, SLA state (color-coded per semantic tokens).
- **Tabs** — ticket detail (Timeline / Details), reports sections.
- **Select / DropdownMenu** — filters, assignee, priority, status, bulk actions, range.
- **Input / Textarea / Label** — forms, search, compose box.
- **Checkbox** — bulk row selection.
- **Avatar** — people (initials + `avatarHue`).
- **Skeleton** — all loading states.
- **Sonner (toast)** — action confirmations.
- **Tooltip** — SLA clock detail, truncated cells, icon buttons.
- **Separator / ScrollArea** — timeline, sidebar.
- **Sidebar** — app-shell navigation.
- **recharts** — bar, donut/pie, line charts (`var(--chart-1..5)` only).
- **Popover / Command** — global search / saved views.

## DESIGN SYSTEM

### Design spec
- **Color mode: light.** Scene: a service-desk agent in a bright open-plan office,
  mid-afternoon, scanning a queue of tabular tickets for hours — long reading sessions in
  ambient light demand a calm high-contrast light surface; dark would be a "tools look
  cool" reflex, not this context.
- **Color strategy: restrained.** A dense data tool — the data is the star. Tinted
  near-neutral surfaces + one olive-green brand color for primary actions/selection, and
  semantic status colors doing the coding work. Accent used sparingly (links, highlights).
- **Palette (OKLCH).** Brand hue ≈ 132° (moss/olive green), NOT ITSM-reflex blue.
  - Primary `oklch(0.52 0.126 132)`, primary-foreground `oklch(0.985 0.01 132)` (white
    text — saturated mid-luminance fill).
  - Accent (warm clay, second brand color) `oklch(0.62 0.13 48)` for links/highlights,
    accent-foreground `oklch(0.985 0.008 48)`.
  - Background pure-ish white `oklch(0.995 0.002 132)`; card `oklch(1 0 0)`; surface/muted
    `oklch(0.965 0.006 132)`; secondary `oklch(0.955 0.008 132)`.
  - Foreground/ink `oklch(0.24 0.012 140)` (≥7:1 on bg); muted-foreground
    `oklch(0.47 0.012 140)` (≥4.5:1). Border `oklch(0.9 0.006 132)`; input same; ring =
    primary. Tinted neutrals carry ~0.006–0.012 chroma toward 132° (subtle, not "green").
- **Semantic colors (ticket status/priority).**
  - New = info blue `oklch(0.55 0.12 245)`; Open/In-progress = amber
    `oklch(0.72 0.15 75)`; Resolved/Closed = emerald `oklch(0.58 0.12 158)` (kept distinct
    from the olive primary); On-hold = neutral muted; Urgent/High priority & SLA-breach =
    destructive red `oklch(0.56 0.19 25)`. Priority: Low neutral, Medium blue, High amber,
    Urgent red. Filled status/priority chips use white text (saturated) or dark text on
    pale fills; verify AA.
- **Contrast:** body ink ≥7:1; muted ≥4.5:1; every filled chip/button foreground checked
  to AA. No light-gray-on-tinted-white body text.
- **Font:** headings **Spectral** (serif, grounded/editorial — section titles, page
  headers, KPI numbers, article bodies); body/UI/data **Public Sans** (humanist sans,
  workmanlike, highly legible at small sizes — tables, labels, buttons, forms). Contrast
  axis serif + sans; neither is a reflex default.
- **Layout:** persistent collapsible left **sidebar** nav + top bar; content zones are
  dense (compact table rows, tight KPI cards). Airy on the dashboard, dense in the queue.
  Dark mode via `.dark` token swap (surfaces to brand-tinted near-black, same hue).
- **Corner radius: `0.25rem`** — crisp, instrument-like; a workmanlike operational console,
  not a friendly consumer app.
- Avoid AI tells: no purple gradients, no cream/sand body bg, no gradient text, no colored
  side-stripe card borders, no ghost-card (1px border + wide shadow) combos.

### theme.json
Written at workspace root; values match the palette above (both light + dark token sets).

## NOTES
- Resolved with best-practice defaults (user deferred all choices): scoped v1 to an
  agent-focused workspace covering incidents + service requests + KB + SLA dashboards +
  reports — a complete service desk, not a single screen. Priority uses a
  priority+category → SLA-due matrix (simpler than full ITIL impact×urgency, richer than
  status-only).
- Non-goals for v1: change management, asset/CMDB, multi-tenant, real email ingestion,
  real-time collaboration, role-based permissions (single assumed current agent).
- Deliberately chose an olive-green brand over ServiceNow-blue to avoid the category
  color reflex while staying calm and professional.
