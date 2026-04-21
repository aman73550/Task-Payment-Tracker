import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AnimatedListItem from "@/components/AnimatedListItem";
import { Task, useTasks } from "@/context/TasksContext";
import { Udhaar, useUdhaar } from "@/context/UdhaarContext";
import { useColors } from "@/hooks/useColors";

const GOLD = "#D4AF37";
const LENT_COLOR = "#D4AF37";
const BORROWED_COLOR = "#A3A3A3";

function rupeeFormat(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

interface PersonProfile {
  key: string;
  name: string;
  phone?: string;
  tasks: Task[];
  udhaarEntries: Udhaar[];
  totalBilled: number;
  cashReceived: number;
  netUdhaar: number;
}

function buildPersonRegistry(tasks: Task[], udhaarList: Udhaar[]): PersonProfile[] {
  const registry = new Map<string, PersonProfile>();

  const getKey = (name: string, phone?: string) => {
    if (phone && phone.length >= 10) return phone.slice(-10);
    return name.trim().toLowerCase();
  };

  for (const task of tasks) {
    if (!task.person_name && !task.phone) continue;
    const key = getKey(task.person_name ?? task.task_name, task.phone);
    if (!registry.has(key)) {
      registry.set(key, {
        key,
        name: task.person_name ?? task.task_name,
        phone: task.phone,
        tasks: [],
        udhaarEntries: [],
        totalBilled: 0,
        cashReceived: 0,
        netUdhaar: 0,
      });
    }
    const p = registry.get(key)!;
    p.tasks.push(task);
    p.totalBilled += task.total_amount;
    p.cashReceived += task.paid_amount;
  }

  for (const entry of udhaarList) {
    const key = getKey(entry.person_name, entry.phone);
    if (!registry.has(key)) {
      registry.set(key, {
        key,
        name: entry.person_name,
        phone: entry.phone,
        tasks: [],
        udhaarEntries: [],
        totalBilled: 0,
        cashReceived: 0,
        netUdhaar: 0,
      });
    }
    const p = registry.get(key)!;
    p.udhaarEntries.push(entry);
    const balance = entry.amount - entry.settled_amount;
    p.netUdhaar += entry.type === "Lent" ? balance : -balance;
  }

  return Array.from(registry.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function PersonCard({ person, index, onPress }: { person: PersonProfile; index: number; onPress: () => void }) {
  const colors = useColors();
  const outstanding = person.totalBilled - person.cashReceived;
  const udhaarAbs = Math.abs(person.netUdhaar);

  return (
    <AnimatedListItem index={index}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.personCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.goldBorder,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <View style={styles.personTop}>
          <View style={[styles.avatarCircle, { backgroundColor: GOLD + "18", borderColor: GOLD + "40" }]}>
            <Text style={[styles.avatarLetter, { color: GOLD }]}>
              {person.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.personMeta}>
            <Text style={[styles.personName, { color: colors.pearl }]}>{person.name}</Text>
            {person.phone ? (
              <Text style={[styles.personPhone, { color: colors.mutedForeground }]}>{person.phone}</Text>
            ) : null}
          </View>

          <Feather name="chevron-right" size={16} color={colors.mutedForeground} strokeWidth={1.5} />
        </View>

        <View style={[styles.statsRow, { borderTopColor: colors.goldBorder }]}>
          {person.tasks.length > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.pearl }]}>{person.tasks.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>tasks</Text>
            </View>
          )}
          {outstanding > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.champagne }]}>{rupeeFormat(outstanding)}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>pending</Text>
            </View>
          )}
          {udhaarAbs > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: person.netUdhaar > 0 ? LENT_COLOR : BORROWED_COLOR }]}>
                {person.netUdhaar > 0 ? "+" : "-"}{rupeeFormat(udhaarAbs)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {person.netUdhaar > 0 ? "they owe" : "you owe"}
              </Text>
            </View>
          )}
          {person.tasks.length === 0 && udhaarAbs === 0 && outstanding === 0 && (
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>No pending balances</Text>
          )}
        </View>
      </Pressable>
    </AnimatedListItem>
  );
}

function PersonLedger({ person, onClose }: { person: PersonProfile; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const outstanding = person.totalBilled - person.cashReceived;
  const udhaarAbs = Math.abs(person.netUdhaar);

  const timeline = [
    ...person.tasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      date: t.created_at,
      title: t.task_name,
      amount: t.total_amount,
      paid: t.paid_amount,
      done: t.work_done,
    })),
    ...person.udhaarEntries.map((u) => ({
      id: u.id,
      type: "udhaar" as const,
      date: u.created_at,
      title: u.type === "Lent" ? `Lent to ${person.name}` : `Borrowed from ${person.name}`,
      amount: u.amount,
      settled: u.settled_amount,
      balance: u.amount - u.settled_amount,
      udhaarType: u.type,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={[styles.ledger, { backgroundColor: colors.background, paddingTop: insets.top || 16 }]}>
      <View style={[styles.ledgerHeader, { borderBottomColor: colors.goldBorder }]}>
        <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Feather name="arrow-left" size={20} color={colors.pearl} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.ledgerTitleWrap}>
          <Text style={[styles.ledgerName, { color: colors.pearl }]}>{person.name}</Text>
          {person.phone ? <Text style={[styles.ledgerPhone, { color: colors.mutedForeground }]}>{person.phone}</Text> : null}
        </View>
        <View style={styles.avatarSmall}>
          <Text style={[styles.avatarLetter, { color: GOLD, fontSize: 14 }]}>
            {person.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[styles.summaryStrip, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: colors.champagne }]}>{rupeeFormat(person.totalBilled)}</Text>
          <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>Total billed</Text>
        </View>
        {outstanding > 0 && (
          <View style={[styles.summaryItem, { borderLeftWidth: 0.5, borderLeftColor: colors.goldBorder }]}>
            <Text style={[styles.summaryVal, { color: colors.warning }]}>{rupeeFormat(outstanding)}</Text>
            <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>Pending</Text>
          </View>
        )}
        {udhaarAbs > 0 && (
          <View style={[styles.summaryItem, { borderLeftWidth: 0.5, borderLeftColor: colors.goldBorder }]}>
            <Text style={[styles.summaryVal, { color: person.netUdhaar > 0 ? LENT_COLOR : BORROWED_COLOR }]}>
              {person.netUdhaar > 0 ? "+" : "-"}{rupeeFormat(udhaarAbs)}
            </Text>
            <Text style={[styles.summaryKey, { color: colors.mutedForeground }]}>Net udhaar</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.timelineList, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.timelineTitle, { color: colors.mutedForeground }]}>ACTIVITY TIMELINE</Text>

        {timeline.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No activity yet.</Text>
        )}

        {timeline.map((item, i) => (
          <Animated.View
            key={item.id + item.type}
            entering={FadeInDown.delay(i * 60).springify().damping(16)}
            style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}
          >
            <View style={styles.timelineTop}>
              <View style={[styles.timelineIcon, {
                backgroundColor: item.type === "task" ? colors.gold + "18" : LENT_COLOR + "18",
              }]}>
                <Feather
                  name={item.type === "task" ? "file-text" : "repeat"}
                  size={12}
                  color={item.type === "task" ? colors.gold : LENT_COLOR}
                  strokeWidth={1.5}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.timelineItemTitle, { color: colors.pearl }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.timelineDate, { color: colors.mutedForeground }]}>
                  {formatDate(item.date)}
                </Text>
              </View>
              {item.type === "task" && (
                <Text style={[styles.timelineAmount, { color: colors.champagne }]}>
                  {rupeeFormat(item.amount)}
                </Text>
              )}
              {item.type === "udhaar" && (
                <Text style={[styles.timelineAmount, { color: item.udhaarType === "Lent" ? LENT_COLOR : BORROWED_COLOR }]}>
                  {rupeeFormat(item.amount)}
                </Text>
              )}
            </View>
            {item.type === "task" && (
              <View style={styles.timelineStatus}>
                <View style={[styles.statusDot, { backgroundColor: item.done ? colors.success : colors.gold }]} />
                <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                  {item.done ? "Work done" : "In progress"} · {item.paid > 0 ? rupeeFormat(item.paid) + " received" : "Payment pending"}
                </Text>
              </View>
            )}
            {item.type === "udhaar" && "balance" in item && (
              <View style={styles.timelineStatus}>
                <View style={[styles.statusDot, { backgroundColor: item.balance === 0 ? colors.success : LENT_COLOR }]} />
                <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                  {item.balance === 0 ? "Fully settled" : `${rupeeFormat(item.balance)} remaining`}
                </Text>
              </View>
            )}
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function ContactsScreen() {
  const colors = useColors();
  const { tasks } = useTasks();
  const { entries } = useUdhaar();
  const insets = useSafeAreaInsets();
  const [selectedPerson, setSelectedPerson] = useState<PersonProfile | null>(null);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 84;

  const people = useMemo(() => buildPersonRegistry(tasks, entries), [tasks, entries]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={people}
        keyExtractor={(p) => p.key}
        renderItem={({ item, index }) => (
          <PersonCard
            person={item}
            index={index}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPerson(item);
            }}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.delay(0).duration(500)}>
            <Text style={[styles.screenTitle, { color: colors.gold }]}>People</Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
              {people.length === 0
                ? "Add tasks or udhaar with a person's name to see them here."
                : `${people.length} contact${people.length !== 1 ? "s" : ""} · full business view`}
            </Text>
          </Animated.View>
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Feather name="users" size={44} color={colors.border} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No contacts yet</Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>
              When you add tasks or udhaar with a person's name, they'll show up here.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!selectedPerson} animationType="slide" presentationStyle="fullScreen">
        {selectedPerson && (
          <PersonLedger person={selectedPerson} onClose={() => setSelectedPerson(null)} />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, gap: 0 },
  screenTitle: { fontSize: 26, fontFamily: "Satoshi-Black", letterSpacing: 0.5, marginBottom: 4, paddingTop: 8 },
  screenSubtitle: { fontSize: 11, fontFamily: "Satoshi-Regular", letterSpacing: 0.5, marginBottom: 18 },
  personCard: {
    borderRadius: 10,
    borderWidth: 0.5,
    marginBottom: 10,
    overflow: "hidden",
  },
  personTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  avatarSmall: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: GOLD + "18",
    alignItems: "center", justifyContent: "center",
  },
  avatarLetter: { fontSize: 16, fontFamily: "Satoshi-Black" },
  personMeta: { flex: 1, gap: 2 },
  personName: { fontSize: 15, fontFamily: "Satoshi-Bold" },
  personPhone: { fontSize: 11, fontFamily: "Satoshi-Regular" },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 20,
  },
  statItem: { gap: 2 },
  statVal: { fontSize: 13, fontFamily: "Satoshi-Bold" },
  statLabel: { fontSize: 10, fontFamily: "Satoshi-Regular" },
  emptyView: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Satoshi-Bold" },
  emptyHint: { fontSize: 13, fontFamily: "Satoshi-Regular", textAlign: "center" },
  ledger: { flex: 1 },
  ledgerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  ledgerTitleWrap: { flex: 1, gap: 2 },
  ledgerName: { fontSize: 17, fontFamily: "Satoshi-Black" },
  ledgerPhone: { fontSize: 11, fontFamily: "Satoshi-Regular" },
  summaryStrip: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderTopWidth: 0.5,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 4,
  },
  summaryVal: { fontSize: 16, fontFamily: "Satoshi-Bold" },
  summaryKey: { fontSize: 10, fontFamily: "Satoshi-Regular" },
  timelineList: { paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  timelineTitle: { fontSize: 9, fontFamily: "Satoshi-Bold", letterSpacing: 1.8, marginBottom: 6 },
  timelineCard: {
    borderRadius: 8,
    borderWidth: 0.5,
    padding: 12,
    gap: 8,
  },
  timelineTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  timelineIcon: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  timelineItemTitle: { fontSize: 13, fontFamily: "Satoshi-Bold" },
  timelineDate: { fontSize: 10, fontFamily: "Satoshi-Regular" },
  timelineAmount: { fontSize: 14, fontFamily: "Satoshi-Bold" },
  timelineStatus: { flexDirection: "row", alignItems: "center", gap: 7, paddingLeft: 38 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Satoshi-Regular" },
  emptyText: { fontSize: 13, fontFamily: "Satoshi-Regular", textAlign: "center", marginTop: 20 },
});
