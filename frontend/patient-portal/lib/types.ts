export interface AuthUser {
  id: number;
  email: string;
  fullName?: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  activeTenant?: { id: number; name: string };
  tenants?: Array<{ id: number; name: string }>;
}

export interface Appointment {
  id: number;
  patientId?: number;
  patientName?: string;
  startsAt: string;
  endsAt?: string;
  type?: string;
  status?: string;
  location?: string;
  providerName?: string;
}

export interface LabResult {
  id: number;
  patientId?: number;
  testName?: string;
  name?: string;
  resultValue?: string;
  value?: string;
  unit?: string;
  status?: string;
  observedAt?: string;
  collectedAt?: string;
  resultedAt?: string;
  referenceRange?: string;
}

export interface Claim {
  id: number;
  claimNumber?: string;
  patientName?: string;
  serviceDate?: string;
  amount?: number;
  totalAmount?: number;
  status?: string;
  payer?: string;
}

export interface MessageThread {
  id: number;
  subject?: string;
  topic?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  participants?: string[];
  preview?: string;
}

export interface Message {
  id: number;
  threadId: number;
  senderName?: string;
  senderId?: number;
  body?: string;
  content?: string;
  sentAt?: string;
  createdAt?: string;
}
