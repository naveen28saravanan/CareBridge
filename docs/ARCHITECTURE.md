# CareBridge One architecture

## Product shape

The first release is one installable application with role-based workspaces:

- `patient`: personal care, consultation, records, AI-assisted intake, emergency and first aid;
- `doctor`: availability, queue, patient-permitted summary, consultation notes and follow-up;
- `operations`: verification, emergency monitoring, availability updates, safety and audit.

Role permissions are enforced at navigation and service boundaries. A production
backend must repeat every permission check; hiding a button is never considered
authorisation.

## Prototype layers

1. **Responsive client** — React, TypeScript and CSS design tokens.
2. **Local state adapters** — fictional appointments, records and operational data.
3. **Local ML inference** — exported multinomial logistic-regression coefficients.
4. **Hospital discovery adapter** — Overpass query for nearby `amenity=hospital`
   and `emergency=yes` data, with a deterministic demo fallback.
5. **Availability verification** — separate partner/authority/admin status with
   source, timestamp and expiry. Map discovery never creates an ICU claim.
6. **Offline shell** — service worker and cached first-aid essentials.
7. **Patient chat orchestration** — deterministic emergency, medicine and symptom
   rules run first; optional Ollama generation is limited to non-emergency
   education and navigation.

## Production replacement boundaries

| Prototype component | Production replacement |
| --- | --- |
| Demo role switcher | authenticated identity with MFA and role claims |
| Browser storage | encrypted API and PostgreSQL with row-level authorisation |
| Local records | encrypted object storage with malware scanning |
| Local consultation room | WebRTC with short-lived room tokens and TURN |
| Demo payment | regulated payment gateway |
| Demo ICU updates | hospital/authority partner feed with signed updates |
| Local symptom model | clinically reviewed rules plus validated model service |
| Local Health Guide | audited orchestration service, reviewed retrieval corpus and human escalation |
| Demo notifications | FCM/APNs and transactional messaging |
| OpenStreetMap public endpoints | policy-compliant hosted or self-hosted geospatial services |

## Safety decisions

- Emergency red flags run before possible-condition ranking.
- Chat emergency red flags run before any language-model request.
- Medication chat never starts, stops, replaces or changes a dose.
- Optional local-model failure falls back to deterministic guidance.
- Chat attachments are not medically interpreted in the prototype.
- Results say “possible pattern” and “guidance only — not a diagnosis.”
- The UI never shows live ICU availability without source and timestamp.
- Stale availability becomes “Call to verify.”
- SOS requires an intentional hold and confirmation.
- Real dispatch is never claimed without responder confirmation.
- Every health value has a source label and timestamp.
- Prescriptions are restricted to verified clinicians.

## Hospital data contract

```ts
type AvailabilitySource =
  | "verified_partner"
  | "government_feed"
  | "facility_report"
  | "demo"
  | "unknown";

interface HospitalAvailability {
  emergencyOpen: boolean | null;
  icuBedsAvailable: number | null;
  ventilatorBedsAvailable: number | null;
  source: AvailabilitySource;
  lastVerifiedAt: string | null;
  verificationExpiresAt: string | null;
}
```

The application may use OpenStreetMap tags for location, name, phone,
`emergency=yes`, total `beds=*` and routing context. Those tags are not treated
as real-time availability.
