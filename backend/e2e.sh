#!/usr/bin/env bash
set -e

API=http://localhost:5050
declare -A R

j() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const o=JSON.parse(s); console.log(o$1)})"; }

echo "===== FULL CLINICAL WORKFLOW E2E ====="
echo

# 1. Login
TOKEN=$(curl -s -X POST $API/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"demo@medcure.health","password":"demo123!"}' | j ".token")
H="Authorization: Bearer $TOKEN"
echo "1. LOGIN ........................... OK (token issued)"

# Get a real patient id
PID=$(curl -s "$API/api/patients?take=1" -H "$H" | j "[0].id")
echo "   patient id = $PID"
echo

# 2. Place an order
ORDER_JSON=$(curl -s -X POST $API/api/orders -H "Content-Type: application/json" -H "$H" \
  -d "{\"patientId\":$PID,\"orderType\":\"Medication\",\"name\":\"E2E Albuterol\",\"dose\":\"180 mcg\",\"route\":\"INH\",\"frequency\":\"q4h\",\"status\":\"signed\",\"priority\":\"Routine\",\"indication\":\"E2E test\"}")
OID=$(echo "$ORDER_JSON" | j ".id")
ST=$(echo "$ORDER_JSON" | j ".status")
echo "2. CPOE place order ................ OK  order #$OID status=$ST"
echo

# 3. Pharmacy queue contains it
INQ=$(curl -s "$API/api/pharmacy/queue?take=200" -H "$H" | j ".filter(x=>x.id===$OID).length")
echo "3. Pharmacy queue contains it ...... ${INQ}/1"
echo

# 4. Verify
RC=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/orders/$OID/verify" -H "$H")
echo "4. POST /orders/$OID/verify ........ HTTP $RC"
echo

# 5. eMAR query (verified)
INE=$(curl -s "$API/api/orders?type=Medication&status=verified&take=400" -H "$H" | j ".filter(x=>x.id===$OID).length")
echo "5. eMAR sees verified order ........ ${INE}/1"
echo

# 6. Administer
RC=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/orders/$OID/administer" -H "$H")
echo "6. POST /orders/$OID/administer .... HTTP $RC"
echo

# 7. Final status
ST=$(curl -s "$API/api/orders/$OID" -H "$H" | j ".status")
echo "7. Order final status .............. $ST"
echo

# 8. Note create
N_JSON=$(curl -s -X POST $API/api/notes -H "Content-Type: application/json" -H "$H" \
  -d "{\"patientId\":$PID,\"type\":\"Progress\",\"content\":\"E2E note\",\"signed\":true}")
NID=$(echo "$N_JSON" | j ".id")
SI=$(echo "$N_JSON" | j ".signed")
echo "8. POST /notes ..................... OK  note #$NID signed=$SI"
echo

# 9. Triage
A_JSON=$(curl -s -X POST $API/api/ed/triage -H "Content-Type: application/json" -H "$H" \
  -d '{"patientName":"E2E Test","age":42,"sex":"M","chiefComplaint":"E2E chest pain","esiLevel":2,"hr":110,"sbp":150,"spo2":94}')
AID=$(echo "$A_JSON" | j ".id")
echo "9. POST /ed/triage ................. OK  arrival #$AID"
echo

# 10. ED board includes new arrival in ESI 2
INB=$(curl -s "$API/api/ed/board" -H "$H" | j ".find(c=>c.esiLevel===2).patients.filter(p=>p.id===$AID).length")
echo "10. ED board ESI 2 contains it ..... ${INB}/1"
echo

# 11. Lab ack
LID=$(curl -s "$API/api/labs?flag=critical&take=1" -H "$H" | j "[0]?.id ?? 0")
if [ "$LID" != "0" ]; then
  RC=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/labs/$LID/ack" -H "$H")
  ACK=$(curl -s "$API/api/labs/$LID" -H "$H" | j ".acknowledged")
  echo "11. Lab #$LID ack .................... HTTP $RC  acknowledged=$ACK"
else
  echo "11. Lab ack (no critical labs) ..... SKIP"
fi
echo

# 12. Appointment patch
APT=$(curl -s "$API/api/appointments?take=1" -H "$H" | j "[0].id")
RC=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/api/appointments/$APT/status" -H "Content-Type: application/json" -H "$H" -d '{"status":"checked-in"}')
echo "12. PATCH appt status .............. HTTP $RC"
echo

# 13. Bed PATCH
BID=$(curl -s "$API/api/bed-board" -H "$H" | j "[0].beds[0].id")
RC=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/api/bed-board/beds/$BID" -H "Content-Type: application/json" -H "$H" -d '{"status":"cleaning","patientId":null}')
echo "13. PATCH bed #$BID status ......... HTTP $RC"
echo

# 14. Specimen flow
S_JSON=$(curl -s -X POST $API/api/specimens -H "Content-Type: application/json" -H "$H" \
  -d "{\"patientId\":$PID,\"type\":\"E2E CBC\",\"priority\":\"STAT\",\"location\":\"Ward 4E\"}")
SID=$(echo "$S_JSON" | j ".id")
RC=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/specimens/$SID/advance" -H "Content-Type: application/json" -H "$H" -d '{"status":"processing"}')
echo "14. Specimen #$SID create+advance .. HTTP $RC"
echo

# 15. Tenant switch
T2=$(curl -s "$API/api/auth/me" -H "$H" | j ".tenants.find(t=>t.id!==o.activeTenant.id)?.id ?? 0")
if [ "$T2" != "0" ]; then
  RC=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/auth/switch-tenant/$T2" -H "$H")
  echo "15. Switch tenant to #$T2 ............ HTTP $RC"
fi
echo

# 16. Telemetry
TC=$(curl -s "$API/api/telemetry" -H "$H" | j ".length")
echo "16. Telemetry feed ................. $TC patients"
echo

echo "===== E2E COMPLETE ====="
