import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { supabase } from "@/lib/supabase";
import { useOnboarding } from "@/providers/onboarding-provider";

const archetypes = [
  {
    name: "Athlete Scholar",
    description: "Analytical training with intellectual curiosity.",
    microHabit: "Log one insight after each workout to compound awareness.",
  },
  {
    name: "Modern Warrior",
    description: "Discipline, strength, and stoic mindset.",
    microHabit: "Perform 60 seconds of box breathing before training.",
  },
  {
    name: "Artisan Performer",
    description: "Movement as art, focus on flow and precision.",
    microHabit: "Review tempo cues aloud before top sets.",
  },
];

const activityMultiplier: Record<
  "sedentary" | "light" | "moderate" | "high",
  number
> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

const calorieBump: Record<
  "recomposition" | "strength_gain" | "cutting" | "endurance",
  number
> = {
  recomposition: 0,
  strength_gain: 250,
  cutting: -350,
  endurance: 100,
};

export default function IdentityFramingScreen() {
  const router = useRouter();
  const { account, profile, baseline, goals, setIdentityArchetype, reset } =
    useOnboarding();
  const [selected, setSelected] = useState(archetypes[0]);
  const [loading, setLoading] = useState(false);

  const age = useMemo(() => {
    if (!profile?.dateOfBirth) return 30;
    const dob = new Date(profile.dateOfBirth);
    const diff = Date.now() - dob.getTime();
    return Math.max(18, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
  }, [profile?.dateOfBirth]);

  const finishOnboarding = async () => {
    if (!account?.userId || !profile || !baseline || !goals) {
      Alert.alert(
        "Missing data",
        "Complete previous steps before finishing onboarding.",
      );
      return;
    }

    setIdentityArchetype(selected.name);

    const { heightCm, weightKg, sex, activityLevel, timezone } = profile;

    const s = sex === "male" ? 5 : -161;
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;
    const activity = activityMultiplier[activityLevel];
    const tdee = bmr * activity;
    const calorieTarget = tdee + calorieBump[goals.goalType];
    const protein = Math.max(weightKg * 1.6, 120);
    const fats = (calorieTarget * 0.25) / 9;
    const carbs = Math.max((calorieTarget - protein * 4 - fats * 9) / 4, 0);

    const macroTargets = {
      calories: Math.round(calorieTarget),
      protein_g: Math.round(protein),
      carbs_g: Math.round(carbs),
      fat_g: Math.round(fats),
    };

    try {
      setLoading(true);
      const profilePayload = {
        user_id: account.userId,
        name: account.fullName,
        date_of_birth: profile.dateOfBirth,
        sex: profile.sex,
        height_cm: heightCm,
        weight_kg: weightKg,
        goal_type: goals.goalType,
        equipment_available: goals.equipmentAvailable,
        unit_system: profile.unitSystem,
        activity_level: activityLevel,
        preferred_style: goals.preferredStyle,
        timezone,
        identity_archetype: selected.name,
      };

      const baselinePayload = {
        user_id: account.userId,
        baseline_date: new Date().toISOString().slice(0, 10),
        resting_heart_rate: baseline.restingHeartRate,
        hrv_rmssd: baseline.hrvRmssd,
        sleep_hours: baseline.sleepHours,
        body_fat_percentage: baseline.bodyFatPercentage,
        bmr_kcal: Math.round(bmr),
        tdee_kcal: Math.round(tdee),
        macro_targets: macroTargets,
      };

      const { error: profileError } = await supabase.from("profiles").upsert(
        profilePayload,
      );
      if (profileError) throw profileError;

      const { error: baselineError } = await supabase
        .from("biometric_baselines")
        .upsert(baselinePayload);
      if (baselineError) throw baselineError;

      await supabase.functions.invoke("generate-weekly-plan", {
        body: { user_id: account.userId },
      });

      Alert.alert(
        "Welcome to HELIX",
        "Baseline saved. Your adaptive plan will populate shortly.",
      );
      reset();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Failed to save profile",
        (error as Error).message ?? "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Identity Framing</ThemedText>
      <ThemedText style={styles.copy}>
        Choose the archetype that best reflects who you are becoming.
        Micro-habits, affirmations, and the AI coach voice will adapt around
        this choice.
      </ThemedText>

      <View style={styles.stack}>
        {archetypes.map((archetype) => {
          const isActive = selected.name === archetype.name;
          return (
            <Pressable
              key={archetype.name}
              style={[styles.card, isActive && styles.cardActive]}
              onPress={() => setSelected(archetype)}
            >
              <ThemedText type="defaultSemiBold">{archetype.name}</ThemedText>
              <ThemedText style={styles.cardCopy}>
                {archetype.description}
              </ThemedText>
              <View style={styles.microAction}>
                <ThemedText style={styles.microText}>
                  {archetype.microHabit}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={styles.finishButton}
        onPress={finishOnboarding}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" />
          : (
            <ThemedText style={styles.finishText}>
              Finish Onboarding
            </ThemedText>
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
    lineHeight: 22,
    opacity: 0.75,
  },
  stack: {
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    padding: 18,
    gap: 10,
  },
  cardActive: {
    borderColor: "#1F6FEB",
    backgroundColor: "#1F6FEB14",
  },
  cardCopy: {
    lineHeight: 20,
    opacity: 0.75,
  },
  microAction: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#1F6FEB12",
  },
  microText: {
    fontSize: 13,
    color: "#1F6FEB",
    fontWeight: "600",
  },
  finishButton: {
    marginTop: "auto",
    alignSelf: "flex-end",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#1F6FEB",
  },
  finishText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
