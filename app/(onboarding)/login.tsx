import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "dark";
  const palette = Colors[scheme];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        "Missing information",
        "Please enter both email and password.",
      );
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Login failed",
        (error as Error).message ?? "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/Background1.2.jpg")}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={[styles.overlay, { backgroundColor: palette.overlay }]}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Welcome Back
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter your credentials to continue your HELIX journey.
          </ThemedText>
        </View>

        {/* Shared liquid-glass container (see Colors.*.glass tokens) */}
        <ThemedView variant="glass" style={styles.form}>
          <TextInput
            style={[
              styles.input,
              {
                color: palette.text,
                borderBottomColor: palette.borderMuted,
              },
            ]}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={palette.borderMuted}
          />
          <TextInput
            style={[
              styles.input,
              {
                color: palette.text,
                borderBottomColor: palette.borderMuted,
              },
            ]}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={palette.borderMuted}
          />
        </ThemedView>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButtonWrapper,
            pressed && { opacity: 0.94 },
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <ThemedView variant="glass" style={styles.primaryButton}>
            {loading
              ? <ActivityIndicator color={palette.tint} />
              : (
                <ThemedText
                  style={[styles.primaryText, { color: palette.tint }]}
                >
                  Sign In
                </ThemedText>
              )}
          </ThemedView>
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert("Hang tight", "Password reset flow coming soon.")}
        >
          <ThemedText style={styles.forgot}>Forgot your password?</ThemedText>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 96,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 32,
    letterSpacing: 1,
  },
  subtitle: {
    opacity: 0.8,
    lineHeight: 22,
  },
  form: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
  },
  primaryButtonWrapper: {
    marginTop: 24,
  },
  primaryButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  forgot: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    opacity: 0.75,
  },
});
