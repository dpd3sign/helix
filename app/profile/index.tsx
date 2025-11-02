import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const links = [
  { label: 'Edit Profile', href: '/profile/edit' },
  { label: 'Manage Devices', href: '/profile/devices' },
  { label: 'Notifications & Preferences', href: '/profile/preferences' },
  { label: 'Subscription & Billing', href: '/profile/billing' },
];

export default function ProfileOverviewScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
          <ThemedText type="subtitle">Profile Overview</ThemedText>
          <ThemedText style={styles.copy}>
            Avatar, selected identity archetype, and subscription status summary will appear here.
          </ThemedText>
        </View>
        <View style={styles.links}>
          {links.map(link => (
            <Link key={link.label} href={link.href} asChild>
              <Pressable style={[styles.linkCard, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
                <ThemedText type="defaultSemiBold">{link.label}</ThemedText>
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
  links: {
    gap: 12,
  },
  linkCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});
