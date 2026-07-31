import { useEffect, useRef, useState } from "react";
import {
  Ambulance,
  CheckCircle2,
  ContactRound,
  HeartPulse,
  MapPin,
  Phone,
  Radio,
  Share2,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { firstAidTopics } from "../data/demo";
import { Badge, Button, Card, Modal, SectionHeading } from "./ui";

export function EmergencyPanel({
  onOpenHospitals,
}: {
  onOpenHospitals: () => void;
}) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [demoRecorded, setDemoRecorded] = useState(false);
  const [topicId, setTopicId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAt = useRef(0);

  const stopHold = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (holdProgress < 100) setHoldProgress(0);
  };

  const startHold = () => {
    if (timerRef.current !== null) return;
    startedAt.current = Date.now();
    timerRef.current = window.setInterval(() => {
      const progress = Math.min(100, ((Date.now() - startedAt.current) / 3000) * 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setConfirmOpen(true);
      }
    }, 50);
  };

  useEffect(() => () => stopHold(), []);

  const shareLocation = async () => {
    const text =
      "CareBridge demo safety check-in: I may need help. Confirm my location with me directly.";
    if (navigator.share) {
      await navigator.share({ title: "Safety check-in", text });
    } else {
      await navigator.clipboard?.writeText(text);
      window.alert("Safety check-in copied. No real location was transmitted in this demo.");
    }
  };

  const selectedTopic = firstAidTopics.find((topic) => topic.id === topicId);

  return (
    <div className="page-stack">
      <SectionHeading
        title="Emergency and first aid"
        subtitle="Direct 112 access, intentional SOS confirmation and offline essential guidance."
        action={<Badge tone="green">Offline essentials cached</Badge>}
      />

      <div className="emergency-grid">
        <Card tone="critical" className="sos-card">
          <span className="sos-card__shield">
            <ShieldAlert size={42} />
          </span>
          <Badge tone="red">Immediate danger</Badge>
          <h2>Call 112 now</h2>
          <p>
            If someone is in immediate danger, call emergency services. The app must not
            delay the call.
          </p>
          <a className="button button--danger button--large" href="tel:112">
            <Phone size={21} />
            <span>Call 112</span>
          </a>
        </Card>

        <Card className="hold-sos-card">
          <div>
            <Badge tone="amber">Demo SOS workflow</Badge>
            <h2>Hold to prepare an SOS request</h2>
            <p>
              Hold for three seconds, then confirm. This prototype records a local demo
              event and does not dispatch a real ambulance.
            </p>
          </div>
          <button
            className="hold-button"
            style={{ "--hold-progress": `${holdProgress * 3.6}deg` } as React.CSSProperties}
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerCancel={stopHold}
            onPointerLeave={stopHold}
          >
            <span>
              <Radio size={30} />
              HOLD FOR SOS
              <small>{Math.round(holdProgress)}%</small>
            </span>
          </button>
          <div className="sos-quick-actions">
            <button onClick={shareLocation}>
              <Share2 size={19} />
              <span>Safety check-in</span>
            </button>
            <button onClick={onOpenHospitals}>
              <MapPin size={19} />
              <span>Nearby hospitals</span>
            </button>
            <button onClick={() => window.alert("Medical ID is available in the signed-in patient Profile workspace.")}>
              <ContactRound size={19} />
              <span>Medical ID</span>
            </button>
          </div>
        </Card>
      </div>

      {demoRecorded ? (
        <Card tone="success" className="demo-event">
          <CheckCircle2 size={25} />
          <div>
            <strong>Demo SOS event recorded</strong>
            <p>
              It is visible in the Operations workspace. No responder was contacted and no
              dispatch is claimed.
            </p>
          </div>
          <Badge tone="green">Local demonstration</Badge>
        </Card>
      ) : null}

      <div className="two-column-grid">
        <Card>
          <h3>Emergency medical ID</h3>
          <div className="medical-id-compact">
            <div>
              <span>CAREBRIDGE ONE</span>
              <strong>Riya Sharma</strong>
              <small>CB-4827-1906</small>
            </div>
            <span className="medical-id-compact__cross">+</span>
          </div>
          <dl className="facts-list">
            <div>
              <dt>Blood group</dt>
              <dd>O+</dd>
            </div>
            <div>
              <dt>Allergy</dt>
              <dd className="critical-text">Penicillin</dd>
            </div>
            <div>
              <dt>Emergency contact</dt>
              <dd>Arun Sharma • +91 98765 43210</dd>
            </div>
          </dl>
          <Button variant="outline" icon={<Share2 size={17} />} onClick={() => window.alert("A privacy-safe demo Medical ID share link was prepared. No real patient data was transmitted.")}>
            Share securely
          </Button>
        </Card>

        <Card>
          <h3>What happens after a verified SOS?</h3>
          <ol className="status-timeline">
            <li className="is-complete">
              <CheckCircle2 size={18} />
              <div>
                <strong>Request received</strong>
                <small>Only after the user confirms</small>
              </div>
            </li>
            <li>
              <Radio size={18} />
              <div>
                <strong>Dispatcher confirmation</strong>
                <small>Must come from an authorised integration</small>
              </div>
            </li>
            <li>
              <Ambulance size={18} />
              <div>
                <strong>Responder assigned</strong>
                <small>ETA appears only after confirmation</small>
              </div>
            </li>
          </ol>
        </Card>
      </div>

      <SectionHeading
        title="Offline first-aid essentials"
        subtitle="Short entry points; final content must be reviewed and versioned by clinicians."
      />
      <div className="feature-card-grid feature-card-grid--four">
        {firstAidTopics.map((topic) => (
          <button className="feature-tile" key={topic.id} onClick={() => setTopicId(topic.id)}>
            <span className="feature-tile__icon">
              {topic.id === "cpr" ? (
                <HeartPulse size={24} />
              ) : topic.id === "bleeding" ? (
                <TriangleAlert size={24} />
              ) : (
                <ShieldAlert size={24} />
              )}
            </span>
            <strong>{topic.title}</strong>
            <p>{topic.summary}</p>
          </button>
        ))}
      </div>

      <Modal open={confirmOpen} title="Confirm demo SOS" onClose={() => setConfirmOpen(false)}>
        <Card tone="critical" className="inline-alert">
          <TriangleAlert size={20} />
          <span>
            This demonstration cannot contact emergency services. Call 112 for a real
            emergency.
          </span>
        </Card>
        <dl className="facts-list">
          <div>
            <dt>Demo location</dt>
            <dd>Anna Nagar, Chennai</dd>
          </div>
          <div>
            <dt>Medical ID</dt>
            <dd>Share only after confirmation</dd>
          </div>
        </dl>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setDemoRecorded(true);
              setConfirmOpen(false);
              setHoldProgress(0);
            }}
          >
            Record demo event
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedTopic)}
        title={selectedTopic?.title ?? "First aid"}
        onClose={() => setTopicId(null)}
      >
        {selectedTopic ? (
          <div className="page-stack">
            <Card tone="critical" className="inline-alert">
              <Phone size={19} />
              <span>Call 112 and follow the emergency dispatcher’s instructions.</span>
            </Card>
            <p>{selectedTopic.summary}</p>
            <ol className="first-aid-steps">
              {selectedTopic.steps.map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <a className="button button--danger" href="tel:112">
              <Phone size={18} />
              <span>Call 112</span>
            </a>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
