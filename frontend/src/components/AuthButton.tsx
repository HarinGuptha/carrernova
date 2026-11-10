import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii } from '../theme';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function AuthButton({ label, onPress, loading = false, variant = 'primary' }: AuthButtonProps) {
  return (
    <Pressable disabled={loading} onPress={onPress} style={[styles.button, variant === 'secondary' && styles.secondaryButton]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.inkOnPrimary : colors.primaryDark} /> : <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.sm, justifyContent: 'center', minHeight: 52, paddingHorizontal: 16 },
  secondaryButton: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  label: { color: colors.inkOnPrimary, fontSize: 14, fontWeight: '800' },
  secondaryLabel: { color: colors.primaryDark },
});
