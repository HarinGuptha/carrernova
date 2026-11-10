import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { defineSecret } from 'firebase-functions/params';
import { classifyAndExtractResume, hasMeaningfulExtraction, validateDocumentText } from './services/aiResume';
import { extractResumeSections, extractResumeText } from './services/resumeParser';

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
