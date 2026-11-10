Project
CareerNova: A Personalized Career Readiness and Recommendation Platform. It is a mobile-first student career app for resume analysis, job discovery, semantic resume–job matching, personalized job recommendations, skill-gap analysis, learning roadmaps, and RAG-based mock interviews. Primary focus: job discovery and recommendations. It is not an answer-script evaluation product and does not guarantee employment.
Final approved technology stack
The user confirmed Abstract.docx as final: React Native, Expo, TypeScript, React Native Web, Firebase, Cloud Firestore, Firebase Authentication, Firebase Cloud Storage, Google OAuth 2.0, NLP, text embeddings, semantic matching, weighted ranking, LLMs, RAG, Greenhouse API, Lever API, Ashby API, company career pages, VS Code, Git, GitHub, EAS CLI.

Do not replace this with earlier alternatives from Major-5 such as separate React.js, FastAPI, PostgreSQL, ChromaDB, FAISS, LangChain, Docker, or Google Programmable Search unless the user explicitly changes the decision. Exact parser/model/server-side choices must be checked against existing code and documented decisions; do not invent model IDs or credentials.
Repository architecture — preserve
- frontend/ is the Expo app workspace and contains Expo assets, package files, configuration, and frontend source.
- backend/ is isolated from frontend.
- Root App.tsx is only a thin bridge to the frontend navigator; do not put screens or business logic there.
- The .easignore and isolated frontend EAS archive/upload fix is already working. Do not casually modify or undo it.
- Run frontend package/Expo commands from frontend/ after checking its scripts.
- Do not move package/config/assets/source back to the root or merge frontend/backend.
Working rules
- Inspect existing code and preserve the current mobile UI. Integrate features into existing screens; do not redesign or rebuild them unnecessarily.
- Separate presentation, navigation, data models, hooks, and Firebase/service logic.
- Use TypeScript types and runtime validation. Avoid any without a reason.
- Keep secrets, service-account keys, LLM keys, and private API credentials out of the mobile app and Git. Use server-side secret management.
- Use least-privilege Firebase Security Rules; never use public allow read, write: if true rules.
- Do not fabricate resume skills, job information, learning links, test results, or completed implementation status.
- A missing skill in a resume means “not evidenced in this resume,” not necessarily that the student lacks it.
- A job-match score is relevance, not hiring probability.
- Use documented public job APIs and respect their terms, pagination, and rate limits.
- Add only necessary Expo-compatible dependencies; check compatibility with the repository's installed Expo SDK.
- Do not modify unrelated files or do broad refactors.
Progress discipline
Before substantial work, inspect current code and docs/IMPLEMENTATION_ROADMAP.md. Update the roadmap after implementation with actual status and test evidence. Never mark work complete unless verified. Report commands actually run and any blockers clearly.

