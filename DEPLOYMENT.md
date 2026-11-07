# ApexProp AI — Enterprise Deployment Guide

Autonomous Property Intelligence & Maintenance Platform

ApexProp AI is a full-stack, enterprise-grade property maintenance and inspection intelligence platform engineered for real estate portfolios, facilities managers, and structural engineers.

---

## 1. System Requirements

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **NPM**: `v9.x` or higher
- **TypeScript**: `v5.5` or higher
- **Memory**: Minimum 1 GB RAM (2 GB recommended for multimodal processing)
- **Database**: Supabase PostgreSQL (or any standard PostgreSQL 15+ instance)
- **AI Infrastructure**: Google Gemini API key (`gemini-2.5-flash` or `gemini-1.5-pro`)

---

## 2. Environment Configuration

Copy `.env.example` to `.env` and supply the required configuration parameters:

```bash
cp .env.example .env
```

| Variable | Required | Scope | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Server | Google Gemini multimodal AI API key. Never exposed to browser. |
| `APP_URL` | **Yes** | Server & Client | Canonical deployment base URL (e.g. `http://localhost:3000`). |
| `PORT` | Optional | Server | Application listening port. Defaults to `3000`. |
| `NODE_ENV` | Optional | Server | `development` or `production`. Controls stack-trace sanitization. |
| `SUPABASE_URL` | Recommended | Server & Client | Project URL for Supabase PostgreSQL database and Storage. |
| `SUPABASE_ANON_KEY` | Recommended | Server & Client | Anonymous publishable key with Row-Level Security (RLS) enforcement. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server | Elevated service key for backend administrative routines. |

---

## 3. Database Schema Migration

ApexProp AI ships with an idempotent, fully versioned PostgreSQL schema located in `supabase/migrations/20261103000000_apexprop_schema.sql`.

### Applying Migrations via Supabase CLI

```bash
supabase db push
# or run against remote project directly:
supabase db execute --file ./supabase/migrations/20261103000000_apexprop_schema.sql
```

### Applying Migrations via Supabase SQL Editor
1. Log into your Supabase Dashboard at `https://supabase.com/dashboard`.
2. Navigate to **SQL Editor**.
3. Paste the contents of `supabase/migrations/20261103000000_apexprop_schema.sql` and run.
4. Verify created tables: `properties`, `inspection_images`, `inspections`, `observations`, `investigations`, `risk_assessments`, `repair_plans`, `repair_cost_estimates`, `work_orders`, `contractors`, `work_order_status_history`, and `work_order_change_requests`.

### Private Storage Bucket Setup
1. In Supabase Dashboard, open **Storage**.
2. Create a **Private Bucket** named `inspection-images`.
3. Ensure public access is turned **OFF**.
4. Apply the provided RLS storage policies from migration file to restrict read/write access to authenticated property managers.

---

## 4. Local Development

Install dependencies and launch the dev server:

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## 5. Production Build & Deployment

### Step 1: Compile Production Assets
```bash
npm run build
```
This runs Vite production compilation and generates optimized static assets in `/dist`.

### Step 2: Production Execution
Launch the hardened Node.js/Express application:
```bash
NODE_ENV=production npm start
# or:
NODE_ENV=production node server.ts
```

### Step 3: Containerization & Cloud Run / Docker

ApexProp AI is fully container-ready. Sample `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/supabase ./supabase

EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
```

---

## 6. Health & Diagnostic Endpoints

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Service liveness, Gemini & Supabase connectivity status |
| `/api/test/e2e-hardening-suite` | `GET` | Automated verification of Sections A–G |
| `/api/test/work-order-and-reporting-suite` | `GET` | 15-state FSM, contractor lifecycle, and report audit |
| `/api/analytics/operational` | `GET` | Real-time calculation of 13 operational metrics |
| `/api/analytics/property-health` | `GET` | IS 456 / NBC 2016-grounded property health scores |
