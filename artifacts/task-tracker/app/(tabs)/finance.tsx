import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Task, useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

function rupeeFormat(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function monthKey(isoDate: string) {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

interface MonthGroup {
  key: string;
  label: string;
  totalBilled: number;
  cashCollected: number;
  taskCount: number;
  collectionRatio: number;
}

function groupByMonth(taskList: Task[]): MonthGroup[] {
  const registry = new Map<string, MonthGroup>();

  for (const taskEntry of taskList) {
    const groupKey = monthKey(taskEntry.created_at);
    if (!registry.has(groupKey)) {
      registry.set(groupKey, {
        key: groupKey,
        label: monthLabel(groupKey),
        totalBilled: 0,
        cashCollected: 0,
        taskCount: 0,
        collectionRatio: 0,
      });
    }
    const snapshot = registry.get(groupKey)!;
    snapshot.totalBilled += taskEntry.total_amount;
    snapshot.cashCollected += taskEntry.paid_amount;
    snapshot.taskCount += 1;
  }

  return Array.from(registry.values())
    .map((g) => ({
      ...g,
      collectionRatio: g.totalBilled > 0 ? (g.cashCollected / g.totalBilled) * 100 : 0,
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

export default function FinanceScreen() {
  const colors = useColors();
  const { tasks } = useTasks();
  const insets = useSafeAreaInsets();

  const netWorth = tasks.reduce((acc, t) => acc + t.total_amount, 0);
  const cashInHand = tasks.reduce((acc, t) => acc + t.paid_amount, 0);
  const outstandingDues = netWorth - cashInHand;
  const overallRatio = netWorth > 0 ? (cashInHand / netWorth) * 100 : 0;

  const monthlyRegistry = useMemo(() => groupByMonth(tasks), [tasks]);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 84;

  if (tasks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Feather name="bar-chart-2" size={44} color={colors.border} strokeWidth={1.5} />
        <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
          No financial data yet
        </Text>
        <Text style={[styles.emptyHint, { color: colors.border }]}>
          Add your first task to start tracking
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageHeading, { color: colors.gold }]}>Your Money</Text>
      <Text style={[styles.pageSubheading, { color: colors.mutedForeground }]}>
        a clear picture of what you've earned
      </Text>

      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
        <View style={styles.heroTop}>
          <Feather name="briefcase" size={16} color={colors.champagne} strokeWidth={1.5} />
          <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
            Total work billed
          </Text>
        </View>
        <Text style={[styles.heroAmount, { color: colors.pearl }]}>{rupeeFormat(netWorth)}</Text>

        <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStat}>
            <Feather name="check-circle" size={13} color={colors.success} strokeWidth={1.5} />
            <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>In hand</Text>
            <Text style={[styles.heroStatValue, { color: colors.success }]}>{rupeeFormat(cashInHand)}</Text>
          </View>
          <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroStat}>
            <Feather name="clock" size={13} color={colors.champagne} strokeWidth={1.5} />
            <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Outstanding</Text>
            <Text style={[styles.heroStatValue, { color: colors.champagne }]}>{rupeeFormat(outstandingDues)}</Text>
          </View>
        </View>

        <View style={styles.overallProgressRow}>
          <View style={[styles.overallProgressRail, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                styles.overallProgressFill,
                {
                  width: `${Math.min(overallRatio, 100)}%` as any,
                  backgroundColor: overallRatio >= 100 ? colors.success : colors.gold,
                },
              ]}
            />
          </View>
          <Text style={[styles.overallRatioText, { color: colors.mutedForeground }]}>
            {Math.round(overallRatio)}% collected
          </Text>
        </View>
      </View>

      <View style={styles.monthsSection}>
        <Text style={[styles.sectionTitle, { color: colors.pearl }]}>Monthly Breakdown</Text>

        {monthlyRegistry.map((monthSnapshot) => {
          const isFullySettled = monthSnapshot.collectionRatio >= 100;
          return (
            <View
              key={monthSnapshot.key}
              style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
            >
              <View style={styles.monthHeader}>
                <View style={styles.monthTitleRow}>
                  <Text style={[styles.monthName, { color: colors.pearl }]}>
                    {monthSnapshot.label}
                  </Text>
                  <View style={[
                    styles.monthBadge,
                    { borderColor: isFullySettled ? colors.success : colors.inflow }
                  ]}>
                    <Text style={[
                      styles.monthBadgeText,
                      { color: isFullySettled ? colors.success : colors.champagne }
                    ]}>
                      {isFullySettled ? "Settled" : "In-flow"}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.taskCountNote, { color: colors.mutedForeground }]}>
                  {monthSnapshot.taskCount} {monthSnapshot.taskCount === 1 ? "task" : "tasks"}
                </Text>
              </View>

              <View style={styles.monthAmounts}>
                <View style={styles.monthAmountItem}>
                  <Text style={[styles.monthAmountLabel, { color: colors.mutedForeground }]}>Billed</Text>
                  <Text style={[styles.monthAmountValue, { color: colors.foreground }]}>
                    {rupeeFormat(monthSnapshot.totalBilled)}
                  </Text>
                </View>
                <View style={styles.monthAmountItem}>
                  <Text style={[styles.monthAmountLabel, { color: colors.mutedForeground }]}>Collected</Text>
                  <Text style={[styles.monthAmountValue, { color: colors.success }]}>
                    {rupeeFormat(monthSnapshot.cashCollected)}
                  </Text>
                </View>
                <View style={styles.monthAmountItem}>
                  <Text style={[styles.monthAmountLabel, { color: colors.mutedForeground }]}>Due</Text>
                  <Text style={[styles.monthAmountValue, { color: colors.champagne }]}>
                    {rupeeFormat(monthSnapshot.totalBilled - monthSnapshot.cashCollected)}
                  </Text>
                </View>
              </View>

              <View style={[styles.goldProgressLine, { backgroundColor: colors.secondary }]}>
                <View
                  style={[
                    styles.goldProgressFill,
                    {
                      width: `${Math.min(monthSnapshot.collectionRatio, 100)}%` as any,
                      backgroundColor: isFullySettled ? colors.success : colors.gold,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  pageHeading: {
    fontSize: 30,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.3,
    marginTop: 8,
  },
  pageSubheading: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.8,
    marginBottom: 20,
    marginTop: 2,
  },
  heroCard: {
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 20,
    paddingLeft: 22,
    gap: 12,
    marginBottom: 28,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroAmount: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  heroDivider: {
    height: 0.5,
  },
  heroStatsRow: {
    flexDirection: "row",
  },
  heroStat: {
    flex: 1,
    gap: 4,
  },
  heroStatDivider: {
    width: 0.5,
    marginHorizontal: 20,
  },
  heroStatLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroStatValue: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
  },
  overallProgressRow: {
    gap: 6,
  },
  overallProgressRail: {
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
  },
  overallProgressFill: {
    height: "100%",
    borderRadius: 1,
  },
  overallRatioText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  monthsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_600SemiBold",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  monthCard: {
    borderWidth: 0.5,
    borderRadius: 6,
    paddingTop: 14,
    paddingBottom: 0,
    paddingHorizontal: 16,
    paddingLeft: 18,
    gap: 10,
    overflow: "hidden",
  },
  monthHeader: {
    gap: 2,
  },
  monthTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  monthBadge: {
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  monthBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  taskCountNote: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  monthAmounts: {
    flexDirection: "row",
    gap: 0,
    paddingBottom: 12,
  },
  monthAmountItem: {
    flex: 1,
    gap: 3,
  },
  monthAmountLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  monthAmountValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  goldProgressLine: {
    height: 2,
    marginHorizontal: -18,
    overflow: "hidden",
  },
  goldProgressFill: {
    height: "100%",
  },
});
