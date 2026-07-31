"""Train CareBridge's demonstration symptom-pattern model.

The generated records are synthetic and intentionally labelled as such. The
model is suitable only for testing product flows; it is not a diagnostic model
and its holdout metrics are not clinical evidence.
"""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "src" / "data" / "symptom-model.json"
REPORT_DIR = ROOT / "ml" / "reports"
SEED = 20260727

FEATURES = [
    "fever",
    "cough",
    "sore_throat",
    "runny_nose",
    "sneezing",
    "headache",
    "one_sided_headache",
    "light_sensitivity",
    "body_ache",
    "fatigue",
    "nausea",
    "vomiting",
    "diarrhea",
    "abdominal_pain",
    "chest_tightness",
    "breathlessness",
    "wheezing",
    "rash",
    "itching",
    "swelling",
    "burning_urination",
    "frequent_urination",
    "back_pain",
    "joint_pain",
    "dizziness",
    "dry_mouth",
    "reduced_urine",
    "eye_redness",
    "eye_discharge",
    "ear_pain",
    "hearing_change",
    "recent_strain",
    "skin_pain",
    "loss_of_smell",
]


@dataclass(frozen=True)
class Pattern:
    key: str
    display_name: str
    urgency: str
    description: str
    probabilities: dict[str, float]


PATTERNS = [
    Pattern(
        "common_cold_pattern",
        "Common cold–like pattern",
        "routine",
        "Upper-respiratory symptoms often seen with a common cold.",
        {
            "cough": 0.72,
            "sore_throat": 0.72,
            "runny_nose": 0.9,
            "sneezing": 0.78,
            "fever": 0.18,
            "fatigue": 0.35,
        },
    ),
    Pattern(
        "flu_like_pattern",
        "Flu-like pattern",
        "soon",
        "A feverish respiratory pattern that should be reviewed if severe or persistent.",
        {
            "fever": 0.9,
            "cough": 0.72,
            "sore_throat": 0.52,
            "headache": 0.62,
            "body_ache": 0.88,
            "fatigue": 0.9,
        },
    ),
    Pattern(
        "migraine_pattern",
        "Migraine-like headache pattern",
        "soon",
        "A headache pattern with light sensitivity or nausea.",
        {
            "headache": 0.96,
            "one_sided_headache": 0.82,
            "light_sensitivity": 0.8,
            "nausea": 0.58,
            "dizziness": 0.34,
        },
    ),
    Pattern(
        "gastroenteritis_pattern",
        "Gastrointestinal infection–like pattern",
        "soon",
        "Vomiting or diarrhoea with possible dehydration risk.",
        {
            "nausea": 0.76,
            "vomiting": 0.78,
            "diarrhea": 0.9,
            "abdominal_pain": 0.76,
            "fever": 0.38,
            "dry_mouth": 0.38,
        },
    ),
    Pattern(
        "allergy_pattern",
        "Allergy-like pattern",
        "routine",
        "Sneezing, itching or rash commonly seen with allergic reactions.",
        {
            "sneezing": 0.9,
            "itching": 0.78,
            "runny_nose": 0.82,
            "eye_redness": 0.52,
            "rash": 0.42,
            "swelling": 0.18,
        },
    ),
    Pattern(
        "asthma_pattern",
        "Airway narrowing–like pattern",
        "urgent",
        "Breathing or wheezing symptoms that need prompt clinical assessment.",
        {
            "breathlessness": 0.88,
            "wheezing": 0.92,
            "chest_tightness": 0.82,
            "cough": 0.64,
            "fatigue": 0.28,
        },
    ),
    Pattern(
        "urinary_pattern",
        "Urinary symptom pattern",
        "soon",
        "Burning or frequent urination that may need a clinician and testing.",
        {
            "burning_urination": 0.94,
            "frequent_urination": 0.88,
            "abdominal_pain": 0.42,
            "back_pain": 0.34,
            "fever": 0.22,
        },
    ),
    Pattern(
        "musculoskeletal_pattern",
        "Muscle or joint strain pattern",
        "routine",
        "Pain associated with movement, strain or a minor musculoskeletal injury.",
        {
            "recent_strain": 0.9,
            "back_pain": 0.62,
            "joint_pain": 0.66,
            "swelling": 0.36,
            "body_ache": 0.38,
        },
    ),
    Pattern(
        "skin_inflammation_pattern",
        "Skin inflammation pattern",
        "soon",
        "A painful, itchy or swollen skin pattern that may need visual assessment.",
        {
            "rash": 0.86,
            "skin_pain": 0.64,
            "itching": 0.62,
            "swelling": 0.58,
            "fever": 0.2,
        },
    ),
    Pattern(
        "dehydration_pattern",
        "Dehydration-like pattern",
        "urgent",
        "Reduced fluids or fluid loss with dizziness and low urine output.",
        {
            "dizziness": 0.8,
            "dry_mouth": 0.94,
            "reduced_urine": 0.88,
            "fatigue": 0.72,
            "headache": 0.44,
            "vomiting": 0.32,
            "diarrhea": 0.32,
        },
    ),
    Pattern(
        "eye_irritation_pattern",
        "Eye irritation pattern",
        "soon",
        "Redness, discharge or itching that may need an eye examination.",
        {
            "eye_redness": 0.94,
            "eye_discharge": 0.8,
            "itching": 0.58,
            "light_sensitivity": 0.3,
            "headache": 0.18,
        },
    ),
    Pattern(
        "ear_symptom_pattern",
        "Ear symptom pattern",
        "soon",
        "Ear pain or hearing change that may need an examination.",
        {
            "ear_pain": 0.94,
            "hearing_change": 0.72,
            "fever": 0.34,
            "dizziness": 0.28,
            "sore_throat": 0.2,
        },
    ),
]


def make_dataset(samples_per_class: int = 700) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(SEED)
    rows: list[list[int]] = []
    labels: list[str] = []

    for pattern in PATTERNS:
        for _ in range(samples_per_class):
            row: list[int] = []
            for feature in FEATURES:
                probability = pattern.probabilities.get(feature, 0.025)
                # Small per-record variation makes the demo split less mechanical.
                probability = float(np.clip(probability + rng.normal(0, 0.035), 0.005, 0.98))
                row.append(int(rng.random() < probability))

            if not any(row):
                strongest = max(
                    pattern.probabilities,
                    key=pattern.probabilities.__getitem__,
                )
                row[FEATURES.index(strongest)] = 1

            rows.append(row)
            labels.append(pattern.key)

    return np.asarray(rows, dtype=np.float64), np.asarray(labels)


def write_confusion_matrix(matrix: np.ndarray, classes: list[str]) -> None:
    path = REPORT_DIR / "confusion_matrix.csv"
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["actual/predicted", *classes])
        for label, row in zip(classes, matrix, strict=True):
            writer.writerow([label, *[int(value) for value in row]])


def train() -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    x, y = make_dataset()
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=SEED,
        stratify=y,
    )

    model = LogisticRegression(
        max_iter=2500,
        C=2.0,
        class_weight="balanced",
        random_state=SEED,
    )
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)

    accuracy = float(accuracy_score(y_test, predictions))
    macro_f1 = float(f1_score(y_test, predictions, average="macro"))
    report = classification_report(
        y_test,
        predictions,
        labels=model.classes_,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(y_test, predictions, labels=model.classes_)
    write_confusion_matrix(matrix, list(model.classes_))

    pattern_by_key = {pattern.key: pattern for pattern in PATTERNS}
    class_metadata = [
        {
            "key": class_key,
            "displayName": pattern_by_key[class_key].display_name,
            "urgency": pattern_by_key[class_key].urgency,
            "description": pattern_by_key[class_key].description,
        }
        for class_key in model.classes_
    ]

    trained_at = datetime.now(UTC).isoformat()
    metrics = {
        "datasetType": "synthetic-demonstration",
        "seed": SEED,
        "sampleCount": int(len(x)),
        "trainCount": int(len(x_train)),
        "testCount": int(len(x_test)),
        "accuracy": round(accuracy, 6),
        "macroF1": round(macro_f1, 6),
        "perClass": report,
        "warning": (
            "Metrics measure separation in synthetic holdout data only. "
            "They are not clinical accuracy, safety or effectiveness evidence."
        ),
        "trainedAt": trained_at,
    }

    artifact = {
        "schemaVersion": 1,
        "modelType": "multinomial-logistic-regression",
        "purpose": "demonstration symptom-pattern ranking",
        "disclaimer": (
            "Guidance only — not a diagnosis. This model was trained on synthetic "
            "demonstration data and must not be used for clinical decisions."
        ),
        "features": FEATURES,
        "classes": class_metadata,
        "coefficients": model.coef_.round(10).tolist(),
        "intercepts": model.intercept_.round(10).tolist(),
        "metrics": {
            "datasetType": metrics["datasetType"],
            "sampleCount": metrics["sampleCount"],
            "testCount": metrics["testCount"],
            "accuracy": metrics["accuracy"],
            "macroF1": metrics["macroF1"],
            "trainedAt": trained_at,
        },
    }

    MODEL_PATH.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    (REPORT_DIR / "metrics.json").write_text(
        json.dumps(metrics, indent=2),
        encoding="utf-8",
    )

    print(f"model={MODEL_PATH}")
    print(f"synthetic_holdout_accuracy={accuracy:.4f}")
    print(f"synthetic_holdout_macro_f1={macro_f1:.4f}")
    print("clinical_validity=false")


if __name__ == "__main__":
    train()
