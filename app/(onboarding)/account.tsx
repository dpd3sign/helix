import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useOnboarding } from '@/providers/onboarding-provider';

export default function AccountCreationScreen() {
  const router = useRouter();
  const { setAccount } = useOnboarding();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Missing details', 'Name, email, and password are required.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        Alert.alert(
          'Verify email',
          'Check your inbox to verify the account before continuing.'
        );
        return;
      }

      setAccount({
        email,
        password,
        fullName,
        phone: phone || undefined,
        userId: data.user.id,
      });

      router.push('/(onboarding)/initial-questions');
    } catch (error) {
      Alert.alert('Unable to create account', (error as Error).message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Create Account</ThemedText>
      <ThemedText style={styles.copy}>
        Use the same credentials you’ll use on production HELIX. We’ll create your Supabase user and continue with personalization.
      </ThemedText>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#7A8696"
        />
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
          placeholder="Phone (optional)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
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

      <Pressable style={styles.primaryButton} onPress={handleContinue} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <ThemedText style={styles.primaryText}>Continue</ThemedText>
        )}
      </Pressable>
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
  form: {
    gap: 14,
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
  primaryButton: {
    marginTop: 'auto',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#1F6FEB',
    alignSelf: 'flex-end',
    minWidth: 160,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
