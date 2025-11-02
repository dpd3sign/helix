import Constants from 'expo-constants';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const getEnvVar = (key: keyof NodeJS.ProcessEnv) => {
  const value = process.env[key];
  if (!value) {
    console.warn(`[env] Missing environment variable ${key}.`);
  }
  return value ?? '';
};

const resolve = (explicit?: string, fallbackKey?: keyof NodeJS.ProcessEnv) => {
  if (explicit && explicit.length > 0) {
    return explicit;
  }
  if (fallbackKey) {
    return getEnvVar(fallbackKey);
  }
  return '';
};

export const SUPABASE_URL = resolve(extra.supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = resolve(extra.supabaseAnonKey, 'EXPO_PUBLIC_SUPABASE_ANON_KEY');
export const SUPABASE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL ?? '';
