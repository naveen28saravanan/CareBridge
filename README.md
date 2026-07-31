# CareBridge One - Enhanced Protected Prototype

CareBridge One is a mobile-first, installable React and TypeScript healthcare prototype with protected patient, doctor and operations workspaces.

## Major improvements in this build

- mandatory authentication gate: no protected workspace renders before sign-in;
- patient sign-in through email, Google, Facebook or WhatsApp user flows;
- patient email registration with password-quality rules;
- doctor and operations access restricted to role-bound verified accounts;
- session expiry, secure sign-out, locked role navigation and account menus;
- optional Node authentication API with PBKDF2 password hashing, rate limits, persistent development accounts and security headers;
- redesigned warm, high-resolution CareBridge UI based on the approved visual direction;
- responsive mobile home experience with doctor consultation hero, Health Guide, Emergency Care, Nearby Hospitals and First Aid;
- interactive full-screen HD-style video consultation interface with microphone, camera, speaker, chat and end-call controls;
- functional patient, clinician and operations buttons throughout the prototype;
- patient consultation, appointments, records, medicines, family profiles and Medical ID;
- doctor queue, consent-scoped patient summary, notes, prescriptions and follow-up;
- operations verification, safety review, audit and ICU-status tools;
- emergency-first Health Guide, multilingual selection and local symptom-insights model;
- keyless OpenStreetMap/Overpass hospital discovery with safe fallback;
- light, dark and system themes plus installable PWA support.

## Safety limits

This remains a software prototype, not a certified medical device. Symptom results are guidance and possible patterns, not diagnosis. Synthetic model performance is not clinical performance. Hospital capacity and ambulance dispatch are not shown as live unless a verified source, timestamp and accountable provider exist. Call India emergency services at `112` when immediate help is required.

## Run the web application

```bash
npm install
npm run ml:train
npm test
npm run build
npm run dev
```

Open the Vite address shown in the terminal.

## Optional authentication API

The browser application works immediately in local prototype mode. For the included Node authentication API:

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
VITE_AUTH_API_URL=http://localhost:8787 npm run dev
```

Windows PowerShell:

```powershell
$env:VITE_AUTH_API_URL="http://localhost:8787"
npm.cmd run dev
```

## Test accounts

| Workspace | Email | Password |
| --- | --- | --- |
| Patient | `patient@carebridge.demo` | `Patient@123` |
| Doctor | `doctor@carebridge.demo` | `Doctor@123` |
| Operations | `admin@carebridge.demo` | `Admin@123` |

WhatsApp prototype OTP: `123456`.

Live Google, Facebook and WhatsApp activation requires owner-controlled credentials and server-side provider configuration. See `docs/AUTHENTICATION_SETUP.md`.

## Optional local chatbot model

```bash
VITE_OLLAMA_URL=/ollama
VITE_OLLAMA_MODEL=gemma3:4b
```

If Ollama is unavailable, the built-in deterministic safety engine remains active. Never put paid provider secrets in frontend code.

## Data policy

Use fictional or synthetic data only until production hosting, encryption, access controls, medical review, privacy approval and independent security validation are complete.
