import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from '../src/lib/supabase';
import { storage } from '../src/lib/storage';

export default function RootLayout() {
  useEffect(() => {
    // Handle deep links
    function handleDeepLink(event: { url: string }) {
      const { queryParams } = Linking.parse(event.url);
      if (queryParams?.token) {
        storage.setQuizToken(queryParams.token as string);
      }
    }

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="trip/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="paywall"
          options={{ presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}
