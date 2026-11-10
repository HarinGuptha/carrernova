import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  getRedirectResult,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import type { AuthCredential } from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, isFirebaseConfigured } from '../config/firebase';

export class AuthFlowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AuthFlowError';
  }
}

let pendingGithubCredential: AuthCredential | null = null;

function getFirebaseErrorMessage(error: unknown) {
  return typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
    ? error.message
    : 'Authentication could not be completed.';
}

function normalizeAuthError(error: unknown, provider: string) {
  const code = getFirebaseErrorCode(error);
  if (__DEV__) {
    console.warn(`[Auth] ${provider} failed: ${code} - ${getFirebaseErrorMessage(error)}`);
  }

  if (code === 'auth/account-exists-with-different-credential' && provider === 'GitHub') {
    const credential = GithubAuthProvider.credentialFromError(error as FirebaseError);
    if (credential) {
      pendingGithubCredential = credential;
    }
  }

  return new AuthFlowError(getAuthErrorMessage(code, provider), code);
}

export function getAuthErrorMessage(code: string, provider = 'authentication') {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Choose a stronger password with at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts were made. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'The request could not reach Firebase. Check your connection and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is already registered with another sign-in method. Please sign in using your existing method.';
    case 'auth/popup-closed-by-user':
      return 'GitHub sign-in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. We will continue with a secure redirect.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in window is already open. Please finish it or try again.';
    case 'auth/invalid-credential':
      return provider === 'GitHub'
        ? 'GitHub sign-in could not be verified. Please try again.'
        : 'Your sign-in details could not be verified. Please try again.';
    case 'auth/operation-not-allowed':
      return provider === 'GitHub'
        ? 'GitHub sign-in is not enabled for this Firebase project yet.'
        : 'Email and password sign-in is not enabled for this Firebase project yet.';
    case 'auth/unauthorized-domain':
      return 'This CareerNova web domain is not authorized for sign-in yet.';
    default:
      return provider === 'GitHub'
        ? 'GitHub sign-in could not be completed. Please try again.'
        : 'Account creation could not be completed. Please try again.';
  }
}

export function getFirebaseErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : 'auth/unknown';
}

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Add your Firebase values to frontend/.env before using authentication.');
  }
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string) {
  return password.length >= 6;
}

export async function registerWithEmail(email: string, password: string) {
  ensureFirebaseConfigured();
  const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await sendEmailVerification(credentials.user);
  return credentials;
}

export async function loginWithEmail(email: string, password: string) {
  ensureFirebaseConfigured();
  const credentials = await signInWithEmailAndPassword(auth, email.trim(), password);
  if (!credentials.user.emailVerified) {
    await sendEmailVerification(credentials.user);
  }
  return credentials;
}

export async function resendEmailVerification() {
  ensureFirebaseConfigured();
  if (!auth.currentUser) {
    throw new Error('Sign in before requesting a verification email.');
  }

  await sendEmailVerification(auth.currentUser);
}

export async function refreshCurrentUser() {
  ensureFirebaseConfigured();
  if (!auth.currentUser) {
    return null;
  }

  await auth.currentUser.reload();
  return auth.currentUser;
}

export async function logout() {
  ensureFirebaseConfigured();
  await signOut(auth);
}

export async function loginWithGoogleIdToken(idToken: string) {
  ensureFirebaseConfigured();
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

export async function loginWithGooglePopup() {
  ensureFirebaseConfigured();
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function loginWithGithubPopup() {
  ensureFirebaseConfigured();
  try {
    return await signInWithPopup(auth, new GithubAuthProvider());
  } catch (error) {
    const normalizedError = normalizeAuthError(error, 'GitHub');
    if (normalizedError.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, new GithubAuthProvider());
      return null;
    }
    throw normalizedError;
  }
}

export async function getGithubRedirectResult() {
  ensureFirebaseConfigured();
  if (Platform.OS !== 'web') {
    return null;
  }

  try {
    return await getRedirectResult(auth);
  } catch (error) {
    throw normalizeAuthError(error, 'GitHub redirect');
  }
}

export async function linkPendingGithubCredential() {
  ensureFirebaseConfigured();
  if (!auth.currentUser || !pendingGithubCredential) {
    return null;
  }

  const credential = pendingGithubCredential;
  pendingGithubCredential = null;
  try {
    return await linkWithCredential(auth.currentUser, credential);
  } catch (error) {
    pendingGithubCredential = credential;
    throw normalizeAuthError(error, 'GitHub account linking');
  }
}

export function hasPendingGithubCredential() {
  return pendingGithubCredential !== null;
}

export function subscribeToAuthState(onChange: (user: User | null) => void) {
  return onAuthStateChanged(auth, onChange);
}
