import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { AuthButton } from '../components/AuthButton';
import { AuthTextInput } from '../components/AuthTextInput';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { getAuthErrorMessage, getFirebaseErrorCode, registerWithEmail, validateEmail, validatePassword } from '../services/auth';
import { AuthLayout } from './AuthLayout';
import { colors } from '../theme';

type SignupScreenProps = {
  onSwitchToLogin: () => void;
};

export function SignupScreen({ onSwitchToLogin }: SignupScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSignup = async () => {
    setFormError('');

    if (!validateEmail(email)) {
      setFormError('Enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setFormError('Choose a password with at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Re-enter the same password in both fields.');
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmail(email, password);
      Alert.alert('Verify your email', 'We sent a verification link to your email address. Verify it, then return here to continue.');
    } catch (error) {
      const code = getFirebaseErrorCode(error);
      setFormError(getAuthErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="START YOUR JOURNEY" title="Make your next move count." subtitle="Create your CareerNova account and build momentum toward work you care about.">
      <AuthTextInput label="Email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" value={email} />
      <AuthTextInput label="Password" onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry value={password} />
      <AuthTextInput label="Confirm password" onChangeText={setConfirmPassword} placeholder="Re-enter your password" secureTextEntry value={confirmPassword} />
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <AuthButton label="Create account" loading={isLoading} onPress={handleSignup} />
      <SocialAuthButtons actionLabel="Sign up" />
      <Pressable onPress={onSwitchToLogin} style={styles.switchButton}>
        <Text style={styles.switchText}>Already have an account? <Text style={styles.switchLink}>Sign in</Text></Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  switchButton: { alignItems: 'center', marginTop: 25 },
  switchText: { color: colors.muted, fontSize: 12 },
  switchLink: { color: colors.primaryDark, fontWeight: '800' },
  formError: { color: colors.error, fontSize: 12, fontWeight: '700', marginBottom: 12 },
});
