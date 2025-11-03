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
import { useOnboarding } from "@/providers/onboarding-provider";

export default function AccountCreationScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "dark";
  const palette = Colors[scheme];
  const { setAccount } = useOnboarding();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Missing details", "Name, email, and password are required.");
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
          "Verify email",
          "Check your inbox to verify the account before continuing.",
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

      router.push("/(onboarding)/initial-questions");
    } catch (error) {
      Alert.alert(
        "Unable to create account",
        (error as Error).message ?? "Please try again.",
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
            Create Account
          </ThemedText>
          <ThemedText style={styles.copy}>
            One onboarding flow syncs your biometrics, goals, and identity
            settings.
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
            placeholder="Your Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="rgba(255,255,255,0.65)"
          />
          <TextInput
            style={[styles.input, { color: palette.text }]}
            placeholder="Your Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="rgba(255,255,255,0.65)"
          />
          <TextInput
            style={[styles.input, { color: palette.text }]}
            placeholder="Your Phone (optional)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor="rgba(255,255,255,0.65)"
          />
          <TextInput
            style={[styles.input, { color: palette.text }]}
            placeholder="Your Password"
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
          onPress={handleContinue}
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
                Create Account
              </ThemedText>
            )}
        </Pressable>

        <ThemedText style={styles.termsText}>
          By creating an account, you agree to our Terms of Service and Privacy
          Policy.
        </ThemedText>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 72,
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
  copy: {
    opacity: 0.75,
    lineHeight: 22,
  },
  form: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 6,
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
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },
  primaryText: {
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 1,
  },
  termsText: {
    fontSize: 12,
    opacity: 0.65,
    textAlign: "center",
    lineHeight: 18,
  },
});
