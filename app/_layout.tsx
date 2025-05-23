import 'react-native-url-polyfill/auto';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { View, Text } from "react-native";
import { useThemeStore } from "@/hooks/use-theme-store";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userSession, setUserSession] = useState<Session | null>(null);
  const segments = useSegments();
  const router = useRouter();

  // Check for user session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUserSession(data.session);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUserSession(session);
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    
    if (!userSession && !inAuthGroup) {
      // If user is not signed in and not on an auth page, redirect to login
      router.replace('/auth/login');
    } else if (userSession && inAuthGroup) {
      // If user is signed in and on an auth page, redirect to home
      router.replace('/(tabs)');
    }
  }, [userSession, segments, isLoading]);

  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}