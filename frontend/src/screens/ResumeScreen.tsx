import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Alert, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../config/firebase';
import { saveExtractedProfile, subscribeToLatestResume, uploadResume } from '../services/resume';
import type { ExtractedProfile, ResumeMetadata } from '../types/resume';
import { colors } from '../theme';

type ResumeScreenProps = {
  onClose?: () => void;
  embedded?: boolean;
};

const emptyProfile: ExtractedProfile = { fullName: '', headline: '', skills: [], education: [], experience: [], projects: [] };
const supportedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

function safeText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;
  const preferredFields = ['title', 'name', 'role', 'degree', 'institution', 'company', 'description', 'details'];
  const parts = preferredFields
    .map((field) => safeText(record[field]))
    .filter(Boolean);

  return parts.join(' — ');
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(safeText).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeExtractedProfile(value: unknown): ExtractedProfile | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ExtractedProfile>;
  return {
    fullName: safeText(candidate.fullName),
    headline: safeText(candidate.headline),
    skills: asStringList(candidate.skills),
    education: asStringList(candidate.education),
    experience: asStringList(candidate.experience),
    projects: asStringList(candidate.projects),
    certifications: asStringList(candidate.certifications),
  };
}

function hasMeaningfulProfile(profile: ExtractedProfile | null): profile is ExtractedProfile {
  return Boolean(profile && (
    safeText(profile.fullName) ||
    safeText(profile.headline) ||
    profile.skills.length ||
    profile.education.length ||
    profile.experience.length ||
    profile.projects.length ||
    profile.certifications?.length
  ));
}

export function ResumeScreen({ embedded = false, onClose }: ResumeScreenProps) {
  const [resume, setResume] = useState<ResumeMetadata | null>(null);
  const [profile, setProfile] = useState<ExtractedProfile>(emptyProfile);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const profileRef = useRef<ExtractedProfile>(emptyProfile);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    let isMounted = true;
    const unsubscribe = subscribeToLatestResume(
      user.uid,
      (latestResume) => {
        if (!isMounted || !latestResume) return;
        setResume(latestResume);
        const extractedProfile = normalizeExtractedProfile(latestResume.extractedProfile);
        const isReady = latestResume.extractionStatus === 'ready' && hasMeaningfulProfile(extractedProfile);
        if (!isReady) {
          setProfile(emptyProfile);
          profileRef.current = emptyProfile;
          setIsEditing(false);
          setSaveMessage(null);
          return;
        }
        if (extractedProfile && JSON.stringify(profileRef.current) !== JSON.stringify(extractedProfile)) {
          setProfile(extractedProfile);
          profileRef.current = extractedProfile;
        }
      },
      (loadError) => {
        if (!isMounted) return;
        if (__DEV__) console.error('Unable to load resume metadata.', loadError);
        setError('We could not load your resume details. Please try again.');
      },
    );

    return () => { isMounted = false; unsubscribe(); };
  }, []);

  const handlePickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: supportedMimeTypes,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const user = auth.currentUser;
      if (!user) {
        setError('Sign in before uploading a resume.');
        return;
      }

      setError(null);
      setIsUploading(true);
      const uploadResult = await uploadResume(user.uid, asset);
      setResume(uploadResult.metadata);
      setProfile(emptyProfile);
      profileRef.current = emptyProfile;
      setIsEditing(false);
      Alert.alert(
        'Resume uploaded',
        uploadResult.cleanupWarning
          ? uploadResult.cleanupWarning
          : 'Your resume is safely stored. Extraction will begin shortly.',
      );
    } catch (uploadError) {
      if (__DEV__) console.error('Resume upload failed.', uploadError);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const updateField = (field: keyof ExtractedProfile, value: string) => {
    setProfile((current) => {
      const nextProfile = { ...current, [field]: value };
      profileRef.current = nextProfile;
      return nextProfile;
    });
  };

  const updateSkills = (value: string) => {
    setProfile((current) => {
      const nextProfile = { ...current, skills: value.split(',').map((skill) => skill.trim()).filter(Boolean) };
      profileRef.current = nextProfile;
      return nextProfile;
    });
  };

  const updateListField = (field: 'education' | 'experience' | 'projects', value: string) => {
    setProfile((current) => {
      const nextProfile = { ...current, [field]: value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) };
      profileRef.current = nextProfile;
      return nextProfile;
    });
  };

  const updateCertifications = (value: string) => {
    setProfile((current) => {
      const nextProfile = { ...current, certifications: value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) };
      profileRef.current = nextProfile;
      return nextProfile;
    });
  };

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user || !resume) {
      setError('Upload a resume before saving extracted profile details.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await saveExtractedProfile(user.uid, resume.id, profile);
      profileRef.current = profile;
      setResume((current) => current ? { ...current, extractedProfile: profile, extractionStatus: 'ready' } : current);
      setSaveMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (saveError) {
      if (__DEV__) console.error('Profile save failed.', saveError);
      setError('Could not save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <>
      <View style={styles.header}><View><Text style={styles.eyebrow}>RESUME INTELLIGENCE</Text><Text style={styles.title}>Resume & skills</Text></View>{embedded ? null : <Pressable onPress={onClose} style={styles.doneButton}><Text style={styles.doneText}>Done</Text></Pressable>}</View>

      <View style={styles.hero}>
        <View style={styles.heroOrb}><Text style={styles.heroOrbText}>✦</Text></View>
        <Text style={styles.heroKicker}>CAREERNOVA PROFILE</Text>
        <Text style={styles.heroTitle}>Your career story, intelligently organized.</Text>
        <Text style={styles.heroBody}>Turn your resume into a polished profile you can use to move toward the right opportunities.</Text>
      </View>

      {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Something needs attention</Text><Text style={styles.errorText}>{error}</Text></View> : null}
      {saveMessage ? <View style={styles.successToast}><Text style={styles.successToastIcon}>✓</Text><Text style={styles.successToastText}>{saveMessage}</Text></View> : null}

      {!resume ? <EmptyResumeState isUploading={isUploading} onUpload={() => { void handlePickResume(); }} /> : (
        <View style={styles.resumeBar}>
          <View style={styles.resumeBarIcon}><Text style={styles.resumeBarIconText}>▤</Text></View>
          <View style={styles.uploadCopy}><Text style={styles.resumeFileName} numberOfLines={1}>{isUploading ? 'Uploading resume...' : resume.fileName}</Text><Text style={styles.resumeFileMeta}>{isUploading ? 'Securing your document' : 'Private · PDF or DOCX'}</Text></View>
          <Pressable accessibilityLabel="Replace resume" disabled={isUploading} onPress={() => { void handlePickResume(); }} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{isUploading ? '...' : 'Replace'}</Text></Pressable>
        </View>
      )}

      <ResumeStatus isUploading={isUploading} onRetry={() => { void handlePickResume(); }} resume={resume} />
      {resume?.extractionStatus === 'ready' && !hasMeaningfulProfile(profile) ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Profile details were not available</Text>
          <Text style={styles.errorText}>We could not find usable profile details in this extraction. Please upload a clearer PDF or DOCX resume.</Text>
          <Pressable onPress={() => { void handlePickResume(); }} style={styles.retryButton}><Text style={styles.retryText}>Upload another resume</Text></Pressable>
        </View>
      ) : null}
      {resume?.extractionStatus === 'ready' && hasMeaningfulProfile(profile) ? (
        isEditing ? (
          <ProfileEditForm
            profile={profile}
            isSaving={isSaving}
            onUpdateField={updateField}
            onUpdateSkills={updateSkills}
            onUpdateListField={updateListField}
            onUpdateCertifications={updateCertifications}
            onSave={async () => {
              await handleSaveProfile();
              setIsEditing(false);
            }}
            onCancel={() => {
              setProfile(profileRef.current);
              setIsEditing(false);
            }}
          />
        ) : (
          <ProfileSummary profile={profile} onEdit={() => setIsEditing(true)} />
        )
      ) : null}
      <Text style={styles.privacyNote}>Your resume is stored under your private Firebase user path. It is not publicly downloadable.</Text>
    </>
  );

  return embedded
    ? <View style={styles.embeddedContainer}>{content}</View>
    : <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{content}</ScrollView>;
}

function ProfileSummary({ profile, onEdit }: { profile: ExtractedProfile; onEdit: () => void }) {
  const completeness = Math.min(100, Math.round([
    profile.fullName,
    profile.headline,
    profile.skills.length,
    profile.education.length,
    profile.experience.length,
    profile.projects.length,
  ].filter(Boolean).length / 6 * 100));
  return (
    <View>
      <View style={styles.profileHeaderCard}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{(profile.fullName || 'CN').slice(0, 2).toUpperCase()}</Text></View>
        <View style={styles.profileHeaderCopy}>
          <Text style={styles.profileName}>{profile.fullName || 'CareerNova profile'}</Text>
          {profile.headline ? <Text style={styles.profileHeadline}>{profile.headline}</Text> : null}
          <View style={styles.readyPill}><Text style={styles.readyPillIcon}>✓</Text><Text style={styles.readyLabel}>Resume analyzed</Text></View>
        </View>
        <Pressable accessibilityLabel="Edit extracted profile" onPress={onEdit} style={styles.editButton}><Text style={styles.editButtonText}>Edit profile</Text></Pressable>
      </View>
      <View style={styles.strengthCard}>
        <View style={styles.strengthHeader}><View><Text style={styles.eyebrow}>PROFILE STRENGTH</Text><Text style={styles.strengthTitle}>{completeness}% ready to match</Text></View><Text style={styles.strengthPercent}>{completeness}%</Text></View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${completeness}%` }]} /></View>
        <Text style={styles.strengthHint}>{completeness === 100 ? 'Your core profile is ready for discovery.' : 'Add more evidence to make your profile stronger.'}</Text>
      </View>
      {profile.skills.length ? <ProfileSection title="Skills"><View style={styles.skillRow}>{profile.skills.map((skill, index) => <View key={`${safeText(skill)}-${index}`} style={styles.skillChip}><Text style={styles.skillText}>{safeText(skill)}</Text></View>)}</View></ProfileSection> : null}
      {profile.education.length ? <ProfileSection title="Education">{profile.education.map((item, index) => <Text key={`${safeText(item)}-${index}`} style={styles.profileItem}>{safeText(item)}</Text>)}</ProfileSection> : null}
      {profile.experience.length ? <ProfileSection title="Experience">{profile.experience.map((item, index) => <Text key={`${safeText(item)}-${index}`} style={styles.profileItem}>{safeText(item)}</Text>)}</ProfileSection> : null}
      {profile.projects.length ? <ProfileSection title="Projects">{profile.projects.map((item, index) => <Text key={`${safeText(item)}-${index}`} style={styles.profileItem}>{safeText(item)}</Text>)}</ProfileSection> : null}
      {profile.certifications?.length ? <ProfileSection title="Certifications">{profile.certifications.map((item, index) => <Text key={`${safeText(item)}-${index}`} style={styles.profileItem}>{safeText(item)}</Text>)}</ProfileSection> : null}
    </View>
  );
}

function EmptyResumeState({ isUploading, onUpload }: { isUploading: boolean; onUpload: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>↑</Text></View>
      <Text style={styles.emptyEyebrow}>START YOUR PROFILE</Text>
      <Text style={styles.emptyTitle}>Build your career profile</Text>
      <Text style={styles.emptyBody}>Upload your latest resume and let CareerNova understand your skills, education, projects and experience.</Text>
      <Pressable accessibilityLabel="Upload resume" disabled={isUploading} onPress={onUpload} style={styles.primaryButton}>
        {isUploading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.primaryButtonIcon}>↑</Text><Text style={styles.primaryButtonText}>Upload resume</Text></>}
      </Pressable>
      <Text style={styles.fileHint}>PDF or DOCX  ·  Maximum 10 MB</Text>
    </View>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.profileSection}><Text style={styles.profileSectionTitle}>{title}</Text>{children}</View>;
}

function ProfileEditForm({
  profile,
  isSaving,
  onUpdateField,
  onUpdateSkills,
  onUpdateListField,
  onUpdateCertifications,
  onSave,
  onCancel,
}: {
  profile: ExtractedProfile;
  isSaving: boolean;
  onUpdateField: (field: keyof ExtractedProfile, value: string) => void;
  onUpdateSkills: (value: string) => void;
  onUpdateListField: (field: 'education' | 'experience' | 'projects', value: string) => void;
  onUpdateCertifications: (value: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Edit profile</Text><Text style={styles.sectionMeta}>Saved to your account</Text></View>
      <View style={styles.formCard}>
        <Field label="Full name" value={profile.fullName} onChangeText={(value) => onUpdateField('fullName', value)} placeholder="Full name" />
        <Field label="Headline" value={profile.headline} onChangeText={(value) => onUpdateField('headline', value)} placeholder="Professional status or role" />
        <Field label="Skills" value={profile.skills.join(', ')} onChangeText={onUpdateSkills} placeholder="Separate skills with commas" />
        <Field label="Education" value={profile.education.join('\n')} onChangeText={(value) => onUpdateListField('education', value)} placeholder="One entry per line" multiline />
        <Field label="Experience" value={profile.experience.join('\n')} onChangeText={(value) => onUpdateListField('experience', value)} placeholder="One entry per line" multiline />
        <Field label="Projects" value={profile.projects.join('\n')} onChangeText={(value) => onUpdateListField('projects', value)} placeholder="One entry per line" multiline />
        <Field label="Certifications" value={profile.certifications?.join('\n') ?? ''} onChangeText={onUpdateCertifications} placeholder="One entry per line" multiline />
        <Pressable disabled={isSaving} onPress={() => { void onSave(); }} style={[styles.saveButton, isSaving && styles.disabledButton]}>{isSaving ? <ActivityIndicator color="#F6F4E9" /> : <Text style={styles.saveButtonText}>Save changes</Text>}</Pressable>
        <Pressable disabled={isSaving} onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
      </View>
    </>
  );
}

function ResumeStatus({ isUploading, onRetry, resume }: { isUploading: boolean; onRetry: () => void; resume: ResumeMetadata | null }) {
  const status = resume?.extractionStatus;
  const isProcessing = isUploading || status === 'pending' || status === 'processing';
  const statusCopy = !resume
    ? { title: 'Waiting for a resume', body: 'Your file will remain private and owner-protected.' }
    : isUploading
      ? { title: 'Uploading resume...', body: 'Your file is being stored securely.' }
    : status === 'pending'
      ? { title: 'Resume uploaded. Waiting for extraction...', body: 'A secure server-side parser will process your resume.' }
      : status === 'processing'
        ? { title: 'Extracting resume details...', body: 'Your editable profile will appear when processing is complete.' }
        : status === 'ready'
          ? { title: 'Resume processed successfully', body: 'Review the extracted details below before saving.' }
        : status === 'invalid'
          ? { title: "This doesn't appear to be a resume.", body: resume.validationMessage ?? 'Please upload a valid resume containing education, skills, projects, experience, or certifications.' }
        : { title: 'Resume processing failed', body: 'Please upload the resume again to retry extraction.' };

  return (
    <View style={[styles.statusRow, isProcessing && styles.processingCard]}>
      {isProcessing ? <ProcessingMark /> : <View style={[styles.statusDot, status === 'ready' && styles.statusDone]} />}
      <View style={styles.statusCopy}>
        <Text style={styles.statusTitle}>{statusCopy.title}</Text>
        <Text style={styles.statusBody}>{statusCopy.body}</Text>
        {isProcessing ? <Text style={styles.processingSteps}>✓ Resume uploaded   ✓ Reading document   ◉ Building your profile</Text> : null}
        {status === 'failed' || status === 'invalid' ? <Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Replace resume</Text></Pressable> : null}
      </View>
    </View>
  );
}

function ProcessingMark() {
  const [pulse] = useState(() => new Animated.Value(0.7));

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: 0.7, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return <Animated.View style={[styles.processingMark, { opacity: pulse }]}><Text style={styles.processingMarkText}>✦</Text></Animated.View>;
}

type FieldProps = { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; multiline?: boolean };

function Field({ label, value, placeholder, onChangeText, multiline = false }: FieldProps) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA39E" multiline={multiline} style={[styles.input, multiline && styles.multilineInput]} /></View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, paddingHorizontal: 20, paddingBottom: 112 },
  embeddedContainer: { paddingBottom: 24 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 22, paddingTop: 16 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  doneButton: { backgroundColor: colors.softPrimary, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 },
  doneText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  hero: { backgroundColor: colors.primaryDark, borderRadius: 24, marginBottom: 14, overflow: 'hidden', padding: 22 },
  heroOrb: { alignItems: 'center', backgroundColor: '#696AF0', borderRadius: 22, height: 44, justifyContent: 'center', marginBottom: 20, width: 44 },
  heroOrbText: { color: '#FFFFFF', fontSize: 22 },
  heroKicker: { color: '#BFC2FF', fontSize: 9, fontWeight: '800', letterSpacing: 1.4, marginBottom: 10 },
  heroTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', letterSpacing: -0.7, lineHeight: 30, maxWidth: 310 },
  heroBody: { color: '#D7D8FF', fontSize: 12, lineHeight: 18, marginTop: 11, maxWidth: 310 },
  errorCard: { backgroundColor: '#FFF3F4', borderColor: '#F8D8DC', borderRadius: 16, borderWidth: 1, marginBottom: 12, padding: 15 },
  errorTitle: { color: colors.error, fontSize: 12, fontWeight: '800', marginBottom: 5 },
  errorText: { color: '#8D5960', fontSize: 11, lineHeight: 17 },
  successToast: { alignItems: 'center', backgroundColor: '#ECFDF3', borderRadius: 14, flexDirection: 'row', marginBottom: 12, padding: 13 },
  successToastIcon: { color: colors.success, fontSize: 16, fontWeight: '800', marginRight: 8 },
  successToastText: { color: '#167342', fontSize: 11, fontWeight: '800' },
  emptyState: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: 1, marginBottom: 12, paddingHorizontal: 24, paddingVertical: 30 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.softPrimary, borderRadius: 25, height: 50, justifyContent: 'center', marginBottom: 17, width: 50 },
  emptyIconText: { color: colors.primary, fontSize: 28, fontWeight: '700' },
  emptyEyebrow: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 8 },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  emptyBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 9, maxWidth: 280, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 13, flexDirection: 'row', justifyContent: 'center', marginTop: 20, minHeight: 48, paddingHorizontal: 20, width: '100%' },
  primaryButtonIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginRight: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  fileHint: { color: '#9A9EB0', fontSize: 10, marginTop: 12 },
  resumeBar: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, flexDirection: 'row', marginBottom: 4, padding: 13 },
  resumeBarIcon: { alignItems: 'center', backgroundColor: colors.softPrimary, borderRadius: 12, height: 42, justifyContent: 'center', marginRight: 11, width: 42 },
  resumeBarIconText: { color: colors.primary, fontSize: 20 },
  uploadCopy: { flex: 1 },
  resumeFileName: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  resumeFileMeta: { color: colors.muted, fontSize: 10 },
  secondaryButton: { backgroundColor: colors.softPrimary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  secondaryButtonText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  statusRow: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: 24, marginTop: 14, paddingHorizontal: 3 },
  processingCard: { backgroundColor: '#F0F0FF', borderRadius: 17, marginTop: 14, padding: 15 },
  statusDot: { backgroundColor: colors.error, borderRadius: 6, height: 11, marginRight: 10, marginTop: 3, width: 11 },
  statusDone: { backgroundColor: colors.success },
  processingMark: { alignItems: 'center', backgroundColor: '#DEDEFF', borderRadius: 18, height: 36, justifyContent: 'center', marginRight: 10, width: 36 },
  processingMarkText: { color: colors.primary, fontSize: 18 },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  statusBody: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  processingSteps: { color: colors.primaryDark, fontSize: 10, lineHeight: 16, marginTop: 9 },
  retryButton: { alignSelf: 'flex-start', marginTop: 8 },
  retryText: { color: colors.error, fontSize: 10, fontWeight: '800' },
  sectionHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  sectionMeta: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, padding: 17 },
  field: { marginBottom: 15 },
  fieldLabel: { color: colors.text, fontSize: 11, fontWeight: '800', marginBottom: 7 },
  input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 11, borderWidth: 1, color: colors.text, fontSize: 12, minHeight: 45, paddingHorizontal: 12, paddingVertical: 11 },
  multilineInput: { minHeight: 75, textAlignVertical: 'top' },
  saveButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', minHeight: 49, marginTop: 3 },
  disabledButton: { backgroundColor: '#A8A9CF' },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  cancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 40, marginTop: 4 },
  cancelText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  profileHeaderCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, flexDirection: 'row', marginBottom: 12, padding: 16 },
  profileAvatar: { alignItems: 'center', backgroundColor: colors.softPrimary, borderRadius: 31, height: 62, justifyContent: 'center', marginRight: 12, width: 62 },
  profileAvatarText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  profileHeaderCopy: { flex: 1 },
  profileName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  profileHeadline: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  readyPill: { alignItems: 'center', flexDirection: 'row', marginTop: 7 },
  readyPillIcon: { alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 8, color: colors.success, fontSize: 9, fontWeight: '800', height: 16, marginRight: 5, paddingTop: 2, textAlign: 'center', width: 16 },
  readyLabel: { color: colors.success, fontSize: 10, fontWeight: '800' },
  editButton: { backgroundColor: colors.softPrimary, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9 },
  editButtonText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  strengthCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginBottom: 14, padding: 16 },
  strengthHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  strengthTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  strengthPercent: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  progressTrack: { backgroundColor: '#E9EAF8', borderRadius: 4, height: 7, marginTop: 14, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.primary, borderRadius: 4, height: '100%' },
  strengthHint: { color: colors.muted, fontSize: 10, marginTop: 9 },
  profileSection: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginBottom: 10, padding: 16 },
  profileSectionTitle: { color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginBottom: 11, textTransform: 'uppercase' },
  profileItem: { borderLeftColor: '#D9DAFF', borderLeftWidth: 2, color: '#454A61', fontSize: 12, lineHeight: 18, marginBottom: 8, paddingLeft: 10 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  skillChip: { backgroundColor: colors.softPrimary, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 },
  skillText: { color: colors.primaryDark, fontSize: 10, fontWeight: '700' },
  privacyNote: { color: '#9A9EB0', fontSize: 10, lineHeight: 15, marginTop: 16, textAlign: 'center' },
});
