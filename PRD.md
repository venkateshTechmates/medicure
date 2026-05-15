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
- Every flow in §11 is reachable from the role's nav, gated by API role policy, and verifiable in the demo seed data.

---

## 11. End-to-End Flows

This section is the authoritative map of how data flows through MedCure. Each flow names the **actor role**, the **trigger**, the **screens** visited, the **API calls** fired, the **persistence side-effects**, and the **success criteria**. Status legend: ✅ wired · ⚠️ partial · ❌ missing.

Conventions: `→` = navigation; `⇒` = API call; `[entity]` = DB write.

### 11.A Authentication & session

#### A.1 Sign-in → Tenant select → Dashboard ✅
**Actor**: any role · **Trigger**: visits `/sign-in`
1. `/sign-in` — email + password
   - ⇒ `POST /auth/login` → returns `{ token, user, tenants[], activeTenant }`
   - Stored in `localStorage` via `lib/auth.ts`
2. If `tenants.length > 1` → `/tenant-selector`
   - ⇒ `POST /auth/switch-tenant/{id}` → reissues JWT with new `tid` + `role`
3. If 2FA enrolled → `/two-factor` (6-digit OTP, 30 s refresh)
4. → `/` (Dashboard) — `<AuthGate>` confirms token, loads role-filtered nav
**Success**: JWT in storage, `activeTenant.role` populated, nav shows only PRD §4 tabs.

#### A.2 Register (new user, new or existing org) ✅
**Actor**: prospective user · 4-step wizard at `/register`
1. Profile (name, email, password) → `POST /auth/register`
2. Organization — create new or join via invite code
3. Role + credentials — NPI + state license (MD), DEA (prescribers), expiry dates
4. Confirm → activates account, sends verification email
[user] + [user_tenant] rows created.

#### A.3 Forgot password ✅
4 channels at `/forgot-password`: email · SMS · authenticator · backup code. Reset links expire in 30 min.

#### A.4 Logout vs Signout (clinical hand-off) ✅
- `/logout` — clears JWT, redirects to sign-in.
- `/signout` — **I-PASS hand-off** (Illness severity · Patient summary · Action list · Situational awareness · Synthesis). Outgoing clinician writes hand-off note ⇒ `POST /notes` (type=`signout`) → incoming clinician acknowledges.

---

### 11.B Patient flow (registration → discharge)

#### B.1 Schedule appointment (outpatient) ✅
**Actor**: Registration · **Trigger**: phone or portal request
1. `/schedule` — visit type → provider → date → time slot
2. ⇒ `POST /appointments` → [appointment] status=`scheduled`
3. Eligibility pre-check (24 h before): ⇒ `GET /eligibility/{patientId}` ⚠️ *currently client-side mock*
**Success**: appointment appears on `/appointments` calendar and provider schedule.

#### B.2 Admit (inpatient) ✅
**Actor**: Registration → MD co-sign · **Trigger**: ED disposition or scheduled admit
1. `/admit` 4-step wizard: demographics → insurance → bed selection → consent
2. ⇒ `POST /patients` (auto-generate MRN) → [patient]
3. ⇒ `PATCH /bed-board/beds/{id}` (assign) → [bed_assignment]
4. ⇒ `POST /encounters` (type=`inpatient`) → [encounter]
**Success**: patient visible on `/patients`, ward roster, and bed board.

#### B.3 Patient chart navigation ✅ (8 of 13 tabs) · ⚠️ (5 tabs)
**Actor**: any clinical role · **Entry**: `/patients/{mrn}` with hash routing
| Tab | Endpoint | Status |
|---|---|---|
| `#summary` | `GET /patients/{mrn}` | ✅ |
| `#vitals` | `GET /patients/{mrn}/vitals` | ✅ |
| `#meds` | `GET /patients/{mrn}/meds` | ✅ |
| `#labs` | `GET /patients/{mrn}/labs` | ✅ |
| `#notes` | `GET /patients/{mrn}/notes` | ✅ |
| `#problems` | `GET /patients/{mrn}/problems` | ✅ |
| `#allergies` | `GET /patients/{mrn}/allergies` | ✅ |
| `#timeline` | `GET /patients/{mrn}/timeline` | ✅ |
| `#imaging` | `GET /patients/{mrn}/imaging` | ❌ "Coming soon" |
| `#documents` | `GET /patients/{mrn}/documents` | ❌ "Coming soon" |
| `#billing` | `GET /patients/{mrn}/billing` | ❌ "Coming soon" |
| `#team` | `GET /patients/{mrn}/team` | ❌ "Coming soon" |
| `#care-plan` | reuses `/problems` | ⚠️ read-only |

#### B.4 Patient profile edit ⚠️
**Actor**: Registration · Read-only today. **Needs**: `PATCH /patients/{mrn}/profile` for demographics, insurance, contacts, code-status updates.

#### B.5 Clinical capture sub-flows
- **Vitals entry** ✅ — `/vitals-entry` → `POST /vitals` → NEWS2 score computed → high-risk alert fires.
- **Allergy add** ⚠️ — backend `POST /allergies` exists; **frontend "+ Add allergy" button is a no-op** (needs form).
- **Immunization** ✅ — `/immunizations` → `POST /immunizations` (or `/refuse`).
- **Problem list** ✅ — `POST /problems` (active/resolved status).
- **Care plan** ⚠️ — display only; goal/intervention save not wired.
- **Note (SOAP / H&P / progress)** ✅ — `/note-composer` → `POST /notes` → `POST /notes/{id}/sign`.
- **Consult request** ✅ — `/consult-request` → `POST /consults` → consultant responds via `POST /consults/{id}/respond`.
- **Transfer request** ✅ — `/transfer-request` → `POST /transfers` → accept/complete/reject lifecycle.
- **Clinic visit (outpatient)** ✅ — composite: note + `PATCH /appointments/{id}/status=completed`.

#### B.6 Discharge ✅
**Actor**: MD · **Trigger**: clinical readiness
1. `/discharge` 5-step wizard: disposition → med reconciliation → instructions → follow-up → e-sign
2. ⇒ `POST /patients/{mrn}/discharge` → [note type=`discharge-summary`], patient status=`discharged`, bed freed
**Success**: patient removed from active roster; discharge summary appears in `#timeline`.

---

### 11.C Order-to-administration loop (CPOE → Pharmacy → eMAR) ✅

The signature clinical loop. Roles change at each step — this is where role gates matter most.

```
[MD] CPOE.sign → [RPh] Pharmacy.verify → [RN] eMAR.administer
```

1. **MD** opens `/cpoe` from patient chart
   - Catalog search → cart → CDS check (renal-dose, duplication, interaction) ⚠️ *alerts are hardcoded; needs `POST /cds/check`*
   - Order set picker, free-text indication
   - E-signature (password re-prompt)
   - ⇒ `POST /orders` (status=`draft`) then `POST /orders/{id}/sign` (status=`signed`)
   - [order] + [audit_entry signedBy=MD]
2. **RPh** opens `/pharmacy` queue (filtered to status=`signed`)
   - Drills into `/pharmacy/verify/{orderId}` → 7-rights checklist ⚠️ *UI-only*, dose calc, interaction detail
   - ⇒ `POST /orders/{id}/verify` (status=`verified`)
3. **RN** opens `/emar` (24 h × medication grid)
   - Scans patient wristband + medication barcode
   - ⇒ `POST /orders/{id}/administer` → [medication_administration]
   - PRN entries logged separately with reason
**Success**: order moves `signed → verified → administered`; eMAR cell turns green; audit chain complete.

**Role gates required** ❌ — currently all three actions are open to any authenticated user.

---

### 11.D Order-to-result loop (CPOE → Specimen → Lab → Result Ack) ⚠️

```
[MD] CPOE(lab) → [Phlebotomist] collect → [Tech] resulted → [MD] acknowledge
```

1. **MD** in `/cpoe` selects Lab tab → adds analytes → signs ⇒ `POST /orders` (type=`Lab`) ⚠️ *type discriminator not wired*
2. **Phlebotomist** in `/specimen-tracking` sees pending collection ⇒ `POST /specimens` (chain of custody start) ❌ *no order↔specimen link endpoint*
3. **Tech** in `/labs/{id}` enters analyte values → ⇒ `POST /labs/{id}/result` ⚠️ *no real entry endpoint*; critical-value flag auto-set if outside reference range
4. **MD** sees critical/abnormal in `/result-ack` inbox → ⇒ `POST /labs/{id}/ack` ✅
**Success**: lab result appears in `/patients/{mrn}#labs` with trend bar and ack timestamp.

---

### 11.E ED triage → bed → disposition ✅ (partial)

```
[Reg/RN] arrival → [RN-ED] triage(ESI) → [MD] eval → disposition
```

1. EMS or walk-in arrival logged in `/ed/live`
2. **RN (ED)** opens `/triage` — chief complaint, vitals, ESI 1–5 algorithm
   - ⇒ `POST /ed/triage` → [ed_arrival] with ESI level
3. Bed assignment via `/bed-board` drag (ED-→inpatient or ED bay)
4. **MD** charts, orders, disposition: admit (B.2) · transfer · discharge
5. Door-to-disposition timer tracked on `/ed` board.

#### E.1 Code activations ✅
- **CodeBlue / CodeSTEMI** at `/code-blue` or `/code-stemi`
- ⇒ `POST /codes/activate` → [code_event] with timer started
- Each step (epi given, CPR, ROSC, balloon time) → `POST /codes/{id}/step`
- Resolve → `POST /codes/{id}/resolve` with outcome
- Door-to-balloon < 90 min target tracked on STEMI board.

---

### 11.F Inpatient & specialty flowsheets

| Flow | Screen | Status |
|---|---|---|
| Bed reassignment | `/bed-board` drag → `PATCH /bed-board/beds/{id}` | ✅ |
| Surgery scheduling | `/surgery-board` (8-OR Gantt) | ❌ no backend |
| OR case detail | `/or-case` (intra-op timeline, counts) | ❌ no backend |
| Imaging / PACS | `/imaging` (worklist + read) | ⚠️ reuses generic orders |
| Radiology read sign | `/radiology` | ⚠️ |
| Pathology | `/pathology` | ❌ no backend |
| Blood bank issue | `/blood-bank` (type & screen, issue, transfusion) | ⚠️ inventory filter only |
| Telemetry | `/telemetry` (continuous monitoring) | ⚠️ read-only snapshot |
| ICU flowsheet | `/icu-flowsheet` (q1h vitals, drips, vent) | ❌ no entry endpoint |
| Dialysis | `/dialysis` (modality, run sheet) | ❌ no entry endpoint |
| Infusion | `/infusion` (rate, titration, alarms) | ❌ no entry endpoint |

---

### 11.G Pharmacy & inventory

- **Pharmacy queue** ✅ — `GET /pharmacy/queue` (signed orders); controlled-substance witness flow ⚠️ *UI only*.
- **Formulary lookup** ⚠️ — frontend only.
- **Inventory list / expiring lots** ✅ — `GET /inventory`, `GET /inventory/expiring`.
- **Purchase order loop** ❌ — `POST /inventory/po`, `POST /inventory/po/{id}/receive`, auto-replenish trigger all missing.

---

### 11.H Billing chain

```
Eligibility → ChargeCapture → Claim → (Denial → Appeal) → PaymentPosting → PatientStatement
```

1. **Eligibility** ⚠️ — `/eligibility` is a client-side mock; no real X12 270/271.
2. **Charge capture** ⚠️ — UI exists; no dedicated `POST /charges` endpoint.
3. **Claim submit** ✅ — `POST /billing/claims`, `POST /billing/claims/{id}/submit`.
4. **Denial management** ✅ — `POST /billing/claims/{id}/deny`, `/appeal`.
5. **Payment posting** ⚠️ — `POST /billing/claims/{id}/pay` exists but no remittance import.
6. **Patient statement** ⚠️ — UI exists; no statement generation endpoint.
7. **A/R aging** ✅ — `GET /billing/aging` (30/60/90/120 buckets).

---

### 11.I Admin / cross-cutting

- **Messages** ✅ — `/messages` secure threads with patient context, attachments, urgent flag · `GET /messages`, `POST /messages`, `POST /messages/{id}/read`.
- **Documents** ❌ frontend missing — backend `POST /documents/upload`, `GET /documents` (full-text), `POST /documents/{id}/sign` ready; no `DocumentsClient.tsx`.
- **Staff roster** ⚠️ — read-only list; no credentials renewal, schedule, performance write endpoints.
- **Settings** ✅ — profile, notifications, integrations, 2FA toggle.
- **Audit log** ✅ — every state change writes [audit_entry]; viewable on `/sitemap` debug links.
- **Notifications** ✅ — `GET /notifications` polled every 30 s; high-risk vitals, critical labs, ED arrivals, code activations fan out.

---

## 12. Role-to-flow matrix

A flow's actor column defines the **required role**. The API must enforce these via policy; the frontend nav must hide tabs the user cannot use. Today, **none of these gates are enforced** — that is the top-priority security work.

| Role | Owns these flows (writes) | Reads-only access |
|---|---|---|
| **Attending MD** | B.2, B.3, B.5 (notes/consult/transfer), B.6, C (sign), D (sign + ack), E (eval/disposition) | all clinical |
| **Resident MD** | same as MD + A.4 Signout (I-PASS) | all clinical |
| **RN (floor)** | B.5 (vitals/allergies/care plan), C (administer), F (ICU/dialysis/infusion entry) | own patients' chart |
| **RN (ED)** | E (triage, code activate/step) | ED census |
| **Pharmacist (RPh)** | C (verify), G (formulary, inventory PO approve) | all meds |
| **Tech** | D (specimen, lab result), F (imaging/path) | own queue |
| **Registration** | B.1 (schedule), B.2 (admit), B.4 (profile edit), H.1 (eligibility) | demographics |
| **Biller** | H.2–H.7 (claims, denials, payment, statements) | financial only |
| **Admin** | I (staff, settings, documents, audit) | everything (read) |

**Enforcement targets**:
- Backend: `Auth/AuthPolicies.cs` declares `RequireMd`, `RequireRPh`, `RequireRN`, `RequireRnEd`, `RequireTech`, `RequireRegistration`, `RequireBiller`, `RequireAdmin`. Sensitive endpoints (`Sign`, `Verify`, `Administer`, `Discharge`, billing posts) call `.RequireAuthorization("…")` or check `current.Roles` inline and return `Results.Forbid()`.
- Frontend: `lib/auth.ts` exposes `getActiveRole()`; `NavTabs.tsx` filters the 14 tabs against the matrix above; action buttons (Sign / Verify / Administer / Post Payment) conditionally render.
- Seed: `DbInitializer` provides one user per role (`md@`, `resident@`, `rn@`, `rned@`, `rph@`, `tech@`, `reg@`, `bill@`, `admin@` all with password `demo123!`) so each flow is testable.

---

## 13. End-to-end smoke test (the demo script)

Run after every release. All steps must complete without 403/500.

1. Sign in as `reg@medcure.health` → admit a new patient (B.2) → assign bed.
2. Sign in as `rn@medcure.health` → enter vitals (B.5) → add allergy.
3. Sign in as `md@medcure.health` → open chart → write SOAP note → place medication order in CPOE (C.1) → sign → place lab order (D.1) → sign.
4. Sign in as `rph@medcure.health` → open Pharmacy queue → verify the medication order (C.2). Non-RPh should get 403 on this endpoint.
5. Sign in as `rn@medcure.health` → open eMAR → administer the dose (C.3).
6. Sign in as `tech@medcure.health` → collect specimen → enter lab result (D.2–D.3).
7. Sign in as `md@medcure.health` → acknowledge critical lab in Result Ack (D.4) → discharge patient (B.6).
8. Sign in as `bill@medcure.health` → create claim → submit → simulate denial → appeal (H.3–H.4).
9. Sign in as `admin@medcure.health` → audit log shows full chain across all actors.

---

## 11.J Medication reconciliation ❌
Joint Commission NPSG.03.06.01. Own loop with audit trail at every transition of care.
```
[Reg/RN] home med capture → [MD] reconcile @ admission → @ transfer → @ discharge
```
1. `/med-rec/admission` — capture home meds; for each line: continue · hold · modify · stop. ⇒ `POST /med-rec/{encounterId}`
2. `/med-rec/transfer` — required on unit transfer (ICU↔floor)
3. `/med-rec/discharge` — composes discharge med list; feeds B.6 instructions + eRx queue (§11.K)

**Persistence**: `[med_reconciliation]` + `[med_reconciliation_line]` linked to `[encounter]`. **Success**: every encounter has a reconciliation record at each transition; unreconciled lines block discharge sign.

## 11.K e-Prescribing (eRx) ❌
1. `/rx-compose` — drug · sig · qty · refills · DAW · pharmacy · indication
2. PDMP check for controlled substances ⇒ `GET /pdmp/{patientId}`
3. EPCS two-factor for Schedule II–V
4. ⇒ `POST /rx` → `POST /rx/{id}/route` via Surescripts NCPDP SCRIPT
5. Refill request inbound ⇒ `POST /rx/refill-request` → MD inbasket (§11.P)

## 11.L Clinical decision support (CDS) rule engine ❌
**Endpoint**: `POST /cds/check` — `{ patientId, orderDraft | medAdminAttempt | labResult, triggerPoint }`.

**Rule families**: drug–drug · drug–allergy · drug–disease · dose range (renal/hepatic/age/weight) · duplicate therapy · Beers list · pregnancy/lactation · indication required · formulary alt.

**Override flow**: coded reason → `[cds_override]` with severity, rule ID, user, timestamp.

**Admin**: `/admin/cds-rules` (enable/disable, severity info/warn/hard-stop) + `/admin/cds-fatigue` (fire vs. override rate per rule).

## 11.M Code status, DNR & advance directives ❌
1. `/patients/{mrn}/code-status` — Full · DNR · DNI · DNAR · Comfort care
2. ⇒ `POST /code-status` with effective date, MD signature, witness, scanned doc
3. Banner on chart, CPOE, eMAR; conflicting orders trigger CDS hard-stop
4. Advance directive PDF + healthcare agent scope captured as structured fields

**Persistence**: `[code_status]` effective-dated (never overwrite).

## 11.N Sepsis & deterioration surveillance ❌
1. Background job (§D.2) evaluates SIRS / qSOFA / NEWS2 q15min → `POST /alerts/sepsis` on threshold
2. RN ack within 15 min via `/alerts/inbox` → 1-h & 3-h bundles start:
   - 1-h: lactate, blood cx ×2, broad-spectrum abx, 30 mL/kg if hypotensive
   - 3-h: re-measure lactate, reassess
3. `/quality/sepsis` SEP-1 compliance dashboard

## 11.O Nursing assessments ❌
| Assessment | Cadence | Endpoint |
|---|---|---|
| Admission | Once/encounter | `POST /assessments/admission` |
| Shift | q-shift | `POST /assessments/shift` |
| Pain (numeric/FLACC/Wong-Baker) | q4h + PRN + post-med | `POST /assessments/pain` |
| Fall risk (Morse/Hendrich II) | Admit, shift, change | `POST /assessments/fall-risk` |
| Pressure injury (Braden) | Admit, daily | `POST /assessments/braden` |
| VTE risk (Padua/Caprini) | Admit | `POST /assessments/vte-risk` → suggests prophylaxis |
| Restraints | q2h while in use | `POST /assessments/restraint` |
| Suicide risk (Columbia/PHQ-9) | ED + BH | `POST /assessments/suicide-risk` |

Each table holds `encounterId`, `performedBy`, structured scores. Thresholds feed CPOE order suggestions.

## 11.P Inbasket / task management ❌
`/inbasket` folders: Results · Messages · Cosign · Refill requests · Staff messages · Patient calls · Documents to sign · Charges to drop. Bulk actions; delegation; pool inboxes.
⇒ `GET /inbasket?folder=…`, `POST /inbasket/{itemId}/action`, `POST /inbasket/delegate`. `/result-ack` + `/messages` fold in as folders.

## 11.Q Co-sign & supervision (trainees) ❌
1. Resident signs ⇒ `POST /notes/{id}/sign` with `requiresCosign=true`
2. Attending inbasket "Cosign" folder
3. ⇒ `POST /notes/{id}/cosign` with optional addendum

Same pattern: medical student notes (attending may need their own), verbal orders (MD co-sign 24 h), standing/protocol orders.

## 11.R HL7 / FHIR interoperability ❌
- **HL7 v2 inbound** `POST /interfaces/hl7/inbound` (MLLP in prod): ADT A01/A03/A04/A08, ORM, ORU, MDM with ACKs
- **FHIR R4 read**: Patient, Encounter, Observation, MedicationRequest, Condition, DocumentReference, Coverage — SMART-on-FHIR + Cures Act
- **C-CDA** discharge: `GET /patients/{mrn}/ccda`
- **HIE query** stub: `GET /hie/{patientId}`

## 11.S Patient portal ❌
Patient-facing read: result release (delay window), secure messaging, schedule, bill pay, refill, intake, document download. Proxy access with scope + expiry. Cures Act blocking exceptions captured.

## 11.T Telehealth visit ❌
`/telehealth/{appointmentId}` — WebRTC; pre-visit eligibility + consent; screen share for imaging; note auto-templates with telehealth modifier (95/GT); audio-only fallback tracked separately.

## 11.U Break-the-glass / Emergency access ❌
Off-care-team chart access → modal "Reason for access" → `POST /audit/break-glass` with reason code. Weekly review to Privacy Officer. Restricted records (VIP, BH, 42 CFR Part 2) require supervisor approval.

## 11.V Incident & safety event reporting ❌
`/safety/report` — fall · med error · near-miss · equipment · behavior · patient ID. Anonymous reporter; escalation tree; Joint Commission sentinel flag; RCA workflow.
⇒ `POST /safety/events`, `POST /safety/events/{id}/rca`, `POST /safety/events/{id}/action`.

## 11.W Case management / Discharge planning ❌
`/case-management/{encounterId}` — barriers · post-acute placement (SNF/LTAC/HHA) · DME · payer auth · transportation. Daily MDR board with target DC date + LOS variance.
⇒ `POST /case-mgmt/barriers`, `PATCH /case-mgmt/{id}/target-dc-date`, `POST /case-mgmt/{id}/placement`.

## 11.X Cross-encounter clinical list management ⚠️
- Problem list reconciliation per visit (active/resolved/chronic/error)
- Allergy verification stamp ("reviewed today by …"); required before inpatient sign
- Med list review outside transitions

---

## Improvements to existing flows

**11.A Auth**: 10-min idle warn / 15-min hard logout; shared-workstation quick-switch PIN; SSO (SAML/OIDC); concurrent session policy; 30-day device trust.

**11.B Patient**: Universal search (`/search?q=` over MRN, name, DOB, phone, last-4 SSN, phonetic); patient merge/unmerge with audit; VIP/Sensitive flag → auto break-glass; pre-admission testing (PAT); unit transfer separate from inter-facility (`PATCH /encounters/{id}/unit` + handoff note).

**11.C CPOE**: Order modify after sign (`PATCH /orders/{id}` reason + re-sign); discontinue (`POST /orders/{id}/discontinue`); order set versioning + analytics; standing/protocol orders; verbal/telephone orders (RN-entered, MD 24-h cosign); renewal prompt 24 h before stop-date; PRN with conditions enforced at administration.

**11.D Labs**: Microbiology multi-day (gram stain → growth → ID → susceptibility); add-on tests within stability window; reflex protocols (e.g., ANA → ENA); amended/corrected results with re-ack; POCT entered by RN bypasses specimen tracking.

**11.E ED**: LWBS/Eloped/AMA with status + timestamps; ambulance diversion/saturation; MCI mode (START/JumpSTART); BH hold (1013/5150) e-sign; boarder management.

**11.F Surgery & specialty** — OR minimum: pre-op checklist · site marking · universal protocol time-out · anesthesia record q5min · counts (sponge/sharp/instrument) · implant UDI · specimen-to-path · post-op order sets · PACU 1/2. ICU flowsheet: q1h vitals · vent · drip titration · RASS/CAM-ICU · I/O. Each modality: `POST /<modality>/event` + flowsheet grid.

**11.G Pharmacy**: ADC (Pyxis) dispense/override/witness; IV/compound recipe with second-pharmacist check for chemo; diversion monitoring (outlier reports); RPh interventions route to MD inbasket.

**11.H Billing**: Charge master (CDM) effective-dated; HIM coding workflow (chart deficiency, ICD-10/CPT/HCPCS, DRG grouper); prior auth; self-pay/charity/sliding fee; payment plans; ERA/835 import for auto-posting.

**11.I Admin**: Audit log search/export (by patient/user/date/event); HIPAA accounting of disclosures; quarterly access certification; credentialing renewals (license/DEA/board) with auto-disable on expiry.

---

## §12 Additional roles

| Role | Owns | Notes |
|---|---|---|
| Charge Nurse | Unit assignment, acuity, staffing | RN base + unit-mgmt writes |
| Case Manager / Social Worker | §11.W, payer auth | Read clinical, write care plan |
| Resp. Therapy / PT / OT / SLP | Discipline notes + scope-limited orders | Discipline-scoped chart |
| Dietitian | Nutrition assessment, TPN orders | |
| HIM / Coder | §11.H coding, chart deficiency, ROI | |
| Privacy Officer | Break-glass review, audit reports | Read-only across |
| Quality / Compliance | §11.V review, core measures | Read-only clinical |
| Trainee (Resident/Student) | Writes pending cosign (§11.Q) | Critical for cosign demo |
| Patient / Proxy | §11.S portal | Heavily restricted |

**Scope-of-practice** layering: `Auth/AuthPolicies.cs` checks **role × scope × credentialed-for**, not just role (e.g., RN standing-protocol writes; RPh CPA renewals).

---

## Cross-cutting / technical gaps

1. **Real-time push** — SignalR for eMAR, ED board, code timers, critical labs. 30-s polling is too slow for code blue.
2. **Background jobs** — Hangfire/Quartz for eligibility batch, claim submission batch, statements, expiring license/lot/order checks, sepsis surveillance.
3. **Print services** — wristbands at admit, specimen labels (barcode + DOB), eMAR med labels, discharge paperwork. Demo: wristband + specimen label minimum.
4. **Barcode / QR** generation + scan endpoints for eMAR positive ID and specimen accessioning.
5. **Document storage** — declare S3 or Azure Blob with per-tenant prefix and signed-URL downloads.
6. **DICOM / PACS** — stub DICOMweb fetch returning sample study so `#imaging` renders.
7. **Tenant isolation tests** — every list/get test asserts cross-tenant 404.
8. **Idempotency keys** on `POST /orders`, `/administer`, `/codes/activate`, billing posts.
9. **PHI-in-logs policy** — `[audit_entry]` stores IDs not values; no patient name/DOB in application logs.
10. **Data export (USCDI v3)** — patient self-service full record download, machine-readable.

---

## §13 Smoke-test additions

10. As `md@` — discharge Rx (§11.K); PDMP query for Schedule II; EPCS 2FA prompt.
11. As `rn@` — admission assessment, fall risk, Braden (§11.O). High fall risk triggers CPOE suggestion.
12. As `md@` — order ibuprofen on NSAID-allergic patient (§11.L) — hard-stop; coded-reason override → `[cds_override]`.
13. As `md@` — set code status DNI (§11.M) → banner → attempt intubation order → CDS warning.
14. Background — vitals breach SIRS (§11.N) → RN inbasket ack within 15 min → 1-h bundle timer on `/quality/sepsis`.
15. As `resident@` — sign note → flagged `requiresCosign`; as `md@` — cosign from inbasket (§11.Q).
16. As `cm@` — MDR board: mark barrier resolved, set target DC date (§11.W).
17. Off-care-team user opens chart → break-glass modal → reason → `[audit_entry kind=break_glass]` (§11.U).
18. As `privacy@` — audit report shows the break-glass entry.
19. As `tech@` — blood culture → preliminary gram stain → final susceptibility (§11.D micro).
20. **Cross-tenant probe**: as `md@` tenant A, GET patient from tenant B → 404 (isolation).

---

## Priority order (Phase F)

1. **CDS engine (§11.L)** — promotes hardcoded alerts to first-class.
2. **Med reconciliation (§11.J)** — small surface, high credibility, extends B.2/B.6.
3. **Nursing assessments (§11.O)** — RN role currently looks empty.
4. **Order modify/cancel + verbal orders (§11.C improvements)** — "what if I made a mistake?"
5. **Inbasket (§11.P)** — unifying UI; `/result-ack` + `/messages` fold in.
6. **Break-glass + audit search (§11.U + §11.I)** — small effort, big security story.
7. **Role gates enforcement** — every item above ships with its policy from day one.
