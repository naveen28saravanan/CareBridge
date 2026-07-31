import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarClock,
  Check,
  ChevronRight,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import {
  predictSymptoms,
  redFlagSymptoms,
  selectableSymptoms,
  symptomLabels,
} from "../ml/predict";
import type { SymptomResult, Urgency } from "../types";
import { Badge, Button, Card, SectionHeading } from "./ui";

const urgencyTone: Record<Urgency, "red" | "amber" | "blue" | "green"> = {
  emergency: "red",
  urgent: "red",
  soon: "amber",
  routine: "green",
};

export function SymptomInsights({
  onBookDoctor,
}: {
  onBookDoctor: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [duration, setDuration] = useState("1–2 days");
  const [severity, setSeverity] = useState("Moderate");
  const [ageGroup, setAgeGroup] = useState("18–64");
  const [query, setQuery] = useState("");

  const visibleSymptoms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return selectableSymptoms.filter(
      (symptom) =>
        !redFlagSymptoms.includes(symptom.key) &&
        (!normalized || symptom.label.toLowerCase().includes(normalized)),
    );
  }, [query]);

  const toggle = (key: string) => {
    setResult(null);
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  const run = () => {
    if (selected.length === 0) return;
    setResult(predictSymptoms(selected));
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="Symptom insights"
        subtitle="A local model ranks possible care patterns after emergency warning signs are checked."
        action={
          <Badge tone="blue">
            <ShieldAlert size={14} /> Guidance only — not a diagnosis
          </Badge>
        }
      />

      <Card tone="blue" className="safety-intro">
        <div className="safety-intro__icon">
          <BrainCircuit size={30} />
        </div>
        <div>
          <h3>Private, local symptom analysis</h3>
          <p>
            This demonstration runs inside the app. It does not send your symptom selection
            to a paid AI service.
          </p>
        </div>
        <Badge tone="amber">Synthetic training data</Badge>
      </Card>

      <div className="two-column-grid two-column-grid--assessment">
        <div className="page-stack">
          <Card>
            <h3>1. Check emergency warning signs</h3>
            <p className="muted">
              Select any that apply. The app will route to emergency help before showing
              possible patterns.
            </p>
            <div className="symptom-grid symptom-grid--redflags">
              {redFlagSymptoms.map((key) => (
                <button
                  key={key}
                  className={`symptom-chip symptom-chip--critical ${
                    selected.includes(key) ? "is-selected" : ""
                  }`}
                  onClick={() => toggle(key)}
                >
                  {selected.includes(key) ? <Check size={15} /> : <AlertTriangle size={15} />}
                  {symptomLabels[key]}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="inline-heading">
              <div>
                <h3>2. Select current symptoms</h3>
                <p className="muted">Choose every symptom that is relevant now.</p>
              </div>
              <input
                className="compact-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search symptoms"
                aria-label="Search symptoms"
              />
            </div>
            <div className="symptom-grid">
              {visibleSymptoms.map((symptom) => (
                <button
                  key={symptom.key}
                  className={`symptom-chip ${
                    selected.includes(symptom.key) ? "is-selected" : ""
                  }`}
                  onClick={() => toggle(symptom.key)}
                >
                  {selected.includes(symptom.key) ? <Check size={15} /> : null}
                  {symptom.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3>3. Add context</h3>
            <div className="form-grid form-grid--three">
              <label>
                Age group
                <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)}>
                  <option>Under 5</option>
                  <option>5–17</option>
                  <option>18–64</option>
                  <option>65+</option>
                </select>
              </label>
              <label>
                Duration
                <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                  <option>Less than 24 hours</option>
                  <option>1–2 days</option>
                  <option>3–7 days</option>
                  <option>More than 1 week</option>
                </select>
              </label>
              <label>
                Self-rated severity
                <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
                  <option>Mild</option>
                  <option>Moderate</option>
                  <option>Severe</option>
                </select>
              </label>
            </div>
            <div className="selection-summary">
              <span>{selected.length} symptoms selected</span>
              <div>
                <Button
                  variant="ghost"
                  icon={<RotateCcw size={17} />}
                  onClick={() => {
                    setSelected([]);
                    setResult(null);
                  }}
                >
                  Clear
                </Button>
                <Button
                  icon={<BrainCircuit size={18} />}
                  disabled={selected.length === 0}
                  onClick={run}
                >
                  Analyse symptoms
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <aside className="assessment-result">
          {result ? (
            <div className="page-stack">
              <Card
                tone={result.urgency === "emergency" ? "critical" : "blue"}
                className="result-summary"
              >
                <Badge tone={urgencyTone[result.urgency]}>
                  {result.urgency.toUpperCase()}
                </Badge>
                <h2>{result.headline}</h2>
                <p>{result.explanation}</p>
                <div className="context-line">
                  <CalendarClock size={16} />
                  <span>
                    {ageGroup} • {duration} • {severity}
                  </span>
                </div>
                {result.urgency === "emergency" ? (
                  <a className="button button--danger" href="tel:112">
                    <PhoneCall size={18} />
                    <span>Call 112 now</span>
                  </a>
                ) : (
                  <Button icon={<Stethoscope size={18} />} onClick={onBookDoctor}>
                    Book a verified doctor
                  </Button>
                )}
              </Card>

              {result.redFlags.length ? (
                <Card tone="critical">
                  <h3>Selected warning signs</h3>
                  <ul className="clean-list">
                    {result.redFlags.map((flag) => (
                      <li key={flag}>
                        <AlertTriangle size={16} /> {flag}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <Card>
                <h3>Possible care patterns</h3>
                <p className="muted">
                  These rankings are generated from synthetic demonstration data and are
                  not diagnoses.
                </p>
                <div className="candidate-list">
                  {result.candidates.map((candidate) => (
                    <article key={candidate.key}>
                      <div>
                        <strong>{candidate.displayName}</strong>
                        <p>{candidate.description}</p>
                      </div>
                      <span>{Math.round(candidate.probability * 100)}%</span>
                    </article>
                  ))}
                </div>
              </Card>

              <Card className="model-note">
                <div>
                  <strong>Model validation label</strong>
                  <p>
                    96.55% synthetic holdout accuracy. This is not clinical performance
                    and must not be used to confirm or rule out a condition.
                  </p>
                </div>
                <ChevronRight size={18} />
              </Card>
            </div>
          ) : (
            <Card className="assessment-placeholder">
              <BrainCircuit size={44} />
              <h3>Your guidance will appear here</h3>
              <p>
                Select symptoms and context, then run the local analysis. Emergency warning
                signs always take priority.
              </p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
