import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOnboarding } from '@/providers/onboarding-provider';

const activityLevels: { label: string; value: 'sedentary' | 'light' | 'moderate' | 'high' }[] = [
  { label: 'Sedentary', value: 'sedentary' },
  { label: 'Light', value: 'light' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
];

export default function InitialQuestionsScreen() {
  const router = useRouter();
  const { setProfile, setBaseline } = useOnboarding();
  const defaultTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [heightInput, setHeightInput] = useState('180');
  const [weightInput, setWeightInput] = useState('82');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'high'>('moderate');
  const [timezone, setTimezone] = useState(defaultTimezone);

  const [restingHeartRate, setRestingHeartRate] = useState('60');
  const [hrv, setHrv] = useState('70');
  const [sleepHours, setSleepHours] = useState('7.5');
  const [bodyFat, setBodyFat] = useState('15');

  const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const handleNext = () => {
    const height = parseNumber(heightInput);
    const weight = parseNumber(weightInput);
    const rhr = parseNumber(restingHeartRate);
    const baselineHrv = parseNumber(hrv);
    const sleep = parseNumber(sleepHours);
    const bf = parseNumber(bodyFat);

    if ([height, weight, rhr, baselineHrv, sleep, bf].some(Number.isNaN)) {
      Alert.alert('Invalid input', 'Please ensure all numeric fields are valid.');
      return;
    }

    const heightCm = unitSystem === 'metric' ? height : height * 2.54;
    const weightKg = unitSystem === 'metric' ? weight : weight / 2.20462;

    setProfile({
      dateOfBirth,
      sex,
      heightCm,
      weightKg,
      unitSystem,
      activityLevel,
      timezone,
    });

    setBaseline({
      restingHeartRate: rhr,
      hrvRmssd: baselineHrv,
      sleepHours: sleep,
      bodyFatPercentage: bf,
    });

    router.push('/(onboarding)/goals-equipment');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle">Your Baseline</ThemedText>
        <ThemedText style={styles.copy}>
          These inputs feed your Supabase profile and biometric baseline tables. We’ll compute macros and readiness thresholds from here.
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">Core Metrics</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Date of birth (YYYY-MM-DD)"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholderTextColor="#7A8696"
          />
          <View style={styles.chipRow}>
            {(['male', 'female'] as const).map(option => (
              <Pressable
                key={option}
                onPress={() => setSex(option)}
                style={[styles.chip, sex === option && styles.chipActive]}
              >
                <ThemedText style={sex === option ? styles.chipActiveLabel : styles.chipLabel}>
                  {option.toUpperCase()}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.chipRow}>
            {(['metric', 'imperial'] as const).map(option => (
              <Pressable
                key={option}
                onPress={() => setUnitSystem(option)}
                style={[styles.chip, unitSystem === option && styles.chipActive]}
              >
                <ThemedText style={unitSystem === option ? styles.chipActiveLabel : styles.chipLabel}>
                  {option.toUpperCase()}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder={unitSystem === 'metric' ? 'Height (cm)' : 'Height (inches)'}
            keyboardType="numeric"
            value={heightInput}
            onChangeText={setHeightInput}
            placeholderTextColor="#7A8696"
          />
          <TextInput
            style={styles.input}
            placeholder={unitSystem === 'metric' ? 'Weight (kg)' : 'Weight (lbs)'}
            keyboardType="numeric"
            value={weightInput}
            onChangeText={setWeightInput}
            placeholderTextColor="#7A8696"
          />
          <View style={styles.chipRow}>
            {activityLevels.map(option => (
              <Pressable
                key={option.value}
                onPress={() => setActivityLevel(option.value)}
                style={[styles.chip, activityLevel === option.value && styles.chipActive]}
              >
                <ThemedText
                  style={activityLevel === option.value ? styles.chipActiveLabel : styles.chipLabel}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Timezone (e.g., America/Los_Angeles)"
            value={timezone}
            onChangeText={setTimezone}
            placeholderTextColor="#7A8696"
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">Baseline Biometrics</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Resting heart rate"
            keyboardType="numeric"
            value={restingHeartRate}
            onChangeText={setRestingHeartRate}
            placeholderTextColor="#7A8696"
          />
          <TextInput
            style={styles.input}
            placeholder="HRV baseline (rMSSD)"
            keyboardType="numeric"
            value={hrv}
            onChangeText={setHrv}
            placeholderTextColor="#7A8696"
          />
          <TextInput
            style={styles.input}
            placeholder="Average sleep hours"
            keyboardType="numeric"
            value={sleepHours}
            onChangeText={setSleepHours}
            placeholderTextColor="#7A8696"
          />
          <TextInput
            style={styles.input}
            placeholder="Body fat %"
            keyboardType="numeric"
            value={bodyFat}
            onChangeText={setBodyFat}
            placeholderTextColor="#7A8696"
          />
        </View>
      </ScrollView>

      <Pressable style={styles.nextButton} onPress={handleNext}>
        <ThemedText style={styles.nextText}>Next</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 24 },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  section: {
    gap: 12,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8DEE9',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  chipActive: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  chipActiveLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nextButton: {
    marginTop: 'auto',
    alignSelf: 'flex-end',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#1F6FEB',
    margin: 24,
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
