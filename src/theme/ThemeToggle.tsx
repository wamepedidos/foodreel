import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import type { ThemePreference } from './theme';

const nextPreference: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light'
};

const preferenceLabels: Record<ThemePreference, string> = {
  light: 'Modo claro',
  dark: 'Modo oscuro',
  system: 'Usar configuracion del dispositivo'
};

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const Icon = preference === 'light' ? Sun : preference === 'dark' ? Moon : Laptop;
  const label = `Apariencia: ${preferenceLabels[preference]}`;

  return (
    <button
      aria-label={label}
      className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-surface text-accent transition hover:border-accent/50"
      onClick={() => setPreference(nextPreference[preference])}
      title={label}
      type="button"
    >
      <Icon className="size-5" />
    </button>
  );
}
