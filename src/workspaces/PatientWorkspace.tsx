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
  SUPABASE_URL,
} from "../lib/supabase";

interface PatientWorkspaceProps {
  active: string;
  language: LanguageCode;
  displayName: string;
  userId?: string;
  onNavigate: (id: string) => void;
}

function PatientHome({
  onNavigate,
  appointments,
  medicines,
  displayName,
}: {
  onNavigate: (id: string) => void;
  appointments: Appointment[];
  medicines: MedicineDose[];
  displayName: string;
}) {
  const upcoming = appointments.find((item) => item.status === "Upcoming");
  const firstName = displayName.trim().split(/\s+/)[0] || "there";
  const completedDoses = medicines.filter((dose) => dose.state === "taken").length;
  return (
    <div className="page-stack">
      <section className="patient-welcome">
        <header className="patient-welcome__header">
          <div>
            <p>Good morning, {firstName}</p>
            <h1>How can we help today?</h1>
          </div>
          <Badge tone="green"><ShieldCheck size={14} /> Protected health profile</Badge>
        </header>
        <button className="patient-consult-card" onClick={() => onNavigate("consult")}>
          <div className="patient-consult-card__copy">
            <span>Verified clinicians</span>
            <h2>Talk to<br />a doctor</h2>
            <strong>Consult now <ArrowRight size={18} /></strong>
          </div>
          <div className="patient-consult-card__image" aria-hidden="true" />
        </button>
        <div className="patient-feature-grid">
          <button onClick={() => onNavigate("chat")}><span><BrainCircuit size={24} /></span><strong>AI Health Guide</strong><small>Emergency-first guidance</small></button>
          <button onClick={() => onNavigate("emergency")} className="is-critical"><span><Ambulance size={24} /></span><strong>Emergency Care</strong><small>Call 112 and first aid</small></button>
          <button onClick={() => onNavigate("hospitals")}><span><Hospital size={24} /></span><strong>Nearby Hospitals</strong><small>Map and call-to-verify</small></button>
          <button onClick={() => onNavigate("care")}><span><FileHeart size={24} /></span><strong>First Aid</strong><small>Offline safety guides</small></button>
        </div>
      </section>

      <div className="quick-action-grid">
        {[
          {
            id: "consult",
            label: "Consult a doctor",
            note: "Verified clinicians",
            icon: <Stethoscope size={22} />,
          },
          {
            id: "chat",
            label: "Ask Health Guide",
            note: "Emergency-first multilingual chat",
            icon: <MessageCircle size={22} />,
          },
          {
            id: "symptoms",
            label: "Symptom insights",
            note: "Local guidance model",
            icon: <BrainCircuit size={22} />,
          },
          {
            id: "emergency",
            label: "Emergency & first aid",
            note: "Call 112 or open guides",
            icon: <Ambulance size={22} />,
            critical: true,
          },
          {
            id: "hospitals",
            label: "Nearby hospitals",
            note: "Open map discovery",
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
            title="Next appointment"
            action={
              <button className="text-button" onClick={() => onNavigate("consult")}>
                View all
              </button>
            }
          />
          {upcoming ? (
            <>
              <div className="appointment-card__doctor">
                <Avatar initials="AK" size="large" />
                <div>
                  <Badge tone="blue">Verified</Badge>
                  <h3>{upcoming.clinician}</h3>
                  <p>General Physician</p>
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
                <Button variant="secondary" onClick={() => onNavigate("consult")}>View details</Button>
                <Button icon={<Video size={17} />} onClick={() => onNavigate("consult")}>Join when ready</Button>
              </div>
            </>
          ) : (
            <p>No upcoming appointments.</p>
          )}
        </Card>

        <Card className="health-snapshot">
          <SectionHeading
            title="Health snapshot"
            subtitle="Every value includes its source"
            action={<Badge tone="amber">Demo profile</Badge>}
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
            title="Medicines today"
            action={
              <button className="text-button" onClick={() => onNavigate("medicines")}>
                Manage
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
                {completedDoses} of {medicines.length}
              </strong>
              <span>doses completed</span>
            </div>
          </div>
          <p className="muted">Always follow the prescribing clinician’s instructions.</p>
        </Card>

        <Card>
          <SectionHeading
            title="Recent records"
            action={
              <button className="text-button" onClick={() => onNavigate("records")}>
                View all
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
        title="Doctors available today"
        subtitle="Only fictional profiles are used in this prototype."
        action={
          <button className="text-button" onClick={() => onNavigate("consult")}>
            View all
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
              <Badge tone="green">Available</Badge>
              <h3>{doctor.name}</h3>
              <p>{doctor.specialty}</p>
              <div className="doctor-card__meta">
                <span>★ {doctor.rating}</span>
                <span>{doctor.experience}</span>
                <span>₹{doctor.fee}</span>
              </div>
              <Button variant="outline" onClick={() => onNavigate("consult")}>
                View profile
              </Button>
            </Card>
          ))}
      </div>
    </div>
  );
}

function ConsultationPage({
  appointments,
  setAppointments,
}: {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}) {
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
        title="Consult a verified doctor"
        subtitle="Search fictional clinicians, choose a slot and test the complete booking flow."
        action={<Badge tone="green">Identity and licence verified</Badge>}
      />

      {success ? (
        <Card tone="success" className="demo-event">
          <CheckCircle2 size={24} />
          <div>
            <strong>Appointment booked</strong>
            <p>The fictional appointment was added to this local demonstration.</p>
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
            placeholder="Search doctors or specialties"
          />
        </label>
        <select value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
          <option>All specialties</option>
          {[...new Set(doctors.map((doctor) => doctor.specialty))].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <Toggle
          checked={verifiedOnly}
          onChange={setVerifiedOnly}
          label="Verified clinicians only"
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
                  <p>{doctor.specialty}</p>
                </div>
                <div className="doctor-card__meta">
                  <span>★ {doctor.rating}</span>
                  <span>{doctor.experience}</span>
                  <span>{doctor.languages.join(", ")}</span>
                </div>
                <div className="doctor-list-card__footer">
                  <strong>₹{doctor.fee}</strong>
                  <Badge tone={doctor.available ? "green" : "neutral"}>
                    {doctor.available ? "Available today" : "Next slot tomorrow"}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedDoctor(doctor);
                  setBookingOpen(true);
                }}
              >
                View slots
              </Button>
            </Card>
          ))}
        </div>

        <Card className="appointment-history">
          <SectionHeading title="Your appointments" />
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
                    {appointment.status}
                  </Badge>
                </div>
                {appointment.status === "Upcoming" ? (
                  <button className="text-button" onClick={() => setCallOpen(true)}>
                    Open
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
            <span>Demo room only. A production call requires secure WebRTC tokens.</span>
          </Card>
          <Button icon={<Video size={18} />} onClick={() => { setCallOpen(false); setInCall(true); }}>Enter demo consultation</Button>
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

function CareHub({ onNavigate }: { onNavigate: (id: string) => void }) {
  const options = [
    {
      id: "chat",
      title: "Advanced Health Guide",
      note: "Multilingual patient chat with emergency-first safety rules",
      icon: <MessageCircle size={28} />,
      badge: "No API key",
    },
    {
      id: "symptoms",
      title: "Symptom insights",
      note: "Local pattern model with emergency red flags",
      icon: <BrainCircuit size={28} />,
      badge: "Local AI",
    },
    {
      id: "emergency",
      title: "Emergency and first aid",
      note: "Call 112, intentional SOS and offline guides",
      icon: <Ambulance size={28} />,
      badge: "Offline ready",
      critical: true,
    },
    {
      id: "hospitals",
      title: "Nearby hospitals",
      note: "OpenStreetMap discovery and verified ICU status",
      icon: <Hospital size={28} />,
      badge: "Keyless maps",
    },
    {
      id: "medicines",
      title: "Medicine plan",
      note: "Prescribed schedules, reminders and refill requests",
      icon: <Pill size={28} />,
      badge: "As prescribed",
    },
    {
      id: "labs",
      title: "Laboratory tests",
      note: "Book fictional tests and home collection",
      icon: <TestTube2 size={28} />,
      badge: "Demo booking",
    },
    {
      id: "profile",
      title: "Family and Medical ID",
      note: "Dependents, allergies, emergency access and consent",
      icon: <Users size={28} />,
      badge: "Private",
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
  const [filter, setFilter] = useState("All");
  const inputRef = useRef<HTMLInputElement>(null);
  const visible = records.filter((record) => filter === "All" || record.type === filter);

  const upload = (file: File | undefined) => {
    if (!file) return;
    setRecords((current) => [
      {
        id: `rec-${Date.now()}`,
        type: "Upload",
        title: file.name,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        status: "Local demo upload",
      },
      ...current,
    ]);
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
          Prototype uploads are represented by filename only. Production files require
          encryption, malware scanning, access logs and explicit consent.
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
                <Button variant="ghost" onClick={() => window.alert("The selected demo record is ready to view.")}>View</Button>
                <Button variant="ghost" icon={<Download size={16} />} onClick={() => window.alert("A privacy-safe demo export was prepared.")}>
                  Export
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>
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
  const [reminders, setReminders] = useState(true);
  const markTaken = (id: string) =>
    setMedicines((current) =>
      current.map((dose) => (dose.id === id ? { ...dose, state: "taken" } : dose)),
    );
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
          <Button variant="outline" onClick={() => window.alert("A demo refill request was sent to the prescribing clinician for review.")}>Request refill</Button>
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

function LabTestsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const total = labTests
    .filter((test) => selected.includes(test.id))
    .reduce((sum, test) => sum + test.price, 0);
  return (
    <div className="page-stack">
      <SectionHeading
        title="Laboratory tests"
        subtitle="Fictional prices and booking flow for UI validation."
        action={<Badge tone="amber">Demo partner catalogue</Badge>}
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
            <textarea defaultValue="Anna Nagar, Chennai — fictional demonstration address" />
          </label>
          <label>
            Date and time
            <select defaultValue="28 Jul • 8:00–9:00 AM">
              <option>28 Jul • 8:00–9:00 AM</option>
              <option>28 Jul • 10:00–11:00 AM</option>
              <option>29 Jul • 8:00–9:00 AM</option>
            </select>
          </label>
          <Card className="price-summary">
            <span>Demo total</span>
            <strong>₹{total}</strong>
            <small>No payment will be collected.</small>
          </Card>
          <Button
            onClick={() => {
              setBookingOpen(false);
              window.alert("Demo laboratory booking created.");
            }}
          >
            Confirm demo booking
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function PatientProfile({ displayName }: { displayName: string }) {
  const primaryName = displayName.trim() || "CareBridge Patient";
  const [family, setFamily] = useState(primaryName.split(/\s+/)[0]);
  const [emergencyAccess, setEmergencyAccess] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const primaryFirstName = primaryName.split(/\s+/)[0];
  const primaryInitials = primaryName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CB";

  useEffect(() => {
    document.documentElement.dataset.largeText = largeText ? "true" : "false";
    return () => { delete document.documentElement.dataset.largeText; };
  }, [largeText]);

  useEffect(() => {
    document.documentElement.dataset.highContrast = highContrast ? "true" : "false";
    return () => { delete document.documentElement.dataset.highContrast; };
  }, [highContrast]);

  return (
    <div className="page-stack">
      <SectionHeading
        title="Family, Medical ID and settings"
        subtitle="Identity, consent, accessibility, payments and support."
        action={<Button variant="outline" onClick={() => window.alert("Profile editing is enabled in the prototype. Production changes require re-verification of protected fields.")}>Edit profile</Button>}
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
            <Avatar initials={initials} />
            <strong>{name}</strong>
            <small>{relation}</small>
          </button>
        ))}
        <button onClick={() => window.alert("A protected dependent-profile form would open here. Identity and consent verification are required before saving.")}>
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
            <Avatar initials={family === primaryFirstName ? primaryInitials : family === "Amma" ? "AS" : "KS"} size="large" />
            <div>
              <strong>{family === primaryFirstName ? primaryName : `${family} Sharma`}</strong>
              <small>CB-4827-1906</small>
            </div>
            <span className="qr-placeholder" aria-label="Demo QR code">
              ▦
            </span>
          </div>
          <div className="medical-id-card__facts">
            <span>
              Blood group <strong>O+</strong>
            </span>
            <span>
              Allergy <strong>Penicillin</strong>
            </span>
          </div>
          <footer>
            <Toggle
              checked={emergencyAccess}
              onChange={setEmergencyAccess}
              label="Lock-screen emergency access"
            />
          </footer>
        </Card>

        <Card>
          <SectionHeading title="Profile details" />
          <dl className="facts-list">
            <div>
              <dt>Full name</dt>
              <dd>{family === primaryFirstName ? primaryName : `${family} Sharma`}</dd>
            </div>
            <div>
              <dt>Date of birth</dt>
              <dd>12 May 2002 • Demo</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>+91 98765 43210 • Verified</dd>
            </div>
            <div>
              <dt>Emergency contact</dt>
              <dd>Arun Sharma • +91 98765 43210</dd>
            </div>
            <div>
              <dt>Primary doctor</dt>
              <dd>Dr. Ananya Kumar</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card tone="blue" className="supabase-status-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Database size={22} />
          <h3 style={{ margin: 0 }}>Supabase Cloud Database Connected</h3>
          <Badge tone="green">Active connection</Badge>
        </div>
        <p style={{ margin: "0.25rem 0 0.5rem 0", fontSize: "0.875rem", opacity: 0.9 }}>
          User profiles, appointments, records, and preferences are synchronized with your Supabase database:
        </p>
        <code style={{ fontSize: "0.825rem", padding: "0.35rem 0.6rem", borderRadius: "6px", background: "rgba(0,0,0,0.06)", display: "inline-block", fontWeight: 600 }}>
          {SUPABASE_URL}
        </code>
      </Card>

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
            <Toggle
              checked={highContrast}
              onChange={setHighContrast}
              label="High contrast"
            />
          </div>
        </Card>
        <Card>
          <h3>Privacy and consent</h3>
          <div className="compact-list">
            <button onClick={() => window.alert("Consent controls opened. Two fictional sharing permissions are active.")}>
              <ShieldCheck size={18} />
              <div>
                <strong>Sharing permissions</strong>
                <small>2 active consents</small>
              </div>
              <ChevronRight size={17} />
            </button>
            <button onClick={() => window.alert("Access history opened. This prototype contains fictional audit entries only.")}>
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
            <button onClick={() => window.alert("No real payment method is stored. Connect a regulated payment provider for production.")}>
              <CreditCard size={18} />
              <div>
                <strong>Demo payment method</strong>
                <small>No real card stored</small>
              </div>
              <ChevronRight size={17} />
            </button>
            <button onClick={() => window.alert("Two fictional invoices are available for demo export.")}>
              <Download size={18} />
              <div>
                <strong>Invoices</strong>
                <small>2 fictional documents</small>
              </div>
              <ChevronRight size={17} />
            </button>
          </div>
        </Card>
        <Card>
          <h3>Help and grievance</h3>
          <div className="compact-list">
            <button onClick={() => window.alert("A demo support ticket was created locally.")}>
              <MessageCircle size={18} />
              <div>
                <strong>Contact support</strong>
                <small>Create a demo support ticket</small>
              </div>
              <ChevronRight size={17} />
            </button>
            <button onClick={() => window.alert("A demo safety concern was submitted to the operations review queue.")}>
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
          appointments={appointments}
          setAppointments={updateAppointments}
        />
      );
    case "care":
      return <CareHub onNavigate={onNavigate} />;
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
      return <LabTestsPage />;
    case "profile":
      return <PatientProfile displayName={displayName} />;
    default:
      return (
        <PatientHome
          onNavigate={onNavigate}
          appointments={appointments}
          medicines={medicines}
          displayName={displayName}
        />
      );
  }
}

