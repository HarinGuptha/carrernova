import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { saveCandidatePreferences, saveUserDisplayName } from '../services/profile';
import type { CandidatePreferences, CandidateProfile } from '../types/profile';
import { ResumeScreen } from './ResumeScreen';
import { colors, radii, shadows } from '../theme';

type ProfileScreenProps = {
  profile: CandidateProfile | null;
  isLoading: boolean;
  error: string | null;
  onClose?: () => void;
  onProfileUpdated?: (displayName: string) => void;
};

const emptyPreferences: CandidatePreferences = {
  targetRole: '',
  domain: '',
  dreamCompany: '',
  location: '',
  workMode: '',
  experienceLevel: '',
};

export function ProfileScreen({ profile, isLoading, error, onClose, onProfileUpdated }: ProfileScreenProps) {
  const email = profile?.email ?? auth.currentUser?.email ?? 'Signed-in member';
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = profile?.displayName ?? 'CareerNova member';
  const [preferences, setPreferences] = useState<CandidatePreferences>(profile?.preferences ?? emptyPreferences);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [editableName, setEditableName] = useState(profile?.displayName ?? auth.currentUser?.displayName ?? '');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  const updatePreference = (field: keyof CandidatePreferences, value: string) => {
    setPreferences((current) => ({ ...current, [field]: value }));
  };

  const handleSavePreferences = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Unable to save preferences', 'Sign in before saving your preferences.');
      return;
    }

    setIsSavingPreferences(true);
    try {
      await saveCandidatePreferences(user.uid, preferences);
      setIsEditingPreferences(false);
      Alert.alert('Preferences saved', 'Your career preferences were saved successfully.');
    } catch (saveError) {
      if (__DEV__) console.error('Unable to save candidate preferences.', saveError);
      Alert.alert('Unable to save preferences', 'Please try again.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleSaveIdentity = async () => {
    const user = auth.currentUser;
    const name = editableName.trim();
    if (!user || !name) {
      Alert.alert('Add your name', 'Enter a name before saving your profile.');
      return;
    }

    setIsSavingIdentity(true);
    try {
      await saveUserDisplayName(user.uid, name);
      onProfileUpdated?.(name);
      setIsEditingIdentity(false);
      Alert.alert('Profile updated', 'Your name was saved successfully.');
    } catch (saveError) {
      if (__DEV__) console.error('Unable to save profile name.', saveError);
      Alert.alert('Unable to update profile', 'Please try again.');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const savedPreferenceValues = Object.values(preferences).filter(Boolean);
  const stats = profile?.stats ?? { savedRoles: 0, completedTasks: 0, applications: 0 };
  const profileStrength = profile?.reviewedProfile
    ? Math.min(100, 40 + Object.values(profile.reviewedProfile).filter((value) => value && (!Array.isArray(value) || value.length > 0)).length * 10)
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>YOUR SPACE</Text><Text style={styles.title}>Profile</Text></View><Pressable onPress={onClose} style={styles.doneButton}><Text style={styles.doneText}>Done</Text></Pressable></View>

      <View style={styles.identityCard}>
        <View style={styles.largeAvatar}><Text style={styles.avatarText}>{initials}</Text></View>
        {isEditingIdentity ? (
          <View style={styles.identityEditFields}>
            <Text style={styles.preferenceFieldLabel}>Your name</Text>
            <TextInput autoCapitalize="words" value={editableName} onChangeText={setEditableName} placeholder="Enter your name" placeholderTextColor={colors.subtle} style={styles.preferenceInput} />
            <Text style={styles.preferenceFieldLabel}>Email</Text>
            <TextInput editable={false} value={email} style={[styles.preferenceInput, styles.readOnlyInput]} />
            <View style={styles.identityActions}>
              <Pressable disabled={isSavingIdentity} onPress={() => setIsEditingIdentity(false)} style={styles.cancelIdentityButton}><Text style={styles.cancelIdentityText}>Cancel</Text></Pressable>
              <Pressable disabled={isSavingIdentity} onPress={() => { void handleSaveIdentity(); }} style={styles.saveIdentityButton}>{isSavingIdentity ? <ActivityIndicator color={colors.inkOnPrimary} /> : <Text style={styles.saveIdentityText}>Save</Text>}</Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.identityCopy}><Text style={styles.name}>{displayName}</Text><Text style={styles.email}>{email}</Text><View style={styles.verified}><Text style={styles.verifiedIcon}>✓</Text><Text style={styles.verifiedText}>{isLoading ? 'Loading profile...' : 'Profile is looking strong'}</Text></View></View>
        )}
        {!isEditingIdentity ? <Pressable onPress={() => { setEditableName(displayName === 'CareerNova member' ? '' : displayName); setIsEditingIdentity(true); }} style={styles.editButton}><Text style={styles.editText}>Edit</Text></Pressable> : null}
      </View>

      {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Profile sync unavailable</Text><Text style={styles.errorText}>{error}</Text></View> : null}

      <View style={styles.readinessCard}><View><Text style={styles.readinessKicker}>PROFILE STRENGTH</Text><Text style={styles.readinessTitle}>{profileStrength ? 'A clear direction.' : 'Build your profile.'}</Text><Text style={styles.readinessBody}>{profileStrength ? 'Based on the information you have reviewed and saved.' : 'Add a resume and career preferences to strengthen your profile.'}</Text></View><View style={styles.readinessScore}><Text style={styles.scoreNumber}>{profileStrength}</Text><Text style={styles.scoreLabel}>/ 100</Text></View></View>

      <View style={styles.statsRow}><View style={styles.stat}><Text style={styles.statNumber}>{stats.savedRoles}</Text><Text style={styles.statLabel}>roles saved</Text></View><View style={styles.statDivider} /><View style={styles.stat}><Text style={styles.statNumber}>{stats.completedTasks}</Text><Text style={styles.statLabel}>tasks done</Text></View><View style={styles.statDivider} /><View style={styles.stat}><Text style={styles.statNumber}>{stats.applications}</Text><Text style={styles.statLabel}>applications</Text></View></View>

      <Text style={styles.sectionTitle}>Your preferences</Text>
      <View style={styles.preferenceCard}>
        <Text style={styles.preferenceLabel}>TARGETING</Text>
        {isEditingPreferences ? (
          <>
            <PreferenceField label="Target role" value={preferences.targetRole} onChangeText={(value) => updatePreference('targetRole', value)} />
            <PreferenceField label="Domain" value={preferences.domain} onChangeText={(value) => updatePreference('domain', value)} />
            <PreferenceField label="Dream company" value={preferences.dreamCompany} onChangeText={(value) => updatePreference('dreamCompany', value)} />
            <PreferenceField label="Location" value={preferences.location} onChangeText={(value) => updatePreference('location', value)} />
            <PreferenceField label="Work mode" value={preferences.workMode} onChangeText={(value) => updatePreference('workMode', value)} />
            <PreferenceField label="Experience level" value={preferences.experienceLevel} onChangeText={(value) => updatePreference('experienceLevel', value)} />
            <Pressable disabled={isSavingPreferences} onPress={() => { void handleSavePreferences(); }} style={styles.preferenceSave}>{isSavingPreferences ? <ActivityIndicator color="#F6F4E9" /> : <Text style={styles.preferenceSaveText}>Save preferences</Text>}</Pressable>
          </>
        ) : (
          <View style={styles.chipRow}>{(savedPreferenceValues.length ? savedPreferenceValues : ['No preferences saved yet']).map((preference) => <View key={preference} style={styles.preferenceChip}><Text style={styles.preferenceText}>{preference}</Text></View>)}</View>
        )}
        {!isEditingPreferences ? <Pressable onPress={() => setIsEditingPreferences(true)} style={styles.preferenceAction}><Text style={styles.preferenceActionText}>Edit preferences</Text><Text style={styles.arrow}>→</Text></Pressable> : null}
      </View>

      <Text style={styles.sectionTitle}>Resume & skills</Text>
      <ResumeScreen embedded />

      <Text style={styles.sectionTitle}>Account</Text>

      <Pressable onPress={() => {
        void signOut(auth).catch((signOutError) => {
          if (__DEV__) console.error('Sign out failed.', signOutError);
          Alert.alert('Unable to sign out', 'Please try again.');
        });
      }} style={styles.signOutButton}><Text style={styles.signOutText}>Sign out</Text></Pressable>
      <Text style={styles.version}>CAREERNOVA · VERSION 1.0</Text>
    </ScrollView>
  );
}

function PreferenceField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.preferenceField}>
      <Text style={styles.preferenceFieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={`Add ${label.toLowerCase()}`} placeholderTextColor={colors.subtle} style={styles.preferenceInput} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, paddingHorizontal: 20, paddingBottom: 112 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 22, paddingTop: 16 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { color: colors.text, fontSize: 29, fontWeight: '800', letterSpacing: -0.8 },
  doneButton: { backgroundColor: colors.softPrimary, borderRadius: radii.sm, paddingHorizontal: 13, paddingVertical: 9 },
  doneText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  identityCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', padding: 16, ...shadows.card },
  largeAvatar: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 30, height: 60, justifyContent: 'center', width: 60 },
  avatarText: { color: colors.inkOnPrimary, fontSize: 18, fontWeight: '900' },
  identityCopy: { flex: 1, marginLeft: 13 },
  identityEditFields: { flex: 1, marginLeft: 13 },
  identityActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 9 },
  cancelIdentityButton: { justifyContent: 'center', marginRight: 13, paddingHorizontal: 4 },
  cancelIdentityText: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  saveIdentityButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.sm, justifyContent: 'center', minHeight: 34, minWidth: 68, paddingHorizontal: 12 },
  saveIdentityText: { color: colors.inkOnPrimary, fontSize: 10, fontWeight: '800' },
  readOnlyInput: { backgroundColor: '#ECECF3', color: colors.muted },
  name: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  email: { color: colors.muted, fontSize: 10, marginBottom: 7 },
  verified: { alignItems: 'center', flexDirection: 'row' },
  verifiedIcon: { alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 7, color: colors.success, fontSize: 9, height: 14, marginRight: 5, textAlign: 'center', width: 14 },
  verifiedText: { color: colors.success, fontSize: 9, fontWeight: '800' },
  errorCard: { backgroundColor: colors.errorSoft, borderColor: '#F8D8DC', borderRadius: radii.md, borderWidth: 1, marginTop: 12, padding: 13 },
  errorTitle: { color: colors.error, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  errorText: { color: '#8D5960', fontSize: 10, lineHeight: 15 },
  editButton: { borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  editText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  readinessCard: { backgroundColor: colors.primaryDark, borderRadius: radii.lg, flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, padding: 17, ...shadows.card },
  readinessKicker: { color: '#C5C6FF', fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 9 },
  readinessTitle: { color: colors.inkOnPrimary, fontSize: 19, fontWeight: '800', marginBottom: 6 },
  readinessBody: { color: '#D9DAFF', fontSize: 10, lineHeight: 15, maxWidth: 200 },
  readinessScore: { alignItems: 'center', borderColor: '#8586F2', borderRadius: 35, borderWidth: 1, height: 70, justifyContent: 'center', width: 70 },
  scoreNumber: { color: colors.inkOnPrimary, fontSize: 24, fontWeight: '800' },
  scoreLabel: { color: '#D1D2FF', fontSize: 9, fontWeight: '700' },
  statsRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 28, marginTop: 12, minHeight: 72, ...shadows.card },
  stat: { alignItems: 'center', flex: 1 },
  statNumber: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 3 },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  statDivider: { backgroundColor: colors.border, height: 28, width: 1 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  preferenceCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, marginBottom: 24, padding: 16, ...shadows.card },
  preferenceLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  preferenceChip: { backgroundColor: colors.softPrimary, borderRadius: radii.sm, paddingHorizontal: 9, paddingVertical: 7 },
  preferenceText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  preferenceField: { marginBottom: 10 },
  preferenceFieldLabel: { color: colors.text, fontSize: 10, fontWeight: '800', marginBottom: 5 },
  preferenceInput: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 8, borderWidth: 1, color: colors.text, fontSize: 11, paddingHorizontal: 10, paddingVertical: 9 },
  preferenceSave: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, justifyContent: 'center', minHeight: 40, marginTop: 4 },
  preferenceSaveText: { color: colors.inkOnPrimary, fontSize: 11, fontWeight: '800' },
  preferenceAction: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 13 },
  preferenceActionText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  arrow: { color: colors.primary, fontSize: 18 },
  menuCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, marginBottom: 22, paddingHorizontal: 15, ...shadows.card },
  menuRow: { alignItems: 'center', flexDirection: 'row', minHeight: 68 },
  menuIcon: { alignItems: 'center', backgroundColor: colors.softPrimary, borderRadius: radii.sm, height: 35, justifyContent: 'center', marginRight: 12, width: 35 },
  menuIconText: { color: colors.primary, fontSize: 19 },
  menuCopy: { flex: 1 },
  menuTitle: { color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  menuDetail: { color: colors.muted, fontSize: 10 },
  chevron: { color: colors.subtle, fontSize: 24 },
  rowDivider: { backgroundColor: colors.border, height: 1, marginLeft: 47 },
  signOutButton: { alignItems: 'center', borderColor: '#F2C9CE', borderRadius: radii.sm, borderWidth: 1, minHeight: 48, justifyContent: 'center' },
  signOutText: { color: colors.error, fontSize: 12, fontWeight: '800' },
  version: { color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 22, textAlign: 'center' },
});
