# Northpointe Help Desk Analytics Dashboard

A production-ready full-stack ticket analytics platform built for Northpointe Bank IT. Integrates live with ServiceDesk Plus Cloud (SDP On-Demand), provides real-time KPI dashboards, SLA monitoring, and an AI chatbot powered by Claude that queries your live ticket data.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | Next.js 15, React 18, TypeScript, Tailwind CSS |
| UI          | shadcn/ui, Radix UI, Recharts, Framer Motion   |
| Backend     | Next.js API Routes                              |
| Database    | PostgreSQL + Prisma ORM                        |
| Auth        | NextAuth v4 + Azure AD / Entra ID SSO          |
| Integration | ServiceDesk Plus Cloud (Zoho OAuth2)           |
| AI Chatbot  | Anthropic Claude (`@anthropic-ai/sdk`)          |
| Deployment  | Docker, Azure App Service / Vercel              |

---

## Quick Start (Development)

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker)
- Azure AD app registration
- Zoho OAuth2 credentials (from SDP API console)
- Anthropic API key

### 2. Clone & install

```bash
cd "C:\Users\talia.frazier\OneDrive - Northpointe Bank\Documents"
# rename/move the northpointe-helpdesk folder as needed
cd northpointe-helpdesk
npm install
```

### 3. Environment variables

```bash
cp .env.example .env
# Edit .env and fill in all values (see table below)
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 in dev) |
| `NEXTAUTH_SECRET` | Random secret: `openssl rand -base64 32` |
| `AZURE_AD_CLIENT_ID` | Azure App Registration client ID |
| `AZURE_AD_CLIENT_SECRET` | Azure App Registration client secret |
| `AZURE_AD_TENANT_ID` | Your Azure tenant ID |
| `SDP_BASE_URL` | `https://northpointe.sdpondemand.manageengine.com` |
| `SDP_PORTAL_NAME` | Your SDP portal name (e.g. `northpointe`) |
| `SDP_ZOHO_CLIENT_ID` | Zoho OAuth2 client ID |
| `SDP_ZOHO_CLIENT_SECRET` | Zoho OAuth2 client secret |
| `SDP_ZOHO_REFRESH_TOKEN` | Zoho OAuth2 refresh token |
| `ANTHROPIC_API_KEY` | Anthropic API key (`sk-ant-api03-...`) |
| `CLAUDE_MODEL` | Claude model (default: `claude-sonnet-4-6`) |

### 4. Database setup

```bash
# Option A: Docker (recommended for dev)
docker compose up db -d

# Option B: Use existing PostgreSQL instance
# (update DATABASE_URL in .env)

# Run migrations and seed
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Run the app

```bash
npm run dev
# Open http://localhost:3000
```

---

## Docker (Full Stack)

```bash
# Copy and fill in env file
cp .env.example .env

# Build and run everything
docker compose up --build

# With pgAdmin (database browser)
docker compose --profile tools up
# pgAdmin: http://localhost:5050 (admin@northpointe.com / admin)
```

---

## Azure Deployment

### Recommended Architecture

```
Azure App Service (Node 20)
  └── northpointe-helpdesk (Docker container)
        ├── Next.js app (port 3000)
        └── Connects to:
             ├── Azure Database for PostgreSQL (Flexible Server)
             ├── Azure AD (Entra ID) for SSO
             └── Anthropic API + SDP Cloud (external)
```

### Steps

1. **Azure Database for PostgreSQL** — Create a Flexible Server instance, set `DATABASE_URL` in App Service config.
2. **Azure App Registration** — Register app, add redirect URI: `https://<your-app>.azurewebsites.net/api/auth/callback/azure-ad`. Copy client ID/secret/tenant ID.
3. **Azure App Service** — Create Web App (Docker/Linux), configure all env vars under Configuration > Application Settings.
4. **Deploy**:
   ```bash
   # Via Azure Container Registry
   az acr build --registry <acr-name> --image helpdesk:latest .
   az webapp config container set --name <app-name> --resource-group <rg> \
     --docker-custom-image-name <acr-name>.azurecr.io/helpdesk:latest
   ```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Azure AD login page
│   ├── (dashboard)/           # All authenticated pages (guarded by layout)
│   │   ├── page.tsx            # Main dashboard
│   │   ├── tickets/            # Ticket browser
│   │   ├── analytics/          # Advanced analytics
│   │   ├── reports/            # Report builder
│   │   ├── sla-monitor/        # SLA tracking
│   │   └── settings/           # Admin settings + sync
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth handler
│       ├── analytics/dashboard/ # KPIs + dashboard data
│       ├── tickets/            # Ticket list + filter API
│       ├── chat/               # Claude chatbot API
│       └── sync/               # SDP sync trigger + status
├── components/
│   ├── layout/                 # Sidebar, Header, ThemeProvider
│   ├── dashboard/              # KPICard, charts, tables, footer
│   └── chatbot/                # ChatWidget (floating AI assistant)
├── lib/
│   ├── analytics/aggregations.ts  # Prisma-based KPI queries
│   ├── auth/config.ts              # NextAuth + Azure AD config
│   ├── claude/chat.ts              # Claude with live SDP tool use
│   ├── db/prisma.ts                # Prisma client singleton
│   ├── integrations/servicedesk-plus/
│   │   ├── client.ts          # Zoho OAuth2 + SDP API client
│   │   └── sync.ts            # Full/incremental sync engine
│   └── utils.ts                   # Date, number, formatting helpers
├── types/index.ts                  # All shared TypeScript types
prisma/
├── schema.prisma               # Full data model
└── seed.ts                     # 6 months of sample ticket data
```

---

## ServiceDesk Plus Integration Notes

Your SDP instance: `https://northpointe.sdpondemand.manageengine.com`

Authentication uses **Zoho OAuth2 refresh-token flow** (not API key).

Key API quirks handled in code:
- Time filter condition is `"lesser than"` (not `"less than"`)
- Time values must be nested: `{ value: "<epoch_ms>" }`
- Category/subcategory require explicit `fields_required` in `list_info`
- Ticket lookup by display_id requires a search, then detail fetch by internal id

The chatbot queries SDP directly via tool use — no caching delay. It supports:
`count_tickets`, `tickets_by_group`, `tickets_by_technician`, `tickets_by_status`,
`tickets_by_category`, `tickets_by_subcategory`, `ticket_trends`, `recent_tickets`, `lookup_ticket`

---

## AI Chatbot

The floating chatbot (bottom-right) uses Claude with Anthropic's tool-use API to query ServiceDesk Plus live. Example questions:

- "How many tickets are open this week?"
- "Which team has the most tickets this month?"
- "Show me ticket trends for the last 30 days."
- "Break down tickets by category this month."
- "Look up ticket #12345."

---

## Security Notes

> **Important**: Rotate the following credentials that were exposed in the n8n workflow JSON file:
> - Zoho OAuth2 refresh token: [api-console.zoho.com](https://api-console.zoho.com)
> - Anthropic API key: [console.anthropic.com](https://console.anthropic.com)
>
> Never commit `.env` to git. The `.gitignore` already excludes it.
