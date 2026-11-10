import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type SectionHeadingProps = {
  title: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeading({ title, action, onAction }: SectionHeadingProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Pressable onPress={onAction}><Text style={styles.action}>{action}</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 13 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  action: { color: colors.primary, fontSize: 12, fontWeight: '800' },
});
