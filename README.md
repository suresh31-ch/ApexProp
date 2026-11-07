# ApexProp AI — Autonomous Property Intelligence & Maintenance Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-Multimodal%20AI-orange.svg)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Storage-3ecf8e.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

> **INFINEX 2K26 Flagship Showcase Entry**  
> An autonomous, evidence-grounded property defect investigation, risk assessment, and maintenance lifecycle platform bridging multimodal visual AI and enterprise facility management.

---

## 🌟 Executive Summary

Traditional commercial property maintenance relies on subjective visual notes, fragmented contractor communications, spreadsheets, and delayed structural interventions.

**ApexProp AI** transforms property operations with:
1. **Multimodal Visual Evidence Analysis**: Precision defect detection (wall cracks, dampness, concrete spalling, rebar exposure) powered by Google Gemini with normalized coordinate bounding boxes.
2. **Category A/B/C Evidence Discipline**: Strict epistemic separation between visible evidence (Category A), machine-learning root-cause hypotheses (Category B), and mandatory on-site physical engineering tests (Category C).
3. **Engineering Standards Grounding**: Automated non-destructive disclaimers adhering to **IS 456:2000** (Plain and Reinforced Concrete Code) and **National Building Code (NBC) 2016**.
4. **Deterministic Repair Intelligence**: 3-way repair option comparison (patch, preventative, structural overhaul) with itemized material, labour, contingency, and tax calculations.
5. **15-State Work Order Finite State Machine (FSM)**: Complete lifecycle control from creation to contractor dispatch, execution tracking, pause reasons, change orders, quality verification gates, and archival closure.
6. **Executive PDF & Universal CSV Hub**: 5 certified print-ready PDF dossiers and raw data export for portfolio audits.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                       ApexProp AI Client (React SPA)                   │
│   Dashboard  •  Inspect  •  Investigations  •  Risk  •  Repair  •     │
│   Planner    •  Work Orders  •  Reports  •  Settings                    │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTPS (CORS & CSP Protected)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Hardened Node.js & Express API Gateway                  │
│   - Sliding-Window Rate Limiters (250 req/min general, 20 req/min AI)   │
│   - Security Headers (nosniff, X-XSS, frame-ancestors, sanitized stack) │
│   - 15-State Work Order FSM Engine & Contractor Directory Coordinator  │
│   - 13-Metric Operational Analytics Engine                             │
└──────────────────┬──────────────────────────────────┬──────────────────┘
                   │                                  │
                   ▼                                  ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│       Google Gemini AI Engine       │  │      Supabase PostgreSQL      │
│  - Multimodal defect localization   │  │  - Row-Level Security (RLS)   │
│  - Normalized coordinate bounding   │  │  - Idempotent 2026 schema     │
│  - Epistemic Category A/B/C mapping │  │  - Immutable audit logs       │
│  - Zero fabrication temperature     │  │  - Private storage buckets    │
└─────────────────────────────────────┘  └───────────────────────────────┘
```

---

## 🧭 The 9 Core Modules

1. **Dashboard (`/dashboard`)**:
   - Executive portfolio health overview, real-time KPI cards, defect urgency breakdown, and interactive recent activity feeds.
2. **Inspect Property (`/inspect`)**:
   - High-throughput image evidence uploader, live camera integration, pre-configured test scenarios (shear cracks, rising damp, concrete spalling), and coordinate bounding visualizer.
3. **Investigations (`/investigations`)**:
   - Deep-dive evidence dossier, multi-image correlation, root-cause hypotheses, alternative explanations, and evidence-to-hypothesis traceability pins.
4. **Risk Intelligence (`/risk`)**:
   - Transparent risk scoring matrix (Severity × Likelihood × Asset Criticality), structural safety escalation flags, and non-destructive visual disclaimers.
5. **Repair Intelligence (`/repair`)**:
   - Deterministic cost calculator, unit rate catalog matching, 3-way repair trade-off comparison (Quick Fix vs Comprehensive vs Modern Re-engineering), and versioned repair estimates.
6. **Maintenance Planner (`/planner`)**:
   - Strategic timeline forecasting, urgent vs preventive repair scheduling, and capital expenditure (CapEx) projections.
7. **Work Orders (`/workorders`)**:
   - 15-state lifecycle management, contractor directory modal with license and trade badges, dispatch tracking, execution progress %, delay pause/resume logging, change order budget revisions, and engineer verification sign-offs.
8. **Reports (`/reports`)**:
   - 4-tab export hub: 5 certified PDF dossiers (Inspection, Investigation, Estimate, Work Order, Portfolio Health), 13 operational metrics, and universal CSV exporter.
9. **Settings (`/settings`)**:
   - Inspector credentials, role configuration, Supabase connection status, rate catalog management, and security posture review.

---

## 🎤 INFINEX 2K26 Hackathon Presentation Guide & Live Demo Walkthrough

Follow this **13-step, 4-minute demonstration script** to showcase ApexProp AI to judges and evaluators:

### Step 1: Platform Introduction (30 seconds)
- Open the application at the **Dashboard**.
- Explain the problem: Commercial property managers lose millions every year to delayed structural interventions, untraceable defect reports, and unverified contractor invoices.
- Point to the KPI cards: Total Properties, Active Findings, High-Risk Escalations, and Total Portfolio Health score.

### Step 2: The Inspect Module & Real Gemini Vision (30 seconds)
- Navigate to **Inspect Property** from the sidebar.
- Click on **"Spalling Concrete with Exposed Rebar"** or upload an inspection image.
- Click **"Run Multimodal AI Inspection"**.
- Point out the rapid response and the **Category A Visual Finding Bounding Box** highlighting the rebar corrosion zone with exact coordinates.

### Step 3: Category A, B, C Epistemic Separation (30 seconds)
- Open the **Investigation Dossier**.
- Show judges the three explicit tabs:
  - **Category A**: Visual evidence detected directly from pixels.
  - **Category B**: AI-generated root-cause hypotheses (carbonation, chloride attack).
  - **Category C**: Mandatory physical engineering checks required by human professionals.
- Point out the mandatory **IS 456 / NBC 2016 non-destructive disclaimer** banner.

### Step 4: Risk Intelligence & Safety Escalation (20 seconds)
- Navigate to **Risk Intelligence**.
- Show how the spalling column defect automatically escalated to **CRITICAL** severity.
- Emphasize that ApexProp AI **never** claims structural certainty without on-site engineer verification.

### Step 5: Repair Intelligence & 3-Way Trade-off (30 seconds)
- Navigate to **Repair Intelligence** (Calculator icon in sidebar).
- Show the 3-option comparison:
  1. Temporary Patch Repair (Low cost, 6-month durability).
  2. Preventative Anti-Carbonation Coating (Medium cost, 5-year durability).
  3. Structural Re-alkalisation & Polymer Mortar (High durability, 15-year guarantee).
- Demonstrate the deterministic cost calculator with unit rates, contingency %, and GST/taxes.

### Step 6: 15-State Work Order Lifecycle & Contractor Dispatch (40 seconds)
- Navigate to **Work Orders**.
- Open the newly generated work order (`WO-2026-XXXXX`).
- Show the 17-field auto-populated context, defect photos, and safety notes.
- Click **"Assign Contractor"** and select a verified structural masonry firm from the **Contractor Directory**.
- Advance the state: `ASSIGNED` → `ACKNOWLEDGED` → `SCHEDULED` → `IN_PROGRESS`.

### Step 7: Execution Tracking, Pause Delays & Change Orders (30 seconds)
- Inside the Work Order modal, open the **Execution & Photos** tab and adjust progress to 45%.
- Demonstrate the **Pause Work** button: input delay reason *"Awaiting delivery of specialized non-shrink polymer mortar"*.
- Switch to **Change Orders** tab: show how the contractor submitted a budget revision (+₹12,500 for additional rebar passivation), and approve it.
- Show that **Approved Budget** is revised while **Estimated Cost** remains immutable!

### Step 8: Quality Verification Gate & Archival Closure (20 seconds)
- Advance status to `COMPLETED`.
- Try to close the work order directly: explain to judges that **the system strictly blocks closure until an authorized engineer passes all QC verification checkpoints**.
- Complete the 2-item verification checklist with inspector name *"Er. Arvind Mehta"* and sign off.
- The order achieves `VERIFIED` and can now be safely archived as `CLOSED`.

### Step 9: Reports & Certified PDF Dossiers (30 seconds)
- Navigate to **Reports**.
- Click **"Download Work Order PDF"** or **"Download Investigation PDF"**.
- Open the generated PDF: showcase the certified engineering layout, timestamped audit history, contractor details, and regulatory disclaimers.
- Click **"Export Work Orders CSV"** to demonstrate raw data export.

### Step 10: Live Automated Test Execution (20 seconds)
- Open browser console or terminal and execute:
  ```bash
  curl -s http://localhost:3000/api/test/e2e-hardening-suite | jq .success
  ```
- Show judges: **All 14 automated tests across Sections A–G PASSED (100% green)**.

---

## 🛠️ Tech Stack & Libraries

- **Frontend**: React 18, TypeScript 5.5, Vite 6, Tailwind CSS v4, Lucide React icons.
- **Backend**: Node.js 20, Express 4.x, TSX runtime.
- **AI**: Google `@google/genai` TypeScript SDK (`gemini-2.5-flash`).
- **Database & Auth**: Supabase PostgreSQL 15, PostgREST, Supabase Auth, Supabase Storage.
- **Reporting**: jsPDF, jsPDF-AutoTable, Universal RFC 4180 CSV serializer.

---

## 🔒 Security & Standards Compliance

- **IS 456:2000**: Indian Standard Code of Practice for Plain and Reinforced Concrete.
- **NBC 2016**: National Building Code of India (Part 6 Structural Design).
- **OWASP Top 10**: Server-side secret key confinement, sliding-window rate limiting, input sanitization, and strict HTTP security headers.

---

## 📄 License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
