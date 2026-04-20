import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Udhaar } from "@/context/UdhaarContext";
import { useColors } from "@/hooks/useColors";

const LENT_GOLD = "#D4AF37";
const BORROWED_GREY = "#A3A3A3";

interface PartialSettleModalProps {
  visible: boolean;
  entry: Udhaar | null;
  onClose: () => void;
  onSettle: (amount: number, note: string) => void;
  onFullSettle: () => void;
}

function rupeeFormat(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function PartialSettleModal({
  visible,
  entry,
  onClose,
  onSettle,
  onFullSettle,
}: PartialSettleModalProps) {
  const colors = useColors();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const remaining = entry ? entry.amount - entry.settled_amount : 0;
  const parsedAmount = parseFloat(amount) || 0;
  const canSettle = parsedAmount > 0 && parsedAmount <= remaining;
  const accentColor = entry?.type === "Lent" ? LENT_GOLD : BORROWED_GREY;

  const handleClose = () => {
    setAmount("");
    setNote("");
    onClose();
  };

  const handlePartial = () => {
    if (!canSettle) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSettle(parsedAmount, note.trim() || "Partial settlement");
    setAmount("");
    setNote("");
    onClose();
  };

  const handleFull = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onFullSettle();
    onClose();
  };

  if (!entry) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetName, { color: colors.pearl }]}>
                  {entry.person_name}
                </Text>
                <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                  {entry.type === "Lent" ? "You lent · collecting" : "You borrowed · paying back"}
                </Text>
              </View>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Feather name="x" size={18} color={colors.mutedForeground} strokeWidth={1.5} />
              </Pressable>
            </View>

            <View style={[styles.amountBadge, { backgroundColor: accentColor + "14", borderColor: accentColor + "40" }]}>
              <Text style={[styles.amountBadgeLabel, { color: colors.mutedForeground }]}>Remaining</Text>
              <Text style={[styles.amountBadgeValue, { color: accentColor }]}>
                {rupeeFormat(remaining)}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>AMOUNT (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.pearl, borderColor: colors.goldBorder }]}
                placeholder={`Max ${rupeeFormat(remaining)}`}
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>NOTE (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.pearl, borderColor: colors.goldBorder }]}
                placeholder="e.g. Paid via UPI"
                placeholderTextColor={colors.mutedForeground}
                value={note}
                onChangeText={setNote}
              />
            </View>

            <View style={styles.btnRow}>
              <Pressable
                onPress={handleFull}
                style={({ pressed }) => [
                  styles.fullBtn,
                  { borderColor: colors.success, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="check-circle" size={14} color={colors.success} strokeWidth={1.5} />
                <Text style={[styles.fullBtnLabel, { color: colors.success }]}>Mark Fully Settled</Text>
              </Pressable>

              <Pressable
                onPress={handlePartial}
                disabled={!canSettle}
                style={({ pressed }) => [
                  styles.partialBtn,
                  {
                    backgroundColor: canSettle ? accentColor : colors.secondary,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={[styles.partialBtnLabel, { color: canSettle ? "#FFFFFF" : colors.mutedForeground }]}>
                  Record Payment
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  kav: { width: "100%" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 0.5,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C8C4BE",
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sheetName: { fontSize: 18, fontFamily: "Satoshi-Bold" },
  sheetSub: { fontSize: 12, fontFamily: "Satoshi-Regular", marginTop: 2 },
  amountBadge: {
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountBadgeLabel: { fontSize: 11, fontFamily: "Satoshi-Medium" },
  amountBadgeValue: { fontSize: 22, fontFamily: "Satoshi-Bold" },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 9, fontFamily: "Satoshi-Bold", letterSpacing: 1.5 },
  input: {
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Satoshi-Regular",
  },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  fullBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  fullBtnLabel: { fontSize: 12, fontFamily: "Satoshi-Bold" },
  partialBtn: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 13,
  },
  partialBtnLabel: { fontSize: 13, fontFamily: "Satoshi-Bold" },
});
