# CareerNova Copilot Instructions

CareerNova: A Personalized Career Readiness and Recommendation Platform is a mobile-first student career app. The primary product focus is job discovery, resume-to-job semantic matching, and personalized recommendations; roadmaps and RAG interviews are supporting modules.

## Repository boundaries

- `frontend/` is the Expo/React Native/TypeScript workspace. Run its commands from that directory.
- `backend/` is isolated for future Firebase-compatible server work.
- Root `App.tsx` is a thin bridge only; do not put screens or business logic there.
- Preserve the frontend-only `.easignore` and `EAS_NO_VCS`/`EAS_PROJECT_ROOT` upload workflow because the Git root is above CareerNova.

## Approved stack

Use the Abstract.docx stack: React Native, Expo, TypeScript, React Native Web, Firebase Authentication, Cloud Firestore, Firebase Cloud Storage, Google OAuth 2.0, NLP, embeddings, semantic matching, weighted ranking, LLMs, RAG, and Greenhouse/Lever/Ashby/company career sources. Do not introduce the earlier FastAPI, PostgreSQL, ChromaDB, FAISS, LangChain, Docker, or Google Programmable Search proposal without an explicit decision.

Read `docs/PROJECT_CONTEXT.md` and `docs/IMPLEMENTATION_ROADMAP.md` before substantial work. Do not claim features or tests are complete without verifying them. Never put secrets in the Expo client; use Firebase rules and server-side secret management.
