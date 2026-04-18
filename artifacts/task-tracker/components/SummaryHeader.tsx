import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Task } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function SummaryHeader({ tasks }: { tasks: Task[] }) {
  const colors = useColors();

  const totalPending = tasks.reduce((sum, t) => sum + (t.total_amount - t.paid_amount), 0);
  const totalCollected = tasks.reduce((sum, t) => sum + t.paid_amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.appTitle, { color: colors.gold }]}>PAYMENT TRACKER</Text>
      </View>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>TOTAL PENDING</Text>
          <Text style={[styles.amount, { color: colors.gold }]}>{formatCurrency(totalPending)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>TOTAL RECEIVED</Text>
          <Text style={[styles.amount, { color: colors.success }]}>{formatCurrency(totalCollected)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 12,
  },
  appTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 0,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
  },
  amount: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    width: 1,
    marginHorizontal: 16,
  },
});
