import type { ButtonHTMLAttributes, CSSProperties, PropsWithChildren, ReactNode } from "react";
import { X } from "lucide-react";
import type { DataSource } from "../types";

export function Card({
  children,
  className = "",
  tone = "default",
  style,
}: PropsWithChildren<{ className?: string; tone?: "default" | "blue" | "critical" | "success"; style?: CSSProperties }>) {
  return <section className={`card card--${tone} ${className}`} style={style}>{children}</section>;
}

export function Button({
  children,
  className = "",
  variant = "primary",
  icon,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  icon?: ReactNode;
}) {
  return (
    <button className={`button button--${variant} ${className}`} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: PropsWithChildren<{ tone?: "neutral" | "blue" | "green" | "amber" | "red" }>) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Avatar({
  initials,
  src,
  size = "medium",
  tone = "blue",
}: {
  initials: string;
  src?: string;
  size?: "small" | "medium" | "large";
  tone?: "blue" | "teal" | "violet" | "rose";
}) {
  if (src) {
    return (
      <span className={`avatar avatar--${size} avatar--${tone} avatar--has-image`}>
        <img
          src={src}
          alt="Profile photo"
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
        />
      </span>
    );
  }
  return <span className={`avatar avatar--${size} avatar--${tone}`}>{initials}</span>;
}

export function SectionHeading({
  title,
  action,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
  wide = false,
}: PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
  wide?: boolean;
}>) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal ${wide ? "modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </label>
  );
}

const sourceLabels: Record<DataSource, string> = {
  user_entered: "User entered",
  device_imported: "Device imported",
  clinic_result: "Clinic result",
  demo: "Demo data",
};

export function SourceBadge({ source }: { source: DataSource }) {
  return (
    <Badge tone={source === "demo" ? "amber" : "neutral"}>
      {sourceLabels[source]}
    </Badge>
  );
}

export function Sparkline({
  values,
  color = "var(--primary)",
}: {
  values: number[];
  color?: string;
}) {
  if (values.length < 2) return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 34 - ((value - minimum) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 38" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Metric({
  label,
  value,
  note,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  note?: string;
  icon?: ReactNode;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  return (
    <Card className="metric">
      <span className={`metric__icon metric__icon--${tone}`}>{icon}</span>
      <div>
        <span className="metric__label">{label}</span>
        <strong>{value}</strong>
        {note ? <small>{note}</small> : null}
      </div>
    </Card>
  );
}
