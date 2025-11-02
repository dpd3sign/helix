import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const invoices = [
  { id: 'INV-001', amount: '$29', status: 'Paid', date: '2024-12-01' },
  { id: 'INV-002', amount: '$29', status: 'Paid', date: '2025-01-01' },
];

export default function BillingScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
          <ThemedText type="subtitle">Subscription & Billing</ThemedText>
          <ThemedText style={styles.copy}>
            Stripe customer portal integration will live here. Display plan details, renewal dates, and invoice history.
          </ThemedText>
        </View>
        <View style={styles.invoiceStack}>
          {invoices.map(invoice => (
            <View key={invoice.id} style={[styles.invoiceCard, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
              <ThemedText type="defaultSemiBold">{invoice.id}</ThemedText>
              <ThemedText>{invoice.amount}</ThemedText>
              <ThemedText style={styles.detail}>Status: {invoice.status}</ThemedText>
              <ThemedText style={styles.detail}>Date: {invoice.date}</ThemedText>
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
  invoiceStack: {
    gap: 12,
  },
  invoiceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  detail: {
    fontSize: 13,
    opacity: 0.7,
  },
});
