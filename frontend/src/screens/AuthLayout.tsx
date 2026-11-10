import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ eyebrow, title, subtitle, children }: AuthLayoutProps) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>CN</Text></View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  container: { alignSelf: 'center', maxWidth: 520, padding: 22, paddingBottom: 42, width: '100%' },
  brandMark: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.md, height: 52, justifyContent: 'center', marginBottom: 30, width: 52 },
  brandMarkText: { color: colors.inkOnPrimary, fontSize: 14, fontWeight: '900' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginBottom: 9 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 28, maxWidth: 340 },
});
