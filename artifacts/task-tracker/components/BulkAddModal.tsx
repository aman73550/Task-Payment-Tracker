import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import DeadlinePicker from "@/components/DeadlinePicker";
import {
  ActivityIndicator,
  Image,
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

import { BulkTaskRow } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

interface BulkAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveAll: (
    rows: BulkTaskRow[],
    onProgress: (done: number, total: number) => void
  ) => Promise<void>;
}

interface RowState {
  id: string;
  task_name: string;
  total_amount: string;
  image_uri?: string;
  deadline_at?: string;
}

function newRow(): RowState {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    task_name: "",
    total_amount: "",
  };
}

export default function BulkAddModal({ visible, onClose, onSaveAll }: BulkAddModalProps) {
  const colors = useColors();
  const [rows, setRows] = useState<RowState[]>([newRow(), newRow(), newRow()]);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const resetForm = () => {
    setRows([newRow(), newRow(), newRow()]);
    setProgress({ done: 0, total: 0 });
    setIsSaving(false);
  };

  const handleClose = () => {
    if (isSaving) return;
    resetForm();
    onClose();
  };

  const updateRow = (id: string, field: keyof RowState, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRows((prev) => [...prev, newRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const pickImageForRow = async (id: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, image_uri: result.assets[0].uri } : r
        )
      );
    }
  };

  const validRows = rows.filter(
    (r) => r.task_name.trim().length > 0 && parseFloat(r.total_amount) > 0
  );

  const handleSaveAll = async () => {
    if (validRows.length === 0) return;
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const taskRows: BulkTaskRow[] = validRows.map((r) => ({
      task_name: r.task_name.trim(),
      total_amount: parseFloat(r.total_amount),
      image_uri: r.image_uri,
      deadline_at: r.deadline_at,
    }));

    setProgress({ done: 0, total: taskRows.length });

    await onSaveAll(taskRows, (done, total) => {
      setProgress({ done, total });
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    onClose();
  };

  const progressPercent =
    progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.goldBorder }]}>
          <Pressable
            onPress={handleClose}
            disabled={isSaving}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[styles.cancelLabel, { color: isSaving ? colors.border : colors.mutedForeground }]}>
              Cancel
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.gold }]}>Bulk Entry</Text>
          <Pressable
            onPress={handleSaveAll}
            disabled={isSaving || validRows.length === 0}
            style={({ pressed }) => [
              styles.saveAllBtn,
              {
                backgroundColor: validRows.length > 0 && !isSaving ? colors.gold : colors.secondary,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.saveAllLabel, { color: validRows.length > 0 ? colors.primaryForeground : colors.border }]}>
                Save All
              </Text>
            )}
          </Pressable>
        </View>

        {isSaving && (
          <View style={[styles.progressBanner, { backgroundColor: colors.card, borderBottomColor: colors.goldBorder }]}>
            <Text style={[styles.progressMessage, { color: colors.champagne }]}>
              Hang on, saving your tasks safely... ({progress.done}/{progress.total})
            </Text>
            <View style={[styles.progressRail, { backgroundColor: colors.secondary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%` as any,
                    backgroundColor: colors.gold,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            Fill in your tasks below. Empty rows are skipped automatically.
          </Text>

          {rows.map((row, index) => (
            <View
              key={row.id}
              style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
            >
              <View style={styles.rowHeader}>
                <Text style={[styles.rowIndex, { color: colors.gold }]}>
                  #{index + 1}
                </Text>
                {rows.length > 1 && (
                  <Pressable
                    onPress={() => removeRow(row.id)}
                    hitSlop={10}
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                  >
                    <Feather name="x" size={16} color={colors.mutedForeground} strokeWidth={1.5} />
                  </Pressable>
                )}
              </View>

              <TextInput
                style={[styles.rowInput, { backgroundColor: colors.secondary, color: colors.pearl, borderColor: colors.goldBorder }]}
                placeholder="Task name"
                placeholderTextColor={colors.mutedForeground}
                value={row.task_name}
                onChangeText={(v) => updateRow(row.id, "task_name", v)}
              />

              <TextInput
                style={[styles.rowInput, { backgroundColor: colors.secondary, color: colors.pearl, borderColor: colors.goldBorder }]}
                placeholder="Amount billed (₹)"
                placeholderTextColor={colors.mutedForeground}
                value={row.total_amount}
                onChangeText={(v) => updateRow(row.id, "total_amount", v)}
                keyboardType="numeric"
              />

              <Pressable
                onPress={() => pickImageForRow(row.id)}
                style={({ pressed }) => [
                  styles.imagePickRow,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.goldBorder,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                {row.image_uri ? (
                  <Image source={{ uri: row.image_uri }} style={styles.rowThumb} />
                ) : (
                  <Feather name="camera" size={14} color={colors.mutedForeground} strokeWidth={1.5} />
                )}
                <Text style={[styles.imagePickLabel, { color: colors.mutedForeground }]}>
                  {row.image_uri ? "Slip attached" : "Attach slip photo"}
                </Text>
                {row.image_uri && (
                  <Pressable
                    onPress={() => setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, image_uri: undefined } : r))}
                    hitSlop={8}
                  >
                    <Feather name="x-circle" size={14} color={colors.destructive} strokeWidth={1.5} />
                  </Pressable>
                )}
              </Pressable>

              <View style={[styles.deadlineBulkWrapper, { backgroundColor: colors.secondary, borderColor: colors.goldBorder }]}>
                <DeadlinePicker
                  value={row.deadline_at}
                  onChange={(v) =>
                    setRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, deadline_at: v } : r))
                    )
                  }
                />
              </View>
            </View>
          ))}

          <Pressable
            onPress={addRow}
            style={({ pressed }) => [
              styles.addRowBtn,
              { borderColor: colors.goldBorder, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="plus" size={16} color={colors.gold} strokeWidth={1.5} />
            <Text style={[styles.addRowLabel, { color: colors.gold }]}>Add another row</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  cancelLabel: {
    fontSize: 15,
    fontFamily: "Satoshi-Regular",
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Satoshi-Black",
    letterSpacing: 0.5,
  },
  saveAllBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  saveAllLabel: {
    fontSize: 13,
    fontFamily: "Satoshi-Bold",
  },
  progressBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  progressMessage: {
    fontSize: 12,
    fontFamily: "Satoshi-Medium",
  },
  progressRail: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingLeft: 18,
    gap: 12,
    paddingBottom: 40,
  },
  hintText: {
    fontSize: 12,
    fontFamily: "Satoshi-Regular",
    marginBottom: 4,
  },
  rowCard: {
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 14,
    gap: 10,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowIndex: {
    fontSize: 12,
    fontFamily: "Satoshi-Bold",
    letterSpacing: 0.5,
  },
  rowInput: {
    borderWidth: 0.5,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Satoshi-Regular",
  },
  imagePickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 0.5,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  rowThumb: {
    width: 24,
    height: 24,
    borderRadius: 3,
  },
  imagePickLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Satoshi-Regular",
  },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 0.5,
    borderRadius: 6,
    paddingVertical: 13,
    borderStyle: "dashed",
  },
  addRowLabel: {
    fontSize: 13,
    fontFamily: "Satoshi-Medium",
  },
  deadlineBulkWrapper: {
    borderWidth: 0.5,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
});
