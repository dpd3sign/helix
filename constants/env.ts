const throwIfMissing = (key: keyof NodeJS.ProcessEnv) => {
  const value = process.env[key];
  if (!value) {
    console.warn(`[env] Missing environment variable ${key}.`);
  }
  return value ?? '';
};

export const SUPABASE_URL = throwIfMissing('EXPO_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = throwIfMissing('EXPO_PUBLIC_SUPABASE_ANON_KEY');
export const SUPABASE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL ?? '';
