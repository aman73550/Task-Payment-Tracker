import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
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

import DeadlinePicker from "@/components/DeadlinePicker";
import { HistoryEntry, TaskStatus, useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";
import { getDeadlineState, humanDeadline } from "@/utils/deadline";

const STATUS_OPTIONS: TaskStatus[] = ["Pending", "In Progress", "Completed"];

function rupeeFormat(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function humanDate(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " at " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTask, updateTask, deleteTask } = useTasks();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const taskEntry = getTask(id);

  const [paidAmountInput, setPaidAmountInput] = useState(
    taskEntry?.paid_amount.toString() ?? "0"
  );
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(
    taskEntry?.status ?? "Pending"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deadlineAt, setDeadlineAt] = useState<string | undefined>(
    taskEntry?.deadline_at
  );

  const [addonNote, setAddonNote] = useState("");
  const [addonLink, setAddonLink] = useState("");
  const [addonImages, setAddonImages] = useState<string[]>([]);
  const [isSavingAddon, setIsSavingAddon] = useState(false);

  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    if (taskEntry) {
      setPaidAmountInput(taskEntry.paid_amount.toString());
      setSelectedStatus(taskEntry.status);
    }
  }, [taskEntry?.id]);

  if (!taskEntry) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.missingNote, { color: colors.mutedForeground }]}>
          Couldn't find this task. It may have been deleted.
        </Text>
      </View>
    );
  }

  const outstandingDue = taskEntry.total_amount - (parseFloat(paidAmountInput) || 0);
  const collectionRatio =
    taskEntry.total_amount > 0
      ? ((parseFloat(paidAmountInput) || 0) / taskEntry.total_amount) * 100
      : 0;

  const allImages = taskEntry.image_uris ?? [];

  const pickMorePhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const newUri = result.assets[0].uri;
      await updateTask(
        taskEntry.id,
        { image_uris: [...allImages, newUri] },
        { date: new Date().toISOString(), note: "New slip photo added" }
      );
    }
  };

  const removePhoto = async (uri: string) => {
    Alert.alert("Remove photo?", "This slip will be removed from the task.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await updateTask(taskEntry.id, {
            image_uris: allImages.filter((u) => u !== uri),
          });
        },
      },
    ]);
  };

  const pickAddonImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAddonImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const savePaymentUpdate = async () => {
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const confirmedPaid = Math.min(
      parseFloat(paidAmountInput) || 0,
      taskEntry.total_amount
    );
    await updateTask(
      taskEntry.id,
      { paid_amount: confirmedPaid, status: selectedStatus, deadline_at: deadlineAt },
      {
        date: new Date().toISOString(),
        note: `Payment updated to ${rupeeFormat(confirmedPaid)} — status: ${selectedStatus}`,
      }
    );
    setIsSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const saveAddon = async () => {
    const noteText = addonNote.trim();
    const linkText = addonLink.trim();
    if (!noteText && !linkText && addonImages.length === 0) return;

    setIsSavingAddon(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      note: noteText || (linkText ? "Reference link added" : "Photos added"),
      images: addonImages.length > 0 ? [...addonImages] : undefined,
      link: linkText || undefined,
    };

    const updatedImageUris = addonImages.length > 0
      ? [...allImages, ...addonImages]
      : allImages;

    await updateTask(taskEntry.id, { image_uris: updatedImageUris }, entry);
    setAddonNote("");
    setAddonLink("");
    setAddonImages([]);
    setIsSavingAddon(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete this task?",
      "All records and payment history for this task will be gone.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Yes, delete",
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
    const msg = `Task: ${taskEntry.task_name} | Status: ${selectedStatus} | Total: ${rupeeFormat(taskEntry.total_amount)} | Paid: ${rupeeFormat(parseFloat(paidAmountInput) || 0)} | Pending: ${rupeeFormat(outstandingDue)}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
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
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.55 : 1 }]}
        >
          <Feather name="arrow-left" size={21} color={colors.pearl} strokeWidth={1.5} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.gold }]} numberOfLines={1}>
          {taskEntry.task_name}
        </Text>
        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.55 : 1 }]}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
          <View style={styles.summaryAmounts}>
            <View style={styles.summaryBlock}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Billed</Text>
              <Text style={[styles.summaryFigure, { color: colors.pearl }]}>
                {rupeeFormat(taskEntry.total_amount)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryBlock}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Still Owed</Text>
              <Text style={[styles.summaryFigure, { color: outstandingDue > 0 ? colors.champagne : colors.success }]}>
                {rupeeFormat(Math.max(outstandingDue, 0))}
              </Text>
            </View>
          </View>
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
          <Text style={[styles.ratioText, { color: colors.mutedForeground }]}>
            {Math.round(collectionRatio)}% received
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            HOW MUCH HAVE YOU RECEIVED? (₹)
          </Text>
          <TextInput
            style={[styles.inputField, { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }]}
            value={paidAmountInput}
            onChangeText={setPaidAmountInput}
            keyboardType="numeric"
            placeholder="Enter amount received"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WHERE DOES THIS TASK STAND?</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [
                  styles.statusChip,
                  {
                    backgroundColor: selectedStatus === opt ? colors.gold : colors.card,
                    borderColor: selectedStatus === opt ? colors.gold : colors.goldBorder,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
                onPress={() => {
                  setSelectedStatus(opt);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={[
                  styles.statusChipText,
                  { color: selectedStatus === opt ? colors.primaryForeground : colors.mutedForeground },
                ]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              PAYMENT SLIPS ({allImages.length})
            </Text>
            <Pressable
              onPress={pickMorePhotos}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <View style={styles.addPhotoBtn}>
                <Feather name="plus" size={12} color={colors.gold} strokeWidth={1.5} />
                <Text style={[styles.addPhotoBtnLabel, { color: colors.gold }]}>Add</Text>
              </View>
            </Pressable>
          </View>

          {allImages.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
              {allImages.map((uri, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setViewingImage(uri)}
                  onLongPress={() => removePhoto(uri)}
                  style={styles.galleryThumbWrap}
                >
                  <Image source={{ uri }} style={[styles.galleryThumb, { borderColor: colors.goldBorder }]} />
                  <View style={[styles.galleryIndex, { backgroundColor: colors.card }]}>
                    <Text style={[styles.galleryIndexText, { color: colors.mutedForeground }]}>{idx + 1}</Text>
                  </View>
                </Pressable>
              ))}
              <Pressable
                onPress={pickMorePhotos}
                style={[styles.addPhotoTile, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
              >
                <Feather name="camera" size={20} color={colors.mutedForeground} strokeWidth={1.5} />
              </Pressable>
            </ScrollView>
          ) : (
            <Pressable
              onPress={pickMorePhotos}
              style={[styles.noPhotoArea, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
            >
              <Feather name="camera" size={20} color={colors.mutedForeground} strokeWidth={1.5} />
              <Text style={[styles.noPhotoHint, { color: colors.mutedForeground }]}>
                Tap to attach a slip photo
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DEADLINE</Text>
          <View style={[styles.inputField, { backgroundColor: colors.card, borderColor: deadlineAt ? colors.champagne : colors.goldBorder, paddingVertical: 4 }]}>
            <DeadlinePicker value={deadlineAt} onChange={setDeadlineAt} />
          </View>
        </View>

        <Pressable
          onPress={shareOnWhatsApp}
          style={({ pressed }) => [
            styles.whatsAppBtn,
            {
              borderColor: "#25D366",
              backgroundColor: pressed ? "#25D36622" : "#25D36611",
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Feather name="share-2" size={15} color="#25D366" strokeWidth={1.5} />
          <Text style={[styles.whatsAppBtnText, { color: "#25D366" }]}>
            Share status on WhatsApp
          </Text>
        </Pressable>

        <Pressable
          onPress={savePaymentUpdate}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: colors.gold,
              opacity: pressed || isSaving ? 0.75 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={[styles.saveBtnLabel, { color: colors.primaryForeground }]}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>

        <View style={[styles.addonSection, { borderColor: colors.goldBorder }]}>
          <Text style={[styles.addonTitle, { color: colors.pearl }]}>Log an Update</Text>
          <Text style={[styles.addonSubtitle, { color: colors.mutedForeground }]}>
            Extra work, payment change, reference link — record it here.
          </Text>

          <TextInput
            style={[styles.inputField, styles.multiLineField, { backgroundColor: colors.card, color: colors.pearl, borderColor: colors.goldBorder }]}
            value={addonNote}
            onChangeText={setAddonNote}
            placeholder="e.g. Client asked for extra wiring, charged ₹2,000 more..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={[styles.inputField, { backgroundColor: colors.card, color: colors.champagne, borderColor: colors.goldBorder }]}
            value={addonLink}
            onChangeText={setAddonLink}
            placeholder="Reference link (optional)"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="url"
            autoCapitalize="none"
          />

          {addonImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addonImageRow}>
              {addonImages.map((uri, idx) => (
                <View key={idx} style={styles.addonThumbWrap}>
                  <Image source={{ uri }} style={[styles.addonThumb, { borderColor: colors.goldBorder }]} />
                  <Pressable
                    style={[styles.removeThumbBtn, { backgroundColor: colors.card }]}
                    onPress={() => setAddonImages((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Feather name="x" size={10} color={colors.destructive} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.addonActions}>
            <Pressable
              onPress={pickAddonImage}
              style={({ pressed }) => [
                styles.addonImgBtn,
                { borderColor: colors.goldBorder, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="camera" size={14} color={colors.mutedForeground} strokeWidth={1.5} />
              <Text style={[styles.addonImgBtnLabel, { color: colors.mutedForeground }]}>
                Add photo
              </Text>
            </Pressable>

            <Pressable
              onPress={saveAddon}
              disabled={isSavingAddon}
              style={({ pressed }) => [
                styles.addonSaveBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.goldBorder,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Text style={[styles.addonSaveBtnLabel, { color: colors.champagne }]}>
                {isSavingAddon ? "Saving..." : "Save to log"}
              </Text>
            </Pressable>
          </View>
        </View>

        {taskEntry.history.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={[styles.timelineTitle, { color: colors.pearl }]}>Timeline</Text>

            {[...taskEntry.history].reverse().map((entry, idx) => (
              <View key={idx} style={styles.timelineEntry}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.gold }]} />
                  {idx < taskEntry.history.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineDate, { color: colors.mutedForeground }]}>
                    {humanDate(entry.date)}
                  </Text>
                  <Text style={[styles.timelineNote, { color: colors.foreground }]}>
                    {entry.note}
                  </Text>
                  {entry.link && (
                    <Pressable
                      onPress={() => Linking.openURL(entry.link!)}
                      style={styles.timelineLinkRow}
                    >
                      <Feather name="external-link" size={12} color={colors.champagne} strokeWidth={1.5} />
                      <Text style={[styles.timelineLinkText, { color: colors.champagne }]} numberOfLines={1}>
                        {entry.link}
                      </Text>
                    </Pressable>
                  )}
                  {entry.images && entry.images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineImages}>
                      {entry.images.map((uri, i) => (
                        <Pressable key={i} onPress={() => setViewingImage(uri)}>
                          <Image
                            source={{ uri }}
                            style={[styles.timelineThumb, { borderColor: colors.border }]}
                          />
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!viewingImage} transparent animationType="fade">
        <Pressable
          style={styles.lightboxOverlay}
          onPress={() => setViewingImage(null)}
        >
          {viewingImage && (
            <Image
              source={{ uri: viewingImage }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
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
  missingNote: {
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
    fontSize: 15,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.3,
    marginHorizontal: 8,
  },
  scroll: {
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
    gap: 10,
  },
  summaryAmounts: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryBlock: {
    flex: 1,
    gap: 4,
  },
  summaryDivider: {
    width: 0.5,
    height: 40,
    marginHorizontal: 20,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryFigure: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
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
  ratioText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addPhotoBtnLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  inputField: {
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
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusChip: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: "center",
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  photoGallery: {
    marginLeft: -2,
  },
  galleryThumbWrap: {
    marginRight: 8,
    position: "relative",
  },
  galleryThumb: {
    width: 90,
    height: 90,
    borderRadius: 5,
    borderWidth: 0.5,
  },
  galleryIndex: {
    position: "absolute",
    bottom: 4,
    right: 4,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  galleryIndexText: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
  },
  addPhotoTile: {
    width: 90,
    height: 90,
    borderRadius: 5,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
  },
  noPhotoArea: {
    borderWidth: 0.5,
    borderRadius: 6,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderStyle: "dashed",
  },
  noPhotoHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  whatsAppBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 0.5,
    borderRadius: 6,
    paddingVertical: 13,
  },
  whatsAppBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  saveBtn: {
    borderRadius: 6,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  addonSection: {
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 16,
    paddingLeft: 18,
    gap: 12,
  },
  addonTitle: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.3,
  },
  addonSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: -4,
  },
  addonImageRow: {
    marginTop: -4,
  },
  addonThumbWrap: {
    marginRight: 8,
    position: "relative",
  },
  addonThumb: {
    width: 64,
    height: 64,
    borderRadius: 5,
    borderWidth: 0.5,
  },
  removeThumbBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addonActions: {
    flexDirection: "row",
    gap: 10,
  },
  addonImgBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  addonImgBtnLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  addonSaveBtn: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: "center",
  },
  addonSaveBtnLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  timelineSection: {
    gap: 0,
  },
  timelineTitle: {
    fontSize: 16,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  timelineEntry: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: "center",
    width: 14,
  },
  timelineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 3,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    gap: 6,
    paddingBottom: 4,
  },
  timelineDate: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  timelineNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  timelineLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timelineLinkText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
  },
  timelineImages: {
    marginTop: 4,
  },
  timelineThumb: {
    width: 70,
    height: 70,
    borderRadius: 4,
    borderWidth: 0.5,
    marginRight: 6,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "#000000EE",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: {
    width: "95%",
    height: "80%",
  },
});
