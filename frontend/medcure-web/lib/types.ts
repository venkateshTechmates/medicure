// Mirrors backend DTOs

export type StatusKind = "good" | "warn" | "bad" | "info";

export interface ChannelPref {
  id: number;
  userId: number;
  category: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  quietFrom?: string | null;
  quietUntil?: string | null;
}

export interface OnCallShift {
  id: number;
  service: string;
  userId: number;
  backupUserId?: number | null;
  startsAt: string;
  endsAt: string;
  role: string;
  pager?: string | null;
}

export interface AlertEscalation {
  id: number;
  alertNotificationId: number;
  step: number;
  toUserId: number;
  scheduledAt: string;
  firedAt?: string | null;
  acknowledgedAt?: string | null;
  reason: string;
}


export interface User {
  id: number;
  email: string;
  fullName: string;
  title: string;
  specialty: string;
  avatarUrl: string;
}

export interface Tenant {
  id: number;
  name: string;
  location: string;
  tier: string;
  initial: string;
  colorHex: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  activeTenant: Tenant;
  tenants: Tenant[];
}

export interface PatientSummary {
  id: number;
  mrn: string;
  fullName: string;
  age: number;
  sex: string;
  status: string;
  ward: string;
  bed: string;
  attendingName: string;
  admittedAt: string;
  avatarUrl: string;
  hr?: number | null;
  sbp?: number | null;
  dbp?: number | null;
  spo2?: number | null;
}

export interface PatientDetail extends PatientSummary {
  weightKg: number;
  heightCm: number;
  codeStatus: string;
  insurance: string;
  phone: string;
  address: string;
  primaryRn: string;
  allergies: { id: number; substance: string; reaction: string; severity: string }[];
  problems: { id: number; description: string; icdCode: string; onset: string; type: string }[];
}

export interface Vital {
  id: number;
  patientId: number;
  recordedAt: string;
  hr: number;
  sbp: number;
  dbp: number;
  spo2: number;
  rr: number;
  tempC: number;
  pain?: number | null;
  recordedBy: string;
}

export interface Appointment {
  id: number;
  scheduledAt: string;
  durationMin: number;
  providerName: string;
  specialty: string;
  room: string;
  status: string;
  type: string;
  patient?: { id: number; mrn: string; fullName: string; avatarUrl: string } | null;
}

export interface Order {
  id: number;
  patientId: number;
  orderType: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  indication: string;
  priority: string;
  status: string;
  orderedByName: string;
  signedAt?: string | null;
  verifiedAt?: string | null;
  verifiedByName?: string | null;
  startAt?: string | null;
  duration?: string | null;
  notes: string;
  revision?: number;
  discontinuedAt?: string | null;
  discontinuedReason?: string;
  orderingMdId?: number | null;
  enteredByUserId?: number | null;
  verbalCosignDue?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabResult {
  id: number;
  patientId: number;
  orderId?: number | null;
  panel: string;
  testName: string;
  value: string;
  units: string;
  refRange: string;
  flag: string;
  resultedAt: string;
  resultedBy: string;
  acknowledged: boolean;
  patient?: { id: number; mrn: string; firstName: string; lastName: string } | null;
}

export interface Allergy { id: number; patientId: number; substance: string; reaction: string; severity: string; }
export interface Problem { id: number; patientId: number; description: string; icdCode: string; onset: string; type: string; }
export interface Immunization {
  id: number; patientId: number; vaccine: string; lotNumber: string;
  manufacturer: string; site: string; route: string; doseSeries: string;
  administered: string; administeredBy: string; status: string; notes: string;
}
export interface ConsultRequest {
  id: number; patientId: number; fromService: string; toService: string;
  toProvider: string; reason: string; question: string; urgency: string;
  status: string; response: string; requestedAt: string; respondedAt?: string | null;
  requestedByName: string; respondedByName: string;
  patient?: { id: number; mrn: string; firstName: string; lastName: string } | null;
}
export interface TransferRequest {
  id: number; patientId: number; fromUnit: string; toUnit: string;
  reason: string; acuity: string; isolation: string; status: string;
  acceptedBy: string; requestedAt: string; acceptedAt?: string | null;
  completedAt?: string | null; requestedByName: string; notes: string;
  patient?: { id: number; mrn: string; firstName: string; lastName: string } | null;
}
export interface CodeEvent {
  id: number; patientId?: number | null; kind: string; location: string;
  activatedBy: string; activatedAt: string; resolvedAt?: string | null;
  outcome: string; status: string; timelineJson: string;
  patient?: { id: number; mrn: string; firstName: string; lastName: string } | null;
}
export interface Specimen {
  id: number; patientId: number; type: string; status: string;
  collectedAt?: string | null; collectedBy: string; location: string; priority: string;
}
export interface TelemetryPatient {
  id: number; mrn: string; fullName: string; age: number; sex: string;
  status: string; bed: string; avatarUrl: string; attendingName: string;
  hr: number; sbp: number; dbp: number; spo2: number; rr: number; tempC: number;
}

export interface Bed {
  id: number;
  bedNumber: string;
  status: string;
  patientId?: number | null;
}

export interface WardWithBeds {
  id: number;
  name: string;
  code: string;
  bedCount: number;
  avgLos: number;
  nurseRatio: string;
  beds: Bed[];
}

export interface EDArrival {
  id: number;
  patientName: string;
  age: number;
  sex: string;
  chiefComplaint: string;
  esiLevel: number;
  arrivalMode: string;
  arrivedAt: string;
  status: string;
  bay: string;
  hr: number;
  sbp: number;
  spo2: number;
}

export interface EDColumn {
  esiLevel: number;
  patients: EDArrival[];
}

export interface Claim {
  id: number;
  claimNumber: string;
  payer: string;
  cptCode: string;
  serviceDescription: string;
  dateOfService: string;
  amount: number;
  status: string;
  denialReason: string;
  patient?: { id: number; mrn: string; fullName: string } | null;
}

export interface InventoryItem {
  id: number;
  name: string;
  ndc: string;
  sku: string;
  category: string;
  onHand: number;
  parLevel: number;
  location: string;
  lotNumber: string;
  expiresAt?: string | null;
  unitCost: number;
}

export interface StaffMember {
  userId: number;
  role: string;
  status: string;
  patientsCount: number;
  inboxCount: number;
  onCallHours: number;
  fullName?: string;
  email?: string;
  title?: string;
  specialty?: string;
  avatarUrl?: string;
}

export interface MessageThread {
  id: number;
  subject: string;
  patientId?: number | null;
  urgent: boolean;
  lastMessageAt: string;
  participants: string;
}

export interface Message {
  id: number;
  threadId: number;
  senderName: string;
  body: string;
  sentAt: string;
  read: boolean;
}

export interface DocumentItem {
  id: number;
  patientId?: number | null;
  title: string;
  category: string;
  fileType: string;
  pages: number;
  sizeBytes: number;
  authorName: string;
  status: string;
  createdAt: string;
}

export interface Note {
  id: number;
  patientId: number;
  type: string;
  authorName: string;
  content: string;
  signed: boolean;
  signedAt?: string | null;
  createdAt: string;
}

export interface NoteTemplate {
  id: number;
  code: string;
  title: string;
  specialty: string;
  type: string;
  body: string;
  scope: "system" | "tenant" | "user";
  ownerUserId?: number | null;
}

export interface SmartPhrase {
  id: number;
  code: string;
  title: string;
  body: string;
  scope: "system" | "tenant" | "user";
  ownerUserId?: number | null;
}

export interface NoteAddendum {
  id: number;
  noteId: number;
  authorName: string;
  authorUserId?: number | null;
  body: string;
  signedAt: string;
  createdAt: string;
}

export interface NoteDraft {
  id: number;
  noteId?: number | null;
  authorUserId: number;
  patientId: number;
  type: string;
  body: string;
  updatedAt: string;
  createdAt: string;
}

export type ConsentKind = "treatment" | "procedure" | "photo" | "research" | "hipaa";
export type ConsentStatus = "draft" | "signed" | "revoked" | "expired";

export interface Consent {
  id: number;
  patientId: number;
  encounterId?: number | null;
  kind: ConsentKind | string;
  title: string;
  bodyText: string;
  requiredWitness: boolean;
  status: ConsentStatus | string;
  signedByPatientName: string;
  signatureBlobKey?: string | null;
  witnessName?: string | null;
  witnessSignatureBlobKey?: string | null;
  signedAt?: string | null;
  revokedAt?: string | null;
  expiresAt?: string | null;
  revocationReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Assessment {
  id: number;
  patientId: number;
  encounterId?: number | null;
  performedByUserId: number;
  kind: string;
  tool: string;
  score: number;
  risk: string;
  detailsJson: string;
  notes: string;
  createdAt: string;
  patient?: { id: number; mrn: string; firstName: string; lastName: string } | null;
}

export interface RecentPatient {
  id: number;
  mrn: string;
  fullName: string;
  status: string;
  ward: string;
  bed: string;
  avatarUrl: string;
  viewedAt: string;
}

export interface PinnedPatient {
  id: number;
  mrn: string;
  fullName: string;
  status: string;
  ward: string;
  bed: string;
  avatarUrl: string;
  pinnedAt: string;
}

export interface PaletteAction {
  id: string;
  label: string;
  kind: "nav" | "action";
  url?: string | null;
  hint?: string | null;
}

// PRD §14.C — favorite orders & panels
export interface FavoriteOrder {
  id: number;
  userId: number;
  name: string;
  orderType: string;
  dose: string;
  route: string;
  frequency: string;
  indication: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FavoritePanelItem {
  id: number;
  panelId: number;
  name: string;
  orderType: string;
  dose: string;
  route: string;
  frequency: string;
  indication: string;
}

export interface FavoritePanel {
  id: number;
  userId: number;
  name: string;
  description: string;
  items: FavoritePanelItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardData {
  totalPatients: number;
  critical: number;
  warn: number;
  appointmentsToday: number;
  pendingOrders: number;
  criticalLabs: number;
  edActive: number;
  upcomingAppointments: {
    id: number;
    scheduledAt: string;
    providerName: string;
    specialty: string;
    patient: { id: number; mrn: string; fullName: string; avatarUrl: string; dateOfBirth: string } | null;
  }[];
}
