import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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

function rupeeFormat(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function humanDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-IN", {
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

  const taskEntry = getTask(id);

  const [paidAmountInput, setPaidAmountInput] = useState(taskEntry?.paid_amount.toString() ?? "0");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(taskEntry?.status ?? "Pending");
  const [updateNote, setUpdateNote] = useState("");
  const [slipImageUri, setSlipImageUri] = useState<string | undefined>(taskEntry?.image_uri);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (taskEntry) {
      setPaidAmountInput(taskEntry.paid_amount.toString());
      setSelectedStatus(taskEntry.status);
      setSlipImageUri(taskEntry.image_uri);
    }
  }, [taskEntry?.id]);

  if (!taskEntry) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.missingText, { color: colors.mutedForeground }]}>
          Couldn't find this task. It may have been deleted.
        </Text>
      </View>
    );
  }

  const outstandingDue = taskEntry.total_amount - (parseFloat(paidAmountInput) || 0);
  const collectionRatio = taskEntry.total_amount > 0
    ? ((parseFloat(paidAmountInput) || 0) / taskEntry.total_amount) * 100
    : 0;

  const pickSlipPhoto = async () => {
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
  };

  const saveChanges = async () => {
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const confirmedPaid = Math.min(parseFloat(paidAmountInput) || 0, taskEntry.total_amount);
    const enteredNote = updateNote.trim();
    await updateTask(
      taskEntry.id,
      { paid_amount: confirmedPaid, status: selectedStatus, image_uri: slipImageUri },
      enteredNote || `Payment updated to ${rupeeFormat(confirmedPaid)} — status: ${selectedStatus}`
    );
    setUpdateNote("");
    setIsSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete this task?",
      "This can't be undone. All payment history for this task will be lost.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Yes, delete it",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteTask(taskEntry.id);
            router.back();
          },
        },
      ]
    );
  };

  const shareOnWhatsApp = () => {
    const confirmedPaid = parseFloat(paidAmountInput) || 0;
    const shareMessage = `Task: ${taskEntry.task_name} | Status: ${selectedStatus} | Total: ${rupeeFormat(taskEntry.total_amount)} | Paid: ${rupeeFormat(confirmedPaid)} | Pending: ${rupeeFormat(taskEntry.total_amount - confirmedPaid)}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { borderBottomColor: colors.goldBorder }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={21} color={colors.pearl} strokeWidth={1.5} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.gold }]} numberOfLines={1}>
          {taskEntry.task_name}
        </Text>
        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
          <View style={styles.summaryAmounts}>
            <View style={styles.summaryAmountBlock}>
              <Text style={[styles.summaryAmountLabel, { color: colors.mutedForeground }]}>Total Billed</Text>
              <Text style={[styles.summaryAmountFigure, { color: colors.pearl }]}>
                {rupeeFormat(taskEntry.total_amount)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryAmountBlock}>
              <Text style={[styles.summaryAmountLabel, { color: colors.mutedForeground }]}>Still Owed</Text>
              <Text style={[
                styles.summaryAmountFigure,
                { color: outstandingDue > 0 ? colors.champagne : colors.success }
              ]}>
                {rupeeFormat(Math.max(outstandingDue, 0))}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
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
            <Text style={[styles.progressRatioLabel, { color: colors.mutedForeground }]}>
              {Math.round(collectionRatio)}% received
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>HOW MUCH HAVE YOU RECEIVED? (₹)</Text>
          <TextInput
            style={[styles.textField, { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }]}
            value={paidAmountInput}
            onChangeText={setPaidAmountInput}
            keyboardType="numeric"
            placeholder="Enter amount received"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>WHERE DOES THIS TASK STAND?</Text>
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

        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PAYMENT SLIP</Text>
          <Pressable
            style={[styles.slipPickerArea, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
            onPress={pickSlipPhoto}
          >
            {slipImageUri ? (
              <Image source={{ uri: slipImageUri }} style={styles.slipPreview} />
            ) : (
              <View style={styles.slipPickerPlaceholder}>
                <Feather name="camera" size={22} color={colors.mutedForeground} strokeWidth={1.5} />
                <Text style={[styles.slipPickerHint, { color: colors.mutedForeground }]}>
                  Tap to attach or update the slip photo
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            ANYTHING TO NOTE? (PAYMENT UPDATE, EXTRA WORK, ETC.)
          </Text>
          <TextInput
            style={[
              styles.textField,
              styles.multiLineField,
              { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }
            ]}
            value={updateNote}
            onChangeText={setUpdateNote}
            placeholder="e.g. Received ₹5,000 advance on 15th April..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />
        </View>

        <Pressable
          onPress={shareOnWhatsApp}
          style={({ pressed }) => [
            styles.whatsAppBtn,
            { borderColor: "#25D366", backgroundColor: pressed ? "#25D36622" : "#25D36611", transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
        >
          <Feather name="share-2" size={16} color="#25D366" strokeWidth={1.5} />
          <Text style={[styles.whatsAppBtnText, { color: "#25D366" }]}>Share status on WhatsApp</Text>
        </Pressable>

        <Pressable
          onPress={saveChanges}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.gold, opacity: pressed || isSaving ? 0.75 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
        >
          <Text style={[styles.saveBtnLabel, { color: colors.primaryForeground }]}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>

        {taskEntry.history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.historySectionTitle, { color: colors.pearl }]}>
              Transaction Log
            </Text>
            <View style={[styles.historyLog, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
              {[...taskEntry.history].reverse().map((logEntry, entryIndex) => (
                <View
                  key={entryIndex}
                  style={[
                    styles.logEntry,
                    entryIndex > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }
                  ]}
                >
                  <View style={styles.logEntryLeft}>
                    <View style={[styles.logDot, { backgroundColor: colors.goldDim }]} />
                    <View style={styles.logEntryContent}>
                      <Text style={[styles.logDate, { color: colors.mutedForeground }]}>
                        {humanDate(logEntry.date)}
                      </Text>
                      <Text style={[styles.logNote, { color: colors.foreground }]}>
                        {logEntry.note}
                      </Text>
                    </View>
                  </View>
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
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  missingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.5,
    marginHorizontal: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingLeft: 18,
    gap: 22,
  },
  summaryCard: {
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 18,
    paddingLeft: 20,
    gap: 14,
  },
  summaryAmounts: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryAmountBlock: {
    flex: 1,
    gap: 4,
  },
  summaryDivider: {
    width: 0.5,
    height: 40,
    marginHorizontal: 18,
  },
  summaryAmountLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryAmountFigure: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  progressSection: {
    gap: 6,
  },
  progressRail: {
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1,
  },
  progressRatioLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  formSection: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  textField: {
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  multiLineField: {
    height: 85,
    textAlignVertical: "top",
    paddingTop: 12,
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
    fontFamily: "Inter_500Medium",
  },
  slipPickerArea: {
    borderWidth: 0.5,
    borderRadius: 6,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  slipPickerPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  slipPickerHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  slipPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  whatsAppBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 0.5,
    borderRadius: 6,
    paddingVertical: 14,
  },
  whatsAppBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  saveBtn: {
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  historySection: {
    gap: 10,
  },
  historySectionTitle: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_600SemiBold",
    letterSpacing: 0.3,
  },
  historyLog: {
    borderWidth: 0.5,
    borderRadius: 6,
    overflow: "hidden",
  },
  logEntry: {
    padding: 14,
    paddingLeft: 16,
  },
  logEntryLeft: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  logEntryContent: {
    flex: 1,
    gap: 3,
  },
  logDate: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  logNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
