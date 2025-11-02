import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const devices = [
  { name: 'Apple Health', status: 'Connected', lastSync: 'Awaiting wearable API' },
  { name: 'Oura Ring', status: 'Not linked', lastSync: '-' },
];

export default function ManageDevicesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
          <ThemedText type="subtitle">Manage Devices</ThemedText>
          <ThemedText style={styles.copy}>
            Display OAuth status, refresh token validity, and a test sync button per provider.
          </ThemedText>
        </View>
        <View style={styles.stack}>
          {devices.map(device => (
            <View key={device.name} style={[styles.deviceCard, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
              <ThemedText type="defaultSemiBold">{device.name}</ThemedText>
              <ThemedText style={styles.status}>Status: {device.status}</ThemedText>
              <ThemedText style={styles.status}>Last sync: {device.lastSync}</ThemedText>
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
  stack: {
    gap: 12,
  },
  deviceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  status: {
    fontSize: 13,
    opacity: 0.7,
  },
});
