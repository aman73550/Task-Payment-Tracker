import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type Udhaar, type TransactionEntry, useUdhaar } from "@/context/UdhaarContext";
import { useColors } from "@/hooks/useColors";

const GOLD = "#D4AF37";
const PEARL = "#F4F4F4";

interface Props {
  entry: Udhaar | null;
  visible: boolean;
  onClose: () => void;
}

type ActionMode = null | "add" | "reduce";

function rupee(v: number) {
  return `₹${Math.abs(v).toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

function TransactionRow({ tx }: { tx: TransactionEntry }) {
  const isAdd = tx.type === "Initial" || tx.type === "Add";
  const color = isAdd ? GOLD : PEARL;
  const typeLabel = tx.type === "Initial" ? "Lent/Borrowed" : tx.type === "Add" ? "Added" : "Received";
  return (
    <View style={styles.txRow}>
      <View style={[styles.txDot, { backgroundColor: color + "30", borderColor: color + "60" }]}>
        <Feather name={isAdd ? "arrow-up-right" : "arrow-down-left"} size={10} color={color} strokeWidth={1.5} />
      </View>
      <View style={styles.txContent}>
        <View style={styles.txTopRow}>
          <Text style={[styles.txType, { color }]}>{typeLabel}</Text>
          <Text style={[styles.txAmount, { color }]}>{isAdd ? "+" : "-"}{rupee(tx.amount)}</Text>
        </View>
        <Text style={styles.txNote} numberOfLines={2}>{tx.note}</Text>
        <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
      </View>
    </View>
  );
}

export default function UdhaarLedgerModal({ entry, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction, markFullySettled } = useUdhaar();

  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const balance = entry ? entry.amount - entry.settled_amount : 0;
  const isLent = entry?.type === "Lent";

  const resetAction = () => { setActionMode(null); setAmount(""); setNote(""); };

  const handleTransaction = async () => {
    if (!entry || !actionMode) return;
    const num = parseInt(amount.replace(/,/g, ""), 10);
    if (!num || num <= 0) return;
    if (!note.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await addTransaction(entry.id, actionMode === "add" ? "Add" : "Reduce", num, note.trim());
      resetAction();
    } finally {
      setSaving(false);
    }
  };

  const handleFullSettle = async () => {
    if (!entry) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      await markFullySettled(entry.id);
    } finally {
      setSaving(false);
    }
  };

  if (!entry) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>{entry.person_name}</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {entry.type === "Lent" ? "Aapne diya tha" : "Aapne liya tha"}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} strokeWidth={1.5} />
            </Pressable>
          </View>

          <View style={[styles.summaryBox, { backgroundColor: GOLD + "10", borderColor: GOLD + "30" }]}>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
              {"Total dealing with "}
              <Text style={{ color: GOLD, fontFamily: "Satoshi-Bold" }}>{entry.person_name}</Text>
              {" is "}
              <Text style={{ color: GOLD, fontFamily: "Satoshi-Bold" }}>{rupee(entry.amount)}</Text>
              {". So far "}
              <Text style={{ color: PEARL, fontFamily: "Satoshi-Bold" }}>{rupee(entry.settled_amount)}</Text>
              {" has been settled. Balance: "}
              <Text style={{ color: balance > 0 ? GOLD : "#4CAF84", fontFamily: "Satoshi-Bold" }}>{rupee(balance)}</Text>
              {"."}
            </Text>
          </View>

          <ScrollView style={styles.ledger} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Transaction History</Text>
            {(entry.history as TransactionEntry[]).map((tx, i) => (
              <View key={i}>
                <TransactionRow tx={tx} />
                {i < entry.history.length - 1 && (
                  <View style={[styles.txSeparator, { backgroundColor: GOLD + "20" }]} />
                )}
              </View>
            ))}
            {entry.history.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions yet.</Text>
            )}
          </ScrollView>

          {actionMode ? (
            <View style={[styles.actionPanel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                {actionMode === "add" ? "Add to Amount" : "Record Payment"}
              </Text>
              <View style={[styles.actionInput, { borderColor: GOLD + "60" }]}>
                <Text style={[styles.rupeePrefix, { color: GOLD }]}>₹</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.foreground }]}
                  placeholder="Amount"
                  placeholderTextColor={colors.mutedForeground}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="number-pad"
                  autoFocus
                />
              </View>
              <View style={[styles.noteInputBox, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.noteInput, { color: colors.foreground }]}
                  placeholder={actionMode === "add" ? "Reason (e.g. Extra material cost)" : "Remark (e.g. Cash received)"}
                  placeholderTextColor={colors.mutedForeground}
                  value={note}
                  onChangeText={setNote}
                  returnKeyType="done"
                />
              </View>
              <View style={styles.actionBtns}>
                <Pressable onPress={resetAction} style={[styles.cancelActionBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.cancelActionText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleTransaction}
                  disabled={saving || !amount || !note}
                  style={[styles.confirmActionBtn, { backgroundColor: GOLD, opacity: saving || !amount || !note ? 0.6 : 1 }]}
                >
                  {saving ? <ActivityIndicator color="#000" size="small" /> : (
                    <Text style={styles.confirmActionText}>Confirm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={[styles.bottomBtns, { borderTopColor: colors.border }]}>
              {entry.status === "Active" && (
                <>
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); setActionMode("add"); }}
                    style={({ pressed }) => [styles.ledgerBtn, { borderColor: GOLD, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Feather name="plus" size={14} color={GOLD} strokeWidth={1.5} />
                    <Text style={[styles.ledgerBtnText, { color: GOLD }]}>Add More</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); setActionMode("reduce"); }}
                    style={({ pressed }) => [styles.ledgerBtn, { borderColor: PEARL, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Feather name="minus" size={14} color={PEARL} strokeWidth={1.5} />
                    <Text style={[styles.ledgerBtnText, { color: PEARL }]}>Settle Part</Text>
                  </Pressable>
                  {balance > 0 && (
                    <Pressable
                      onPress={handleFullSettle}
                      disabled={saving}
                      style={({ pressed }) => [styles.settleAllBtn, { backgroundColor: "#4CAF84" + "20", borderColor: "#4CAF84", opacity: pressed ? 0.7 : 1 }]}
                    >
                      {saving ? <ActivityIndicator color="#4CAF84" size="small" /> : (
                        <Feather name="check" size={14} color="#4CAF84" strokeWidth={2} />
                      )}
                    </Pressable>
                  )}
                </>
              )}
              {entry.status === "Settled" && (
                <View style={[styles.settledBadge, { backgroundColor: "#4CAF84" + "15" }]}>
                  <Feather name="check-circle" size={14} color="#4CAF84" strokeWidth={1.5} />
                  <Text style={[styles.settledText, { color: "#4CAF84" }]}>Fully Settled</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 22, fontFamily: "Satoshi-Black" },
  subtitle: { fontSize: 12, fontFamily: "Satoshi-Regular", marginTop: 2 },
  summaryBox: { marginHorizontal: 20, marginTop: 16, borderRadius: 10, padding: 14, borderWidth: 0.5 },
  summaryText: { fontSize: 13, fontFamily: "Satoshi-Regular", lineHeight: 20 },
  ledger: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: { fontSize: 10, fontFamily: "Satoshi-Medium", letterSpacing: 0.8, marginBottom: 14 },
  txRow: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  txDot: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 0.5,
    alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  txContent: { flex: 1, gap: 3 },
  txTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txType: { fontSize: 12, fontFamily: "Satoshi-Medium" },
  txAmount: { fontSize: 15, fontFamily: "Satoshi-Bold" },
  txNote: { fontSize: 12, fontFamily: "Satoshi-Regular", color: "#6B6254" },
  txDate: { fontSize: 10, fontFamily: "Satoshi-Regular", color: "#4A4040" },
  txSeparator: { height: 0.5, marginLeft: 38 },
  emptyText: { textAlign: "center", fontSize: 13, fontFamily: "Satoshi-Regular", paddingTop: 20 },
  bottomBtns: {
    flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 16,
    borderTopWidth: 0.5, alignItems: "center",
  },
  ledgerBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1.5, borderRadius: 10, height: 44,
  },
  ledgerBtnText: { fontSize: 13, fontFamily: "Satoshi-Medium" },
  settleAllBtn: {
    width: 44, height: 44, borderRadius: 10, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  settledBadge: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 10, height: 44,
  },
  settledText: { fontSize: 13, fontFamily: "Satoshi-Medium" },
  actionPanel: {
    paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0.5, gap: 12,
  },
  actionTitle: { fontSize: 15, fontFamily: "Satoshi-Bold" },
  actionInput: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48,
  },
  rupeePrefix: { fontSize: 18, fontFamily: "Satoshi-Bold" },
  amountInput: { flex: 1, fontSize: 18, fontFamily: "Satoshi-Bold", padding: 0 },
  noteInputBox: { borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 14, height: 44, justifyContent: "center" },
  noteInput: { fontSize: 13, fontFamily: "Satoshi-Regular", padding: 0 },
  actionBtns: { flexDirection: "row", gap: 10 },
  cancelActionBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 0.5, alignItems: "center", justifyContent: "center" },
  cancelActionText: { fontSize: 14, fontFamily: "Satoshi-Medium" },
  confirmActionBtn: { flex: 2, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  confirmActionText: { color: "#000", fontSize: 14, fontFamily: "Satoshi-Bold" },
});
