# ApexProp AI — Automated Testing & Verification Suite

This document outlines the testing architecture, automated regression suites, and verification procedures for ApexProp AI.

---

## 1. Automated Test Suites Overview

ApexProp AI contains two comprehensive, repeatable automated testing suites accessible via HTTP API endpoints:

1. **Section A–G Master E2E Production Hardening Suite**:
   - Endpoint: `GET /api/test/e2e-hardening-suite`
   - Covers: Authentication, Multimodal AI Guardrails, Evidence Traceability, 15-State FSM, Financial Separation, Security Headers, Rate Limiting, and Schema Integrity.
2. **Milestone 9 & 10 Work Order & Reporting Suite**:
   - Endpoint: `GET /api/test/work-order-and-reporting-suite`
   - Covers: 17-field work order auto-generation, 15-state lifecycle transitions, contractor dispatch & acknowledgment, progress tracking, pause/resume delays, actual cost accumulation, change orders & budget revisions, QC verification gates, final archival closure, 13 operational metrics, and PDF generation.

---

## 2. Test Matrix Summary

| Section | Domain | Test ID | Description | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Section A** | Auth & Identity | `TEST-A1` | Server-Side Secret Key Confinement | **PASSED** |
| **Section A** | Auth & Identity | `TEST-A2` | Role-Based Access Control Matrix Integrity | **PASSED** |
| **Section B** | AI & Input | `TEST-B1` | Image Payload & MIME Type Validation Safeguards | **PASSED** |
| **Section B** | AI & Input | `TEST-B2` | Visual Evidence vs Hypothesis vs Professional Check Separation | **PASSED** |
| **Section C** | Risk Intelligence | `TEST-C1` | Critical Spalling Safety Escalation & Structural Disclaimers | **PASSED** |
| **Section C** | Risk Intelligence | `TEST-C2` | Target-Coordinate Precision & Evidence Traceability | **PASSED** |
| **Section D** | Work Orders | `TEST-D1` | 15-State Finite State Machine Completeness | **PASSED** |
| **Section D** | Work Orders | `TEST-D2` | State Machine Boundary Enforcement & Close Verification Gate | **PASSED** |
| **Section E** | Financials | `TEST-E1` | Three-Way Financial Separation (`Estimated != Approved != Actual`) | **PASSED** |
| **Section E** | Reports | `TEST-E2` | 5 Certified PDF Dossiers & Universal CSV Export Center | **PASSED** |
| **Section F** | Security | `TEST-F1` | Strict HTTP Security Headers & Cross-Origin Isolation | **PASSED** |
| **Section F** | Security | `TEST-F2` | Sliding-Window DoS & AI Abuse Rate Limiter | **PASSED** |
| **Section G** | Database | `TEST-G1` | PostgreSQL Schema & Immutable Audit Log Architecture | **PASSED** |
| **Section G** | Database | `TEST-G2` | Zero-Crash Hybrid Persistence & Supabase Resilience | **PASSED** |
| **Lifecycle** | Work Order | `TEST-01` | 17-Field End-to-End Work Order Traceability | **PASSED** |
| **Lifecycle** | Lifecycle | `TEST-02` | 15-State Work Order Lifecycle Transitions | **PASSED** |
| **Lifecycle** | Contractor | `TEST-03` | Contractor Assignment & Acknowledgement Protocol | **PASSED** |
| **Lifecycle** | Execution | `TEST-04` | Execution Tracking, Progress % & Pause/Resume Protocol | **PASSED** |
| **Lifecycle** | Job Cost | `TEST-05` | Material & Labour Actual Expenditure Tracking | **PASSED** |
| **Lifecycle** | Governance | `TEST-06` | Change Request & Formal Budget Revision Audit | **PASSED** |
| **Lifecycle** | Quality Gate | `TEST-07` | Mandatory Verification Checklist & Authorized Sign-off | **PASSED** |
| **Lifecycle** | Archival | `TEST-08` | Mandatory Prior Verification Before Archival Closure | **PASSED** |
| **Lifecycle** | Financials | `TEST-09` | Estimated vs Approved Budget vs Actual Expenditure Separation | **PASSED** |
| **Lifecycle** | Analytics | `TEST-10` | 13 Defensible Operational Metrics from Live State | **PASSED** |
| **Lifecycle** | Health | `TEST-11` | Defensible Property Health Score & Non-Structural Certification | **PASSED** |
| **Lifecycle** | PDF/CSV | `TEST-12` | 5 Professional PDF Generators & Universal CSV Exporter | **PASSED** |

---

## 3. Running Automated Tests

### Via cURL
```bash
# Run Section A–G Master E2E Suite:
curl -s http://localhost:3000/api/test/e2e-hardening-suite | jq

# Run Work Order & Reporting Suite:
curl -s http://localhost:3000/api/test/work-order-and-reporting-suite | jq
```

### Via Browser UI
1. Navigate to **Reports** (`/reports`).
2. Switch to **Operational Intelligence** tab.
3. Observe live calculation of all 13 database metrics and status distributions.
4. Export test records via the **Universal CSV Center** or download sample **PDF Dossiers**.

---

## 4. Compilation & Lint Verification

Run the compiler and linter before every release:

```bash
# TypeScript compilation check
npm run build

# ESLint code quality & type check
npm run lint
```
