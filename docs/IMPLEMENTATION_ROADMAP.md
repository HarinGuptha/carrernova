# CareerNova Implementation Roadmap

## Status legend

- `[x]` implemented and locally verified
- `[~]` partially implemented or requires external setup
- `[ ]` not started

## Completed foundation

- [x] Frontend isolated under `frontend/`; backend isolated under `backend/`.
- [x] Root `App.tsx` remains a thin bridge.
- [x] Premium Home, Discover, Roadmap, and Profile UI.
- [x] Frontend-only EAS archive workflow with `.easignore`, `EAS_NO_VCS=1`, and `EAS_PROJECT_ROOT`.

## M1 — Firebase foundation and candidate profile

- [x] Firebase modular client initialization from Expo public environment variables.
- [x] Native auth persistence with AsyncStorage and web auth support.
- [x] Email/password sign-up, sign-in, auth restoration, and sign-out.
- [x] Google web popup and native Google Sign-In integration paths.
- [x] Typed Firestore profile service using `users/{uid}` with merge semantics.
- [x] Firestore owner-only rules in `firestore.rules`.
- [~] Live Firebase/Google Console verification depends on enabling providers, registering Android SHA-1, and supplying `google-services.json` for the native build.

### M1 evidence

- `npx --yes node@22 node_modules/typescript/bin/tsc --noEmit` passed.
- `npx --yes node@22 node_modules/eslint/bin/eslint.js .` passed.
- `npx --yes node@22 node_modules/expo/bin/cli export --platform web` passed.
- Android EAS development build completed for the native auth integration, but live Google sign-in remains dependent on Firebase Android console configuration.

## M2 — Resume upload and extraction

- [x] Private Firebase Storage upload from the Profile > Resume & skills workflow.
- [x] Server-side PDF/DOCX extraction Function boundary using Firebase Storage triggers.
- [x] Typed extracted profile review and correction flow with live Firestore status updates.
- [x] Storage owner-only rules and PDF/DOCX size/type validation.
- [~] Deployment to the real Firebase project and live extraction remain manual console/CLI steps; the current Spark plan must be upgraded to Blaze for Functions Gen 2 and the production Storage workflow.

### M2 evidence

- Frontend TypeScript, ESLint, and Expo web export pass.
- Backend Functions TypeScript check passes.
- Upload path is `users/{uid}/resumes/{resumeId}/{fileName}`.
- The parser extracts only evidence found in PDF/DOCX text; it does not invent skills.

## M3 — Job catalogue

- [ ] Greenhouse adapter.
- [ ] Lever adapter.
- [ ] Ashby adapter.
- [ ] Normalization, deduplication, freshness, retries, and source URLs.

## M4 — Matching and recommendations

- [ ] Embedding generation and Firestore-compatible vector search decision.
- [ ] Preference-aware weighted ranking.
- [ ] Matched/missing skill explanations.
- [ ] Similar-company recommendations.

## M5 — Skill gaps and roadmap intelligence

- [ ] Evidence-aware skill gap analysis.
- [ ] Verified learning-resource catalogue.
- [ ] Grounded personalized roadmap generation.

## M6 — RAG interviews

- [ ] Curated interview knowledge base.
- [ ] Role/company retrieval.
- [ ] Interactive interview session and grounded feedback.

## M7 — Hardening and release

- [ ] Emulator/security-rule tests.
- [ ] Android/Web end-to-end testing.
- [ ] Privacy, deletion, observability, and release documentation.
