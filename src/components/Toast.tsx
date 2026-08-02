import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

export type ToastTone = "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastContextType {
  showToast: (title: string, message?: string, tone?: ToastTone, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (title: string, message?: string, tone: ToastTone = "info", duration: number = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastMessage = { id, title, message, tone, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-item--${toast.tone || "info"}`}>
            <span className="toast-item__icon">
              {toast.tone === "success" ? (
                <CheckCircle2 size={20} />
              ) : toast.tone === "warning" ? (
                <AlertTriangle size={20} />
              ) : toast.tone === "error" ? (
                <XCircle size={20} />
              ) : (
                <Info size={20} />
              )}
            </span>
            <div className="toast-item__body">
              <strong>{toast.title}</strong>
              {toast.message ? <p>{toast.message}</p> : null}
            </div>
            <button
              className="toast-item__close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      showToast: (title: string, message?: string) => {
        console.log(`[Toast Fallback] ${title}: ${message || ""}`);
      },
    };
  }
  return context;
}
