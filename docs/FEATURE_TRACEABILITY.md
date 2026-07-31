# Feature traceability matrix

Status values: `Built` means implemented in the current interactive prototype;
`Adapter` means the safe interface and demo behaviour exist but a production
partner is required; `Production` means regulated infrastructure is required
before public launch.

## Shared platform

| ID | Requirement | Prototype status | Completion evidence |
| --- | --- | --- | --- |
| SH-001 | Single role-based app | Built | patient, doctor and operations workspaces |
| SH-002 | Sign in and role authorisation | Built | mandatory auth gate, role-bound sessions and protected navigation |
| SH-003 | Light, dark and system theme | Built | persistent theme selector |
| SH-004 | English, Tamil and Hindi | Built | language selector and core translated UI |
| SH-005 | Additional Indian languages | Built | Telugu, Bengali, Marathi, Kannada and Malayalam registry |
| SH-006 | Notifications | Built | interactive notification centre and preferences |
| SH-007 | Accessibility controls | Built | text-size, high-contrast and reduced-motion preferences |
| SH-008 | Consent and audit history | Built | consent cards and activity timeline |
| SH-009 | Offline essential content | Built | PWA shell and first-aid library |
| SH-010 | Secure production identity | Adapter | Node auth API, PBKDF2, rate limits and session tokens; production database, MFA and independent review remain required |

| SH-011 | Google, Facebook, WhatsApp and email access | Adapter | all user flows work in prototype; live social/WhatsApp providers require owner credentials and server callbacks |

## Patient functions

| ID | Requirement | Prototype status | Completion evidence |
| --- | --- | --- | --- |
| PT-001 | Health and demographic profile | Built | profile and source-labelled values |
| PT-002 | Family/dependent profiles | Built | family member selector |
| PT-003 | Doctor search and filters | Built | specialty, language and availability filters |
| PT-004 | Verified doctor profiles | Built | qualification, experience, fee and languages |
| PT-005 | Book/reschedule/cancel appointment | Built | appointment workflow and local persistence |
| PT-006 | Video/audio/text consultation | Adapter | consultation lobby and safe demo room |
| PT-007 | AI-assisted symptom intake | Built | local model, red flags and care-category result |
| PT-008 | Symptom prediction training/testing | Built | `ml/train_symptom_model.py` and metrics report |
| PT-009 | Emergency SOS | Built | hold-to-confirm interaction and 112 fallback |
| PT-010 | Location and trusted-contact sharing | Adapter | permission flow and share payload |
| PT-011 | Nearby hospital search | Built | geolocation, Overpass and demo fallback |
| PT-012 | Emergency-capable hospital filter | Built | `emergency=yes` and explicit unknown state |
| PT-013 | ICU availability | Adapter | verified-source, timestamp and expiry model |
| PT-014 | Ambulance/responder tracking | Adapter | confirmation timeline; partner feed required |
| PT-015 | Offline first-aid guidance | Built | reviewed-content placeholders and step mode |
| PT-016 | Medical records | Built | upload, list, filter and share simulation |
| PT-017 | Digital medical ID | Built | emergency facts and QR-style identity card |
| PT-018 | Prescriptions | Built | patient read-only prescription list |
| PT-019 | Medicine reminders | Built | due/taken workflow and reminders |
| PT-020 | Laboratory booking | Built | test selection and booking workflow |
| PT-021 | Health values and trends | Built | source-labelled cards and sample trend |
| PT-022 | Payments, invoices and refunds | Adapter | demo checkout and transaction history |
| PT-023 | Support and grievance | Built | ticket form and status list |
| PT-024 | Advanced patient chatbot | Built | Health Guide conversation, suggested prompts and care actions |
| PT-025 | Chat emergency interception | Built | deterministic red-flag check runs before any language model |
| PT-026 | Multilingual chat | Built | English, Tamil and Hindi safety replies plus eight-language welcome/voice locale |
| PT-027 | Voice input and read-aloud | Built | browser speech recognition and speech synthesis with graceful fallback |
| PT-028 | Free local language model | Adapter | optional Ollama `/api/chat`; deterministic engine works without it |
| PT-029 | Chat-to-human handoff | Built | doctor booking, symptom review, hospital, records and medicine actions |
| PT-030 | Report attachment safety | Built | local filename preview; no upload or image diagnosis in prototype |

## Doctor functions

| ID | Requirement | Prototype status | Completion evidence |
| --- | --- | --- | --- |
| DR-001 | Credential and licence verification | Adapter | submission and operations review workflow |
| DR-002 | Profile, specialty and languages | Built | editable fictional profile |
| DR-003 | Availability and calendar | Built | online toggle and schedule |
| DR-004 | Appointment queue | Built | ordered daily queue |
| DR-005 | Patient-permitted history | Built | consent-scoped summary |
| DR-006 | Consultation room | Adapter | video/chat/attachment interface |
| DR-007 | Clinical notes | Built | structured draft and autosave state |
| DR-008 | Digital prescription | Built | clinician-only builder with confirmation |
| DR-009 | Laboratory recommendation | Built | test order builder |
| DR-010 | Follow-up scheduling | Built | follow-up selector and reminder |
| DR-011 | Secure patient messaging | Adapter | conversation interface |
| DR-012 | Earnings, invoices and feedback | Built | summary and ratings views |

## Administrator and emergency operations

| ID | Requirement | Prototype status | Completion evidence |
| --- | --- | --- | --- |
| AD-001 | User and role management | Built | searchable fictional user table |
| AD-002 | Doctor verification | Built | approve/reject/review queue |
| AD-003 | Appointment monitoring | Built | operational summary |
| AD-004 | Payment/refund management | Adapter | demo transaction actions |
| AD-005 | SOS event monitoring | Built | incident queue and status timeline |
| AD-006 | Responder assignment | Adapter | assignment workflow; partner required |
| AD-007 | Hospital ICU status updates | Built | availability editor with timestamp/source |
| AD-008 | First-aid content management | Built | versioned draft/review/publish states |
| AD-009 | AI safety review | Built | flagged-session queue |
| AD-010 | Lab/pharmacy partner management | Built | partner status list |
| AD-011 | Reports and analytics | Built | operational cards and charts |
| AD-012 | Audit and security logs | Built | immutable-style activity list |
| AD-013 | Platform health | Built | service status panel |
| AD-014 | Real emergency dispatch | Production | authority/ambulance agreement and audited integration |
| AD-015 | Chatbot safety review | Built | flagged-session workflow and boundary documentation |

## Release gate

No item marked `Adapter` or `Production` may be advertised as live until its
external integration, security review, clinical review and failure-mode tests
are complete.
