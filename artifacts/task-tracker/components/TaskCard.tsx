import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Task, TaskStatus } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

function getStatusColor(status: TaskStatus, gold: string, muted: string, success: string) {
  if (status === "Completed") return success;
  if (status === "In Progress") return gold;
  return muted;
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function TaskCard({ task }: { task: Task }) {
  const colors = useColors();
  const remaining = task.total_amount - task.paid_amount;
  const progress = task.total_amount > 0 ? (task.paid_amount / task.total_amount) * 100 : 0;
  const statusColor = getStatusColor(
    task.status,
    colors.gold,
    colors.mutedForeground,
    colors.success
  );

  const handleWhatsApp = () => {
    const message = `Task: ${task.task_name} | Status: ${task.status} | Total: ${formatCurrency(task.total_amount)} | Paid: ${formatCurrency(task.paid_amount)} | Pending: ${formatCurrency(remaining)}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderLeftColor: statusColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={() => router.push(`/task/${task.id}`)}
    >
      <View style={styles.row}>
        {task.image_uri ? (
          <Image source={{ uri: task.image_uri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.noImage, { backgroundColor: colors.secondary }]}>
            <Feather name="file-text" size={20} color={colors.mutedForeground} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.taskName, { color: colors.foreground }]} numberOfLines={1}>
            {task.task_name}
          </Text>
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Total </Text>
            <Text style={[styles.amount, { color: colors.foreground }]}>
              {formatCurrency(task.total_amount)}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Pending </Text>
            <Text style={[styles.pendingAmount, { color: remaining > 0 ? colors.gold : colors.success }]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
        </View>

        <View style={styles.rightSide}>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{task.status}</Text>
          </View>
          <Pressable
            onPress={handleWhatsApp}
            style={({ pressed }) => [
              styles.waButton,
              { backgroundColor: pressed ? "#128C7E33" : "transparent" },
            ]}
          >
            <Feather name="share-2" size={15} color="#25D366" />
          </Pressable>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBg, { backgroundColor: colors.secondary }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress, 100)}%` as any,
                backgroundColor: progress >= 100 ? colors.success : colors.gold,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
          {Math.round(progress)}%
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    borderLeftWidth: 2,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 4,
  },
  noImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  taskName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  amount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  pendingAmount: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  rightSide: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  waButton: {
    borderRadius: 4,
    padding: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    width: 30,
    textAlign: "right",
  },
});
