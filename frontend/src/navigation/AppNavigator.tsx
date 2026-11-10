import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from '../components/BottomTabBar';
import { isFirebaseConfigured } from '../config/firebase';
import {
  getGithubRedirectResult,
  getAuthErrorMessage,
  hasPendingGithubCredential,
  linkPendingGithubCredential,
  subscribeToAuthState,
} from '../services/auth';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RoadmapScreen } from '../screens/RoadmapScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { getUserProfile, saveUserProfile } from '../services/profile';
import { AppTab } from '../types';
import type { CandidateProfile } from '../types/profile';
import { colors } from '../theme';

function requiresEmailVerification(user: User) {
  return user.providerData.some(({ providerId }) => providerId === 'password') && !user.emailVerified;
}

export default function AppNavigator() {
  const [activeTab, setActiveTab] = useState<AppTab>('Home');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isFirebaseConfigured);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToAuthState((nextUser) => {
      if (__DEV__) console.log('Firebase auth user:', nextUser?.uid ?? null);
      setUser(nextUser);
      setActiveTab('Home');
      setProfile(null);
      setProfileError(null);
      setIsProfileLoading(Boolean(nextUser));
      setIsAuthLoading(false);

      if (nextUser && hasPendingGithubCredential()) {
        void linkPendingGithubCredential()
          .then((linkedUser) => {
            if (linkedUser) {
              Alert.alert('GitHub connected', 'Your GitHub account is now linked to your CareerNova account.');
            }
          })
          .catch((error: unknown) => {
            const code = error instanceof Error && 'code' in error && typeof error.code === 'string'
              ? error.code
              : 'auth/unknown';
            Alert.alert('GitHub account not linked', getAuthErrorMessage(code, 'GitHub'));
          });
      }
    });

    let isMounted = true;
    void getGithubRedirectResult()
      .then((result) => {
        if (isMounted && result?.user) {
          setUser(result.user);
          setIsAuthLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        const code = error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : 'auth/unknown';
        Alert.alert('GitHub sign-in failed', getAuthErrorMessage(code, 'GitHub'));
        setIsAuthLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || requiresEmailVerification(user)) {
      return;
    }

    let isMounted = true;

    saveUserProfile(user)
      .then(() => getUserProfile(user.uid))
      .then((savedProfile) => {
        if (isMounted) setProfile(savedProfile);
      })
      .catch((error: Error) => {
        if (__DEV__) console.error('Unable to load user profile.', error);
        if (isMounted) setProfileError('We could not load your profile. Please try again.');
      })
      .finally(() => {
        if (isMounted) setIsProfileLoading(false);
      });

    return () => { isMounted = false; };
  }, [user]);

  if (isAuthLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          {authMode === 'login' ? (
            <LoginScreen onSwitchToSignup={() => setAuthMode('signup')} />
          ) : (
            <SignupScreen onSwitchToLogin={() => setAuthMode('login')} />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (requiresEmailVerification(user)) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <VerifyEmailScreen user={user} onVerified={setUser} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {activeTab === 'Home' ? <HomeScreen onNavigate={setActiveTab} displayName={profile?.displayName ?? user.displayName ?? user.email?.split('@')[0]} /> : null}
        {activeTab === 'Discover' ? <DiscoverScreen uid={user.uid} onProfilePress={() => setActiveTab('Profile')} /> : null}
        {activeTab === 'Roadmap' ? <RoadmapScreen /> : null}
        {activeTab === 'Profile' ? (
          <ProfileScreen
            key={user.uid}
            profile={profile}
            isLoading={isProfileLoading}
            error={profileError}
            onProfileUpdated={(displayName) => setProfile((current) => current ? { ...current, displayName } : current)}
            onPreferencesUpdated={(preferences) => setProfile((current) => current ? { ...current, preferences } : current)}
            onRecommendationsRefreshed={() => setActiveTab('Discover')}
            onClose={() => setActiveTab('Home')}
          />
        ) : null}
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: 13, marginTop: 12 },
});
