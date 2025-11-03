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

        <View
          style={[
            styles.form,
            {
              backgroundColor: palette.inputBackground,
              borderColor: palette.inputBorder,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: palette.text }]}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="rgba(255,255,255,0.65)"
          />
          <TextInput
            style={[styles.input, { color: palette.text }]}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="rgba(255,255,255,0.65)"
          />
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: palette.buttonPrimaryBackground },
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={palette.buttonPrimaryText} />
            : (
              <ThemedText
                style={[styles.primaryText, {
                  color: palette.buttonPrimaryText,
                }]}
              >
                Sign In
              </ThemedText>
            )}
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
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 22,
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
