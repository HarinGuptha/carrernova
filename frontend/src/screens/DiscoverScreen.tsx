import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { jobs } from '../data/mockData';
import { colors, radii, shadows } from '../theme';

type DiscoverScreenProps = {
  onProfilePress?: () => void;
};

const filters = ['For you', 'Remote', 'Design', 'Data'];

export function DiscoverScreen({ onProfilePress }: DiscoverScreenProps) {
  const [activeFilter, setActiveFilter] = useState('For you');
  const [query, setQuery] = useState('');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return jobs;
    return jobs.filter((job) => `${job.company} ${job.role} ${job.meta}`.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const toggleSaved = (role: string) => {
    setSavedJobs((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>OPPORTUNITIES, CURATED</Text>
          <Text style={styles.title}>Discover your edge.</Text>
        </View>
        <Pressable style={styles.avatar} onPress={onProfilePress} accessibilityLabel="Open profile"><Text style={styles.avatarText}>AS</Text></Pressable>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search roles, companies, skills" placeholderTextColor="#8D9892" style={styles.searchInput} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filters.map((filter) => (
          <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filterChip, activeFilter === filter && styles.activeFilter]}>
            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.signalCard}>
        <View style={styles.signalTop}><Text style={styles.signalKicker}>MATCH SIGNAL</Text><Text style={styles.signalTrend}>↗ +8 this week</Text></View>
        <View style={styles.signalBody}>
          <View><Text style={styles.signalNumber}>87%</Text><Text style={styles.signalLabel}>of your target roles{`\n`}are within reach</Text></View>
          <View style={styles.signalOrb}><Text style={styles.signalOrbText}>A+</Text><Text style={styles.signalOrbLabel}>profile fit</Text></View>
        </View>
        <Text style={styles.signalNote}>Add one portfolio project to unlock 12 more strong matches.</Text>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Strongest matches</Text><Text style={styles.sectionMeta}>{visibleJobs.length} roles</Text></View>
      {visibleJobs.map((job, index) => {
        const isSaved = savedJobs.includes(job.role);
        return (
          <View key={job.role} style={styles.jobCard}>
            <View style={styles.jobTop}>
              <View style={[styles.companyMark, { backgroundColor: job.color }]}><Text style={styles.companyInitial}>{job.company[0]}</Text></View>
              <View style={styles.jobIdentity}><Text style={styles.company}>{job.company}</Text><Text style={styles.role}>{job.role}</Text></View>
              <Pressable onPress={() => toggleSaved(job.role)} style={styles.saveButton} accessibilityLabel={isSaved ? 'Remove saved job' : 'Save job'}><Text style={[styles.saveIcon, isSaved && styles.savedIcon]}>{isSaved ? '♥' : '♡'}</Text></Pressable>
            </View>
            <View style={styles.metaRow}><Text style={styles.meta}>{job.meta}</Text><Text style={styles.dot}>·</Text><Text style={styles.meta}>{index === 0 ? 'Posted 2d ago' : 'Posted this week'}</Text></View>
            <View style={styles.tagRow}><View style={styles.matchBadge}><Text style={styles.matchBadgeText}>{job.match} match</Text></View><View style={styles.tag}><Text style={styles.tagText}>Growth role</Text></View><View style={styles.tag}><Text style={styles.tagText}>{index === 0 ? 'Internship' : 'Early career'}</Text></View></View>
            <Pressable style={styles.viewButton}><Text style={styles.viewButtonText}>View opportunity</Text><Text style={styles.viewArrow}>→</Text></Pressable>
          </View>
        );
      })}
      {visibleJobs.length === 0 ? <Text style={styles.emptyState}>No roles found yet. Try a broader search.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, paddingHorizontal: 20, paddingBottom: 112 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 21, paddingTop: 16 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.7 },
  avatar: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 22, height: 43, justifyContent: 'center', width: 43 },
  avatarText: { color: colors.inkOnPrimary, fontSize: 13, fontWeight: '800' },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', height: 51, paddingHorizontal: 14, ...shadows.card },
  searchIcon: { color: colors.primary, fontSize: 25, marginRight: 9 },
  searchInput: { color: colors.text, flex: 1, fontSize: 13 },
  filterRow: { gap: 8, paddingBottom: 25, paddingTop: 13 },
  filterChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 9 },
  activeFilter: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  activeFilterText: { color: colors.inkOnPrimary },
  signalCard: { backgroundColor: colors.primaryDark, borderRadius: radii.lg, marginBottom: 29, padding: 18, ...shadows.card },
  signalTop: { flexDirection: 'row', justifyContent: 'space-between' },
  signalKicker: { color: '#C5C6FF', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  signalTrend: { color: colors.inkOnPrimary, fontSize: 10, fontWeight: '800' },
  signalBody: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 },
  signalNumber: { color: colors.inkOnPrimary, fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  signalLabel: { color: '#D9DAFF', fontSize: 12, lineHeight: 17 },
  signalOrb: { alignItems: 'center', borderColor: '#8586F2', borderRadius: 48, borderWidth: 1, height: 96, justifyContent: 'center', width: 96 },
  signalOrbText: { color: colors.inkOnPrimary, fontSize: 29, fontWeight: '800' },
  signalOrbLabel: { color: '#D1D2FF', fontSize: 10, fontWeight: '700' },
  signalNote: { color: '#D1D2FF', fontSize: 11, lineHeight: 16, marginTop: 17 },
  sectionHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionMeta: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  jobCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, marginBottom: 12, padding: 16, ...shadows.card },
  jobTop: { alignItems: 'center', flexDirection: 'row' },
  companyMark: { alignItems: 'center', borderRadius: 11, height: 43, justifyContent: 'center', width: 43 },
  companyInitial: { color: colors.primaryDark, fontSize: 19, fontWeight: '900' },
  jobIdentity: { flex: 1, marginLeft: 12 },
  company: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  role: { color: colors.text, fontSize: 15, fontWeight: '800' },
  saveButton: { alignItems: 'center', height: 35, justifyContent: 'center', width: 35 },
  saveIcon: { color: colors.subtle, fontSize: 25 },
  savedIcon: { color: colors.error },
  metaRow: { flexDirection: 'row', marginTop: 13 },
  meta: { color: colors.muted, fontSize: 10 },
  dot: { color: '#B8C0BA', fontSize: 11, marginHorizontal: 7 },
  tagRow: { flexDirection: 'row', gap: 7, marginTop: 13 },
  matchBadge: { backgroundColor: colors.softPrimary, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 5 },
  matchBadgeText: { color: colors.primaryDark, fontSize: 9, fontWeight: '800' },
  tag: { backgroundColor: '#F1F1F7', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 5 },
  tagText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  viewButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 9, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', marginTop: 15, minHeight: 39 },
  viewButtonText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  viewArrow: { color: colors.primary, fontSize: 16, marginLeft: 8 },
  emptyState: { color: colors.muted, fontSize: 13, paddingVertical: 30, textAlign: 'center' },
});
