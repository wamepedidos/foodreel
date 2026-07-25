import { restaurantConfig } from '../config/restaurant';

export function LoadingSkeleton() {
  const logoSrc = restaurantConfig.logoSrc;

  return (
    <div className="grid h-full snap-start place-items-center bg-base px-6 text-center">
      <div className="grid justify-items-center gap-5">
        <div className="grid size-24 place-items-center rounded-[24px] border border-white/12 bg-paper p-3 shadow-[0_22px_70px_rgba(0,0,0,0.34)]">
          {logoSrc ? (
            <img alt={`${restaurantConfig.restaurantName} logo`} className="size-full object-contain" src={logoSrc} />
          ) : (
            <span className="text-4xl font-black text-accent">{restaurantConfig.logoText}</span>
          )}
        </div>

        <div>
          <p className="text-sm font-black text-white">{restaurantConfig.restaurantName}</p>
          <p className="mt-1 text-xs font-medium text-muted">Cargando carta</p>
        </div>

        <div aria-label="Cargando" className="foodreel-dot-loader" role="status">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
