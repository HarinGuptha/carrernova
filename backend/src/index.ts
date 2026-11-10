import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import { classifyAndExtractResume, hasMeaningfulExtraction, validateDocumentText } from './services/aiResume';
import { extractResumeSections, extractResumeText } from './services/resumeParser';
import { ingestJobs } from './jobs/ingest';
import { generateUserRecommendations } from './jobs/match';

if (getApps().length === 0) initializeApp();

const firestore = getFirestore();
const storage = getStorage();
const supportedTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const openRouterApiKey = defineSecret('OPENROUTER_API_KEY');

export const processResume = onObjectFinalized({ secrets: [openRouterApiKey] }, async (event) => {
  const object = event.data;
  const objectName = object.name ?? '';
  const pathParts = objectName.split('/');
  const [scope, uid, collection, resumeId] = pathParts;

  if (scope !== 'users' || collection !== 'resumes' || !uid || !resumeId || !object.contentType || !supportedTypes.has(object.contentType)) {
    return;
  }

  const resumeReference = firestore.doc(`users/${uid}/resumes/${resumeId}`);
  const processingStartedAt = Date.now();

  try {
    console.log(`[Resume] upload detected: ${resumeId}`);
    const statusStartedAt = Date.now();
    await resumeReference.set({ extractionStatus: 'processing', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    console.log(`[Resume] processing status update completed in ${Date.now() - statusStartedAt}ms: ${resumeId}`);

    const downloadStartedAt = Date.now();
    const [buffer] = await storage.bucket(object.bucket).file(objectName).download();
    console.log(`[Resume] storage download completed in ${Date.now() - downloadStartedAt}ms: ${resumeId}`);

    const parseStartedAt = Date.now();
    const text = await extractResumeText(buffer, object.contentType);
    console.log(`[Resume] text extraction completed in ${Date.now() - parseStartedAt}ms: ${resumeId}`);
    const detectedSections = extractResumeSections(text);
    console.log(
      `[Resume] extracted text length: ${text.length}; detected education section: ${detectedSections.education.length > 0}; detected experience section: ${detectedSections.experience.length > 0}; detected projects section: ${detectedSections.projects.length > 0}`
    );

    const validationStartedAt = Date.now();
    const documentCheck = validateDocumentText(text);
    console.log(`[Resume] validation completed in ${Date.now() - validationStartedAt}ms: ${resumeId}`);
    if (!documentCheck.isReadable || !documentCheck.hasCareerSignals) {
      const validationMessage = "This document doesn't appear to be a resume. Please upload a valid resume containing your education, skills, projects, experience, or certifications.";
      console.log(`[Resume] deterministic validation failed: ${resumeId}`);
      await Promise.all([
        resumeReference.set({
          extractionStatus: 'invalid',
          validationMessage,
          isActive: false,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true }),
        storage.bucket(object.bucket).file(objectName).delete().catch((error) => {
          console.error(`[Resume] invalid upload cleanup failed: ${resumeId}`, error);
        }),
      ]);
      return;
    }

    console.log(`[Resume] AI validation started: ${resumeId}`);
    const aiStartedAt = Date.now();
    const aiResult = await classifyAndExtractResume(text, openRouterApiKey.value());
    console.log(`[Resume] OpenRouter request completed in ${Date.now() - aiStartedAt}ms: ${resumeId}`);
    console.log(`[Resume] isResume=${aiResult.validation.isResume}: ${resumeId}`);
    console.log(
      `[Resume] extracted education count: ${aiResult.extraction.education.length}; extracted experience count: ${aiResult.extraction.experience.length}; extracted projects count: ${aiResult.extraction.projects.length}`
    );

    if (!aiResult.validation.isResume || !hasMeaningfulExtraction(aiResult.extraction)) {
      const validationMessage = "This document doesn't appear to be a resume. Please upload a valid resume containing your education, skills, projects, experience, or certifications.";
      await storage.bucket(object.bucket).file(objectName).delete().catch((error) => {
        console.error(`[Resume] invalid upload cleanup failed: ${resumeId}`, error);
      });

      await resumeReference.set({
        extractionStatus: 'invalid',
        validationMessage,
        isActive: false,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log(`[Resume] invalid upload removed: ${resumeId}`);
      return;
    }

    const readyWriteStartedAt = Date.now();
    await resumeReference.set({
      extractionStatus: 'ready',
      extractedProfile: aiResult.extraction,
      validationMessage: null,
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`[Resume] Firestore ready update completed in ${Date.now() - readyWriteStartedAt}ms: ${resumeId}`);
    console.log(`[Resume] status=ready: ${resumeId}`);

    const cleanupStartedAt = Date.now();
    const otherResumes = await firestore.collection(`users/${uid}/resumes`).get();
    await Promise.all(otherResumes.docs
      .filter((oldResume) => oldResume.id !== resumeId)
      .map(async (oldResume) => {
        const oldData = oldResume.data() as { storagePath?: string };
        if (oldData.storagePath) {
          await storage.bucket().file(oldData.storagePath).delete().catch((error) => {
            console.error(`[Resume] old storage cleanup failed: ${oldResume.id}`, error);
          });

        }
        await oldResume.ref.delete();
        console.log(`[Resume] old resume removed: ${oldResume.id}`);
      }));
    console.log(`[Resume] old resume cleanup completed in ${Date.now() - cleanupStartedAt}ms: ${resumeId}`);
    console.log(`[Resume] total processing time: ${Date.now() - processingStartedAt}ms: ${resumeId}`);
  } catch (error) {
    console.error(`[Resume] processing failed: ${resumeId}`, error);
    await resumeReference.set({
      extractionStatus: 'failed',
      extractionError: error instanceof Error ? error.message : 'Resume extraction failed.',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
});

// Legacy/debug-only global catalogue refresh. Personalized recommendations do not use it.
export const ingestJobsScheduled = onSchedule('every 6 hours', async () => {
  try {
    await ingestJobs();
  } catch (error) {
    console.error('[Jobs] ingestion failed:', error);
    throw error;
  }
});

// Legacy/debug-only endpoint. Normal recommendation generation fetches sources directly.
export const ingestJobsManual = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to trigger job ingestion.');
  }

  console.log('[Jobs] manual ingestion started');
  try {
    const result = await ingestJobs();
    console.log(`[Jobs] manual ingestion completed: ${result.fetched}`);
    return result;
  } catch (error) {
    console.error('[Jobs] manual ingestion failed:', error);
    throw new HttpsError('internal', 'Job ingestion failed.');
  }
});

export const generateRecommendationsOnProfileChange = onDocumentWritten({
  document: 'users/{uid}',
  memory: '1GiB',
  timeoutSeconds: 540,
}, async (event) => {
  const after = event.data?.after;
  const uid = event.params.uid;
  console.log('[Match] profile trigger received:', {
    uid,
    profilePath: `users/${uid}`,
    afterExists: Boolean(after?.exists),
  });
  if (!after?.exists) return;

  const candidate = after.data() ?? {};
  console.log('[Match] candidate profile loaded:', {
    uid,
    profilePath: `users/${uid}`,
    hasPreferences: Boolean(candidate.preferences),
    hasReviewedProfile: Boolean(candidate.reviewedProfile),
  });
  try {
    const recommendationCount = await generateUserRecommendations(uid, candidate);
    console.log('[Match] recommendations generated:', recommendationCount);
  } catch (error) {
    console.error('[Match] recommendation generation failed:', { uid, error });
    throw error;
  }
});

export const refreshPersonalizedRecommendations = onCall({
  memory: '1GiB',
  timeoutSeconds: 540,
}, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to refresh job recommendations.');
  }

  const profileSnapshot = await firestore.doc(`users/${uid}`).get();
  if (!profileSnapshot.exists) {
    throw new HttpsError('failed-precondition', 'Complete your profile before refreshing job recommendations.');
  }

  const candidate = profileSnapshot.data() ?? {};
  const preferences = candidate.preferences as Record<string, unknown> | undefined;
  const reviewedProfile = candidate.reviewedProfile as Record<string, unknown> | undefined;
  const requiredPreferences = ['targetRole', 'domain', 'location', 'workMode', 'experienceLevel'];
  const missingPreferences = requiredPreferences.filter((field) => typeof preferences?.[field] !== 'string' || !preferences[field].trim());
  const skills = Array.isArray(reviewedProfile?.skills)
    ? reviewedProfile.skills.filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0)
    : [];

  if (missingPreferences.length || !skills.length) {
    throw new HttpsError(
      'failed-precondition',
      missingPreferences.length
        ? `Save all preferences before refreshing job recommendations: ${missingPreferences.join(', ')}.`
        : 'Review your resume skills before refreshing job recommendations.',
    );
  }

  console.log('[Match] manual recommendation refresh started:', {
    uid,
    preferencesChecked: requiredPreferences.length,
    skillsChecked: skills.length,
  });
  const recommendationCount = await generateUserRecommendations(uid, candidate);
  console.log('[Match] manual recommendation refresh completed:', { uid, recommendationCount });
  return { recommendationCount };
});
