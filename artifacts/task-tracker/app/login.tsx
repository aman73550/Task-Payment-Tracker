import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Reanimated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

const GOLD = "#D4AF37";
const BG = "#080808";
const PEARL = "#F4F4F4";
const MUTED = "#6B6254";
const ERROR_BG = "#1A0A0A";

function GoldRingLogo() {
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.5);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 1800 }),
        withTiming(0.5, { duration: 1800 })
      ),
      -1,
      false
    );
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Reanimated.View entering={ZoomIn.delay(80).springify().damping(14)}>
      <View style={styles.logoRingWrap}>
        <Reanimated.View style={[styles.outerRing, outerRingStyle]} />
        <View style={styles.logoRing}>
          <Feather name="briefcase" size={22} color={GOLD} strokeWidth={1.5} />
        </View>
      </View>
    </Reanimated.View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btnScale.value = withSequence(
      withSpring(0.95, { damping: 12 }),
      withSpring(1, { damping: 12 })
    );
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(phone, password);
        setSuccess("Glad to see you again. Your records are loading.");
      } else {
        if (!name.trim()) { setError("Please enter your name."); shake(); return; }
        await register(phone, password, name);
        setSuccess("Account created. Welcome aboard.");
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Reanimated.View entering={FadeInDown.delay(0).duration(600)} style={styles.logoArea}>
            <GoldRingLogo />
            <Reanimated.View entering={FadeInDown.delay(140).duration(500)}>
              <Text style={styles.appName}>Aman's Tracker</Text>
            </Reanimated.View>
          </Reanimated.View>

          <Animated.View style={[{ transform: [{ translateX: shakeAnim }] }]}>
            <Reanimated.View entering={FadeInUp.delay(220).duration(500).springify().damping(16)} style={styles.formCard}>
              <Text style={styles.greeting}>
                {mode === "login" ? "Welcome back." : "Create account."}
              </Text>
              <Text style={styles.subGreeting}>
                {mode === "login"
                  ? "Your records are waiting."
                  : "Start tracking tasks and udhaar."}
              </Text>

              {mode === "register" && (
                <Reanimated.View entering={FadeInDown.duration(300).springify()} style={styles.inputBlock}>
                  <View style={styles.inputRow}>
                    <Feather name="user" size={16} color={MUTED} strokeWidth={1.5} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your name"
                      placeholderTextColor={MUTED}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.inputBorder} />
                </Reanimated.View>
              )}

              <Reanimated.View entering={FadeInDown.delay(280).duration(400)} style={styles.inputBlock}>
                <View style={styles.inputRow}>
                  <Feather name="phone" size={16} color={MUTED} strokeWidth={1.5} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile number"
                    placeholderTextColor={MUTED}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    textContentType="telephoneNumber"
                  />
                </View>
                <View style={styles.inputBorder} />
              </Reanimated.View>

              <Reanimated.View entering={FadeInDown.delay(340).duration(400)} style={styles.inputBlock}>
                <View style={styles.inputRow}>
                  <Feather name="lock" size={16} color={MUTED} strokeWidth={1.5} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor={MUTED}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    textContentType={mode === "register" ? "newPassword" : "password"}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={15} color={MUTED} strokeWidth={1.5} />
                  </Pressable>
                </View>
                <View style={styles.inputBorder} />
              </Reanimated.View>

              {!!error && (
                <Reanimated.View entering={FadeInDown.duration(250)} style={styles.errorBox}>
                  <Feather name="alert-circle" size={13} color="#E85D4A" strokeWidth={1.5} />
                  <Text style={styles.errorText}>{error}</Text>
                </Reanimated.View>
              )}

              {!!success && (
                <Reanimated.View entering={FadeInDown.duration(250)} style={styles.successBox}>
                  <Feather name="check-circle" size={13} color={GOLD} strokeWidth={1.5} />
                  <Text style={styles.successText}>{success}</Text>
                </Reanimated.View>
              )}

              <Reanimated.View entering={FadeInUp.delay(400).duration(400)} style={btnStyle}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  style={({ pressed }) => [styles.btn, { opacity: pressed || loading ? 0.85 : 1 }]}
                >
                  {loading ? (
                    <ActivityIndicator color={BG} size="small" />
                  ) : (
                    <Text style={styles.btnText}>{mode === "login" ? "Sign In" : "Create Account"}</Text>
                  )}
                </Pressable>
              </Reanimated.View>

              <Reanimated.View entering={FadeInUp.delay(460).duration(400)}>
                <Pressable
                  onPress={() => {
                    setMode((m) => (m === "login" ? "register" : "login"));
                    setError(""); setSuccess("");
                  }}
                  style={styles.switchRow}
                >
                  <Text style={styles.switchText}>
                    {mode === "login" ? "New here? " : "Already have an account? "}
                    <Text style={{ color: GOLD }}>{mode === "login" ? "Register" : "Sign in"}</Text>
                  </Text>
                </Pressable>
              </Reanimated.View>
            </Reanimated.View>
          </Animated.View>

          <Reanimated.View entering={FadeInUp.delay(520).duration(400)}>
            <Text style={styles.footer}>Everything is synced and safe.</Text>
          </Reanimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 },
  logoArea: { alignItems: "center", marginBottom: 40, gap: 12 },
  logoRingWrap: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  outerRing: {
    position: "absolute",
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1, borderColor: GOLD,
  },
  logoRing: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1, borderColor: GOLD + "50",
    alignItems: "center", justifyContent: "center",
    backgroundColor: GOLD + "10",
  },
  appName: { color: GOLD, fontSize: 13, fontFamily: "Satoshi-Medium", letterSpacing: 2 },
  formCard: { gap: 20 },
  greeting: { color: PEARL, fontSize: 28, fontFamily: "Satoshi-Black", letterSpacing: 0.3 },
  subGreeting: { color: MUTED, fontSize: 13, fontFamily: "Satoshi-Regular", marginTop: -8, marginBottom: 8 },
  inputBlock: { gap: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  input: { flex: 1, color: PEARL, fontSize: 15, fontFamily: "Satoshi-Regular", padding: 0 },
  inputBorder: { height: 1, backgroundColor: GOLD, opacity: 0.5 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: ERROR_BG, borderRadius: 8,
    padding: 12, borderWidth: 0.5, borderColor: "#E85D4A30",
  },
  errorText: { color: "#E85D4A", fontSize: 13, fontFamily: "Satoshi-Regular", flex: 1 },
  successBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: GOLD + "10", borderRadius: 8,
    padding: 12, borderWidth: 0.5, borderColor: GOLD + "30",
  },
  successText: { color: GOLD, fontSize: 13, fontFamily: "Satoshi-Regular", flex: 1 },
  btn: {
    backgroundColor: GOLD, borderRadius: 10, height: 50,
    alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  btnText: { color: BG, fontSize: 15, fontFamily: "Satoshi-Bold", letterSpacing: 0.3 },
  switchRow: { alignItems: "center", paddingTop: 4 },
  switchText: { color: MUTED, fontSize: 13, fontFamily: "Satoshi-Regular" },
  footer: {
    textAlign: "center", color: MUTED + "60", fontSize: 11,
    fontFamily: "Satoshi-Regular", marginTop: 40, letterSpacing: 0.5,
  },
});
