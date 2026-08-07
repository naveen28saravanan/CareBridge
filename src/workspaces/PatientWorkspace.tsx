import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Ambulance,
  ArrowRight,
  Bell,
  BookOpen,
  BrainCircuit,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  CreditCard,
  Database,
  Download,
  FileHeart,
  FileText,
  HeartPulse,
  Hospital,
  Languages,
  MapPin,
  MessageCircle,
  Mic,
  Pill,
  Phone,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  TestTube2,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  doctors,
  healthValues,
  initialAppointments,
  initialMedicines,
  initialRecords,
  labTests,
} from "../data/demo";
import type {
  Appointment,
  Doctor,
  LanguageCode,
  MedicalRecord,
  MedicineDose,
} from "../types";
import { AdvancedChatbox } from "../components/AdvancedChatbox";
import { EmergencyPanel } from "../components/EmergencyPanel";
import { HospitalFinder } from "../components/HospitalFinder";
import { SymptomInsights } from "../components/SymptomInsights";
import { VideoConsultation } from "../components/VideoConsultation";
import { useToast } from "../components/Toast";
import { DocumentExporter, PrescriptionDocData } from "../components/DocumentExporter";
import { recordAuditEvent } from "../services/audit";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Metric,
  Modal,
  SectionHeading,
  SourceBadge,
  Sparkline,
  Toggle,
} from "../components/ui";
import {
  getUserDataFromSupabase,
  saveUserDataToSupabase,
} from "../lib/supabase";
import { getTranslator, type Translator } from "../i18n";

function getTranslatedSpecialty(specialty: string, t: Translator): string {
  if (specialty === "General Physician") return t("generalPhysician");
  if (specialty === "Dermatologist") return t("dermatologist");
  if (specialty === "Cardiologist") return t("cardiologist");
  if (specialty === "Orthopaedic Surgeon") return t("orthopaedicSurgeon");
  return specialty;
}

interface PatientWorkspaceProps {
  active: string;
  language: LanguageCode;
  displayName: string;
  userId?: string;
  onNavigate: (id: string) => void;
}

function PatientHome({
  language,
  onNavigate,
  appointments,
  medicines,
  displayName,
}: {
  language: LanguageCode;
  onNavigate: (id: string) => void;
  appointments: Appointment[];
  medicines: MedicineDose[];
  displayName: string;
}) {
  const t = useMemo(() => getTranslator(language), [language]);
  const upcoming = appointments.find((item) => item.status === "Upcoming");
  const firstName = displayName.trim().split(/\s+/)[0] || "there";
  const completedDoses = medicines.filter((dose) => dose.state === "taken").length;
  return (
    <div className="page-stack">
      <section className="patient-welcome">
        <header className="patient-welcome__header">
          <div>
            <p>{t("greeting")}</p>
            <h1>{t("appName")}</h1>
          </div>
          <Badge tone="green"><ShieldCheck size={14} /> {t("verified")}</Badge>
        </header>
        <button className="patient-consult-card" onClick={() => onNavigate("consult")}>
          <div className="patient-consult-card__copy">
            <span>{t("verified")}</span>
            <h2>{t("bookDoctor")}</h2>
            <strong>{t("consult")} <ArrowRight size={18} /></strong>
          </div>
          <div className="patient-consult-card__image" aria-hidden="true" />
        </button>
        <div className="patient-feature-grid">
          <button onClick={() => onNavigate("chat")}><span><BrainCircuit size={24} /></span><strong>{t("healthChat")}</strong><small>{t("guidanceOnly")}</small></button>
          <button onClick={() => onNavigate("emergency")} className="is-critical"><span><Ambulance size={24} /></span><strong>{t("emergencySos")}</strong><small>{t("call112")}</small></button>
          <button onClick={() => onNavigate("hospitals")}><span><Hospital size={24} /></span><strong>{t("nearbyHospitals")}</strong><small>{t("locateHospitals")}</small></button>
          <button onClick={() => onNavigate("care")}><span><FileHeart size={24} /></span><strong>{t("firstAid")}</strong><small>{t("offline")}</small></button>
        </div>
      </section>

      <div className="quick-action-grid">
        {[
          {
            id: "consult",
            label: t("bookDoctor"),
            note: t("verified"),
            icon: <Stethoscope size={22} />,
          },
          {
            id: "chat",
            label: t("healthChat"),
            note: t("guidanceOnly"),
            icon: <MessageCircle size={22} />,
          },
          {
            id: "symptoms",
            label: t("symptomInsights"),
            note: t("guidanceOnly"),
            icon: <BrainCircuit size={22} />,
          },
          {
            id: "emergency",
            label: t("emergencySos"),
            note: t("call112"),
            icon: <Ambulance size={22} />,
            critical: true,
          },
          {
            id: "hospitals",
            label: t("nearbyHospitals"),
            note: t("locateHospitals"),
            icon: <Hospital size={22} />,
          },
        ].map((item) => (
          <button
            key={item.id}
            className={`quick-action ${item.critical ? "quick-action--critical" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <span>{item.icon}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.note}</small>
            </div>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card className="appointment-card">
          <SectionHeading
            title={t("nextAppointment")}
            action={
              <button className="text-button" onClick={() => onNavigate("consult")}>
                {t("viewAll")}
              </button>
            }
          />
          {upcoming ? (
            <>
              <div className="appointment-card__doctor">
                <Avatar initials="AK" size="large" />
                <div>
                  <Badge tone="blue">{t("verified")}</Badge>
                  <h3>{upcoming.clinician}</h3>
                  <p>{getTranslatedSpecialty("General Physician", t)}</p>
                </div>
              </div>
              <div className="appointment-facts">
                <span>
                  <Calendar size={17} /> {upcoming.date}
                </span>
                <span>
                  <Clock3 size={17} /> {upcoming.time}
                </span>
                <span>
                  <Video size={17} /> {upcoming.mode}
                </span>
              </div>
              <div className="button-row">
                <Button variant="secondary" onClick={() => onNavigate("consult")}>{t("viewDetails")}</Button>
                <Button icon={<Video size={17} />} onClick={() => onNavigate("consult")}>{t("joinWhenReady")}</Button>
              </div>
            </>
          ) : (
            <p>{t("noUpcomingAppointments")}</p>
          )}
        </Card>

        <Card className="health-snapshot">
          <SectionHeading
            title={t("healthSnapshot")}
            subtitle={t("guidanceOnly")}
            action={
              <Badge tone="blue">
                <Activity size={14} className="pulse-icon" /> Live IoT Wearable Sync Active
              </Badge>
            }
          />
          <div className="health-value-grid">
            {healthValues.slice(0, 4).map((item) => (
              <article key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                {item.trend ? <Sparkline values={item.trend} /> : null}
                <footer>
                  <SourceBadge source={item.source} />
                  <small>{item.recordedAt}</small>
                </footer>
              </article>
            ))}
          </div>
        </Card>

        <Card className="medicine-progress">
          <SectionHeading
            title={t("medicinesToday")}
            action={
              <button className="text-button" onClick={() => onNavigate("medicines")}>
                {t("records")}
              </button>
            }
          />
          <div className="progress-ring-row">
            <span
              className="progress-ring"
              style={
                {
                  "--progress": `${(completedDoses / medicines.length) * 360}deg`,
                } as React.CSSProperties
              }
            >
              <Pill size={22} />
            </span>
            <div>
              <strong>
                {completedDoses} / {medicines.length}
              </strong>
              <span>{t("dosesCompleted")}</span>
            </div>
          </div>
          <p className="muted">{t("guidanceOnly")}</p>
        </Card>

        <Card>
          <SectionHeading
            title={t("recentRecords")}
            action={
              <button className="text-button" onClick={() => onNavigate("records")}>
                {t("viewAll")}
              </button>
            }
          />
          <div className="compact-list">
            {initialRecords.slice(0, 2).map((record) => (
              <button key={record.id} onClick={() => onNavigate("records")}>
                <span className="compact-list__icon">
                  <FileText size={18} />
                </span>
                <div>
                  <strong>{record.title}</strong>
                  <small>{record.date}</small>
                </div>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <SectionHeading
        title={t("doctorsAvailableToday")}
        subtitle={t("guidanceOnly")}
        action={
          <button className="text-button" onClick={() => onNavigate("consult")}>
            {t("viewAll")}
          </button>
        }
      />
      <div className="doctor-card-grid">
        {doctors
          .filter((doctor) => doctor.available)
          .slice(0, 3)
          .map((doctor) => (
            <Card key={doctor.id} className="doctor-card">
              <Avatar initials={doctor.initials} size="large" />
              <Badge tone="green">{t("available")}</Badge>
              <h3>{doctor.name}</h3>
              <p>{getTranslatedSpecialty(doctor.specialty, t)}</p>
              <div className="doctor-card__meta">
                <span>★ {doctor.rating}</span>
                <span>{doctor.experience}</span>
                <span>₹{doctor.fee}</span>
              </div>
              <Button variant="outline" onClick={() => onNavigate("consult")}>
                {t("viewSlots")}
              </Button>
            </Card>
          ))}
      </div>
    </div>
  );
}

function ConsultationPage({
  language,
  appointments,
  setAppointments,
}: {
  language: LanguageCode;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}) {
  const t = useMemo(() => getTranslator(language), [language]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All specialties");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [selectedTime, setSelectedTime] = useState("10:30 AM");
  const [mode, setMode] = useState<Appointment["mode"]>("Video");
  const [success, setSuccess] = useState(false);

  const visibleDoctors = useMemo(
    () =>
      doctors.filter((doctor) => {
        const matchesSearch =
          doctor.name.toLowerCase().includes(search.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(search.toLowerCase());
        const matchesSpecialty =
          specialty === "All specialties" || doctor.specialty === specialty;
        return matchesSearch && matchesSpecialty && (!verifiedOnly || doctor.verified);
      }),
    [search, specialty, verifiedOnly],
  );

  const confirmBooking = () => {
    if (!selectedDoctor) return;
    const appointment: Appointment = {
      id: `apt-${Date.now()}`,
      clinician: selectedDoctor.name,
      patient: "Riya Sharma",
      date: "29 Jul 2026",
      time: selectedTime,
      mode,
      status: "Upcoming",
      reason: "Pre-consultation form pending",
    };
    setAppointments((current) => [appointment, ...current]);
    setBookingOpen(false);
    setSuccess(true);
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title={t("consult")}
        subtitle={t("tagline")}
        action={<Badge tone="green">{t("verified")}</Badge>}
      />

      {success ? (
        <Card tone="success" className="demo-event">
          <CheckCircle2 size={24} />
          <div>
            <strong>{t("saved")}</strong>
            <p>{t("guidanceOnly")}</p>
          </div>
          <button className="icon-button" onClick={() => setSuccess(false)}>
            <X size={17} />
          </button>
        </Card>
      ) : null}

      <Card className="doctor-search">
        <label className="search-field">
          <Search size={19} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchDoctorsPlaceholder")}
          />
        </label>
        <select value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
          <option value="All specialties">{t("allSpecialties")}</option>
          {[...new Set(doctors.map((doctor) => doctor.specialty))].map((item) => (
            <option key={item} value={item}>{getTranslatedSpecialty(item, t)}</option>
          ))}
        </select>
        <Toggle
          checked={verifiedOnly}
          onChange={setVerifiedOnly}
          label={t("verifiedCliniciansOnly")}
        />
      </Card>

      <div className="consult-layout">
        <div className="doctor-list">
          {visibleDoctors.map((doctor) => (
            <Card
              key={doctor.id}
              className={`doctor-list-card ${
                selectedDoctor?.id === doctor.id ? "is-selected" : ""
              }`}
            >
              <Avatar initials={doctor.initials} size="large" />
              <div className="doctor-list-card__body">
                <div>
                  <h3>
                    {doctor.name} <ShieldCheck size={16} />
                  </h3>
                  <p>{getTranslatedSpecialty(doctor.specialty, t)}</p>
                </div>
                <div className="doctor-card__meta">
                  <span>★ {doctor.rating}</span>
                  <span>{doctor.experience}</span>
                  <span>{doctor.languages.join(", ")}</span>
                </div>
                <div className="doctor-list-card__footer">
                  <strong>₹{doctor.fee}</strong>
                  <Badge tone={doctor.available ? "green" : "neutral"}>
                    {doctor.available ? t("availableToday") : t("nextSlotTomorrow")}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedDoctor(doctor);
                  setBookingOpen(true);
                }}
              >
                {t("viewSlots")}
              </Button>
            </Card>
          ))}
        </div>

        <Card className="appointment-history">
          <SectionHeading title={t("yourAppointments")} />
          <div className="compact-list compact-list--appointments">
            {appointments.map((appointment) => (
              <article key={appointment.id}>
                <span className="compact-list__icon">
                  {appointment.mode === "Video" ? (
                    <Video size={18} />
                  ) : (
                    <MessageCircle size={18} />
                  )}
                </span>
                <div>
                  <strong>{appointment.clinician}</strong>
                  <small>
                    {appointment.date} • {appointment.time}
                  </small>
                  <Badge
                    tone={
                      appointment.status === "Upcoming"
                        ? "blue"
                        : appointment.status === "Completed"
                          ? "green"
                          : "neutral"
                    }
                  >
                    {appointment.status === "Upcoming"
                      ? t("upcoming")
                      : appointment.status === "Completed"
                        ? t("completed")
                        : t("open")}
                  </Badge>
                </div>
                {appointment.status === "Upcoming" ? (
                  <button className="text-button" onClick={() => setCallOpen(true)}>
                    {t("open")}
                  </button>
                ) : (
                  <Download size={17} />
                )}
              </article>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={bookingOpen}
        title={selectedDoctor ? `Book ${selectedDoctor.name}` : "Book appointment"}
        onClose={() => setBookingOpen(false)}
      >
        {selectedDoctor ? (
          <div className="page-stack">
            <Card tone="blue" className="selected-doctor">
              <Avatar initials={selectedDoctor.initials} size="large" />
              <div>
                <h3>{selectedDoctor.name}</h3>
                <p>{selectedDoctor.specialty}</p>
                <Badge tone="green">Verified clinician</Badge>
              </div>
              <strong>₹{selectedDoctor.fee}</strong>
            </Card>

            <fieldset className="segmented-field">
              <legend>Consultation mode</legend>
              {(["Video", "Clinic", "Chat"] as Appointment["mode"][]).map((item) => (
                <button
                  key={item}
                  className={mode === item ? "is-active" : ""}
                  onClick={() => setMode(item)}
                >
                  {item === "Video" ? (
                    <Video size={17} />
                  ) : item === "Chat" ? (
                    <MessageCircle size={17} />
                  ) : (
                    <Hospital size={17} />
                  )}
                  {item}
                </button>
              ))}
            </fieldset>

            <div>
              <strong>Wednesday, 29 July</strong>
              <div className="time-grid">
                {["10:30 AM", "11:15 AM", "12:00 PM", "4:30 PM", "5:15 PM"].map(
                  (time) => (
                    <button
                      key={time}
                      className={selectedTime === time ? "is-active" : ""}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ),
                )}
              </div>
            </div>

            <Card className="price-summary">
              <span>{mode} consultation</span>
              <strong>₹{selectedDoctor.fee}</strong>
              <small>Demo payment — no charge will be made</small>
            </Card>
            <Button onClick={confirmBooking}>Confirm demo appointment</Button>
          </div>
        ) : null}
      </Modal>

      <Modal open={callOpen} title="Secure consultation lobby" onClose={() => setCallOpen(false)}>
        <div className="consultation-lobby">
          <Avatar initials="AK" size="large" />
          <h3>Dr. Ananya Kumar</h3>
          <p>General Physician • Today, 10:30 AM</p>
          <div className="lobby-checks">
            <span>
              <Check size={16} /> Internet connection
            </span>
            <span>
              <Check size={16} /> Camera and microphone
            </span>
            <span>
              <Check size={16} /> Health notes ready
            </span>
          </div>
          <Card tone="blue" className="inline-alert">
            <ShieldCheck size={18} />
            <span>WebRTC 1080p encrypted video stream ready for consultation.</span>
          </Card>
          <Button icon={<Video size={18} />} onClick={() => { setCallOpen(false); setInCall(true); }}>Enter Live Consultation</Button>
        </div>
      </Modal>
      <VideoConsultation
        open={inCall}
        doctorName="Dr. Ananya Kumar"
        specialty="General Physician"
        onClose={() => setInCall(false)}
      />
    </div>
  );
}

function CareHub({ language, onNavigate }: { language: LanguageCode; onNavigate: (id: string) => void }) {
  const t = useMemo(() => getTranslator(language), [language]);
  const options = [
    {
      id: "chat",
      title: t("healthChat"),
      note: t("guidanceOnly"),
      icon: <MessageCircle size={28} />,
      badge: t("offline"),
    },
    {
      id: "symptoms",
      title: t("symptomInsights"),
      note: t("guidanceOnly"),
      icon: <BrainCircuit size={28} />,
      badge: t("offline"),
    },
    {
      id: "emergency",
      title: t("emergencySos"),
      note: t("call112"),
      icon: <Ambulance size={28} />,
      badge: t("offline"),
      critical: true,
    },
    {
      id: "hospitals",
      title: t("nearbyHospitals"),
      note: t("locateHospitals"),
      icon: <Hospital size={28} />,
      badge: t("verified"),
    },
    {
      id: "medicines",
      title: t("medicines"),
      note: t("guidanceOnly"),
      icon: <Pill size={28} />,
      badge: t("verified"),
    },
    {
      id: "labs",
      title: t("labTests"),
      note: t("guidanceOnly"),
      icon: <TestTube2 size={28} />,
      badge: t("verified"),
    },
    {
      id: "profile",
      title: t("medicalId"),
      note: t("guidanceOnly"),
      icon: <Users size={28} />,
      badge: t("verified"),
    },
  ];

  return (
    <div className="page-stack">
      <SectionHeading
        title="Care centre"
        subtitle="Health guidance, urgent assistance and everyday care in one place."
      />
      <Card tone="critical" className="hospital-warning">
        <Phone size={22} />
        <div>
          <strong>Immediate danger?</strong>
          <p>Call 112 first. Do not wait for the symptom model or hospital search.</p>
        </div>
        <a className="button button--danger" href="tel:112">
          Call 112
        </a>
      </Card>
      <div className="care-option-grid">
        {options.map((option) => (
          <button
            key={option.id}
            className={`care-option ${option.critical ? "care-option--critical" : ""}`}
            onClick={() => onNavigate(option.id)}
          >
            <span className="care-option__icon">{option.icon}</span>
            <Badge tone={option.critical ? "red" : "blue"}>{option.badge}</Badge>
            <h3>{option.title}</h3>
            <p>{option.note}</p>
            <span className="care-option__link">
              Open <ArrowRight size={16} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecordsPage({
  records,
  setRecords,
}: {
  records: MedicalRecord[];
  setRecords: React.Dispatch<React.SetStateAction<MedicalRecord[]>>;
}) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState("All");
  const [exportDoc, setExportDoc] = useState<PrescriptionDocData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const visible = records.filter((record) => filter === "All" || record.type === filter);

  const upload = (file: File | undefined) => {
    if (!file) return;
    const newRecord: MedicalRecord = {
      id: `rec-${Date.now()}`,
      type: "Upload",
      title: file.name,
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "Local demo upload",
    };
    setRecords((current) => [newRecord, ...current]);
    showToast("Record Uploaded", `${file.name} saved securely to patient records.`, "success");
    recordAuditEvent("Medical Record Uploaded", "Patient", "patient", file.name);
  };

  const handleOpenDoc = (record: MedicalRecord) => {
    const docData: PrescriptionDocData = {
      prescriptionId: record.id.toUpperCase(),
      clinicianName: record.clinician || "Dr. Ananya Kumar",
      clinicianReg: "TNMC-DEMO-28471",
      patientName: "Riya Sharma",
      patientAgeSex: "24 yrs / Female",
      patientAllergies: "Penicillin",
      date: record.date,
      medicines:
        record.type === "Prescription"
          ? [
              { medicine: "Amoxicillin", strength: "500 mg", instructions: "1 capsule after meals twice daily for 5 days" },
              { medicine: "Paracetamol", strength: "650 mg", instructions: "1 tablet as needed for fever" },
            ]
          : [],
      clinicalNotes: record.type === "Lab report" ? "Complete Blood Count (CBC) and Lipid Profile results within normal physiological range." : "Follow clinical advice and complete prescribed course.",
    };
    setExportDoc(docData);
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Health records"
        subtitle="Consultations, prescriptions, laboratory reports and personal uploads."
        action={
          <Button icon={<Upload size={18} />} onClick={() => inputRef.current?.click()}>
            Upload record
          </Button>
        }
      />
      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(event) => upload(event.target.files?.[0])}
      />
      <Card tone="blue" className="inline-alert">
        <ShieldCheck size={20} />
        <span>
          Records are synced to your secure patient profile. Click View or Export to review or print official digital documents.
        </span>
      </Card>
      <div className="record-tabs">
        {["All", "Lab report", "Prescription", "Consultation", "Upload"].map((item) => (
          <button
            key={item}
            className={filter === item ? "is-active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <Card>
        <div className="record-timeline">
          {visible.map((record) => (
            <article key={record.id}>
              <span className="record-timeline__dot" />
              <span className="record-timeline__icon">
                {record.type === "Lab report" ? (
                  <TestTube2 size={21} />
                ) : record.type === "Prescription" ? (
                  <Pill size={21} />
                ) : (
                  <FileHeart size={21} />
                )}
              </span>
              <div>
                <Badge tone={record.type === "Upload" ? "amber" : "blue"}>
                  {record.type}
                </Badge>
                <h3>{record.title}</h3>
                <p>
                  {record.clinician ? `${record.clinician} • ` : ""}
                  {record.date}
                </p>
                {record.status ? <small>{record.status}</small> : null}
              </div>
              <div className="button-row">
                <Button variant="ghost" onClick={() => handleOpenDoc(record)}>View</Button>
                <Button variant="ghost" icon={<Download size={16} />} onClick={() => handleOpenDoc(record)}>
                  Export
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>

      {exportDoc ? (
        <DocumentExporter
          open={Boolean(exportDoc)}
          onClose={() => setExportDoc(null)}
          title={`Document - ${exportDoc.prescriptionId}`}
          docData={exportDoc}
        />
      ) : null}
    </div>
  );
}

function MedicinesPage({
  medicines,
  setMedicines,
}: {
  medicines: MedicineDose[];
  setMedicines: React.Dispatch<React.SetStateAction<MedicineDose[]>>;
}) {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState(true);
  const markTaken = (id: string) => {
    setMedicines((current) =>
      current.map((dose) => (dose.id === id ? { ...dose, state: "taken" } : dose)),
    );
    showToast("Dose Marked as Taken", "Updated in your medication tracking schedule.", "success");
  };

  const handleRefillRequest = () => {
    showToast("Refill Requested", "Refill notification sent to Dr. Ananya Kumar for clinical review.", "info");
    recordAuditEvent("Medicine Refill Requested", "Patient (Riya Sharma)", "patient", "Amoxicillin 500mg Refill");
  };

  const completed = medicines.filter((dose) => dose.state === "taken").length;
  return (
    <div className="page-stack">
      <SectionHeading
        title="My medicines"
        subtitle="Schedules shown exactly as recorded from a clinician’s prescription."
        action={
          <Toggle checked={reminders} onChange={setReminders} label="Dose reminders" />
        }
      />
      <div className="two-column-grid">
        <Card tone="blue" className="medicine-summary">
          <span
            className="progress-ring"
            style={
              {
                "--progress": `${(completed / medicines.length) * 360}deg`,
              } as React.CSSProperties
            }
          >
            <Pill size={26} />
          </span>
          <div>
            <strong>
              {completed} of {medicines.length}
            </strong>
            <p>doses completed today</p>
          </div>
          <Badge tone="blue">As prescribed by your doctor</Badge>
        </Card>
        <Card className="refill-card">
          <ShoppingBag size={28} />
          <div>
            <h3>Need a refill?</h3>
            <p>A request is sent to the prescribing clinician for review.</p>
          </div>
          <Button variant="outline" onClick={handleRefillRequest}>Request refill</Button>
        </Card>
      </div>
      <Card>
        <SectionHeading title="Today, 27 July" />
        <div className="medicine-list">
          {medicines.map((dose) => (
            <article key={dose.id}>
              <span className={`medicine-list__state medicine-list__state--${dose.state}`}>
                {dose.state === "taken" ? <Check size={18} /> : <Pill size={18} />}
              </span>
              <div>
                <h3>{dose.medicine}</h3>
                <p>
                  {dose.instruction} • {dose.time}
                </p>
              </div>
              <Badge
                tone={
                  dose.state === "taken"
                    ? "green"
                    : dose.state === "due"
                      ? "amber"
                      : "neutral"
                }
              >
                {dose.state === "taken" ? "Taken" : dose.state === "due" ? "Due now" : "Upcoming"}
              </Badge>
              {dose.state !== "taken" ? (
                <Button variant="outline" onClick={() => markTaken(dose.id)}>
                  Mark as taken
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

function LabTestsPage({
  records,
  setRecords,
}: {
  records?: MedicalRecord[];
  setRecords?: React.Dispatch<React.SetStateAction<MedicalRecord[]>>;
}) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const total = labTests
    .filter((test) => selected.includes(test.id))
    .reduce((sum, test) => sum + test.price, 0);

  const confirmBooking = () => {
    const selectedNames = labTests
      .filter((t) => selected.includes(t.id))
      .map((t) => t.name)
      .join(", ");

    setBookingOpen(false);
    showToast("Lab Booking Confirmed", `Home collection booked for: ${selectedNames || "Laboratory Panel"}.`, "success");

    if (setRecords) {
      const newRecord: MedicalRecord = {
        id: `lab-${Date.now()}`,
        type: "Lab report",
        title: selectedNames || "Laboratory Panel Booking",
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        status: "Sample collection scheduled (Anna Nagar, Chennai)",
      };
      setRecords((prev) => [newRecord, ...prev]);
    }

    recordAuditEvent("Laboratory Collection Booked", "Patient", "patient", `Tests: ${selectedNames} (₹${total})`);
    setSelected([]);
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Laboratory tests"
        subtitle="Home sample collection and diagnostic test booking."
        action={<Badge tone="green">Verified collection partner</Badge>}
      />
      <Card tone="blue" className="lab-hero">
        <div>
          <Badge tone="blue">Available in Chennai</Badge>
          <h2>Home sample collection</h2>
          <p>Choose a test and a suitable collection slot.</p>
        </div>
        <TestTube2 size={76} />
      </Card>
      <div className="lab-grid">
        {labTests.map((test) => {
          const checked = selected.includes(test.id);
          return (
            <Card key={test.id} className={`lab-card ${checked ? "is-selected" : ""}`}>
              <span className="lab-card__icon">
                <TestTube2 size={24} />
              </span>
              <div>
                <h3>{test.name}</h3>
                <p>{test.fasting ? "Fasting required" : "Fasting not required"}</p>
              </div>
              <strong>₹{test.price}</strong>
              <button
                className={`check-button ${checked ? "is-selected" : ""}`}
                onClick={() =>
                  setSelected((current) =>
                    checked
                      ? current.filter((item) => item !== test.id)
                      : [...current, test.id],
                  )
                }
                aria-label={`Select ${test.name}`}
              >
                {checked ? <Check size={17} /> : "+"}
              </button>
            </Card>
          );
        })}
      </div>
      <Card className="checkout-bar">
        <div>
          <strong>{selected.length} tests selected</strong>
          <span>₹{total}</span>
        </div>
        <Button disabled={selected.length === 0} onClick={() => setBookingOpen(true)}>
          Choose date and time
        </Button>
      </Card>
      <Modal open={bookingOpen} title="Book home collection" onClose={() => setBookingOpen(false)}>
        <div className="page-stack">
          <label>
            Collection address
            <textarea defaultValue="Anna Nagar, Chennai — patient residence address" />
          </label>
          <label>
            Date and time
            <select defaultValue="Tomorrow • 8:00–9:00 AM">
              <option>Tomorrow • 8:00–9:00 AM</option>
              <option>Tomorrow • 10:00–11:00 AM</option>
              <option>In 2 days • 8:00–9:00 AM</option>
            </select>
          </label>
          <Card className="price-summary">
            <span>Total amount</span>
            <strong>₹{total}</strong>
            <small>Pay on sample collection</small>
          </Card>
          <Button onClick={confirmBooking}>Confirm booking</Button>
        </div>
      </Modal>
    </div>
  );
}

interface PatientProfileData {
  photo: string;
  fullName: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string;
  chronicConditions: string;
  primaryDoctor: string;
  insuranceId: string;
}

function PatientProfile({ displayName, userId = "patient_default" }: { displayName: string; userId?: string }) {
  const { showToast } = useToast();
  const primaryName = displayName.trim() || "Riya Sharma";

  const initialProfile: PatientProfileData = useMemo(
    () => ({
      photo: "",
      fullName: primaryName,
      dob: "2002-05-12",
      gender: "Female",
      bloodGroup: "O+",
      phone: "+91 98765 43210",
      email: "riya.sharma@carebridge.demo",
      address: "Anna Nagar, Chennai, Tamil Nadu - 600040",
      emergencyContactName: "Arun Sharma",
      emergencyContactPhone: "+91 98765 43210",
      allergies: "Penicillin",
      chronicConditions: "Mild Asthma",
      primaryDoctor: "Dr. Ananya Kumar",
      insuranceId: "CB-4827-1906",
    }),
    [primaryName]
  );

  const [profile, setProfile] = useState<PatientProfileData>(initialProfile);
  const [profileDraft, setProfileDraft] = useState<PatientProfileData>(initialProfile);
  const [editOpen, setEditOpen] = useState(false);
  const [family, setFamily] = useState(primaryName.split(/\s+/)[0]);
  const [emergencyAccess, setEmergencyAccess] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  // Load saved profile data from Supabase / localStorage on mount
  useEffect(() => {
    getUserDataFromSupabase<PatientProfileData>(userId, "patient_profile", initialProfile).then(
      (saved) => {
        if (saved && saved.fullName) {
          setProfile(saved);
          setProfileDraft(saved);
        }
      }
    );
  }, [userId, initialProfile]);

  useEffect(() => {
    document.documentElement.dataset.largeText = largeText ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.largeText;
    };
  }, [largeText]);

  useEffect(() => {
    document.documentElement.dataset.highContrast = highContrast ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.highContrast;
    };
  }, [highContrast]);

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("File Too Large", "Please select a photo smaller than 5MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileDraft((prev) => ({ ...prev, photo: reader.result as string }));
        showToast("Photo Selected", "Profile picture updated in draft.", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfile(profileDraft);
    setEditOpen(false);
    await saveUserDataToSupabase(userId, "patient_profile", profileDraft);
    showToast("Profile Updated", "Patient health profile and photo updated successfully.", "success");
    recordAuditEvent("Patient Profile Updated", profileDraft.fullName, "patient", "Updated profile details and avatar photo");
  };

  const primaryFirstName = profile.fullName.trim().split(/\s+/)[0] || "Patient";
  const primaryInitials =
    profile.fullName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CB";

  return (
    <div className="page-stack">
      <SectionHeading
        title="Family, Medical ID and settings"
        subtitle="Identity, consent, accessibility, payments and support."
        action={
          <Button
            variant="outline"
            icon={<Settings size={17} />}
            onClick={() => {
              setProfileDraft(profile);
              setEditOpen(true);
            }}
          >
            Edit profile
          </Button>
        }
      />

      <div className="family-strip">
        {[
          [primaryFirstName, primaryInitials, "Me"],
          ["Amma", "AS", "Mother"],
          ["Appa", "KS", "Father"],
        ].map(([name, initials, relation]) => (
          <button
            key={name}
            className={family === name ? "is-active" : ""}
            onClick={() => setFamily(name)}
          >
            <Avatar
              initials={initials}
              src={name === primaryFirstName && profile.photo ? profile.photo : undefined}
            />
            <strong>{name}</strong>
            <small>{relation}</small>
          </button>
        ))}
        <button
          onClick={() =>
            showToast("Add Member", "Dependent-profile registration form initialized.", "info")
          }
        >
          <span className="add-family">+</span>
          <strong>Add member</strong>
          <small>Dependent</small>
        </button>
      </div>

      <div className="profile-grid">
        <Card className="medical-id-card">
          <div className="medical-id-card__top">
            <span>CAREBRIDGE ONE</span>
            <span>+</span>
          </div>
          <div className="medical-id-card__identity">
            <Avatar
              initials={family === primaryFirstName ? primaryInitials : family === "Amma" ? "AS" : "KS"}
              src={family === primaryFirstName && profile.photo ? profile.photo : undefined}
              size="large"
            />
            <div>
              <strong>{family === primaryFirstName ? profile.fullName : `${family} Sharma`}</strong>
              <small>{profile.insuranceId}</small>
            </div>
            <span className="qr-placeholder" aria-label="Demo QR code">
              ▦
            </span>
          </div>
          <div className="medical-id-card__facts">
            <span>
              Blood group <strong>{profile.bloodGroup}</strong>
            </span>
            <span>
              Allergy <strong>{profile.allergies}</strong>
            </span>
          </div>
          <footer>
            <Toggle
              checked={emergencyAccess}
              onChange={(val) => {
                setEmergencyAccess(val);
                showToast(
                  "Emergency Access Updated",
                  val ? "Lock-screen access enabled." : "Lock-screen access disabled.",
                  "info"
                );
              }}
              label="Lock-screen emergency access"
            />
          </footer>
        </Card>

        <Card>
          <div className="section-heading">
            <div>
              <h2>Profile details</h2>
              <p>Personal and clinical health record metadata</p>
            </div>
            <Button
              variant="ghost"
              icon={<Camera size={16} />}
              onClick={() => {
                setProfileDraft(profile);
                setEditOpen(true);
              }}
            >
              Update photo
            </Button>
          </div>
          <dl className="facts-list">
            <div>
              <dt>Full name</dt>
              <dd>{family === primaryFirstName ? profile.fullName : `${family} Sharma`}</dd>
            </div>
            <div>
              <dt>Date of birth / Gender</dt>
              <dd>
                {profile.dob} • {profile.gender}
              </dd>
            </div>
            <div>
              <dt>Phone / Email</dt>
              <dd>
                {profile.phone} • {profile.email}
              </dd>
            </div>
            <div>
              <dt>Residence address</dt>
              <dd>{profile.address}</dd>
            </div>
            <div>
              <dt>Emergency contact</dt>
              <dd>
                {profile.emergencyContactName} • {profile.emergencyContactPhone}
              </dd>
            </div>
            <div>
              <dt>Primary clinician</dt>
              <dd>{profile.primaryDoctor}</dd>
            </div>
            <div>
              <dt>Chronic conditions</dt>
              <dd>{profile.chronicConditions}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="settings-grid">
        <Card>
          <h3>Notifications and accessibility</h3>
          <div className="setting-list">
            <Toggle
              checked={notifications}
              onChange={setNotifications}
              label="Appointment and medicine reminders"
            />
            <Toggle checked={largeText} onChange={setLargeText} label="Larger text" />
            <Toggle checked={highContrast} onChange={setHighContrast} label="High contrast" />
          </div>
        </Card>
        <Card>
          <h3>Privacy and consent</h3>
          <div className="compact-list">
            <button
              onClick={() =>
                showToast("Consent Dashboard", "Sharing permissions active for 2 clinicians.", "info")
              }
            >
              <ShieldCheck size={18} />
              <div>
                <strong>Sharing permissions</strong>
                <small>2 active consents</small>
              </div>
              <ChevronRight size={17} />
            </button>
            <button
              onClick={() =>
                showToast("Access Audit Log", "Record access history retrieved.", "info")
              }
            >
              <FileText size={18} />
              <div>
                <strong>Access history</strong>
                <small>Last accessed today</small>
              </div>
              <ChevronRight size={17} />
            </button>
          </div>
        </Card>
        <Card>
          <h3>Payments and invoices</h3>
          <div className="compact-list">
            <button
              onClick={() =>
                showToast("Payment Methods", "UPI / Card gateway connected.", "info")
              }
            >
              <CreditCard size={18} />
              <div>
                <strong>Payment method</strong>
                <small>Payment profile active</small>
              </div>
              <ChevronRight size={17} />
            </button>
            <button
              onClick={() =>
                showToast("Invoices", "Medical invoice history ready for download.", "info")
              }
            >
              <Download size={18} />
              <div>
                <strong>Invoices</strong>
                <small>2 documents available</small>
              </div>
              <ChevronRight size={17} />
            </button>
          </div>
        </Card>
        <Card>
          <h3>Help and grievance</h3>
          <div className="compact-list">
            <button
              onClick={() =>
                showToast("Support Ticket", "Support ticket #CB-8910 created.", "success")
              }
            >
              <MessageCircle size={18} />
              <div>
                <strong>Contact support</strong>
                <small>Create support ticket</small>
              </div>
              <ChevronRight size={17} />
            </button>
            <button
              onClick={() =>
                showToast("Safety Report", "Safety issue logged with Operations.", "warning")
              }
            >
              <FileHeart size={18} />
              <div>
                <strong>Report a safety concern</strong>
                <small>Reviewed by operations</small>
              </div>
              <ChevronRight size={17} />
            </button>
          </div>
        </Card>
      </div>

      {/* Interactive Edit Profile Modal */}
      <Modal open={editOpen} title="Edit Patient Profile" onClose={() => setEditOpen(false)} wide>
        <div className="profile-editor-form page-stack">
          {/* Photo Upload Section */}
          <Card tone="blue" className="photo-upload-card">
            <div className="photo-upload-card__avatar">
              <Avatar initials={primaryInitials} src={profileDraft.photo || undefined} size="large" />
            </div>
            <div className="photo-upload-card__controls">
              <strong>Profile Photo</strong>
              <p>Upload a clear photo for clinician identification and medical records.</p>
              <div className="button-row">
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Upload size={16} />}
                  onClick={() => photoInputRef.current?.click()}
                >
                  Upload Photo
                </Button>
                {profileDraft.photo ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setProfileDraft((prev) => ({ ...prev, photo: "" }))}
                  >
                    Remove Photo
                  </Button>
                ) : null}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoSelect}
              />
            </div>
          </Card>

          {/* Identity & Basic Info */}
          <div className="two-column-grid">
            <label>
              Full Name
              <input
                value={profileDraft.fullName}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Enter patient full name"
              />
            </label>
            <label>
              Date of Birth
              <input
                type="date"
                value={profileDraft.dob}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, dob: e.target.value }))
                }
              />
            </label>
          </div>

          <div className="two-column-grid">
            <label>
              Gender / Sex
              <select
                value={profileDraft.gender}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, gender: e.target.value }))
                }
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </label>
            <label>
              Blood Group
              <select
                value={profileDraft.bloodGroup}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, bloodGroup: e.target.value }))
                }
              >
                <option>O+</option>
                <option>A+</option>
                <option>B+</option>
                <option>AB+</option>
                <option>O-</option>
                <option>A-</option>
                <option>B-</option>
                <option>AB-</option>
              </select>
            </label>
          </div>

          {/* Contact Details */}
          <div className="two-column-grid">
            <label>
              Phone Number
              <input
                value={profileDraft.phone}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+91 Mobile number"
              />
            </label>
            <label>
              Email Address
              <input
                type="email"
                value={profileDraft.email}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="patient@example.com"
              />
            </label>
          </div>

          <label>
            Residential Address
            <textarea
              rows={2}
              value={profileDraft.address}
              onChange={(e) =>
                setProfileDraft((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Street address, City, State, Pincode"
            />
          </label>

          {/* Emergency Contact & Medical ID */}
          <div className="two-column-grid">
            <label>
              Emergency Contact Name
              <input
                value={profileDraft.emergencyContactName}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, emergencyContactName: e.target.value }))
                }
                placeholder="Full name of emergency contact"
              />
            </label>
            <label>
              Emergency Contact Phone
              <input
                value={profileDraft.emergencyContactPhone}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))
                }
                placeholder="+91 Emergency mobile number"
              />
            </label>
          </div>

          <div className="two-column-grid">
            <label>
              Known Allergies
              <input
                value={profileDraft.allergies}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, allergies: e.target.value }))
                }
                placeholder="e.g. Penicillin, Peanuts, Latex"
              />
            </label>
            <label>
              Chronic Conditions / Medical Notes
              <input
                value={profileDraft.chronicConditions}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, chronicConditions: e.target.value }))
                }
                placeholder="e.g. Asthma, Hypertension, Diabetes"
              />
            </label>
          </div>

          <div className="two-column-grid">
            <label>
              Insurance / Medical ID
              <input
                value={profileDraft.insuranceId}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, insuranceId: e.target.value }))
                }
                placeholder="CB-XXXX-XXXX"
              />
            </label>
            <label>
              Primary Clinician
              <input
                value={profileDraft.primaryDoctor}
                onChange={(e) =>
                  setProfileDraft((prev) => ({ ...prev, primaryDoctor: e.target.value }))
                }
                placeholder="Doctor name"
              />
            </label>
          </div>

          <div className="button-row button-row--end" style={{ marginTop: "12px" }}>
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" icon={<Check size={17} />} onClick={handleSaveProfile}>
              Save Profile Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function PatientWorkspace({
  active,
  language,
  displayName,
  userId = "patient_default",
  onNavigate,
}: PatientWorkspaceProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [records, setRecords] = useState<MedicalRecord[]>(initialRecords);
  const [medicines, setMedicines] = useState<MedicineDose[]>(initialMedicines);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [apts, recs, meds] = await Promise.all([
          getUserDataFromSupabase<Appointment[]>(userId, "appointments", initialAppointments),
          getUserDataFromSupabase<MedicalRecord[]>(userId, "records", initialRecords),
          getUserDataFromSupabase<MedicineDose[]>(userId, "medicines", initialMedicines),
        ]);
        if (mounted) {
          if (Array.isArray(apts) && apts.length > 0) setAppointments(apts);
          if (Array.isArray(recs) && recs.length > 0) setRecords(recs);
          if (Array.isArray(meds) && meds.length > 0) setMedicines(meds);
        }
      } catch (err) {
        console.warn("Notice loading user data from Supabase:", err);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const updateAppointments = (action: React.SetStateAction<Appointment[]>) => {
    setAppointments((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveUserDataToSupabase(userId, "appointments", next).catch(() => {});
      return next;
    });
  };

  const updateRecords = (action: React.SetStateAction<MedicalRecord[]>) => {
    setRecords((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveUserDataToSupabase(userId, "records", next).catch(() => {});
      return next;
    });
  };

  const updateMedicines = (action: React.SetStateAction<MedicineDose[]>) => {
    setMedicines((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveUserDataToSupabase(userId, "medicines", next).catch(() => {});
      return next;
    });
  };

  switch (active) {
    case "consult":
      return (
        <ConsultationPage
          language={language}
          appointments={appointments}
          setAppointments={updateAppointments}
        />
      );
    case "care":
      return <CareHub language={language} onNavigate={onNavigate} />;
    case "chat":
      return (
        <AdvancedChatbox language={language} onNavigate={onNavigate} />
      );
    case "symptoms":
      return <SymptomInsights onBookDoctor={() => onNavigate("consult")} />;
    case "emergency":
      return <EmergencyPanel onOpenHospitals={() => onNavigate("hospitals")} />;
    case "hospitals":
      return <HospitalFinder />;
    case "records":
      return <RecordsPage records={records} setRecords={updateRecords} />;
    case "medicines":
      return <MedicinesPage medicines={medicines} setMedicines={updateMedicines} />;
    case "labs":
      return <LabTestsPage records={records} setRecords={updateRecords} />;
    case "profile":
      return <PatientProfile displayName={displayName} userId={userId} />;
    default:
      return (
        <PatientHome
          language={language}
          onNavigate={onNavigate}
          appointments={appointments}
          medicines={medicines}
          displayName={displayName}
        />
      );
  }
}

