import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const deck = [
  { identity: 'Athlete Scholar', message: 'Precision builds confidence. Every rep rewires more than muscle.' },
  { identity: 'Modern Warrior', message: 'Discipline is a decision you make every hour.' },
  { identity: 'Artisan Performer', message: 'Flow follows unconventional discipline. Move with intent.' },
];

export default function AffirmationsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
          <ThemedText type="subtitle">Affirmation Deck</ThemedText>
          <ThemedText style={styles.copy}>
            In production, users can favorite, schedule, and create their own affirmations filtered by context trigger.
          </ThemedText>
        </View>
        <View style={styles.deck}>
          {deck.map(card => (
            <View
              key={card.identity}
              style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}
            >
              <ThemedText type="defaultSemiBold">{card.identity}</ThemedText>
              <ThemedText style={styles.message}>{card.message}</ThemedText>
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
  deck: {
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
});
