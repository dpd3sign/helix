import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useOnboarding } from "@/providers/onboarding-provider";

const goalOptions = [
  { label: "Recomposition", value: "recomposition" },
  { label: "Strength Gain", value: "strength_gain" },
  { label: "Cutting", value: "cutting" },
  { label: "Endurance", value: "endurance" },
];

const equipmentOptions = [
  "Full Gym",
  "Minimal Equipment",
  "Bodyweight Only",
  "Wearable Sensors",
];

const styleOptions: { label: string; value: "aesthetic" | "functional" }[] = [
  { label: "Aesthetic", value: "aesthetic" },
  { label: "Functional", value: "functional" },
];

export default function GoalsEquipmentScreen() {
  const router = useRouter();
  const { setGoals } = useOnboarding();
  const [goalType, setGoalType] = useState<
    "recomposition" | "strength_gain" | "cutting" | "endurance"
  >("recomposition");
  const [equipment, setEquipment] = useState<string[]>(["Minimal Equipment"]);
  const [style, setStyle] = useState<"aesthetic" | "functional">("functional");

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item)
        ? prev.filter((value) => value !== item)
        : [...prev, item]
    );
  };

  const handleContinue = () => {
    if (equipment.length === 0) {
      Alert.alert(
        "Select equipment",
        "Choose at least one equipment option to continue.",
      );
      return;
    }

    setGoals({
      goalType,
      equipmentAvailable: equipment,
      preferredStyle: style,
    });

    router.push("/(onboarding)/wearable-sync");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Goals & Equipment</ThemedText>
      <ThemedText style={styles.copy}>
        These selections guide plan periodization and exercise availability.
        Choose the combination that reflects your real environment.
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Goal Focus</ThemedText>
        <View style={styles.chipRow}>
          {goalOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.chip,
                goalType === option.value && styles.chipActive,
              ]}
              onPress={() => setGoalType(option.value)}
            >
              <ThemedText
                style={goalType === option.value
                  ? styles.chipActiveLabel
                  : styles.chipLabel}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Equipment Available</ThemedText>
        <View style={styles.chipRow}>
          {equipmentOptions.map((item) => {
            const active = equipment.includes(item);
            return (
              <Pressable
                key={item}
                onPress={() => toggleEquipment(item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <ThemedText
                  style={active ? styles.chipActiveLabel : styles.chipLabel}
                >
                  {item}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Preferred Training Style</ThemedText>
        <View style={styles.chipRow}>
          {styleOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setStyle(option.value)}
              style={[styles.chip, style === option.value && styles.chipActive]}
            >
              <ThemedText
                style={style === option.value
                  ? styles.chipActiveLabel
                  : styles.chipLabel}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={styles.nextButton} onPress={handleContinue}>
        <ThemedText style={styles.nextText}>Continue</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
  },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  section: {
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1F6FEB55",
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F6FEB",
  },
  chipActive: {
    backgroundColor: "#1F6FEB",
    borderColor: "#1F6FEB",
  },
  chipActiveLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nextButton: {
    marginTop: "auto",
    alignSelf: "flex-end",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#1F6FEB",
  },
  nextText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
