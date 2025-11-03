import { useRouter } from "expo-router";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "dark";
  const palette = Colors[scheme];

  return (
    <ImageBackground
      source={require("@/assets/images/Background1.2.jpg")}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={[styles.overlay, { backgroundColor: palette.overlay }]}>
        <View style={styles.logoBlock}>
          <Image
            source={require("@/assets/images/helix-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.brand}>
            HELIX
          </ThemedText>
          <ThemedText style={styles.tagline}>
            “Bring the man you see inside, to life.”
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: palette.buttonPrimaryBackground },
            ]}
            onPress={() => router.push("/(onboarding)/login")}
          >
            <ThemedText
              style={[styles.primaryLabel, {
                color: palette.buttonPrimaryText,
              }]}
            >
              Login
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.secondaryButton,
              { borderColor: palette.buttonPrimaryBackground },
            ]}
            onPress={() => router.push("/(onboarding)/account")}
          >
            <ThemedText
              style={[
                styles.secondaryLabel,
                { color: palette.buttonOutlineText },
              ]}
            >
              Sign Up
            </ThemedText>
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
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  logoBlock: {
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 144,
    height: 144,
  },
  brand: {
    marginTop: 0, // fix: 'marginTop' is case sensitive
    paddingTop: 24,
    fontSize: 56, // shorter / tighter height (was 56)
    letterSpacing: 6, // less stretching so it reads cleaner
    fontWeight: "700", // lighter weight (works on iOS out of the box)
    opacity: 1, // optional: slightyly lighter-looking ink
    fontcolor: "#f6f6f6",
  },
  tagline: {
    fontSize: 24,
    fontcolor: "#f6f6f6",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 26,
    paddingBottom: 30,
  },
  actions: {
    width: "100%",
    gap: 18,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },
  primaryLabel: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  secondaryButton: {
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },
  secondaryLabel: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  footer: {
    marginTop: "auto",
    fontSize: 12,
    opacity: 0.65,
    letterSpacing: 1,
  },
});
