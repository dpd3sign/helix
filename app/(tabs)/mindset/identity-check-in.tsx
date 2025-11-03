import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const checkIns = [
  {
    prompt: "Did you embody your chosen identity today?",
    scale: "Yes / No / Almost",
  },
  { prompt: "Confidence index slider", scale: "0 – 100% self-rating" },
  { prompt: "Mood alignment", scale: "Calm · Focused · Driven · Off Balance" },
];

export default function IdentityCheckInScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.panel, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">Identity Check-In</ThemedText>
          <ThemedText style={styles.copy}>
            Quick daily touchpoint feeding the confidence index. Scores also
            inform adaptive nudges.
          </ThemedText>
        </View>

        <View style={styles.stack}>
          {checkIns.map((item) => (
            <View
              key={item.prompt}
              style={[styles.card, {
                backgroundColor: palette.surface,
                borderColor: palette.borderMuted,
              }]}
            >
              <ThemedText type="defaultSemiBold">{item.prompt}</ThemedText>
              <ThemedText style={styles.scale}>{item.scale}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20 },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  stack: {
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  scale: {
    fontSize: 13,
    opacity: 0.7,
  },
});
