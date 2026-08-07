import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileHeart,
  FileText,
  FlaskConical,
  HeartPulse,
  MessageCircle,
  Paperclip,
  Pill,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  Star,
  Stethoscope,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { initialAppointments, initialRecords } from "../data/demo";
import type { Appointment } from "../types";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Metric,
  Modal,
  SectionHeading,
  Toggle,
} from "../components/ui";
import { useToast } from "../components/Toast";
import { DocumentExporter, PrescriptionDocData } from "../components/DocumentExporter";
import { recordAuditEvent } from "../services/audit";
import { saveUserDataToSupabase, getUserDataFromSupabase } from "../lib/supabase";
import { VideoConsultation } from "../components/VideoConsultation";
import { getTranslator } from "../i18n";
import type { LanguageCode } from "../types";

interface DoctorWorkspaceProps {
  active: string;
  language: LanguageCode;
  onNavigate: (id: string) => void;
}

const patientRows = [
  {
    id: "pt-riya",
    name: "Riya Sharma",
    initials: "RS",
    age: "24 years",
    sex: "Female",
    blood: "O+",
    concern: "Fever and sore throat",
    consent: true,
    allergy: "Penicillin",
  },
  {
    id: "pt-arjun",
    name: "Arjun Mehta",
    initials: "AM",
    age: "38 years",
    sex: "Male",
    blood: "B+",
    concern: "Routine follow-up",
    consent: true,
    allergy: "None recorded",
  },
  {
    id: "pt-neha",
    name: "Neha Iyer",
    initials: "NI",
    age: "31 years",
    sex: "Female",
    blood: "A+",
    concern: "Review laboratory report",
    consent: true,
    allergy: "Sulfa drugs",
  },
];

function TodayDashboard({
  language,
  online,
  setOnline,
  onNavigate,
}: {
  language: LanguageCode;
  online: boolean;
  setOnline: (value: boolean) => void;
  onNavigate: (id: string) => void;
}) {
  const t = useMemo(() => getTranslator(language), [language]);
  const [callOpen, setCallOpen] = useState(false);
  const [inCall, setInCall] = useState(false);
  const queue = [
    { time: "10:30 AM", patient: "Riya Sharma", type: "Video", reason: "Fever and sore throat" },
    { time: "11:15 AM", patient: "Arjun Mehta", type: "Follow-up", reason: "Review care plan" },
    { time: "12:00 PM", patient: "Neha Iyer", type: "Video", reason: "Lab report review" },
    { time: "4:30 PM", patient: "Vikram Singh", type: "Video", reason: "New concern" },
  ];

  return (
    <div className="page-stack">
      <section className="doctor-hero">
        <div className="doctor-hero__identity">
          <Avatar initials="AK" size="large" tone="teal" />
          <div>
            <p>{t("greeting")}</p>
            <h1>Dr. Ananya Kumar</h1>
            <span>
              <ShieldCheck size={16} /> {t("verified")} {t("generalPhysician")}
            </span>
          </div>
        </div>
        <Toggle checked={online} onChange={setOnline} label={online ? t("available") : t("offline")} />
      </section>

      <div className="metric-grid">
        <Metric label={t("yourAppointments")} value="8" icon={<Calendar size={21} />} />
        <Metric
          label={t("records")}
          value="2"
          icon={<FileText size={21} />}
          tone="amber"
        />
        <Metric
          label={t("today")}
          value="1"
          icon={<Activity size={21} />}
          tone="green"
        />
        <Metric label={t("verified")} value="4.9" icon={<Star size={21} />} tone="green" />
      </div>

      <div className="doctor-dashboard-grid">
        <Card className="next-consultation">
          <Badge tone="blue">{t("nextAppointment")}</Badge>
          <div className="next-consultation__patient">
            <Avatar initials="RS" size="large" />
            <div>
              <h2>Riya Sharma</h2>
              <p>10:30 AM • Video consultation</p>
              <span>Fever and sore throat</span>
            </div>
          </div>
          <div className="consent-line">
            <ShieldCheck size={17} />
            <span>{t("protectedSessionActive")}</span>
          </div>
          <Button icon={<Video size={18} />} onClick={() => setCallOpen(true)}>
            {t("open")}
          </Button>
        </Card>

        <Card>
          <SectionHeading
            title={t("today")}
            action={
              <button className="text-button" onClick={() => onNavigate("patients")}>
                {t("viewAll")}
              </button>
            }
          />
          <div className="schedule-list">
            {queue.map((item, index) => (
              <article key={`${item.time}-${item.patient}`} className={index === 0 ? "is-next" : ""}>
                <span>{item.time}</span>
                <div>
                  <strong>{item.patient}</strong>
                  <small>
                    {item.type} • {item.reason}
                  </small>
                </div>
                {item.type === "Video" ? <Video size={17} /> : <MessageCircle size={17} />}
              </article>
            ))}
          </div>
        </Card>
      </div>

      <SectionHeading title="Quick actions" />
      <div className="quick-action-grid">
        {[
          ["patients", "Patient queue", <Users size={21} />, "Review permitted summaries"],
          ["notes", "Clinical note", <FileHeart size={21} />, "Structured and autosaved"],
          ["prescriptions", "Prescription", <Pill size={21} />, "Clinician-only builder"],
          ["messages", "Secure messages", <MessageCircle size={21} />, "Follow-up conversations"],
        ].map(([id, label, icon, note]) => (
          <button key={id as string} className="quick-action" onClick={() => onNavigate(id as string)}>
            <span>{icon}</span>
            <div>
              <strong>{label}</strong>
              <small>{note}</small>
            </div>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>

      <Modal open={callOpen} title="Secure consultation lobby" onClose={() => setCallOpen(false)} wide>
        <div className="video-room">
          <div className="video-room__stage">
            <span className="video-room__avatar">RS</span>
            <h2>Riya Sharma</h2>
            <p>10:30 AM • Video consultation</p>
            <Badge tone="green">Encrypted WebRTC Room</Badge>
          </div>
          <aside>
            <h3>Pre-consultation summary</h3>
            <dl className="facts-list">
              <div>
                <dt>Concern</dt>
                <dd>Fever and sore throat</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>Since yesterday</dd>
              </div>
              <div>
                <dt>Allergy</dt>
                <dd className="critical-text">Penicillin</dd>
              </div>
              <div>
                <dt>Shared records</dt>
                <dd>3 documents</dd>
              </div>
            </dl>
            <Card tone="blue" className="inline-alert">
              <ShieldCheck size={18} />
              <span>WebRTC encrypted audio/video stream ready for consultation.</span>
            </Card>
            <div className="button-row">
              <Button icon={<Video size={18} />} onClick={() => { setCallOpen(false); setInCall(true); }}>
                Launch Live Consultation
              </Button>
              <Button variant="secondary" onClick={() => setCallOpen(false)}>Close Lobby</Button>
            </div>
          </aside>
        </div>
      </Modal>

      <VideoConsultation
        open={inCall}
        doctorName="Riya Sharma (Patient)"
        specialty="Telehealth Consultation"
        onClose={() => setInCall(false)}
      />
    </div>
  );
}

function PatientQueue({ onOpenNotes, onNavigate }: { onOpenNotes: () => void; onNavigate?: (id: string) => void }) {
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState("pt-riya");
  const [query, setQuery] = useState("");
  const selected = patientRows.find((patient) => patient.id === selectedId) ?? patientRows[0];
  const visible = useMemo(
    () =>
      patientRows.filter((patient) =>
        patient.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  return (
    <div className="page-stack">
      <SectionHeading
        title="Patient queue"
        subtitle="Only information shared through active consent is visible."
        action={<Badge tone="green">Consent-scoped access</Badge>}
      />
      <div className="patient-queue-layout">
        <Card className="patient-directory">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search today’s patients"
            />
          </label>
          <div className="patient-directory__list">
            {visible.map((patient) => (
              <button
                key={patient.id}
                className={selectedId === patient.id ? "is-active" : ""}
                onClick={() => setSelectedId(patient.id)}
              >
                <Avatar initials={patient.initials} />
                <div>
                  <strong>{patient.name}</strong>
                  <small>{patient.concern}</small>
                </div>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </Card>

        <div className="page-stack">
          <Card className="patient-summary-card">
            <div className="patient-summary-card__header">
              <Avatar initials={selected.initials} size="large" />
              <div>
                <h2>{selected.name}</h2>
                <p>
                  {selected.age} • {selected.sex} • {selected.blood}
                </p>
              </div>
              <Badge tone="green">
                <ShieldCheck size={14} /> Consent active
              </Badge>
            </div>
            {selected.allergy !== "None recorded" ? (
              <div className="allergy-alert">
                <span>!</span>
                <strong>{selected.allergy} allergy</strong>
              </div>
            ) : null}
            <div className="patient-fact-grid">
              <div>
                <span>Chief concern</span>
                <strong>{selected.concern}</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>Since yesterday</strong>
              </div>
              <div>
                <span>Last consultation</span>
                <strong>22 Jul 2026</strong>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeading
              title="Recent patient-entered values"
              action={<Badge tone="amber">Patient entered</Badge>}
            />
            <div className="metric-grid metric-grid--three">
              <Metric label="Heart rate" value="76 bpm" icon={<HeartPulse size={19} />} />
              <Metric label="SpO₂" value="98%" icon={<Activity size={19} />} />
              <Metric label="Temperature" value="38.1 °C" icon={<Activity size={19} />} tone="amber" />
            </div>
          </Card>

          <Card>
            <SectionHeading title="Shared records" />
            <div className="compact-list">
              {initialRecords.slice(0, 3).map((record) => (
                <button key={record.id} onClick={() => showToast("Record Preview", `Opened shared record: ${record.title}`, "info")}>
                  <FileText size={18} />
                  <div>
                    <strong>{record.title}</strong>
                    <small>{record.date}</small>
                  </div>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          </Card>
          <div className="button-row">
            <Button variant="secondary" icon={<MessageCircle size={18} />} onClick={() => onNavigate?.("messages")}>
              Message patient
            </Button>
            <Button icon={<FileHeart size={18} />} onClick={onOpenNotes}>
              Open consultation note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClinicalNotes() {
  const { showToast } = useToast();
  const [saved, setSaved] = useState(true);
  const [symptoms, setSymptoms] = useState(
    "Patient reports mild fever and persistent cough for 2 days.",
  );
  const [assessment, setAssessment] = useState(
    "Mild upper respiratory tract infection. Stable vitals.",
  );
  const [instructions, setInstructions] = useState(
    "Stay hydrated, complete prescribed medication, and rest.",
  );
  const [followUp, setFollowUp] = useState("In 3 days");

  useEffect(() => {
    getUserDataFromSupabase<any>("doctor", "clinical_note", null).then((cached) => {
      if (cached) {
        if (cached.symptoms) setSymptoms(cached.symptoms);
        if (cached.assessment) setAssessment(cached.assessment);
        if (cached.instructions) setInstructions(cached.instructions);
        if (cached.followUp) setFollowUp(cached.followUp);
      }
    });
  }, []);

  const update = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setSaved(false);
  };

  const appendItem = (setter: React.Dispatch<React.SetStateAction<string>>, extra: string) => {
    setter((prev) => prev + "\n" + extra);
    setSaved(false);
  };

  const handleSaveDraft = async () => {
    setSaved(true);
    await saveUserDataToSupabase("doctor", "clinical_note", {
      symptoms,
      assessment,
      instructions,
      followUp,
      updatedAt: new Date().toISOString(),
    });
    showToast("Clinical Note Saved", "Consultation draft saved to persistent record.", "success");
    recordAuditEvent("Consultation Note Saved", "Dr. Ananya Kumar", "clinical", "Updated note for Riya Sharma");
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Consultation note"
        subtitle="Structured clinician-authored documentation."
        action={<Badge tone={saved ? "green" : "amber"}>{saved ? "Saved" : "Unsaved"}</Badge>}
      />
      <Card tone="blue" className="selected-doctor">
        <Avatar initials="RS" size="large" />
        <div>
          <h3>Riya Sharma</h3>
          <p>24 years • Female • O+</p>
          <Badge tone="red">Penicillin allergy</Badge>
        </div>
        <Badge tone="green">Consent active</Badge>
      </Card>
      <Card className="clinical-note-form">
        <label>
          Symptoms and history
          <textarea value={symptoms} onChange={(event) => update(setSymptoms, event.target.value)} />
        </label>
        <label>
          Clinical assessment
          <textarea
            value={assessment}
            onChange={(event) => update(setAssessment, event.target.value)}
          />
        </label>
        <label>
          Care instructions
          <textarea
            value={instructions}
            onChange={(event) => update(setInstructions, event.target.value)}
          />
        </label>
        <div className="clinical-actions">
          <button
            onClick={() => {
              appendItem(setSymptoms, "- Prescribed Paracetamol 650mg TDS.");
              showToast("Medicine Entry Added", "Added item to draft clinical notes.", "info");
            }}
          >
            <Pill size={20} /> Add medicine
          </button>
          <button
            onClick={() => {
              appendItem(setAssessment, "- Ordered Complete Blood Count (CBC) test.");
              showToast("Lab Test Order", "Added diagnostic order entry to draft notes.", "info");
            }}
          >
            <FlaskConical size={20} /> Add lab test
          </button>
          <button
            onClick={() => {
              appendItem(setInstructions, "- Attached chest X-ray guidelines.");
              showToast("Attachment Upload", "Attachment entry added to notes.", "info");
            }}
          >
            <Paperclip size={20} /> Add attachment
          </button>
        </div>
        <label>
          Follow-up
          <select value={followUp} onChange={(event) => setFollowUp(event.target.value)}>
            <option>In 3 days</option>
            <option>In 1 week</option>
            <option>In 2 weeks</option>
            <option>As needed</option>
          </select>
        </label>
        <Card tone="blue" className="inline-alert">
          <ShieldCheck size={18} />
          <span>Only verified clinicians may finalise and sign this note.</span>
        </Card>
        <div className="button-row button-row--end">
          <Button variant="secondary" onClick={() => showToast("Note Preview", "Consultation draft preview displayed.", "info")}>Preview</Button>
          <Button
            icon={<Save size={18} />}
            onClick={handleSaveDraft}
          >
            Save draft
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PrescriptionBuilder() {
  const { showToast } = useToast();
  const [medicine, setMedicine] = useState("");
  const [strength, setStrength] = useState("");
  const [instructions, setInstructions] = useState("");
  const [medicines, setMedicines] = useState<
    Array<{ medicine: string; strength: string; instructions: string }>
  >([
    { medicine: "Amoxicillin", strength: "500 mg", instructions: "1 capsule twice daily after meals for 5 days" },
  ]);
  const [confirmed, setConfirmed] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const add = () => {
    if (!medicine.trim() || !instructions.trim()) return;
    setMedicines((current) => [...current, { medicine, strength, instructions }]);
    setMedicine("");
    setStrength("");
    setInstructions("");
    showToast("Prescription Item Added", `${medicine} added to draft.`, "success");
  };

  const handleSignAndShare = async () => {
    setExportOpen(true);
    await saveUserDataToSupabase("doctor", "signed_prescription", {
      patient: "Riya Sharma",
      medicines,
      signedAt: new Date().toISOString(),
    });
    showToast("Prescription Signed", "Prescription digitally signed and shared with patient.", "success");
    recordAuditEvent("Prescription Signed & Issued", "Dr. Ananya Kumar", "clinical", `Prescribed ${medicines.length} medications to Riya Sharma`);
  };

  const docData: PrescriptionDocData = {
    prescriptionId: `RX-${Date.now().toString().slice(-6)}`,
    clinicianName: "Dr. Ananya Kumar",
    clinicianReg: "TNMC-DEMO-28471",
    patientName: "Riya Sharma",
    patientAgeSex: "24 yrs / Female",
    patientAllergies: "Penicillin",
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    medicines,
    clinicalNotes: "Complete 5-day course as directed. Drink plenty of warm fluids.",
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Digital prescription"
        subtitle="Clinician-only demonstration builder with explicit review."
        action={<Badge tone="green">Licence verified</Badge>}
      />
      <Card tone="critical" className="inline-alert">
        <ShieldCheck size={19} />
        <span>
          The application never suggests a medicine or dosage. The verified clinician must
          enter, review and sign every item.
        </span>
      </Card>
      <div className="two-column-grid">
        <Card className="prescription-form">
          <h3>Add prescription item</h3>
          <label>
            Medicine name
            <input value={medicine} onChange={(event) => setMedicine(event.target.value)} placeholder="e.g. Paracetamol" />
          </label>
          <label>
            Strength/form
            <input
              value={strength}
              onChange={(event) => setStrength(event.target.value)}
              placeholder="e.g. 650 mg Tablet"
            />
          </label>
          <label>
            Instructions
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Clinician-authored instructions"
            />
          </label>
          <Button icon={<Plus size={18} />} onClick={add}>
            Add item
          </Button>
        </Card>

        <Card className="prescription-preview">
          <span className="prescription-preview__brand">CAREBRIDGE ONE</span>
          <h2>Prescription draft</h2>
          <div className="selected-doctor">
            <Avatar initials="RS" />
            <div>
              <strong>Riya Sharma</strong>
              <p>24 years • Penicillin allergy</p>
            </div>
          </div>
          {medicines.length === 0 ? (
            <div className="empty-prescription">
              <Pill size={32} />
              <p>No medicines added.</p>
            </div>
          ) : (
            <ol className="prescription-items">
              {medicines.map((item, index) => (
                <li key={`${item.medicine}-${index}`}>
                  <strong>
                    {item.medicine} {item.strength}
                  </strong>
                  <span>{item.instructions}</span>
                </li>
              ))}
            </ol>
          )}
          <label className="confirm-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            I reviewed the patient, allergies and every prescription item.
          </label>
          <Button
            icon={<Send size={18} />}
            disabled={!confirmed || medicines.length === 0}
            onClick={handleSignAndShare}
          >
            Sign and share
          </Button>
        </Card>
      </div>

      {exportOpen ? (
        <DocumentExporter
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          title="Digital Prescription Summary"
          docData={docData}
        />
      ) : null}
    </div>
  );
}

function DoctorMessages() {
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState("pt-riya");
  const [message, setMessage] = useState("");
  const [sentMap, setSentMap] = useState<Record<string, string[]>>({});

  const activePatient = patientRows.find((pt) => pt.id === selectedId) || patientRows[0];
  const activeSent = sentMap[selectedId] || [];

  return (
    <div className="page-stack">
      <SectionHeading
        title="Secure messages"
        subtitle="Follow-up conversations remain within the care thread."
      />
      <div className="message-layout">
        <Card className="thread-list">
          {patientRows.map((patient) => (
            <button
              key={patient.id}
              className={selectedId === patient.id ? "is-active" : ""}
              onClick={() => setSelectedId(patient.id)}
            >
              <Avatar initials={patient.initials} />
              <div>
                <strong>{patient.name}</strong>
                <small>{patient.concern}</small>
              </div>
              {patient.id === "pt-riya" ? <Badge tone="blue">1</Badge> : null}
            </button>
          ))}
        </Card>
        <Card className="message-thread">
          <header>
            <Avatar initials={activePatient.initials} />
            <div>
              <strong>{activePatient.name}</strong>
              <small>Follow-up thread • Consent active</small>
            </div>
          </header>
          <div className="message-thread__body">
            <div className="chat-bubble">
              <p>Hello Dr. Ananya, regarding my concern: {activePatient.concern}.</p>
              <small>9:18 AM</small>
            </div>
            <div className="chat-bubble chat-bubble--doctor">
              <p>I have reviewed your details ({activePatient.age}, {activePatient.sex}). We will monitor your symptoms closely.</p>
              <small>9:24 AM</small>
            </div>
            {activeSent.map((text, index) => (
              <div key={`${text}-${index}`} className="chat-bubble chat-bubble--doctor">
                <p>{text}</p>
                <small>Now</small>
              </div>
            ))}
          </div>
          <footer>
            <button className="icon-button" onClick={() => showToast("Attachment Picker", "Attachment selector opened.", "info")}>
              <Paperclip size={18} />
            </button>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={`Write a follow-up message to ${activePatient.name}`}
            />
            <button
              className="send-button"
              onClick={() => {
                if (!message.trim()) return;
                setSentMap((prev) => ({
                  ...prev,
                  [selectedId]: [...(prev[selectedId] || []), message.trim()],
                }));
                setMessage("");
                showToast("Message Sent", `Message delivered to ${activePatient.name}.`, "success");
              }}
            >
              <Send size={18} />
            </button>
          </footer>
        </Card>
      </div>
    </div>
  );
}

function DoctorProfile() {
  const { showToast } = useToast();
  const [mfa, setMfa] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [profile, setProfile] = useState({
    registration: "TNMC-DEMO-28471",
    languages: "English, Tamil, Hindi",
    fee: "499",
  });
  const [draft, setDraft] = useState(profile);

  const handleSave = () => {
    setProfile(draft);
    setEditOpen(false);
    showToast("Profile Updated", "Doctor credentials and fee structure updated.", "success");
    recordAuditEvent("Doctor Profile Updated", "Dr. Ananya Kumar", "clinical", "Updated professional registration & fee");
  };

  return (
    <div className="page-stack">
      <SectionHeading title="Professional profile and reports" />
      <div className="profile-grid">
        <Card className="doctor-profile-card">
          <Avatar initials="AK" size="large" tone="teal" />
          <h2>Dr. Ananya Kumar</h2>
          <p>General Physician • 12 years</p>
          <Badge tone="green">
            <ShieldCheck size={14} /> Licence verified
          </Badge>
          <dl className="facts-list">
            <div>
              <dt>Registration</dt>
              <dd>{profile.registration}</dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>{profile.languages}</dd>
            </div>
            <div>
              <dt>Video fee</dt>
              <dd>₹{profile.fee}</dd>
            </div>
          </dl>
          <Button variant="outline" onClick={() => { setDraft(profile); setEditOpen(true); }}>Edit professional profile</Button>
        </Card>

        <Modal open={editOpen} title="Edit professional profile" onClose={() => setEditOpen(false)}>
          <div className="page-stack">
            <label>
              Medical Registration Number
              <input
                value={draft.registration}
                onChange={(e) => setDraft((p) => ({ ...p, registration: e.target.value }))}
              />
            </label>
            <label>
              Languages Spoken
              <input
                value={draft.languages}
                onChange={(e) => setDraft((p) => ({ ...p, languages: e.target.value }))}
              />
            </label>
            <label>
              Consultation Fee (₹)
              <input
                type="number"
                value={draft.fee}
                onChange={(e) => setDraft((p) => ({ ...p, fee: e.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save changes</Button>
            </div>
          </div>
        </Modal>
        <div className="page-stack">
          <div className="metric-grid metric-grid--three">
            <Metric label="Consultations" value="248" icon={<Stethoscope size={20} />} />
            <Metric label="Patient rating" value="4.9" icon={<Star size={20} />} tone="green" />
            <Metric label="Demo earnings" value="₹48,400" icon={<CircleDollarSign size={20} />} />
          </div>
          <Card>
            <h3>Security and practice settings</h3>
            <div className="setting-list">
              <Toggle checked={mfa} onChange={setMfa} label="Multi-factor authentication" />
              <Toggle checked={loginAlerts} onChange={setLoginAlerts} label="Login alerts" />
              <Toggle checked={autoAccept} onChange={setAutoAccept} label="Accept new patients automatically" />
            </div>
          </Card>
          <Card>
            <h3>Invoices and performance</h3>
            <div className="compact-list">
              <button onClick={() => showToast("Performance Analytics", "Monthly clinical metrics dashboard opened.", "info")}>
                <BarChart3 size={18} />
                <div>
                  <strong>Monthly performance</strong>
                  <small>Fictional analytics</small>
                </div>
                <ChevronRight size={17} />
              </button>
              <button onClick={() => showToast("Settlement Reports", "Clinician financial settlement statement prepared.", "info")}>
                <FileText size={18} />
                <div>
                  <strong>Settlement reports</strong>
                  <small>Demo invoices only</small>
                </div>
                <ChevronRight size={17} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DoctorWorkspace({ active, language, onNavigate }: DoctorWorkspaceProps) {
  const [online, setOnline] = useState(true);
  switch (active) {
    case "patients":
      return <PatientQueue onOpenNotes={() => onNavigate("notes")} onNavigate={onNavigate} />;
    case "notes":
      return <ClinicalNotes />;
    case "prescriptions":
      return <PrescriptionBuilder />;
    case "messages":
      return <DoctorMessages />;
    case "profile":
      return <DoctorProfile />;
    default:
      return <TodayDashboard language={language} online={online} setOnline={setOnline} onNavigate={onNavigate} />;
  }
}
