import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { runMockImport } from "./index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function hasSecrets() {
  return SUPABASE_SERVICE_ROLE_KEY.length > 0;
}

let clientPromise: Promise<any> | null = null;
async function getClient() {
  if (!hasSecrets()) {
    throw new Error("Supabase credentials are not configured");
  }
  if (!clientPromise) {
    clientPromise = import(
      "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno&deno-std=0.224.0"
    ).then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    );
  }
  return clientPromise;
}

const shouldSkip = !hasSecrets();

async function createTestUser() {
  if (!hasSecrets()) return null;
  const client = await getClient();
  const email = `mock-wearable-${crypto.randomUUID()}@helix.local`;
  const { data, error } = await client.auth.admin.createUser({
    email,
    password: "Pass1234!",
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function deleteTestUser(userId: string) {
  if (!hasSecrets()) return;
  const client = await getClient();
  await client.auth.admin.deleteUser(userId);
}

async function countWearableRows(userId: string): Promise<number> {
  if (!hasSecrets()) return 0;
  const client = await getClient();
  const { count } = await client
    .from("wearable_daily_metrics")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("provider", "mock");
  return count ?? 0;
}

async function fetchLatestJob(userId: string) {
  if (!hasSecrets()) return null;
  const client = await getClient();
  const { data } = await client
    .from("job_runs")
    .select("*")
    .eq("user_id", userId)
    .eq("job_key", "mock_import")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

Deno.test({
  name: "wearables-import-mock upserts records and logs job",
  ignore: shouldSkip,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const user = await createTestUser();
    assert(user, "user creation failed");

    try {
      const firstResult = await runMockImport(user.id);
      assert(firstResult.ok, `first run failed: ${firstResult.error}`);
      assert(
        firstResult.rows_affected && firstResult.rows_affected > 0,
        "expected rows affected on first run",
      );

      const firstCount = await countWearableRows(user.id);
      assertEquals(firstCount, firstResult.rows_affected);

      const secondResult = await runMockImport(user.id);
      assert(secondResult.ok, `second run failed: ${secondResult.error}`);
      assertEquals(
        secondResult.rows_affected,
        firstResult.rows_affected,
        "upsert should not duplicate records",
      );

      const secondCount = await countWearableRows(user.id);
      assertEquals(secondCount, firstCount);

      const latestJob = await fetchLatestJob(user.id);
      assert(latestJob, "job_runs entry missing");
      assertEquals(latestJob?.reason, "mock_import");
    } finally {
      await deleteTestUser(user.id);
    }
  },
});
