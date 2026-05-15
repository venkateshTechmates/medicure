# MedCure Patient Portal

Patient-facing Next.js app. Separate from the staff app (`frontend/medcure-web`). Shares the same backend at `http://localhost:5050`.

## Dev

```powershell
cd frontend/patient-portal
npm install
npm run dev    # http://localhost:3001
```

Demo login: `demo@medcure.health` / `demo123!`.

Token stored in `localStorage["medcure_portal_token"]` (separate from the staff app's `medcure_token`).
