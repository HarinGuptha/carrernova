import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../theme';

const tasks = [
  { id: 'portfolio', week: 'WEEK 01', title: 'Polish your portfolio', detail: 'Tell one clear story through your strongest project.', duration: '45 min', done: true, color: '#E1F2EC' },
  { id: 'case-study', week: 'WEEK 01', title: 'Publish one case study', detail: 'Turn your process into proof that hiring teams can scan.', duration: '2 hrs', done: false, color: '#E9E7FB' },
  { id: 'analytics', week: 'WEEK 02', title: 'Learn product analytics', detail: 'Build confidence with the metrics behind great decisions.', duration: '3 hrs', done: false, color: '#FCE8D7' },
  { id: 'mock-interview', week: 'WEEK 03', title: 'Practice your story', detail: 'Prepare a crisp answer for your next conversation.', duration: '30 min', done: false, color: '#F0F0FF' },
];

export function RoadmapScreen() {
  const [completedTasks, setCompletedTasks] = useState(tasks.filter((task) => task.done).map((task) => task.id));
  const [activeView, setActiveView] = useState('In progress');

  const toggleTask = (id: string) => {
    setCompletedTasks((current) => current.includes(id) ? current.filter((taskId) => taskId !== id) : [...current, id]);
  };

  const progress = completedTasks.length / tasks.length;
  const visibleTasks = activeView === 'Completed' ? tasks.filter((task) => completedTasks.includes(task.id)) : tasks.filter((task) => !completedTasks.includes(task.id));

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>YOUR CAREER PLAN</Text><Text style={styles.title}>Roadmap</Text></View>
        <View style={styles.streak}><Text style={styles.streakNumber}>04</Text><Text style={styles.streakLabel}>day streak</Text></View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressCopy}><Text style={styles.cardKicker}>DESIGN TO PRODUCT</Text><Text style={styles.cardTitle}>Build your next chapter.</Text><Text style={styles.cardBody}>A focused 4-week plan shaped around your target roles.</Text></View>
        <View style={styles.progressCircle}><Text style={styles.progressNumber}>{Math.round(progress * 100)}%</Text><Text style={styles.progressLabel}>complete</Text></View>
      </View>

      <View style={styles.statsRow}><View style={styles.stat}><Text style={styles.statNumber}>{completedTasks.length}</Text><Text style={styles.statLabel}>completed</Text></View><View style={styles.statDivider} /><View style={styles.stat}><Text style={styles.statNumber}>{tasks.length - completedTasks.length}</Text><Text style={styles.statLabel}>to go</Text></View><View style={styles.statDivider} /><View style={styles.stat}><Text style={styles.statNumber}>4w</Text><Text style={styles.statLabel}>estimated</Text></View></View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your learning path</Text><Text style={styles.sectionMeta}>Updated today</Text></View>
      <View style={styles.viewToggle}>
        {['In progress', 'Completed'].map((view) => <Pressable key={view} onPress={() => setActiveView(view)} style={[styles.toggle, activeView === view && styles.activeToggle]}><Text style={[styles.toggleText, activeView === view && styles.activeToggleText]}>{view}</Text></Pressable>)}
      </View>

      {visibleTasks.length > 0 ? visibleTasks.map((task, index) => {
        const isCompleted = completedTasks.includes(task.id);
        return (
          <Pressable key={task.id} onPress={() => toggleTask(task.id)} style={styles.taskCard}>
            <View style={styles.taskRail}><View style={[styles.taskIcon, { backgroundColor: task.color }]}><Text style={styles.taskIconText}>{isCompleted ? '✓' : `${index + 1}`}</Text></View>{index < visibleTasks.length - 1 ? <View style={styles.railLine} /> : null}</View>
            <View style={styles.taskCopy}><Text style={styles.taskWeek}>{task.week}</Text><Text style={[styles.taskTitle, isCompleted && styles.completedTitle]}>{task.title}</Text><Text style={styles.taskDetail}>{task.detail}</Text><View style={styles.taskFooter}><Text style={styles.duration}>◷ {task.duration}</Text>{isCompleted ? <Text style={styles.completedText}>Completed</Text> : <Text style={styles.startText}>Start task →</Text>}</View></View>
          </Pressable>
        );
      }) : <View style={styles.emptyCard}><Text style={styles.emptyIcon}>✦</Text><Text style={styles.emptyTitle}>A clear runway</Text><Text style={styles.emptyBody}>You completed every task in this view. Nice work.</Text></View>}

      <View style={styles.coachCard}><View style={styles.coachIcon}><Text style={styles.coachIconText}>✦</Text></View><View style={styles.coachCopy}><Text style={styles.coachKicker}>CAREERNOVA COACH</Text><Text style={styles.coachTitle}>Consistency beats intensity.</Text><Text style={styles.coachBody}>One focused task today keeps your momentum alive.</Text></View></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, paddingHorizontal: 20, paddingBottom: 112 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 23, paddingTop: 16 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { color: colors.text, fontSize: 29, fontWeight: '800', letterSpacing: -0.8 },
  streak: { alignItems: 'flex-end' },
  streakNumber: { color: colors.accent, fontSize: 23, fontWeight: '800' },
  streakLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  progressCard: { backgroundColor: colors.primaryDark, borderRadius: radii.lg, flexDirection: 'row', justifyContent: 'space-between', minHeight: 180, overflow: 'hidden', padding: 19, ...shadows.card },
  progressCopy: { flex: 1, paddingRight: 12 },
  cardKicker: { color: '#C5C6FF', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 12 },
  cardTitle: { color: colors.inkOnPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.6, lineHeight: 29 },
  cardBody: { color: '#D9DAFF', fontSize: 11, lineHeight: 17, marginTop: 10 },
  progressCircle: { alignItems: 'center', borderColor: '#8586F2', borderRadius: 55, borderWidth: 7, height: 110, justifyContent: 'center', marginTop: 15, width: 110 },
  progressNumber: { color: colors.inkOnPrimary, fontSize: 25, fontWeight: '800' },
  progressLabel: { color: '#D1D2FF', fontSize: 9, fontWeight: '700' },
  statsRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 29, marginTop: 12, minHeight: 74, ...shadows.card },
  stat: { alignItems: 'center', flex: 1 },
  statNumber: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 3 },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  statDivider: { backgroundColor: colors.border, height: 30, width: 1 },
  sectionHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionMeta: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  viewToggle: { backgroundColor: '#EDEDF7', borderRadius: radii.sm, flexDirection: 'row', marginBottom: 14, padding: 3 },
  toggle: { alignItems: 'center', borderRadius: 8, flex: 1, paddingVertical: 9 },
  activeToggle: { backgroundColor: colors.surface },
  toggleText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  activeToggleText: { color: colors.primaryDark },
  taskCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', marginBottom: 10, minHeight: 126, padding: 14, ...shadows.card },
  taskRail: { alignItems: 'center', marginRight: 12, width: 33 },
  taskIcon: { alignItems: 'center', borderRadius: 18, height: 35, justifyContent: 'center', width: 35 },
  taskIconText: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' },
  railLine: { backgroundColor: '#DCDDF5', flex: 1, marginTop: 4, width: 1 },
  taskCopy: { flex: 1 },
  taskWeek: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  taskTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 5 },
  completedTitle: { color: colors.muted, textDecorationLine: 'line-through' },
  taskDetail: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  taskFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  duration: { color: colors.muted, fontSize: 10 },
  completedText: { color: colors.success, fontSize: 10, fontWeight: '800' },
  startText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, padding: 28 },
  emptyIcon: { color: colors.accent, fontSize: 27, marginBottom: 9 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 5 },
  emptyBody: { color: colors.muted, fontSize: 11, textAlign: 'center' },
  coachCard: { alignItems: 'center', backgroundColor: colors.softPrimary, borderRadius: radii.md, flexDirection: 'row', marginTop: 18, padding: 15 },
  coachIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 22, height: 43, justifyContent: 'center', marginRight: 12, width: 43 },
  coachIconText: { color: colors.accent, fontSize: 19 },
  coachCopy: { flex: 1 },
  coachKicker: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 4 },
  coachTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', marginBottom: 3 },
  coachBody: { color: colors.muted, fontSize: 10, lineHeight: 15 },
});
