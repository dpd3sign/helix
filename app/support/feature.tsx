import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function FeatureIdeaScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle">Submit Feature Idea</ThemedText>
        <ThemedText style={styles.copy}>
          Capture user ideas for roadmap prioritization. Persist to Supabase `feature_requests` table.
        </ThemedText>
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Feature Title" placeholderTextColor="#7A8696" />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe your idea"
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
    borderColor: '#D8DEE9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textarea: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
});
