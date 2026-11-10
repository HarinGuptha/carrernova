import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type ProgressBarProps = {
  progress: number;
  compact?: boolean;
};

export function ProgressBar({ progress, compact = false }: ProgressBarProps) {
  return (
    <View style={[styles.track, compact && styles.compactTrack]}>
      <View style={[styles.fill, { width: `${progress * 100}%` }, compact && styles.compactFill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: '#E9EAF8', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  compactTrack: { width: 43 },
  compactFill: { height: 5 },
});
