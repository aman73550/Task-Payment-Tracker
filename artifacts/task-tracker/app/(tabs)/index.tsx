import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddTaskModal from "@/components/AddTaskModal";
import AnimatedListItem from "@/components/AnimatedListItem";
import BulkAddModal from "@/components/BulkAddModal";
import SummaryHeader from "@/components/SummaryHeader";
import TaskCard from "@/components/TaskCard";
import { Task, useTasks } from "@/context/TasksContext";
import { useDeadlineNotifications } from "@/hooks/useDeadlineNotifications";
import { useColors } from "@/hooks/useColors";
import { getDeadlineState } from "@/utils/deadline";

type FilterTab = "All" | "Pending" | "In Progress" | "Completed" | "Overdue";
const FILTER_TABS: FilterTab[] = ["All", "Pending", "In Progress", "Completed", "Overdue"];

function applyFilters(tasks: Task[], filter: FilterTab, query: string): Task[] {
  let result = tasks;
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter((t) => t.task_name.toLowerCase().includes(q));
  }
  if (filter === "Overdue") {
    result = result.filter((t) => t.deadline_at && getDeadlineState(t.deadline_at) === "overdue" && t.status !== "Completed");
  } else if (filter !== "All") {
    result = result.filter((t) => t.status === filter);
  }
  return result;
}

export default function HomeScreen() {
  const colors = useColors();
  const { tasks, loading, addTask, bulkAddTasks } = useTasks();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const fabRotation = useSharedValue(0);
  const fabScale = useSharedValue(1);

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }],
  }));

  const fabBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  useDeadlineNotifications(tasks);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 84;

  const filtered = useMemo(() => applyFilters(tasks, filter, search), [tasks, filter, search]);

  const overdueCount = useMemo(
    () => tasks.filter((t) => t.deadline_at && getDeadlineState(t.deadline_at) === "overdue" && t.status !== "Completed").length,
    [tasks]
  );

  const selectFilter = (f: FilterTab) => {
    Haptics.selectionAsync();
    setFilter(f);
    setFabExpanded(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const toggleFab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !fabExpanded;
    setFabExpanded(next);
    fabRotation.value = withSpring(next ? 45 : 0, { damping: 14, stiffness: 180 });
    fabScale.value = withSpring(0.88, { damping: 10 });
    setTimeout(() => { fabScale.value = withSpring(1, { damping: 12 }); }, 80);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <TaskCard task={item} />
          </AnimatedListItem>
        )}
        ListHeaderComponent={
          <View>
            <SummaryHeader tasks={tasks} />
            <View style={[styles.toolbar, { borderBottomColor: colors.goldBorder }]}>
              {showSearch ? (
                <View style={styles.searchRow}>
                  <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
                    <Feather name="search" size={14} color={colors.mutedForeground} strokeWidth={1.5} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.pearl }]}
                      placeholder="Search tasks..."
                      placeholderTextColor={colors.mutedForeground}
                      value={search}
                      onChangeText={setSearch}
                      autoFocus
                      returnKeyType="search"
                    />
                    {search.length > 0 && (
                      <Pressable onPress={() => setSearch("")} hitSlop={8}>
                        <Feather name="x" size={13} color={colors.mutedForeground} strokeWidth={1.5} />
                      </Pressable>
                    )}
                  </View>
                  <Pressable
                    onPress={() => { setShowSearch(false); setSearch(""); }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    hitSlop={8}
                  >
                    <Text style={[styles.cancelSearch, { color: colors.mutedForeground }]}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.filterRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {FILTER_TABS.map((tab) => {
                      const isActive = filter === tab;
                      const isOverdueTab = tab === "Overdue";
                      return (
                        <Pressable
                          key={tab}
                          onPress={() => selectFilter(tab)}
                          style={({ pressed }) => [
                            styles.filterChip,
                            {
                              backgroundColor: isActive
                                ? isOverdueTab ? colors.warning : colors.gold
                                : colors.card,
                              borderColor: isActive
                                ? isOverdueTab ? colors.warning : colors.gold
                                : colors.goldBorder,
                              transform: [{ scale: pressed ? 0.95 : 1 }],
                            },
                          ]}
                        >
                          <Text style={[
                            styles.filterChipText,
                            { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                          ]}>
                            {tab}
                          </Text>
                          {tab === "Overdue" && overdueCount > 0 && (
                            <View style={[styles.overdueCount, { backgroundColor: colors.warning }]}>
                              <Text style={styles.overdueCountText}>{overdueCount}</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Pressable
                    onPress={() => { setShowSearch(true); setFabExpanded(false); }}
                    style={({ pressed }) => [
                      styles.searchIcon,
                      { backgroundColor: colors.card, borderColor: colors.goldBorder, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Feather name="search" size={15} color={colors.mutedForeground} strokeWidth={1.5} />
                  </Pressable>
                </View>
              )}
            </View>

            {filter !== "All" || search ? (
              <View style={styles.resultCount}>
                <Text style={[styles.resultCountText, { color: colors.mutedForeground }]}>
                  {filtered.length} {filtered.length === 1 ? "task" : "tasks"}
                  {filter !== "All" ? ` · ${filter}` : ""}
                  {search ? ` · "${search}"` : ""}
                </Text>
                <Pressable
                  onPress={() => { setFilter("All"); setSearch(""); setShowSearch(false); }}
                  hitSlop={8}
                >
                  <Text style={[styles.clearFilters, { color: colors.gold }]}>Clear</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Feather name="inbox" size={44} color={colors.border} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              {search || filter !== "All" ? "No matching tasks" : "Nothing here yet"}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>
              {search || filter !== "All" ? "Try a different filter" : "Tap + to log your first task"}
            </Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: topPad, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
      />

      {fabExpanded && (
        <View style={[styles.fabMenu, { bottom: bottomPad + 72 }]}>
          <Animated.View entering={FadeInRight.delay(40).duration(220).springify()}>
            <Pressable
              style={({ pressed }) => [
                styles.fabMenuItem,
                { backgroundColor: colors.card, borderColor: colors.goldBorder, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              onPress={() => { setFabExpanded(false); fabRotation.value = withSpring(0); setShowBulk(true); }}
            >
              <Feather name="layers" size={15} color={colors.champagne} strokeWidth={1.5} />
              <Text style={[styles.fabMenuLabel, { color: colors.pearl }]}>Add Multiple</Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(0).duration(200).springify()}>
            <Pressable
              style={({ pressed }) => [
                styles.fabMenuItem,
                { backgroundColor: colors.card, borderColor: colors.goldBorder, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              onPress={() => { setFabExpanded(false); fabRotation.value = withSpring(0); setShowAdd(true); }}
            >
              <Feather name="plus-circle" size={15} color={colors.gold} strokeWidth={1.5} />
              <Text style={[styles.fabMenuLabel, { color: colors.pearl }]}>Add Single</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      <Animated.View style={[fabBtnStyle, { position: "absolute", right: 18, bottom: bottomPad + 16 }]}>
        <Pressable
          style={[
            styles.fab,
            {
              backgroundColor: fabExpanded ? colors.secondary : colors.gold,
              borderColor: colors.gold,
            },
          ]}
          onPress={toggleFab}
        >
          <Animated.View style={fabIconStyle}>
            <Feather
              name="plus"
              size={26}
              color={fabExpanded ? colors.gold : colors.primaryForeground}
              strokeWidth={1.5}
            />
          </Animated.View>
        </Pressable>
      </Animated.View>

      <AddTaskModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addTask} />
      <BulkAddModal visible={showBulk} onClose={() => setShowBulk(false)} onSaveAll={bulkAddTasks} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16 },
  toolbar: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterScroll: { flex: 1 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 0.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  filterChipText: { fontSize: 12, fontFamily: "Satoshi-Medium" },
  overdueCount: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  overdueCountText: { fontSize: 9, fontFamily: "Satoshi-Bold", color: "#fff" },
  searchIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 0.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Satoshi-Regular",
    padding: 0,
  },
  cancelSearch: { fontSize: 13, fontFamily: "Satoshi-Medium" },
  resultCount: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  resultCountText: { fontSize: 11, fontFamily: "Satoshi-Regular" },
  clearFilters: { fontSize: 11, fontFamily: "Satoshi-Medium" },
  emptyView: { alignItems: "center", paddingTop: 70, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Satoshi-Bold" },
  emptyHint: { fontSize: 13, fontFamily: "Satoshi-Regular" },
  fabMenu: { position: "absolute", right: 18, gap: 8 },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  fabMenuLabel: { fontSize: 13, fontFamily: "Satoshi-Medium" },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
