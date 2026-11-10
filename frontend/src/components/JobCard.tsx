import { Pressable, StyleSheet, Text, View } from 'react-native';
import { JobMatch } from '../types';
import { colors, radii, shadows } from '../theme';

type JobCardProps = {
  job: JobMatch;
};

export function JobCard({ job }: JobCardProps) {
  return (
    <Pressable style={styles.card}>
      <View style={[styles.companyMark, { backgroundColor: job.color }]}><Text style={styles.companyMarkText}>{job.company[0]}</Text></View>
      <View style={styles.matchPill}><Text style={styles.matchText}>{job.match} match</Text></View>
      <Text style={styles.companyName}>{job.company}</Text>
      <Text style={styles.role}>{job.role}</Text>
      <Text style={styles.meta}>{job.meta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 188, minHeight: 178, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, padding: 16, ...shadows.card },
  companyMark: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  companyMarkText: { color: colors.primaryDark, fontSize: 16, fontWeight: '900' },
  matchPill: { position: 'absolute', top: 16, right: 13, backgroundColor: colors.softPrimary, paddingHorizontal: 7, paddingVertical: 4, borderRadius: radii.pill },
  matchText: { color: colors.primaryDark, fontSize: 9, fontWeight: '800' },
  companyName: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  role: { color: colors.text, fontSize: 15, lineHeight: 19, fontWeight: '800', marginBottom: 9 },
  meta: { color: colors.subtle, fontSize: 10 },
});
