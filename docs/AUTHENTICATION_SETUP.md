# CareBridge One authentication setup

## What is already implemented

- protected application shell: no patient, doctor or operations screen renders without a valid session;
- email registration for patient accounts;
- email sign-in with role-bound accounts;
- Google, Facebook and WhatsApp patient sign-in user interfaces;
- WhatsApp OTP flow with development code `123456` when no provider is configured;
- doctor and operations roles cannot be created through public sign-up;
- session expiry, sign-out, provider identity display and role-locked navigation;
- optional Node authentication API with PBKDF2 password hashing, rate limiting, security headers and persistent development accounts.

## Run the optional authentication API

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
VITE_AUTH_API_URL=http://localhost:8787 npm run dev
```

On Windows PowerShell:

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

## Manual credentials still required for live providers

### Google

Create an OAuth web client in Google Cloud, register the production and local redirect URLs, and configure a server-side callback. Set the deployed callback URL in `VITE_GOOGLE_AUTH_URL`. Never place a Google client secret in the browser.

### Facebook

Create a Meta app, enable Facebook Login, add valid redirect URLs, complete business/app review where required, and configure a server-side callback. Set the callback entry URL in `VITE_FACEBOOK_AUTH_URL`. Never place the app secret in frontend code.

### WhatsApp

Use the Meta WhatsApp Business Cloud API or an approved provider for OTP delivery. Supply the business account, approved template, sender number and access token to the backend. Set `CAREBRIDGE_DEV_OTP=false` after live delivery is verified.

## Production requirements

The included Node API is a development foundation, not a complete production identity platform. Before real patient data is used, move accounts and sessions to a managed database/identity service, use HTTPS-only secure cookies or rotated short-lived tokens, add MFA, account recovery, email/phone ownership checks, audit storage, key management, independent security testing and legal/privacy approval.
