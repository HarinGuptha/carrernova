import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radii } from '../theme';

type AuthTextInputProps = TextInputProps & {
  label: string;
};

export function AuthTextInput({ label, ...inputProps }: AuthTextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        autoCapitalize="none"
        placeholderTextColor="#9AA39E"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 7 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, color: colors.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 13 },
});
