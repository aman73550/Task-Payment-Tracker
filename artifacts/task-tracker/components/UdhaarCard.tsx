import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { memo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Udhaar } from "@/context/UdhaarContext";
import { useColors } from "@/hooks/useColors";

const LENT_GOLD = "#D4AF37";
const BORROWED_GREY = "#A3A3A3";

function rupeeFormat(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

interface UdhaarCardProps {
  entry: Udhaar;
  onSettle: (entry: Udhaar) => void;
  onDelete: (id: string) => void;
}

function UdhaarCard({ entry, onSettle, onDelete }: UdhaarCardProps) {
  const colors = useColors();
  const isLent = entry.type === "Lent";
  const accentColor = isLent ? LENT_GOLD : BORROWED_GREY;
  const remaining = entry.amount - entry.settled_amount;
  const progress = entry.amount > 0 ? (entry.settled_amount / entry.amount) * 100 : 0;
  const isOverdue = entry.due_date && new Date(entry.due_date) < new Date() && entry.status === "Active";

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete entry?",
      `Remove "${entry.person_name}" from Udhaar?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(entry.id),
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.goldBorder,
          borderLeftColor: entry.status === "Settled" ? colors.success : accentColor,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: accentColor + "16" }]}>
          <Feather
            name={isLent ? "arrow-up-right" : "arrow-down-left"}
            size={16}
            color={accentColor}
            strokeWidth={1.5}
          />
        </View>

        <View style={styles.meta}>
          <Text style={[styles.personName, { color: colors.pearl }]}>{entry.person_name}</Text>
          <Text style={[styles.typeTag, { color: accentColor }]}>
            {isLent ? "You lent" : "You borrowed"}
          </Text>
        </View>

        <View style={styles.amountBlock}>
          <Text style={[styles.amount, { color: entry.status === "Settled" ? colors.success : accentColor }]}>
            {rupeeFormat(entry.amount)}
          </Text>
          {entry.settled_amount > 0 && entry.status === "Active" && (
            <Text style={[styles.remainingText, { color: colors.mutedForeground }]}>
              {rupeeFormat(remaining)} left
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleDelete}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, paddingLeft: 8 })}
        >
          <Feather name="trash-2" size={14} color={colors.destructive} strokeWidth={1.5} />
        </Pressable>
      </View>

      {entry.due_date && entry.status === "Active" && (
        <View style={styles.dueDateRow}>
          <Feather
            name="clock"
            size={10}
            color={isOverdue ? colors.warning : colors.mutedForeground}
            strokeWidth={1.5}
          />
          <Text style={[styles.dueDateText, { color: isOverdue ? colors.warning : colors.mutedForeground }]}>
            {relativeDate(entry.due_date)}
          </Text>
        </View>
      )}

      {entry.status === "Active" && (
        <>
          <View style={[styles.progressRail, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress, 100)}%` as any, backgroundColor: accentColor },
              ]}
            />
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSettle(entry);
            }}
            style={({ pressed }) => [
              styles.settleBtn,
              {
                borderColor: accentColor,
                backgroundColor: accentColor + "10",
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Feather name="check" size={13} color={accentColor} strokeWidth={1.5} />
            <Text style={[styles.settleBtnLabel, { color: accentColor }]}>
              {entry.settled_amount > 0 ? "Record More / Settle" : "Record Settlement"}
            </Text>
          </Pressable>
        </>
      )}

      {entry.status === "Settled" && (
        <View style={[styles.settledBadge, { backgroundColor: colors.success + "12", borderColor: colors.success + "40" }]}>
          <Feather name="check-circle" size={11} color={colors.success} strokeWidth={1.5} />
          <Text style={[styles.settledBadgeText, { color: colors.success }]}>Fully Settled</Text>
        </View>
      )}
    </View>
  );
}

export default memo(UdhaarCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 0.5,
    borderLeftWidth: 2.5,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { flex: 1, gap: 2 },
  personName: { fontSize: 15, fontFamily: "Satoshi-Bold" },
  typeTag: { fontSize: 11, fontFamily: "Satoshi-Medium" },
  amountBlock: { alignItems: "flex-end", gap: 2 },
  amount: { fontSize: 17, fontFamily: "Satoshi-Bold" },
  remainingText: { fontSize: 10, fontFamily: "Satoshi-Regular" },
  dueDateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dueDateText: { fontSize: 11, fontFamily: "Satoshi-Medium" },
  progressRail: { height: 2, borderRadius: 1, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 1 },
  settleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingVertical: 9,
  },
  settleBtnLabel: { fontSize: 12, fontFamily: "Satoshi-Bold" },
  settledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  settledBadgeText: { fontSize: 11, fontFamily: "Satoshi-Medium" },
});
