export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'foodreel-theme-preference';

export const THEME_META_COLORS: Record<EffectiveTheme, string> = {
  dark: '#0B0B0C',
  light: '#F5F4F1'
};

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function resolveEffectiveTheme(preference: ThemePreference, systemTheme = getSystemTheme()): EffectiveTheme {
  return preference === 'system' ? systemTheme : preference;
}

export function applyTheme(preference: ThemePreference, effectiveTheme = resolveEffectiveTheme(preference)) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(effectiveTheme);
  root.dataset.theme = effectiveTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = effectiveTheme;

  let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement('meta');
    themeMeta.name = 'theme-color';
    document.head.appendChild(themeMeta);
  }
  themeMeta.content = THEME_META_COLORS[effectiveTheme];
}

export function persistThemePreference(preference: ThemePreference) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // The provider still applies the in-memory preference when storage is unavailable.
  }
}
