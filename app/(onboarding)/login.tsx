import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing information', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login failed', (error as Error).message ?? 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Login</ThemedText>
      <ThemedText style={styles.copy}>
        Enter your credentials to continue your HELIX journey.
      </ThemedText>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#7A8696"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#7A8696"
        />
      </View>

      <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#0B1726" /> : <ThemedText style={styles.primaryText}>Login</ThemedText>}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 18 },
  copy: { opacity: 0.75, lineHeight: 22 },
  form: { gap: 14, marginTop: 12 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8DEE9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  primaryButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#D9DBE1',
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111114',
  },
});
