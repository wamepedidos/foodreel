import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyTheme,
  getStoredThemePreference,
  getSystemTheme,
  persistThemePreference,
  resolveEffectiveTheme,
  type EffectiveTheme,
  type ThemePreference
} from './theme';

type ThemeContextValue = {
  effectiveTheme: EffectiveTheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredThemePreference());
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(() => getSystemTheme());
  const effectiveTheme = resolveEffectiveTheme(preference, systemTheme);

  useEffect(() => {
    applyTheme(preference, effectiveTheme);
  }, [effectiveTheme, preference]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'foodreel-theme-preference') {
        setPreferenceState(getStoredThemePreference());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    persistThemePreference(nextPreference);
    setPreferenceState(nextPreference);
  }, []);

  const value = useMemo(
    () => ({ effectiveTheme, preference, setPreference }),
    [effectiveTheme, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
