import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Task } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

function rupeeFormat(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function SummaryHeader({ tasks }: { tasks: Task[] }) {
  const colors = useColors();

  const totalBilled = tasks.reduce((acc, t) => acc + t.total_amount, 0);
  const cashInHand = tasks.reduce((acc, t) => acc + t.paid_amount, 0);
  const outstandingDues = totalBilled - cashInHand;

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.goldBorder }]}>
      <Text style={[styles.wordmark, { color: colors.gold }]}>
        Payment Tracker
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        your financial overview
      </Text>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
          <Feather name="clock" size={14} color={colors.champagne} strokeWidth={1.5} />
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
            Money you're waiting for
          </Text>
          <Text style={[styles.metricValue, { color: colors.champagne }]}>
            {rupeeFormat(outstandingDues)}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
          <Feather name="check-circle" size={14} color={colors.success} strokeWidth={1.5} />
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
            Money in your pocket
          </Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            {rupeeFormat(cashInHand)}
          </Text>
        </View>
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
    gap: 4,
  },
  wordmark: {
    fontSize: 26,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 12,
    paddingLeft: 14,
    gap: 5,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
});
