import type {
  Appointment,
  Doctor,
  EmergencyEvent,
  HealthValue,
  MedicalRecord,
  MedicineDose,
} from "../types";

export const doctors: Doctor[] = [
  {
    id: "doc-ananya",
    name: "Dr. Ananya Kumar",
    specialty: "General Physician",
    experience: "12 years",
    rating: 4.9,
    languages: ["English", "Tamil", "Hindi"],
    fee: 499,
    verified: true,
    available: true,
    initials: "AK",
  },
  {
    id: "doc-priya",
    name: "Dr. Priya Nair",
    specialty: "Dermatologist",
    experience: "9 years",
    rating: 4.7,
    languages: ["English", "Tamil", "Malayalam"],
    fee: 599,
    verified: true,
    available: true,
    initials: "PN",
  },
  {
    id: "doc-rahul",
    name: "Dr. Rahul Mehta",
    specialty: "Cardiologist",
    experience: "14 years",
    rating: 4.8,
    languages: ["English", "Hindi", "Marathi"],
    fee: 799,
    verified: true,
    available: false,
    initials: "RM",
  },
  {
    id: "doc-sandeep",
    name: "Dr. Sandeep Iyer",
    specialty: "Orthopaedic Surgeon",
    experience: "15 years",
    rating: 4.9,
    languages: ["English", "Tamil", "Kannada"],
    fee: 749,
    verified: true,
    available: true,
    initials: "SI",
  },
];

export const initialAppointments: Appointment[] = [
  {
    id: "apt-1",
    clinician: "Dr. Ananya Kumar",
    patient: "Riya Sharma",
    date: "28 Jul 2026",
    time: "10:30 AM",
    mode: "Video",
    status: "Upcoming",
    reason: "Fever and sore throat",
  },
  {
    id: "apt-2",
    clinician: "Dr. Priya Nair",
    patient: "Riya Sharma",
    date: "18 Jul 2026",
    time: "4:15 PM",
    mode: "Video",
    status: "Completed",
    reason: "Skin irritation",
  },
];

export const healthValues: HealthValue[] = [
  {
    label: "Heart rate",
    value: "76 bpm",
    source: "device_imported",
    recordedAt: "Today, 8:10 AM",
    trend: [72, 74, 73, 78, 76, 77, 76],
  },
  {
    label: "SpO₂",
    value: "98%",
    source: "device_imported",
    recordedAt: "Today, 8:10 AM",
    trend: [98, 98, 97, 98, 99, 98, 98],
  },
  {
    label: "Blood pressure",
    value: "116/76",
    source: "user_entered",
    recordedAt: "Yesterday, 7:30 PM",
    trend: [118, 116, 119, 117, 116, 115, 116],
  },
  {
    label: "Temperature",
    value: "38.1 °C",
    source: "user_entered",
    recordedAt: "Today, 8:10 AM",
    trend: [37.1, 37.4, 37.8, 38.0, 38.1],
  },
];

export const initialRecords: MedicalRecord[] = [
  {
    id: "rec-1",
    type: "Lab report",
    title: "Complete Blood Count",
    date: "24 Jul 2026",
    status: "Within reference range",
  },
  {
    id: "rec-2",
    type: "Prescription",
    title: "Prescription",
    date: "22 Jul 2026",
    clinician: "Dr. Ananya Kumar",
  },
  {
    id: "rec-3",
    type: "Consultation",
    title: "Consultation summary",
    date: "22 Jul 2026",
    clinician: "Dr. Ananya Kumar",
  },
];

export const initialMedicines: MedicineDose[] = [
  {
    id: "med-1",
    medicine: "Metformin 500 mg",
    instruction: "After breakfast • As prescribed",
    time: "8:00 AM",
    state: "taken",
  },
  {
    id: "med-2",
    medicine: "Vitamin D3",
    instruction: "After lunch • As prescribed",
    time: "1:30 PM",
    state: "due",
  },
  {
    id: "med-3",
    medicine: "Metformin 500 mg",
    instruction: "After dinner • As prescribed",
    time: "8:30 PM",
    state: "upcoming",
  },
];

export const emergencyEvents: EmergencyEvent[] = [
  {
    id: "sos-2048",
    createdAt: "9:41 AM",
    location: "Anna Nagar, Chennai",
    status: "en_route",
    responder: "Emergency Unit 12",
    etaMinutes: 8,
  },
  {
    id: "sos-2047",
    createdAt: "8:52 AM",
    location: "T. Nagar, Chennai",
    status: "assigned",
    responder: "Emergency Unit 7",
    etaMinutes: 12,
  },
];

export const firstAidTopics = [
  {
    id: "cpr",
    title: "Adult CPR",
    summary: "Call 112, follow dispatcher instructions and begin CPR if advised.",
    steps: [
      "Check the scene is safe and check responsiveness.",
      "Call 112 and use speaker mode.",
      "Follow the emergency dispatcher’s CPR instructions.",
      "Use an AED as soon as one is available.",
    ],
  },
  {
    id: "choking",
    title: "Choking",
    summary: "Get emergency help if the person cannot breathe, speak or cough.",
    steps: [
      "Ask if the person is choking.",
      "Call 112 for severe airway obstruction.",
      "Follow the dispatcher’s age-appropriate instructions.",
      "Begin CPR if the person becomes unresponsive and you are instructed to do so.",
    ],
  },
  {
    id: "bleeding",
    title: "Severe bleeding",
    summary: "Call 112 and apply firm direct pressure with a clean cloth.",
    steps: [
      "Call 112 and protect yourself from blood exposure.",
      "Apply firm, continuous direct pressure.",
      "Do not remove deeply embedded objects.",
      "Keep monitoring breathing until help arrives.",
    ],
  },
  {
    id: "burn",
    title: "Burns",
    summary: "Cool a minor burn with cool running water; serious burns need emergency care.",
    steps: [
      "Move away from the heat source if safe.",
      "Cool the burn with cool running water.",
      "Do not apply ice, butter or toothpaste.",
      "Seek urgent care for large, deep, electrical or chemical burns.",
    ],
  },
];

export const labTests = [
  { id: "cbc", name: "Complete Blood Count", price: 399, fasting: false },
  { id: "thyroid", name: "Thyroid Profile", price: 699, fasting: false },
  { id: "diabetes", name: "Diabetes Check", price: 549, fasting: true },
  { id: "liver", name: "Liver Function Test", price: 849, fasting: true },
];
