import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddTaskModal from "@/components/AddTaskModal";
import BulkAddModal from "@/components/BulkAddModal";
import SummaryHeader from "@/components/SummaryHeader";
import TaskCard from "@/components/TaskCard";
import { useTasks } from "@/context/TasksContext";
import { useDeadlineNotifications } from "@/hooks/useDeadlineNotifications";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const { tasks, loading, addTask, bulkAddTasks } = useTasks();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);

  useDeadlineNotifications(tasks);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 84;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const toggleFab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFabExpanded((v) => !v);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TaskCard task={item} />}
        ListHeaderComponent={<SummaryHeader tasks={tasks} />}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Feather name="inbox" size={44} color={colors.border} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              Nothing here yet
            </Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>
              Tap + to log your first task
            </Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: topPad, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {fabExpanded && (
        <View style={[styles.fabMenu, { bottom: bottomPad + 72 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.fabMenuItem,
              { backgroundColor: colors.card, borderColor: colors.goldBorder, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            onPress={() => {
              setFabExpanded(false);
              setShowBulk(true);
            }}
          >
            <Feather name="layers" size={15} color={colors.champagne} strokeWidth={1.5} />
            <Text style={[styles.fabMenuLabel, { color: colors.pearl }]}>Add Multiple</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.fabMenuItem,
              { backgroundColor: colors.card, borderColor: colors.goldBorder, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            onPress={() => {
              setFabExpanded(false);
              setShowAdd(true);
            }}
          >
            <Feather name="plus-circle" size={15} color={colors.gold} strokeWidth={1.5} />
            <Text style={[styles.fabMenuLabel, { color: colors.pearl }]}>Add Single</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: fabExpanded ? colors.secondary : colors.gold,
            borderColor: colors.gold,
            bottom: bottomPad + 16,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        onPress={toggleFab}
      >
        <Feather
          name={fabExpanded ? "x" : "plus"}
          size={26}
          color={fabExpanded ? colors.gold : colors.primaryForeground}
          strokeWidth={1.5}
        />
      </Pressable>

      <AddTaskModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addTask}
      />
      <BulkAddModal
        visible={showBulk}
        onClose={() => setShowBulk(false)}
        onSaveAll={bulkAddTasks}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyView: {
    alignItems: "center",
    paddingTop: 70,
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
  fabMenu: {
    position: "absolute",
    right: 18,
    gap: 8,
  },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  fabMenuLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
