import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";

type MenuItem = {
  label: string;
  description?: string;
  href: string;
};

const items: MenuItem[] = [
  { label: "Profile Overview", href: "/profile" },
  { label: "Manage Devices", href: "/profile/devices" },
  { label: "Notifications & Preferences", href: "/profile/preferences" },
  { label: "Subscriptions & Billing", href: "/profile/billing" },
  { label: "Help Center", href: "/support" },
  { label: "Submit Feature Idea", href: "/support/feature" },
];

export function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? "dark";
  const palette = Colors[scheme];
  const insets = useSafeAreaInsets();

  const menuItems = useMemo(() => items, []);

  const handleNavigate = (href: string) => {
    setOpen(false);
    router.push(href as never);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open HELIX menu"
        style={[styles.trigger, {
          backgroundColor: palette.inputBackground,
          borderColor: palette.inputBorder,
        }]}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="menu-outline" size={20} color={palette.text} />
      </Pressable>
      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View />
        </Pressable>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.borderMuted,
              top: insets.top + 56,
            },
          ]}
        >
          {menuItems.map((item) => (
            <Pressable
              key={item.href}
              style={styles.menuItem}
              onPress={() => handleNavigate(item.href)}
            >
              <ThemedText type="defaultSemiBold">{item.label}</ThemedText>
              {item.description
                ? (
                  <ThemedText style={styles.menuDescription}>
                    {item.description}
                  </ThemedText>
                )
                : null}
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    right: 16,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItem: {
    gap: 4,
  },
  menuDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
});
