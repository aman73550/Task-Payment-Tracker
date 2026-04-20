import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
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

import DeadlinePicker from "@/components/DeadlinePicker";
import { UdhaarType } from "@/context/UdhaarContext";
import { useColors } from "@/hooks/useColors";

interface AddUdhaarModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (payload: {
    person_name: string;
    amount: number;
    type: UdhaarType;
    due_date?: string;
  }) => void;
}

const LENT_GOLD = "#D4AF37";
const BORROWED_GREY = "#A3A3A3";

export default function AddUdhaarModal({ visible, onClose, onAdd }: AddUdhaarModalProps) {
  const colors = useColors();
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<UdhaarType>("Lent");
  const [dueDate, setDueDate] = useState<string | undefined>();

  const reset = () => {
    setPersonName("");
    setAmount("");
    setType("Lent");
    setDueDate(undefined);
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  const canSubmit = personName.trim().length > 0 && parseFloat(amount) > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd({
      person_name: personName.trim(),
      amount: parseFloat(amount),
      type,
      due_date: dueDate,
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.goldBorder }]}>
          <Pressable onPress={handleCancel} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={[styles.cancelLabel, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.gold }]}>New Udhaar</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.addBtn,
              {
                backgroundColor: canSubmit ? colors.gold : colors.secondary,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={[styles.addBtnLabel, { color: canSubmit ? colors.primaryForeground : colors.border }]}>
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.typeRow}>
            <Pressable
              style={({ pressed }) => [
                styles.typeCard,
                {
                  backgroundColor: type === "Lent" ? LENT_GOLD + "18" : colors.card,
                  borderColor: type === "Lent" ? LENT_GOLD : colors.goldBorder,
                  borderWidth: type === "Lent" ? 1.5 : 0.5,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => { setType("Lent"); Haptics.selectionAsync(); }}
            >
              <View style={[styles.typeIconWrap, { backgroundColor: LENT_GOLD + "22" }]}>
                <Feather name="arrow-up-right" size={20} color={LENT_GOLD} strokeWidth={1.5} />
              </View>
              <Text style={[styles.typeLabel, { color: type === "Lent" ? LENT_GOLD : colors.mutedForeground }]}>
                Lent (Diya)
              </Text>
              <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>
                Money you gave
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.typeCard,
                {
                  backgroundColor: type === "Borrowed" ? BORROWED_GREY + "18" : colors.card,
                  borderColor: type === "Borrowed" ? BORROWED_GREY : colors.goldBorder,
                  borderWidth: type === "Borrowed" ? 1.5 : 0.5,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => { setType("Borrowed"); Haptics.selectionAsync(); }}
            >
              <View style={[styles.typeIconWrap, { backgroundColor: BORROWED_GREY + "22" }]}>
                <Feather name="arrow-down-left" size={20} color={BORROWED_GREY} strokeWidth={1.5} />
              </View>
              <Text style={[styles.typeLabel, { color: type === "Borrowed" ? BORROWED_GREY : colors.mutedForeground }]}>
                Borrowed (Liya)
              </Text>
              <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>
                Money you took
              </Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PERSON NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }]}
              placeholder="e.g. Rahul, Priya..."
              placeholderTextColor={colors.mutedForeground}
              value={personName}
              onChangeText={setPersonName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>AMOUNT (₹)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }]}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DUE DATE (OPTIONAL)</Text>
            <View style={[styles.deadlineWrap, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
              <DeadlinePicker value={dueDate} onChange={setDueDate} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  cancelLabel: { fontSize: 15, fontFamily: "Satoshi-Regular" },
  headerTitle: { fontSize: 16, fontFamily: "Satoshi-Black", letterSpacing: 0.5 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  addBtnLabel: { fontSize: 13, fontFamily: "Satoshi-Bold" },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 22, paddingBottom: 40 },
  typeRow: { flexDirection: "row", gap: 12 },
  typeCard: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    gap: 8,
    alignItems: "flex-start",
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: { fontSize: 13, fontFamily: "Satoshi-Bold" },
  typeDesc: { fontSize: 11, fontFamily: "Satoshi-Regular" },
  field: { gap: 8 },
  fieldLabel: { fontSize: 9, fontFamily: "Satoshi-Bold", letterSpacing: 1.5 },
  input: {
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Satoshi-Regular",
  },
  deadlineWrap: {
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
});
