# Phase 1 & 2 — Backend Discovery & API Inventory
Generated: 2026-08-07T18:38:01.247Z

## Stack Identification
| Property | Value |
|----------|-------|
| Language | TypeScript / JavaScript (ESM) |
| Frontend | React 19 + Vite 6 |
| Backend API | Node.js HTTP Server (server/index.mjs) |
| Auth (Primary) | Supabase Auth + Firebase Auth |
| Auth (Local) | PBKDF2-SHA256 (600,000 iterations) |
| Authorization | RBAC — patient / doctor / operations |
| Database | Supabase PostgreSQL |
| ORM | @supabase/supabase-js SDK |
| Session | In-memory Map + localStorage fallback |
| ML Engine | Python (ml/symptom_model.json) |

## Dependencies (7 production)
- @capacitor/android: ^8.5.0
- @capacitor/core: ^8.5.0
- @supabase/supabase-js: ^2.111.0
- firebase: ^12.17.0
- lucide-react: ^0.468.0
- react: ^19.0.0
- react-dom: ^19.0.0

## API Inventory
| Endpoint | Method | Auth Required | Roles | File |
|----------|--------|---------------|-------|------|
| / | GET | No | Public | server/index.mjs |
| /api/health | GET | No | Public | server/index.mjs |
| /api/auth/providers | GET | No | Public | server/index.mjs |
| /api/auth/email/register | POST | No | Public | server/index.mjs |
| /api/auth/email/login | POST | No | All roles | server/index.mjs |
| /api/auth/google | POST | No | Public | server/index.mjs |
| /api/auth/whatsapp/request | POST | No | Public | server/index.mjs |
| /api/auth/whatsapp/verify | POST | No | Public | server/index.mjs |
| /api/auth/logout | POST | Yes (Bearer) | All roles | server/index.mjs |

## Phase 1 & 2 Status: ✅ PASSED
