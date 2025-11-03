import { ScrollView, StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const preferences = [
  "Daily readiness notification",
  "Meal plan adjustments",
  "Mindset prompts",
  "Weekly progress summary email",
];

export default function PreferencesScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle">Notifications & Preferences</ThemedText>
        <ThemedText style={styles.copy}>
          Tie these toggles into Supabase `user_settings` table.
        </ThemedText>
        <View style={styles.list}>
          {preferences.map((pref) => (
            <View key={pref} style={styles.row}>
              <ThemedText>{pref}</ThemedText>
              <Switch value={false} />
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 18 },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  list: {
    gap: 16,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D8DEE9",
  },
});
