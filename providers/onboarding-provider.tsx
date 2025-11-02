import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

type AccountDetails = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  userId?: string;
};

type ProfileDetails = {
  dateOfBirth: string;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  unitSystem: 'metric' | 'imperial';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high';
  timezone: string;
};

type BaselineDetails = {
  restingHeartRate: number;
  hrvRmssd: number;
  sleepHours: number;
  bodyFatPercentage: number;
};

type GoalsDetails = {
  goalType: 'recomposition' | 'strength_gain' | 'cutting' | 'endurance';
  equipmentAvailable: string[];
  preferredStyle: 'aesthetic' | 'functional';
  identityArchetype?: string;
};

type OnboardingState = {
  account: AccountDetails | null;
  profile: ProfileDetails | null;
  baseline: BaselineDetails | null;
  goals: GoalsDetails | null;
};

type OnboardingContextValue = OnboardingState & {
  setAccount: (details: AccountDetails) => void;
  setProfile: (details: ProfileDetails) => void;
  setBaseline: (details: BaselineDetails) => void;
  setGoals: (details: GoalsDetails) => void;
  setIdentityArchetype: (value: string) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

const defaultState: OnboardingState = {
  account: null,
  profile: null,
  baseline: null,
  goals: null,
};

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<OnboardingState>(defaultState);

  const value: OnboardingContextValue = useMemo(
    () => ({
      ...state,
      setAccount: (account) => setState((prev) => ({ ...prev, account })),
      setProfile: (profile) => setState((prev) => ({ ...prev, profile })),
      setBaseline: (baseline) => setState((prev) => ({ ...prev, baseline })),
      setGoals: (goals) => setState((prev) => ({ ...prev, goals })),
      setIdentityArchetype: (value) =>
        setState((prev) => {
          if (!prev.goals) return prev;
          return { ...prev, goals: { ...prev.goals, identityArchetype: value } };
        }),
      reset: () => setState(defaultState),
    }),
    [state],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
