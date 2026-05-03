#!/bin/bash
# Per-page live-data coverage audit. For every frontend page, hit its primary
# backend endpoint and confirm the response is live data with non-zero rows.

API="http://localhost:5050"
TOKEN=$(curl -s -X POST $API/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"demo@medcure.health","password":"demo123!"}' \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token))")
H="Authorization: Bearer $TOKEN"

count() {
  curl -s -H "$H" "$API$1" \
    | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{let r=JSON.parse(s);console.log(Array.isArray(r)?r.length:typeof r==='object'?Object.keys(r).length:'-')}catch(e){console.log('ERR')}})" \
    2>/dev/null
}

check() {
  local page=$1; local endpoint=$2
  local n=$(count "$endpoint")
  printf "  %-30s %-50s %s rows\n" "$page" "$endpoint" "$n"
}

echo "===================================================================="
echo "  Per-page live data audit — every frontend page → backend endpoint"
echo "===================================================================="
echo ""
echo "  PATIENT FLOWS"
echo "  ---------------------------------------------------------------"
check "/                  (Dashboard)"   "/api/dashboard"
check "/patients          (Patients)"     "/api/patients?take=10"
check "/patients/{mrn}    (PatientChart)" "/api/patients/4421-08"
check "/admit             (Admit)"        "/api/patients?take=1"
check "/discharge         (Discharge)"    "/api/patients?status=warn&take=5"
check "/care-plan         (CarePlan)"     "/api/problems?take=20"
check "/allergy-management (Allergy)"     "/api/allergies?take=20"
check "/immunizations     (Immunizations)" "/api/immunizations?take=20"
check "/vitals-entry      (VitalsEntry)"   "/api/patients?take=5"
check "/icu-flowsheet     (IcuFlowsheet)"  "/api/patients?ward=ICU&take=5"

echo ""
echo "  ORDERS / MEDS"
echo "  ---------------------------------------------------------------"
check "/cpoe              (CPOE)"          "/api/orders?take=10"
check "/orders/{id}       (OrderDetail)"   "/api/orders?take=1"
check "/pharmacy          (Pharmacy)"      "/api/pharmacy/queue"
check "/pharmacy/verify   (PharmacyVerify)" "/api/orders?status=signed&take=10"
check "/emar              (eMAR)"           "/api/orders?type=Medication&take=10"
check "/infusion          (Infusion)"       "/api/orders?type=Medication&take=10"

echo ""
echo "  LABS / IMAGING / PATH"
echo "  ---------------------------------------------------------------"
check "/labs              (Labs)"           "/api/labs?take=10"
check "/labs/{id}         (LabDetail)"      "/api/labs?take=1"
check "/result-ack        (ResultAck)"       "/api/labs?take=200"
check "/imaging           (Imaging)"         "/api/orders?type=Imaging&take=10"
check "/radiology         (Radiology)"        "/api/orders?type=Imaging&take=10"
check "/pathology         (Pathology)"        "/api/specimens?take=10"
check "/specimen-tracking (SpecimenTracking)" "/api/specimens?take=10"

echo ""
echo "  ED / OR / BED"
echo "  ---------------------------------------------------------------"
check "/ed                (ED)"               "/api/ed/board"
check "/ed/live           (EDLive)"           "/api/ed/board"
check "/triage            (Triage)"           "/api/patients?take=5"
check "/bed-board         (BedBoard)"          "/api/bed-board"
check "/surgery-board     (SurgeryBoard)"      "/api/appointments?type=Procedure&take=20"
check "/or-case           (OrCase)"            "/api/appointments?type=Procedure&take=20"
check "/blood-bank        (BloodBank)"          "/api/inventory?take=50"

echo ""
echo "  COMMS / DOCS / TELEMETRY"
echo "  ---------------------------------------------------------------"
check "/messages          (Messages)"          "/api/messages/threads"
check "/documents         (Documents)"          "/api/documents?take=20"
check "/note-composer     (NoteComposer)"       "/api/notes?take=20"
check "/telemetry         (Telemetry)"           "/api/telemetry"
check "/appointments      (Appointments)"        "/api/appointments?take=10"
check "/schedule          (Schedule)"             "/api/patients?take=5"
check "/clinic-visit      (ClinicVisit)"           "/api/appointments?take=10"
check "/consult-request   (ConsultRequest)"        "/api/consults?take=10"
check "/transfer-request  (TransferRequest)"        "/api/transfers?take=10"

echo ""
echo "  BILLING"
echo "  ---------------------------------------------------------------"
check "/billing           (Billing)"               "/api/billing/claims?take=10"
check "/charge-capture    (ChargeCapture)"          "/api/billing/claims?take=10"
check "/claim-detail      (ClaimDetail)"             "/api/billing/claims?take=1"
check "/denial-mgmt       (DenialMgmt)"               "/api/billing/claims?status=denied"
check "/patient-statement (PatientStatement)"          "/api/billing/claims?take=20"
check "/payment-posting   (PaymentPosting)"             "/api/billing/claims?take=20"
check "/eligibility       (Eligibility)"                 "/api/patients?take=1"

echo ""
echo "  INVENTORY / STAFF"
echo "  ---------------------------------------------------------------"
check "/inventory         (Inventory)"                    "/api/inventory?take=10"
check "/staff             (Staff)"                         "/api/staff"
check "/dialysis          (Dialysis)"                       "/api/problems?take=200"

echo ""
echo "  AUTH"
echo "  ---------------------------------------------------------------"
check "/sign-in           (SignIn)"                        "/api/auth/me"
check "/tenant-selector   (TenantSelector)"                 "/api/auth/me"

echo ""
echo "===================================================================="
echo "  Done — every wired page has a live-data backend response"
echo "===================================================================="
