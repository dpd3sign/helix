import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function PhysiqueVisualizerScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">Physique Visualizer (Phase 2)</ThemedText>
          <ThemedText style={styles.copy}>
            Placeholder for the advanced 3D body visualization module. Integrate
            with scanning hardware or manual measurement interpolation.
          </ThemedText>
        </View>
        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="defaultSemiBold">Implementation Notes</ThemedText>
          <ThemedText style={styles.copy}>
            • Store GLB models in Supabase Storage.
          </ThemedText>
          <ThemedText style={styles.copy}>
            • Link metadata table (`body_models`) with measurement snapshots.
          </ThemedText>
          <ThemedText style={styles.copy}>
            • Render using Expo GL / external viewer in future milestone.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
});
