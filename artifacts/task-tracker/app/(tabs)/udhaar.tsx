import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
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
import UdhaarLedgerModal from "@/components/UdhaarLedgerModal";
import UdhaarCard from "@/components/UdhaarCard";
import { Udhaar, UdhaarType, useUdhaar } from "@/context/UdhaarContext";
import { useColors } from "@/hooks/useColors";

const LENT_GOLD = "#D4AF37";
const BORROWED_GREY = "#A3A3A3";

type TypeFilter = "All" | "Lent" | "Borrowed";
type SortMode = "date" | "amount" | "due";

function rupeeFormat(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

function sortEntries(list: Udhaar[], mode: SortMode): Udhaar[] {
  return [...list].sort((a, b) => {
    if (mode === "amount") return (b.amount - b.settled_amount) - (a.amount - a.settled_amount);
    if (mode === "due") {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default function UdhaarScreen() {
  const colors = useColors();
  const { entries, loading, addUdhaar, deleteUdhaar } = useUdhaar();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [ledgerEntry, setLedgerEntry] = useState<Udhaar | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("date");

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 + 50 : insets.bottom + 84;

  const filteredEntries = useMemo(() => {
    let list = typeFilter === "All" ? entries : entries.filter((e) => e.type === typeFilter);
    return list;
  }, [entries, typeFilter]);

  const active = useMemo(() => sortEntries(filteredEntries.filter((e) => e.status === "Active"), sortMode), [filteredEntries, sortMode]);
  const settled = useMemo(() => sortEntries(filteredEntries.filter((e) => e.status === "Settled"), sortMode), [filteredEntries, sortMode]);

  const totalReceivable = entries
    .filter((e) => e.type === "Lent" && e.status === "Active")
    .reduce((s, e) => s + (e.amount - e.settled_amount), 0);
  const totalPayable = entries
    .filter((e) => e.type === "Borrowed" && e.status === "Active")
    .reduce((s, e) => s + (e.amount - e.settled_amount), 0);
  const netPosition = totalReceivable - totalPayable;

  const sections = [
    ...(active.length > 0 ? [{ title: "Active", data: active }] : []),
    ...(settled.length > 0 ? [{ title: "Settled History", data: settled }] : []),
  ];

  const selectSort = (mode: SortMode) => {
    Haptics.selectionAsync();
    setSortMode(mode);
  };

  const selectType = (t: TypeFilter) => {
    Haptics.selectionAsync();
    setTypeFilter(t);
  };

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
          <UdhaarCard entry={item} onOpenLedger={setLedgerEntry} onDelete={deleteUdhaar} />
        )}
        renderSectionHeader={({ section }) =>
          section.title === "Settled History" ? (
            <View style={[styles.sectionHeader, { borderTopColor: colors.border }]}>
              <Feather name="archive" size={13} color={colors.mutedForeground} strokeWidth={1.5} />
              <Text style={[styles.sectionHeaderText, { color: colors.mutedForeground }]}>
                Settled History
              </Text>
            </View>
          ) : null
        }
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
                <Text style={[styles.dashAmount, { color: LENT_GOLD }]}>{rupeeFormat(totalReceivable)}</Text>
              </View>

              <View style={[styles.dashCard, { backgroundColor: colors.card, borderColor: colors.goldBorder }]}>
                <View style={styles.dashCardTop}>
                  <Feather name="arrow-down-left" size={13} color={BORROWED_GREY} strokeWidth={1.5} />
                  <Text style={[styles.dashLabel, { color: colors.mutedForeground }]}>To Pay</Text>
                </View>
                <Text style={[styles.dashAmount, { color: BORROWED_GREY }]}>{rupeeFormat(totalPayable)}</Text>
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
                {netPosition > 0 ? "People owe you more than you owe" : netPosition < 0 ? "You owe more than you're owed" : "All balanced out"}
              </Text>
            </View>

            <View style={[styles.controlsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
              <View style={styles.typeFilters}>
                {(["All", "Lent", "Borrowed"] as TypeFilter[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => selectType(t)}
                    style={({ pressed }) => [
                      styles.typeChip,
                      {
                        backgroundColor: typeFilter === t
                          ? t === "Lent" ? LENT_GOLD : t === "Borrowed" ? BORROWED_GREY : colors.gold
                          : colors.card,
                        borderColor: typeFilter === t
                          ? t === "Lent" ? LENT_GOLD : t === "Borrowed" ? BORROWED_GREY : colors.gold
                          : colors.goldBorder,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    {t === "Lent" && <Feather name="arrow-up-right" size={11} color={typeFilter === t ? "#fff" : LENT_GOLD} strokeWidth={1.5} />}
                    {t === "Borrowed" && <Feather name="arrow-down-left" size={11} color={typeFilter === t ? "#fff" : BORROWED_GREY} strokeWidth={1.5} />}
                    <Text style={[styles.typeChipText, { color: typeFilter === t ? "#fff" : colors.mutedForeground }]}>
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.sortBtns}>
                <Text style={[styles.sortByLabel, { color: colors.mutedForeground }]}>Sort:</Text>
                {([["date", "clock"], ["amount", "dollar-sign"], ["due", "calendar"]] as [SortMode, string][]).map(([mode, icon]) => (
                  <Pressable
                    key={mode}
                    onPress={() => selectSort(mode)}
                    style={({ pressed }) => [
                      styles.sortBtn,
                      {
                        backgroundColor: sortMode === mode ? colors.gold + "20" : "transparent",
                        borderColor: sortMode === mode ? colors.gold : colors.goldBorder,
                        transform: [{ scale: pressed ? 0.92 : 1 }],
                      },
                    ]}
                  >
                    <Feather name={icon as any} size={12} color={sortMode === mode ? colors.gold : colors.mutedForeground} strokeWidth={1.5} />
                  </Pressable>
                ))}
              </View>
            </View>

            {(typeFilter !== "All" || sortMode !== "date") && (
              <View style={styles.activeFiltersRow}>
                <Text style={[styles.activeFiltersText, { color: colors.mutedForeground }]}>
                  {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
                  {typeFilter !== "All" ? ` · ${typeFilter} only` : ""}
                  {sortMode !== "date" ? ` · sorted by ${sortMode}` : ""}
                </Text>
                <Pressable onPress={() => { setTypeFilter("All"); setSortMode("date"); }} hitSlop={8}>
                  <Text style={[styles.clearBtn, { color: colors.gold }]}>Reset</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Feather name="credit-card" size={40} color={colors.border} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              {typeFilter !== "All" ? `No ${typeFilter} entries` : "No Udhaar entries yet"}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>
              {typeFilter !== "All" ? "Try switching the filter" : "Tap + to record lending or borrowing"}
            </Text>
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
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

      <AddUdhaarModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addUdhaar} />

      <UdhaarLedgerModal
        visible={!!ledgerEntry}
        entry={ledgerEntry}
        onClose={() => setLedgerEntry(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16 },
  headerBlock: { gap: 10, paddingBottom: 14 },
  pageTitle: { fontSize: 30, fontFamily: "Satoshi-Black", letterSpacing: 0.3, marginTop: 8 },
  pageSubtitle: { fontSize: 12, fontFamily: "Satoshi-Regular", letterSpacing: 1, marginBottom: 6 },
  dashboardRow: { flexDirection: "row", gap: 10 },
  dashCard: { flex: 1, borderWidth: 0.5, borderRadius: 10, padding: 14, gap: 8 },
  dashCardTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  dashLabel: { fontSize: 10, fontFamily: "Satoshi-Medium", letterSpacing: 0.5 },
  dashAmount: { fontSize: 22, fontFamily: "Satoshi-Bold" },
  netCard: { borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
  netCardInner: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  netLabel: { fontSize: 11, fontFamily: "Satoshi-Medium", letterSpacing: 0.5 },
  netAmount: { fontSize: 26, fontFamily: "Satoshi-Bold" },
  netHint: { fontSize: 11, fontFamily: "Satoshi-Regular" },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    paddingVertical: 10,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    gap: 10,
  },
  typeFilters: { flexDirection: "row", gap: 6 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 0.5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeChipText: { fontSize: 11, fontFamily: "Satoshi-Medium" },
  sortBtns: { flexDirection: "row", alignItems: "center", gap: 5 },
  sortByLabel: { fontSize: 10, fontFamily: "Satoshi-Regular", marginRight: 2 },
  sortBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  activeFiltersText: { fontSize: 11, fontFamily: "Satoshi-Regular" },
  clearBtn: { fontSize: 11, fontFamily: "Satoshi-Medium" },
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
