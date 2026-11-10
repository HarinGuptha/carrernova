import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { JobCard } from '../components/JobCard';
import { ProgressBar } from '../components/ProgressBar';
import { RoadmapItemCard } from '../components/RoadmapItemCard';
import { SectionHeading } from '../components/SectionHeading';
import { jobs, roadmap } from '../data/mockData';
import { AppTab } from '../types';
import { colors, radii, shadows } from '../theme';

type HomeScreenProps = {
  onNavigate: (tab: AppTab) => void;
  displayName?: string | null;
};

export function HomeScreen({ onNavigate, displayName }: HomeScreenProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const dateLabel = useMemo(
    () => now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(),
    [now],
  );
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (displayName?.trim() || 'there').split(/\s+/)[0];
  const initials = (displayName?.trim() || 'CareerNova').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{dateLabel}</Text>
          <Text style={styles.greeting}>{greeting}, {firstName}</Text>
        </View>
        <Pressable style={styles.avatar} accessibilityLabel="Open profile" onPress={() => onNavigate('Profile')}>
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>YOUR NEXT MOVE</Text>
          <Text style={styles.heroTitle}>A career that feels like you.</Text>
          <Text style={styles.heroBody}>You are closer than you think. Keep your momentum going.</Text>
          <Pressable style={styles.primaryButton} onPress={() => onNavigate('Roadmap')}>
            <Text style={styles.primaryButtonText}>Continue roadmap</Text>
            <Text style={styles.buttonArrow}>-&gt;</Text>
          </Pressable>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.badgeNumber}>72</Text>
          <Text style={styles.badgeLabel}>career{`\n`}readiness</Text>
        </View>
      </View>

      <SectionHeading title="Your focus" action="View roadmap" onAction={() => onNavigate('Roadmap')} />
      <View style={styles.focusCard}>
        <View style={styles.focusIcon}><Text style={styles.focusIconText}>↗</Text></View>
        <View style={styles.focusCopy}>
          <Text style={styles.focusTitle}>Polish your portfolio</Text>
          <Text style={styles.focusBody}>One small step today makes your next application stronger.</Text>
          <ProgressBar progress={0.6} />
        </View>
        <Text style={styles.progressText}>60%</Text>
      </View>

      <SectionHeading title="Jobs for you" action="See all" onAction={() => onNavigate('Discover')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobRow}>
        {jobs.map((job) => <JobCard key={job.role} job={job} />)}
      </ScrollView>

      <View style={styles.roadmapHeading}>
        <Text style={styles.sectionTitle}>Keep growing</Text>
        <Text style={styles.mutedText}>This week</Text>
      </View>
      {roadmap.map((item) => <RoadmapItemCard key={item.title} item={item} onPress={() => onNavigate('Roadmap')} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, paddingHorizontal: 20, paddingBottom: 112 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 24 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 7 },
  greeting: { color: colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  avatar: { width: 43, height: 43, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.inkOnPrimary, fontSize: 13, fontWeight: '800' },
  hero: { backgroundColor: colors.primaryDark, borderRadius: radii.lg, minHeight: 224, padding: 21, flexDirection: 'row', overflow: 'hidden', marginBottom: 29, ...shadows.card },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { color: '#C5C6FF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  heroTitle: { color: colors.inkOnPrimary, fontSize: 26, lineHeight: 30, fontWeight: '800', maxWidth: 230, letterSpacing: -0.7 },
  heroBody: { color: '#D9DAFF', fontSize: 12, lineHeight: 18, marginTop: 10, maxWidth: 210 },
  primaryButton: { backgroundColor: '#FFFFFF', borderRadius: radii.sm, paddingVertical: 11, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 17 },
  primaryButtonText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  buttonArrow: { color: colors.primaryDark, fontSize: 18, marginLeft: 9, lineHeight: 14 },
  heroBadge: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: '#8586F2', alignItems: 'center', justifyContent: 'center', marginTop: 35, marginRight: -2 },
  badgeNumber: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  badgeLabel: { color: '#D1D2FF', fontSize: 10, lineHeight: 12, textAlign: 'center', fontWeight: '700' },
  focusCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 27, ...shadows.card },
  focusIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.softPrimary, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  focusIconText: { color: colors.primary, fontSize: 22, fontWeight: '600' },
  focusCopy: { flex: 1 },
  focusTitle: { color: colors.text, fontWeight: '800', fontSize: 14, marginBottom: 4 },
  focusBody: { color: colors.muted, fontSize: 11, lineHeight: 15, marginBottom: 9 },
  progressText: { color: colors.primary, fontSize: 11, fontWeight: '800', marginLeft: 10 },
  jobRow: { gap: 12, paddingBottom: 28 },
  roadmapHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  mutedText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
});
