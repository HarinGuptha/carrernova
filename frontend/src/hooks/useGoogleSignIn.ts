import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { loginWithGoogleIdToken, loginWithGooglePopup } from '../services/auth';

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
    if (Platform.OS === 'web') {
        await loginWithGooglePopup();
      return;
    }

      if (Constants.appOwnership === 'expo') {
        Alert.alert(
          'Install the CareerNova development build',
          'Google sign-in on Android requires the installed EAS development app, not Expo Go.',
        );
        return;
      }

      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();
      if (response.type !== 'success' || !response.data.idToken) {
        return;
      }

      await loginWithGoogleIdToken(response.data.idToken);
    } catch (error) {
      Alert.alert('Google sign-in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { signInWithGoogle, isLoading };
}
