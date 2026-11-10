import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { subscribeToPersonalizedJobs } from '../services/jobs';
import type { Job } from '../types/job';
import { colors, radii, shadows } from '../theme';

type DiscoverScreenProps = { uid: string; onProfilePress?: () => void };
const filters = ['All', 'Remote', 'Hybrid', 'Onsite', 'Internship'];
type MatchSort = 'normal' | 'high' | 'low';

function formatLabel(value: string) {
  return value === 'unknown' ? 'Not specified' : value.replace('-', ' ');
}

function formatJobDescription(value: string) {
  let decoded = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const next = decoded
      .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
      .replace(/&amp;|&#38;|&#x26;/gi, '&')
      .replace(/&quot;|&#34;|&#x22;/gi, '"')
      .replace(/&#39;|&apos;|&#x27;/gi, "'")
      .replace(/&lt;|&#60;|&#x3C;/gi, '<')
      .replace(/&gt;|&#62;|&#x3E;/gi, '>')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
    decoded = next;
    if (next === value) break;
    value = next;
  }

  return decoded
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<\s*\/?\s*[a-z][^>]*>/gi, ' ')
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function JobDetails({ job, onClose }: { job: Job; onClose: () => void }) {
  const description = formatJobDescription(job.description);
  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <ScrollView contentContainerStyle={styles.detailsContainer}>
        <Pressable onPress={onClose}><Text style={styles.close}>Close</Text></Pressable>
        <Text style={styles.detailsCompany}>{job.companyName}</Text>
        <Text style={styles.detailsTitle}>{job.title}</Text>
        <Text style={styles.detailsMeta}>{job.location}{job.country ? `, ${job.country}` : ''} · {formatLabel(job.workMode)} · {formatLabel(job.employmentType)}</Text>
        {job.department ? <Text style={styles.detailsMeta}>{job.department}</Text> : null}
        <Text style={styles.detailsHeading}>Required skills</Text>
        <View style={styles.skillRow}>{job.requiredSkills.length ? job.requiredSkills.map((skill) => <Text key={skill} style={styles.skill}>{skill}</Text>) : <Text style={styles.body}>Not specified</Text>}</View>
        {job.matchReasons?.length ? <><Text style={styles.detailsHeading}>Why this matches</Text>{job.matchReasons.map((reason) => <Text key={reason} style={styles.reason}>✓ {reason}</Text>)}</> : null}
        {job.missingSkills?.length ? <><Text style={styles.detailsHeading}>Useful skills to build</Text><Text style={styles.body}>{job.missingSkills.join(', ')}</Text></> : null}
        {job.compensation ? <Text style={styles.detailsMeta}>Compensation: {job.compensation}{job.currency ? ` ${job.currency}` : ''}</Text> : null}
        <Text style={styles.detailsHeading}>About the role</Text>
        <Text style={styles.body}>{description || 'Description not provided by the source.'}</Text>
        <Text style={styles.source}>Source: {job.source}</Text>
        <Pressable onPress={() => void Linking.openURL(job.applicationUrl)} style={styles.applyButton}><Text style={styles.applyText}>Apply Now</Text></Pressable>
      </ScrollView>
    </Modal>
  );
}

export function DiscoverScreen({ uid, onProfilePress }: DiscoverScreenProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queryText, setQueryText] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [matchSort, setMatchSort] = useState<MatchSort>('normal');
  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | undefined;
    void Promise.resolve().then(() => {
      if (!isActive) return;
      setIsLoading(true);
      setError(false);
      unsubscribe = subscribeToPersonalizedJobs(uid, (nextJobs) => {
        setJobs(nextJobs);
        setIsLoading(false);
      }, (loadError) => {
        if (__DEV__) console.error('Unable to load personalized jobs.', loadError);
        setError(true);
        setIsLoading(false);
      });
    });
    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [retryToken, uid]);

  const visibleJobs = useMemo(() => {
    const search = queryText.trim().toLowerCase();
    const filteredJobs = jobs.filter((job) => {
      const matchesSearch = !search || job.searchText.toLowerCase().includes(search);
      const matchesFilter = activeFilter === 'All'
        || job.workMode === activeFilter.toLowerCase()
        || (activeFilter === 'Internship' && job.employmentType === 'internship');
      return matchesSearch && matchesFilter;
    });
    if (matchSort === 'normal') return filteredJobs;
    return [...filteredJobs].sort((left, right) => {
      const leftScore = left.matchScore ?? -1;
      const rightScore = right.matchScore ?? -1;
      return matchSort === 'high' ? rightScore - leftScore : leftScore - rightScore;
    });
  }, [activeFilter, jobs, matchSort, queryText]);

  const cycleMatchSort = () => {
    setMatchSort((current) => current === 'normal' ? 'high' : current === 'high' ? 'low' : 'normal');
  };

  const matchSortLabel = matchSort === 'high' ? 'Top matches' : matchSort === 'low' ? 'Lowest matches' : 'Match order';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>OPPORTUNITIES, CURATED</Text><Text style={styles.title}>Discover your edge.</Text></View>
        <Pressable style={styles.avatar} onPress={onProfilePress} accessibilityLabel="Open profile"><Text style={styles.avatarText}>CN</Text></Pressable>
      </View>
      <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={queryText} onChangeText={setQueryText} placeholder="Search roles, companies, skills" placeholderTextColor="#8D9892" style={styles.searchInput} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filters.map((filter) => <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filterChip, activeFilter === filter && styles.activeFilter]}><Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fresh opportunities</Text>
        <View style={styles.sectionActions}>
          <Pressable
            accessibilityLabel={`Sort by match: ${matchSortLabel}`}
            accessibilityHint="Tap for top matches, lowest matches, or normal order"
            onPress={cycleMatchSort}
            style={[styles.matchSortButton, matchSort === 'high' && styles.matchSortHigh, matchSort === 'low' && styles.matchSortLow]}
          >
            <Text style={[styles.matchSortIcon, matchSort === 'high' && styles.matchSortHighText, matchSort === 'low' && styles.matchSortLowText]}>
              {matchSort === 'high' ? '↑' : matchSort === 'low' ? '↓' : '↕'}
            </Text>
            <Text style={[styles.matchSortText, matchSort === 'high' && styles.matchSortHighText, matchSort === 'low' && styles.matchSortLowText]}>
              {matchSortLabel}
            </Text>
          </Pressable>
          <Text style={styles.sectionMeta}>{visibleJobs.length} roles</Text>
        </View>
      </View>
      {isLoading ? <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Finding fresh opportunities...</Text></View> : null}
      {error ? <View style={styles.state}><Text style={styles.stateText}>We could not load jobs right now.</Text><Pressable onPress={() => setRetryToken((current) => current + 1)}><Text style={styles.retry}>Try again</Text></Pressable></View> : null}
      {!isLoading && !error && visibleJobs.map((job) => <Pressable key={job.id} onPress={() => setSelectedJob(job)} style={styles.jobCard}>
        <View style={styles.companyMark}><Text style={styles.companyInitial}>{job.companyName[0] ?? 'J'}</Text></View>
        <View style={styles.cardTitleRow}><View style={styles.cardTitleCopy}><Text style={styles.company}>{job.companyName}</Text><Text style={styles.role}>{job.title}</Text></View>{typeof job.matchScore === 'number' ? <Text style={styles.matchScore}>{job.matchScore}% match</Text> : null}</View>
        <Text style={styles.meta}>{job.location}{job.country ? `, ${job.country}` : ''} · {formatLabel(job.workMode)}</Text>
        <View style={styles.tagRow}>{job.requiredSkills.slice(0, 4).map((skill) => <Text key={skill} style={styles.tag}>{skill}</Text>)}</View>
        <Text style={styles.viewButtonText}>View job →</Text>
      </Pressable>)}
      {!isLoading && !error && visibleJobs.length === 0 ? <Text style={styles.emptyState}>No jobs found for your current filters.</Text> : null}
      {selectedJob ? <JobDetails job={selectedJob} onClose={() => setSelectedJob(null)} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, paddingBottom: 112, paddingHorizontal: 20 },
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
  sectionHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  sectionActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  matchSortButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', paddingHorizontal: 9, paddingVertical: 6 },
  matchSortHigh: { backgroundColor: colors.successSoft, borderColor: colors.success },
  matchSortLow: { backgroundColor: colors.errorSoft, borderColor: colors.error },
  matchSortIcon: { color: colors.muted, fontSize: 14, fontWeight: '900', marginRight: 4 },
  matchSortText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  matchSortHighText: { color: colors.success },
  matchSortLowText: { color: colors.error },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionMeta: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  jobCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, marginBottom: 12, padding: 16, ...shadows.card },
  companyMark: { alignItems: 'center', backgroundColor: colors.softPrimary, borderRadius: 11, height: 43, justifyContent: 'center', marginBottom: 10, width: 43 },
  companyInitial: { color: colors.primaryDark, fontSize: 19, fontWeight: '900' },
  company: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  role: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitleCopy: { flex: 1 },
  matchScore: { color: colors.primaryDark, fontSize: 11, fontWeight: '800', marginLeft: 8 },
  meta: { color: colors.subtle, fontSize: 11, marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { backgroundColor: colors.softPrimary, borderRadius: radii.pill, color: colors.primaryDark, fontSize: 10, paddingHorizontal: 8, paddingVertical: 5 },
  viewButtonText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  state: { alignItems: 'center', paddingVertical: 35 },
  stateText: { color: colors.muted, fontSize: 13, marginTop: 10, textAlign: 'center' },
  retry: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', marginTop: 12 },
  emptyState: { color: colors.muted, fontSize: 13, paddingVertical: 35, textAlign: 'center' },
  detailsContainer: { backgroundColor: colors.background, flexGrow: 1, padding: 24 },
  close: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', marginBottom: 35 },
  detailsCompany: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  detailsTitle: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 8 },
  detailsMeta: { color: colors.muted, fontSize: 13, marginTop: 12 },
  detailsHeading: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 28, marginBottom: 12 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skill: { backgroundColor: colors.softPrimary, borderRadius: radii.pill, color: colors.primaryDark, fontSize: 11, paddingHorizontal: 10, paddingVertical: 7 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  reason: { color: colors.muted, fontSize: 13, lineHeight: 22 },
  source: { color: colors.subtle, fontSize: 11, marginTop: 24 },
  applyButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.sm, marginTop: 28, padding: 16 },
  applyText: { color: colors.inkOnPrimary, fontSize: 14, fontWeight: '800' },
});
