import type { ReactNode } from 'react';
import type { RestaurantConfig } from '../types';
import { BottomNavigation } from './BottomNavigation';
import { ConnectivityBanner } from './ConnectivityBanner';
import { RestaurantHeader } from './RestaurantHeader';

export function AppLayout({ children, restaurant }: { children: ReactNode; restaurant: RestaurantConfig }) {
  return (
    <div className="min-h-dvh bg-base text-white">
      <div className="relative mx-auto flex h-dvh max-w-[520px] flex-col overflow-hidden border-x border-white/5 bg-base shadow-2xl md:my-4 md:h-[calc(100dvh-32px)] md:rounded-[28px] md:border">
        <RestaurantHeader restaurant={restaurant} />
        <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
        <BottomNavigation />
      </div>
      <ConnectivityBanner />
    </div>
  );
}
