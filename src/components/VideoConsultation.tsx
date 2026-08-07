import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  Camera,
  Heart,
  Languages,
  LockKeyhole,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Speaker,
  Video,
  VideoOff,
  VolumeX,
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
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [vitalsOverlay, setVitalsOverlay] = useState(true);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [bgBlur, setBgBlur] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Simulated live caption stream
  const captions = [
    `Dr. ${doctorName}: "Good day! I have opened the secure video channel."`,
    `Dr. ${doctorName}: "Could you describe when the symptoms started?"`,
    `AI Subtitle: "Translating clinician audio to active language..."`,
    `Dr. ${doctorName}: "Let us review your vitals snapshot together."`,
  ];
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    if (!subtitlesOn || !open) return;
    const interval = setInterval(() => {
      setCaptionIndex((prev) => (prev + 1) % captions.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [subtitlesOn, open]);

  // Initialize Media Stream (WebRTC getUserMedia)
  const initMedia = async () => {
    setPermissionError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        setMediaStream(stream);
        setCameraOn(true);
        setMicOn(true);
      } else {
        setPermissionError("WebRTC media devices are not supported on this browser.");
      }
    } catch (err: any) {
      console.warn("Real media device access error or permission denied:", err);
      setPermissionError(
        err?.message || "Camera and microphone access permissions are required for real video calling."
      );
    }
  };

  useEffect(() => {
    if (!open) {
      cleanupStreams();
      return;
    }
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    initMedia();

    return () => {
      window.clearInterval(timer);
      cleanupStreams();
    };
  }, [open]);

  const cleanupStreams = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
  };

  // Bind media stream to local video element
  useEffect(() => {
    if (localVideoRef.current && mediaStream) {
      localVideoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, cameraOn]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const toggleMic = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !micOn;
      });
    }
    setMicOn((prev) => !prev);
  };

  const toggleCamera = () => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = !cameraOn;
      });
    }
    setCameraOn((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setScreenSharing(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
          });
          displayStream.getVideoTracks()[0].onended = () => {
            setScreenSharing(false);
            setScreenStream(null);
          };
          setScreenStream(displayStream);
          setScreenSharing(true);
        }
      } catch (err) {
        console.warn("Screen share cancelled or failed", err);
      }
    }
  };

  const handleEndCall = () => {
    cleanupStreams();
    onClose();
  };

  if (!open) return null;
  const minutes = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div
      className="video-consultation"
      role="dialog"
      aria-modal="true"
      aria-label="Video consultation"
    >
      <div className="video-consultation__stage">
        {screenSharing && screenStream ? (
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            className="video-consultation__screen-share"
          />
        ) : (
          <img
            src="/assets/carebridge-video-doctor.webp"
            alt={`${doctorName} video consultation feed`}
            className={`video-consultation__doctor-feed ${bgBlur ? "video-blur-effect" : ""}`}
          />
        )}

        <div className="video-consultation__shade" />

        <header>
          <button
            className="video-round-button"
            onClick={handleEndCall}
            aria-label="Close consultation"
          >
            <X size={21} />
          </button>
          <strong>Telehealth AI Consultation Studio</strong>
          <span>
            <LockKeyhole size={18} />
          </span>
        </header>

        <div className="video-live-pill">
          <i /> LIVE • {minutes}:{seconds}
        </div>

        {/* Live Vitals Telemetry Overlay */}
        {vitalsOverlay ? (
          <div className="video-vitals-overlay">
            <div>
              <Heart size={14} className="pulse-icon" />
              <span>72 BPM</span>
            </div>
            <div>
              <Activity size={14} />
              <span>98% SpO2</span>
            </div>
            <div>
              <span>120/80 mmHg</span>
            </div>
          </div>
        ) : null}

        {/* Live AI Subtitles Banner */}
        {subtitlesOn ? (
          <div className="video-subtitles-banner">
            <Languages size={16} />
            <span>{captions[captionIndex]}</span>
          </div>
        ) : null}

        {/* Self View Box */}
        <div className="video-self-view">
          {cameraOn && mediaStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`video-self-view__stream ${bgBlur ? "video-blur-effect" : ""}`}
            />
          ) : (
            <div className="video-self-view__placeholder">
              <VideoOff size={28} />
              <small>{cameraOn ? "Connecting camera..." : "Camera Off"}</small>
            </div>
          )}
        </div>

        {/* Permission Warning Overlay if Media Blocked */}
        {permissionError ? (
          <div className="video-permission-notice">
            <AlertCircle size={24} />
            <div>
              <strong>Camera / Microphone Access Note</strong>
              <p>{permissionError}</p>
            </div>
            <button className="button button--secondary button--small" onClick={initMedia}>
              <RefreshCw size={15} /> Grant Permission
            </button>
          </div>
        ) : null}

        <div className="video-doctor-label">
          <strong>{doctorName}</strong>
          <span>{specialty}</span>
        </div>

        <div className="video-security-pill">
          <ShieldCheck size={14} /> WebRTC HD • 1080p Encrypted • Live AI Subtitles Active
        </div>

        {/* Call Controls */}
        <footer className="video-controls">
          <button
            className={!micOn ? "is-off" : ""}
            onClick={toggleMic}
            aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
            title={micOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button
            className={!cameraOn ? "is-off" : ""}
            onClick={toggleCamera}
            aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
            title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
          <button
            className={screenSharing ? "is-active" : ""}
            onClick={toggleScreenShare}
            aria-label="Share screen"
            title="Share Screen"
          >
            <Monitor size={22} />
          </button>
          <button
            className={subtitlesOn ? "is-active" : ""}
            onClick={() => setSubtitlesOn((prev) => !prev)}
            aria-label="Toggle AI Subtitles"
            title="AI Multilingual Subtitles"
          >
            <Languages size={22} />
          </button>
          <button
            className={vitalsOverlay ? "is-active" : ""}
            onClick={() => setVitalsOverlay((prev) => !prev)}
            aria-label="Toggle Vitals Overlay"
            title="Live Patient Vitals Stream"
          >
            <Heart size={22} />
          </button>
          <button
            className={bgBlur ? "is-active" : ""}
            onClick={() => setBgBlur((prev) => !prev)}
            aria-label="Toggle AI Background Blur"
            title="AI Virtual Background Blur"
          >
            <Sparkles size={22} />
          </button>
          <button
            className={!speakerOn ? "is-off" : ""}
            onClick={() => setSpeakerOn((current) => !current)}
            aria-label={speakerOn ? "Mute speaker" : "Unmute speaker"}
            title={speakerOn ? "Mute Speaker" : "Unmute Speaker"}
          >
            {speakerOn ? <Speaker size={22} /> : <VolumeX size={22} />}
          </button>
          <button
            className={chatOpen ? "is-active" : ""}
            onClick={() => setChatOpen((current) => !current)}
            aria-label="Toggle consultation chat"
            title="In-call Chat"
          >
            <MessageSquare size={22} />
          </button>
          <button
            className="video-controls__end"
            onClick={handleEndCall}
            aria-label="End call"
            title="End Consultation Call"
          >
            <PhoneOff size={23} />
          </button>
        </footer>

        {/* Live In-call Chat Drawer */}
        {chatOpen ? (
          <aside className="video-chat-panel">
            <header>
              <strong>Consultation chat & notes</strong>
              <button onClick={() => setChatOpen(false)} aria-label="Close chat">
                <X size={17} />
              </button>
            </header>
            <div className="video-chat-messages">
              <div className="chat-msg chat-msg--doctor">
                <p>Hello! I have opened the video consultation thread. How are you feeling today?</p>
                <small>{doctorName} • now</small>
              </div>
              {messages.map((message, index) => (
                <div key={`${message}-${index}`} className="chat-msg chat-msg--user">
                  <p>{message}</p>
                  <small>You • now</small>
                </div>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!chatDraft.trim()) return;
                setMessages((current) => [...current, chatDraft.trim()]);
                setChatDraft("");
              }}
            >
              <input
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Type a message to clinician..."
              />
              <button aria-label="Send message" type="submit">
                Send
              </button>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
