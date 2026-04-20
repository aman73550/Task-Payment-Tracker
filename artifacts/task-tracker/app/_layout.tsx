import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import colors from "@/constants/colors";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TasksProvider } from "@/context/TasksContext";
import { UdhaarProvider } from "@/context/UdhaarContext";
import LoginScreen from "@/app/login";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.light.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="task/[id]" options={{ headerShown: false, presentation: "card" }} />
    </Stack>
  );
}

function AppWithAuth() {
  const { user, token, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080808", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <TasksProvider token={token}>
      <UdhaarProvider token={token}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <RootLayoutNav />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </UdhaarProvider>
    </TasksProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Satoshi-Regular": require("../assets/fonts/Satoshi-Regular.ttf"),
    "Satoshi-Medium": require("../assets/fonts/Satoshi-Medium.ttf"),
    "Satoshi-Bold": require("../assets/fonts/Satoshi-Bold.ttf"),
    "Satoshi-Black": require("../assets/fonts/Satoshi-Black.ttf"),
  });

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  const ready = fontsLoaded || !!fontError || timedOut;

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.light.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.light.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppWithAuth />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
