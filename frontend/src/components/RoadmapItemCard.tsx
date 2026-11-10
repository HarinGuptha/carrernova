import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RoadmapItem } from '../types';
import { ProgressBar } from './ProgressBar';
import { colors, radii, shadows } from '../theme';

type RoadmapItemCardProps = {
  item: RoadmapItem;
  onPress: () => void;
};

export function RoadmapItemCard({ item, onPress }: RoadmapItemCardProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.icon}><Text style={styles.iconText}>✓</Text></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.detail}>{item.detail}</Text>
      </View>
      <ProgressBar progress={item.progress} compact />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.surface, minHeight: 68, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, marginBottom: 10, padding: 13, flexDirection: 'row', alignItems: 'center', ...shadows.card },
  icon: { width: 33, height: 33, borderRadius: 17, backgroundColor: colors.softPrimary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  copy: { flex: 1 },
  title: { color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 4 },
  detail: { color: colors.muted, fontSize: 10 },
});
