import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

const inputs = [
  "HRV trend (7 day)",
  "Sleep duration deviation",
  "Step volume vs target",
  "User feedback notes",
];

export default function PlanGeneratorModal() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Regenerate Plan" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.copy}>
          This modal explains the regeneration flow: fetch context, score
          readiness, rebuild meals/workouts, and log adjustments.
        </ThemedText>

        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">Inputs Considered</ThemedText>
          {inputs.map((item) => (
            <ThemedText key={item} style={styles.listItem}>
              • {item}
            </ThemedText>
          ))}
        </View>

        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">Output</ThemedText>
          <ThemedText style={styles.copy}>
            Generates new weekly plan entries, updates `adjustments_made`, and
            notifies the AI coach to brief the user.
          </ThemedText>
        </View>
      </ScrollView>

      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <ThemedText style={styles.closeText}>Close</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  content: { gap: 20 },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 24,
    alignSelf: "flex-end",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#1F6FEB",
  },
  closeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
