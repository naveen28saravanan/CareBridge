import artifact from "../data/symptom-model.json";
import type { PredictionCandidate, SymptomResult, Urgency } from "../types";

const emergencyLabels: Record<string, string> = {
  severe_breathlessness: "Severe difficulty breathing",
  chest_pain: "New or severe chest pain",
  confusion: "New confusion",
  fainting: "Fainting or unresponsiveness",
  severe_bleeding: "Severe uncontrolled bleeding",
  seizure: "A seizure",
  facial_droop: "Sudden facial droop",
  sudden_weakness: "Sudden one-sided weakness",
};

export const redFlagSymptoms = Object.keys(emergencyLabels);

export const symptomLabels: Record<string, string> = {
  fever: "Fever",
  cough: "Cough",
  sore_throat: "Sore throat",
  runny_nose: "Runny nose",
  sneezing: "Sneezing",
  headache: "Headache",
  one_sided_headache: "One-sided headache",
  light_sensitivity: "Light sensitivity",
  body_ache: "Body ache",
  fatigue: "Fatigue",
  nausea: "Nausea",
  vomiting: "Vomiting",
  diarrhea: "Diarrhoea",
  abdominal_pain: "Abdominal pain",
  chest_tightness: "Chest tightness",
  breathlessness: "Breathlessness",
  wheezing: "Wheezing",
  rash: "Rash",
  itching: "Itching",
  swelling: "Swelling",
  burning_urination: "Burning urination",
  frequent_urination: "Frequent urination",
  back_pain: "Back pain",
  joint_pain: "Joint pain",
  dizziness: "Dizziness",
  dry_mouth: "Dry mouth",
  reduced_urine: "Reduced urine",
  eye_redness: "Eye redness",
  eye_discharge: "Eye discharge",
  ear_pain: "Ear pain",
  hearing_change: "Hearing change",
  recent_strain: "Recent strain or minor injury",
  skin_pain: "Painful skin",
  loss_of_smell: "Loss of smell",
  severe_breathlessness: "Severe difficulty breathing",
  chest_pain: "New or severe chest pain",
  confusion: "New confusion",
  fainting: "Fainting or unresponsiveness",
  severe_bleeding: "Severe uncontrolled bleeding",
  seizure: "Seizure",
  facial_droop: "Sudden facial droop",
  sudden_weakness: "Sudden one-sided weakness",
};

export const selectableSymptoms = [
  ...artifact.features,
  ...redFlagSymptoms,
].map((key) => ({ key, label: symptomLabels[key] ?? key }));

function softmax(scores: number[]): number[] {
  const maxScore = Math.max(...scores);
  const exponents = scores.map((score) => Math.exp(score - maxScore));
  const total = exponents.reduce((sum, value) => sum + value, 0);
  return exponents.map((value) => value / total);
}

function urgencyCopy(urgency: Urgency): { headline: string; explanation: string } {
  switch (urgency) {
    case "emergency":
      return {
        headline: "Emergency warning signs selected",
        explanation:
          "Call 112 now or go to the nearest emergency department. Do not wait for an app result.",
      };
    case "urgent":
      return {
        headline: "Prompt medical assessment recommended",
        explanation:
          "Contact a clinician now or seek urgent care today, especially if symptoms worsen.",
      };
    case "soon":
      return {
        headline: "Consult a clinician soon",
        explanation:
          "Arrange a medical consultation and share this symptom summary with the clinician.",
      };
    default:
      return {
        headline: "Routine care may be appropriate",
        explanation:
          "Monitor your symptoms and arrange routine care if they persist, recur or concern you.",
      };
  }
}

export function predictSymptoms(selectedSymptoms: string[]): SymptomResult {
  const selected = new Set(selectedSymptoms);
  const redFlags = redFlagSymptoms
    .filter((key) => selected.has(key))
    .map((key) => emergencyLabels[key]);

  const vector = artifact.features.map((feature) => (selected.has(feature) ? 1 : 0));
  const scores = artifact.coefficients.map((coefficients, classIndex) =>
    coefficients.reduce(
      (score, weight, index) => score + weight * vector[index],
      artifact.intercepts[classIndex],
    ),
  );
  const probabilities = softmax(scores);
  const candidates: PredictionCandidate[] = artifact.classes
    .map((item, index) => ({
      key: item.key,
      displayName: item.displayName,
      description: item.description,
      modelUrgency: item.urgency as PredictionCandidate["modelUrgency"],
      probability: probabilities[index],
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  let urgency: Urgency;
  if (redFlags.length > 0) {
    urgency = "emergency";
  } else if (candidates[0]?.modelUrgency === "urgent") {
    urgency = "urgent";
  } else if (candidates[0]?.modelUrgency === "soon") {
    urgency = "soon";
  } else {
    urgency = "routine";
  }

  const copy = urgencyCopy(urgency);
  return {
    urgency,
    headline: copy.headline,
    explanation: copy.explanation,
    redFlags,
    candidates,
    selectedSymptoms,
    generatedAt: new Date().toISOString(),
    modelDatasetType: artifact.metrics.datasetType,
    disclaimer: artifact.disclaimer,
  };
}
