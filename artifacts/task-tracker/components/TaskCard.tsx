import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Task, TaskStatus } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

function statusAccent(taskStatus: TaskStatus, colors: ReturnType<typeof useColors>) {
  if (taskStatus === "Completed") return colors.success;
  if (taskStatus === "In Progress") return colors.gold;
  return colors.mutedForeground;
}

function rupeeFormat(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function TaskCard({ task }: { task: Task }) {
  const colors = useColors();
  const outstandingDue = task.total_amount - task.paid_amount;
  const collectionRatio = task.total_amount > 0
    ? (task.paid_amount / task.total_amount) * 100
    : 0;
  const accentColor = statusAccent(task.status, colors);

  const onWhatsAppShare = () => {
    const shareText = `Task: ${task.task_name} | Status: ${task.status} | Total: ${rupeeFormat(task.total_amount)} | Paid: ${rupeeFormat(task.paid_amount)} | Pending: ${rupeeFormat(outstandingDue)}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.goldBorder,
          borderLeftColor: accentColor,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={() => router.push(`/task/${task.id}`)}
    >
      <View style={styles.innerRow}>
        {task.image_uri ? (
          <Image source={{ uri: task.image_uri }} style={[styles.slipThumb, { borderColor: colors.border }]} />
        ) : (
          <View style={[styles.slipThumb, styles.slipPlaceholder, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="file-text" size={18} color={colors.mutedForeground} strokeWidth={1.5} />
          </View>
        )}

        <View style={styles.taskMeta}>
          <Text style={[styles.taskTitle, { color: colors.pearl }]} numberOfLines={1}>
            {task.task_name}
          </Text>

          <View style={styles.amountsRow}>
            <Text style={[styles.amountChip, { color: colors.mutedForeground }]}>
              Billed{" "}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
                {rupeeFormat(task.total_amount)}
              </Text>
            </Text>
            <Text style={[styles.amountChip, { color: outstandingDue > 0 ? colors.champagne : colors.success }]}>
              Due {rupeeFormat(outstandingDue)}
            </Text>
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={[styles.statusPill, { borderColor: accentColor }]}>
            <Text style={[styles.statusLabel, { color: accentColor }]}>{task.status}</Text>
          </View>
          <Pressable
            onPress={onWhatsAppShare}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="share-2" size={14} color="#25D366" strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressRail, { backgroundColor: colors.secondary }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(collectionRatio, 100)}%` as any,
                backgroundColor: collectionRatio >= 100 ? colors.success : colors.gold,
              },
            ]}
          />
        </View>
        <Text style={[styles.ratioLabel, { color: colors.mutedForeground }]}>
          {Math.round(collectionRatio)}%
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 6,
    borderWidth: 0.5,
    borderLeftWidth: 2,
    paddingTop: 14,
    paddingRight: 14,
    paddingBottom: 12,
    paddingLeft: 16,
    marginBottom: 10,
    gap: 10,
  },
  innerRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  slipThumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  slipPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  taskMeta: {
    flex: 1,
    gap: 5,
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
  amountsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  amountChip: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  rightColumn: {
    alignItems: "flex-end",
    gap: 10,
  },
  statusPill: {
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  progressTrack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressRail: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1,
  },
  ratioLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    width: 28,
    textAlign: "right",
  },
});
