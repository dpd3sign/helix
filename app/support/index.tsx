import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const options = [
  { label: 'Contact Support / Bug Report', href: '/support/contact' },
  { label: 'Submit Feature Idea', href: '/support/feature' },
];

export default function HelpCenterScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
          <ThemedText type="subtitle">Help Center</ThemedText>
          <ThemedText style={styles.copy}>
            FAQ content will live here. Link to documentation, wearable troubleshooting, and identity coaching best practices.
          </ThemedText>
        </View>
        <View style={styles.links}>
          {options.map(option => (
            <Link key={option.label} href={option.href} asChild>
              <Pressable style={[styles.linkCard, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
                <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20 },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  links: {
    gap: 12,
  },
  linkCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});
