import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type * as DocumentPicker from 'expo-document-picker';
import { auth, firestore, isFirebaseConfigured, storage } from '../config/firebase';
import { saveReviewedProfile } from './profile';
import type { ExtractedProfile, ResumeMetadata, ResumeUploadResult } from '../types/resume';

const supportedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Add your Firebase values to frontend/.env before uploading a resume.');
  }
}

function resumeReference(uid: string, resumeId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('A signed-in user is required to access resume data.');
  }
  if (__DEV__) console.log('Firestore resume path:', `users/${uid}/resumes/${resumeId}`);
  return doc(firestore, 'users', uid, 'resumes', resumeId);
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function isSupportedResume(asset: DocumentPicker.DocumentPickerAsset) {
  return Boolean(asset.mimeType && supportedMimeTypes.includes(asset.mimeType));
}

export async function uploadResume(uid: string, asset: DocumentPicker.DocumentPickerAsset): Promise<ResumeUploadResult> {
  ensureFirebaseConfigured();
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('A signed-in user is required to upload a resume.');
  }
  if (!isSupportedResume(asset)) {
    throw new Error('Choose a text-based PDF or DOCX resume.');
  }

  const resumeId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = safeFileName(asset.name);
  const storagePath = `users/${uid}/resumes/${resumeId}/${fileName}`;
  const fileReference = ref(storage, storagePath);
  const fileBlob: Blob = asset.file ?? await fetch(asset.uri).then((response) => response.blob());

  await uploadBytes(fileReference, fileBlob, {
    contentType: asset.mimeType,
    customMetadata: { uid, resumeId },
  });

  const metadata: ResumeMetadata = {
    id: resumeId,
    uid,
    fileName: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size: asset.size ?? null,
    storagePath,
    extractionStatus: 'pending',
    extractedProfile: null,
  };

  await setDoc(resumeReference(uid, resumeId), {
    ...metadata,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { metadata };
}

export async function getLatestResume(uid: string) {
  ensureFirebaseConfigured();
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('A signed-in user is required to access resume data.');
  }
  if (__DEV__) console.log('Firestore resume collection:', `users/${uid}/resumes`);
  const snapshots = await getDocs(query(
    collection(firestore, 'users', uid, 'resumes'),
    orderBy('createdAt', 'desc'),
    limit(1),
  ));
  const latest = snapshots.docs[0];
  return latest ? latest.data() as ResumeMetadata : null;
}

export function subscribeToLatestResume(uid: string, onChange: (resume: ResumeMetadata | null) => void, onError: (error: Error) => void) {
  ensureFirebaseConfigured();
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('A signed-in user is required to access resume data.');
  }
  if (__DEV__) console.log('Firestore resume listener:', `users/${uid}/resumes`);
  return onSnapshot(
    query(collection(firestore, 'users', uid, 'resumes'), orderBy('createdAt', 'desc'), limit(1)),
    (snapshots) => onChange(snapshots.docs[0] ? snapshots.docs[0].data() as ResumeMetadata : null),
    onError,
  );
}

export async function saveExtractedProfile(uid: string, resumeId: string, extractedProfile: ExtractedProfile) {
  ensureFirebaseConfigured();
  await setDoc(resumeReference(uid, resumeId), {
    extractedProfile,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await saveReviewedProfile(uid, extractedProfile);
}

export async function getPrivateResumeUrl(uid: string, storagePath: string) {
  ensureFirebaseConfigured();
  if (!storagePath.startsWith(`users/${uid}/`)) {
    throw new Error('Resume does not belong to the signed-in user.');
  }
  return getDownloadURL(ref(storage, storagePath));
}
