# CareBridge One - automatic gap closure status

Implementation date: 27 July 2026

This file maps the uploaded missing-gaps report to the enhanced source package. "Closed in prototype" means the feature is implemented and testable with fictional data. It does not mean clinical, regulatory or partner approval exists.

## Closed or materially improved automatically

| Gap area | Status in this source package |
| --- | --- |
| UI-01 reusable design system | Warm CareBridge visual tokens, responsive cards, protected shell, mobile navigation and HD media assets added. |
| UI-02 patient journey screens | Existing patient flows retained and action buttons completed; home, consultation and video experiences redesigned. |
| UI-03 responsive PWA | Mobile/desktop responsive styles, updated manifest, service-worker asset caching and API cache exclusion. |
| UI-07 accessibility/non-happy paths | Keyboard-focus styles, explicit errors, disabled states, safety notices and responsive layouts retained. |
| UI-08 motion/video interaction | Interactive full-screen consultation controls and accessible button labels added. |
| PT-01 registration/profile/consent | Email patient registration, protected sign-in, role restriction and prototype consent gate implemented. Live OTP/email ownership verification still needs providers. |
| PT-03 appointment lifecycle | Booking and local appointment history retained; consultation entry now opens an interactive demo call. |
| PT-07 symptom intake/history | Existing emergency-first symptom model retained. |
| PT-11 family/Medical ID/reminders | Existing flows retained and previously inert actions now respond. |
| OP-02 doctor profile/schedule | Existing doctor schedule/profile retained; action controls completed. |
| OP-03 queue/consent history | Existing consent-scoped queue retained. |
| OP-06 role/consent/audit administration | Role-bound authentication, operations access and interactive audit controls implemented. |
| OP-08 hospital status source/expiry | Existing verified-source and expiry editor retained. |
| OP-09 AI/first-aid governance | Existing safety review queue retained. |
| BE-01 API foundation | Optional Node authentication API added with health, email auth, WhatsApp OTP and logout endpoints. |
| BE-03 authentication/role enforcement | Mandatory auth gate, role-bound credentials, session expiry, sign-out, PBKDF2 backend hashing, rate limits and security headers added. |
| BE-07 consent/export/deletion UI | Existing controls retained; full production data engine still requires database infrastructure. |
| BE-08 audit/rate limiting/abuse | Authentication API rate limiting and protected role mapping added; existing audit UI retained. |
| AI-01 emergency-first orchestration | Existing deterministic red-flag checks retained. |
| AI-03 human handoff | Existing doctor, hospital, emergency and support navigation retained. |
| AI-07 training/testing/explainability | Existing Python training and model tests retained and verified. |
| AI-09 safety evaluation | Existing safety review surfaces retained. |
| AI-10 diagnosis/medication boundaries | Guidance-only and medication safety limits retained throughout UI and documentation. |
| EX-01 hospital discovery | Existing OpenStreetMap/Overpass adapter retained. |
| CO-01 privacy/consent implementation | Protected access, consent acknowledgement and account menus added; real policy approval remains external. |
| CO-05 automated tests | Authentication tests added; existing chat/model tests retained. |
| CO-07 web/PWA packaging | Manifest and service worker updated; store signing still requires owner accounts. |

## Functional authentication included

- Email sign-up creates patient accounts only.
- Email sign-in supports role-bound patient, doctor and operations accounts.
- Google and Facebook patient buttons work in local provider-simulation mode and redirect to live server flows when configured.
- WhatsApp patient sign-in includes mobile verification and prototype OTP `123456`; the optional API provides the same controlled development flow.
- No protected workspace renders without a valid, unexpired session.
- The signed-in role cannot be changed from the application shell.
- Public users cannot self-register as doctors or operations administrators.

## Manual inputs required for live activation

1. Google Cloud OAuth client, approved redirect URLs and server callback.
2. Meta/Facebook app, valid redirect URLs and app/business review where applicable.
3. Meta WhatsApp Business or approved OTP provider credentials, sender number and approved templates.
4. Production database/identity provider, HTTPS domain, secrets vault, MFA and account recovery.
5. Video/WebRTC provider or TURN credentials for real calls.
6. Encrypted object storage and malware scanning for real medical records.
7. Payment merchant account, notification providers and production hosting.
8. Clinician-reviewed medical content and representative validation data.
9. Verified doctor registry, hospital availability feeds and authorised ambulance partners.
10. Legal, privacy, clinical, regulatory and independent security approval.

## Safety boundary

The enhanced source package does not claim that the synthetic symptom model is clinically validated, that hospital/ICU status is live, or that the SOS demonstration dispatches an ambulance. Those capabilities remain blocked until authoritative evidence and accountable partners are connected.
