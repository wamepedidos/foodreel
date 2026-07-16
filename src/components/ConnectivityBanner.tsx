import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ConnectivityBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 top-[calc(10px+env(safe-area-inset-top))] z-[90] mx-auto flex max-w-[420px] items-center gap-2 rounded-full border border-accent/50 bg-card px-4 py-2 text-sm text-white shadow-glow">
      <WifiOff className="size-4 text-accent" />
      <span>Sin conexión. Algunas funciones no están disponibles.</span>
    </div>
  );
}
