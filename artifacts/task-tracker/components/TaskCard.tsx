import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Task, useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";
import {
  deadlineAccentColor,
  getDeadlineState,
  humanDeadline,
} from "@/utils/deadline";

function rupeeFormat(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulsingDot,
        { backgroundColor: color, transform: [{ scale }], opacity },
      ]}
    />
  );
}

export default function TaskCard({ task }: { task: Task }) {
  const colors = useColors();
  const { updateTask } = useTasks();

  const outstandingDue = task.total_amount - task.paid_amount;
  const collectionRatio =
    task.total_amount > 0 ? (task.paid_amount / task.total_amount) * 100 : 0;

  const deadlineState = getDeadlineState(task.deadline_at);
  const isOverdue = deadlineState === "overdue" && !task.work_done;
  const isUrgent = deadlineState === "urgent" && !task.work_done;
  const deadlineColor = deadlineAccentColor(deadlineState);

  const toggleWorkDone = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nowDone = !task.work_done;
    await updateTask(
      task.id,
      { work_done: nowDone, status: nowDone ? "Completed" : "In Progress" },
      {
        date: new Date().toISOString(),
        note: nowDone ? "Task marked as done" : "Task reopened",
      }
    );
  };

  const togglePaymentReceived = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nowPaid = !task.payment_received;
    await updateTask(
      task.id,
      {
        payment_received: nowPaid,
        paid_amount: nowPaid ? task.total_amount : task.paid_amount,
      },
      {
        date: new Date().toISOString(),
        note: nowPaid
          ? `Full payment received — ${rupeeFormat(task.total_amount)}`
          : "Payment marked as pending",
      }
    );
  };

  const onWhatsAppShare = () => {
    const shareText = `Task: ${task.task_name} | Work: ${task.work_done ? "Done" : "Active"} | Payment: ${task.payment_received ? "Received" : "Pending"} | Total: ${rupeeFormat(task.total_amount)} | Due: ${rupeeFormat(outstandingDue)}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
  };

  const thumbnailUri = task.image_uris?.[0];

  const leftBorderColor = isOverdue
    ? colors.warning
    : task.work_done
    ? colors.success
    : task.payment_received
    ? colors.champagne
    : colors.mutedForeground;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.goldBorder,
          borderLeftColor: leftBorderColor,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={() => router.push(`/task/${task.id}`)}
    >
      {isUrgent && !isOverdue && (
        <View style={styles.pulsingDotWrap}>
          <PulsingDot color={colors.gold} />
        </View>
      )}

      <View style={styles.topRow}>
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={[styles.slipThumb, { borderColor: colors.border }]}
          />
        ) : (
          <View style={[styles.slipThumb, styles.slipPlaceholder, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="file-text" size={17} color={colors.mutedForeground} strokeWidth={1.5} />
          </View>
        )}

        <View style={styles.taskMeta}>
          <Text style={[styles.taskTitle, { color: colors.pearl }]} numberOfLines={1}>
            {task.task_name}
          </Text>
          <View style={styles.amountsRow}>
            <Text style={[styles.amountNote, { color: colors.mutedForeground }]}>
              Billed{" "}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
                {rupeeFormat(task.total_amount)}
              </Text>
            </Text>
            {isOverdue && (
              <Text style={[styles.amountNote, { color: colors.warning, fontFamily: "Inter_600SemiBold" }]}>
                Overdue
              </Text>
            )}
            {!isOverdue && outstandingDue > 0 && !task.payment_received && (
              <Text style={[styles.amountNote, { color: colors.champagne }]}>
                Due {rupeeFormat(outstandingDue)}
              </Text>
            )}
          </View>

          {task.deadline_at && !task.work_done && (
            <View style={styles.deadlineRow}>
              <Feather name="clock" size={10} color={deadlineColor} strokeWidth={1.5} />
              <Text style={[styles.deadlineLabel, { color: deadlineColor }]}>
                {humanDeadline(task.deadline_at)}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={onWhatsAppShare}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Feather name="share-2" size={14} color="#25D366" strokeWidth={1.5} />
        </Pressable>
      </View>

      <View style={[styles.progressRail, { backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(collectionRatio, 100)}%` as any,
              backgroundColor: task.payment_received ? colors.success : colors.gold,
            },
          ]}
        />
      </View>

      <View style={styles.dualButtonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.dualBtn,
            {
              backgroundColor: task.work_done ? colors.gold : "transparent",
              borderColor: task.work_done ? colors.gold : colors.goldBorder,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
          onPress={toggleWorkDone}
        >
          <Feather
            name={task.work_done ? "check-circle" : "circle"}
            size={13}
            color={task.work_done ? colors.primaryForeground : colors.pearl}
            strokeWidth={1.5}
          />
          <Text
            style={[
              styles.dualBtnLabel,
              { color: task.work_done ? colors.primaryForeground : colors.pearl },
            ]}
          >
            {task.work_done ? "Task Done" : "In Progress"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.dualBtn,
            {
              backgroundColor: task.payment_received ? colors.success + "22" : "transparent",
              borderColor: task.payment_received ? colors.success : colors.goldBorder,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
          onPress={togglePaymentReceived}
        >
          <Feather
            name={task.payment_received ? "check-circle" : "clock"}
            size={13}
            color={task.payment_received ? colors.success : colors.champagne}
            strokeWidth={1.5}
          />
          <Text
            style={[
              styles.dualBtnLabel,
              { color: task.payment_received ? colors.success : colors.champagne },
            ]}
          >
            {task.payment_received ? "Paid" : "Awaiting Payment"}
          </Text>
        </Pressable>
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
    position: "relative",
    overflow: "hidden",
  },
  pulsingDotWrap: {
    position: "absolute",
    top: 10,
    right: 38,
    zIndex: 10,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  slipThumb: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  slipPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  taskMeta: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  amountsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  amountNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deadlineLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  progressRail: {
    height: 1.5,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1,
  },
  dualButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  dualBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 0.5,
    borderRadius: 5,
    paddingVertical: 8,
  },
  dualBtnLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
