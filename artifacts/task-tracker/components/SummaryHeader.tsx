import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInLeft,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { Task } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

function rupeeFormat(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function AnimatedNumber({ target, prefix = "₹" }: { target: number; prefix?: string }) {
  const progress = useSharedValue(0);
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    progress.value = 0;
    const duration = 900;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [target]);

  return <Text>{prefix}{display.toLocaleString("en-IN")}</Text>;
}

export default function SummaryHeader({ tasks }: { tasks: Task[] }) {
  const colors = useColors();

  const liveJobs = tasks.filter((t) => !t.work_done).length;
  const moneyInCloud = tasks.reduce((acc, t) => acc + (t.total_amount - t.paid_amount), 0);
  const moneyInPocket = tasks.reduce((acc, t) => acc + t.paid_amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthEarnings = tasks
    .filter((t) => t.created_at >= monthStart)
    .reduce((acc, t) => acc + t.total_amount, 0);

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.goldBorder }]}>
      <Animated.View entering={FadeInLeft.delay(0).duration(500)}>
        <Text style={[styles.wordmark, { color: colors.gold }]}>Payment Tracker</Text>
      </Animated.View>
      <Animated.View entering={FadeInLeft.delay(80).duration(500)}>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>your command center</Text>
      </Animated.View>

      <View style={styles.topRow}>
        <Animated.View
          entering={FadeInDown.delay(140).duration(500).springify().damping(16)}
          style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
        >
          <Feather name="clock" size={13} color={colors.champagne} strokeWidth={1.5} />
          <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
            Money in the cloud
          </Text>
          <Text style={[styles.heroValue, { color: colors.champagne }]}>
            {rupeeFormat(moneyInCloud)}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(210).duration(500).springify().damping(16)}
          style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
        >
          <Feather name="check-circle" size={13} color={colors.success} strokeWidth={1.5} />
          <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
            Money in pocket
          </Text>
          <Text style={[styles.heroValue, { color: colors.success }]}>
            {rupeeFormat(moneyInPocket)}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.bottomRow}>
        <Animated.View
          entering={FadeInDown.delay(280).duration(450).springify().damping(16)}
          style={[styles.statChip, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
        >
          <Feather name="zap" size={11} color={colors.gold} strokeWidth={1.5} />
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Live jobs </Text>
          <Text style={[styles.statValue, { color: colors.pearl }]}>{liveJobs}</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(340).duration(450).springify().damping(16)}
          style={[styles.statChip, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
        >
          <Feather name="calendar" size={11} color={colors.gold} strokeWidth={1.5} />
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>This month </Text>
          <Text style={[styles.statValue, { color: colors.pearl }]}>{rupeeFormat(thisMonthEarnings)}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 2,
    borderBottomWidth: 0.5,
    marginBottom: 14,
    gap: 6,
  },
  wordmark: {
    fontSize: 26,
    fontFamily: "Satoshi-Black",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Satoshi-Regular",
    letterSpacing: 1,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroCard: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 12,
    paddingLeft: 14,
    gap: 5,
  },
  heroLabel: {
    fontSize: 10,
    fontFamily: "Satoshi-Regular",
    lineHeight: 14,
  },
  heroValue: {
    fontSize: 20,
    fontFamily: "Satoshi-Bold",
  },
  bottomRow: {
    flexDirection: "row",
    gap: 10,
  },
  statChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Satoshi-Regular",
  },
  statValue: {
    fontSize: 12,
    fontFamily: "Satoshi-Bold",
  },
});
