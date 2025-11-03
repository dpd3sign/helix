import type { ConfigContext, ExpoConfig } from "@expo/config";

const baseConfig: ExpoConfig = {
  name: "helix",
  slug: "helix",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "helix",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    [
      "react-native-health",
      {
        permissions: {
          read: [
            "HeartRate",
            "HeartRateVariabilitySDNN",
            "SleepAnalysis",
            "StepCount",
          ],
          write: [],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ...baseConfig,
  extra: {
    ...(config.extra ?? {}),
    ...(baseConfig.extra ?? {}),
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    eas: {
      projectId: "163b6fcf-b81d-4efc-86ad-27494b1a435e",
    },
  },
});
