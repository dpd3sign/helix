import { ScrollView, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ContactSupportScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle">Contact Support / Bug Report</ThemedText>
        <ThemedText style={styles.copy}>
          This form will POST to Supabase edge function or support ticket
          system.
        </ThemedText>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Subject"
            placeholderTextColor="#7A8696"
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the issue"
            placeholderTextColor="#7A8696"
            multiline
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 16 },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  form: {
    gap: 12,
    marginTop: 12,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8DEE9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  textarea: {
    minHeight: 140,
    textAlignVertical: "top",
  },
});
