import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
      registry.set(groupKey, { key: groupKey, label: monthLabel(groupKey), totalBilled: 0, cashCollected: 0, taskCount: 0, collectionRatio: 0 });
    }
    const snapshot = registry.get(groupKey)!;
    snapshot.totalBilled += taskEntry.total_amount;
    snapshot.cashCollected += taskEntry.paid_amount;
    snapshot.taskCount += 1;
  }
  return Array.from(registry.values())
    .map((g) => ({ ...g, collectionRatio: g.totalBilled > 0 ? (g.cashCollected / g.totalBilled) * 100 : 0 }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

function buildTasksCSV(taskList: Task[]): string {
  const headers = ["Task Name", "Person", "Phone", "Status", "Total (₹)", "Paid (₹)", "Pending (₹)", "Work Done", "Date"];
  const rows = taskList.map((t) => [
    `"${t.task_name.replace(/"/g, '""')}"`,
    `"${(t.person_name ?? "").replace(/"/g, '""')}"`,
    t.phone ?? "",
    t.status,
    t.total_amount,
    t.paid_amount,
    t.total_amount - t.paid_amount,
    t.work_done ? "Yes" : "No",
    new Date(t.created_at).toLocaleDateString("en-IN"),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export default function FinanceScreen() {
  const colors = useColors();
  const { tasks } = useTasks();
  const insets = useSafeAreaInsets();
  const [showUnpaid, setShowUnpaid] = useState(true);

  const handleExportCSV = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const csv = buildTasksCSV(tasks);
    if (Platform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        await Share.share({ message: csv, title: "Tasks Export" });
      } catch {
        Alert.alert("Couldn't export", "Try again in a moment.");
      }
    }
  }, [tasks]);

  const netWorth = tasks.reduce((acc, t) => acc + t.total_amount, 0);
  const cashInHand = tasks.reduce((acc, t) => acc + t.paid_amount, 0);
  const outstandingDues = netWorth - cashInHand;
  const overallRatio = netWorth > 0 ? (cashInHand / netWorth) * 100 : 0;

  const monthlyRegistry = useMemo(() => groupByMonth(tasks), [tasks]);

  const unpaidTasks = useMemo(
    () => tasks.filter((t) => t.total_amount - t.paid_amount > 0 && t.status !== "Completed").sort((a, b) => (b.total_amount - b.paid_amount) - (a.total_amount - a.paid_amount)),
    [tasks]
  );

  const bestMonth = useMemo(() => {
    if (monthlyRegistry.length === 0) return null;
    return monthlyRegistry.reduce((best, m) => m.cashCollected > best.cashCollected ? m : best);
  }, [monthlyRegistry]);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 84;

  if (tasks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Feather name="bar-chart-2" size={44} color={colors.border} strokeWidth={1.5} />
        <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No financial data yet</Text>
        <Text style={[styles.emptyHint, { color: colors.border }]}>Add your first task to start tracking</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageHeading, { color: colors.gold }]}>Your Money</Text>
          <Text style={[styles.pageSubheading, { color: colors.mutedForeground }]}>
            a clear picture of what you've earned
          </Text>
        </View>
        <Pressable
          onPress={handleExportCSV}
          style={({ pressed }) => [
            styles.exportBtn,
            {
              backgroundColor: colors.gold + "18",
              borderColor: colors.gold + "50",
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Feather name="download" size={13} color={colors.gold} strokeWidth={1.5} />
          <Text style={[styles.exportBtnLabel, { color: colors.gold }]}>CSV</Text>
        </Pressable>
      </View>

      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
        <View style={styles.heroTop}>
          <Feather name="briefcase" size={16} color={colors.champagne} strokeWidth={1.5} />
          <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>Total work billed</Text>
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
                { width: `${Math.min(overallRatio, 100)}%` as any, backgroundColor: overallRatio >= 100 ? colors.success : colors.gold },
              ]}
            />
          </View>
          <Text style={[styles.overallRatioText, { color: colors.mutedForeground }]}>
            {Math.round(overallRatio)}% collected
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
          <Feather name="layers" size={14} color={colors.mutedForeground} strokeWidth={1.5} />
          <Text style={[styles.statValue, { color: colors.pearl }]}>{tasks.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Tasks</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
          <Feather name="alert-circle" size={14} color={colors.warning} strokeWidth={1.5} />
          <Text style={[styles.statValue, { color: colors.pearl }]}>{unpaidTasks.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Unpaid</Text>
        </View>
        {bestMonth && (
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
            <Feather name="trending-up" size={14} color={colors.success} strokeWidth={1.5} />
            <Text style={[styles.statValue, { color: colors.pearl }]} numberOfLines={1}>
              {bestMonth.label.split(" ")[0]}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Best Month</Text>
          </View>
        )}
      </View>

      {unpaidTasks.length > 0 && (
        <View style={styles.unpaidSection}>
          <Pressable
            onPress={() => setShowUnpaid((v) => !v)}
            style={styles.unpaidHeader}
          >
            <View style={styles.unpaidTitleRow}>
              <Feather name="alert-circle" size={14} color={colors.warning} strokeWidth={1.5} />
              <Text style={[styles.sectionTitle, { color: colors.pearl }]}>Unpaid Tasks</Text>
              <View style={[styles.unpaidBadge, { backgroundColor: colors.warning + "22", borderColor: colors.warning + "50" }]}>
                <Text style={[styles.unpaidBadgeText, { color: colors.warning }]}>{rupeeFormat(outstandingDues)}</Text>
              </View>
            </View>
            <Feather name={showUnpaid ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} strokeWidth={1.5} />
          </Pressable>

          {showUnpaid && (
            <View style={styles.unpaidList}>
              {unpaidTasks.map((t, idx) => {
                const owed = t.total_amount - t.paid_amount;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push(`/task/${t.id}`)}
                    style={({ pressed }) => [
                      styles.unpaidRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.goldBorder,
                        borderTopWidth: idx === 0 ? 0.5 : 0,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={styles.unpaidRowLeft}>
                      <Text style={[styles.unpaidName, { color: colors.pearl }]} numberOfLines={1}>
                        {t.task_name}
                      </Text>
                      <View style={[
                        styles.statusPill,
                        { backgroundColor: t.status === "In Progress" ? colors.gold + "20" : colors.secondary, borderColor: t.status === "In Progress" ? colors.gold + "60" : colors.border }
                      ]}>
                        <Text style={[styles.statusPillText, { color: t.status === "In Progress" ? colors.gold : colors.mutedForeground }]}>
                          {t.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.unpaidRowRight}>
                      <Text style={[styles.unpaidOwed, { color: colors.champagne }]}>{rupeeFormat(owed)}</Text>
                      <Text style={[styles.unpaidOwedLabel, { color: colors.mutedForeground }]}>owed</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.border} strokeWidth={1.5} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

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
                  <Text style={[styles.monthName, { color: colors.pearl }]}>{monthSnapshot.label}</Text>
                  <View style={[styles.monthBadge, { borderColor: isFullySettled ? colors.success : colors.inflow }]}>
                    <Text style={[styles.monthBadgeText, { color: isFullySettled ? colors.success : colors.champagne }]}>
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
                  <Text style={[styles.monthAmountValue, { color: colors.foreground }]}>{rupeeFormat(monthSnapshot.totalBilled)}</Text>
                </View>
                <View style={styles.monthAmountItem}>
                  <Text style={[styles.monthAmountLabel, { color: colors.mutedForeground }]}>Collected</Text>
                  <Text style={[styles.monthAmountValue, { color: colors.success }]}>{rupeeFormat(monthSnapshot.cashCollected)}</Text>
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
                    { width: `${Math.min(monthSnapshot.collectionRatio, 100)}%` as any, backgroundColor: isFullySettled ? colors.success : colors.gold },
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
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  headingRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 0 },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 20,
  },
  exportBtnLabel: { fontSize: 12, fontFamily: "Satoshi-Bold" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Satoshi-Bold" },
  emptyHint: { fontSize: 13, fontFamily: "Satoshi-Regular" },
  pageHeading: { fontSize: 30, fontFamily: "Satoshi-Black", letterSpacing: 0.3, marginTop: 8 },
  pageSubheading: { fontSize: 12, fontFamily: "Satoshi-Regular", letterSpacing: 0.8, marginBottom: 20, marginTop: 2 },
  heroCard: { borderWidth: 0.5, borderRadius: 6, padding: 20, paddingLeft: 22, gap: 12, marginBottom: 16 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroLabel: { fontSize: 11, fontFamily: "Satoshi-Regular", letterSpacing: 1, textTransform: "uppercase" },
  heroAmount: { fontSize: 38, fontFamily: "Satoshi-Bold", letterSpacing: -0.5 },
  heroDivider: { height: 0.5 },
  heroStatsRow: { flexDirection: "row" },
  heroStat: { flex: 1, gap: 4 },
  heroStatDivider: { width: 0.5, marginHorizontal: 20 },
  heroStatLabel: { fontSize: 10, fontFamily: "Satoshi-Regular", letterSpacing: 0.8, textTransform: "uppercase" },
  heroStatValue: { fontSize: 19, fontFamily: "Satoshi-Bold" },
  overallProgressRow: { gap: 6 },
  overallProgressRail: { height: 2, borderRadius: 1, overflow: "hidden" },
  overallProgressFill: { height: "100%", borderRadius: 1 },
  overallRatioText: { fontSize: 10, fontFamily: "Satoshi-Regular", textAlign: "right" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 18, fontFamily: "Satoshi-Bold" },
  statLabel: { fontSize: 9, fontFamily: "Satoshi-Medium", letterSpacing: 0.5, textAlign: "center" },
  unpaidSection: { marginBottom: 24 },
  unpaidHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  unpaidTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  unpaidBadge: {
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unpaidBadgeText: { fontSize: 11, fontFamily: "Satoshi-Bold" },
  unpaidList: { borderWidth: 0.5, borderRadius: 8, overflow: "hidden" },
  unpaidRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  unpaidRowLeft: { flex: 1, gap: 4 },
  unpaidName: { fontSize: 13, fontFamily: "Satoshi-Medium" },
  statusPill: {
    borderWidth: 0.5,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: "flex-start",
  },
  statusPillText: { fontSize: 9, fontFamily: "Satoshi-Medium", letterSpacing: 0.3 },
  unpaidRowRight: { alignItems: "flex-end", gap: 1 },
  unpaidOwed: { fontSize: 15, fontFamily: "Satoshi-Bold" },
  unpaidOwedLabel: { fontSize: 9, fontFamily: "Satoshi-Regular", letterSpacing: 0.3 },
  monthsSection: { gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: "Satoshi-Bold", letterSpacing: 0.3, marginBottom: 4 },
  monthCard: { borderWidth: 0.5, borderRadius: 6, paddingTop: 14, paddingBottom: 0, paddingHorizontal: 16, paddingLeft: 18, gap: 10, overflow: "hidden" },
  monthHeader: { gap: 2 },
  monthTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthName: { fontSize: 15, fontFamily: "Satoshi-Bold" },
  monthBadge: { borderWidth: 0.5, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  monthBadgeText: { fontSize: 9, fontFamily: "Satoshi-Medium", letterSpacing: 0.5 },
  taskCountNote: { fontSize: 10, fontFamily: "Satoshi-Regular" },
  monthAmounts: { flexDirection: "row", gap: 0, paddingBottom: 12 },
  monthAmountItem: { flex: 1, gap: 3 },
  monthAmountLabel: { fontSize: 9, fontFamily: "Satoshi-Regular", letterSpacing: 0.8, textTransform: "uppercase" },
  monthAmountValue: { fontSize: 14, fontFamily: "Satoshi-Bold" },
  goldProgressLine: { height: 2, marginHorizontal: -18, overflow: "hidden" },
  goldProgressFill: { height: "100%" },
});
