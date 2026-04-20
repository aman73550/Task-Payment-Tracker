import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
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

import DeadlinePicker from "@/components/DeadlinePicker";
import { TaskStatus } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (slipPayload: {
    task_name: string;
    total_amount: number;
    paid_amount: number;
    status: TaskStatus;
    work_done: boolean;
    payment_received: boolean;
    image_uris: string[];
    notes?: string;
    deadline_at?: string;
  }) => void;
}

const STATUS_OPTIONS: TaskStatus[] = ["Pending", "In Progress", "Completed"];

export default function AddTaskModal({ visible, onClose, onAdd }: AddTaskModalProps) {
  const colors = useColors();
  const [taskName, setTaskName] = useState("");
  const [billedAmount, setBilledAmount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("0");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>("Pending");
  const [slipImageUri, setSlipImageUri] = useState<string | undefined>();
  const [taskNote, setTaskNote] = useState("");
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [deadlineAt, setDeadlineAt] = useState<string | undefined>();

  const resetForm = () => {
    setTaskName("");
    setBilledAmount("");
    setReceivedAmount("0");
    setSelectedStatus("Pending");
    setSlipImageUri(undefined);
    setTaskNote("");
    setDeadlineAt(undefined);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handlePickSlipPhoto = async () => {
    setPickingPhoto(true);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) return;

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!pickerResult.canceled && pickerResult.assets[0]) {
        setSlipImageUri(pickerResult.assets[0].uri);
      }
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleSubmit = () => {
    const cleanName = taskName.trim();
    const totalBilled = parseFloat(billedAmount);
    const totalReceived = parseFloat(receivedAmount) || 0;
    if (!cleanName || isNaN(totalBilled) || totalBilled <= 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd({
      task_name: cleanName,
      total_amount: totalBilled,
      paid_amount: Math.min(totalReceived, totalBilled),
      status: selectedStatus,
      work_done: selectedStatus === "Completed",
      payment_received: selectedStatus === "Completed" && totalReceived >= totalBilled,
      image_uris: slipImageUri ? [slipImageUri] : [],
      notes: taskNote.trim() || undefined,
      deadline_at: deadlineAt,
    });
    resetForm();
    onClose();
  };

  const canSubmit = taskName.trim().length > 0 && parseFloat(billedAmount) > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modalHeader, { borderBottomColor: colors.goldBorder }]}>
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.cancelLabel, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.gold }]}>New Task</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.addButton,
              {
                backgroundColor: canSubmit ? colors.gold : colors.secondary,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              }
            ]}
          >
            <Text style={[styles.addButtonLabel, { color: canSubmit ? colors.primaryForeground : colors.border }]}>
              Add
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>WHAT'S THE TASK?</Text>
            <TextInput
              style={[styles.textField, { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }]}
              placeholder="e.g. Website redesign for client"
              placeholderTextColor={colors.mutedForeground}
              value={taskName}
              onChangeText={setTaskName}
            />
          </View>

          <View style={styles.amountRow}>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TOTAL BILLED (₹)</Text>
              <TextInput
                style={[styles.textField, { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={billedAmount}
                onChangeText={setBilledAmount}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>RECEIVED SO FAR (₹)</Text>
              <TextInput
                style={[styles.textField, { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={receivedAmount}
                onChangeText={setReceivedAmount}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>STATUS</Text>
            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map((statusOption) => (
                <Pressable
                  key={statusOption}
                  style={({ pressed }) => [
                    styles.statusOption,
                    {
                      backgroundColor: selectedStatus === statusOption ? colors.gold : colors.card,
                      borderColor: selectedStatus === statusOption ? colors.gold : colors.goldBorder,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                  onPress={() => {
                    setSelectedStatus(statusOption);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[
                    styles.statusOptionText,
                    { color: selectedStatus === statusOption ? colors.primaryForeground : colors.mutedForeground }
                  ]}>
                    {statusOption}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PAYMENT SLIP (OPTIONAL)</Text>
            <Pressable
              style={[styles.slipPickerArea, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
              onPress={handlePickSlipPhoto}
            >
              {pickingPhoto ? (
                <ActivityIndicator color={colors.gold} />
              ) : slipImageUri ? (
                <Image source={{ uri: slipImageUri }} style={styles.slipPreview} />
              ) : (
                <View style={styles.slipPlaceholder}>
                  <Feather name="camera" size={22} color={colors.mutedForeground} strokeWidth={1.5} />
                  <Text style={[styles.slipHint, { color: colors.mutedForeground }]}>
                    Attach a slip or receipt photo
                  </Text>
                </View>
              )}
            </Pressable>
            {slipImageUri && (
              <Pressable onPress={() => setSlipImageUri(undefined)}>
                <Text style={[styles.removePhotoLabel, { color: colors.destructive }]}>Remove photo</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DEADLINE (OPTIONAL)</Text>
            <View style={[styles.deadlineWrapper, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
              <DeadlinePicker value={deadlineAt} onChange={setDeadlineAt} />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={[
                styles.textField,
                styles.multiLineField,
                { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }
              ]}
              placeholder="Any extra details about this task..."
              placeholderTextColor={colors.mutedForeground}
              value={taskNote}
              onChangeText={setTaskNote}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 15,
    fontFamily: "Satoshi-Black",
    letterSpacing: 0.5,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
  },
  addButtonLabel: {
    fontSize: 13,
    fontFamily: "Satoshi-Bold",
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingLeft: 22,
    gap: 22,
    paddingBottom: 40,
  },
  formField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 9,
    fontFamily: "Satoshi-Bold",
    letterSpacing: 1.5,
  },
  textField: {
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Satoshi-Regular",
  },
  multiLineField: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  amountRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusOptions: {
    flexDirection: "row",
    gap: 8,
  },
  statusOption: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 6,
    paddingVertical: 11,
    alignItems: "center",
  },
  statusOptionText: {
    fontSize: 11,
    fontFamily: "Satoshi-Medium",
  },
  slipPickerArea: {
    borderWidth: 0.5,
    borderRadius: 6,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  slipPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  slipHint: {
    fontSize: 12,
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  slipPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removePhotoLabel: {
    fontSize: 12,
    fontFamily: "Satoshi-Regular",
    alignSelf: "flex-end",
  },
  deadlineWrapper: {
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
});
