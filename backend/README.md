# CareerNova Backend

This folder is intentionally isolated from the Expo frontend. Add the backend implementation here without changing the mobile app entrypoint.

Suggested modules:

- `src/controllers/` - request handlers
- `src/services/` - resume parsing, job matching, skill gaps, and roadmap logic
- `src/models/` - database models
- `src/routes/` - REST route definitions
- `src/config/` - environment and database configuration
- `tests/` - API and service tests

The frontend API client expects the backend base URL from `EXPO_PUBLIC_API_URL` and defaults to `http://localhost:3000/api`.

## M2 resume extraction

`src/index.ts` exports `processResume`, a Firebase Storage `onObjectFinalized` trigger. It accepts private user-scoped PDF/DOCX uploads, extracts selectable text with `pdf-parse` or `mammoth`, performs deterministic quality checks, then calls server-side OpenRouter using the Firebase Functions `OPENROUTER_API_KEY` secret for resume validation and structured extraction. It writes structured evidence plus extraction status to the matching Firestore resume document and never stores raw resume text.

For local development, replace the placeholder in `backend/.env`. This file is ignored by Git and the key must never be placed in the Expo frontend. For deployed Firebase Functions, configure the same value as the `OPENROUTER_API_KEY` Firebase Functions secret; the local `.env` file is not a substitute for the deployed secret. If the provider is not configured, processing fails explicitly rather than fabricating extracted data.
