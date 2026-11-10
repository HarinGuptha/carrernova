# CareerNova

CareerNova is a mobile-first career companion for students and early-career candidates. The current MVP shell is built with Expo and React Native.

## Run locally

```bash
cd frontend
npx --yes node@22 node_modules\expo\bin\cli start
```

Use Expo Go to open the development server. For a device outside your local network, use the working ngrok tunnel command:

```bash
cd frontend
npx --yes node@22 node_modules\expo\bin\cli start --tunnel ngrok
```

For a browser preview, append `--web` instead of `--tunnel ngrok`.

Use `npm run web` or `npx --yes node@22 node_modules\\expo\\bin\\cli start --web --clear` for React Native Web. A URL containing `/_expo/loading` belongs to the development-client loader and is not the browser app entrypoint.

Node.js 22.13+ is required by the current Expo toolchain. The `@expo/ngrok` helper is installed in the frontend dev dependencies, so the tunnel does not require Expo account login.

## Project structure

- `frontend/App.tsx` - Expo entrypoint that only links to the frontend navigator
- `frontend/app.json` - Expo configuration
- `frontend/package.json` - frontend dependencies and scripts
- `frontend/assets/` - mobile and web assets
- `frontend/src/components/` - reusable UI components
- `frontend/src/data/` - local mock data used by the MVP UI
- `frontend/src/navigation/` - app navigation and tab state
- `frontend/src/screens/` - feature screens for auth, profile, jobs, roadmap, and interviews
- `frontend/src/services/` - API clients and integrations for resume parsing and recommendations
- `frontend/src/state/` - shared session and profile state
- `frontend/src/types/` - shared frontend domain models
- `backend/` - isolated backend workspace for controllers, services, models, routes, config, and tests

All frontend commands should be run from `frontend/`. The repository root is reserved for workspace documentation and the separate application folders.

## Implementation docs

- `docs/PROJECT_CONTEXT.md` - confirmed product, stack, architecture boundaries, and current implementation scope
- `docs/IMPLEMENTATION_ROADMAP.md` - milestone status and command evidence
- `docs/FIREBASE_SETUP.md` - local Firebase, Firestore rules, and isolated EAS setup

## Authentication setup

Copy `frontend/.env.example` to `frontend/.env`; the provided CareerNova Firebase web configuration belongs in that local file. In Firebase Console, enable Email/Password and Google under Authentication > Sign-in method. Android Google sign-in is configured; iOS is intentionally deferred until an iOS OAuth client ID is available. Web uses Firebase's browser popup flow.

For web testing, use `npx --yes node@22 node_modules\\expo\\bin\\cli start --web` and enable Google in Firebase. For Android Google OAuth, Expo's current guidance requires a development build because Expo Go cannot complete custom OAuth redirects. Build/run the Android development client after setting the `careernova` scheme, then register the matching redirect URI in Google Cloud Console.

LinkedIn and GitHub buttons are included in the UI, but their OAuth client secrets must stay in the backend. Implement the exchange in `backend/`, then return a Firebase custom token or provider credential to the mobile client. Do not put provider secrets in `frontend/.env` or the app bundle.

## MVP flow

The first screen focuses on career readiness, a next action, job matches, and roadmap progress. The bottom navigation is wired for the Home, Discover, Roadmap, and Profile destinations so feature screens can be added without changing the dashboard's visual language.
