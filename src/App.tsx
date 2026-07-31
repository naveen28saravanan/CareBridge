import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Ambulance,
  BedDouble,
  Bot,
  BrainCircuit,
  BriefcaseMedical,
  Calendar,
  ClipboardList,
  FileHeart,
  FileText,
  HeartPulse,
  Hospital,
  MessageCircle,
  Pill,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { AuthScreen } from "./auth/AuthScreen";
import { authService } from "./auth/authService";
import type { AuthSession } from "./auth/types";
import { Shell, type NavItem } from "./components/Shell";
import { getTranslator, languageOptions } from "./i18n";
import type { LanguageCode, Role, ThemeMode } from "./types";
import { DoctorWorkspace } from "./workspaces/DoctorWorkspace";
import { OperationsWorkspace } from "./workspaces/OperationsWorkspace";
import { PatientWorkspace } from "./workspaces/PatientWorkspace";

const roleDefaults: Record<Role, string> = {
  patient: "home",
  doctor: "today",
  operations: "overview",
};

function getNav(role: Role, t: ReturnType<typeof getTranslator>): NavItem[] {
  if (role === "patient") {
    return [
      { id: "home", label: t("home"), icon: <HeartPulse size={19} /> },
      { id: "consult", label: t("consult"), icon: <Stethoscope size={19} /> },
      { id: "records", label: t("records"), icon: <FileHeart size={19} /> },
      { id: "profile", label: t("profile"), icon: <UserRound size={19} /> },
      { id: "chat", label: t("healthChat"), icon: <Bot size={19} /> },
      { id: "care", label: t("care"), icon: <BriefcaseMedical size={19} /> },
      { id: "symptoms", label: t("symptomInsights"), icon: <BrainCircuit size={19} /> },
      { id: "emergency", label: t("emergencySos"), icon: <Ambulance size={19} /> },
      { id: "hospitals", label: t("nearbyHospitals"), icon: <Hospital size={19} /> },
      { id: "medicines", label: t("medicines"), icon: <Pill size={19} /> },
      { id: "labs", label: t("labTests"), icon: <Activity size={19} /> },
    ];
  }
  if (role === "doctor") {
    return [
      { id: "today", label: t("today"), icon: <Calendar size={19} /> },
      { id: "patients", label: t("patients"), icon: <Users size={19} /> },
      { id: "messages", label: t("messages"), icon: <MessageCircle size={19} /> },
      { id: "prescriptions", label: "Prescriptions", icon: <Pill size={19} /> },
      { id: "profile", label: t("profile"), icon: <UserCheck size={19} /> },
      { id: "notes", label: "Clinical notes", icon: <ClipboardList size={19} /> },
    ];
  }
  return [
    { id: "overview", label: t("overview"), icon: <Activity size={19} /> },
    { id: "doctors", label: "Doctor verification", icon: <UserCheck size={19} /> },
    { id: "emergencies", label: t("emergencies"), icon: <Ambulance size={19} /> },
    { id: "hospitals", label: "ICU availability", icon: <BedDouble size={19} /> },
    { id: "safety", label: "Clinical & AI safety", icon: <ShieldCheck size={19} /> },
    { id: "audit", label: "Audit & users", icon: <FileText size={19} /> },
    { id: "settings", label: t("settings"), icon: <Settings size={19} /> },
  ];
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("carebridge.theme");
    return saved === "dark" || saved === "system" ? saved : "light";
  });
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("carebridge.language") as LanguageCode | null;
    return saved && languageOptions.some((option) => option.code === saved) ? saved : "en";
  });
  const [activeByRole, setActiveByRole] = useState<Record<Role, string>>({
    patient: roleDefaults.patient,
    doctor: roleDefaults.doctor,
    operations: roleDefaults.operations,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = session?.user.role ?? "patient";
  const t = useMemo(() => getTranslator(language), [language]);
  const navItems = useMemo(() => getNav(role, t), [role, t]);
  const active = activeByRole[role];

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = themeMode === "system" ? (media.matches ? "dark" : "light") : themeMode;
      document.documentElement.dataset.theme = resolved;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", resolved === "dark" ? "#15100e" : "#f8eee8");
    };
    apply();
    media.addEventListener("change", apply);
    localStorage.setItem("carebridge.theme", themeMode);
    return () => media.removeEventListener("change", apply);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("carebridge.language", language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!session) return;
    const verify = () => {
      const current = authService.getSession();
      if (!current) {
        setSession(null);
        setMobileMenuOpen(false);
      }
    };
    const timer = window.setInterval(verify, 60_000);
    window.addEventListener("storage", verify);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", verify);
    };
  }, [session]);

  if (!session) {
    return (
      <AuthScreen
        language={language}
        onLanguageChange={setLanguage}
        theme={themeMode}
        onThemeChange={setThemeMode}
        onAuthenticated={(nextSession) => {
          setSession(nextSession);
          setActiveByRole((current) => ({
            ...current,
            [nextSession.user.role]: roleDefaults[nextSession.user.role],
          }));
        }}
      />
    );
  }

  const navigate = (id: string) => {
    setActiveByRole((current) => ({ ...current, [role]: id }));
  };

  return (
    <Shell
      user={session.user}
      role={role}
      roleLabel={t(role)}
      active={active}
      navItems={navItems}
      onNavigate={navigate}
      themeMode={themeMode}
      onThemeModeChange={setThemeMode}
      language={language}
      onLanguageChange={setLanguage}
      t={t}
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuChange={setMobileMenuOpen}
      onSignOut={() => {
        authService.signOut();
        setSession(null);
        setMobileMenuOpen(false);
      }}
    >
      {role === "patient" ? (
        <PatientWorkspace
          active={active}
          language={language}
          displayName={session.user.displayName}
          userId={session.user.id}
          onNavigate={navigate}
        />
      ) : role === "doctor" ? (
        <DoctorWorkspace active={active} onNavigate={navigate} />
      ) : (
        <OperationsWorkspace active={active} onNavigate={navigate} />
      )}
    </Shell>
  );
}
