import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

const items = [
  { name: 'Salmon fillets', quantity: '4 x 6oz' },
  { name: 'Jasmine rice', quantity: '2 lb' },
  { name: 'Mixed greens', quantity: '1 large bag' },
  { name: 'Greek yogurt', quantity: '32 oz' },
  { name: 'Berries mix', quantity: '3 cups' },
];

export default function GroceryListModal() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string }>();

  const handleExport = async () => {
    if (!params.planId) {
      Alert.alert('Plan missing', 'Open the grocery list from an active plan.');
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('export-grocery-list', {
        body: { plan_id: params.planId },
      });
      if (error) throw error;
      Alert.alert('Export queued', 'Your grocery list will be delivered to the configured integration.');
    } catch (error) {
      Alert.alert('Export failed', (error as Error).message ?? 'Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Grocery List' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.copy}>
          Export hooks will send this list to Instacart or similar. Toggle purchased or auto-synced via Supabase updates.
        </ThemedText>
        <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
          {items.map(item => (
            <View key={item.name} style={styles.listRow}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText style={styles.listQuantity}>{item.quantity}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footerRow}>
        <Pressable style={styles.exportButton} onPress={handleExport}>
          <ThemedText style={styles.exportText}>Export</ThemedText>
        </Pressable>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <ThemedText style={styles.closeText}>Close</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  content: { gap: 18 },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  listCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listQuantity: {
    fontSize: 13,
    opacity: 0.75,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  exportButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F6FEB',
  },
  exportText: {
    color: '#1F6FEB',
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1F6FEB',
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
