import { Feather } from "@expo/vector-icons";
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

import { TaskStatus } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    task_name: string;
    total_amount: number;
    paid_amount: number;
    status: TaskStatus;
    image_uri?: string;
    notes?: string;
  }) => void;
}

const STATUS_OPTIONS: TaskStatus[] = ["Pending", "In Progress", "Completed"];

export default function AddTaskModal({ visible, onClose, onAdd }: AddTaskModalProps) {
  const colors = useColors();
  const [taskName, setTaskName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [status, setStatus] = useState<TaskStatus>("Pending");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [pickingImage, setPickingImage] = useState(false);

  const reset = () => {
    setTaskName("");
    setTotalAmount("");
    setPaidAmount("0");
    setStatus("Pending");
    setImageUri(undefined);
    setNotes("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickImage = async () => {
    setPickingImage(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPickingImage(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
        base64: false,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } finally {
      setPickingImage(false);
    }
  };

  const handleAdd = () => {
    const name = taskName.trim();
    const total = parseFloat(totalAmount);
    const paid = parseFloat(paidAmount) || 0;
    if (!name || isNaN(total) || total <= 0) return;

    onAdd({
      task_name: name,
      total_amount: total,
      paid_amount: Math.min(paid, total),
      status,
      image_uri: imageUri,
      notes: notes.trim() || undefined,
    });
    reset();
    onClose();
  };

  const isValid = taskName.trim().length > 0 && parseFloat(totalAmount) > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.gold }]}>NEW TASK</Text>
          <Pressable
            onPress={handleAdd}
            disabled={!isValid}
            style={styles.headerBtn}
          >
            <Text
              style={[
                styles.headerBtnText,
                { color: isValid ? colors.gold : colors.border },
              ]}
            >
              Add
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>TASK NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. Website Design Work"
              placeholderTextColor={colors.mutedForeground}
              value={taskName}
              onChangeText={setTaskName}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>TOTAL (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>PAID (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={paidAmount}
                onChangeText={setPaidAmount}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>STATUS</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: status === s ? colors.gold : colors.card,
                      borderColor: status === s ? colors.gold : colors.border,
                    },
                  ]}
                  onPress={() => setStatus(s)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: status === s ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>SLIP / PHOTO</Text>
            <Pressable
              style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handlePickImage}
            >
              {pickingImage ? (
                <ActivityIndicator color={colors.gold} />
              ) : imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={24} color={colors.mutedForeground} />
                  <Text style={[styles.imagePlaceholderText, { color: colors.mutedForeground }]}>
                    Tap to pick a slip photo
                  </Text>
                </View>
              )}
            </Pressable>
            {imageUri && (
              <Pressable onPress={() => setImageUri(undefined)} style={styles.removeImage}>
                <Text style={[styles.removeImageText, { color: colors.destructive }]}>Remove photo</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>NOTES</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
              ]}
              placeholder="Add notes here..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {
    minWidth: 60,
  },
  headerBtnText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: "center",
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  imagePicker: {
    borderWidth: 1,
    borderRadius: 4,
    borderStyle: "dashed",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImage: {
    alignSelf: "flex-end",
  },
  removeImageText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
