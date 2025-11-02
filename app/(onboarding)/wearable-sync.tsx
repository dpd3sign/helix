import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

const providers = ['apple_health', 'fitbit', 'garmin', 'whoop', 'oura', 'google_fit'] as const;

type Provider = (typeof providers)[number];

type WearableConnection = {
  provider: string;
  status: string;
  synced_at: string | null;
};

const PROVIDER_LABEL: Record<Provider, string> = {
  apple_health: 'Apple Health',
  fitbit: 'Fitbit',
  garmin: 'Garmin',
  whoop: 'WHOOP',
  oura: 'Oura',
  google_fit: 'Google Fit',
};

export default function WearableSyncScreen() {
  const { session } = useAuth();
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [invokingProvider, setInvokingProvider] = useState<Provider | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('wearable_connections')
      .select('provider,status,synced_at')
      .eq('user_id', session.user.id);

    if (error) {
      console.warn('[wearables] fetch error', error.message);
    } else if (data) {
      setConnections(data as WearableConnection[]);
    }
    setLoading(false);
  }, [session?.user]);

  useFocusEffect(
    useCallback(() => {
      fetchConnections();
    }, [fetchConnections])
  );

  useEffect(() => {
    if (!session?.user) {
      setConnections([]);
    }
  }, [session?.user]);

  const handleConnect = async (provider: Provider) => {
    if (!session?.user) {
      Alert.alert('Login required', 'Sign in before connecting a wearable.');
      return;
    }

    try {
      setInvokingProvider(provider);
      const { error } = await supabase.functions.invoke('wearable-authorize', {
        body: { provider },
      });
      if (error) {
        throw error;
      }
      Alert.alert('Check device', 'Complete the authorization in the provider dialog.');
    } catch (error) {
      Alert.alert('Unable to start sync', (error as Error).message);
    } finally {
      setInvokingProvider(null);
      fetchConnections();
    }
  };

  const handleSyncNow = async (provider: Provider) => {
    if (!session?.user) return;
    try {
      setInvokingProvider(provider);
      const { error } = await supabase.functions.invoke('sync-wearables', {
        body: { provider },
      });
      if (error) throw error;
      Alert.alert('Sync queued', `${PROVIDER_LABEL[provider]} sync requested.`);
    } catch (error) {
      Alert.alert('Sync failed', (error as Error).message);
    } finally {
      setInvokingProvider(null);
      fetchConnections();
    }
  };

  const connectionFor = (provider: Provider) =>
    connections.find((item) => item.provider === provider);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Connect Wearables</ThemedText>
      <ThemedText style={styles.copy}>
        Authorize each provider to stream biometrics. Supabase edge functions manage OAuth and cron-based data pulls.
      </ThemedText>

      <View style={styles.card}>
        {providers.map((provider) => {
          const info = connectionFor(provider);
          const isLoading = invokingProvider === provider;
          return (
            <View key={provider} style={styles.providerRow}>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">{PROVIDER_LABEL[provider]}</ThemedText>
                <ThemedText style={styles.status}>
                  Status: {info?.status ?? 'Not connected'}
                </ThemedText>
                {info?.synced_at && (
                  <ThemedText style={styles.status}>Last sync: {new Date(info.synced_at).toLocaleString()}</ThemedText>
                )}
              </View>
              <Pressable
                style={styles.linkButton}
                onPress={() => handleConnect(provider)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#1F6FEB" />
                ) : (
                  <ThemedText style={styles.linkText}>{info ? 'Reconnect' : 'Connect'}</ThemedText>
                )}
              </Pressable>
              <Pressable
                style={styles.syncButton}
                onPress={() => handleSyncNow(provider)}
                disabled={isLoading}
              >
                <ThemedText style={styles.syncText}>Sync</ThemedText>
              </Pressable>
            </View>
          );
        })}
      </View>

      {loading && <ActivityIndicator color="#1F6FEB" />}

      <Link href="/(onboarding)/identity-framing" asChild>
        <Pressable style={styles.nextButton}>
          <ThemedText style={styles.nextText}>Continue</ThemedText>
        </Pressable>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
  },
  copy: {
    opacity: 0.75,
    lineHeight: 22,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E6F0',
    padding: 18,
    gap: 12,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  status: {
    fontSize: 12,
    color: '#5A6475',
  },
  linkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F6FEB',
  },
  linkText: {
    fontWeight: '600',
    color: '#1F6FEB',
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1F6FEB1A',
  },
  syncText: {
    fontSize: 12,
    color: '#1F6FEB',
    fontWeight: '600',
  },
  nextButton: {
    marginTop: 'auto',
    alignSelf: 'flex-end',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#1F6FEB',
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
