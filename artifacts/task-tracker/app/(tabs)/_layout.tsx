import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
        <Label>Tasks</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="finance">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Finance</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="udhaar">
        <Icon sf={{ default: "arrow.left.arrow.right", selected: "arrow.left.arrow.right" }} />
        <Label>Udhaar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="contacts">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>People</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 0.5,
          borderTopColor: colors.goldBorder,
          elevation: 0,
          height: isWeb ? 84 : 50 + insets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Payment Tracker",
          headerTitleStyle: {
            color: colors.gold,
            fontSize: 14,
            fontFamily: "Satoshi-Black",
            letterSpacing: 1.5,
          },
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="list.bullet" tintColor={color} size={22} />
            ) : (
              <Feather name="list" size={21} color={color} strokeWidth={1.5} />
            ),
          tabBarLabel: "Tasks",
          tabBarLabelStyle: { fontFamily: "Satoshi-Medium", fontSize: 11 },
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Finance",
          headerTitleStyle: {
            color: colors.gold,
            fontSize: 14,
            fontFamily: "Satoshi-Black",
            letterSpacing: 1.5,
          },
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="chart.bar" tintColor={color} size={22} />
            ) : (
              <Feather name="trending-up" size={21} color={color} strokeWidth={1.5} />
            ),
          tabBarLabel: "Finance",
          tabBarLabelStyle: { fontFamily: "Satoshi-Medium", fontSize: 11 },
        }}
      />
      <Tabs.Screen
        name="udhaar"
        options={{
          title: "Udhaar",
          headerTitleStyle: {
            color: colors.gold,
            fontSize: 14,
            fontFamily: "Satoshi-Black",
            letterSpacing: 1.5,
          },
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="arrow.left.arrow.right" tintColor={color} size={22} />
            ) : (
              <Feather name="repeat" size={21} color={color} strokeWidth={1.5} />
            ),
          tabBarLabel: "Udhaar",
          tabBarLabelStyle: { fontFamily: "Satoshi-Medium", fontSize: 11 },
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "People",
          headerTitleStyle: {
            color: colors.gold,
            fontSize: 14,
            fontFamily: "Satoshi-Black",
            letterSpacing: 1.5,
          },
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.2" tintColor={color} size={22} />
            ) : (
              <Feather name="users" size={21} color={color} strokeWidth={1.5} />
            ),
          tabBarLabel: "People",
          tabBarLabelStyle: { fontFamily: "Satoshi-Medium", fontSize: 11 },
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({});
