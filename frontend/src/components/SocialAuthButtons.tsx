import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { AuthButton } from './AuthButton';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { getAuthErrorMessage, loginWithGithubPopup } from '../services/auth';
import { colors } from '../theme';

type SocialAuthButtonsProps = {
  actionLabel: string;
};

export function SocialAuthButtons({ actionLabel }: SocialAuthButtonsProps) {
  const { isLoading, signInWithGoogle } = useGoogleSignIn();
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const signInWithGithub = async () => {
    if (Platform.OS !== 'web' || isGithubLoading) {
      Alert.alert('GitHub sign-in', 'GitHub sign-in is currently available on CareerNova Web. Enable the GitHub provider in Firebase Authentication first.');
      return;
    }

    setIsGithubLoading(true);
    try {
      await loginWithGithubPopup();
    } catch (error) {
      const code = error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : 'auth/unknown';
      Alert.alert(
        code === 'auth/account-exists-with-different-credential' ? 'Account already exists' : 'GitHub sign-in failed',
        getAuthErrorMessage(code, 'GitHub'),
      );
    } finally {
      setIsGithubLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.orText}>OR CONTINUE WITH</Text><View style={styles.divider} /></View>
      <AuthButton label={`${actionLabel} with Google`} loading={isLoading} onPress={signInWithGoogle} variant="secondary" />
      <AuthButton label={`${actionLabel} with GitHub`} loading={isGithubLoading} onPress={signInWithGithub} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 18 },
  divider: { backgroundColor: colors.border, flex: 1, height: 1 },
  orText: { color: colors.subtle, fontSize: 9, fontWeight: '800', marginHorizontal: 10 },
});
