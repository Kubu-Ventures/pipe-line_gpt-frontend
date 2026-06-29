# PipelineGPT Frontend

The Next.js frontend for PipelineGPT -- a natural language interface for pipeline integrity data. Operators chat with their document corpus, engineers review AI-generated responses before delivery, and admins manage users and invitations, all from a single role-aware application.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth | NextAuth v5 (JWT session, role-aware middleware) |
| i18n | next-intl (10 locales, locale-prefixed routing) |
| Data fetching | TanStack Query v5 |
| UI components | Radix UI primitives + Tailwind CSS |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Streaming | Native `EventSource` / SSE for chat responses |

## Prerequisites

- Node.js 20+
- The [PipelineGPT backend](https://github.com/Kubu-Ventures/pipe-line_gpt-backend) running (locally or hosted)

## Quick start

```bash
# 1. Clone and enter the frontend directory
git clone https://github.com/Kubu-Ventures/pipe-line_gpt-frontend.git
cd pipe-line_gpt-frontend/frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local (see Environment variables below)

# 4. Start the dev server
npm run dev
```

The app is available at `http://localhost:3000`. The default locale is `en`; all protected routes redirect to `/en/login` when unauthenticated.

## Environment variables

Create `.env.local` in the `frontend/` directory:

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-here          # Required: long random string
NEXTAUTH_URL=http://localhost:3000        # Required: full URL of this app

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000 # Required: PipelineGPT backend base URL
```

For production, set `NEXTAUTH_URL` to your deployed frontend URL and `NEXT_PUBLIC_API_URL` to your deployed backend URL.

## Pages and features

### Public

| Path | Description |
|---|---|
| `/` | Landing page |
| `/[locale]/login` | Email + password login. Engineers and admins are prompted to set up TOTP MFA on first login. |
| `/[locale]/accept-invite/[token]` | Registration page for users who received an invitation |

### Operator (authenticated)

| Path | Description |
|---|---|
| `/[locale]/home` | Dashboard home |
| `/[locale]/chat` | Streaming chat interface. Questions are sent to the RAG backend and responses arrive token by token via SSE. Each response includes a citation panel showing the source documents and exact excerpts that grounded the answer. When the backend routes a response to HITL review, a banner is shown to the operator indicating the answer is pending engineer approval. |
| `/[locale]/dashboard` | Query history with status indicators (delivered, under review, rejected) |
| `/[locale]/ingest` | Document upload and knowledge base management. Supports PDF, CSV (ILI / SCADA), and PHMSA data files. Shows ingestion status per document and allows engineers to delete documents from the knowledge base. |

### Engineer (ENGINEER role required)

| Path | Description |
|---|---|
| `/[locale]/review` | HITL review queue. Engineers see AI-generated responses flagged for review, the original question, the cited source passages, and confidence score. They can approve the answer as-is, edit it before delivery, or reject it. |

### Admin (ADMIN role required)

| Path | Description |
|---|---|
| `/[locale]/admin` | User management: list users, invite new users by email and role, suspend or reactivate accounts |
| `/[locale]/audit` | Paginated audit event log: all queries, ingestions, HITL decisions, and deletions with actor identity and timestamp |

## Internationalisation

The app supports 10 languages via locale-prefixed routing (`/en/chat`, `/fr/chat`, etc.):

| Code | Language |
|---|---|
| `en` | English |
| `fr` | Français |
| `es` | Español |
| `ar` | العربية (RTL) |
| `zh` | 中文 |
| `ru` | Русский |
| `pt` | Português |
| `de` | Deutsch |
| `ja` | 日本語 |
| `hi` | हिन्दी |

Translation messages live in `i18n/messages/`. Locale detection and routing are handled by `next-intl` with the configuration in `i18n/routing.ts`. The language switcher in the top navigation persists the selected locale across navigation.

## Authentication and route protection

`middleware.ts` sits in front of every non-static route. It:

- Redirects unauthenticated users to `/[locale]/login`
- Redirects operators who attempt to access `/review` to `/[locale]/home`
- Redirects non-admins who attempt to access `/admin` to `/[locale]/home`
- Passes all other authenticated requests through to the next-intl i18n middleware

Session tokens are issued by the backend (`POST /auth/login`) and stored in a NextAuth JWT session. The `role` claim on the JWT drives the middleware guards above.

## Building for production

```bash
npm run build
npm start
```

The build will type-check the project and fail on TypeScript errors. Ensure all environment variables are set before running `npm run build` in CI.

## Project structure

```
frontend/
├── app/
│   ├── [locale]/              # All locale-prefixed routes
│   │   ├── chat/              # Streaming chat + citation panel
│   │   ├── dashboard/         # Query history
│   │   ├── ingest/            # Document upload and knowledge base
│   │   ├── review/            # HITL review queue (ENGINEER+)
│   │   ├── admin/             # User management (ADMIN)
│   │   ├── audit/             # Audit log (ENGINEER+)
│   │   ├── login/
│   │   ├── mfa-setup/
│   │   └── accept-invite/[token]/
│   ├── chat/
│   │   └── components/
│   │       ├── CitationPanel.tsx   # Source excerpt drawer
│   │       ├── HITLBanner.tsx      # "Pending engineer review" notice
│   │       └── MessageBubble.tsx   # Streamed markdown message renderer
│   ├── review/
│   │   └── components/
│   │       ├── ReviewCard.tsx      # Single HITL item with decision controls
│   │       ├── DecisionModal.tsx   # Approve / edit / reject modal
│   │       └── SourcePanel.tsx     # Source passage viewer
│   └── api/                   # NextAuth route handler
├── components/
│   ├── TopNav.tsx
│   ├── Footer.tsx
│   ├── LangSwitcher.tsx
│   └── ui/                    # Radix-based shared components
├── hooks/                     # TanStack Query hooks for API calls
├── i18n/
│   ├── routing.ts             # Locale list and routing config
│   ├── request.ts             # next-intl server-side config
│   └── messages/              # Per-locale JSON translation files
├── lib/
│   └── auth.ts                # NextAuth configuration
├── middleware.ts               # Auth + role guards + i18n middleware
├── next.config.mjs
├── tailwind.config.js
└── package.json
```
