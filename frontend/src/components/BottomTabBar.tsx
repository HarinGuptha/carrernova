import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTab } from '../types';
import { colors, radii, shadows } from '../theme';

const tabs: [string, AppTab][] = [['⌂', 'Home'], ['⌕', 'Discover'], ['✦', 'Roadmap'], ['◎', 'Profile']];

type BottomTabBarProps = {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
};

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {tabs.map(([icon, label]) => (
        <Pressable key={label} style={styles.tab} onPress={() => onTabChange(label)}>
          <Text style={[styles.icon, activeTab === label && styles.active]}>{icon}</Text>
          <Text style={[styles.label, activeTab === label && styles.active]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', bottom: 12, left: 14, right: 14, height: 70, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 9, ...shadows.card },
  tab: { alignItems: 'center', borderRadius: radii.md, justifyContent: 'center', minWidth: 64, paddingHorizontal: 8 },
  icon: { color: colors.subtle, fontSize: 22, height: 27 },
  label: { color: colors.subtle, fontSize: 10, fontWeight: '700', marginTop: 3 },
  active: { color: colors.primary },
});
