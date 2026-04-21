import { Feather } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ContactPickerButtonProps {
  name: string;
  phone: string;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  namePlaceholder?: string;
}

export default function ContactPickerButton({
  name,
  phone,
  onNameChange,
  onPhoneChange,
  namePlaceholder = "Person name",
}: ContactPickerButtonProps) {
  const colors = useColors();
  const [picking, setPicking] = useState(false);

  const pickContact = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Contact picker is only available on mobile devices.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPicking(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow contact access to auto-fill person details.");
        return;
      }
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        onNameChange(contact.name ?? "");
        const firstPhone = contact.phoneNumbers?.[0]?.number ?? "";
        const cleaned = firstPhone.replace(/\D/g, "").slice(-10);
        onPhoneChange(cleaned);
      }
    } catch (e) {
      Alert.alert("Couldn't open contacts", "Try entering manually.");
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.inputWrap, { borderBottomColor: colors.gold + "80" }]}>
          <Feather name="user" size={14} color={colors.mutedForeground} strokeWidth={1.5} />
          <TextInput
            style={[styles.input, { color: colors.pearl }]}
            placeholder={namePlaceholder}
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={onNameChange}
            autoCapitalize="words"
          />
        </View>
        <Pressable
          onPress={pickContact}
          disabled={picking}
          style={({ pressed }) => [
            styles.pickerBtn,
            {
              backgroundColor: colors.gold + "18",
              borderColor: colors.gold + "50",
              opacity: pressed || picking ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Feather name="user-plus" size={14} color={colors.gold} strokeWidth={1.5} />
          <Text style={[styles.pickerLabel, { color: colors.gold }]}>
            {picking ? "..." : "Contacts"}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.inputWrap, { borderBottomColor: colors.gold + "80", marginTop: 12 }]}>
        <Feather name="phone" size={14} color={colors.mutedForeground} strokeWidth={1.5} />
        <TextInput
          style={[styles.input, { color: colors.pearl }]}
          placeholder="Mobile number (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={phone}
          onChangeText={onPhoneChange}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Satoshi-Regular",
    padding: 0,
    paddingVertical: 4,
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 0,
  },
  pickerLabel: { fontSize: 12, fontFamily: "Satoshi-Medium" },
});
