import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const moduleCards = [
  {
    title: "Plan",
    description: "Adaptive 7/30 day schedules for workouts and meals.",
    href: "/(tabs)/plan",
    icon: "layers-outline" as const,
    status: "Awaiting wearable sync",
  },
  {
    title: "Mindset",
    description: "Identity prompts, affirmations, and micro-habits.",
    href: "/(tabs)/mindset",
    icon: "planet-outline" as const,
    status: "Evening reflection queued",
  },
  {
    title: "Metrics",
    description: "Body, nutrition, mindset, and sleep dashboards.",
    href: "/(tabs)/metrics",
    icon: "analytics-outline" as const,
    status: "Connect wearables to populate",
  },
  {
    title: "AI Coach",
    description: "Context-aware guidance with adaptive adjustments.",
    href: "/(tabs)/coach",
    icon: "chatbubbles-outline" as const,
    status: "Next check-in tomorrow 06:30",
  },
];

const quickMetrics = [
  { label: "Readiness", value: "Waiting for sync" },
  { label: "HRV Baseline", value: "Set in onboarding" },
  { label: "Confidence Index", value: "Coming soon" },
];

const quickActions = [
  { label: "Open Plan", href: "/(tabs)/plan" },
  { label: "Reflect Now", href: "/(tabs)/mindset/journal" },
  { label: "Add Progress", href: "/(tabs)/metrics/body" },
];

const notifications = [
  "Wearable sync pending – connect Apple Health or Oura.",
  "Identity streak: 4 days of consistent micro-habit completion.",
];

const systemLinks = [
  {
    title: "Profile & Settings",
    href: "/profile",
    icon: "person-circle-outline" as const,
  },
  {
    title: "Help Center",
    href: "/support",
    icon: "help-circle-outline" as const,
  },
  {
    title: "Phase 2 Roadmap",
    href: "/phase-two",
    icon: "planet-outline" as const,
  },
];

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const glass = palette.glass;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Shared liquid-glass container (see Colors.*.glass tokens) */}
        <ThemedView variant="glass" style={styles.hero}>
          <ThemedText type="subtitle" style={styles.heroBadge}>
            Mission Control
          </ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Synchronize mind, body, and identity.
          </ThemedText>
          <ThemedText style={styles.heroCopy}>
            Connect wearables, review readiness, and let HELIX adapt your
            training and nutrition each morning.
          </ThemedText>
        </ThemedView>

        <View style={styles.metricRow}>
          {quickMetrics.map((metric) => (
            <ThemedView
              key={metric.label}
              variant="glass"
              style={styles.metricCard}
            >
              <ThemedText type="defaultSemiBold">{metric.label}</ThemedText>
              <ThemedText style={styles.metricValue}>{metric.value}</ThemedText>
            </ThemedView>
          ))}
        </View>

        <View style={styles.actionsRow}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.glassPressable,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <ThemedView variant="glass" style={styles.actionChip}>
                  <ThemedText
                    style={[styles.actionText, { color: palette.tint }]}
                  >
                    {action.label}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Core Modules</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            Tap into each system to configure goals, log progress, and preview
            automations.
          </ThemedText>
        </View>

        <View style={styles.grid}>
          {moduleCards.map((card) => (
            <Link key={card.title} href={card.href} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.glassPressable,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <ThemedView variant="glass" style={styles.card}>
                  <View
                    style={[
                      styles.cardIcon,
                      { backgroundColor: glass.bg },
                    ]}
                  >
                    <Ionicons name={card.icon} size={24} color={palette.tint} />
                  </View>
                  <ThemedText type="subtitle" style={styles.cardTitle}>
                    {card.title}
                  </ThemedText>
                  <ThemedText style={styles.cardDescription}>
                    {card.description}
                  </ThemedText>
                  <View
                    style={[styles.statusPill, {
                      backgroundColor: `${palette.tint}1A`,
                    }]}
                  >
                    <ThemedText
                      style={[styles.statusText, { color: palette.tint }]}
                    >
                      {card.status}
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Notifications & Streaks</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            Surface the most relevant nudges and achievements.
          </ThemedText>
        </View>

        <ThemedView variant="glass" style={styles.notificationCard}>
          {notifications.map((note) => (
            <ThemedText key={note} style={styles.notificationItem}>
              • {note}
            </ThemedText>
          ))}
        </ThemedView>

        <ThemedView variant="glass" style={styles.coachBubble}>
          <View style={styles.coachHeader}>
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color={palette.tint}
            />
            <ThemedText type="defaultSemiBold">AI Coach</ThemedText>
          </View>
          <ThemedText style={styles.coachMessage}>
            “Once your wearables sync, I’ll audit readiness daily and adjust
            load or macros before you wake.”
          </ThemedText>
          <Link href="/(tabs)/coach" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.coachButton,
                pressed && { opacity: 0.92 },
              ]}
            >
              <ThemedView variant="glass" style={styles.coachButtonInner}>
                <ThemedText
                  style={[styles.coachButtonText, { color: palette.tint }]}
                >
                  Open Coach
                </ThemedText>
              </ThemedView>
            </Pressable>
          </Link>
        </ThemedView>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">System & Support</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            Access profile management, help center, and roadmap previews.
          </ThemedText>
        </View>

        <View style={styles.systemGrid}>
          {systemLinks.map((link) => (
            <Link key={link.title} href={link.href} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.glassPressable,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <ThemedView variant="glass" style={styles.systemCard}>
                  <Ionicons name={link.icon} size={22} color={palette.tint} />
                  <ThemedText type="defaultSemiBold">{link.title}</ThemedText>
                </ThemedView>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    gap: 24,
  },
  hero: {
    padding: 24,
    gap: 12,
  },
  heroBadge: {
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    maxWidth: 280,
    lineHeight: 32,
  },
  heroCopy: {
    opacity: 0.8,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 6,
  },
  metricValue: {
    opacity: 0.7,
    fontSize: 14,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionCopy: {
    opacity: 0.7,
    lineHeight: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  glassPressable: {
    borderRadius: 24,
  },
  actionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  card: {
    width: "47%",
    padding: 20,
    gap: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.75,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  notificationCard: {
    padding: 18,
    gap: 8,
  },
  notificationItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  coachBubble: {
    padding: 20,
    gap: 12,
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coachMessage: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.75,
  },
  coachButton: {
    alignSelf: "flex-start",
    borderRadius: 24,
  },
  coachButtonInner: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  coachButtonText: {
    fontWeight: "600",
  },
  systemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  systemCard: {
    flexBasis: "47%",
    padding: 16,
    gap: 10,
    alignItems: "flex-start",
  },
});
