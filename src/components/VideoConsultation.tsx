import { useEffect, useState } from "react";
import {
  LockKeyhole,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Speaker,
  Video,
  VideoOff,
  X,
} from "lucide-react";

interface VideoConsultationProps {
  open: boolean;
  doctorName: string;
  specialty: string;
  onClose: () => void;
}

export function VideoConsultation({
  open,
  doctorName,
  specialty,
  onClose,
}: VideoConsultationProps) {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) return;
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) return null;
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const seconds = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="video-consultation" role="dialog" aria-modal="true" aria-label="Video consultation">
      <div className="video-consultation__stage">
        <img src="/assets/carebridge-video-doctor.webp" alt="Fictional doctor in a video consultation" />
        <div className="video-consultation__shade" />
        <header>
          <button className="video-round-button" onClick={onClose} aria-label="Close consultation"><X size={21} /></button>
          <strong>Video consultation</strong>
          <span><LockKeyhole size={18} /></span>
        </header>
        <div className="video-live-pill"><i /> LIVE • {minutes}:{seconds}</div>
        <div className="video-self-view">
          {cameraOn ? <img src="/assets/carebridge-patient-self.webp" alt="Patient self view" /> : <VideoOff size={24} />}
        </div>
        <div className="video-doctor-label">
          <strong>{doctorName}</strong>
          <span>{specialty}</span>
        </div>
        <div className="video-security-pill"><ShieldCheck size={14} /> Secure demo • HD interface</div>
        <footer className="video-controls">
          <button className={!micOn ? "is-off" : ""} onClick={() => setMicOn((current) => !current)} aria-label={micOn ? "Mute microphone" : "Unmute microphone"}>{micOn ? <Mic size={22} /> : <MicOff size={22} />}</button>
          <button className={!cameraOn ? "is-off" : ""} onClick={() => setCameraOn((current) => !current)} aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}>{cameraOn ? <Video size={22} /> : <VideoOff size={22} />}</button>
          <button className={!speakerOn ? "is-off" : ""} onClick={() => setSpeakerOn((current) => !current)} aria-label={speakerOn ? "Mute speaker" : "Unmute speaker"}><Speaker size={22} /></button>
          <button className={chatOpen ? "is-active" : ""} onClick={() => setChatOpen((current) => !current)} aria-label="Toggle consultation chat"><MessageSquare size={22} /></button>
          <button className="video-controls__end" onClick={onClose} aria-label="End call"><PhoneOff size={23} /></button>
        </footer>
        {chatOpen ? (
          <aside className="video-chat-panel">
            <header><strong>Consultation chat</strong><button onClick={() => setChatOpen(false)}><X size={17} /></button></header>
            <div><p>Please describe how you are feeling today.</p><small>Doctor • now</small></div>
            {messages.map((message, index) => <div key={`${message}-${index}`}><p>{message}</p><small>You • now</small></div>)}
            <form onSubmit={(event) => { event.preventDefault(); if (!chatDraft.trim()) return; setMessages((current) => [...current, chatDraft.trim()]); setChatDraft(""); }}><input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Type a message" /><button aria-label="Send message" type="submit">Send</button></form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
