import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { humanDeadline } from "@/utils/deadline";
import { useColors } from "@/hooks/useColors";

interface DeadlinePickerProps {
  value?: string;
  onChange: (isoString: string | undefined) => void;
}

function WebDateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current && ref.current._nativeTag) return;
    const node = ref.current;
    if (!node) return;
    const input = node.childNodes?.[0];
    if (input && input.tagName === "INPUT") {
      input.type = "datetime-local";
    }
  }, []);

  return (
    <TextInput
      ref={ref}
      style={styles.webTextInput}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD HH:MM"
      placeholderTextColor="#555"
    />
  );
}

function parseDateParts(dateStr: string) {
  const now = new Date();
  const d = dateStr ? new Date(dateStr) : now;
  const valid = !isNaN(d.getTime());
  return {
    day: valid ? String(d.getDate()).padStart(2, "0") : String(now.getDate()).padStart(2, "0"),
    month: valid ? String(d.getMonth() + 1).padStart(2, "0") : String(now.getMonth() + 1).padStart(2, "0"),
    year: valid ? String(d.getFullYear()) : String(now.getFullYear()),
    hour: valid ? String(d.getHours()).padStart(2, "0") : "09",
    minute: valid ? String(d.getMinutes()).padStart(2, "0") : "00",
  };
}

function buildISO(day: string, month: string, year: string, hour: string, minute: string): string | undefined {
  const d = parseInt(day), m = parseInt(month), y = parseInt(year);
  const h = parseInt(hour), min = parseInt(minute);
  if (isNaN(d) || isNaN(m) || isNaN(y) || isNaN(h) || isNaN(min)) return undefined;
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2024) return undefined;
  if (h < 0 || h > 23 || min < 0 || min > 59) return undefined;
  const date = new Date(y, m - 1, d, h, min);
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export default function DeadlinePicker({ value, onChange }: DeadlinePickerProps) {
  const colors = useColors();
  const [showModal, setShowModal] = useState(false);

  const initial = value ? parseDateParts(value) : undefined;
  const now = new Date();
  const [day, setDay] = useState(initial?.day ?? String(now.getDate()).padStart(2, "0"));
  const [month, setMonth] = useState(initial?.month ?? String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(initial?.year ?? String(now.getFullYear()));
  const [hour, setHour] = useState(initial?.hour ?? "09");
  const [minute, setMinute] = useState(initial?.minute ?? "00");

  const hasDeadline = !!value;

  const handleConfirm = () => {
    const iso = buildISO(day, month, year, hour, minute);
    if (iso) onChange(iso);
    setShowModal(false);
  };

  const handleOpen = () => {
    if (value) {
      const parts = parseDateParts(value);
      setDay(parts.day);
      setMonth(parts.month);
      setYear(parts.year);
      setHour(parts.hour);
      setMinute(parts.minute);
    }
    setShowModal(true);
  };

  return (
    <View>
      <Pressable
        style={[styles.trigger, { borderColor: hasDeadline ? colors.champagne : colors.goldBorder }]}
        onPress={handleOpen}
      >
        <Feather name="clock" size={13} color={hasDeadline ? colors.champagne : colors.mutedForeground} strokeWidth={1.5} />
        <Text style={[styles.triggerText, { color: hasDeadline ? colors.champagne : colors.mutedForeground }]}>
          {hasDeadline ? humanDeadline(value!) : "Set deadline (optional)"}
        </Text>
        {hasDeadline && (
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onChange(undefined); }}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="x" size={13} color={colors.destructive} strokeWidth={1.5} />
          </Pressable>
        )}
      </Pressable>

      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setShowModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.gold }]}>Set Deadline</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>When should this be done?</Text>

            <View style={styles.dateRow}>
              <View style={styles.datePartBlock}>
                <Text style={[styles.datePartLabel, { color: colors.mutedForeground }]}>Day</Text>
                <TextInput
                  style={[styles.datePartInput, { backgroundColor: colors.secondary, color: colors.pearl, borderColor: colors.goldBorder }]}
                  value={day}
                  onChangeText={setDay}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="DD"
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="center"
                />
              </View>
              <Text style={[styles.dateSep, { color: colors.mutedForeground }]}>/</Text>
              <View style={styles.datePartBlock}>
                <Text style={[styles.datePartLabel, { color: colors.mutedForeground }]}>Month</Text>
                <TextInput
                  style={[styles.datePartInput, { backgroundColor: colors.secondary, color: colors.pearl, borderColor: colors.goldBorder }]}
                  value={month}
                  onChangeText={setMonth}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="center"
                />
              </View>
              <Text style={[styles.dateSep, { color: colors.mutedForeground }]}>/</Text>
              <View style={[styles.datePartBlock, { flex: 2 }]}>
                <Text style={[styles.datePartLabel, { color: colors.mutedForeground }]}>Year</Text>
                <TextInput
                  style={[styles.datePartInput, { backgroundColor: colors.secondary, color: colors.pearl, borderColor: colors.goldBorder }]}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="YYYY"
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="center"
                />
              </View>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.datePartBlock}>
                <Text style={[styles.datePartLabel, { color: colors.mutedForeground }]}>Hour</Text>
                <TextInput
                  style={[styles.datePartInput, { backgroundColor: colors.secondary, color: colors.pearl, borderColor: colors.goldBorder }]}
                  value={hour}
                  onChangeText={setHour}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="HH"
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="center"
                />
              </View>
              <Text style={[styles.dateSep, { color: colors.mutedForeground }]}>:</Text>
              <View style={styles.datePartBlock}>
                <Text style={[styles.datePartLabel, { color: colors.mutedForeground }]}>Minute</Text>
                <TextInput
                  style={[styles.datePartInput, { backgroundColor: colors.secondary, color: colors.pearl, borderColor: colors.goldBorder }]}
                  value={minute}
                  onChangeText={setMinute}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="center"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={({ pressed }) => [styles.modalCancelBtn, { borderColor: colors.goldBorder, opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [styles.modalConfirmBtn, { backgroundColor: colors.gold, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <Text style={[styles.modalConfirmText, { color: colors.primaryForeground }]}>Confirm</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 24,
    paddingLeft: 26,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.3,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  datePartBlock: {
    flex: 1,
    gap: 5,
  },
  datePartLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  datePartInput: {
    borderWidth: 0.5,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  dateSep: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    paddingBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  modalConfirmBtn: {
    flex: 2,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  webTextInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingVertical: 2,
  },
});
