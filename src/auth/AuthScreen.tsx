import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Facebook,
  Languages,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { languageOptions } from "../i18n";
import type { LanguageCode, Role, ThemeMode } from "../types";
import { Button } from "../components/ui";
import { authService } from "./authService";
import type { AuthProvider, AuthSession } from "./types";

interface AuthScreenProps {
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onAuthenticated: (session: AuthSession) => void;
}

type Mode = "signin" | "signup";
type ProviderDialog = Extract<AuthProvider, "google" | "facebook" | "whatsapp"> | null;

const roleCopy: Record<Role, { title: string; note: string; icon: ReactNode }> = {
  patient: {
    title: "Patient",
    note: "Appointments, records and care",
    icon: <UserRound size={18} />,
  },
  doctor: {
    title: "Doctor",
    note: "Verified clinical workspace",
    icon: <Stethoscope size={18} />,
  },
  operations: {
    title: "Operations",
    note: "Safety and administration",
    icon: <ShieldCheck size={18} />,
  },
};

export function AuthScreen({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onAuthenticated,
}: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [accepted, setAccepted] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState("");
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const [providerDialog, setProviderDialog] = useState<ProviderDialog>(null);
  const [providerName, setProviderName] = useState("");
  const [providerEmail, setProviderEmail] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState("");

  const roleHint = useMemo(() => {
    if (role === "doctor") return "Doctor workspace for verified clinical accounts.";
    if (role === "operations") return "Operations workspace for safety and administration.";
    return mode === "signup" ? "Create an account for your chosen workspace." : "Sign in to continue to your protected workspace.";
  }, [mode, role]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const chooseRole = (nextRole: Role) => {
    setRole(nextRole);
    setError("");
    setEmail("");
    setPassword("");
  };

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!accepted) {
      setError("Accept the privacy notice and terms to continue.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const session =
        mode === "signup"
          ? await authService.registerEmail({ displayName: name, email, password, role })
          : await authService.loginEmail({ email, password, role });
      onAuthenticated(session);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setPending(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setResetMessage("");
    setPending(true);
    try {
      await authService.resetPassword({ email: resetEmailInput, newPassword: resetPasswordInput });
      setResetSuccess(true);
      setResetMessage("Password reset successfully! You can now log in with your new password.");
    } catch (reason: any) {
      setResetMessage(reason?.message || "Failed to reset password.");
    } finally {
      setPending(false);
    }
  };

  const handleFirebaseGoogle = async () => {
    setPending(true);
    setError("");
    try {
      const session = await authService.signInWithFirebaseGoogle(role);
      onAuthenticated(session);
    } catch (reason: any) {
      if (reason?.message) setError(reason.message);
    } finally {
      setPending(false);
    }
  };



  const openProvider = (provider: NonNullable<ProviderDialog>) => {
    setProviderDialog(provider);
    setProviderName("");
    const defaultEmail =
      role === "doctor"
        ? "doctor@carebridge.demo"
        : role === "operations"
        ? "ops@carebridge.demo"
        : "user@gmail.com";
    setProviderEmail(provider === "google" ? defaultEmail : "");
    setPhone("+91 ");
    setOtp("");
    setOtpSent(false);
    setOtpHint("");
    setError("");
  };

  const submitSocial = async (givenEmail?: string, givenName?: string) => {
    if (!providerDialog || providerDialog === "whatsapp") return;
    const targetEmail = givenEmail || providerEmail;
    const targetName = givenName || providerName;
    setPending(true);
    setError("");
    try {
      const session = await authService.signInSocial(providerDialog, {
        displayName: targetName,
        email: targetEmail,
        role,
      });
      onAuthenticated(session);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to continue.";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  const requestOtp = async () => {
    setPending(true);
    setError("");
    try {
      const result = await authService.requestWhatsAppOtp(phone);
      setOtpSent(true);
      setOtpHint(result.demoCode ? `Prototype code: ${result.demoCode}` : "A verification code was sent through the configured provider.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send the code.");
    } finally {
      setPending(false);
    }
  };

  const verifyOtp = async () => {
    setPending(true);
    setError("");
    try {
      const session = await authService.verifyWhatsAppOtp({
        phone,
        code: otp,
        displayName: providerName,
      });
      onAuthenticated(session);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to verify the code.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="auth-visual__top">
          <div className="carebridge-logo carebridge-logo--light">
            <span className="carebridge-logo__mark">+</span>
            <div>
              <strong>CareBridge</strong>
              <small>One</small>
            </div>
          </div>
          <label className="auth-language">
            <Languages size={16} />
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value as LanguageCode)}
              aria-label="Language"
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.native}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="auth-visual__image" aria-hidden="true" />
        <div className="auth-visual__gradient" aria-hidden="true" />
        <div className="auth-visual__copy">
          <span className="auth-kicker"><ShieldCheck size={15} /> Protected care access</span>
          <h1>Care that stays with you.</h1>
          <p>Consult, understand and act with confidence from one connected health workspace.</p>
          <div className="auth-proof-row">
            <span><Check size={15} /> Role-protected access</span>
            <span><Check size={15} /> Emergency-first safety</span>
            <span><Check size={15} /> Guidance, not diagnosis</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <header className="auth-panel__top">
          <div className="carebridge-logo">
            <span className="carebridge-logo__mark">+</span>
            <div>
              <strong>CareBridge One</strong>
              <small>Secure health platform</small>
            </div>
          </div>
          <button
            className="auth-theme"
            onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle appearance"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </header>

        <div className="auth-panel__body">
          <div className="auth-heading">
            <span className="auth-lock"><LockKeyhole size={23} /></span>
            <p>WELCOME TO CAREBRIDGE ONE</p>
            <h2>{mode === "signin" ? "Sign in to continue" : `Create your ${roleCopy[role].title.toLowerCase()} account`}</h2>
            <span>{roleHint}</span>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button className={mode === "signin" ? "is-active" : ""} onClick={() => switchMode("signin")}>Sign in</button>
            <button className={mode === "signup" ? "is-active" : ""} onClick={() => switchMode("signup")}>Create account</button>
          </div>

          <div className="auth-role-grid">
            {(["patient", "doctor", "operations"] as Role[]).map((item) => (
              <button key={item} className={role === item ? "is-active" : ""} onClick={() => chooseRole(item)}>
                <span>{roleCopy[item].icon}</span>
                <strong>{roleCopy[item].title}</strong>
                <small>{roleCopy[item].note}</small>
              </button>
            ))}
          </div>

          <div className="provider-grid">
            <button onClick={handleFirebaseGoogle} className="provider-button--google">
              <span className="provider-logo provider-logo--google">G</span> Continue with Google
            </button>
          </div>
          <div className="auth-divider"><span>or continue with email</span></div>

          <form className="auth-form" onSubmit={submitEmail}>
            {mode === "signup" ? (
              <label>
                Full name
                <span className="auth-input"><UserRound size={18} /><input id="signup-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" /></span>
              </label>
            ) : null}
            <label>
              Email address
              <span className="auth-input"><Mail size={18} /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" /></span>
            </label>
            <label>
              Password
              <span className="auth-input"><LockKeyhole size={18} /><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete={mode === "signin" ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
            </label>

            {mode === "signin" ? (
              <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "8px" }}>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
                  onClick={() => {
                    setResetEmailInput(email);
                    setResetMessage("");
                    setResetSuccess(false);
                    setShowResetModal(true);
                  }}
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            {mode === "signup" ? (
              <label>
                Confirm password
                <span className="auth-input"><LockKeyhole size={18} /><input id="confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" autoComplete="new-password" /></span>
              </label>
            ) : null}

            <label className="auth-consent">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>Remember me on this device</span>
            </label>

            <label className="auth-consent">
              <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
              <span>I agree to the prototype privacy notice, consent terms and safe-use limitations.</span>
            </label>

            {error ? <div className="auth-error" role="alert">{error}</div> : null}

            <Button id="login-button" type="submit" className="auth-submit" disabled={pending}>
              {pending ? "Please wait..." : mode === "signin" ? "Secure sign in" : "Create protected account"}
              {!pending ? <ArrowRight size={18} /> : null}
            </Button>
          </form>

          <div className="auth-demo-note">
            <ShieldCheck size={18} />
            <div>
              <strong>End-to-End Encrypted Healthcare Portal</strong>
              <span>Protected by Firebase Authentication & 256-bit SSL Data Security</span>
            </div>
          </div>
        </div>
      </section>

      {showResetModal ? (
        <div className="provider-backdrop" role="presentation" onMouseDown={() => setShowResetModal(false)}>
          <section className="provider-dialog" role="dialog" aria-modal="true" aria-label="Reset Password" onMouseDown={(event) => event.stopPropagation()}>
            <button className="provider-dialog__back" onClick={() => setShowResetModal(false)}><ChevronLeft size={18} /> Back</button>
            <span className="provider-dialog__icon"><LockKeyhole size={25} /></span>
            <h2>Reset Your Password</h2>
            <p>Enter your registered account email and set a new secure password.</p>

            <form className="auth-form" onSubmit={handleResetPassword}>
              <label>
                Account Email
                <span className="auth-input"><Mail size={18} /><input type="email" value={resetEmailInput} onChange={(e) => setResetEmailInput(e.target.value)} placeholder="name@example.com" required /></span>
              </label>
              <label>
                New Password
                <span className="auth-input"><LockKeyhole size={18} /><input type="password" value={resetPasswordInput} onChange={(e) => setResetPasswordInput(e.target.value)} placeholder="Min 8 chars (upper, lower, number)" required /></span>
              </label>

              {resetMessage ? (
                <div className={resetSuccess ? "auth-info" : "auth-error"} role="alert">
                  {resetMessage}
                </div>
              ) : null}

              <Button disabled={pending || resetSuccess} className="auth-submit">
                {pending ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          </section>
        </div>
      ) : null}

      {providerDialog ? (
        <div className="provider-backdrop" role="presentation" onMouseDown={() => setProviderDialog(null)}>
          <section className="provider-dialog" role="dialog" aria-modal="true" aria-label={`${providerDialog} sign in`} onMouseDown={(event) => event.stopPropagation()}>
            <button className="provider-dialog__back" onClick={() => setProviderDialog(null)}><ChevronLeft size={18} /> Back</button>
            <span className="provider-dialog__icon">
              {providerDialog === "google" ? "G" : providerDialog === "facebook" ? <Facebook size={25} /> : <Smartphone size={25} />}
            </span>
            <h2>{providerDialog === "whatsapp" ? "Continue with WhatsApp" : `Sign in with ${providerDialog === "google" ? "Google" : "Facebook"}`}</h2>
            <p>
              {providerDialog === "whatsapp"
                ? "Verify your mobile number before entering the patient workspace."
                : providerDialog === "google"
                ? "Sign in directly with your Google account to access your CareBridge profile."
                : "Enter your account email to continue with Facebook authentication."}
            </p>
            <div className="auth-form">
              {providerDialog === "whatsapp" ? (
                <>
                  <label>
                    Full name
                    <span className="auth-input"><UserRound size={18} /><input value={providerName} onChange={(event) => setProviderName(event.target.value)} placeholder="Your full name" /></span>
                  </label>
                  <label>
                    WhatsApp number
                    <span className="auth-input"><Smartphone size={18} /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" inputMode="tel" /></span>
                  </label>
                  {otpSent ? (
                    <label>
                      Verification code
                      <span className="auth-input"><LockKeyhole size={18} /><input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6-digit code" inputMode="numeric" maxLength={6} /></span>
                    </label>
                  ) : null}
                  {otpHint ? <div className="auth-info">{otpHint}</div> : null}
                  {error ? <div className="auth-error" role="alert">{error}</div> : null}
                  <Button disabled={pending} onClick={otpSent ? verifyOtp : requestOtp}>{pending ? "Please wait..." : otpSent ? "Verify and continue" : "Send verification code"}</Button>
                </>
              ) : (
                <>
                  <label>
                    Full name (optional)
                    <span className="auth-input"><UserRound size={18} /><input value={providerName} onChange={(event) => setProviderName(event.target.value)} placeholder="Your name (optional)" /></span>
                  </label>
                  <label>
                    Google / Account Email
                    <span className="auth-input"><Mail size={18} /><input type="email" value={providerEmail} onChange={(event) => setProviderEmail(event.target.value)} placeholder="name@gmail.com" /></span>
                  </label>
                  {error ? <div className="auth-error" role="alert">{error}</div> : null}
                  <Button disabled={pending} onClick={() => submitSocial()}>{pending ? "Authenticating..." : `Continue with ${providerDialog === "google" ? "Google" : "Facebook"}`}</Button>
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
