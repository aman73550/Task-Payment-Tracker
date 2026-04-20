import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddUdhaarModal from "@/components/AddUdhaarModal";
import PartialSettleModal from "@/components/PartialSettleModal";
import UdhaarCard from "@/components/UdhaarCard";
import { Udhaar, useUdhaar } from "@/context/UdhaarContext";
import { useColors } from "@/hooks/useColors";

const LENT_GOLD = "#D4AF37";
const BORROWED_GREY = "#A3A3A3";

function rupeeFormat(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function UdhaarScreen() {
  const colors = useColors();
  const { entries, loading, addUdhaar, settlePartial, markFullySettled, deleteUdhaar } = useUdhaar();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [settleEntry, setSettleEntry] = useState<Udhaar | null>(null);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 84;

  const active = entries.filter((e) => e.status === "Active");
  const settled = entries.filter((e) => e.status === "Settled");

  const totalReceivable = active
    .filter((e) => e.type === "Lent")
    .reduce((s, e) => s + (e.amount - e.settled_amount), 0);

  const totalPayable = active
    .filter((e) => e.type === "Borrowed")
    .reduce((s, e) => s + (e.amount - e.settled_amount), 0);

  const netPosition = totalReceivable - totalPayable;

  const sections = [
    ...(active.length > 0 ? [{ title: "Active", data: active }] : []),
    ...(settled.length > 0 ? [{ title: "Settled History", data: settled }] : []),
  ];

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UdhaarCard entry={item} onSettle={setSettleEntry} onDelete={deleteUdhaar} />
        )}
        renderSectionHeader={({ section }) => (
          section.title === "Settled History" ? (
            <View style={[styles.sectionHeader, { borderTopColor: colors.border }]}>
              <Feather name="archive" size={13} color={colors.mutedForeground} strokeWidth={1.5} />
              <Text style={[styles.sectionHeaderText, { color: colors.mutedForeground }]}>
                Settled History
              </Text>
            </View>
          ) : null
        )}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={[styles.pageTitle, { color: colors.gold }]}>Udhaar</Text>
            <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
              lena · dena · hisaab
            </Text>

            <View style={styles.dashboardRow}>
              <View style={[styles.dashCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
                <View style={styles.dashCardTop}>
                  <Feather name="arrow-up-right" size={13} color={LENT_GOLD} strokeWidth={1.5} />
                  <Text style={[styles.dashLabel, { color: colors.mutedForeground }]}>To Receive</Text>
                </View>
                <Text style={[styles.dashAmount, { color: LENT_GOLD }]}>
                  {rupeeFormat(totalReceivable)}
                </Text>
              </View>

              <View style={[styles.dashCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
                <View style={styles.dashCardTop}>
                  <Feather name="arrow-down-left" size={13} color={BORROWED_GREY} strokeWidth={1.5} />
                  <Text style={[styles.dashLabel, { color: colors.mutedForeground }]}>To Pay</Text>
                </View>
                <Text style={[styles.dashAmount, { color: BORROWED_GREY }]}>
                  {rupeeFormat(totalPayable)}
                </Text>
              </View>
            </View>

            <View style={[styles.netCard, {
              backgroundColor: netPosition >= 0 ? LENT_GOLD + "12" : BORROWED_GREY + "12",
              borderColor: netPosition >= 0 ? LENT_GOLD + "40" : BORROWED_GREY + "40",
            }]}>
              <View style={styles.netCardInner}>
                <Text style={[styles.netLabel, { color: colors.mutedForeground }]}>Net Position</Text>
                <Text style={[styles.netAmount, { color: netPosition >= 0 ? LENT_GOLD : BORROWED_GREY }]}>
                  {netPosition >= 0 ? "+" : ""}{rupeeFormat(Math.abs(netPosition))}
                </Text>
              </View>
              <Text style={[styles.netHint, { color: colors.mutedForeground }]}>
                {netPosition > 0
                  ? "People owe you more than you owe"
                  : netPosition < 0
                  ? "You owe more than you're owed"
                  : "All balanced out"}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Feather name="credit-card" size={40} color={colors.border} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              No Udhaar entries yet
            </Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>
              Tap + to record lending or borrowing
            </Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: topPad, paddingBottom: bottomPad },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAdd(true);
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.gold,
            borderColor: colors.gold,
            bottom: bottomPad + 16,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Feather name="plus" size={26} color={colors.primaryForeground} strokeWidth={1.5} />
      </Pressable>

      <AddUdhaarModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addUdhaar}
      />

      <PartialSettleModal
        visible={!!settleEntry}
        entry={settleEntry}
        onClose={() => setSettleEntry(null)}
        onSettle={(amount, note) => {
          if (settleEntry) settlePartial(settleEntry.id, amount, note);
        }}
        onFullSettle={() => {
          if (settleEntry) markFullySettled(settleEntry.id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16 },
  headerBlock: { gap: 10, paddingBottom: 20 },
  pageTitle: { fontSize: 30, fontFamily: "Satoshi-Black", letterSpacing: 0.3, marginTop: 8 },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: "Satoshi-Regular",
    letterSpacing: 1,
    marginBottom: 6,
  },
  dashboardRow: { flexDirection: "row", gap: 10 },
  dashCard: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  dashCardTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  dashLabel: { fontSize: 10, fontFamily: "Satoshi-Medium", letterSpacing: 0.5 },
  dashAmount: { fontSize: 22, fontFamily: "Satoshi-Bold" },
  netCard: {
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  netCardInner: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  netLabel: { fontSize: 11, fontFamily: "Satoshi-Medium", letterSpacing: 0.5 },
  netAmount: { fontSize: 26, fontFamily: "Satoshi-Bold" },
  netHint: { fontSize: 11, fontFamily: "Satoshi-Regular" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 20,
    paddingBottom: 10,
    borderTopWidth: 0.5,
    marginTop: 8,
  },
  sectionHeaderText: { fontSize: 11, fontFamily: "Satoshi-Medium", letterSpacing: 0.5 },
  emptyView: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 17, fontFamily: "Satoshi-Bold" },
  emptyHint: { fontSize: 13, fontFamily: "Satoshi-Regular" },
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
