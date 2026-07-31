import { useMemo, useState } from "react";
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
  FileCheck2,
  FileHeart,
  FileText,
  Hospital,
  MapPin,
  MessageSquareWarning,
  MoreHorizontal,
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
        subtitle="Privacy-safe fictional metrics for the combined application."
        action={<Badge tone="green">All demo services operational</Badge>}
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
            action={<Badge tone="blue">Fictional analytics</Badge>}
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
          <Badge tone="blue">3 demo facilities</Badge>
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
          <SectionHeading title="Recent privacy-safe activity" />
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

function DoctorVerification() {
  const [rows, setRows] = useState(initialVerificationRows);
  const [reviewing, setReviewing] = useState<VerificationRow | null>(null);
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.name.toLowerCase().includes(query.toLowerCase()) ||
          row.specialty.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, rows],
  );

  const update = (id: string, status: VerificationStatus) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    setReviewing(null);
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Doctor verification"
        subtitle="Fictional licence review with status history and dual-control reminders."
        action={<Badge tone="amber">{rows.filter((row) => row.status === "Pending").length} pending</Badge>}
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
              placeholder="Search doctor or specialty"
            />
          </label>
          <Button variant="outline" icon={<RefreshCw size={17} />} onClick={() => window.alert("The fictional verification registry was refreshed.")}>
            Refresh registry
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
                <dd>Fictional document • checksum recorded</dd>
              </div>
              <div>
                <dt>Licence registry result</dt>
                <dd>Demo match</dd>
              </div>
              <div>
                <dt>Second reviewer</dt>
                <dd>Required before production approval</dd>
              </div>
            </dl>
            <div className="modal-actions">
              <Button variant="danger" icon={<ShieldX size={17} />} onClick={() => update(reviewing.id, "Rejected")}>
                Reject
              </Button>
              <Button icon={<UserCheck size={17} />} onClick={() => update(reviewing.id, "Approved")}>
                Approve demo profile
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function EmergencyMonitor() {
  const [events, setEvents] = useState<EmergencyEvent[]>(emergencyEvents);
  const [selected, setSelected] = useState<EmergencyEvent | null>(events[0]);
  const update = (id: string, patch: Partial<EmergencyEvent>) => {
    setEvents((current) => current.map((event) => (event.id === id ? { ...event, ...patch } : event)));
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current));
  };
  return (
    <div className="page-stack">
      <SectionHeading
        title="Emergency response monitor"
        subtitle="Only confirmed partner updates may create assignment and ETA states."
        action={<Badge tone="red">{events.length} active demo events</Badge>}
      />
      <Card tone="critical" className="inline-alert">
        <AlertTriangle size={19} />
        <span>
          This prototype does not connect to 112 or dispatch services. All incidents and
          responders shown here are fictional.
        </span>
      </Card>
      <div className="emergency-monitor-layout">
        <Card className="incident-list">
          <h3>Active incident queue</h3>
          {events.map((event) => (
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
          ))}
        </Card>
        {selected ? (
          <div className="page-stack">
            <Card className="incident-map">
              <div className="incident-map__visual">
                <MapPin size={44} />
                <span>Fictional map preview</span>
              </div>
              <footer>
                <strong>{selected.location}</strong>
                <Badge tone="red">Demo incident</Badge>
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
                    <small>Demo operator</small>
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
                      {selected.etaMinutes ? `Demo ETA ${selected.etaMinutes} min` : "No ETA"}
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
                      responder: "Emergency Unit 12 — Demo",
                      etaMinutes: 10,
                    })
                  }
                >
                  Assign demo unit
                </Button>
                <Button
                  onClick={() =>
                    update(selected.id, {
                      status: "en_route",
                      responder: selected.responder ?? "Emergency Unit 12 — Demo",
                      etaMinutes: 8,
                    })
                  }
                >
                  Confirm en route
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AvailabilityOperations() {
  const [hospitals, setHospitals] = useState<HospitalType[]>(demoHospitals());
  const [editing, setEditing] = useState<HospitalType | null>(null);
  const [icu, setIcu] = useState(0);
  const [ventilator, setVentilator] = useState(0);
  const [emergencyOpen, setEmergencyOpen] = useState(true);

  const openEdit = (hospital: HospitalType) => {
    setEditing(hospital);
    setIcu(hospital.availability.icuBedsAvailable ?? 0);
    setVentilator(hospital.availability.ventilatorBedsAvailable ?? 0);
    setEmergencyOpen(hospital.availability.emergencyOpen ?? false);
  };

  const save = () => {
    if (!editing) return;
    const now = new Date();
    const expiry = new Date(now.getTime() + 15 * 60_000);
    setHospitals((current) =>
      current.map((hospital) =>
        hospital.id === editing.id
          ? {
              ...hospital,
              availability: {
                emergencyOpen,
                icuBedsAvailable: icu,
                ventilatorBedsAvailable: ventilator,
                source: "facility_report",
                lastVerifiedAt: now.toISOString(),
                verificationExpiresAt: expiry.toISOString(),
              },
            }
          : hospital,
      ),
    );
    setEditing(null);
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Hospital availability operations"
        subtitle="Update emergency and ICU status with source, timestamp and automatic expiry."
        action={<Badge tone="amber">Fictional facilities</Badge>}
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
              <button className="icon-button" onClick={() => openEdit(hospital)}>
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
      <Modal open={Boolean(editing)} title="Update verified availability" onClose={() => setEditing(null)}>
        {editing ? (
          <div className="page-stack">
            <Card tone="blue">
              <h3>{editing.name}</h3>
              <p>Fictional facility status update</p>
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
                <select defaultValue="Facility staff report">
                  <option>Facility staff report</option>
                  <option>Verified partner feed</option>
                  <option>Government feed</option>
                </select>
              </label>
            </div>
            <label className="confirm-check">
              <input type="checkbox" defaultChecked />
              I confirm this fictional demonstration update and its 15-minute expiry.
            </label>
            <Button onClick={save}>Save verified demo status</Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function SafetyAndContent() {
  const [published, setPublished] = useState(["Adult CPR", "Severe bleeding"]);
  const [flagResolved, setFlagResolved] = useState(false);
  return (
    <div className="page-stack">
      <SectionHeading
        title="Clinical content and AI safety"
        subtitle="Versioned first-aid publishing and review of safety-flagged sessions."
      />
      <div className="two-column-grid">
        <Card>
          <SectionHeading title="First-aid content" action={<Badge tone="blue">4 topics</Badge>} />
          <div className="content-review-list">
            {["Adult CPR", "Severe bleeding", "Choking", "Burns"].map((topic) => {
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
                      onClick={() => setPublished((current) => [...current, topic])}
                    >
                      Publish demo
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
                Synthetic session • The user entered “fainting” in free text after completing
                the questionnaire.
              </p>
              <div>
                <Badge tone="red">Emergency escalation required</Badge>
                <Badge tone="amber">No real patient data</Badge>
              </div>
            </div>
          </Card>
          <div className="button-row">
            <Button variant="outline" onClick={() => window.alert("The redacted fictional safety transcript was opened.")}>Open transcript</Button>
            <Button
              disabled={flagResolved}
              onClick={() => setFlagResolved(true)}
              icon={<Check size={17} />}
            >
              Mark demo review complete
            </Button>
          </div>
        </Card>
      </div>

      <div className="three-column-grid">
        <Card className="operations-action-card">
          <Stethoscope size={26} />
          <h3>Lab partners</h3>
          <p>3 fictional partners • 1 pending verification</p>
          <Button variant="outline" onClick={() => window.alert("Partner management opened. Live activation requires verified contracts and credentials.")}>Manage partners</Button>
        </Card>
        <Card className="operations-action-card">
          <FileText size={26} />
          <h3>Pharmacy partners</h3>
          <p>2 fictional partners • All integrations offline</p>
          <Button variant="outline" onClick={() => window.alert("Partner management opened. Live activation requires verified contracts and credentials.")}>Manage partners</Button>
        </Card>
        <Card className="operations-action-card">
          <CircleDollarSign size={26} />
          <h3>Payments and refunds</h3>
          <p>Demo transactions only • No real gateway connected</p>
          <Button variant="outline" onClick={() => window.alert("Demo transactions opened. No real payment gateway is connected.")}>Open transactions</Button>
        </Card>
      </div>
    </div>
  );
}

function AuditAndSettings() {
  const [maintenance, setMaintenance] = useState(false);
  const [redFlags, setRedFlags] = useState(true);
  const [expiryEnforcement, setExpiryEnforcement] = useState(true);
  const [auditPrivileged, setAuditPrivileged] = useState(true);
  return (
    <div className="page-stack">
      <SectionHeading
        title="Audit, users and platform settings"
        subtitle="Privacy-safe logs, role controls and service configuration."
      />
      <div className="metric-grid metric-grid--three">
        <Metric label="Active fictional users" value="1,248" icon={<Users size={20} />} />
        <Metric label="Security alerts" value="0" icon={<ShieldCheck size={20} />} tone="green" />
        <Metric label="Audit events today" value="486" icon={<FileText size={20} />} />
      </div>
      <div className="two-column-grid">
        <Card>
          <SectionHeading title="Recent audit events" />
          <div className="activity-list">
            {[
              ["Role permission updated", "Operations admin", "10:42 AM"],
              ["Doctor profile reviewed", "Verifier 02", "10:24 AM"],
              ["Hospital status changed", "Facility reporter", "10:11 AM"],
              ["First-aid version published", "Clinical reviewer", "9:58 AM"],
              ["Consent revoked", "Patient action", "9:41 AM"],
            ].map(([title, actor, time]) => (
              <article key={`${title}-${time}`}>
                <ShieldCheck size={17} />
                <div>
                  <strong>{title}</strong>
                  <small>{actor} • Fictional audit entry</small>
                </div>
                <time>{time}</time>
              </article>
            ))}
          </div>
          <Button variant="outline" onClick={() => window.alert("A privacy-safe fictional audit report was prepared for export.")}>Export privacy-safe audit report</Button>
        </Card>
        <div className="page-stack">
          <Card>
            <h3>Role and access controls</h3>
            <div className="compact-list">
              {[
                ["Patient", "1,084 fictional accounts"],
                ["Doctor", "126 verified demo profiles"],
                ["Operations", "8 privileged demo accounts"],
              ].map(([role, count]) => (
                <button key={role} onClick={() => window.alert(`${role} role controls opened with least-privilege safeguards.`)}>
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
              <Toggle checked={maintenance} onChange={setMaintenance} label="Maintenance banner" />
              <Toggle checked={redFlags} onChange={setRedFlags} label="AI emergency red-flag rules" />
              <Toggle checked={expiryEnforcement} onChange={setExpiryEnforcement} label="ICU status expiry enforcement" />
              <Toggle checked={auditPrivileged} onChange={setAuditPrivileged} label="Audit all privileged actions" />
            </div>
          </Card>
        </div>
      </div>
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
