import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleStop,
  FileHeart,
  Hospital,
  Languages,
  MessageCircleHeart,
  Mic,
  Paperclip,
  Phone,
  Pill,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  Volume2,
  X,
} from "lucide-react";
import type { LanguageCode } from "../types";
import {
  createSafeLocalReply,
  isEmergencyMessage,
  requestOllamaReply,
  type ChatAction,
  type ChatHistoryItem,
} from "../services/chat";
import { Badge, Button, Card, SectionHeading, Toggle } from "./ui";

interface AdvancedChatboxProps {
  language: LanguageCode;
  onNavigate: (id: string) => void;
}

interface UiMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  time: string;
  urgent?: boolean;
  actions?: ChatAction[];
  provider?: "safety-engine" | "ollama";
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<{ 0: { transcript: string } }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const languageLocales: Record<LanguageCode, string> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  kn: "kn-IN",
  ml: "ml-IN",
};

const welcomeCopy: Record<LanguageCode, string> = {
  en: "Hello, I’m CareBridge Health Guide. I can help you organise symptoms, understand next steps, find care, manage appointments, records and medicine reminders. Tell me what is difficult today.",
  ta: "வணக்கம், நான் கேர்பிரிட்ஜ் சுகாதார வழிகாட்டி. அறிகுறிகளை ஒழுங்குபடுத்தவும், அடுத்த படியை புரிந்துகொள்ளவும், மருத்துவர், மருத்துவமனை, பதிவுகள் மற்றும் மருந்து நினைவூட்டல்களுக்கு உதவலாம்.",
  hi: "नमस्ते, मैं केयरब्रिज हेल्थ गाइड हूँ। मैं लक्षण व्यवस्थित करने, अगला कदम समझने, डॉक्टर, अस्पताल, रिकॉर्ड और दवा रिमाइंडर में मदद कर सकता हूँ।",
  te: "నమస్కారం. లక్షణాలు, తదుపరి సంరక్షణ, వైద్యులు, ఆసుపత్రులు, రికార్డులు మరియు మందుల రిమైండర్లలో నేను సహాయపడగలను.",
  bn: "নমস্কার। উপসর্গ, পরবর্তী যত্ন, ডাক্তার, হাসপাতাল, রেকর্ড ও ওষুধের রিমাইন্ডারে আমি সাহায্য করতে পারি।",
  mr: "नमस्कार. लक्षणे, पुढील काळजी, डॉक्टर, रुग्णालये, नोंदी आणि औषध स्मरणपत्रांमध्ये मी मदत करू शकतो.",
  kn: "ನಮಸ್ಕಾರ. ಲಕ್ಷಣಗಳು, ಮುಂದಿನ ಆರೈಕೆ, ವೈದ್ಯರು, ಆಸ್ಪತ್ರೆಗಳು, ದಾಖಲೆಗಳು ಮತ್ತು ಔಷಧ ಜ್ಞಾಪನೆಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಹುದು.",
  ml: "നമസ്കാരം. ലക്ഷണങ്ങൾ, തുടർ പരിചരണം, ഡോക്ടർമാർ, ആശുപത്രികൾ, രേഖകൾ, മരുന്ന് ഓർമ്മപ്പെടുത്തലുകൾ എന്നിവയിൽ സഹായിക്കാം.",
};

const prompts = [
  { label: "I have fever and cough", icon: <BrainCircuit size={16} /> },
  { label: "Find a nearby hospital", icon: <Hospital size={16} /> },
  { label: "Help with my medicine", icon: <Pill size={16} /> },
  { label: "Book a doctor", icon: <Calendar size={16} /> },
];

function now() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdvancedChatbox({
  language,
  onNavigate,
}: AdvancedChatboxProps) {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: welcomeCopy[language],
      time: now(),
      provider: "safety-engine",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [useEnhancedModel, setUseEnhancedModel] = useState(false);
  const [modelState, setModelState] = useState<
    "idle" | "connected" | "fallback"
  >("idle");
  const [listening, setListening] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setMessages((current) =>
      current.length === 1 && current[0].id === "welcome"
        ? [{ ...current[0], text: welcomeCopy[language] }]
        : current,
    );
  }, [language]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  const speechAvailable = useMemo(() => {
    const candidate = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return Boolean(
      candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition,
    );
  }, []);

  const runAction = (action: ChatAction) => {
    if (action.id === "call112") {
      window.location.href = "tel:112";
      return;
    }
    onNavigate(action.id);
  };

  const send = async (forcedText?: string) => {
    const text = (forcedText ?? draft).trim();
    if (!text || pending) return;
    const userMessage: UiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: attachment
        ? `${text}\nAttachment selected: ${attachment} (not analysed)`
        : text,
      time: now(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setAttachment(null);
    setPending(true);

    const safeReply = createSafeLocalReply(text, language);
    const mustUseSafetyReply =
      isEmergencyMessage(text) ||
      safeReply.urgency !== null ||
      safeReply.handoffRecommended ||
      safeReply.detectedSymptoms.length > 0 ||
      safeReply.actions.some((action) => action.id === "medicines");

    let responseText = safeReply.text;
    let provider: UiMessage["provider"] = "safety-engine";
    if (useEnhancedModel && !mustUseSafetyReply) {
      try {
        const history: ChatHistoryItem[] = nextMessages.map((message) => ({
          role: message.role,
          content: message.text,
        }));
        responseText = await requestOllamaReply(history);
        provider = "ollama";
        setModelState("connected");
      } catch {
        setModelState("fallback");
      }
    }

    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: responseText,
        time: now(),
        urgent: safeReply.urgency === "emergency",
        actions: safeReply.actions,
        provider,
      },
    ]);
    setPending(false);
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const candidate = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Constructor =
      candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition;
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.lang = languageLocales[language];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setDraft((current) => `${current}${current ? " " : ""}${transcript}`);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageLocales[language];
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="page-stack">
      <SectionHeading
        title="CareBridge AI Assistant"
        subtitle="100% Free clinical guidance powered by privacy-first local AI and emergency rules."
        action={
          <Badge tone="green">
            <Sparkles size={14} /> 100% Free & Unlimited
          </Badge>
        }
      />

      <Card tone="critical" className="chat-emergency-banner">
        <AlertTriangle size={21} />
        <div>
          <strong>Emergency warning signs?</strong>
          <p>Call 112 now. Do not wait for a chatbot response.</p>
        </div>
        <a className="button button--danger" href="tel:112">
          <Phone size={17} /> Call 112
        </a>
      </Card>

      <div className="health-chat-layout">
        <Card className="health-chat">
          <header className="health-chat__header">
            <span className="health-guide-avatar">
              <Sparkles size={24} />
              <i />
            </span>
            <div>
              <strong>CareBridge AI 4.0</strong>
              <small>
                {modelState === "connected"
                  ? "Local Ollama model connected • 0 API fee"
                  : modelState === "fallback"
                    ? "Safe offline AI engine • Free local model"
                    : "Safe offline AI engine • 100% Free"}
              </small>
            </div>
            <Badge tone="green">
              Free & Private
            </Badge>
          </header>

          <div
            className="health-chat__prompts"
            aria-label="Suggested questions"
          >
            {prompts.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => void send(prompt.label)}
              >
                {prompt.icon}
                {prompt.label}
              </button>
            ))}
          </div>

          <div
            className="health-chat__messages"
            ref={scrollRef}
            aria-live="polite"
          >
            {messages.map((message) => (
              <article
                key={message.id}
                className={`health-message health-message--${message.role} ${
                  message.urgent ? "health-message--urgent" : ""
                }`}
              >
                <span className="health-message__avatar">
                  {message.role === "assistant" ? (
                    <Sparkles size={18} />
                  ) : (
                    <UserRound size={18} />
                  )}
                </span>
                <div className="health-message__content">
                  {message.urgent ? (
                    <Badge tone="red">
                      <AlertTriangle size={13} /> Emergency action
                    </Badge>
                  ) : null}
                  <p>{message.text}</p>
                  {message.actions?.length ? (
                    <div className="health-message__actions">
                      {message.actions.map((action) => (
                        <button
                          key={action.id}
                          className={action.critical ? "is-critical" : ""}
                          onClick={() => runAction(action)}
                        >
                          {action.label} <ChevronRight size={14} />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <footer>
                    <span>{message.time}</span>
                    {message.role === "assistant" ? (
                      <>
                        <span>
                          {message.provider === "ollama"
                            ? "Local Ollama AI"
                            : "CareBridge Free AI Engine"}
                        </span>
                        <button
                          aria-label="Read response aloud"
                          onClick={() => speak(message.text)}
                        >
                          <Volume2 size={14} />
                        </button>
                      </>
                    ) : null}
                  </footer>
                </div>
              </article>
            ))}
            {pending ? (
              <div className="health-chat__typing">
                <span />
                <span />
                <span />
                CareBridge AI is thinking…
              </div>
            ) : null}
          </div>

          {attachment ? (
            <div className="attachment-preview">
              <FileHeart size={17} />
              <div>
                <strong>{attachment}</strong>
                <small>
                  Attachment ready for query context.
                </small>
              </div>
              <button
                className="icon-button"
                onClick={() => setAttachment(null)}
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          <footer className="health-chat__composer">
            <input
              ref={fileRef}
              hidden
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) =>
                setAttachment(event.target.files?.[0]?.name ?? null)
              }
            />
            <button
              className="icon-button"
              aria-label="Select a report"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip size={19} />
            </button>
            <label>
              <textarea
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder="Ask CareBridge AI anything (Free of cost)..."
              />
              <small>Free Health AI • Guidance only, not a medical diagnosis</small>
            </label>
            {speechAvailable ? (
              <button
                className={`icon-button ${listening ? "is-recording" : ""}`}
                aria-label={
                  listening ? "Stop voice input" : "Start voice input"
                }
                onClick={toggleVoice}
              >
                {listening ? (
                  <CircleStop size={19} />
                ) : (
                  <Mic size={19} />
                )}
              </button>
            ) : null}
            <button
              className="send-button"
              disabled={!draft.trim() || pending}
              aria-label="Send message"
              onClick={() => void send()}
            >
              <Send size={18} />
            </button>
          </footer>
        </Card>

        <aside className="health-chat-sidebar">
          <Card>
            <span className="health-chat-sidebar__icon">
              <Sparkles size={24} />
            </span>
            <h3>What I can help with</h3>
            <div className="assistant-capabilities">
              {[
                [<BrainCircuit size={17} />, "Organise symptoms and urgency"],
                [<Stethoscope size={17} />, "Prepare for a consultation"],
                [<Hospital size={17} />, "Find nearby care"],
                [<Pill size={17} />, "Explain recorded medicine plans"],
                [<FileHeart size={17} />, "Navigate reports and records"],
                [<Languages size={17} />, "Use eight Indian languages"],
              ].map(([icon, label]) => (
                <span key={label as string}>
                  {icon}
                  {label}
                  <CheckCircle2 size={15} />
                </span>
              ))}
            </div>
          </Card>

          <Card tone="blue" className="local-model-card">
            <div>
              <span className="health-chat-sidebar__icon">
                <Bot size={23} />
              </span>
              <Badge tone="blue">Optional • zero API charge</Badge>
            </div>
            <h3>Enhanced local answers</h3>
            <p>
              Connect to Ollama on the same trusted device or private backend.
              If it is unavailable, the tested safety engine continues to work.
            </p>
            <Toggle
              checked={useEnhancedModel}
              onChange={(checked) => {
                setUseEnhancedModel(checked);
                if (!checked) setModelState("idle");
              }}
              label="Use local Ollama model"
            />
          </Card>

          <Card tone="critical" className="chat-boundary-card">
            <ShieldCheck size={21} />
            <div>
              <strong>Clinical boundaries</strong>
              <p>
                No diagnosis, personalised dosage, prescription changes, live
                ICU claims, or replacement for a qualified professional.
              </p>
            </div>
          </Card>

          <Button
            variant="outline"
            icon={<Stethoscope size={18} />}
            onClick={() => onNavigate("consult")}
          >
            Hand off to a doctor
          </Button>
        </aside>
      </div>
    </div>
  );
}
