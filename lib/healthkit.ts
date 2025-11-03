import { Platform } from "react-native";
import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue,
  SleepValue,
} from "react-native-health";

import { supabase } from "@/lib/supabase";

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariabilitySDNN,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
    ],
    write: [],
  },
};

type MetricsAccumulator = {
  steps: number;
  hrvSamples: number[];
  sleepMinutes: number;
};

const ensureDay = (map: Map<string, MetricsAccumulator>, day: string) => {
  if (!map.has(day)) {
    map.set(day, { steps: 0, hrvSamples: [], sleepMinutes: 0 });
  }
  return map.get(day)!;
};

const initHealthKit = () =>
  new Promise<void>((resolve, reject) => {
    AppleHealthKit.initHealthKit(permissions, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

const getStepSamples = (startDate: string) =>
  new Promise<HealthValue[]>((resolve, reject) => {
    AppleHealthKit.getDailyStepCountSamples(
      { startDate, ascending: false },
      (err, results) => {
        if (err) reject(err);
        else resolve(results ?? []);
      },
    );
  });

const getHRVSamples = (startDate: string) =>
  new Promise<HealthValue[]>((resolve, reject) => {
    AppleHealthKit.getHeartRateVariabilitySamples(
      { startDate },
      (err, results) => {
        if (err) reject(err);
        else resolve(results ?? []);
      },
    );
  });

const getSleepSamples = (startDate: string) =>
  new Promise<SleepValue[]>((resolve, reject) => {
    AppleHealthKit.getSleepSamples({ startDate }, (err, results) => {
      if (err) reject(err);
      else resolve(results ?? []);
    });
  });

export async function syncHealthKitDailyMetrics(lastNDays = 7) {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Health is only available on iOS devices.");
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error("You must be logged in to sync Apple Health data.");
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (lastNDays - 1));

  const startDateISO = start.toISOString();

  await initHealthKit();

  const [stepsSamples, hrvSamples, sleepSamples] = await Promise.all([
    getStepSamples(startDateISO),
    getHRVSamples(startDateISO),
    getSleepSamples(startDateISO),
  ]);

  const metricsMap = new Map<string, MetricsAccumulator>();

  stepsSamples.forEach((sample) => {
    const day = sample.endDate.slice(0, 10);
    const bucket = ensureDay(metricsMap, day);
    bucket.steps += sample.value ?? 0;
  });

  hrvSamples.forEach((sample) => {
    const day = sample.startDate.slice(0, 10);
    const bucket = ensureDay(metricsMap, day);
    if (sample.value) bucket.hrvSamples.push(sample.value);
  });

  sleepSamples.forEach((sample) => {
    if (!sample.value || sample.value.toLowerCase() !== "asleep") return;
    const startMs = new Date(sample.startDate).getTime();
    const endMs = new Date(sample.endDate).getTime();
    const minutes = Math.max(0, (endMs - startMs) / (1000 * 60));
    const day = sample.startDate.slice(0, 10);
    const bucket = ensureDay(metricsMap, day);
    bucket.sleepMinutes += minutes;
  });

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const rows = Array.from(metricsMap.entries()).map(([date, bucket]) => {
    const averageHrv = bucket.hrvSamples.length > 0
      ? bucket.hrvSamples.reduce((sum, value) => sum + value, 0) /
        bucket.hrvSamples.length
      : null;

    return {
      user_id: userId,
      provider: "apple_health",
      date,
      timezone,
      steps: Math.round(bucket.steps),
      hrv_rmssd: averageHrv ? Number(averageHrv.toFixed(2)) : null,
      sleep_hours: bucket.sleepMinutes
        ? Number((bucket.sleepMinutes / 60).toFixed(2))
        : null,
      data: {
        source: "apple_health",
        samples: {
          steps: stepsSamples.length,
          hrv: bucket.hrvSamples.length,
          sleep: sleepSamples.length,
        },
      },
    };
  });

  if (rows.length === 0) {
    return { inserted: 0 };
  }

  await supabase.from("wearable_daily_metrics").upsert(rows, {
    onConflict: "user_id,provider,date",
  });

  await supabase
    .from("wearable_connections")
    .upsert(
      {
        user_id: userId,
        provider: "apple_health",
        status: "connected",
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

  return { inserted: rows.length };
}
