# Firebase Setup

## Local frontend

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Fill the Firebase web app values and Google client IDs locally. Never commit `frontend/.env`.
3. In Firebase Console, enable Firebase Authentication providers required by the current UI.
4. For Android Google Sign-In, register package `com.careernova.app`, add the EAS development build SHA-1 fingerprint, download `google-services.json`, and configure it for the native build before the next EAS build.
5. Deploy `firestore.rules` only after reviewing the target Firebase project and receiving authorization.
6. Deploy `storage.rules` with the same Firebase project when resume uploads are ready.
7. Deploy the isolated backend Functions from the repository root with `firebase deploy --only functions,firestore,storage` after authenticating with the intended Firebase project.

The verified project is currently on Spark. Firebase Functions Gen 2 and the current Cloud Storage billing model require Blaze, so live M2 extraction/upload deployment is blocked until billing is enabled. No deployment was attempted by this implementation.

## Local commands

```powershell
cd frontend
npx --yes node@22 node_modules\typescript\bin\tsc --noEmit
npx --yes node@22 node_modules\eslint\bin\eslint.js .
npx --yes node@22 node_modules\expo\bin\cli export --platform web
```

For browser testing, use `npm run web` or `npx --yes node@22 node_modules\expo\bin\cli start --web --clear`. The URL `/_expo/loading` is a development-client loader route, not the React Native Web entrypoint; do not open it as the web app.

The verified local Firestore probe resolves the configured project to `carrernova-ae1e6` and database `(default)`. An unauthenticated probe should return `permission-denied` under the owner-only rules. If an old Metro process still logs `database '(default)' not found`, stop it, clear Metro, and restart from `frontend/` so the current `.env` and explicit Firestore singleton are bundled.

```powershell
npx kill-port 8081
npx --yes node@22 node_modules\expo\bin\cli start --web --clear
```

## EAS archive boundary

The Git root is above CareerNova. Build only the frontend workspace with:

```powershell
$env:EAS_NO_VCS="1"
$env:EAS_PROJECT_ROOT="C:\Web_dev\CarrerNova\frontend"
cd frontend
npx eas-cli@latest build --profile development --platform android --non-interactive
```

The frontend `.easignore` excludes dependencies and generated output. Do not replace it with a repository-wide archive.

## Resume processing

The frontend uploads only to the private path `users/{uid}/resumes/{resumeId}/{fileName}` and writes metadata to the matching Firestore subcollection. The `backend/src/index.ts` Storage trigger parses text-based PDF/DOCX files and writes structured evidence to `extractedProfile`. Scanned/image-only documents are marked failed rather than OCR'd or guessed.
