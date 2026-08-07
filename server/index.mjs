import { createServer } from "node:http";
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "data");
const accountsPath = resolve(dataDir, "accounts.json");
const PORT = Number(process.env.CAREBRIDGE_API_PORT || 8787);
const ORIGIN = process.env.CAREBRIDGE_WEB_ORIGIN || "http://localhost:5173";
const ALLOWED_ORIGINS = new Set([
  ORIGIN,
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8787",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
]);
const SESSION_HOURS = Number(process.env.CAREBRIDGE_SESSION_HOURS || 8);
const DEV_OTP = process.env.CAREBRIDGE_DEV_OTP === "true" || process.env.NODE_ENV === "development";

mkdirSync(dataDir, { recursive: true });

const sessions = new Map();
const otpChallenges = new Map();
const rateLimits = new Map();

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: pbkdf2Sync(password, salt, 600_000, 32, "sha256").toString("hex"),
  };
}

function passwordsMatch(password, account) {
  const calculated = Buffer.from(hashPassword(password, account.salt).hash, "hex");
  const stored = Buffer.from(account.passwordHash, "hex");
  return calculated.length === stored.length && timingSafeEqual(calculated, stored);
}

function loadAccounts() {
  const patientPassword = process.env.SEED_PATIENT_PASSWORD || "Patient@123";
  const doctorPassword = process.env.SEED_DOCTOR_PASSWORD || "Doctor@123";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

  const seed = [
    ["demo_patient", "Riya Sharma", "patient@carebridge.demo", patientPassword, "patient"],
    ["demo_doctor", "Dr. Ananya Kumar", "doctor@carebridge.demo", doctorPassword, "doctor"],
    ["demo_operations", "Operations Admin", "admin@carebridge.demo", adminPassword, "operations"],
  ].map(([id, displayName, email, password, role]) => {
    const result = hashPassword(password);
    return {
      id,
      displayName,
      email,
      role,
      passwordHash: result.hash,
      salt: result.salt,
      createdAt: "2026-07-27T00:00:00.000Z",
      seeded: true,
    };
  });
  if (!existsSync(accountsPath)) {
    writeFileSync(accountsPath, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const parsed = JSON.parse(readFileSync(accountsPath, "utf8"));
    const nonSeeded = parsed.filter((account) => !seed.some((s) => s.email === account.email));
    const merged = [...seed, ...nonSeeded];
    writeFileSync(accountsPath, JSON.stringify(merged, null, 2));
    return merged;
  } catch {
    writeFileSync(accountsPath, JSON.stringify(seed, null, 2));
    return seed;
  }
}

let accounts = loadAccounts();

function persistAccounts() {
  writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
}

function headers(req, extra = {}) {
  const incomingOrigin = req?.headers?.origin;
  const allowOrigin = incomingOrigin && isOriginAllowed(incomingOrigin) ? incomingOrigin : ORIGIN;
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    ...extra,
  };
}

function send(res, status, body, req) {
  res.writeHead(status, headers(req));
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 100_000) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function clientKey(req, scope) {
  return `${scope}:${req.socket.remoteAddress || "unknown"}`;
}

function rateLimit(req, scope, limit = 12, windowMs = 60_000) {
  const key = clientKey(req, scope);
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

function normaliseEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function issueSession(account, provider = "email") {
  const token = randomBytes(32).toString("base64url");
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_HOURS * 60 * 60 * 1000;
  const user = {
    id: account.id,
    displayName: account.displayName,
    email: account.email,
    phone: account.phone,
    role: account.role,
    provider,
    verified: true,
    createdAt: account.createdAt,
  };
  sessions.set(createHash("sha256").update(token).digest("hex"), { user, expiresAt });
  return { user, accessToken: token, issuedAt, expiresAt };
}

function validatePassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

const server = createServer(async (req, res) => {
  const sendRes = (status, body) => send(res, status, body, req);

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers(req));
    res.end();
    return;
  }

  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "")) {
      sendRes(200, {
        status: "ok",
        name: "CareBridge One API",
        message: "CareBridge authentication & backend API is running successfully.",
        webAppUrl: "http://localhost:4173/",
        endpoints: {
          health: "/api/health",
          providers: "/api/auth/providers",
          login: "POST /api/auth/email/login",
          register: "POST /api/auth/email/register",
          whatsappOtpRequest: "POST /api/auth/whatsapp/request",
          whatsappOtpVerify: "POST /api/auth/whatsapp/verify"
        }
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendRes( 200, {
        status: "ok",
        service: "carebridge-auth-api",
        mode: "development",
        liveMedicalServices: false,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/auth/providers") {
      sendRes( 200, {
        email: true,
        google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        facebook: Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
        whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN) || DEV_OTP,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/email/register") {
      if (!rateLimit(req, "register", 8)) return sendRes( 429, { message: "Too many registration attempts. Try again later." });
      const body = await readJson(req);
      const email = normaliseEmail(body.email);
      const displayName = String(body.displayName || "").trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return sendRes( 400, { message: "Enter a valid email address." });
      if (displayName.length < 2) return sendRes( 400, { message: "Enter your full name." });
      if (!validatePassword(body.password)) return sendRes( 400, { message: "Password must be 8+ characters with uppercase, lowercase and a number." });
      if (accounts.some((account) => account.email === email)) return sendRes( 409, { message: "An account already exists for this email." });
      const result = hashPassword(body.password);
      const account = {
        id: `patient_${randomBytes(10).toString("hex")}`,
        displayName,
        email,
        role: "patient",
        passwordHash: result.hash,
        salt: result.salt,
        createdAt: new Date().toISOString(),
        seeded: false,
      };
      accounts.push(account);
      persistAccounts();
      sendRes( 201, issueSession(account));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/email/login") {
      if (!rateLimit(req, "login", 15)) return sendRes( 429, { message: "Too many sign-in attempts. Try again later." });
      const body = await readJson(req);
      const email = normaliseEmail(body.email);
      const role = String(body.role || "patient");
      if (!/^\S+@\S+\.\S+$/.test(email)) return sendRes( 400, { message: "Enter a valid email address." });
      
      let account = accounts.find((item) => item.email === email);
      if (!account) {
        if (!body.password || body.password.length < 6) {
          return sendRes( 400, { message: "Please provide a valid password for your account." });
        }
        const namePart = email.split("@")[0].replace(/[._-]/g, " ");
        const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const result = hashPassword(body.password);
        account = {
          id: `${role}_${randomBytes(10).toString("hex")}`,
          displayName,
          email,
          role,
          passwordHash: result.hash,
          salt: result.salt,
          createdAt: new Date().toISOString(),
          seeded: false,
        };
        accounts.push(account);
        persistAccounts();
        return sendRes( 200, issueSession(account));
      }

      if (!passwordsMatch(String(body.password || ""), account)) {
        return sendRes( 401, { message: "Incorrect password for this email account." });
      }

      if (account.role !== role) {
        if (!account.seeded) {
          account.role = role;
          persistAccounts();
        } else {
          return sendRes(403, { message: "This account is not authorized for the requested role." });
        }
      }
      sendRes( 200, issueSession(account));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/google") {
      const body = await readJson(req);
      const email = normaliseEmail(body.email);
      const displayName = String(body.displayName || email.split("@")[0] || "Google User").trim();
      const role = body.role || "patient";
      if (!/^\S+@\S+\.\S+$/.test(email)) return sendRes( 400, { message: "Enter a valid Google email address." });
      let account = accounts.find((item) => item.email === email);
      if (!account) {
        account = {
          id: `google_${randomBytes(10).toString("hex")}`,
          displayName: displayName || "Google User",
          email,
          role,
          passwordHash: "",
          salt: "",
          createdAt: new Date().toISOString(),
          seeded: false,
        };
        accounts.push(account);
        persistAccounts();
      } else if (account.role !== role && !account.seeded) {
        account.role = role;
        persistAccounts();
      }
      sendRes( 200, issueSession(account, "google"));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/whatsapp/request") {
      if (!rateLimit(req, "otp", 6, 10 * 60_000)) return sendRes( 429, { message: "Too many OTP requests. Try again later." });
      const body = await readJson(req);
      const phone = String(body.phone || "").replace(/[^+\d]/g, "");
      if (!/^\+?\d{10,15}$/.test(phone)) return sendRes( 400, { message: "Enter a valid mobile number." });
      const code = DEV_OTP ? "123456" : String(Math.floor(100000 + Math.random() * 900000));
      otpChallenges.set(phone, { code, expiresAt: Date.now() + 5 * 60_000, attempts: 0 });
      // Production: send the code using Meta WhatsApp Business Cloud API or an approved messaging provider.
      sendRes( 200, DEV_OTP ? { demoCode: code } : { sent: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/whatsapp/verify") {
      const body = await readJson(req);
      const phone = String(body.phone || "").replace(/[^+\d]/g, "");
      const challenge = otpChallenges.get(phone);
      if (!challenge || challenge.expiresAt <= Date.now()) return sendRes( 400, { message: "The verification code expired. Request a new code." });
      challenge.attempts += 1;
      if (challenge.attempts > 5) {
        otpChallenges.delete(phone);
        return sendRes( 429, { message: "Too many incorrect codes." });
      }
      if (String(body.code || "") !== challenge.code) return sendRes( 401, { message: "Incorrect verification code." });
      otpChallenges.delete(phone);
      let account = accounts.find((item) => item.phone === phone && item.role === "patient");
      if (!account) {
        account = {
          id: `patient_${randomBytes(10).toString("hex")}`,
          displayName: String(body.displayName || "CareBridge Patient").trim() || "CareBridge Patient",
          phone,
          email: undefined,
          role: "patient",
          passwordHash: "",
          salt: "",
          createdAt: new Date().toISOString(),
          seeded: false,
        };
        accounts.push(account);
        persistAccounts();
      }
      sendRes( 200, issueSession(account, "whatsapp"));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (token) sessions.delete(createHash("sha256").update(token).digest("hex"));
      sendRes( 200, { signedOut: true });
      return;
    }

    sendRes( 404, { message: "Route not found." });
  } catch (error) {
    console.error(error);
    sendRes( 500, { message: "The authentication service could not process the request." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CareBridge authentication API running at http://0.0.0.0:${PORT}`);
  console.log(`Allowed web origin: ${ORIGIN}`);
  console.log(`Development WhatsApp OTP: ${DEV_OTP ? "enabled (123456)" : "disabled"}`);
});
