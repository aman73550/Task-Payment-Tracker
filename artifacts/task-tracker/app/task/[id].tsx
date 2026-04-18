import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TaskStatus, useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

const STATUS_OPTIONS: TaskStatus[] = ["Pending", "In Progress", "Completed"];

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTask, updateTask, deleteTask } = useTasks();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const task = getTask(id);

  const [paidAmount, setPaidAmount] = useState(task?.paid_amount.toString() ?? "0");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "Pending");
  const [noteInput, setNoteInput] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(task?.image_uri);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setPaidAmount(task.paid_amount.toString());
      setStatus(task.status);
      setImageUri(task.image_uri);
    }
  }, [task?.id]);

  if (!task) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Task not found</Text>
      </View>
    );
  }

  const remaining = task.total_amount - (parseFloat(paidAmount) || 0);
  const progress =
    task.total_amount > 0
      ? ((parseFloat(paidAmount) || 0) / task.total_amount) * 100
      : 0;

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const paid = Math.min(parseFloat(paidAmount) || 0, task.total_amount);
    const note = noteInput.trim();
    await updateTask(
      task.id,
      {
        paid_amount: paid,
        status,
        image_uri: imageUri,
      },
      note || `Updated: Paid ₹${paid}, Status: ${status}`
    );
    setNoteInput("");
    setSaving(false);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTask(task.id);
          router.back();
        },
      },
    ]);
  };

  const handleWhatsApp = () => {
    const paid = parseFloat(paidAmount) || 0;
    const rem = task.total_amount - paid;
    const message = `Task: ${task.task_name} | Status: ${status} | Total: ${formatCurrency(task.total_amount)} | Paid: ${formatCurrency(paid)} | Pending: ${formatCurrency(rem)}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.gold }]} numberOfLines={1}>
          {task.task_name}
        </Text>
        <Pressable onPress={handleDelete} style={styles.backBtn}>
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>TOTAL</Text>
              <Text style={[styles.amountValue, { color: colors.foreground }]}>
                {formatCurrency(task.total_amount)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>REMAINING</Text>
              <Text
                style={[
                  styles.amountValue,
                  { color: remaining > 0 ? colors.gold : colors.success },
                ]}
              >
                {formatCurrency(Math.max(remaining, 0))}
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
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
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>UPDATE PAID AMOUNT (₹)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={paidAmount}
            onChangeText={setPaidAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STATUS</Text>
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
                    styles.statusText,
                    { color: status === s ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SLIP / PHOTO</Text>
          <Pressable
            style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handlePickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="camera" size={22} color={colors.mutedForeground} />
                <Text style={[styles.imagePlaceholderText, { color: colors.mutedForeground }]}>
                  Tap to update slip photo
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ADD NOTE / UPDATE</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
            value={noteInput}
            onChangeText={setNoteInput}
            placeholder="e.g. Added ₹500 for extra work..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={handleWhatsApp}
            style={[styles.waBtn, { backgroundColor: "#25D36622", borderColor: "#25D366" }]}
          >
            <Feather name="share-2" size={18} color="#25D366" />
            <Text style={[styles.waBtnText, { color: "#25D366" }]}>Share via WhatsApp</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.gold, opacity: pressed || saving ? 0.75 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Changes</Text>
          )}
        </Pressable>

        {task.history.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HISTORY</Text>
            <View style={[styles.historyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[...task.history].reverse().map((entry, idx) => (
                <View key={idx} style={[styles.historyEntry, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>
                    {formatDate(entry.date)}
                  </Text>
                  <Text style={[styles.historyNote, { color: colors.foreground }]}>{entry.note}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    marginHorizontal: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  card: {
    borderRadius: 4,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  amountItem: {
    alignItems: "center",
    gap: 4,
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
  },
  amountValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 36,
    textAlign: "right",
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
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
    height: 90,
    textAlignVertical: "top",
    paddingTop: 12,
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
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  imagePicker: {
    borderWidth: 1,
    borderRadius: 4,
    height: 130,
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
  actionRow: {
    gap: 10,
  },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 14,
  },
  waBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  saveBtn: {
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  historyContainer: {
    borderRadius: 4,
    borderWidth: 1,
    overflow: "hidden",
  },
  historyEntry: {
    padding: 12,
    gap: 4,
  },
  historyDate: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  historyNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
