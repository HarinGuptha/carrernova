# CareerNova Project Context

## Identity

CareerNova: A Personalized Career Readiness and Recommendation Platform. It is a mobile-first app for college students, fresh graduates, and early-career job seekers. It assists with job discovery, semantic resume-to-job matching, skill gaps, learning plans, and role/company-relevant RAG interview practice. It does not guarantee employment or interview selection.

## Confirmed stack

Abstract.docx is the authority: React Native, Expo, TypeScript, React Native Web, Firebase, Cloud Firestore, Firebase Authentication with Google OAuth 2.0, Firebase Cloud Storage, NLP, text embeddings, semantic matching, weighted ranking, LLMs, RAG, Greenhouse API, Lever API, Ashby API, company career pages, VS Code, Git/GitHub, and EAS CLI.

Earlier Major-5 alternatives such as FastAPI, PostgreSQL, ChromaDB, FAISS, LangChain, Docker, and Google Programmable Search are not the current stack.

## Repository boundaries

- `frontend/` contains the Expo app, UI, Firebase client, and client services.
- `backend/` is isolated for trusted server-side work and future job/AI integrations.
- Root `App.tsx` remains a thin frontend bridge.
- EAS must use the frontend-only no-VCS archive workflow because the parent Git root is `C:/Web_dev` and contains unrelated projects.

## Current implementation

- Premium Home, Discover, Roadmap, and Profile mobile UI.
- Firebase client singleton with native AsyncStorage persistence and web auth support.
- Email/password authentication and native/web Google sign-in paths.
- Firestore profile synchronization for authenticated users at `users/{uid}`.
- Least-privilege Firestore rules in `firestore.rules`.
- `.env.example` contains placeholders; real local values stay in ignored `frontend/.env`.

## M1 boundaries

M1 implements Firebase initialization, authentication state, sign-in/sign-out, and basic candidate profile persistence. It does not yet implement resume upload, job ingestion, embeddings, ranking, roadmap generation from AI, or RAG interviews.

## Security

Do not expose private API keys, service-account credentials, LLM keys, OAuth client secrets, resume text, or interview data in logs or client code. Treat missing resume evidence as “not evidenced in this resume,” not proof that a candidate lacks a skill. Match scores are relevance estimates, not hiring probabilities.
