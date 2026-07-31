export type Role = "patient" | "doctor" | "operations";
export type ThemeMode = "light" | "dark" | "system";
export type LanguageCode = "en" | "ta" | "hi" | "te" | "bn" | "mr" | "kn" | "ml";
export type Urgency = "emergency" | "urgent" | "soon" | "routine";
export type DataSource =
  | "user_entered"
  | "device_imported"
  | "clinic_result"
  | "demo";

export interface HealthValue {
  label: string;
  value: string;
  source: DataSource;
  recordedAt: string;
  trend?: number[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  languages: string[];
  fee: number;
  verified: boolean;
  available: boolean;
  initials: string;
}

export interface Appointment {
  id: string;
  clinician: string;
  patient: string;
  date: string;
  time: string;
  mode: "Video" | "Clinic" | "Chat";
  status: "Upcoming" | "Completed" | "Cancelled";
  reason: string;
}

export type AvailabilitySource =
  | "verified_partner"
  | "government_feed"
  | "facility_report"
  | "demo"
  | "unknown";

export interface HospitalAvailability {
  emergencyOpen: boolean | null;
  icuBedsAvailable: number | null;
  ventilatorBedsAvailable: number | null;
  source: AvailabilitySource;
  lastVerifiedAt: string | null;
  verificationExpiresAt: string | null;
}

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  phone: string | null;
  address: string | null;
  osmEmergencyTag: boolean | null;
  totalBedsTag: number | null;
  availability: HospitalAvailability;
}

export interface PredictionCandidate {
  key: string;
  displayName: string;
  description: string;
  modelUrgency: Exclude<Urgency, "emergency">;
  probability: number;
}

export interface SymptomResult {
  urgency: Urgency;
  headline: string;
  explanation: string;
  redFlags: string[];
  candidates: PredictionCandidate[];
  selectedSymptoms: string[];
  generatedAt: string;
  modelDatasetType: string;
  disclaimer: string;
}

export interface MedicalRecord {
  id: string;
  type: "Lab report" | "Prescription" | "Consultation" | "Upload";
  title: string;
  date: string;
  clinician?: string;
  status?: string;
}

export interface MedicineDose {
  id: string;
  medicine: string;
  instruction: string;
  time: string;
  state: "taken" | "due" | "upcoming";
}

export interface EmergencyEvent {
  id: string;
  createdAt: string;
  location: string;
  status: "received" | "confirmed" | "assigned" | "en_route" | "resolved";
  responder: string | null;
  etaMinutes: number | null;
}
