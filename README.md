# Northpointe Help Desk Analytics Dashboard

A full-stack ticket analytics platform for Northpointe Bank IT. It connects live to **ServiceDesk Plus Cloud (SDP On-Demand)**, turns raw ticket data into real-time dashboards, SLA monitoring, and reports, and includes an **AI assistant (Claude)** that answers questions by querying your live SDP data on demand.

Built with Next.js 15, TypeScript, Prisma, and Tailwind. Secured with Azure AD (Entra ID) single sign-on.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Feature Overview](#feature-overview)
- [Screens](#screens)
- [AI Assistant](#ai-assistant)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [ServiceDesk Plus Integration](#servicedesk-plus-integration)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Security Notes](#security-notes)

---

## What It Does

The help desk runs on ServiceDesk Plus, but SDP's built-in reporting is slow to slice and hard to share. This dashboard:

- **Syncs** tickets, groups, technicians, categories, and SLAs from SDP into a local database for fast querying.
- **Visualizes** volume, status, SLA compliance, and team/category performance across any time period (today → this year, plus prior periods for trend comparison).
- **Surfaces** the live open queue — every currently-open ticket regardless of when it was created — with age and urgency highlighting.
- **Answers questions in plain English** through a built-in Claude chatbot that queries SDP live.
- **Links straight back to SDP** so any ticket can be opened in the source system in one click.

It's designed for IT admins, team leads, and management who need at-a-glance operational insight without logging into SDP and building reports by hand.

---

## Feature Overview

### 📊 Analytics Dashboard
- **KPI cards** — total tickets, open, closed, SLA compliance, average resolution time, SLA breaches — each with a period-over-period delta (▲/▼ vs. the previous comparable period).
- **Ticket volume chart** — created vs. open vs. closed over time, bucketed by hour/day/month depending on the selected period.
- **Status donut** — live distribution across all ticket statuses.
- **Group performance table** — tickets, open/closed counts, and SLA % per team.
- **Category breakdown** — ticket counts by category and subcategory, with trend arrows. Categories with zero tickets in the period are hidden, and tickets with no category roll up into an **"Unassigned"** row.
- **Top agents** and **recent activity** feeds.
- **Click-to-drill-down** — click any KPI or segment to expand the underlying ticket list inline.
- **Time period selector** — Today, This Week, This Month, Last Month, This Quarter, Last Quarter, This Year, Last Year.

### 🎫 Ticket Browser
- Full searchable, filterable table of every ticket.
- Filter by status and priority; free-text search across subjects.
- **Server-side sorting and pagination** on every column.
- Click any row to open a **detail panel** with the full description, metadata, and the ticket's notes/conversation pulled **live from SDP**.
- **Open in ServiceDesk Plus** — the panel links directly to the live request in SDP (opens in a new tab); the ticket number is also a direct link.

### 🟢 Live Queue (Analytics)
- Every currently-open ticket, independent of creation date — the true "what's on our plate right now" view.
- Summary cards: total open, urgent, SLA-breaching, and oldest ticket age.
- One-click facet filters by status, group, and agent.
- **Age highlighting** — tickets aging past 14 / 30 days are color-flagged.
- **Auto-refreshes every 60 seconds**, with a manual refresh and "updated X ago" indicator.

### ⏱️ SLA Monitor
- Radial gauge of overall SLA compliance for the month (green/amber/red thresholds).
- Breach counts and per-group SLA tracking.

### 📄 Reports
- Combine filters — group, technician, category, and multi-select priority/status — to build a focused view.
- Reuses the KPI cards, group performance, category, and top-agent components against the filtered data set.
- **CSV export** for sharing outside the app.

### ⚙️ Settings & Sync
- View SDP connection configuration.
- Trigger a **Full** or **Incremental** sync from SDP on demand, with live progress polling and a completion toast.
- Shows last sync time, ticket count, and status.

### 🔔 Sortable Tables Everywhere
Every data table in the app — Groups, Categories, Live Queue, drill-downs, and the Ticket Browser — has clickable column headers. Click to sort, click again to reverse. Priority sorts by severity (Urgent → Low), not alphabetically.

### 🎨 Polish
- **Light / dark mode** plus a raspberry brand accent theme, applied before first paint (no flash).
- **Installable as a desktop app** (PWA) with a branded icon and manifest.
- **Notifications** with mark-as-read.
- Smooth transitions (Framer Motion), skeleton loading states, and toast notifications throughout.

---

## Screens

| Route | Screen | Purpose |
|---|---|---|
| `/login` | Login | Azure AD single sign-on |
| `/` | Dashboard | KPIs, charts, tables, drill-downs by time period |
| `/tickets` | Ticket Browser | Search, filter, sort, paginate; detail panel + SDP links |
| `/analytics` | Live Queue | All open tickets, auto-refreshing, faceted filters |
| `/sla-monitor` | SLA Monitor | Compliance gauge and breach tracking |
| `/reports` | Reports | Multi-filter analysis with CSV export |
| `/settings` | Settings | SDP config and on-demand sync |

---

## AI Assistant

A floating chat widget (bottom-right of every page) powered by **Anthropic's Claude** using tool-use. Instead of guessing from stale data, Claude calls a `query_tickets` tool that hits ServiceDesk Plus **live** and answers from the real result.

Supported query types:
`count_tickets`, `tickets_by_group`, `tickets_by_technician`, `tickets_by_status`, `tickets_by_category`, `tickets_by_subcategory`, `ticket_trends`, `recent_tickets`, and `lookup_ticket`.

Example questions:
- "How many tickets are open this week?"
- "Which team has the most tickets this month?"
- "Show me ticket trends for the last 30 days."
- "Break down tickets by category this month."
- "Look up ticket #12345."

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 18, TypeScript |
| Styling / UI | Tailwind CSS, shadcn/ui + Radix primitives, Framer Motion, Lucide icons |
| Charts | Recharts |
| Font | Inter (self-hosted via `@fontsource-variable/inter` — no build-time external fetch) |
| Backend | Next.js API Routes (server-side) |
| Database | PostgreSQL (production) / SQLite (local dev), via Prisma ORM |
| Auth | NextAuth v4 + Azure AD / Entra ID SSO |
| Integration | ServiceDesk Plus Cloud via Zoho OAuth2 (refresh-token flow) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) with tool use |
| Deployment | Docker; Azure App Service or Vercel |

---

## Architecture

```
src/
├── app/
│   ├── (auth)/login/            # Azure AD login page
│   ├── (dashboard)/             # Authenticated pages (guarded by layout)
│   │   ├── page.tsx             # Main dashboard
│   │   ├── tickets/             # Ticket browser + detail panel
│   │   ├── analytics/           # Live queue
│   │   ├── reports/             # Report builder + CSV export
│   │   ├── sla-monitor/         # SLA compliance
│   │   └── settings/            # Config + sync
│   └── api/
│       ├── auth/[...nextauth]/  # NextAuth handler
│       ├── analytics/           # dashboard / filters / live data
│       ├── tickets/             # list + [id] detail (live SDP notes)
│       ├── chat/                # Claude chatbot endpoint
│       ├── sync/                # SDP sync trigger + status
│       └── notifications/       # notification feed
├── components/
│   ├── layout/                  # Sidebar, Header, theme + color switchers, notifications
│   ├── dashboard/               # KPI cards, charts, tables, feeds
│   ├── tickets/                 # Ticket detail panel
│   ├── chatbot/                 # Floating AI assistant
│   └── ui/                      # Reusable primitives (e.g. sortable table header)
├── lib/
│   ├── analytics/aggregations.ts        # All KPI / breakdown queries
│   ├── auth/config.ts                   # NextAuth + Azure AD
│   ├── claude/chat.ts                   # Claude with live SDP tool use
│   ├── db/prisma.ts                     # Prisma client
│   ├── integrations/servicedesk-plus/   # OAuth2 client + sync engine
│   ├── useSortableData.ts               # Client-side table sort hook
│   └── utils.ts                         # Dates, formatting, SDP deep links
└── types/index.ts                       # Shared TypeScript types
prisma/
├── schema.prisma                # Data model
└── seed.ts                      # Sample data for local dev
```

---

## Data Model

Core entities (Prisma):

- **Ticket** — the central record: subject, status, priority, timestamps, SLA breach flag, resolution/response times, and relations to group, technician, category, subcategory, and SLA. Indexed for fast period and status queries.
- **Group**, **Technician** (+ **TechnicianGroup** join), **Category** (+ **Subcategory**), **SLA** — lookup tables synced from SDP.
- **TicketHistory** — field-level change log.
- **SyncJob** — tracks each sync (type, status, ticket count, errors).
- **AnalyticsSnapshot** — cached period aggregates.
- **ChatSession** / **ChatMessage** — chatbot conversation storage.
- **User / Account / Session** — NextAuth (Azure AD) identity.
- **AppConfig** — key/value app settings.

---

## ServiceDesk Plus Integration

- **Instance:** `https://northpointe.sdpondemand.manageengine.com`
- **Auth:** Zoho OAuth2 **refresh-token flow** (not a static API key).
- **Sync engine:** full and incremental syncs, with concurrency limiting (`p-limit`) and automatic retries (`p-retry`).
- **Deep links:** tickets link back to the SDP web UI at `/app/itdesk/ui/requests/<id>/details`.

SDP API quirks handled in code:
- Time filter condition is `"lesser than"` (not `"less than"`).
- Time values must be nested as `{ value: "<epoch_ms>" }`.
- Category/subcategory require an explicit `fields_required` in `list_info`.
- Ticket lookup by display ID requires a search, then a detail fetch by internal ID.

---

## Getting Started

### Prerequisites
- Node.js 20+ and git
- **Azure AD (Entra ID) app registration — required to sign in** (see the note below)
- Zoho OAuth2 credentials (from the SDP API console) — for live sync and the chatbot
- Anthropic API key — for the chatbot
- SQLite is used for local dev out of the box; PostgreSQL is used in production

### Install & run

```bash
# 1. Clone
git clone https://github.com/taliaf-northpointe/helpdesk_analytics_site.git
cd helpdesk_analytics_site

# 2. Install dependencies
npm install

# 3. Create the env file (.env is git-ignored, so it is not in the clone)
cp .env.example .env      # then fill in the values (see Environment Variables below)

# 4. Set up the database
npm run db:generate
npm run db:push
npm run db:seed           # loads sample tickets so the UI has data

# 5. Start the dev server
npm run dev               # http://localhost:3000
```

> **Local database:** the Prisma schema is configured for **SQLite** in local dev. In your `.env`, use:
> ```
> DATABASE_PROVIDER="sqlite"
> DATABASE_URL="file:./dev.db"
> ```
> The PostgreSQL connection string shown in `.env.example` is for production — using it directly in local dev causes a Prisma provider mismatch.

> **Signing in requires Azure AD.** Every page is behind Azure AD (Entra ID) single sign-on — there is no guest or demo login. To open the app (even locally) you must configure a working Azure AD app registration in your `.env`; otherwise you will stay on the `/login` screen.

### Useful scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Apply the Prisma schema to the database |
| `npm run db:seed` | Seed sample ticket data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run sync` | Run an SDP sync from the CLI |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Database connection string (SQLite file or Postgres URL) |
| `DATABASE_PROVIDER` | `sqlite` (dev) or `postgresql` (prod) |
| `NEXTAUTH_URL` | App URL (`http://localhost:3000` in dev) |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `AZURE_AD_CLIENT_ID` / `_SECRET` / `_TENANT_ID` | Azure App Registration credentials |
| `SDP_BASE_URL` | SDP instance URL |
| `SDP_PORTAL_NAME` | SDP portal name |
| `SDP_ZOHO_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN` | Zoho OAuth2 credentials |
| `SDP_SYNC_INTERVAL_MINUTES` | Sync cadence |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `CLAUDE_MODEL` | Claude model for the chatbot |
| `ADMIN_EMAILS` | Comma-separated admin emails |
| `NEXT_PUBLIC_SDP_BASE_URL` / `NEXT_PUBLIC_SDP_PORTAL_NAME` | Optional overrides for the "Open in SDP" deep links |

> `.env` is git-ignored and must never be committed — it holds live secrets.

---

## Deployment

**Docker (full stack):**
```bash
cp .env.example .env      # fill in values
docker compose up --build
# with pgAdmin: docker compose --profile tools up
```

**Azure (recommended):**
1. Create an **Azure Database for PostgreSQL** (Flexible Server); set `DATABASE_URL`.
2. Register an **Azure AD app**; add redirect URI `https://<app>.azurewebsites.net/api/auth/callback/azure-ad`.
3. Deploy the Docker image to **Azure App Service** (Linux); set all env vars under Application Settings.

The font is self-hosted, so production builds do **not** require outbound access to Google Fonts (important behind SSL-inspecting corporate networks).

---

## Security Notes

- Authentication is enforced via Azure AD SSO; all dashboard routes require a valid session, and admin actions are gated by `ADMIN_EMAILS`.
- Secrets live only in `.env` (git-ignored) — rotate the Zoho refresh token and Anthropic key if they are ever exposed.
- SDP access uses a refresh-token flow, so no long-lived API key is stored.

---

*Internal tool built for Northpointe Bank IT.*
