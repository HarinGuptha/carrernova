import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { AuthButton } from '../components/AuthButton';
import { AuthTextInput } from '../components/AuthTextInput';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { loginWithEmail, validateEmail, validatePassword } from '../services/auth';
import { AuthLayout } from './AuthLayout';
import { colors } from '../theme';

type LoginScreenProps = {
  onSwitchToSignup: () => void;
};

export function LoginScreen({ onSwitchToSignup }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Check your email', 'Enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Check your password', 'Your password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (error) {
      Alert.alert('Unable to sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="WELCOME BACK" title="Find your next move." subtitle="Sign in to pick up where your career journey left off.">
      <AuthTextInput label="Email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" value={email} />
      <AuthTextInput label="Password" onChangeText={setPassword} placeholder="Enter your password" secureTextEntry value={password} />
      <AuthButton label="Sign in" loading={isLoading} onPress={handleLogin} />
      <SocialAuthButtons actionLabel="Sign in" />
      <Pressable onPress={onSwitchToSignup} style={styles.switchButton}>
        <Text style={styles.switchText}>New to CareerNova? <Text style={styles.switchLink}>Create an account</Text></Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  switchButton: { alignItems: 'center', marginTop: 25 },
  switchText: { color: colors.muted, fontSize: 12 },
  switchLink: { color: colors.primaryDark, fontWeight: '800' },
});
