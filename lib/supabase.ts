import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/env";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "[env] Supabase configuration is missing. Check EXPO_PUBLIC_SUPABASE_URL and _ANON_KEY.",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
