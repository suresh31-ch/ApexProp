# ApexProp AI — Security Architecture & Policy

ApexProp AI is designed with strict enterprise defense-in-depth principles to protect sensitive structural data, tenant identities, inspection photographs, and proprietary contractor financial records.

---

## 1. Threat Model & Security Posture

### Primary Assets Protected:
- Private structural inspection imagery (evidence of property distress or legal liability).
- Property owner and tenant personally identifiable information (PII).
- Contractor tender rates, hourly tariffs, and proprietary margin catalogs.
- Fiduciary records: estimated budgets vs. approved limits vs. actual disbursed invoices.
- Google Gemini and Supabase administrative secret credentials.

---

## 2. Server-Side Secret Key Confinement

### Rule 1: No Client-Side Secret Leakage
- `GEMINI_API_KEY` is strictly confined to server-side memory (`process.env.GEMINI_API_KEY`).
- `SUPABASE_SERVICE_ROLE_KEY` is strictly reserved for the Node.js backend.
- The browser Vite runtime bundle is verified to contain **zero** references to administrative secret tokens.
- Client SDKs interface solely with publishable anonymous credentials (`VITE_SUPABASE_ANON_KEY`) constrained by PostgreSQL Row-Level Security (RLS).

---

## 3. Storage Security & Private Object Isolation

### Private Inspection Bucket:
- The `inspection-images` bucket is provisioned with public read access disabled.
- Images are accessed via short-lived cryptographically signed URLs or authenticated proxy streams.
- Direct public enumeration of storage objects is explicitly blocked.

---

## 4. Row-Level Security (RLS) Policy Matrix

PostgreSQL Row-Level Security is active across all tables. The core policies include:

| Table | Policy Name | Permitted Operation | Target Condition |
| :--- | :--- | :--- | :--- |
| `properties` | Tenant Isolation | `SELECT`, `UPDATE` | `auth.uid() = created_by OR auth.role() = 'service_role'` |
| `inspections` | Inspection Ownership | `ALL` | `auth.uid() = inspector_id OR user_has_portfolio_access(property_id)` |
| `work_orders` | Lifecycle Access | `SELECT`, `UPDATE` | `assigned_contractor_id = auth.uid() OR is_property_manager()` |
| `repair_cost_estimates` | Budget Privacy | `SELECT`, `UPDATE` | Authorized financial role only |
| `work_order_change_requests`| Change Order Sign-off| `INSERT`, `UPDATE`| Operations Director or Chief Facilities Officer |

---

## 5. Denial-of-Service & Rate Limiting

The application runs a sliding-window in-memory rate limiter:
- **General API Endpoints**: `250 requests / 60 seconds` per IP address.
- **Multimodal AI Endpoints** (`/api/inspect`, `/api/inspect-multimodal`): `20 requests / 60 seconds` per IP address to prevent denial-of-wallet and AI compute exhaustion.
- HTTP `429 Too Many Requests` is returned with `Retry-After` headers when thresholds are exceeded.

---

## 6. HTTP Hardening & Security Headers

Configured in `server.ts`:
- `X-Content-Type-Options: nosniff` (Prevents MIME-sniffing exploits).
- `X-XSS-Protection: 1; mode=block` (Browser XSS filter enforcement).
- `Referrer-Policy: strict-origin-when-cross-origin` (Reduces referrer leakage).
- `X-Powered-By: false` (Suppresses server framework fingerprinting).
- `Content-Security-Policy`: Frame-ancestor rules tailored to allow Google AI Studio iframe embedding while protecting against malicious external clickjacking.

---

## 7. AI Credibility, Evidence Integrity & Boundary Discipline

### Category A, B, C Segregation:
1. **Category A (Visual Evidence)**: Visible pixel findings and coordinates detected in uploaded images.
2. **Category B (AI Hypotheses)**: Machine-learning root-cause probabilities.
3. **Category C (Physical Verification Checks)**: Non-negotiable physical checks required by qualified human structural engineers.

### Engineering Disclaimers:
- Visual inspection AI does not replace on-site physical engineering tests (core drilling, Schmidt rebound hammer, ultrasonic pulse velocity).
- Non-structural disclaimer mandated under **IS 456:2000** and **National Building Code (NBC) 2016**.

---

## 8. Reporting Security Vulnerabilities

To report a vulnerability or credential incident:
- Email: `security@apexprop.ai`
- Response SLA: Critical vulnerabilities triaged within 24 hours.
