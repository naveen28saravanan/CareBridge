import { useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  Languages,
  LogOut,
  Menu,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import type { AuthUser } from "../auth/types";
import type { LanguageCode, Role, ThemeMode } from "../types";
import { languageOptions, type Translator } from "../i18n";
import { Avatar, Badge } from "./ui";

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface ShellProps {
  user: AuthUser;
  role: Role;
  roleLabel: string;
  active: string;
  navItems: NavItem[];
  onNavigate: (id: string) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (theme: ThemeMode) => void;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  t: Translator;
  children: ReactNode;
  mobileMenuOpen: boolean;
  onMobileMenuChange: (open: boolean) => void;
  onSignOut: () => void;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CB";
  return `${words[0][0] ?? ""}${words[words.length - 1][0] ?? ""}`.toUpperCase();
}

export function Shell({
  user,
  role,
  roleLabel,
  active,
  navItems,
  onNavigate,
  themeMode,
  onThemeModeChange,
  language,
  onLanguageChange,
  t,
  children,
  mobileMenuOpen,
  onMobileMenuChange,
  onSignOut,
}: ShellProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const userInitials = initials(user.displayName);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <span className="brand__mark">+</span>
          <div>
            <strong>CAREBRIDGE</strong>
            <small>ONE</small>
          </div>
          <button
            className="icon-button sidebar__close"
            aria-label="Close navigation"
            onClick={() => onMobileMenuChange(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="signed-role-card">
          <Avatar initials={userInitials} tone={role === "doctor" ? "teal" : "rose"} />
          <div>
            <small>{t("signedInSecurly")}</small>
            <strong>{user.displayName}</strong>
            <span><ShieldCheck size={13} /> {roleLabel}</span>
          </div>
        </div>

        <nav className="main-nav" aria-label={`${roleLabel} navigation`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={active === item.id ? "is-active" : ""}
              onClick={() => {
                onNavigate(item.id);
                onMobileMenuChange(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="security-status">
            <ShieldCheck size={18} />
            <div>
              <strong>{t("protectedSessionActive")}</strong>
              <small>{user.provider} sign-in</small>
            </div>
          </div>
          <button className="sidebar-signout" onClick={onSignOut}>
            <LogOut size={17} /> {t("signOut")}
          </button>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => onMobileMenuChange(false)}
        />
      ) : null}

      <div className="app-frame">
        <header className="topbar">
          <div className="topbar__identity">
            <button
              className="icon-button topbar__menu"
              aria-label="Open navigation"
              onClick={() => onMobileMenuChange(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <small>{roleLabel} workspace</small>
              <strong>{navItems.find((item) => item.id === active)?.label}</strong>
            </div>
          </div>

          <div className="topbar__actions">
            <label className="compact-select" title={t("language")}>
              <Languages size={17} />
              <select
                value={language}
                onChange={(event) => onLanguageChange(event.target.value as LanguageCode)}
                aria-label={t("language")}
              >
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.native}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>

            <div className="theme-switcher" aria-label={t("theme")}>
              <button
                className={themeMode === "light" ? "is-active" : ""}
                onClick={() => onThemeModeChange("light")}
                aria-label={t("light")}
                title="Light Mode (Light Background)"
              >
                <Sun size={16} />
              </button>
              <button
                className={themeMode === "dark" ? "is-active" : ""}
                onClick={() => onThemeModeChange("dark")}
                aria-label={t("dark")}
                title="Dark Mode (Dark Background)"
              >
                <Moon size={16} />
              </button>
              <button
                className={themeMode === "system" ? "is-active" : ""}
                onClick={() => onThemeModeChange("system")}
                aria-label={t("system")}
                title="Auto / System Mode (Syncs with OS theme)"
              >
                <Monitor size={15} />
              </button>
            </div>

            <div className="topbar-popover-anchor">
              <button
                className="icon-button notification-button"
                aria-label={t("notifications")}
                onClick={() => {
                  setNotificationsOpen((current) => !current);
                  setAccountOpen(false);
                }}
              >
                <Bell size={19} />
                <span>3</span>
              </button>
              {notificationsOpen ? (
                <section className="topbar-popover notification-popover">
                  <header><strong>Notifications</strong><button onClick={() => setNotificationsOpen(false)}>Close</button></header>
                  <article><span>Appointment reminder</span><small>Video consultation tomorrow at 10:30 AM</small></article>
                  <article><span>Medicine reminder</span><small>Vitamin D3 is due at 1:30 PM</small></article>
                  <article><span>Privacy update</span><small>Your access history is available in Profile</small></article>
                </section>
              ) : null}
            </div>

            <div className="topbar-popover-anchor">
              <button
                className="user-chip"
                onClick={() => {
                  setAccountOpen((current) => !current);
                  setNotificationsOpen(false);
                }}
                aria-label="Open account menu"
              >
                <Avatar initials={userInitials} size="small" tone={role === "doctor" ? "teal" : "rose"} />
                <div>
                  <strong>{user.displayName}</strong>
                  <Badge tone={role === "operations" ? "amber" : "green"}>
                    {role === "doctor" ? "Verified clinician" : roleLabel}
                  </Badge>
                </div>
                <ChevronDown size={15} />
              </button>
              {accountOpen ? (
                <section className="topbar-popover account-popover">
                  <div className="account-popover__identity">
                    <Avatar initials={userInitials} />
                    <div><strong>{user.displayName}</strong><small>{user.email || user.phone || "Verified account"}</small></div>
                  </div>
                  <button onClick={() => onNavigate(role === "operations" ? "settings" : "profile")}><UserRound size={17} /> Account and settings</button>
                  <button className="account-popover__logout" onClick={onSignOut}><LogOut size={17} /> Sign out securely</button>
                </section>
              ) : null}
            </div>
          </div>
        </header>

        <main className="workspace">{children}</main>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              className={active === item.id ? "is-active" : ""}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
