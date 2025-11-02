import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function WearablePermissionsModal() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Permissions Required' }} />
      <View style={styles.content}>
        <ThemedText type="subtitle">Grant Data Access</ThemedText>
        <ThemedText style={styles.copy}>
          The production build will request health metrics including HRV, sleep, and active calories. Explain why the permission is needed and how data is secured.
        </ThemedText>
        <ThemedText style={styles.copy}>
          This modal also documents the flow: connect → fetch tokens → store encrypted in Supabase → schedule sync.
        </ThemedText>
      </View>
      <Pressable style={styles.dismissButton} onPress={() => router.back()}>
        <ThemedText style={styles.dismissText}>Close</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    gap: 16,
  },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1F6FEB',
  },
  dismissText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
