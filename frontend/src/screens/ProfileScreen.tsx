import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { refreshPersonalizedRecommendations, saveCandidatePreferences, saveUserDisplayName } from '../services/profile';
import type { CandidatePreferences, CandidateProfile } from '../types/profile';
import { ResumeScreen } from './ResumeScreen';
import { colors, radii, shadows } from '../theme';
import { countryCodes, countryFlag, countryName, domainOptions, experienceOptions, roleOptions, workModeOptions, type PreferenceOption } from '../data/preferenceOptions';
import { searchLocations, type LocationSuggestion } from '../services/locationSearch';

type ProfileScreenProps = {
  profile: CandidateProfile | null;
  isLoading: boolean;
  error: string | null;
  onClose?: () => void;
  onProfileUpdated?: (displayName: string) => void;
  onPreferencesUpdated?: (preferences: CandidatePreferences) => void;
  onRecommendationsRefreshed?: () => void;
};

const emptyPreferences: CandidatePreferences = {
  targetRole: '',
  domain: '',
  dreamCompany: '',
  location: '',
  workMode: '',
  experienceLevel: '',
};

export function ProfileScreen({ profile, isLoading, error, onClose, onProfileUpdated, onPreferencesUpdated, onRecommendationsRefreshed }: ProfileScreenProps) {
  const email = profile?.email ?? auth.currentUser?.email ?? 'Signed-in member';
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = profile?.displayName ?? 'CareerNova member';
  const [preferences, setPreferences] = useState<CandidatePreferences>(profile?.preferences ?? emptyPreferences);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [editableName, setEditableName] = useState(profile?.displayName ?? auth.currentUser?.displayName ?? '');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isRefreshingRecommendations, setIsRefreshingRecommendations] = useState(false);

  const updatePreference = (field: keyof CandidatePreferences, value: string) => {
    setPreferences((current) => ({ ...current, [field]: value }));
  };

  const updateLocation = (value: string, details?: CandidatePreferences['locationDetails']) => {
    setPreferences((current) => {
      if (details) {
        return { ...current, location: value, locationDetails: details };
      }

      const { locationDetails: _locationDetails, ...withoutLocationDetails } = current;
      return { ...withoutLocationDetails, location: value };
    });
  };

  const handleSavePreferences = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Unable to save preferences', 'Sign in before saving your preferences.');
      return;
    }

    setIsSavingPreferences(true);
    try {
      const savedPreferences: CandidatePreferences = {
        targetRole: preferences.targetRole.trim(),
        domain: preferences.domain.trim(),
        dreamCompany: preferences.dreamCompany.trim(),
        location: preferences.location.trim(),
        workMode: preferences.workMode.trim(),
        experienceLevel: preferences.experienceLevel.trim(),
        ...(preferences.locationDetails ? { locationDetails: preferences.locationDetails } : {}),
      };
      await saveCandidatePreferences(user.uid, savedPreferences);
      setPreferences(savedPreferences);
      onPreferencesUpdated?.(savedPreferences);
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

  const handleRefreshRecommendations = async () => {
    if (isEditingPreferences || isSavingPreferences || isRefreshingRecommendations) return;

    setIsRefreshingRecommendations(true);
    try {
      const recommendationCount = await refreshPersonalizedRecommendations();
      Alert.alert(
        'Job matches refreshed',
        recommendationCount
          ? `${recommendationCount} jobs matched your saved preferences and skills.`
          : 'No matching jobs were found. Try broadening your preferences or updating your resume skills.',
      );
      onRecommendationsRefreshed?.();
    } catch (refreshError) {
      if (__DEV__) console.error('Unable to refresh job recommendations.', refreshError);
      const message = refreshError instanceof Error && refreshError.message.includes('Review your resume skills')
        ? 'Review your resume skills before refreshing job matches.'
        : 'Save all preferences and review your resume skills before refreshing job matches.';
      Alert.alert('Unable to refresh job matches', message);
    } finally {
      setIsRefreshingRecommendations(false);
    }
  };

  const savedPreferenceValues = [
    ...(isEditingPreferences ? [
      preferences.targetRole,
      preferences.domain,
      preferences.dreamCompany,
      preferences.location,
      preferences.workMode,
      preferences.experienceLevel,
    ] : [
      profile?.preferences?.targetRole ?? '',
      profile?.preferences?.domain ?? '',
      profile?.preferences?.dreamCompany ?? '',
      profile?.preferences?.location ?? '',
      profile?.preferences?.workMode ?? '',
      profile?.preferences?.experienceLevel ?? '',
    ]),
  ].filter(Boolean);
  const stats = profile?.stats ?? { savedRoles: 0, completedTasks: 0, applications: 0 };
  const profileStrength = profile?.reviewedProfile
    ? Math.min(100, 40 + Object.values(profile.reviewedProfile).filter((value) => value && (!Array.isArray(value) || value.length > 0)).length * 10)
    : 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.groupHeading}>Career direction</Text>
            <SearchablePreferenceField label="Target role" value={preferences.targetRole} options={roleOptions} onChange={(value) => updatePreference('targetRole', value)} />
            <SearchablePreferenceField label="Industry or domain" value={preferences.domain} options={domainOptions} onChange={(value) => updatePreference('domain', value)} />
            <PreferenceField label="Dream company" value={preferences.dreamCompany} onChangeText={(value) => updatePreference('dreamCompany', value)} />
            <LocationField
              value={preferences.location}
              locationDetails={preferences.locationDetails}
              onChange={updateLocation}
            />
            <OptionChips label="Work mode" value={preferences.workMode} options={workModeOptions} onChange={(value) => updatePreference('workMode', value)} />
            <OptionChips label="Experience level" value={preferences.experienceLevel} options={experienceOptions} onChange={(value) => updatePreference('experienceLevel', value)} />
            <Pressable disabled={isSavingPreferences} onPress={() => { void handleSavePreferences(); }} style={styles.preferenceSave}>{isSavingPreferences ? <ActivityIndicator color="#F6F4E9" /> : <Text style={styles.preferenceSaveText}>Save preferences</Text>}</Pressable>
          </>
        ) : (
          <View style={styles.chipRow}>{(savedPreferenceValues.length ? savedPreferenceValues : ['No preferences saved yet']).map((preference) => <View key={preference} style={styles.preferenceChip}><Text style={styles.preferenceText}>{preference}</Text></View>)}</View>
        )}
        {!isEditingPreferences ? <Pressable onPress={() => { setPreferences(profile?.preferences ?? emptyPreferences); setIsEditingPreferences(true); }} style={styles.preferenceAction}><Text style={styles.preferenceActionText}>Edit preferences</Text><Text style={styles.arrow}>→</Text></Pressable> : null}
      </View>

      <View style={styles.refreshCard}>
        <View style={styles.refreshCopy}>
          <Text style={styles.refreshTitle}>Refresh job matches</Text>
          <Text style={styles.refreshBody}>Check your saved preferences and reviewed resume skills, then find the latest matches.</Text>
        </View>
        <Pressable
          disabled={isEditingPreferences || isRefreshingRecommendations}
          onPress={() => { void handleRefreshRecommendations(); }}
          style={[styles.refreshButton, (isEditingPreferences || isRefreshingRecommendations) && styles.disabledButton]}
        >
          {isRefreshingRecommendations ? <ActivityIndicator color={colors.inkOnPrimary} /> : <Text style={styles.refreshButtonText}>Refresh</Text>}
        </Pressable>
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
    </KeyboardAvoidingView>
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

function matchesOption(option: PreferenceOption, query: string) {
  const search = query.trim().toLowerCase();
  return !search || option.label.toLowerCase().includes(search) || option.keywords?.some((keyword) => keyword.includes(search));
}

function SearchablePreferenceField({ label, value, options, onChange }: { label: string; value: string; options: PreferenceOption[]; onChange: (value: string) => void }) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const filteredOptions = useMemo(() => options.filter((option) => matchesOption(option, query)).slice(0, 8), [options, query]);
  return (
    <View style={styles.preferenceField}>
      <Text style={styles.preferenceFieldLabel}>{label}</Text>
      <TextInput
        value={query}
        onChangeText={(nextValue) => { setQuery(nextValue); onChange(nextValue); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 180)}
        placeholder={`Search ${label.toLowerCase()}`}
        placeholderTextColor={colors.subtle}
        style={styles.preferenceInput}
        accessibilityLabel={label}
      />
      {isOpen ? (
        <View style={styles.suggestionPanel}>
          {filteredOptions.map((option) => (
            <Pressable key={option.label} onPressIn={() => { onChange(option.label); setQuery(option.label); setIsOpen(false); }} style={styles.suggestionRow}>
              <Text style={styles.suggestionText}>{option.label}</Text>
              {value === option.label ? <Text style={styles.selectedMark}>✓</Text> : null}
            </Pressable>
          ))}
          {query.trim() && !options.some((option) => option.label.toLowerCase() === query.trim().toLowerCase()) ? (
            <Pressable onPressIn={() => { onChange(query.trim()); setQuery(query.trim()); setIsOpen(false); }} style={styles.customOption}>
              <Text style={styles.customOptionText}>Use “{query.trim()}”</Text>
            </Pressable>
          ) : null}
          {!filteredOptions.length && !query.trim() ? <Text style={styles.emptySuggestion}>Start typing to search options.</Text> : null}
          {!filteredOptions.length && query.trim() && !options.some((option) => option.label.toLowerCase() === query.trim().toLowerCase()) ? <Text style={styles.emptySuggestion}>No matches. You can use a custom value.</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function OptionChips({ label, value, options, onChange }: { label: string; value: string; options: PreferenceOption[]; onChange: (value: string) => void }) {
  return (
    <View style={styles.preferenceField}>
      <Text style={styles.preferenceFieldLabel}>{label}</Text>
      <View style={styles.optionGrid}>
        {options.map((option) => (
          <Pressable key={option.label} onPress={() => onChange(option.label)} style={[styles.optionButton, value === option.label && styles.optionButtonSelected]}>
            <Text style={[styles.optionButtonText, value === option.label && styles.optionButtonTextSelected]}>{option.label}</Text>
            {option.keywords?.[0] ? <Text style={styles.optionHint}>{option.keywords[0]}</Text> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const popularIndiaLocations = ['Hyderabad', 'Mumbai', 'Bengaluru', 'Chennai', 'Delhi', 'Pune', 'Kolkata', 'Ahmedabad', 'Gurugram', 'Noida', 'Visakhapatnam'];

function LocationField({ value, locationDetails, onChange }: { value: string; locationDetails?: CandidatePreferences['locationDetails']; onChange: (value: string, details?: CandidatePreferences['locationDetails']) => void }) {
  const [countryCode, setCountryCode] = useState(locationDetails?.countryCode);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const activeCountryCode = locationDetails?.countryCode ?? countryCode;
  const displayValue = value.toUpperCase() === 'IN' ? 'India' : value;
  useEffect(() => {
    const timer = setTimeout(() => {
      const search = value.trim().toLowerCase();
      const matchingCountries = countryCodes
        .filter((code) => countryName(code).toLowerCase().includes(search))
        .slice(0, 12);
      setCountrySuggestions(search ? matchingCountries : activeCountryCode === 'IN' ? [] : matchingCountries);
      if (search.length < 2) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      setSearchError(null);
      void searchLocations(value, activeCountryCode)
        .then(setSuggestions)
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === 'AbortError') return;
          setSuggestions([]);
          setSearchError('Location suggestions are unavailable. You can still save this value.');
        })
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [activeCountryCode, value]);

  const commitLocation = (nextValue: string, details?: CandidatePreferences['locationDetails']) => {
    if (details?.countryCode) setCountryCode(details.countryCode);
    setIsOpen(false);
    onChange(nextValue, details);
  };

  const selectCountry = (code: string) => {
    const name = countryName(code);
    setCountryCode(code);
    setIsOpen(true);
    onChange(name, { displayName: name, country: name, countryCode: code });
  };
  const selectLocation = (suggestion: LocationSuggestion) => {
    commitLocation(suggestion.displayName, suggestion);
  };

  return (
    <View style={styles.preferenceField}>
      <Text style={styles.preferenceFieldLabel}>Location</Text>
      <Text style={styles.fieldHelper}>Search countries, cities, regions, or postal codes worldwide.</Text>
      <TextInput
        value={displayValue}
        onChangeText={(nextValue) => { setIsOpen(true); onChange(nextValue); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 500)}
        placeholder="Search a city, country, or PIN code"
        placeholderTextColor={colors.subtle}
        style={styles.preferenceInput}
        accessibilityLabel="Location"
      />
      {isOpen ? (
        <View style={styles.suggestionPanel}>
          {countrySuggestions.map((code) => (
            <Pressable key={code} onPressIn={() => selectCountry(code)} style={styles.suggestionRow}>
              <Text style={styles.countryFlag}>{countryFlag(code)}</Text>
              <View style={styles.locationCopy}><Text style={styles.suggestionText}>{countryName(code)}</Text><Text style={styles.locationMeta}>{code} · Country</Text></View>
            </Pressable>
          ))}
          {activeCountryCode === 'IN' && (!value.trim() || value.trim().toLowerCase() === 'india') ? popularIndiaLocations.map((location) => (
            <Pressable key={location} onPressIn={() => commitLocation(location, { displayName: location, country: 'India', countryCode: 'IN', city: location })} style={styles.suggestionRow}>
              <Text style={styles.suggestionText}>{location}</Text><Text style={styles.locationMeta}>India</Text>
            </Pressable>
          )) : null}
          {suggestions.map((suggestion, index) => (
            <Pressable key={`${suggestion.displayName}-${index}`} onPressIn={() => selectLocation(suggestion)} style={styles.suggestionRow}>
              <View style={styles.locationCopy}><Text style={styles.suggestionText}>{suggestion.city ?? suggestion.displayName.split(',')[0]}</Text><Text style={styles.locationMeta}>{suggestion.state ? `${suggestion.state}, ` : ''}{suggestion.country} · {suggestion.postalCode ? 'Postal code' : suggestion.type}</Text></View>
            </Pressable>
          ))}
          {isSearching ? <ActivityIndicator color={colors.primary} style={styles.suggestionLoader} /> : null}
          {searchError ? <Text style={styles.emptySuggestion}>{searchError}</Text> : null}
          {!countrySuggestions.length && !suggestions.length && !isSearching && !searchError && value.trim().length > 1 ? <Text style={styles.emptySuggestion}>No verified match. You can use this custom location.</Text> : null}
        </View>
      ) : null}
      {locationDetails?.country ? <Text style={styles.selectedLocation}>Selected: {locationDetails.city ?? locationDetails.displayName} · {locationDetails.country.toUpperCase() === 'IN' ? 'India' : locationDetails.country}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
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
  fieldHelper: { color: colors.muted, fontSize: 10, lineHeight: 15, marginBottom: 6 },
  preferenceInput: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 8, borderWidth: 1, color: colors.text, fontSize: 11, paddingHorizontal: 10, paddingVertical: 9 },
  groupHeading: { color: colors.primaryDark, fontSize: 11, fontWeight: '800', marginBottom: 9, marginTop: 2 },
  suggestionPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, marginTop: 4, maxHeight: 260, overflow: 'hidden' },
  suggestionRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 44, paddingHorizontal: 10, paddingVertical: 7 },
  suggestionText: { color: colors.text, flex: 1, fontSize: 11, fontWeight: '700' },
  selectedMark: { color: colors.success, fontSize: 15, fontWeight: '800' },
  customOption: { backgroundColor: colors.softPrimary, paddingHorizontal: 10, paddingVertical: 11 },
  customOptionText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  emptySuggestion: { color: colors.muted, fontSize: 10, padding: 11 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  optionButton: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 9, borderWidth: 1, minWidth: '30%', paddingHorizontal: 9, paddingVertical: 9 },
  optionButtonSelected: { backgroundColor: colors.softPrimary, borderColor: colors.primary },
  optionButtonText: { color: colors.secondaryText, fontSize: 10, fontWeight: '700' },
  optionButtonTextSelected: { color: colors.primaryDark },
  optionHint: { color: colors.subtle, fontSize: 8, marginTop: 3 },
  countryFlag: { fontSize: 18, marginRight: 9 },
  locationCopy: { flex: 1 },
  locationMeta: { color: colors.muted, fontSize: 9, marginTop: 2 },
  suggestionLoader: { padding: 10 },
  selectedLocation: { color: colors.success, fontSize: 9, fontWeight: '700', marginTop: 5 },
  preferenceSave: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, justifyContent: 'center', minHeight: 40, marginTop: 4 },
  preferenceSaveText: { color: colors.inkOnPrimary, fontSize: 11, fontWeight: '800' },
  preferenceAction: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 13 },
  preferenceActionText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  arrow: { color: colors.primary, fontSize: 18 },
  refreshCard: { alignItems: 'center', backgroundColor: colors.softPrimary, borderColor: '#D9D9FF', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, padding: 14 },
  refreshCopy: { flex: 1, paddingRight: 12 },
  refreshTitle: { color: colors.primaryDark, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  refreshBody: { color: colors.secondaryText, fontSize: 10, lineHeight: 15 },
  refreshButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.sm, justifyContent: 'center', minHeight: 38, minWidth: 82, paddingHorizontal: 10 },
  refreshButtonText: { color: colors.inkOnPrimary, fontSize: 10, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
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
