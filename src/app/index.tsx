import { View, ActivityIndicator } from 'react-native';

import { router } from 'expo-router';

import { useEffect } from 'react';

import { useAppStore } from '../store/appStore';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const appLoading = useAppStore((state) => state.loading);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const loadAppState = useAppStore((state) => state.loadAppState);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function initialize() {
      await loadAppState();
    }

    initialize();
  }, []);

  useEffect(() => {
    if (appLoading || authLoading) {
      return;
    }

    console.log('....it passed loading');
    if (!onboardingComplete) {
      router.replace('/onboarding');

      return;
    }
    console.log('....it passed onboarding');

    if (user) {
      router.replace('/(customer)/');

      return;
    }

    router.replace('/login');
  }, [appLoading, authLoading, onboardingComplete, user]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <ActivityIndicator size="large" color="#16A34A" />
    </View>
  );
}
