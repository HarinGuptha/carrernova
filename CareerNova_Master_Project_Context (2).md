# CareerNova — Master Project Context & AI Handover Guide

**Purpose of this document:** This is the master context for any AI assistant, new chat, developer, reviewer, or teammate who needs to understand CareerNova from the problem being solved through the mobile app, technical approach, modules, project status, and Phase-II implementation plan.

**How another AI should use this document:** Treat the sections marked **Confirmed from project materials** as the current project baseline. Treat anything marked **Proposed / to be finalized** as a design recommendation, not an already implemented fact. Do not invent implementation progress, API credentials, datasets, model names, performance results, or final architecture decisions.

**Final technology decision (user-confirmed):** Abstract.docx is the authoritative source for the final technology stack. Where Major-5 contains different technology choices, use Abstract.docx and treat those Major-5 items as earlier/non-final options only.

---

## 1. Project identity

### Official project title

**CareerNova: A Personalized Career Readiness and Recommendation Platform**

Do not append “Answer Script Evaluation” or any examination-evaluation wording to the title. That wording came from the friend’s sample report and is unrelated to CareerNova.

### One-line description

CareerNova is a student-focused, AI-powered mobile career companion that analyses a student's resume and career preferences, discovers relevant job openings from supported company job sources, ranks suitable opportunities using semantic matching, identifies missing skills, creates personalized learning guidance, and provides role- and company-specific mock interview practice using Retrieval-Augmented Generation (RAG).

### Main product

The project is being planned as a **mobile application**, using React Native, Expo, and TypeScript. React Native Web is listed in the Abstract technology stack for a possible web version. The core product experience is mobile-first; it is not merely a static website or a generic chatbot.

### Target users

- College students preparing for internships and campus/off-campus placements.
- Fresh graduates and entry-level job seekers.
- Early-career candidates who need help identifying suitable roles and preparing for them.

### Main value proposition

CareerNova connects three activities that students often handle separately:

1. **Discover suitable jobs** based on a real candidate profile and preferences.
2. **Understand and close skill gaps** between the candidate and target roles.
3. **Prepare for interviews** using role- and company-relevant practice and feedback.

CareerNova is an assistive recommendation and preparation platform. It does **not** guarantee employment, guarantee interview selection, or replace employers' recruitment decisions.

---

## 2. Problem being solved

Students face several connected problems during job searching and placement preparation:

1. **Too many scattered job postings.** Job openings are spread across company career pages and different job platforms. Students spend time searching several sources and may miss suitable openings.
2. **Basic keyword matching is limited.** Traditional search often looks for exact words. It may miss a suitable job when a resume and job description express the same skill or experience in different language.
3. **Poor personalization.** A candidate's skills, education, projects, experience, career domain, preferred role, target company, location, work mode, salary expectations, and eligibility may not be considered together.
4. **Over-focus on a dream company.** A student may search only for one preferred company and miss relevant jobs at other organizations with similar roles or requirements.
5. **Unclear job suitability.** Students may see a vacancy but not understand which parts of their resume match it or why the system considers it relevant.
6. **Unclear skill gaps.** Students may not know exactly which technical or soft skills are missing for a target job.
7. **Generic learning plans.** Many learning platforms provide broad plans based on a job title rather than the actual gaps in a student's resume.
8. **Generic interview practice.** Standard mock interview tools may use general questions and may not adapt to the candidate's target role, company, skills, or previous answers.
9. **Disconnected preparation tools.** Resume screening, job searching, skill learning, and interview practice are often handled in separate tools. Students must connect the process themselves.

### Central problem statement

Students need an intelligent, personalized job-search and placement-preparation system that can analyse a resume and explicitly provided preferences, discover current opportunities from supported job sources, filter and rank opportunities according to candidate suitability, recommend related opportunities from similar companies, explain the match, identify skill gaps, and provide personalized learning and mock-interview support.

---

## 3. Proposed solution and project scope

CareerNova creates a continuous workflow from candidate profile creation to job discovery and preparation.

### Core capabilities

- Student registration and authentication.
- Candidate profile and career-preference collection.
- Resume upload and information extraction.
- Structured resume/profile representation.
- Job collection from supported job APIs and company career pages.
- Job data cleaning, normalization, and storage.
- Semantic resume-to-job matching using text embeddings.
- Weighted ranking based on skills and user preferences.
- Recommendations for the target company and relevant alternatives from similar companies.
- Match suitability score with understandable reasons.
- Skill gap identification for a target role or recommended job.
- Personalized learning roadmap and resource recommendations.
- RAG-based role- and company-specific mock interviews.
- Feedback and progress tracking.
- Centralized dashboard for recommendations and career readiness.

### What CareerNova is not

- It is not an examination or handwritten-answer evaluation system.
- It is not simply a job-board clone that shows every vacancy without personalization.
- It is not only a resume parser.
- It is not a system that guarantees a job or makes hiring decisions.
- It is not intended to fabricate skills or improve resumes by inventing candidate experience.
- Direct job application submission is not confirmed as a core feature. The safe baseline is to show authentic job details and official application links.

### Primary versus secondary emphasis

The primary focus is **job discovery, resume-to-job matching, and personalized job recommendations**. Career preparation features—skill gap analysis, learning roadmaps, and RAG-based mock interviews—support the main job-recommendation goal. Do not let the roadmap feature overshadow the core job discovery and matching system.

---

## 4. End-to-end user journey

1. **Open the mobile app.** The student registers or signs in.
2. **Set career preferences.** The student enters preferred role, domain, target/dream company, location, work mode, and other relevant filters. Salary and eligibility can be collected where applicable.
3. **Upload resume.** The student uploads a digital resume.
4. **Extract profile.** The system identifies skills, education, projects, and experience and builds a structured candidate profile.
5. **Review extracted details.** Recommended practice: allow the student to correct extraction mistakes before matching.
6. **Collect jobs.** The job-ingestion component retrieves publicly available listings from supported ATS/job-board APIs and approved company sources.
7. **Normalize job information.** Different source formats are converted into a consistent job record.
8. **Filter and match.** Hard preference/eligibility filters are applied where possible; semantic embeddings compare candidate and job content.
9. **Rank recommendations.** Weighted ranking considers job relevance and user preferences.
10. **Explain recommendations.** The app shows matched skills, relevant experience, preference fit, missing requirements, and a suitability score.
11. **Show alternatives.** The system recommends related jobs and appropriate opportunities from companies similar to the preferred company.
12. **Analyse skill gaps.** The system compares current skills with target-role requirements.
13. **Generate learning plan.** An LLM creates a structured plan based on missing skills; trusted learning sources should be linked rather than inventing course URLs.
14. **Practise interviews.** RAG retrieves role/company-relevant interview material and the LLM conducts a practice session and provides feedback.
15. **Track progress.** The dashboard displays saved/recommended jobs, skills to improve, roadmap progress, and interview-practice history.

---

## 5. Functional modules

### 5.1 User registration, authentication, and candidate profile

**Purpose:** Establish a secure student account and collect the preferences needed for personalized recommendations.

**Expected information:**
- Basic profile details.
- Resume and extracted profile data.
- Preferred job role and career domain.
- Dream/target company and related company interests.
- Preferred locations and work modes (remote, hybrid, onsite).
- Experience level and education/qualification information.
- Salary expectations and eligibility constraints, when the student supplies them and job data contains those fields.

**Output:** A candidate profile and preference record for downstream matching.

### 5.2 Resume upload, parsing, and profile extraction

**Purpose:** Convert resume content into structured information that can be compared with job requirements.

**Fields explicitly named in the project materials:**
- Technical skills.
- Educational qualifications.
- Projects.
- Work experience.

**Suggested additional fields, subject to validation:** certifications, achievements, tools, languages, links, and internships.

**Expected processing:** accept a digital resume, extract text, identify sections/entities, normalize skill names, and create a structured profile. The exact accepted file formats and parser library must be decided and tested. Do not assume handwriting recognition or VLMs are required; those belonged to the friend's unrelated report.

**Important:** Do not use an LLM to invent missing candidate information. Any generated profile enhancement must be grounded in the uploaded resume or information the student explicitly supplies.

### 5.3 Job data discovery and ingestion

**Purpose:** Find and collect live/public job postings from supported sources.

**Job sources listed in the Abstract:**
- Greenhouse Job Board API.
- Lever Postings API.
- Ashby Job Postings API.
- Company career pages.

**Additional source mentioned in Major-5:** Google Programmable Search / Custom Search API. Treat this as an optional discovery route from the presentation, not as a finalized replacement for the three ATS job APIs.

**Job fields to collect where available:**
- Job ID and source.
- Job title and company.
- Job description and requirements.
- Required skills and qualifications.
- Experience level.
- Location and workplace type (remote/hybrid/onsite).
- Employment type.
- Salary/compensation, if the source publishes it.
- Published/updated date.
- Job page URL and application URL.

**Processing requirements:** normalize field names, clean HTML, handle missing values, deduplicate postings, track source and retrieval time, and identify stale/expired listings where possible. Never imply a source provides fields that it does not actually return.

**Legal/operational caution:** Use public job endpoints or permitted integrations. Respect API documentation, terms, rate limits, robots/crawling rules, and source attribution. Do not scrape behind logins or bypass access controls.

### 5.4 Semantic matching and weighted job ranking

**Purpose:** Go beyond exact keyword matching and compare the meaning of a candidate's profile with the job requirements.

**Core idea:** represent candidate skills/profile text and job descriptions as vector embeddings, compare semantic similarity, then combine that score with explicit preferences and filters.

**Potential matching dimensions:**
- Required and preferred skill match.
- Job role similarity.
- Domain/industry preference.
- Experience/seniority fit.
- Education/qualification fit where specified.
- Location and work-mode preference.
- Salary fit if salary data exists.
- Preferred company and similar-company relevance.
- Job freshness, if included in the final design.

**Weighted ranking:** The Abstract explicitly names weighted ranking. The exact weights and scoring formula are not finalized. Do not state that a particular score formula or weight distribution has already been implemented. A possible structure is a weighted combination of skill similarity, role/domain fit, experience fit, and preference fit, with hard constraints handled separately.

**Explainability:** show why a job matched: shared skills, relevant projects/experience, role/domain alignment, preference fit, and missing skills. A match score is a relevance indicator, not a probability of getting hired.

### 5.5 Similar-company and alternative-job recommendations

**Purpose:** Help students discover relevant opportunities beyond one dream company.

The system should use the candidate's skills and target role to find alternative roles and companies with comparable job functions or requirements. Company similarity logic is not finalized. It may use industry, role families, skill overlap, company category, or a company/occupation taxonomy. Make the basis transparent and do not invent company relationships.

### 5.6 Skill gap analysis

**Purpose:** Compare a candidate's existing skills with requirements of a target company/job/role.

**Expected output:**
- Skills already demonstrated in the resume.
- Required skills that appear to be missing.
- Skills partially evidenced or needing verification.
- Priority areas to improve.

A missing skill in a resume does not prove the student lacks it. The app should communicate “not found in the uploaded resume” or “not yet evidenced” rather than making an absolute claim.

### 5.7 Personalized learning roadmap

**Purpose:** Convert identified skill gaps into an actionable learning/practice plan.

**Expected content:** prioritized skills, learning sequence, topics to cover, practice tasks/projects, and relevant learning resources/courses/certifications when suitable sources are available.

The Major-5 team allocation describes phased skills, courses, and certifications. The roadmap is intended to be customized to the candidate's target role/company and identified deficiencies, not a generic one-size-fits-all roadmap.

**LLM safety/quality:** ground recommendations in a known resource catalogue or verified links; do not invent course names, certification URLs, or claim a resource is free unless checked.

### 5.8 RAG-based mock interview

**Purpose:** Provide role- and company-relevant interview practice using retrieved material.

**RAG concept:** retrieve relevant prior interview questions and supporting material from a curated knowledge base, then provide that context to an LLM to generate or conduct an interview and assess the candidate's responses.

**Expected functions:**
- Select target role/company/topic.
- Retrieve relevant questions/material.
- Generate interview questions grounded in retrieved context.
- Ask questions interactively.
- Analyse candidate answers.
- Provide useful feedback and improvement areas.
- Save interview history/progress if the student consents.

**Still to decide:** text-only versus voice interview, number of questions, interview types, question-bank source/licensing, LLM provider, feedback rubric, and session storage.

### 5.9 Dashboard and progress tracking

**Purpose:** Present the candidate's career journey in one place.

**Suggested dashboard sections:**
- Profile completion and resume status.
- Recommended jobs and match explanations.
- Saved jobs and application links.
- Target company and similar-company opportunities.
- Skills matched and skill gaps.
- Learning roadmap and progress.
- Mock interview sessions and feedback.
- Overall placement-readiness progress indicators.

The dashboard should be useful on a mobile screen first. Do not overload it with unnecessary administrative functions.

---

## 6. Mobile app: screens and UX direction

**Confirmed:** React Native + Expo + TypeScript, with React Native Web included in the Abstract stack.

**Suggested screen map (to be designed and validated):**

1. Splash / onboarding.
2. Sign in / sign up (Google OAuth 2.0 is listed).
3. Career preferences setup.
4. Resume upload and upload status.
5. Extracted profile preview/edit screen.
6. Home dashboard.
7. Job discovery / recommended jobs list.
8. Filters (role, domain, location, mode, experience, etc.).
9. Job detail and “why this job matches” view.
10. Similar companies / alternative opportunities.
11. Skill gap detail view.
12. Personalized roadmap / learning tasks.
13. Mock interview setup.
14. Mock interview chat/session.
15. Interview feedback and history.
16. Profile, privacy, and settings.

**UX principles:** simple English, minimal friction, visible match explanations, clear separation between required and preferred skills, editable extracted resume information, visible job-source/date, clear official application links, privacy controls, and accessible mobile layouts.

---

## 7. Final technology stack — authoritative source: Abstract.docx

**The user has explicitly confirmed that Abstract.docx contains the final and approved technologies. This section is the source of truth for all future project work. Do not reopen the choice between the Abstract stack and the older Major-5 system-requirements stack unless the user explicitly changes the decision.**

| Layer / purpose | Final technology specified in Abstract.docx |
|---|---|
| Mobile frontend | React Native |
| App development and cross-platform tooling | Expo |
| Programming language | TypeScript |
| Web support | React Native Web |
| Backend and managed application services | Firebase |
| Main application database | Cloud Firestore |
| Authentication | Firebase Authentication |
| Sign-in method | Google OAuth 2.0 |
| Resume and file storage | Firebase Cloud Storage |
| AI and machine learning methods | Natural Language Processing (NLP), text embeddings, semantic matching, weighted ranking, Large Language Models (LLMs), and Retrieval-Augmented Generation (RAG) |
| Job data integration | Greenhouse API, Lever API, Ashby API, and company career pages |
| Development environment | Visual Studio Code |
| Version control and collaboration | Git and GitHub |
| Build and app delivery tooling | EAS CLI (Expo Application Services Command Line Interface) |

### 7.1 What this means for the project

- CareerNova is being developed as a **mobile application** with React Native, Expo, and TypeScript.
- React Native Web is included in the final stack for web support / cross-platform reuse.
- Firebase is the selected backend and managed services platform. Cloud Firestore is the selected database; Firebase Authentication handles authentication; Firebase Cloud Storage stores resumes and other permitted files.
- Google OAuth 2.0 is the specified Google sign-in method.
- AI capabilities are based on the methods explicitly named in the Abstract: NLP, text embeddings, semantic matching, weighted ranking, LLMs, and RAG.
- Job data integration is based on Greenhouse, Lever, Ashby, and company career pages.
- Visual Studio Code, Git, GitHub, and EAS CLI are the specified development tools.

### 7.2 Earlier technologies in Major-5 that are NOT the final selected stack

Some Major-5 slides contain an earlier/different architecture proposal. These items must **not** be represented as CareerNova's final technologies because the user has confirmed Abstract.docx as final:

- React.js as a separate web frontend.
- FastAPI / Python as the selected backend framework.
- PostgreSQL as the main application database.
- ChromaDB or FAISS as the selected vector database.
- Google Programmable Search / Custom Search API as a confirmed job source.
- spaCy, Hugging Face Transformers, Sentence-Transformers, LangChain, GPT/Claude APIs as confirmed implementation choices.
- Docker / Docker Compose and GitHub Actions as confirmed deployment/CI tools.

These technologies may be mentioned only as earlier concepts shown in Major-5 or as optional future possibilities if the user specifically asks for alternatives. Do not mix them into implementation instructions or project documentation as though they were approved.

### 7.3 Implementation details that are still unspecified

The final technology categories above are fixed, but the Abstract does not specify every library, service configuration, or model. These details should be selected within the approved stack and documented only after the team decides them:

1. The exact resume parsing library or extraction implementation.
2. The exact embedding model and how embeddings will be generated and searched.
3. The vector storage / similarity-search implementation compatible with the Firebase-centered architecture.
4. The LLM provider and exact model for learning-roadmap generation and mock interviews.
5. The secure server-side mechanism for job ingestion, API calls, and LLM/RAG orchestration. Do not place private API keys in the mobile application. The exact Firebase/server-side execution service is not stated in Abstract.docx and remains to be finalized.
6. The exact RAG framework and the source/licensing of the interview question knowledge base.
7. The deployment configuration, Firebase security rules, storage limits, and EAS build profiles.

Treat these as implementation decisions—not as a reason to substitute FastAPI, PostgreSQL, or a different frontend. When recommending an additional library or service, label it clearly as a suggestion and explain how it fits the approved Abstract.docx stack.

### 7.4 Architecture baseline

Use this as the default high-level architecture for future diagrams and implementation discussions:

**React Native + Expo + TypeScript mobile app (with React Native Web support) → Firebase Authentication / Google OAuth 2.0 → Firebase-backed application services and Cloud Firestore → Firebase Cloud Storage for resume files.** The application uses secure integrations with Greenhouse, Lever, Ashby, and company career pages. NLP, embeddings, semantic matching, weighted ranking, LLMs, and RAG provide the AI capabilities. The exact secure server-side execution layer for external API keys and AI orchestration still needs to be specified, but it must remain compatible with the approved Firebase-centered stack.

Do not draw FastAPI + PostgreSQL + ChromaDB as the current architecture. If a server-side component or vector store is later selected, represent it as an additional implementation detail approved by the team, not as a replacement for the final Abstract technology list.

---

## 8. Job source API notes and official resources

These are public documentation starting points, not proof that the team has connected the APIs already.

### Greenhouse Job Board API

- Official docs: https://docs.greenhouse.io/job-board
- Public job-board GET endpoints do not require authentication according to the current documentation.
- Example listing endpoint: `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs`
- Use the optional `content=true` parameter when full job descriptions are required.
- A company board token is needed. The application-submission endpoint is separate and requires authentication; CareerNova's baseline scope is job discovery and linking, not submitting applications.

### Lever Postings API

- Official API documentation/examples: https://github.com/lever/postings-api
- Published postings are available under a company's Lever site name.
- Listing endpoint pattern: `GET /v0/postings/{SITE}?skip=X&limit=Y`
- JSON can be requested using `Accept: application/json` or the documented mode parameter.
- Handle global/EU instances where relevant, pagination, and missing fields.

### Ashby Job Postings API

- Official public job-posting API: https://developers.ashbyhq.com/docs/public-job-posting-api
- Public job-board endpoint pattern: `GET https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_NAME}`
- Optional compensation data can be requested with the documented parameter.
- Available fields may include title, location, remote/workplace type, description, published date, employment type, job URL, and apply URL. Fields can be missing depending on the company's data.
- Do not confuse the public posting API with other Ashby endpoints that require authenticated permissions.

### Search API mentioned in Major-5

Google Programmable Search / Custom Search API is named in the Major-5 slides as a possible discovery mechanism. Treat it as optional until current availability, quota, terms, cost, and suitability have been verified. Prefer structured public ATS feeds when possible because they return cleaner job data.

---

## 9. AI and data-processing concepts

### Natural Language Processing (NLP)
Used to process resume and job-description text, identify skills/entities/roles, normalize terms, and prepare content for matching.

### Text embeddings
Convert resume/profile text and job descriptions into vector representations so semantically related content can be found even when exact keywords differ.

### Semantic similarity
Compare vector representations and/or skill concepts to estimate how closely a candidate profile aligns with a job description. Similarity alone is not a hiring decision.

### Weighted ranking
Combine semantic match with explicit candidate preferences and job requirements. The weights must be designed, explained, and evaluated; no final formula is specified in the source materials.

### Large Language Models (LLMs)
May support structured extraction, explanations, learning-plan generation, and interactive mock interviews. Use schema-constrained outputs where possible, validate responses, and avoid fabricated candidate data or learning links.

### Retrieval-Augmented Generation (RAG)
Retrieve relevant interview questions and source material first, then provide that material as context to the LLM. This is intended to reduce unsupported generation and make interview preparation more role/company-specific. RAG quality depends on the quality, permission, coverage, and freshness of the knowledge base.

### Specific AI libraries and models
The final Abstract specifies the AI methods (NLP, text embeddings, semantic matching, weighted ranking, LLMs, and RAG), but it does not name particular model families, model providers, or orchestration libraries. Therefore, the exact embedding model, LLM provider/model, RAG framework, and vector-search implementation remain to be selected. Do not assume that spaCy, Hugging Face Transformers, Sentence-Transformers, LangChain, FAISS, ChromaDB, GPT, or Claude are approved implementation choices merely because some were mentioned in Major-5. They may be evaluated as options only when a task specifically requires a recommendation, and any suggested addition must fit the Abstract.docx final stack.

---

## 10. Suggested data model (design aid; not a confirmed schema)

A practical first schema could include:

- **User:** user ID, account details, authentication provider, timestamps.
- **CandidateProfile:** education, experience, projects, extracted skills, resume reference, profile version.
- **CareerPreferences:** target roles, domains, companies, location, work mode, salary and other filters.
- **Resume:** storage location, file type, upload time, extraction status, extracted text, parse warnings.
- **Skill:** normalized skill name, aliases, category, source/evidence.
- **Company:** company name, sector/industry, source ATS, company board identifier.
- **JobPosting:** source ID, title, company, description, skills, qualifications, location, work mode, employment type, compensation, dates, official URLs, source metadata.
- **JobMatch:** candidate ID, job ID, component scores, overall score, rank, explanation, timestamp.
- **SkillGap:** candidate ID, target job/role, required skill, evidence status, priority.
- **LearningRoadmap:** target role, skill sequence, resources, tasks, deadlines/status.
- **InterviewSession:** target company/role, retrieved context references, questions, candidate answers, feedback, date.
- **ProgressRecord:** completed learning tasks, practice history, progress summaries.

Keep personally identifiable information and resume files protected. Store only what is necessary and define retention/deletion rules.

---

## 11. Evaluation and testing plan

No measured system accuracy or completed implementation test results have been supplied. The following are proposed Phase-II evaluation methods.

### Resume parsing
- Create an accurately labelled test set of resumes with permission and sensitive information removed where possible.
- Measure field-level Precision, Recall, and F1 for skills, education, projects, and experience.
- Review extraction completeness and invalid/unsupported fields.

### Job ingestion
- Measure API request success rate, number of valid listings collected, missing-field rate, duplicate rate, stale/expired listing rate, and ingestion time.
- Verify job title, source, company, dates, and official URL against the original listing.

### Job recommendation
- Create a manually judged candidate-job relevance set.
- Evaluate Precision@K, Recall@K, nDCG@K, Mean Reciprocal Rank (MRR), recommendation coverage, and diversity of relevant companies.
- Ask reviewers/students to assess whether the top-ranked jobs are genuinely relevant.

### Skill gap analysis
- Compare identified gaps with a human-reviewed target-role requirement list.
- Measure precision/recall where labels are available and collect expert/student feedback on usefulness.
- Distinguish “not present in resume” from “candidate does not possess skill.”

### Learning roadmap
- Evaluate relevance to identified gaps, ordering, feasibility, clarity, and resource-link validity.
- Have a reviewer verify that suggested courses/certifications/resources exist and match the described skill.

### RAG mock interviews
- Evaluate question relevance to role/company, retrieval relevance, factual grounding, answer-feedback usefulness, hallucination rate, response time, and student satisfaction.
- Keep source references for retrieved interview material.

### Mobile app/system quality
- Test Android and iOS behavior as applicable, small-screen layouts, navigation, upload failures, login/logout, network interruption, loading states, accessibility, and dashboard responsiveness.
- Test authorization boundaries and file access rules.

**Important:** Set numeric targets only after choosing datasets, models, and test methodology. Never invent achieved accuracy values in reports or presentations.

---

## 12. Phase-I status versus Phase-II plan

### Phase-I work documented as completed
- Problem identification and requirement analysis.
- Literature review and comparison of 20 papers.
- Identification of research gaps and limitations of existing systems.
- Project objectives, scope, and proposed approach.
- Technology identification and initial technology-stack planning.
- Preliminary architecture and workflow design.
- Use-case, sequence, class, activity, deployment, implementation, and system-architecture diagrams are included in the Major-5 materials.
- Module-wise responsibilities and work distribution.

### Implementation status caution
The available Phase-I materials document research, design, requirements, and planned module responsibilities. They do **not** establish that all software modules have been implemented or that performance tests have been completed. Unless the team has newer evidence, state that the modules are planned for Phase-II rather than “completed in Phase-I.”

### Phase-II planned work
1. Resume analysis and candidate profile extraction.
2. Job data collection and source/API integration.
3. Semantic matching and weighted job recommendation.
4. Similar-company and alternative-job recommendation.
5. Skill gap analysis.
6. Personalized learning roadmap generation.
7. RAG-based mock interview and feedback.
8. Mobile dashboard and progress tracking.
9. End-to-end integration, testing, validation, documentation, and demonstration.

### Proposed 12-week timeline from the report draft
| Period | Activity |
|---|---|
| Weeks 1–2 | Resume analysis and candidate profile development |
| Weeks 3–4 | Job data collection and API integration |
| Weeks 5–6 | Semantic matching and recommendation |
| Weeks 7–8 | Skill gap analysis and personalized roadmap |
| Weeks 9–10 | RAG mock interview and dashboard |
| Weeks 11–12 | Integration, testing, documentation, and demonstration |

This is a proposed timeline, not evidence that tasks have already been completed.

---

## 13. Team members, guide, and work allocation

**Institution:** VNR Vignana Jyothi Institute of Engineering and Technology  
**Department:** Computer Science and Engineering  
**Team:** Team 5  
**Guide:** Dr. K. Venkata Ramana, Assistant Professor-CSE

| Team member | Roll number | Module / role listed in Major-5 |
|---|---|---|
| A. Nirup | 23071A05E4 | NLP & Semantic Search Specialist: skill/entity extraction, preprocessing, summarization, embeddings, semantic search. |
| G. Akshay Kumar | 23071A05F9 | RAG & Career Intelligence Engineer: RAG interview question retrieval and personalized upskilling roadmap. |
| K. Kowshik Reddy | 23071A05G4 | Backend, Dashboard & DevOps Engineer: Firebase-backed application services, candidate/recommendation/skill-gap/career-plan data flows, React Native/React Native Web dashboard screens, and build/deployment support using the approved Abstract stack. Exact server-side execution details remain to be finalized. |
| P. Sai Harin Guptha | 23071A05J5 | Job Data & Ingestion Engineer: discover job postings, extract job data, clean/structure/store job-market information. |

Use **P. Sai Harin Guptha / P. Harin Guptha** as the corrected team member name where the friend's sample previously contained “Vishwanath Raja Chanda.” Do not retain any friend's team name or role in the CareerNova report.

---

## 14. Constraints, assumptions, and risks

### Assumptions
- Students have a readable digital resume and provide accurate career preferences.
- Supported job sources expose public job details or provide an approved integration method.
- Job descriptions contain enough information to support at least partial matching.
- The candidate can review and correct profile extraction results.
- A suitable interview question/resource collection can be assembled with appropriate usage rights.

### Technical and operational constraints
- Different resume formats and layouts can affect extraction quality.
- Job sources may omit salary, skills, experience, or work-mode information.
- Public APIs may have rate limits, source identifiers, pagination, or incomplete coverage.
- Company career pages can change format and availability.
- LLM and embedding processing needs compute resources and may incur API costs.
- Free service tiers, quotas, pricing, and terms can change; “zero cost” should be treated as a project goal, not a guarantee.
- Fresh graduates may have little history for collaborative filtering; CareerNova should rely on resume content and explicit preferences rather than assuming a long interaction history.

### Privacy and security
- Resumes include personal information. Protect uploads and extracted fields.
- Enforce authenticated access and least-privilege database/storage rules.
- Keep API keys and LLM credentials on a secure server, never hard-code secret keys in the mobile app.
- Provide consent, data retention, and deletion controls.
- Avoid using sensitive personal characteristics for job ranking.

### AI reliability and fairness
- Embedding similarity is not proof that a candidate is qualified.
- LLMs can hallucinate skills, courses, interview questions, or explanations; validate and ground outputs.
- Job data can be stale or duplicated; show the source and date and link to the official posting.
- Skill-gap output should be framed as “not found/evidenced” when a resume does not mention a skill.
- Explain the factors behind a recommendation and allow users to apply their own judgement.

---

## 15. SDG relevance

- **SDG 4 — Quality Education:** supports continuous learning, access to role-relevant resources, and skill development through personalized roadmaps and practice.
- **SDG 8 — Decent Work and Economic Growth:** supports employability and access to job opportunities through personalized discovery and placement preparation.
- **SDG 9 — Industry, Innovation and Infrastructure:** applies AI, NLP, semantic matching, and RAG in an integrated digital career platform.

Describe these as contributions/support, not as proof that the project directly achieves the UN goals.

---

## 16. Literature review themes and research foundation

The Major-5 deck reviews 20 papers across the following themes:
- LLM-based and reinforcement-learning job recommendation.
- Resume completion and candidate representation.
- Semantic resume-job matching and embedding-based retrieval.
- Explainable person-job recommendation.
- Student/job matching and personalized recommendation.
- Near real-time job discovery using web crawling and LLMs.
- Graph-based person-job fit and skill-aware recommendations.
- Fairness and bias in resume-job matching.
- AI mock interviews and adaptive interview practice.
- Skill-gap identification and explainable educational data mining.

Core papers most directly aligned with CareerNova include work on LLM job recommendations, LLM-assisted resume completion, ConFit v2 resume-job matching, explainable person-job recommendations, student job matching, real-time web crawling for job recommendations, MockLLM, graph-based person-job fit, JobFormer, virtual AI interviewers, LLM graph understanding for job recommendations, and explainable skill-gap analysis.

The presentation also includes supporting papers on personalized learning recommendations, undergraduate academic-profile job recommendations, aptitude-based career recommendation, career-path/person-job fit, and academic MCDM career guidance. These can be discussed as related but less directly aligned studies.

**Reference-quality caution:** Before final report submission, verify each bibliography entry (authors, exact title, journal/conference, volume/pages/article number, year, DOI) directly against the publisher record. Some source-slide entries may have incomplete or inconsistent citation metadata. Never fabricate bibliographic fields.

---

## 17. Useful official technical and data resources

These are starting points for implementation. The first group documents technologies explicitly selected in Abstract.docx. Check current versions, quotas, pricing, and terms before use.

### Final mobile application stack
- React Native documentation: https://reactnative.dev/docs/getting-started
- React Native TypeScript: https://reactnative.dev/docs/typescript
- Expo documentation: https://docs.expo.dev/
- Expo TypeScript guide: https://docs.expo.dev/guides/typescript/
- Expo EAS Build: https://docs.expo.dev/build/
- Expo EAS CLI: https://docs.expo.dev/eas/
- React Native Web: https://necolas.github.io/react-native-web/

### Final Firebase and authentication stack
- Firebase documentation: https://firebase.google.com/docs
- Cloud Firestore: https://firebase.google.com/docs/firestore
- Firebase Authentication: https://firebase.google.com/docs/auth
- Firebase Cloud Storage: https://firebase.google.com/docs/storage
- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
- Expo authentication guidance: https://docs.expo.dev/develop/authentication/

### Final job data integrations
- Greenhouse Job Board API: https://docs.greenhouse.io/job-board
- Lever Postings API: https://github.com/lever/postings-api
- Ashby Public Job Postings API: https://developers.ashbyhq.com/docs/public-job-posting-api

### AI concepts and optional research resources
The Abstract selects AI methods rather than named vendors or libraries. Use these resources to understand and evaluate possible implementations; do not treat any specific library/model below as approved unless the team selects it:
- Sentence-Transformers: https://www.sbert.net/
- Hugging Face documentation: https://huggingface.co/docs
- ESCO API / skills and occupations: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
- O*NET Web Services: https://services.onetcenter.org/
- O*NET database: https://www.onetcenter.org/database.html

ESCO and O*NET can help normalize occupation and skill concepts. O*NET is US-oriented and ESCO is European; assess how well their terms map to the Indian job market before adopting them as primary sources.

### Development and version control
- Visual Studio Code: https://code.visualstudio.com/docs
- Git documentation: https://git-scm.com/doc
- GitHub documentation: https://docs.github.com/

### Earlier Major-5 tools (not the final selected stack)
FastAPI, PostgreSQL, Docker, ChromaDB, FAISS, LangChain, and Google Programmable Search / Custom Search API appear in earlier Major-5 slides. They are not part of the final approved technology list from Abstract.docx. Do not use them in CareerNova's current architecture or code without an explicit new decision from the user/team.

---

## 18. Nomenclature

| Abbreviation | Meaning |
|---|---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| CI/CD | Continuous Integration / Continuous Delivery or Deployment |
| EAS CLI | Expo Application Services Command Line Interface |
| LLM | Large Language Model |
| NLP | Natural Language Processing |
| OAuth 2.0 | Open Authorization 2.0 |
| RAG | Retrieval-Augmented Generation |
| SDG | Sustainable Development Goal |
| nDCG | Normalized Discounted Cumulative Gain |

Add other terms only if they are actually used in the final report or implementation.

---

## 19. Instructions for any AI assistant working on CareerNova

Paste this document first, then give the AI the specific task. The assistant should follow these rules:

1. Treat the official title as **CareerNova: A Personalized Career Readiness and Recommendation Platform**. Never include “Answer Script Evaluation.”
2. Understand that CareerNova is a **mobile-first app**, not a handwritten-answer evaluation tool.
3. Keep the primary focus on job discovery, resume-job semantic matching, and personalized job recommendation. Skill-gap analysis, learning roadmaps, and mock interviews are supporting preparation modules.
4. Use simple, clear English for academic report answers unless a technical implementation explanation is requested.
5. Preserve the user's actual project scope and report structure. Do not copy the friend's project content; only use the friend's report as a formatting/structure reference.
6. Treat Abstract.docx as the final and authoritative technology stack: React Native, Expo, TypeScript, React Native Web, Firebase, Cloud Firestore, Firebase Authentication, Firebase Cloud Storage, Google OAuth 2.0, NLP, text embeddings, semantic matching, weighted ranking, LLMs, RAG, Greenhouse API, Lever API, Ashby API, company career pages, Visual Studio Code, Git, GitHub, and EAS CLI. Do not reopen this choice. Technologies found only in Major-5 (React.js, FastAPI, PostgreSQL, ChromaDB, FAISS, LangChain, Docker, etc.) are not approved final choices.
7. Do not invent completed implementation, test results, accuracy numbers, APIs connected, datasets, team progress, LLM model names, or deployment status.
8. If providing code, make it runnable, secure, modular, and consistent with the selected stack. Do not put API secrets in the mobile app.
9. For job-source work, prefer official public APIs and their documented fields. Include pagination, missing fields, deduplication, freshness, and source URL handling.
10. For AI features, guard against hallucinated skills, fake courses, fabricated company facts, or misleading job-match explanations.
11. Explain job-match scores as relevance indicators, never as employment probabilities.
12. Keep resume and profile privacy central. Avoid unnecessary collection or exposure of personal data.
13. When researching tools, APIs, prices, model versions, or documentation, check current official sources and report the date/limitations. Free-tier availability and pricing can change.
14. For diagrams, use a clean, simple, academic style. For report sections, match the friend's sample length and structure only when asked.
15. When data is missing or the two project files conflict, explicitly flag it rather than silently guessing.

### Quick prompt to give another AI

“You are my technical and academic project assistant for CareerNova: A Personalized Career Readiness and Recommendation Platform. Read the attached CareerNova Master Project Context fully and use it as the source of truth. CareerNova is a mobile-first AI career platform whose final technology stack is defined by Abstract.docx: React Native, Expo, TypeScript, React Native Web, Firebase, Cloud Firestore, Firebase Authentication, Firebase Cloud Storage, and Google OAuth 2.0. Its AI methods are NLP, text embeddings, semantic matching, weighted ranking, LLMs, and RAG; job sources are Greenhouse, Lever, Ashby, and company career pages. Do not replace this stack with the earlier alternatives found in Major-5. Its core purpose is to analyse student resumes and preferences, discover jobs from Greenhouse/Lever/Ashby and supported company career sources, semantically match and rank roles, recommend similar-company opportunities, identify skill gaps, generate personalized learning roadmaps, and provide RAG-based role/company-specific mock interviews. Keep the job discovery and recommendation system as the primary focus. Do not confuse it with handwritten answer-script evaluation. Do not invent implementation status, metrics, models, datasets, or technologies. Clearly separate confirmed facts, planned work, and suggestions. Help me with whatever I ask next—coding, architecture, APIs, database design, mobile UI, diagrams, research, report writing, testing, or debugging—while following this project context.”

---

## 20. Recommended implementation decisions for CareerNova

**Decision status:** The following is the recommended technical baseline for Phase-II, selected to fit the final technology stack in Abstract.docx, the mobile-first product, the Firebase-centered backend, and a student-project scope. These are recommendations for the team to adopt; they are not claims that the components have already been implemented. The final abstract technology stack is unchanged.

### 20.1 App targets

- **Build Android first** as the primary mobile release and demonstration target.
- Build **React Native Web** from the same TypeScript codebase for a browser-based demonstration and easier faculty review.
- Keep the codebase compatible with iOS, but defer the first iOS release until Android and Web are stable. This avoids multiplying first-release testing and deployment work.
- Use Expo development builds when a native module requires native configuration; use Expo Go only for features supported by Expo Go.

### 20.2 Resume formats and parsing

- MVP accepted formats: **text-based PDF and DOCX**. Do not initially promise support for scanned/image-only PDFs, legacy DOC, or arbitrary image uploads.
- Use Expo Document Picker in the app. Upload the selected file to a private Firebase Cloud Storage path belonging to the signed-in user.
- Parse documents on the trusted server side in Firebase Cloud Functions: `pdfjs-dist` for PDF text extraction and `mammoth` for DOCX text extraction.
- Validate file type, MIME type, file size, page count, and extracted text. Display a clear message when a PDF is scanned or contains no selectable text.
- Treat OCR for scanned resumes as a future enhancement, not a Phase-II dependency.
- Create a structured profile with fields such as skills, qualifications, projects, experience, certifications, and role/domain preferences. Preserve the original text only as long as needed and give the user a clear way to replace or delete the resume.

### 20.3 Embedding model and similarity search

- Recommended embedding model: **Google Gemini Embedding 2 (`gemini-embedding-2`)**. It is a stable text-embedding model and supports configurable output dimensions.
- Set `output_dimensionality` to **768**. This is a practical balance between retrieval quality and storage size, and fits within Firestore vector search's maximum supported dimension of 2,048.
- Use **Cloud Firestore vector search** as the vector store; do not introduce ChromaDB, FAISS, Pinecone, or another separate database in the first version.
- Generate and query vectors server-side using the Node.js Firestore client (`findNearest`) from Cloud Functions. Use cosine distance and apply structured filters (for example role family, location, work mode, and source) where appropriate.
- Store embeddings with job postings and interview knowledge records. Generate the candidate-profile query embedding on demand or when the profile changes. Use the same model, dimension, and text-preparation instructions consistently; if the embedding model changes, re-embed all stored records.

### 20.4 LLM provider and model

- Recommended LLM: **Google Gemini 3.8 Flash (`gemini-3.8-flash`)** for learning-roadmap generation, mock-interview question generation, response feedback, and structured explanations. It is a stable Flash model and is a reasonable quality/cost fit for this project.
- Use structured JSON output for roadmaps, interview questions, feedback, and recommendation explanations so the app can validate and display results reliably.
- Start with one LLM provider and one primary model. Avoid introducing multiple model providers or agent frameworks until the core workflow works.
- Keep inference on the server side. Never put the Gemini API key in the React Native app or a public Expo environment variable.

### 20.5 Secure server-side execution while retaining Firebase

- Use **Firebase Cloud Functions 2nd generation with TypeScript/Node.js** as CareerNova's server-side execution layer. Firebase remains the approved backend platform; this does not replace it with FastAPI or another backend.
- Use authenticated callable/HTTPS functions for resume parsing, profile updates, job retrieval, matching, roadmap generation, and mock-interview calls. Verify the Firebase user identity on each request.
- Use a scheduled Cloud Function (`onSchedule`) for job-board synchronization, initially every **12 hours**, with a user-triggered refresh that is rate-limited.
- Store Gemini keys and any private credentials in **Google Cloud Secret Manager**, exposed only to the specific functions that need them through Firebase Functions secret parameters.
- Use Firebase Admin SDK / server credentials only inside trusted functions. Client apps must never write directly to protected job-ingestion or system-configuration collections.
- **Important cost constraint:** Cloud Functions for Firebase requires the Blaze pay-as-you-go plan. Cloud Storage for Firebase also requires Blaze under the current Firebase storage billing rules. Both have no-cost usage allowances on Blaze, but a billing account is still required and usage beyond free quotas can be charged. Use local Firebase emulators during development, set budget alerts and quotas, keep API/model usage low, and monitor usage. Do not describe the production backend as guaranteed zero-cost.

### 20.6 RAG framework and knowledge sources

- Use a **small custom Retrieval-Augmented Generation pipeline in TypeScript** rather than adding LangChain or another full RAG framework. This keeps the implementation aligned with Firebase, Cloud Functions, Firestore, and the team's available time.
- Store interview resources in Firestore with metadata such as role, company (when supported by a reliable source), topic, difficulty, question, source URL, license/usage note, and embedding.
- Retrieve a small set of relevant questions/resources from Firestore, then pass only that retrieved context plus the candidate's target role and interview history to Gemini. Generate one question at a time and adapt difficulty from the candidate's answers.
- Build the initial knowledge base from team-authored questions, openly licensed materials, official documentation, and public resources whose reuse terms permit the intended use. Do not scrape paywalled or private question banks, copy confidential interview material, or present generated questions as guaranteed actual company questions.
- Use citations/source labels in feedback where the retrieved material supports a factual explanation.

### 20.7 Job-source ingestion strategy

- Start with the three job-source integrations already selected in the Abstract: **Greenhouse Job Board API, Lever Postings API, and Ashby Public Job Postings API**. Use public job-posting endpoints, not employer-only/private recruiting endpoints.
- Greenhouse: `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true`. Public GET access does not require authentication; `content=true` includes the job description and department/office details.
- Lever: `GET https://api.lever.co/v0/postings/{site}?skip={n}&limit={n}&mode=json`. Use `skip`/`limit` pagination and the appropriate global or EU host for the board.
- Ashby: `GET https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_NAME}`. Use the public job-board endpoint and only show postings marked as listed.
- Maintain a curated company-board configuration containing company name, ATS provider, board token/site/slug, careers URL, industry, and role-family tags. The APIs are board-specific; they do not automatically discover every company on the internet. Start with approximately **10–15 target companies** and expand after the ingestion pipeline is reliable.
- Normalize records into one job schema. De-duplicate using provider + board identifier + provider job ID. Store source URL, apply URL, first-seen time, last-seen time, last-updated time, and active/closed status.
- On successful syncs, mark jobs absent from two consecutive full synchronizations as closed or stale rather than deleting them immediately. Handle request failures, rate limits, retries, and partial board failures. Avoid general scraping in the MVP; use company career pages as the user-facing source and use their supported public job APIs wherever possible.

### 20.8 Similar-company logic and job-ranking formula

- Begin with a transparent **content-based, rule-based company taxonomy**, not a learned collaborative-filtering model. Create tags for industry/sector, product area, company type, and role families.
- For alternative-company discovery, calculate a separate company-similarity score using: industry/sector similarity 40%, role-family similarity 35%, and technology/skill overlap 25%. These values are initial design weights and should be reviewed with examples.
- Recommended job-fit score (100 points):
  - Required-skill coverage: **35%**
  - Resume-to-job semantic similarity: **30%**
  - Preferred job role and domain: **15%**
  - Experience and qualification fit: **10%**
  - Location and work-mode preference: **5%**
  - Company preference / similar-company fit: **5%**
- Apply only explicit must-have constraints as hard filters. Do not reject a candidate because a field is absent from the job posting. Treat salary as an optional filter only when the student supplies a minimum and the posting contains usable salary data.
- Display understandable reasons (matched skills, missing skills, role/domain fit, location/work-mode fit, and company relation). A match score is a relevance estimate, **not** a probability of getting hired.

### 20.9 Learning-resource catalogue and link validation

- Create a curated Firestore `learningResources` collection. Each item should include title, skill tags, provider, level, format, estimated duration, free/paid label, URL, source/license note, and `lastVerifiedAt`.
- Prefer official and reliably maintained resources: React Native/Expo documentation, TypeScript Handbook, Firebase documentation, MDN Web Docs, Microsoft Learn, and clearly freeCodeCamp material. Add role-specific resources only after checking their current access terms.
- Seed the first version with approximately **30–50 manually verified resources** for the most common skill gaps in the roles CareerNova initially supports.
- Gemini may recommend from retrieved catalogue entries, but must not invent course names, providers, or URLs. Run a monthly automated link check and manually review links that fail or redirect unexpectedly.

### 20.10 Firebase security, privacy, retention, and secrets

- Use Firebase Authentication and Firestore Security Rules so each student can read/write only their own profile, preferences, resume metadata, learning progress, and interview history.
- Store files under user-specific private paths such as `users/{uid}/resumes/{resumeId}`. Validate size/type on upload and again server-side. Do not make resumes or extracted profiles publicly readable.
- Job catalogue and board-configuration writes must be server-only. Cloud Functions must validate the caller's Firebase Auth identity and authorization; do not assume Firestore Security Rules protect Admin SDK operations.
- Keep all API secrets in Secret Manager. Use App Check as an additional abuse-control layer once the chosen Android/Web app targets and supported SDK integration have been tested.
- Send only the minimum information needed to AI services. Remove name, email, phone number, and address before model calls wherever possible; job matching does not need these contact details.
- Provide a clear consent notice explaining resume processing and AI services. Allow users to replace/delete their resume and delete their account and associated data. Retain raw resumes only in private user-controlled storage; define and document a deletion/retention policy before public release. Do not log resume text, tokens, API keys, or private interview content.
- **Gemini privacy distinction:** Google's unpaid Gemini API tier may use submitted prompts/responses to improve products and may involve human review; do not send real personal resumes or other sensitive data to the unpaid tier. Use synthetic/anonymized data for free-tier development. For real student data, use the paid API tier (where prompts/responses are not used to improve Google's products under the current terms) or another service with approved data-protection terms, and obtain appropriate user consent.

### 20.11 Test datasets, human evaluation, and provisional targets

- Build a small, controlled test set using synthetic or explicitly consented/anonymized resumes. A feasible Phase-II starting set is **40–50 resumes**, **200–300 job postings** from the configured boards, and **100–150 interview questions** across the first few target role families. This is a project test set, not a representative labour-market dataset.
- Have at least two team members independently label a subset of resume fields, job relevance, and missing skills; resolve disagreements and preserve the final labels as a small ground-truth set. Do not use real resumes without permission.
- Evaluate resume extraction using field-level Precision, Recall, and F1. Evaluate job ranking using Precision@5, Recall@10, and nDCG@10 from human relevance labels. Evaluate skill-gap output using Precision/Recall/F1 against human-labelled required skills. Evaluate RAG using a 1–5 human rubric for relevance, factual grounding, role fit, and usefulness of feedback. Track job freshness and system response time separately.
- Provisional engineering targets for the first pilot (not achieved results): key resume-field F1 ≥ 0.90 on clean digital PDF/DOCX files; job Precision@5 ≥ 0.70 and nDCG@10 ≥ 0.75; skill-gap F1 ≥ 0.80; RAG relevance/grounding average ≥ 4/5; and 95% of successfully ingested active jobs checked within the previous 24 hours. Review these thresholds after measuring a baseline; do not put them in a report as achieved performance until tested.

### Primary official implementation resources

- Expo + Firebase integration: https://docs.expo.dev/guides/using-firebase/
- Expo authentication overview: https://docs.expo.dev/guides/using-authentication/
- Expo Google authentication: https://docs.expo.dev/guides/google-authentication/
- Gemini models: https://ai.google.dev/gemini-api/docs/models
- Gemini Embedding 2: https://ai.google.dev/gemini-api/docs/embeddings
- Firestore vector search: https://firebase.google.com/docs/firestore/vector-search
- Firebase Cloud Functions scheduled functions: https://firebase.google.com/docs/functions/schedule-functions
- Firebase Functions secrets: https://firebase.google.com/docs/functions/config-env
- Firebase Security Rules: https://firebase.google.com/docs/rules
- Firebase pricing plans: https://firebase.google.com/pricing/
- Firebase Storage billing change: https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
- Gemini API privacy terms: https://ai.google.dev/gemini-api/terms
- Greenhouse Job Board API: https://docs.greenhouse.io/job-board
- Lever Postings API: https://github.com/lever/postings-api
- Ashby Public Job Postings API: https://developers.ashbyhq.com/docs/public-job-posting-api

**End of recommended decision set.** The team should record any later change explicitly and update this section; do not silently switch models, database, backend, or job-source approach.
