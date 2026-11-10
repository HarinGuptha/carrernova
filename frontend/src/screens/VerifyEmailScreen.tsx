import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import type { User } from 'firebase/auth';
import { AuthButton } from '../components/AuthButton';
import { AuthLayout } from './AuthLayout';
import { logout, refreshCurrentUser, resendEmailVerification } from '../services/auth';
import { colors } from '../theme';

type VerifyEmailScreenProps = {
  user: User;
  onVerified: (user: User) => void;
};

export function VerifyEmailScreen({ user, onVerified }: VerifyEmailScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await resendEmailVerification();
      Alert.alert('Verification email sent', 'Check your inbox and spam folder for the verification link.');
    } catch (error) {
      Alert.alert('Unable to send email', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsLoading(true);
    try {
      const refreshedUser = await refreshCurrentUser();
      if (!refreshedUser?.emailVerified) {
        Alert.alert('Not verified yet', 'Open the verification link in your email, then try again.');
        return;
      }

      onVerified(refreshedUser);
    } catch (error) {
      Alert.alert('Unable to check verification', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } catch (error) {
      Alert.alert('Unable to sign out', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="ONE LAST STEP"
      title="Verify your email."
      subtitle={`We sent a verification link to ${user.email ?? 'your email address'}. Verify it before entering CareerNova.`}
    >
      <AuthButton label="I verified my email" loading={isLoading} onPress={handleCheckVerification} />
      <AuthButton label="Resend verification email" loading={isLoading} onPress={handleResend} variant="secondary" />
      <Pressable disabled={isSigningOut} onPress={handleSignOut} style={styles.signOut}>
        <Text style={styles.signOutText}>{isSigningOut ? 'Signing out...' : 'Use a different account'}</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  signOut: { alignItems: 'center', marginTop: 24, padding: 8 },
  signOutText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
});
