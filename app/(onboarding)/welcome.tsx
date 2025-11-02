import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('@/assets/images/android-icon-background.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.overlay}>
        <View style={styles.logoBlock}>
          <ThemedText type="title" style={styles.brand}>
            HELIX
          </ThemedText>
          <ThemedText style={styles.tagline}>
            “Bring the man you see inside, to life.”
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(onboarding)/login')}>
            <ThemedText style={styles.primaryLabel}>Login</ThemedText>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/(onboarding)/account')}>
            <ThemedText style={styles.secondaryLabel}>Sign Up</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={styles.footer}>copyright © Helix Co.</ThemedText>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  logoBlock: {
    alignItems: 'center',
    gap: 12,
  },
  brand: {
    fontSize: 42,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.85,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#D9DBE1',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111114',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D9DBE1',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    fontSize: 12,
    opacity: 0.65,
  },
});
