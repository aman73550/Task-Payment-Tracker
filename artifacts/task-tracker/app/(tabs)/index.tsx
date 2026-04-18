import { Feather } from "@expo/vector-icons";
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
import SummaryHeader from "@/components/SummaryHeader";
import TaskCard from "@/components/TaskCard";
import { useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const { tasks, loading, addTask } = useTasks();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 84;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TaskCard task={item} />}
        ListHeaderComponent={<SummaryHeader tasks={tasks} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              No tasks yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.border }]}>
              Tap + to add your first task
            </Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: topPad, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.gold,
            bottom: bottomPad + 16,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={() => setShowAdd(true)}
      >
        <Feather name="plus" size={28} color={colors.primaryForeground} />
      </Pressable>

      <AddTaskModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addTask}
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
    paddingTop: 0,
    gap: 0,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
