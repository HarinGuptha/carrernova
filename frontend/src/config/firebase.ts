import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import * as FirebaseAuthNative from '@firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => Boolean(value) && !value?.startsWith('your_'),
);

const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

type AuthDependencies = Parameters<typeof initializeAuth>[1];
type NativeAuthModule = typeof FirebaseAuthNative & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => NonNullable<AuthDependencies>['persistence'];
};

const { getReactNativePersistence } = FirebaseAuthNative as NativeAuthModule;

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const auth = createAuth();
