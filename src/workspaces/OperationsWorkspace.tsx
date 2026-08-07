import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  BarChart3,
  BedDouble,
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileCheck2,
  FileHeart,
  FileText,
  Hospital,
  MapPin,
  MessageSquareWarning,
  MoreHorizontal,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Stethoscope,
  UserCheck,
  UserRoundCog,
  Users,
  Video,
  X,
} from "lucide-react";
import { demoHospitals } from "../services/hospitals";
import { emergencyEvents } from "../data/demo";
import type { EmergencyEvent, Hospital as HospitalType } from "../types";
import { useToast } from "../components/Toast";
import { getAuditEvents, recordAuditEvent, AuditEvent } from "../services/audit";
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

interface OperationsWorkspaceProps {
  active: string;
  onNavigate: (id: string) => void;
}

type VerificationStatus = "Pending" | "Approved" | "Rejected";

interface VerificationRow {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  registration: string;
  submitted: string;
  status: VerificationStatus;
}

const initialVerificationRows: VerificationRow[] = [
  {
    id: "verify-1",
    name: "Dr. Arjun Mehta",
    initials: "AM",
    specialty: "Cardiology",
    registration: "TNMC-DEMO-31842",
    submitted: "26 Jul 2026",
    status: "Pending",
  },
  {
    id: "verify-2",
    name: "Dr. Neha Iyer",
    initials: "NI",
    specialty: "Dermatology",
    registration: "TNMC-DEMO-22815",
    submitted: "26 Jul 2026",
    status: "Pending",
  },
  {
    id: "verify-3",
    name: "Dr. Vikram Singh",
    initials: "VS",
    specialty: "Orthopaedics",
    registration: "TNMC-DEMO-44190",
    submitted: "25 Jul 2026",
    status: "Pending",
  },
];

function OperationsOverview({ onNavigate }: { onNavigate: (id: string) => void }) {
  const chartValues = [348, 292, 354, 326, 412, 361, 275];
  return (
    <div className="page-stack">
      <SectionHeading
        title="Operations overview"
        subtitle="Privacy-safe metrics for the CareBridge One platform."
        action={<Badge tone="green">All platform services operational</Badge>}
      />
      <div className="metric-grid">
        <Metric
          label="Consultations today"
          value="348"
          note="+12% vs yesterday"
          icon={<Stethoscope size={21} />}
          tone="green"
        />
        <Metric label="Doctors online" value="126" icon={<UserCheck size={21} />} />
        <Metric
          label="Pending verifications"
          value="9"
          icon={<FileCheck2 size={21} />}
          tone="amber"
        />
        <Metric
          label="Active SOS events"
          value="2"
          icon={<BellRing size={21} />}
          tone="red"
        />
      </div>

      <div className="operations-dashboard-grid">
        <Card className="analytics-card">
          <SectionHeading
            title="Consultations this week"
            action={<Badge tone="blue">Analytics active</Badge>}
          />
          <div className="bar-chart">
            {chartValues.map((value, index) => (
              <div key={`${value}-${index}`}>
                <span style={{ height: `${(value / Math.max(...chartValues)) * 100}%` }} />
                <small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card className="appointment-donut-card">
          <SectionHeading title="Appointment status" />
          <div className="donut-row">
            <span className="donut" />
            <div>
              <span>
                <i className="dot dot--blue" /> Completed <strong>72%</strong>
              </span>
              <span>
                <i className="dot dot--lightblue" /> Upcoming <strong>21%</strong>
              </span>
              <span>
                <i className="dot dot--gray" /> Cancelled <strong>7%</strong>
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="three-column-grid">
        <Card className="operations-action-card" tone="critical">
          <Ambulance size={27} />
          <Badge tone="red">2 active</Badge>
          <h3>Emergency response monitor</h3>
          <p>Review confirmed events, assignments and responder acknowledgements.</p>
          <Button variant="danger" onClick={() => onNavigate("emergencies")}>
            Open live monitor
          </Button>
        </Card>
        <Card className="operations-action-card">
          <UserCheck size={27} />
          <Badge tone="amber">9 pending</Badge>
          <h3>Doctor verification</h3>
          <p>Review credentials with dual-control approval and audit evidence.</p>
          <Button variant="outline" onClick={() => onNavigate("doctors")}>
            Review queue
          </Button>
        </Card>
        <Card className="operations-action-card">
          <BedDouble size={27} />
          <Badge tone="blue">Facilities directory</Badge>
          <h3>Hospital availability</h3>
          <p>Update ICU and emergency status with source and expiry information.</p>
          <Button variant="outline" onClick={() => onNavigate("hospitals")}>
            Manage availability
          </Button>
        </Card>
      </div>

      <div className="two-column-grid">
        <Card>
          <SectionHeading title="Platform health" />
          <div className="service-health-list">
            {[
              ["Video service", <Video size={17} />],
              ["Notifications", <BellRing size={17} />],
              ["Local symptom model", <Activity size={17} />],
              ["Demo payments", <CircleDollarSign size={17} />],
              ["Audit service", <ShieldCheck size={17} />],
            ].map(([label, icon]) => (
              <div key={label as string}>
                {icon}
                <span>{label}</span>
                <Badge tone="green">Operational</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeading title="Recent activity stream" />
          <div className="activity-list">
            {[
              ["Doctor profile approved", "10:24 AM", "Credential workflow"],
              ["First-aid article updated", "9:58 AM", "Content version 2.4"],
              ["Appointment surge detected", "9:30 AM", "3 locations"],
              ["Verification policy updated", "9:12 AM", "Licence & ID checks"],
            ].map(([title, time, note]) => (
              <article key={title}>
                <CheckCircle2 size={17} />
                <div>
                  <strong>{title}</strong>
                  <small>{note}</small>
                </div>
                <time>{time}</time>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AvailabilityOperations() {
  const { showToast } = useToast();
  const [hospitals, setHospitals] = useState<HospitalType[]>(() => {
    const saved = localStorage.getItem("carebridge.hospitals");
    return saved ? JSON.parse(saved) : demoHospitals();
  });
  const [editing, setEditing] = useState<HospitalType | null>(null);
  const [optionsModalHospital, setOptionsModalHospital] = useState<HospitalType | null>(null);
  const [detailsModalHospital, setDetailsModalHospital] = useState<HospitalType | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Edit form state
  const [icu, setIcu] = useState(0);
  const [ventilator, setVentilator] = useState(0);
  const [emergencyOpen, setEmergencyOpen] = useState(true);
  const [source, setSource] = useState<HospitalType["availability"]["source"]>("facility_report");
  const [confirmed, setConfirmed] = useState(true);

  // Add facility state
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newIcu, setNewIcu] = useState(10);
  const [newVentilator, setNewVentilator] = useState(4);

  const saveHospitals = (next: HospitalType[]) => {
    setHospitals(next);
    localStorage.setItem("carebridge.hospitals", JSON.stringify(next));
  };

  const openEdit = (hospital: HospitalType) => {
    setEditing(hospital);
    setIcu(hospital.availability.icuBedsAvailable ?? 0);
    setVentilator(hospital.availability.ventilatorBedsAvailable ?? 0);
    setEmergencyOpen(hospital.availability.emergencyOpen ?? false);
    setSource(hospital.availability.source || "facility_report");
    setConfirmed(true);
    setOptionsModalHospital(null);
  };

  const save = () => {
    if (!editing) return;
    const now = new Date();
    const expiry = new Date(now.getTime() + 15 * 60_000);
    const updated = hospitals.map((hospital) =>
      hospital.id === editing.id
        ? {
            ...hospital,
            availability: {
              emergencyOpen,
              icuBedsAvailable: icu,
              ventilatorBedsAvailable: ventilator,
              source: source || "facility_report",
              lastVerifiedAt: now.toISOString(),
              verificationExpiresAt: expiry.toISOString(),
            },
          }
        : hospital,
    );
    saveHospitals(updated);
    setEditing(null);
    showToast(
      "Availability Updated",
      `Verified availability saved for ${editing.name}.`,
      "success"
    );
    recordAuditEvent(
      "ICU Availability Updated",
      "Operations Admin",
      "operations",
      `${editing.name}: ${icu} ICU, ${ventilator} Vents, Emergency ${emergencyOpen ? "Open" : "Closed"} (Source: ${source})`
    );
  };

  const handleAddFacility = () => {
    if (!newName.trim()) return;
    const now = new Date();
    const expiry = new Date(now.getTime() + 15 * 60_000);
    const newFacility: HospitalType = {
      id: `hosp-user-${Date.now()}`,
      name: newName.trim(),
      address: newAddress.trim() || "Civic Health Zone",
      phone: newPhone.trim() || "+91 44 2800 0000",
      latitude: 13.0827,
      longitude: 80.2707,
      distanceKm: 2.5,
      osmEmergencyTag: true,
      totalBedsTag: 50,
      availability: {
        emergencyOpen: true,
        icuBedsAvailable: newIcu,
        ventilatorBedsAvailable: newVentilator,
        source: "facility_report",
        lastVerifiedAt: now.toISOString(),
        verificationExpiresAt: expiry.toISOString(),
      },
    };
    saveHospitals([...hospitals, newFacility]);
    setAddModalOpen(false);
    setNewName("");
    setNewAddress("");
    setNewPhone("");
    showToast("Facility Added", `${newFacility.name} added to operations availability directory.`, "success");
    recordAuditEvent("New Hospital Added", "Operations Admin", "operations", `Added ${newFacility.name}`);
  };

  const toggleEmergencyQuick = (hospital: HospitalType) => {
    const nextState = !hospital.availability.emergencyOpen;
    const now = new Date();
    const updated = hospitals.map((h) =>
      h.id === hospital.id
        ? {
            ...h,
            availability: {
              ...h.availability,
              emergencyOpen: nextState,
              lastVerifiedAt: now.toISOString(),
            },
          }
        : h
    );
    saveHospitals(updated);
    setOptionsModalHospital(null);
    showToast(
      "Emergency Status Toggled",
      `${hospital.name} emergency department is now ${nextState ? "OPEN" : "CLOSED"}.`,
      nextState ? "success" : "warning"
    );
    recordAuditEvent("Emergency Status Quick Toggle", "Operations Admin", "operations", `${hospital.name} -> ${nextState ? "OPEN" : "CLOSED"}`);
  };

  const exportFacilityReport = (hospital: HospitalType) => {
    const csvContent =
      "Facility Name,Address,Emergency Status,ICU Beds,Ventilator Beds,Source,Last Verified\n" +
      `"${hospital.name}","${hospital.address || ""}","${hospital.availability.emergencyOpen ? "Open" : "Closed"}",${hospital.availability.icuBedsAvailable ?? 0},${hospital.availability.ventilatorBedsAvailable ?? 0},"${hospital.availability.source}","${hospital.availability.lastVerifiedAt || "Never"}"`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${hospital.name.replace(/[^a-zA-Z0-9]/g, "_")}_Status.csv`;
    link.click();
    showToast("Report Downloaded", `Status report exported for ${hospital.name}.`, "success");
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Hospital availability operations"
        subtitle="Update emergency and ICU status with source, timestamp and automatic expiry."
        action={
          <div className="button-row">
            <Badge tone="amber">{hospitals.length} facilities</Badge>
            <Button icon={<Plus size={17} />} onClick={() => setAddModalOpen(true)}>
              Add facility
            </Button>
          </div>
        }
      />
      <Card tone="critical" className="inline-alert">
        <Clock3 size={19} />
        <span>
          Availability expires after 15 minutes. Stale or unverified values automatically
          become “Call to verify” in the patient workspace.
        </span>
      </Card>
      <div className="availability-admin-grid">
        {hospitals.map((hospital) => (
          <Card key={hospital.id} className="availability-admin-card">
            <div className="availability-admin-card__header">
              <span>
                <Hospital size={22} />
              </span>
              <div>
                <h3>{hospital.name}</h3>
                <p>{hospital.address}</p>
              </div>
              <button
                className="icon-button"
                aria-label="Facility options menu"
                title="Facility actions and options"
                onClick={() => setOptionsModalHospital(hospital)}
              >
                <MoreHorizontal size={19} />
              </button>
            </div>
            <div className="availability-grid">
              <div>
                <Ambulance size={18} />
                <span>Emergency</span>
                <strong>
                  {hospital.availability.emergencyOpen === true
                    ? "Open"
                    : hospital.availability.emergencyOpen === false
                      ? "Closed"
                      : "Unknown"}
                </strong>
              </div>
              <div>
                <BedDouble size={18} />
                <span>ICU beds</span>
                <strong>{hospital.availability.icuBedsAvailable ?? "Unknown"}</strong>
              </div>
              <div>
                <Activity size={18} />
                <span>Ventilator beds</span>
                <strong>{hospital.availability.ventilatorBedsAvailable ?? "Unknown"}</strong>
              </div>
            </div>
            <footer>
              <Badge
                tone={hospital.availability.source === "unknown" ? "neutral" : "green"}
              >
                {hospital.availability.source.replaceAll("_", " ")}
              </Badge>
              <small>
                {hospital.availability.lastVerifiedAt
                  ? `Updated ${new Date(
                      hospital.availability.lastVerifiedAt,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Never verified"}
              </small>
              <Button variant="outline" onClick={() => openEdit(hospital)}>
                Update
              </Button>
            </footer>
          </Card>
        ))}
      </div>

      {/* Hospital Options Modal (from ... button) */}
      <Modal
        open={Boolean(optionsModalHospital)}
        title={`Facility Actions — ${optionsModalHospital?.name}`}
        onClose={() => setOptionsModalHospital(null)}
      >
        {optionsModalHospital ? (
          <div className="page-stack">
            <Card tone="blue">
              <h3>{optionsModalHospital.name}</h3>
              <p>{optionsModalHospital.address || "Medical Enclave"}</p>
              <p><Phone size={14} style={{ display: "inline", marginRight: "4px" }} /> {optionsModalHospital.phone || "+91 44 2800 0000"}</p>
            </Card>

            <div className="compact-list">
              <button onClick={() => openEdit(optionsModalHospital)}>
                <RefreshCw size={18} />
                <div>
                  <strong>Update ICU & Ventilator Beds</strong>
                  <small>Edit verified capacity numbers and sources</small>
                </div>
                <ChevronRight size={17} />
              </button>

              <button onClick={() => toggleEmergencyQuick(optionsModalHospital)}>
                <Ambulance size={18} />
                <div>
                  <strong>
                    {optionsModalHospital.availability.emergencyOpen ? "Close Emergency Ward" : "Open Emergency Ward"}
                  </strong>
                  <small>Toggle emergency admission status immediately</small>
                </div>
                <ChevronRight size={17} />
              </button>

              <button onClick={() => { setDetailsModalHospital(optionsModalHospital); setOptionsModalHospital(null); }}>
                <Hospital size={18} />
                <div>
                  <strong>View Full Facility Profile</strong>
                  <small>Inspect contact numbers, GPS coordinates and verification logs</small>
                </div>
                <ChevronRight size={17} />
              </button>

              <button onClick={() => exportFacilityReport(optionsModalHospital)}>
                <FileText size={18} />
                <div>
                  <strong>Export Status Report (CSV)</strong>
                  <small>Download operational availability log</small>
                </div>
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Facility Details Modal */}
      <Modal
        open={Boolean(detailsModalHospital)}
        title="Facility Profile Details"
        onClose={() => setDetailsModalHospital(null)}
      >
        {detailsModalHospital ? (
          <div className="page-stack">
            <Card tone="blue">
              <h3>{detailsModalHospital.name}</h3>
              <p>{detailsModalHospital.address}</p>
              <Badge tone="green">Verified Regional Partner</Badge>
            </Card>
            <dl className="facts-list">
              <div>
                <dt>Emergency Department</dt>
                <dd>{detailsModalHospital.availability.emergencyOpen ? "Open (24x7)" : "Closed"}</dd>
              </div>
              <div>
                <dt>ICU Beds Available</dt>
                <dd>{detailsModalHospital.availability.icuBedsAvailable} beds</dd>
              </div>
              <div>
                <dt>Ventilator Beds Available</dt>
                <dd>{detailsModalHospital.availability.ventilatorBedsAvailable} beds</dd>
              </div>
              <div>
                <dt>Helpline Phone</dt>
                <dd>{detailsModalHospital.phone || "+91 44 2800 0000"}</dd>
              </div>
              <div>
                <dt>Location GPS</dt>
                <dd>{detailsModalHospital.latitude}, {detailsModalHospital.longitude}</dd>
              </div>
              <div>
                <dt>Verification Expiry</dt>
                <dd>15 Minutes (Automatic Stale Enforcement Active)</dd>
              </div>
            </dl>
            <Button variant="secondary" onClick={() => setDetailsModalHospital(null)}>Close Profile</Button>
          </div>
        ) : null}
      </Modal>

      {/* Add New Facility Modal */}
      <Modal open={addModalOpen} title="Add New Health Facility" onClose={() => setAddModalOpen(false)}>
        <div className="page-stack">
          <label>
            Hospital / Facility Name
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. City General Hospital"
            />
          </label>
          <label>
            Address / Health Zone
            <input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="e.g. Central Health Avenue, Sector 4"
            />
          </label>
          <label>
            Helpline Phone Number
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91 44 2800 0000"
            />
          </label>
          <div className="two-column-grid">
            <label>
              ICU Beds
              <input
                type="number"
                min="0"
                value={newIcu}
                onChange={(e) => setNewIcu(Number(e.target.value))}
              />
            </label>
            <label>
              Ventilator Beds
              <input
                type="number"
                min="0"
                value={newVentilator}
                onChange={(e) => setNewVentilator(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button icon={<Plus size={17} />} onClick={handleAddFacility} disabled={!newName.trim()}>
              Save New Facility
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Availability Modal */}
      <Modal open={Boolean(editing)} title="Update verified availability" onClose={() => setEditing(null)}>
        {editing ? (
          <div className="page-stack">
            <Card tone="blue">
              <h3>{editing.name}</h3>
              <p>Facility status update</p>
            </Card>
            <Toggle checked={emergencyOpen} onChange={setEmergencyOpen} label="Emergency department open" />
            <div className="form-grid">
              <label>
                ICU beds available
                <input
                  type="number"
                  min="0"
                  value={icu}
                  onChange={(event) => setIcu(Number(event.target.value))}
                />
              </label>
              <label>
                Ventilator beds available
                <input
                  type="number"
                  min="0"
                  value={ventilator}
                  onChange={(event) => setVentilator(Number(event.target.value))}
                />
              </label>
              <label>
                Source
                <select
                  value={source}
                  onChange={(event) =>
                    setSource(event.target.value as HospitalType["availability"]["source"])
                  }
                >
                  <option value="facility_report">Facility staff report</option>
                  <option value="partner_feed">Verified partner feed</option>
                  <option value="government_feed">Government feed</option>
                  <option value="unknown">Manual override</option>
                </select>
              </label>
            </div>
            <label className="confirm-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              I confirm this update and its 15-minute expiry timestamp.
            </label>
            <Button disabled={!confirmed} onClick={save}>
              Save verified status
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function DoctorVerification() {
  const { showToast } = useToast();
  const [rows, setRows] = useState(initialVerificationRows);
  const [reviewing, setReviewing] = useState<VerificationRow | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | VerificationStatus>("All");
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);

  // New Doctor Form State
  const [docName, setDocName] = useState("");
  const [docSpecialty, setDocSpecialty] = useState("General Physician");
  const [docReg, setDocReg] = useState("");

  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          (statusFilter === "All" || row.status === statusFilter) &&
          (row.name.toLowerCase().includes(query.toLowerCase()) ||
            row.specialty.toLowerCase().includes(query.toLowerCase()) ||
            row.registration.toLowerCase().includes(query.toLowerCase()))
      ),
    [query, rows, statusFilter]
  );

  const update = (id: string, status: VerificationStatus) => {
    const target = rows.find((r) => r.id === id);
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    setReviewing(null);
    showToast(
      `Doctor ${status}`,
      `${target?.name || "Doctor"} verification status updated to ${status}.`,
      status === "Approved" ? "success" : "warning"
    );
    recordAuditEvent(
      `Doctor Verification ${status}`,
      "Operations Admin",
      "operations",
      `${target?.name} (${target?.registration}) status set to ${status}`
    );
  };

  const handleAddDoctor = () => {
    if (!docName.trim() || !docReg.trim()) return;
    const initials = docName
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const newDoc: VerificationRow = {
      id: `verify-${Date.now()}`,
      name: docName.trim().startsWith("Dr.") ? docName.trim() : `Dr. ${docName.trim()}`,
      initials,
      specialty: docSpecialty,
      registration: docReg.trim(),
      submitted: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      status: "Pending",
    };
    setRows((prev) => [newDoc, ...prev]);
    setAddDoctorOpen(false);
    setDocName("");
    setDocReg("");
    showToast("Doctor Added", `${newDoc.name} added to pending verification queue.`, "success");
    recordAuditEvent("Doctor Verification Submitted", "Operations Admin", "operations", `Submitted ${newDoc.name}`);
  };

  const exportCSV = () => {
    const header = "Doctor Name,Specialty,Registration,Submitted Date,Status\n";
    const body = rows
      .map((r) => `"${r.name}","${r.specialty}","${r.registration}","${r.submitted}","${r.status}"`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Doctor_Verification_Registry.csv";
    link.click();
    showToast("Registry Exported", "Verification audit registry exported to CSV.", "success");
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Doctor verification"
        subtitle="Licence review with status history and dual-control reminders."
        action={
          <div className="button-row">
            <Badge tone="amber">
              {rows.filter((row) => row.status === "Pending").length} pending
            </Badge>
            <Button icon={<Plus size={17} />} onClick={() => setAddDoctorOpen(true)}>
              Register Clinician
            </Button>
          </div>
        }
      />
      <Card tone="blue" className="inline-alert">
        <ShieldCheck size={19} />
        <span>
          Production approval requires trusted registry checks, document validation and a
          second authorised reviewer.
        </span>
      </Card>
      <Card>
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search doctor, registration or specialty"
            />
          </label>
          <div className="segmented-field" style={{ margin: 0 }}>
            {(["All", "Pending", "Approved", "Rejected"] as const).map((s) => (
              <button
                key={s}
                className={statusFilter === s ? "is-active" : ""}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <Button variant="outline" icon={<FileText size={17} />} onClick={exportCSV}>
            Export CSV
          </Button>
          <Button
            variant="outline"
            icon={<RefreshCw size={17} />}
            onClick={() =>
              showToast(
                "Registry Refreshed",
                "Doctor verification registry re-synced.",
                "info"
              )
            }
          >
            Refresh
          </Button>
        </div>
        <div className="data-table">
          <div className="data-table__header">
            <span>Doctor</span>
            <span>Specialty</span>
            <span>Registration</span>
            <span>Submitted</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {visible.map((row) => (
            <div className="data-table__row" key={row.id}>
              <span className="table-person">
                <Avatar initials={row.initials} size="small" />
                <strong>{row.name}</strong>
              </span>
              <span>{row.specialty}</span>
              <span>{row.registration}</span>
              <span>{row.submitted}</span>
              <span>
                <Badge
                  tone={
                    row.status === "Approved"
                      ? "green"
                      : row.status === "Rejected"
                        ? "red"
                        : "amber"
                  }
                >
                  {row.status}
                </Badge>
              </span>
              <span>
                <Button variant="outline" onClick={() => setReviewing(row)}>
                  Review
                </Button>
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Register New Doctor Modal */}
      <Modal open={addDoctorOpen} title="Register Clinician for Verification" onClose={() => setAddDoctorOpen(false)}>
        <div className="page-stack">
          <label>
            Doctor Full Name
            <input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Dr. Kavitha Ramesh"
            />
          </label>
          <label>
            Specialty
            <select value={docSpecialty} onChange={(e) => setDocSpecialty(e.target.value)}>
              <option>General Physician</option>
              <option>Cardiology</option>
              <option>Dermatology</option>
              <option>Orthopaedics</option>
              <option>Paediatrics</option>
              <option>Neurology</option>
            </select>
          </label>
          <label>
            Medical Council Registration No.
            <input
              value={docReg}
              onChange={(e) => setDocReg(e.target.value)}
              placeholder="e.g. TNMC-DEMO-99120"
            />
          </label>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setAddDoctorOpen(false)}>Cancel</Button>
            <Button icon={<UserCheck size={17} />} onClick={handleAddDoctor} disabled={!docName.trim() || !docReg.trim()}>
              Submit for Verification
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={Boolean(reviewing)} title="Credential review" onClose={() => setReviewing(null)}>
        {reviewing ? (
          <div className="page-stack">
            <Card className="selected-doctor">
              <Avatar initials={reviewing.initials} size="large" />
              <div>
                <h3>{reviewing.name}</h3>
                <p>{reviewing.specialty}</p>
                <Badge tone="amber">{reviewing.status}</Badge>
              </div>
            </Card>
            <dl className="facts-list">
              <div>
                <dt>Registration</dt>
                <dd>{reviewing.registration}</dd>
              </div>
              <div>
                <dt>Identity document</dt>
                <dd>Document verified • checksum recorded</dd>
              </div>
              <div>
                <dt>Licence registry result</dt>
                <dd>Matched in state medical register</dd>
              </div>
              <div>
                <dt>Second reviewer</dt>
                <dd>Required before final approval</dd>
              </div>
            </dl>
            <div className="modal-actions">
              <Button variant="danger" icon={<ShieldX size={17} />} onClick={() => update(reviewing.id, "Rejected")}>
                Reject
              </Button>
              <Button icon={<UserCheck size={17} />} onClick={() => update(reviewing.id, "Approved")}>
                Approve profile
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function EmergencyMonitor() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<EmergencyEvent[]>(emergencyEvents);
  const [selected, setSelected] = useState<EmergencyEvent | null>(events[0]);
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);

  // New emergency form
  const [incLocation, setIncLocation] = useState("");
  const [incPhone, setIncPhone] = useState("");

  const update = (id: string, patch: Partial<EmergencyEvent>) => {
    setEvents((current) => current.map((event) => (event.id === id ? { ...event, ...patch } : event)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
    showToast("Incident Updated", `Emergency event ${id.toUpperCase()} status updated.`, "info");
    recordAuditEvent("Emergency Dispatch Update", "Operations Dispatcher", "operations", `${id}: ${JSON.stringify(patch)}`);
  };

  const handleResolveIncident = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    setSelected(events.find((ev) => ev.id !== id) || null);
    showToast("Incident Resolved", `Emergency incident ${id.toUpperCase()} marked as resolved and closed.`, "success");
    recordAuditEvent("Emergency Incident Resolved", "Operations Dispatcher", "operations", `Resolved incident ${id}`);
  };

  const handleCreateIncident = () => {
    if (!incLocation.trim()) return;
    const newInc: EmergencyEvent = {
      id: `sos-${Date.now().toString().slice(-4)}`,
      location: incLocation.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "received",
      responder: null,
      etaMinutes: null,
    };
    setEvents((prev) => [newInc, ...prev]);
    setSelected(newInc);
    setNewIncidentOpen(false);
    setIncLocation("");
    setIncPhone("");
    showToast("New Emergency Triggered", `Simulated SOS event created at ${newInc.location}.`, "warning");
    recordAuditEvent("Emergency SOS Triggered", "Patient SOS", "operations", `Location: ${newInc.location}`);
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Emergency response monitor"
        subtitle="Only confirmed partner updates may create assignment and ETA states."
        action={
          <div className="button-row">
            <Badge tone="red">{events.length} active events</Badge>
            <Button variant="danger" icon={<Plus size={17} />} onClick={() => setNewIncidentOpen(true)}>
              Simulate SOS Incident
            </Button>
          </div>
        }
      />
      <Card tone="critical" className="inline-alert">
        <AlertTriangle size={19} />
        <span>
          This emergency dashboard connects operational dispatchers with medical responders.
        </span>
      </Card>
      <div className="emergency-monitor-layout">
        <Card className="incident-list">
          <h3>Active incident queue</h3>
          {events.length === 0 ? (
            <p className="muted" style={{ padding: "16px 0" }}>No active emergency incidents.</p>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                className={selected?.id === event.id ? "is-active" : ""}
                onClick={() => setSelected(event)}
              >
                <span className="incident-list__pulse" />
                <div>
                  <strong>{event.id.toUpperCase()}</strong>
                  <p>{event.location}</p>
                  <small>
                    {event.createdAt} • {event.status.replaceAll("_", " ")}
                  </small>
                </div>
                <ChevronRight size={17} />
              </button>
            ))
          )}
        </Card>
        {selected ? (
          <div className="page-stack">
            <Card className="incident-map">
              <div className="incident-map__visual">
                <MapPin size={44} />
                <span>Map preview — {selected.location}</span>
              </div>
              <footer>
                <strong>{selected.location}</strong>
                <Badge tone="red">Active SOS Incident</Badge>
              </footer>
            </Card>
            <Card>
              <SectionHeading title="Response timeline" />
              <ol className="status-timeline">
                <li className="is-complete">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>SOS received</strong>
                    <small>{selected.createdAt}</small>
                  </div>
                </li>
                <li className="is-complete">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Dispatcher confirmed</strong>
                    <small>Operations Dispatcher</small>
                  </div>
                </li>
                <li className={selected.responder ? "is-complete" : ""}>
                  <Ambulance size={18} />
                  <div>
                    <strong>Responder assigned</strong>
                    <small>{selected.responder ?? "Awaiting assignment"}</small>
                  </div>
                </li>
                <li className={selected.status === "en_route" ? "is-active" : ""}>
                  <Radio size={18} />
                  <div>
                    <strong>Responder en route</strong>
                    <small>
                      {selected.etaMinutes ? `ETA ${selected.etaMinutes} min` : "No ETA"}
                    </small>
                  </div>
                </li>
              </ol>
              <div className="button-row">
                <Button
                  variant="outline"
                  onClick={() =>
                    update(selected.id, {
                      status: "assigned",
                      responder: "Emergency Unit 12 — Rapid Dispatch",
                      etaMinutes: 10,
                    })
                  }
                >
                  Assign response unit
                </Button>
                <Button
                  onClick={() =>
                    update(selected.id, {
                      status: "en_route",
                      responder: selected.responder ?? "Emergency Unit 12 — Rapid Dispatch",
                      etaMinutes: 8,
                    })
                  }
                >
                  Confirm en route
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleResolveIncident(selected.id)}
                >
                  Mark Resolved
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      {/* New Emergency SOS Modal */}
      <Modal open={newIncidentOpen} title="Simulate Emergency SOS Incident" onClose={() => setNewIncidentOpen(false)}>
        <div className="page-stack">
          <label>
            Incident Location / Landmark
            <input
              value={incLocation}
              onChange={(e) => setIncLocation(e.target.value)}
              placeholder="e.g. T. Nagar Bus Terminus, Chennai"
            />
          </label>
          <label>
            Caller Phone Number
            <input
              value={incPhone}
              onChange={(e) => setIncPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </label>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setNewIncidentOpen(false)}>Cancel</Button>
            <Button variant="danger" icon={<Ambulance size={17} />} onClick={handleCreateIncident} disabled={!incLocation.trim()}>
              Trigger Dispatch Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SafetyAndContent() {
  const { showToast } = useToast();
  const [published, setPublished] = useState(["Adult CPR", "Severe bleeding"]);
  const [flagResolved, setFlagResolved] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  // Modals for partner actions
  const [labPartnersOpen, setLabPartnersOpen] = useState(false);
  const [pharmacyPartnersOpen, setPharmacyPartnersOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [addArticleOpen, setAddArticleOpen] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  const handleAddArticle = () => {
    if (!newTopic.trim()) return;
    setPublished((prev) => [...prev, newTopic.trim()]);
    setAddArticleOpen(false);
    setNewTopic("");
    showToast("First-Aid Article Created", `${newTopic.trim()} added to clinical content repository.`, "success");
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Clinical content and AI safety"
        subtitle="Versioned first-aid publishing and review of safety-flagged sessions."
        action={
          <Button icon={<Plus size={17} />} onClick={() => setAddArticleOpen(true)}>
            Add first-aid topic
          </Button>
        }
      />
      <div className="two-column-grid">
        <Card>
          <SectionHeading title="First-aid content" action={<Badge tone="blue">{published.length} published</Badge>} />
          <div className="content-review-list">
            {["Adult CPR", "Severe bleeding", "Choking", "Burns", ...published.filter((p) => !["Adult CPR", "Severe bleeding", "Choking", "Burns"].includes(p))].map((topic) => {
              const isPublished = published.includes(topic);
              return (
                <article key={topic}>
                  <FileHeart size={20} />
                  <div>
                    <strong>{topic}</strong>
                    <small>Version 2.4 • Clinician review required</small>
                  </div>
                  <Badge tone={isPublished ? "green" : "amber"}>
                    {isPublished ? "Published" : "In review"}
                  </Badge>
                  {!isPublished ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPublished((current) => [...current, topic]);
                        showToast("Article Published", `${topic} published to offline essentials.`, "success");
                      }}
                    >
                      Publish article
                    </Button>
                  ) : null}
                </article>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionHeading
            title="AI safety queue"
            action={<Badge tone={flagResolved ? "green" : "red"}>{flagResolved ? "Resolved" : "1 flagged"}</Badge>}
          />
          <Card tone="critical" className="safety-review-card">
            <MessageSquareWarning size={24} />
            <div>
              <strong>Emergency warning sign mentioned after result</strong>
              <p>
                Session log • User entered “fainting” in free text after completing
                the questionnaire.
              </p>
              <div>
                <Badge tone="red">Emergency escalation required</Badge>
                <Badge tone="amber">Audit log saved</Badge>
              </div>
            </div>
          </Card>
          <div className="button-row">
            <Button variant="outline" onClick={() => setTranscriptOpen(true)}>Open transcript</Button>
            <Button
              disabled={flagResolved}
              onClick={() => {
                setFlagResolved(true);
                showToast("Review Completed", "Safety review marked as resolved.", "success");
                recordAuditEvent("Safety Flag Resolved", "Operations Reviewer", "operations", "Flag #SF-9042 marked complete");
              }}
              icon={<Check size={17} />}
            >
              Mark review complete
            </Button>
          </div>
        </Card>

        <Modal open={transcriptOpen} title="Redacted safety transcript" onClose={() => setTranscriptOpen(false)}>
          <div className="page-stack">
            <Card tone="blue" className="inline-alert">
              <ShieldCheck size={18} />
              <span>Session transcript log — privacy protected</span>
            </Card>
            <div className="compact-list">
              <div>
                <strong>[09:14:02] Patient:</strong> "I have had a mild headache since yesterday morning."
              </div>
              <div>
                <strong>[09:14:15] AI Assistant:</strong> "Are you experiencing any dizziness, chest pain, or fainting?"
              </div>
              <div>
                <strong>[09:14:28] Patient:</strong> "Yes, I fainted briefly when standing up."
              </div>
              <div>
                <strong>[09:14:29] Safety Guard:</strong> <Badge tone="red">Emergency Triggered (Rule #112)</Badge>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setTranscriptOpen(false)}>Close transcript</Button>
          </div>
        </Modal>
      </div>

      <div className="three-column-grid">
        <Card className="operations-action-card">
          <Stethoscope size={26} />
          <h3>Lab partners</h3>
          <p>3 partner networks • Verified contracts</p>
          <Button variant="outline" onClick={() => setLabPartnersOpen(true)}>Manage partners</Button>
        </Card>
        <Card className="operations-action-card">
          <FileText size={26} />
          <h3>Pharmacy partners</h3>
          <p>2 partner networks • Active integration</p>
          <Button variant="outline" onClick={() => setPharmacyPartnersOpen(true)}>Manage partners</Button>
        </Card>
        <Card className="operations-action-card">
          <CircleDollarSign size={26} />
          <h3>Payments and refunds</h3>
          <p>Audit logging active • Gateway connected</p>
          <Button variant="outline" onClick={() => setPaymentsOpen(true)}>Open transactions</Button>
        </Card>
      </div>

      {/* Add Topic Modal */}
      <Modal open={addArticleOpen} title="Add First-Aid Article Topic" onClose={() => setAddArticleOpen(false)}>
        <div className="page-stack">
          <label>
            Topic Title
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Heatstroke Management"
            />
          </label>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setAddArticleOpen(false)}>Cancel</Button>
            <Button icon={<Check size={17} />} onClick={handleAddArticle} disabled={!newTopic.trim()}>
              Save & Draft Article
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lab Partners Modal */}
      <Modal open={labPartnersOpen} title="Diagnostic Lab Partner Integrations" onClose={() => setLabPartnersOpen(false)}>
        <div className="page-stack">
          <Card tone="blue">
            <h3>Diagnostic Networks</h3>
            <p>Active HL7/FHIR sync feeds for home sample collection</p>
          </Card>
          <div className="compact-list">
            {[
              ["Thyrocare Diagnostics", "API Active • 1,240 samples processed", "Connected"],
              ["Metropolis Healthcare", "API Active • 850 samples processed", "Connected"],
              ["SRL Diagnostics Network", "API Active • 610 samples processed", "Connected"],
            ].map(([name, desc, status]) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <strong>{name}</strong>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>{desc}</p>
                </div>
                <Badge tone="green">{status}</Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => { setLabPartnersOpen(false); showToast("Sync Re-established", "Re-validated API keys for diagnostic partners.", "success"); }}>
            Re-sync Partner Feeds
          </Button>
        </div>
      </Modal>

      {/* Pharmacy Partners Modal */}
      <Modal open={pharmacyPartnersOpen} title="Pharmacy Network Integrations" onClose={() => setPharmacyPartnersOpen(false)}>
        <div className="page-stack">
          <Card tone="blue">
            <h3>Pharmacy Networks</h3>
            <p>E-prescription routing and doorstep medicine delivery</p>
          </Card>
          <div className="compact-list">
            {[
              ["Apollo Pharmacy Express", "150+ pincodes in Chennai • Instant Dispatch", "Active"],
              ["MedPlus Digital Logistics", "120+ pincodes • Standard 24h Fulfillment", "Active"],
            ].map(([name, desc, status]) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <strong>{name}</strong>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>{desc}</p>
                </div>
                <Badge tone="green">{status}</Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => { setPharmacyPartnersOpen(false); showToast("Integrations Verified", "Pharmacy dispatch APIs verified.", "success"); }}>
            Verify Dispatch Routes
          </Button>
        </div>
      </Modal>

      {/* Payments and Refunds Modal */}
      <Modal open={paymentsOpen} title="Payments and Refunds Ledger" onClose={() => setPaymentsOpen(false)}>
        <div className="page-stack">
          <Card tone="blue">
            <h3>Financial Transactions Ledger</h3>
            <p>Transaction logs with double-entry audit verification</p>
          </Card>
          <div className="compact-list">
            {[
              ["#TXN-98104", "Doctor Video Consultation • Riya Sharma", "₹499.00", "Settled"],
              ["#TXN-98103", "Full Body Lab Panel • Arjun Mehta", "₹1,250.00", "Settled"],
              ["#TXN-98102", "Refill Order Refund • Neha Iyer", "₹350.00", "Refunded"],
            ].map(([id, desc, amount, status]) => (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <strong>{id} — {amount}</strong>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>{desc}</p>
                </div>
                <Badge tone={status === "Refunded" ? "amber" : "green"}>{status}</Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => { setPaymentsOpen(false); showToast("Ledger Exported", "Financial ledger exported to CSV.", "success"); }}>
            Export Transaction Ledger
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AuditAndSettings() {
  const { showToast } = useToast();
  const [maintenance, setMaintenance] = useState(() => localStorage.getItem("carebridge.cfg.maint") === "true");
  const [redFlags, setRedFlags] = useState(() => localStorage.getItem("carebridge.cfg.flags") !== "false");
  const [expiryEnforcement, setExpiryEnforcement] = useState(() => localStorage.getItem("carebridge.cfg.expiry") !== "false");
  const [auditPrivileged, setAuditPrivileged] = useState(() => localStorage.getItem("carebridge.cfg.audit") !== "false");
  const [liveEvents, setLiveEvents] = useState<AuditEvent[]>([]);
  const [rbacRole, setRbacRole] = useState<string | null>(null);

  useEffect(() => {
    getAuditEvents().then(setLiveEvents);
    const interval = setInterval(() => {
      getAuditEvents().then(setLiveEvents);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleCfg = (setter: (val: boolean) => void, key: string, label: string, val: boolean) => {
    setter(val);
    localStorage.setItem(key, String(val));
    showToast("Setting Updated", `${label} is now ${val ? "ENABLED" : "DISABLED"}.`, val ? "success" : "warning");
    recordAuditEvent("Platform Setting Modified", "Operations Admin", "operations", `${label} -> ${val}`);
  };

  const exportAuditCSV = () => {
    const header = "Event ID,Title,Actor,Category,Details,Timestamp\n";
    const body = liveEvents
      .map((ev) => `"${ev.id}","${ev.title}","${ev.actor}","${ev.category}","${ev.details || ""}","${ev.timestamp}"`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CareBridge_Audit_Report_${Date.now()}.csv`;
    link.click();
    showToast("Report Exported", "Audit stream exported to CSV format.", "success");
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Audit, users and platform settings"
        subtitle="Privacy-safe logs, role controls and real-time audit stream."
      />
      <div className="metric-grid metric-grid--three">
        <Metric label="Active registered users" value="1,248" icon={<Users size={20} />} />
        <Metric label="Security alerts" value="0" icon={<ShieldCheck size={20} />} tone="green" />
        <Metric label="Audit events recorded" value={String(liveEvents.length || 486)} icon={<FileText size={20} />} />
      </div>
      <div className="two-column-grid">
        <Card>
          <SectionHeading title="Real-time audit stream" />
          <div className="activity-list">
            {liveEvents.length > 0
              ? liveEvents.slice(0, 7).map((ev) => (
                  <article key={ev.id}>
                    <ShieldCheck size={17} />
                    <div>
                      <strong>{ev.title}</strong>
                      <small>{ev.actor} • {ev.details || ev.category}</small>
                    </div>
                    <time>{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  </article>
                ))
              : [
                  ["Role permission updated", "Operations admin", "10:42 AM"],
                  ["Doctor profile reviewed", "Verifier 02", "10:24 AM"],
                  ["Hospital status changed", "Facility reporter", "10:11 AM"],
                ].map(([title, actor, time]) => (
                  <article key={`${title}-${time}`}>
                    <ShieldCheck size={17} />
                    <div>
                      <strong>{title}</strong>
                      <small>{actor} • Audit log entry</small>
                    </div>
                    <time>{time}</time>
                  </article>
                ))}
          </div>
          <Button variant="outline" icon={<Download size={17} />} onClick={exportAuditCSV}>
            Export audit report (CSV)
          </Button>
        </Card>

        <div className="page-stack">
          <Card>
            <h3>Role and access controls (RBAC)</h3>
            <div className="compact-list">
              {[
                ["Patient", "1,084 active accounts"],
                ["Doctor", "126 verified profiles"],
                ["Operations", "8 privileged accounts"],
              ].map(([role, count]) => (
                <button key={role} onClick={() => setRbacRole(role)}>
                  <UserRoundCog size={18} />
                  <div>
                    <strong>{role}</strong>
                    <small>{count}</small>
                  </div>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <h3>Platform configuration</h3>
            <div className="setting-list">
              <Toggle
                checked={maintenance}
                onChange={(val) => handleToggleCfg(setMaintenance, "carebridge.cfg.maint", "Maintenance banner", val)}
                label="Maintenance banner"
              />
              <Toggle
                checked={redFlags}
                onChange={(val) => handleToggleCfg(setRedFlags, "carebridge.cfg.flags", "AI emergency red-flag rules", val)}
                label="AI emergency red-flag rules"
              />
              <Toggle
                checked={expiryEnforcement}
                onChange={(val) => handleToggleCfg(setExpiryEnforcement, "carebridge.cfg.expiry", "ICU status expiry enforcement", val)}
                label="ICU status expiry enforcement"
              />
              <Toggle
                checked={auditPrivileged}
                onChange={(val) => handleToggleCfg(setAuditPrivileged, "carebridge.cfg.audit", "Audit all privileged actions", val)}
                label="Audit all privileged actions"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* RBAC Modal */}
      <Modal open={Boolean(rbacRole)} title={`Role Permissions — ${rbacRole}`} onClose={() => setRbacRole(null)}>
        {rbacRole ? (
          <div className="page-stack">
            <Card tone="blue">
              <h3>{rbacRole} Access Policy</h3>
              <p>Configure role-based access control grants</p>
            </Card>
            <div className="setting-list">
              <Toggle checked={true} onChange={() => showToast("RBAC Core", "Core permission enforced by policy.", "info")} label="Authenticated session required" />
              <Toggle checked={rbacRole !== "Patient"} onChange={() => showToast("RBAC Clinical", "Clinical permission updated.", "info")} label="Write clinical notes & prescriptions" />
              <Toggle checked={rbacRole === "Operations"} onChange={() => showToast("RBAC Admin", "Admin permission updated.", "info")} label="Approve clinician licensing & hospital status" />
              <Toggle checked={true} onChange={() => showToast("RBAC Audit", "Audit permission active.", "info")} label="Write immutable audit log entries" />
            </div>
            <Button variant="secondary" onClick={() => setRbacRole(null)}>Done</Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function OperationsWorkspace({ active, onNavigate }: OperationsWorkspaceProps) {
  switch (active) {
    case "doctors":
      return <DoctorVerification />;
    case "emergencies":
      return <EmergencyMonitor />;
    case "hospitals":
      return <AvailabilityOperations />;
    case "safety":
      return <SafetyAndContent />;
    case "audit":
    case "settings":
      return <AuditAndSettings />;
    default:
      return <OperationsOverview onNavigate={onNavigate} />;
  }
}
