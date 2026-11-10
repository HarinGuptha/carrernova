import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import type { User } from 'firebase/auth';
import { auth, firestore, functions, isFirebaseConfigured } from '../config/firebase';
import type { CandidatePreferences, CandidateProfile } from '../types/profile';
import type { ExtractedProfile } from '../types/resume';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Add your Firebase values to frontend/.env before loading profiles.');
  }
}

function profileReference(uid: string) {
  ensureFirebaseConfigured();
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('A signed-in user is required to access this profile.');
  }
  if (__DEV__) console.log('Firestore profile path:', `users/${uid}`);
  return doc(firestore, 'users', uid);
}

export async function saveUserProfile(user: User) {
  const reference = profileReference(user.uid);
  const existingProfile = await getDoc(reference);
  const profileData: Record<string, unknown> = {
    uid: user.uid,
    email: user.email,
    photoURL: user.photoURL,
    ...(existingProfile.exists() ? {} : { createdAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
  };

  if (!existingProfile.exists() || !existingProfile.data()?.displayName) {
    profileData.displayName = user.displayName;
  }

  await setDoc(reference, profileData, { merge: true });
}

export async function getUserProfile(uid: string): Promise<CandidateProfile | null> {
  const snapshot = await getDoc(profileReference(uid));
  return snapshot.exists() ? snapshot.data() as CandidateProfile : null;
}

export async function saveReviewedProfile(uid: string, reviewedProfile: ExtractedProfile) {
  await setDoc(profileReference(uid), {
    reviewedProfile,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveCandidatePreferences(uid: string, preferences: CandidatePreferences) {
  await setDoc(profileReference(uid), {
    preferences,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveUserDisplayName(uid: string, displayName: string) {
  await setDoc(profileReference(uid), {
    displayName: displayName.trim(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function refreshPersonalizedRecommendations() {
  ensureFirebaseConfigured();
  const refresh = httpsCallable<void, { recommendationCount: number }>(functions, 'refreshPersonalizedRecommendations');
  const result = await refresh();
  return result.data.recommendationCount;
}
