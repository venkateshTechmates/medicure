# MedCure — Product Requirements Document

## 1. Overview
MedCure is a multi-tenant hospital information system / EHR. It covers the full clinical and operational footprint a mid-sized hospital needs: patient registry, chart, CPOE, pharmacy verification, eMAR, lab results, ED triage, bed management, surgery scheduling, billing, inventory, staff, secure messaging, and document repository.

The visual + interaction contract is defined by the static HTML mocks in [Mocks/](Mocks/) — every PRD item below maps to one or more mock pages.

## 2. Goals
- **Single application** that supports MD, RN, RPh, Tech, Registration, Billing, and Admin roles across multiple organizations.
- **Tenant isolation** — patients, orders, claims, and inventory are scoped to one organization at a time, with a switcher to move between orgs the user belongs to.
- **End-to-end clinical workflows** — order-to-administration loop (CPOE → pharmacy verify → eMAR), order-to-result loop (CPOE → specimen → lab → ack), admission → discharge wizard, ED triage → bed → disposition.
- **Low click-count** — average 2.4 clicks from any landing page to a clinical action (per Sitemap stat strip).

## 3. Non-goals (this iteration)
- HL7/FHIR external integrations (stub interfaces only)
- Real DICOM rendering (PACS viewer is a mock with sample images)
- True drug-interaction database (CDS uses a small seeded rule set)
- HIPAA-grade audit log certification (we record audit rows but do not WORM them)
- Mobile/native apps

## 4. Personas & roles
| Role | Primary screens |
|---|---|
| Attending MD | Dashboard, PatientChart, CPOE, NoteComposer, OrderDetail, ResultAck, ConsultRequest, Discharge |
| Resident MD | same as Attending, plus Signout (I-PASS) |
| RN (floor) | BedBoard, eMAR, VitalsEntry, CarePlan, AllergyManagement, Telemetry |
| RN (ED) | Triage, EDLive, CodeBlue, CodeSTEMI |
| Pharmacist (RPh) | Pharmacy, PharmacyVerify, Inventory |
| Tech (lab/rad) | Labs, LabDetail, SpecimenTracking, Imaging, Pathology, BloodBank |
| Registration / Admit | Admit, ScheduleAppointment, Eligibility, PatientProfile |
| Biller | Billing, ClaimDetail, DenialMgmt, ChargeCapture, PaymentPosting, PatientStatement |
| Admin | Staff, Settings, Documents, Messages, Sitemap |

Roles are checked at the API layer; UI shows only permitted nav tabs.

## 5. Functional scope (by domain)

### 5.1 Authentication & access
- **SignIn** — email + password, organization auto-detect (user gets a list if member of >1), SSO providers (Google, Microsoft, Okta — stub), "Switch org" panel.
- **Register** — 4-step wizard: profile → organization (create or join via invite code) → role (NPI + state license + DEA where applicable) → confirm.
- **ForgotPassword** — reset via email / SMS / authenticator / backup code, 30-minute expiring links.
- **TwoFactor** — 6-digit OTP, 30-second refresh, alternate channels.
- **TenantSelector** — grid of organizations the user belongs to, with per-org stats and pending invites.
- **Logout / Signout** — two distinct flows: `/Logout` (session end) and `/Signout` (clinical I-PASS hand-off).

### 5.2 Patient record
- **Patients** — searchable roster (1,800+ rows realistic), columns: name, MRN, age, ward, status pill, vitals snapshot (HR/BP/SpO2), attending, admitted date.
- **PatientChart** — 13-tab chart (Summary, Vitals, Meds, Labs, Notes, Problems, Allergies, Team, Orders, Imaging, Documents, Timeline, Care plan). Hash-based deep links (`#vitals`, `#labs`, …).
- **PatientProfile** — demographics, insurance, contacts, code status, history snapshot.

### 5.3 Orders & results (CPOE / pharmacy / eMAR / labs)
- **CPOE** — order entry with catalog search, cart, CDS alerts (renal-dose, duplication, interaction), order sets, e-signature.
- **OrderDetail** — single-order view with CDS, audit, cost & supply, vitals context.
- **PharmacyVerify** — 7-rights checklist, weight-based dose calc, interaction alerts.
- **Pharmacy** (queue) — verification queue, formulary lookup, dispensing log, controlled-substance witness.
- **eMAR** — 24-hour grid per patient × medication, scan-and-give, due/late status, PRN log.
- **Labs** (index) — recent results, critical-value triage, pending collection, metric trends.
- **LabDetail** — analytes table, range bars, chain of custody, follow-up recommendations.
- **ResultAck** — inbox of unread results, critical / abnormal / normal triage.
- **SpecimenTracking** — phlebotomy queue, chain of custody, TAT.

### 5.4 Inpatient & OR
- **BedBoard** — live floor plan (4 wards, 184 beds), occupancy KPIs, demand forecast, drag-to-reassign.
- **Imaging / PACS** — DICOM-style worklist + report.
- **SurgeryBoard** — 8-OR Gantt, in-progress / turnover / on-time KPIs.
- **ORCase** — single OR case detail.
- **ICUFlowsheet**, **Telemetry**, **Dialysis**, **Infusion** — specialty flowsheets.

### 5.5 Emergency department
- **ED** (mission control) — ESI triage board, bed map, incoming EMS.
- **EDLive** — real-time bay status, triage queue, alerts.
- **Triage** — intake form (CC, vitals, ESI algorithm).
- **CodeSTEMI**, **CodeBlue** — live code activations with door-to-balloon timer.

### 5.6 Multi-step workflows
- **Admit** — demographics → insurance → bed → consent.
- **Discharge** — disposition → med rec → instructions → follow-up → sign.
- **ScheduleAppointment** — visit type → provider → date → time → confirm.
- **NoteComposer** — SOAP / H&P with templates, dictation, smart phrases.
- **ConsultRequest**, **TransferRequest**, **Signout (I-PASS)**.

### 5.7 Clinical workflows
- **VitalsEntry**, **CarePlan**, **AllergyManagement**, **Immunizations**, **ClinicVisit**.

### 5.8 Billing
- **Billing** index — claims, A/R aging, denials, payer mix.
- **ClaimDetail**, **DenialMgmt**, **Eligibility**, **ChargeCapture**, **PaymentPosting**, **PatientStatement**.

### 5.9 Admin / ops
- **Inventory** — stock, par levels, expiring lots, POs, auto-replenish.
- **Staff / Doctors** — provider roster, schedule, credentials renewing, performance.
- **Messages** — secure threads with patient context, attachments, urgent flag.
- **Documents** — repository with full-text search, categories, signature tracking.
- **Settings** — profile, notifications, integrations, security/2FA.

## 6. Non-functional requirements
- All API responses < 300 ms p95 on a workstation (SQLite is fine for the demo data volume).
- Frontend ships with the design tokens from [Mocks/styles/medcure.css](Mocks/styles/medcure.css) — no rebrand.
- Multi-tab support: opening the same patient in two tabs must not corrupt state.
- Status pills are typed (`good | warn | bad | info`) — no free-form colors.

## 7. Technical architecture
```
backend/MedCure.Api          .NET 10 minimal-API + EF Core 9 + SQLite
  ├─ Domain/                 entities (Patient, Encounter, Order, …)
  ├─ Data/                   AppDbContext, Seeder
  ├─ Endpoints/              one file per module (Patients, Orders, …)
  ├─ Auth/                   JWT issuer + role policies
  └─ medcure.db              SQLite file (gitignored)

frontend/medcure-web         Next.js 15 (App Router) + TypeScript
  ├─ app/                    route segments (one folder per mock page)
  ├─ components/             Nav, StatusPill, TenantSwitcher, ProfileMenu, DataTable, etc.
  ├─ lib/api.ts              typed client for the .NET API
  ├─ lib/auth.ts             token storage + tenant context
  └─ styles/medcure.css      ported from the mocks
```

## 8. API surface (high-level)
- `POST /auth/login`, `POST /auth/register`, `POST /auth/2fa`, `GET /auth/me`, `POST /auth/switch-tenant/{id}`
- `GET /tenants`, `POST /tenants`
- `GET /patients?q=&ward=&status=`, `GET /patients/{mrn}`, `GET /patients/{mrn}/vitals`, `GET /patients/{mrn}/labs`, `GET /patients/{mrn}/meds`, `GET /patients/{mrn}/notes`, `GET /patients/{mrn}/problems`, `GET /patients/{mrn}/allergies`, `GET /patients/{mrn}/timeline`
- `GET /appointments?from=&to=`, `POST /appointments`, `PATCH /appointments/{id}`
- `GET /orders?status=`, `POST /orders`, `POST /orders/{id}/sign`, `POST /orders/{id}/verify`, `POST /orders/{id}/administer`
- `GET /labs?status=`, `GET /labs/{id}`, `POST /labs/{id}/ack`
- `GET /pharmacy/queue`, `POST /pharmacy/verify/{orderId}`, `GET /pharmacy/inventory`
- `GET /beds`, `PATCH /beds/{id}` (assign / release)
- `GET /ed/board`, `POST /ed/triage`
- `GET /billing/claims`, `GET /billing/claims/{id}`, `POST /billing/claims/{id}/appeal`
- `GET /inventory`, `POST /inventory/po`
- `GET /staff`, `GET /messages`, `POST /messages`, `GET /documents`, `POST /documents`
- `GET /dashboard` (aggregated KPIs)

All endpoints require `Authorization: Bearer <jwt>` except `/auth/login`, `/auth/register`, `/auth/forgot`. JWT carries `userId`, `tenantId`, `role[]`.

## 9. Data model (summary)
Entities (each has `Id`, `TenantId`, `CreatedAt`, `UpdatedAt`):
`User`, `Tenant`, `UserTenant`, `Patient`, `Encounter`, `BedAssignment`, `Bed`, `Ward`, `Appointment`, `Provider`, `Order`, `MedicationOrder`, `LabOrder`, `LabResult`, `ImagingOrder`, `MedicationAdministration`, `Vital`, `Allergy`, `Problem`, `Note`, `Document`, `Message`, `MessageThread`, `Claim`, `ClaimLine`, `Denial`, `InventoryItem`, `PurchaseOrder`, `Specimen`, `EDArrival`, `CodeActivation`, `CdsAlert`, `AuditEntry`.

Seed data: 2 tenants, ~12 providers, ~80 patients, 4 wards × 32 beds, ~300 orders across various statuses, ~150 lab results (with critical/abnormal flags), ~40 appointments today, realistic ED arrivals and inventory.

## 10. Definition of done
- All 60+ mocks have a corresponding Next.js page that pulls real data from the .NET API.
- Login → tenant select → dashboard → patient chart → CPOE → pharmacy verify → eMAR → lab result is fully wired end-to-end.
- `dotnet run` boots the API on `:5050`; `npm run dev` boots the web on `:3000`. No manual setup beyond cloning + `dotnet ef database update`.
