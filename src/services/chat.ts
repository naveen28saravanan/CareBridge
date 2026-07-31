import { predictSymptoms, symptomLabels } from "../ml/predict";
import type { LanguageCode, Urgency } from "../types";

export type ChatActionId =
  | "call112"
  | "symptoms"
  | "hospitals"
  | "consult"
  | "records"
  | "medicines"
  | "emergency";

export interface ChatAction {
  id: ChatActionId;
  label: string;
  critical?: boolean;
}

export interface ChatReply {
  text: string;
  urgency: Urgency | null;
  actions: ChatAction[];
  detectedSymptoms: string[];
  provider: "safety-engine" | "ollama";
  handoffRecommended: boolean;
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

const emergencyPhrases = [
  "chest pain",
  "can't breathe",
  "cannot breathe",
  "severe breathlessness",
  "unconscious",
  "not waking",
  "fainted",
  "fainting",
  "seizure",
  "heavy bleeding",
  "severe bleeding",
  "face drooping",
  "one side weak",
  "stroke",
  "suicide",
  "kill myself",
  "self harm",
  "overdose",
  "facial swelling",
  "throat swelling",
  "pregnant and bleeding",
  "heavy bleeding in pregnancy",
  "baby not moving",
  "நெஞ்சு வலி",
  "மூச்சு விட முடியவில்லை",
  "மயக்கம்",
  "வலிப்பு",
  "அதிக இரத்தப்போக்கு",
  "தற்கொலை",
  "முக வீக்கம்",
  "கர்ப்பத்தில் இரத்தப்போக்கு",
  "सीने में दर्द",
  "सांस नहीं",
  "बेहोश",
  "दौरा",
  "बहुत खून",
  "आत्महत्या",
  "चेहरे पर सूजन",
  "गर्भावस्था में खून",
];

const symptomKeywords: Record<string, string[]> = {
  fever: ["fever", "temperature", "காய்ச்சல்", "बुखार"],
  cough: ["cough", "இருமல்", "खांसी"],
  sore_throat: ["sore throat", "throat pain", "தொண்டை வலி", "गले में दर्द"],
  runny_nose: ["runny nose", "மூக்கு ஒழுகுதல்", "नाक बहना"],
  sneezing: ["sneezing", "தும்மல்", "छींक"],
  headache: ["headache", "தலைவலி", "सिरदर्द"],
  one_sided_headache: ["one-sided headache", "migraine", "ஒற்றைத் தலைவலி", "माइग्रेन"],
  light_sensitivity: ["light sensitivity", "photophobia", "ஒளி ஒவ்வாமை", "रोशनी से परेशानी"],
  body_ache: ["body ache", "body pain", "உடல் வலி", "बदन दर्द"],
  fatigue: ["fatigue", "tired", "weakness", "சோர்வு", "थकान"],
  nausea: ["nausea", "queasy", "குமட்டல்", "जी मिचलाना"],
  vomiting: ["vomiting", "vomit", "வாந்தி", "उल्टी"],
  diarrhea: ["diarrhea", "diarrhoea", "loose motion", "வயிற்றுப்போக்கு", "दस्त"],
  abdominal_pain: ["stomach pain", "abdominal pain", "வயிற்று வலி", "पेट दर्द"],
  chest_tightness: ["chest tightness", "மார்பு இறுக்கம்", "सीने में जकड़न"],
  breathlessness: ["breathless", "short of breath", "மூச்சுத்திணறல்", "सांस फूलना"],
  wheezing: ["wheezing", "வீசிங்", "घरघराहट"],
  rash: ["rash", "சொறி", "चकत्ते"],
  itching: ["itching", "itchy", "அரிப்பு", "खुजली"],
  swelling: ["swelling", "வீக்கம்", "सूजन"],
  burning_urination: ["burning urination", "burning urine", "சிறுநீர் எரிச்சல்", "पेशाब में जलन"],
  frequent_urination: ["frequent urination", "சிறுநீர் அடிக்கடி", "बार बार पेशाब"],
  back_pain: ["back pain", "முதுகு வலி", "कमर दर्द"],
  joint_pain: ["joint pain", "மூட்டு வலி", "जोड़ों का दर्द"],
  dizziness: ["dizziness", "dizzy", "தலைச்சுற்றல்", "चक्कर"],
  dry_mouth: ["dry mouth", "வாய் வறட்சி", "मुंह सूखना"],
  reduced_urine: ["reduced urine", "less urine", "சிறுநீர் குறைவு", "कम पेशाब"],
  eye_redness: ["red eye", "eye redness", "கண் சிவப்பு", "आंख लाल"],
  eye_discharge: ["eye discharge", "கண் சீழ்", "आंख से पानी"],
  ear_pain: ["ear pain", "காது வலி", "कान दर्द"],
  hearing_change: ["hearing change", "hearing loss", "கேட்கும் திறன்", "सुनाई कम"],
  recent_strain: ["recent strain", "minor injury", "சிறிய காயம்", "हल्की चोट"],
  skin_pain: ["skin pain", "தோல் வலி", "त्वचा दर्द"],
  loss_of_smell: ["loss of smell", "மணம் தெரியவில்லை", "गंध नहीं"],
  severe_breathlessness: ["severe breathlessness", "cannot breathe", "can't breathe"],
  chest_pain: ["chest pain", "நெஞ்சு வலி", "सीने में दर्द"],
  confusion: ["confusion", "disoriented", "குழப்பம்", "भ्रम"],
  fainting: ["fainting", "fainted", "மயக்கம்", "बेहोश"],
  severe_bleeding: ["severe bleeding", "heavy bleeding", "அதிக இரத்தப்போக்கு", "बहुत खून"],
  seizure: ["seizure", "வலிப்பு", "दौरा"],
  facial_droop: ["facial droop", "face drooping", "முகம் கோணல்", "चेहरा टेढ़ा"],
  sudden_weakness: ["one side weak", "sudden weakness", "ஒருபக்க பலவீனம்", "एक तरफ कमजोरी"],
};

const replyCopy = {
  en: {
    emergency:
      "This may be an emergency. Call 112 now or go to the nearest emergency department. If it is safe, stay with the person, unlock the door, and share the location. Do not wait for this chat.",
    symptomIntro: "I found these reported symptoms:",
    possible: "Possible care patterns to discuss with a clinician:",
    urgent: "Please seek urgent medical assessment today.",
    soon: "Please arrange a clinician consultation soon, especially if symptoms worsen.",
    routine: "Monitor the symptoms and arrange routine care if they persist or concern you.",
    medication:
      "I can explain a prescription and help with reminders, but I cannot start, stop, replace, or change a dose. Contact the prescriber or pharmacist for a medicine decision. If there is a severe reaction, breathing difficulty, fainting, or facial swelling, call 112.",
    hospital:
      "I can open nearby hospital discovery. Map results show location data; ICU and emergency availability must show a verified source and timestamp. If status is stale or unknown, call the hospital before travelling.",
    appointment:
      "I can help you search verified fictional clinician profiles, choose a consultation mode, and book a demo slot.",
    records:
      "I can help you find, upload, and organise records. This prototype stores only a filename; production uploads require encryption, malware scanning, consent, and access logs.",
    distress:
      "I’m sorry you’re going through this. If you may hurt yourself or someone else, or you are in immediate danger, call 112 now and stay with a trusted person. I can also help you reach a clinician.",
    general:
      "I can help with symptoms, medicines, test preparation, appointments, health records, nearby hospitals, first aid, and care navigation. Tell me what is happening, when it started, how severe it is, your age group, and any pregnancy or major medical conditions. Do not include names, phone numbers, or IDs in this demo.",
    noSymptoms:
      "I could not safely match a symptom yet. Tell me the main symptom, when it started, severity from 0–10, and whether there is chest pain, severe breathing trouble, fainting, confusion, seizure, sudden weakness, or heavy bleeding.",
  },
  ta: {
    emergency:
      "இது அவசரநிலையாக இருக்கலாம். உடனே 112-ஐ அழைக்கவும் அல்லது அருகிலுள்ள அவசர சிகிச்சைப் பிரிவுக்குச் செல்லவும். இந்த உரையாடலுக்காக காத்திருக்க வேண்டாம்.",
    symptomIntro: "நீங்கள் கூறிய அறிகுறிகள்:",
    possible: "மருத்துவருடன் பேச வேண்டிய சாத்தியமான பராமரிப்பு வடிவங்கள்:",
    urgent: "இன்றே அவசர மருத்துவ மதிப்பீடு பெறவும்.",
    soon: "அறிகுறிகள் மோசமடைந்தால் உடனடியாக, இல்லையெனில் விரைவில் மருத்துவரை அணுகவும்.",
    routine: "அறிகுறிகளை கவனித்து, நீடித்தால் வழக்கமான மருத்துவ ஆலோசனை பெறவும்.",
    medication:
      "மருந்துச் சீட்டை விளக்கவும் நினைவூட்டலுக்கும் உதவலாம்; ஆனால் மருந்தை தொடங்க, நிறுத்த அல்லது அளவை மாற்ற முடியாது. மருத்துவர் அல்லது மருந்தாளரை தொடர்புகொள்ளவும்.",
    hospital:
      "அருகிலுள்ள மருத்துவமனைகளைத் திறக்கலாம். ICU மற்றும் அவசர வசதி சரிபார்க்கப்பட்ட மூலம் மற்றும் நேரத்துடன் மட்டுமே காட்டப்படும்; இல்லையெனில் மருத்துவமனைக்கு அழைத்து உறுதிப்படுத்தவும்.",
    appointment: "சரிபார்க்கப்பட்ட மருத்துவரை தேடி ஆலோசனை நேரம் முன்பதிவு செய்ய உதவலாம்.",
    records: "மருத்துவ பதிவுகளைத் தேட, பதிவேற்ற மற்றும் ஒழுங்குபடுத்த உதவலாம்.",
    distress:
      "நீங்கள் இதை எதிர்கொள்வது வருத்தமளிக்கிறது. உடனடி ஆபத்து அல்லது தற்காய எண்ணம் இருந்தால் 112-ஐ அழைத்து நம்பகமான ஒருவருடன் இருங்கள்.",
    general:
      "அறிகுறிகள், மருந்துகள், பரிசோதனை தயாரிப்பு, மருத்துவர் முன்பதிவு, பதிவுகள், மருத்துவமனைகள், முதலுதவி மற்றும் வழிநடத்தலில் உதவலாம். முக்கிய அறிகுறி, தொடங்கிய நேரம் மற்றும் தீவிரத்தை கூறுங்கள்.",
    noSymptoms:
      "அறிகுறியை பாதுகாப்பாக பொருத்த முடியவில்லை. முக்கிய அறிகுறி, தொடங்கிய நேரம், 0–10 தீவிரம் மற்றும் அவசர எச்சரிக்கை அறிகுறிகள் உள்ளதா என்று கூறுங்கள்.",
  },
  hi: {
    emergency:
      "यह आपातकाल हो सकता है। अभी 112 पर कॉल करें या नज़दीकी आपातकालीन विभाग जाएँ। इस चैट का इंतज़ार न करें।",
    symptomIntro: "आपके बताए लक्षण:",
    possible: "डॉक्टर से चर्चा करने योग्य संभावित देखभाल पैटर्न:",
    urgent: "आज ही तत्काल चिकित्सकीय जाँच कराएँ।",
    soon: "लक्षण बढ़ें तो तुरंत, अन्यथा जल्द डॉक्टर से परामर्श लें।",
    routine: "लक्षणों पर नज़र रखें और बने रहें तो नियमित परामर्श लें।",
    medication:
      "मैं पर्चे को समझाने और रिमाइंडर में मदद कर सकता हूँ, लेकिन दवा शुरू, बंद, बदल या खुराक तय नहीं कर सकता। डॉक्टर या फार्मासिस्ट से संपर्क करें।",
    hospital:
      "मैं नज़दीकी अस्पताल खोज खोल सकता हूँ। ICU और इमरजेंसी उपलब्धता केवल सत्यापित स्रोत और समय के साथ दिखाई जाएगी; अन्यथा अस्पताल को कॉल करके पुष्टि करें।",
    appointment: "मैं सत्यापित डॉक्टर प्रोफ़ाइल खोजने और डेमो अपॉइंटमेंट बुक करने में मदद कर सकता हूँ।",
    records: "मैं रिकॉर्ड खोजने, अपलोड करने और व्यवस्थित करने में मदद कर सकता हूँ।",
    distress:
      "आप यह झेल रहे हैं, इसका मुझे दुख है। यदि तुरंत खतरा या स्वयं को नुकसान पहुँचाने का विचार है, तो अभी 112 पर कॉल करें और किसी भरोसेमंद व्यक्ति के साथ रहें।",
    general:
      "मैं लक्षण, दवाइयाँ, टेस्ट तैयारी, अपॉइंटमेंट, रिकॉर्ड, नज़दीकी अस्पताल, प्राथमिक उपचार और देखभाल मार्गदर्शन में मदद कर सकता हूँ। मुख्य समस्या, कब शुरू हुई और गंभीरता बताइए।",
    noSymptoms:
      "मैं अभी किसी लक्षण का सुरक्षित मिलान नहीं कर पाया। मुख्य लक्षण, कब शुरू हुआ, 0–10 गंभीरता और कोई आपात चेतावनी संकेत बताइए।",
  },
} as const;

function copyFor(language: LanguageCode) {
  return replyCopy[language === "ta" || language === "hi" ? language : "en"];
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function detectSymptoms(message: string): string[] {
  const normalised = message.toLocaleLowerCase();
  return Object.entries(symptomKeywords)
    .filter(([, keywords]) => includesAny(normalised, keywords))
    .map(([key]) => key);
}

export function isEmergencyMessage(message: string): boolean {
  const normalised = message.toLocaleLowerCase();
  return includesAny(normalised, emergencyPhrases);
}

export function createSafeLocalReply(
  message: string,
  language: LanguageCode = "en",
): ChatReply {
  const text = message.trim().toLocaleLowerCase();
  const copy = copyFor(language);

  if (isEmergencyMessage(text)) {
    return {
      text: copy.emergency,
      urgency: "emergency",
      actions: [
        { id: "call112", label: "Call 112 now", critical: true },
        { id: "emergency", label: "Open first aid", critical: true },
        { id: "hospitals", label: "Nearest hospitals" },
      ],
      detectedSymptoms: detectSymptoms(text),
      provider: "safety-engine",
      handoffRecommended: true,
    };
  }

  if (
    includesAny(text, [
      "sad",
      "anxious",
      "panic",
      "depressed",
      "hopeless",
      "mental health",
      "மன அழுத்தம்",
      "चिंता",
      "उदास",
    ])
  ) {
    return {
      text: copy.distress,
      urgency: "urgent",
      actions: [
        { id: "consult", label: "Talk to a clinician" },
        { id: "call112", label: "Call 112 if in danger", critical: true },
      ],
      detectedSymptoms: [],
      provider: "safety-engine",
      handoffRecommended: true,
    };
  }

  if (
    includesAny(text, [
      "medicine",
      "tablet",
      "capsule",
      "dose",
      "dosage",
      "stop taking",
      "side effect",
      "மருந்து",
      "மாத்திரை",
      "दवा",
      "खुराक",
    ])
  ) {
    return {
      text: copy.medication,
      urgency: null,
      actions: [
        { id: "medicines", label: "Open medicine plan" },
        { id: "consult", label: "Ask a clinician" },
      ],
      detectedSymptoms: [],
      provider: "safety-engine",
      handoffRecommended: true,
    };
  }

  if (
    includesAny(text, [
      "hospital",
      "icu",
      "emergency room",
      "casualty",
      "medical college",
      "மருத்துவமனை",
      "अस्पताल",
    ])
  ) {
    return {
      text: copy.hospital,
      urgency: null,
      actions: [
        { id: "hospitals", label: "Find nearby hospitals" },
        { id: "call112", label: "Call 112 if immediate danger", critical: true },
      ],
      detectedSymptoms: [],
      provider: "safety-engine",
      handoffRecommended: false,
    };
  }

  if (
    includesAny(text, [
      "appointment",
      "doctor",
      "consult",
      "specialist",
      "மருத்துவர்",
      "अपॉइंटमेंट",
      "डॉक्टर",
    ])
  ) {
    return {
      text: copy.appointment,
      urgency: null,
      actions: [{ id: "consult", label: "Find a doctor" }],
      detectedSymptoms: [],
      provider: "safety-engine",
      handoffRecommended: false,
    };
  }

  if (
    includesAny(text, [
      "record",
      "report",
      "prescription",
      "test result",
      "பதிவு",
      "रिपोर्ट",
      "रिकॉर्ड",
    ])
  ) {
    return {
      text: copy.records,
      urgency: null,
      actions: [{ id: "records", label: "Open health records" }],
      detectedSymptoms: [],
      provider: "safety-engine",
      handoffRecommended: false,
    };
  }

  const detectedSymptoms = detectSymptoms(text);
  if (detectedSymptoms.length > 0) {
    const result = predictSymptoms(detectedSymptoms);
    const labels = detectedSymptoms
      .map((item) => symptomLabels[item] ?? item)
      .join(", ");
    const patterns = result.candidates
      .slice(0, 2)
      .map((candidate) => candidate.displayName)
      .join(" • ");
    const urgencyText =
      result.urgency === "urgent"
        ? copy.urgent
        : result.urgency === "soon"
          ? copy.soon
          : copy.routine;
    return {
      text: `${copy.symptomIntro} ${labels}. ${copy.possible} ${patterns}. ${urgencyText} This is a synthetic-model pattern match, not a diagnosis.`,
      urgency: result.urgency,
      actions: [
        { id: "symptoms", label: "Review full symptom assessment" },
        { id: "consult", label: "Book a clinician" },
      ],
      detectedSymptoms,
      provider: "safety-engine",
      handoffRecommended: result.urgency === "urgent" || result.urgency === "soon",
    };
  }

  const isShortGreeting = includesAny(text, [
    "hello",
    "hi",
    "hey",
    "வணக்கம்",
    "नमस्ते",
  ]);
  return {
    text: isShortGreeting ? copy.general : `${copy.noSymptoms} ${copy.general}`,
    urgency: null,
    actions: [
      { id: "symptoms", label: "Guided symptom check" },
      { id: "consult", label: "Talk to a clinician" },
    ],
    detectedSymptoms: [],
    provider: "safety-engine",
    handoffRecommended: false,
  };
}

const ollamaSystemPrompt = `You are CareBridge Health Guide for a patient app in India.
Give concise, calm, plain-language health education and care navigation only.
Never diagnose, claim certainty, prescribe, recommend starting or stopping a medicine, or provide a personalised dosage.
Never claim that an ambulance, hospital bed, ICU bed, doctor, or appointment is confirmed.
For chest pain, severe breathing difficulty, unconsciousness, seizure, stroke signs, severe bleeding, overdose, self-harm risk, pregnancy emergency, or a very ill child, tell the user to call India's emergency number 112 now and seek emergency care.
Ask at most two useful follow-up questions. Encourage a qualified clinician when personalised assessment is needed.
Do not request names, phone numbers, government IDs, addresses, or other identifying information.
Keep the answer below 150 words and use the language used by the patient.
End with: "Guidance only — not a diagnosis."`;

export async function requestOllamaReply(
  history: ChatHistoryItem[],
  signal?: AbortSignal,
): Promise<string> {
  const baseUrl =
    (import.meta.env.VITE_OLLAMA_URL as string | undefined) ?? "/ollama";
  const model =
    (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? "gemma3:4b";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: ollamaSystemPrompt },
        ...history.slice(-10),
      ],
      options: {
        temperature: 0.2,
        num_predict: 260,
      },
    }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Local model returned ${response.status}`);
  }
  const payload = (await response.json()) as {
    message?: { content?: string };
  };
  const content = payload.message?.content?.trim();
  if (!content) {
    throw new Error("Local model returned an empty response");
  }
  return content;
}
