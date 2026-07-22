import { Check, Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import type { ThemePreference } from './theme';

const themeOptions: Array<{
  icon: typeof Sun;
  label: string;
  value: ThemePreference;
}> = [
  { icon: Sun, label: 'Claro', value: 'light' },
  { icon: Moon, label: 'Oscuro', value: 'dark' },
  { icon: Laptop, label: 'Sistema', value: 'system' }
];

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();

  return (
    <section aria-label="Apariencia" className={compact ? 'grid gap-2' : 'rounded-[20px] border border-white/10 bg-card p-3'}>
      {!compact ? <h2 className="text-sm font-black">Apariencia</h2> : null}
      <div className={compact ? 'inline-flex rounded-2xl border border-white/10 bg-card p-1' : 'mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1'}>
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const selected = preference === option.value;

          return (
            <button
              aria-pressed={selected}
              className={`flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-black transition ${
                selected ? 'bg-accent text-contrast shadow-glow' : 'text-muted hover:bg-white/7 hover:text-white'
              }`}
              key={option.value}
              onClick={() => setPreference(option.value)}
              title={option.label}
              type="button"
            >
              <Icon className="size-4 shrink-0" />
              <span className={compact ? 'hidden sm:inline' : 'truncate'}>{option.label}</span>
              {selected && !compact ? <Check className="size-3.5 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
