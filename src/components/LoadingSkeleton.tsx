import { useState } from 'react';
import { restaurantConfig } from '../config/restaurant';
import { publicAssetUrl } from '../utils/publicAsset';

export function LoadingSkeleton() {
  const [logoBroken, setLogoBroken] = useState(false);
  const logoSrc = publicAssetUrl(restaurantConfig.logoSrc || '/brand/foodreel-logo.png');
  const showLogo = Boolean(logoSrc && !logoBroken);

  return (
    <div className="grid h-full snap-start place-items-center bg-base px-6 text-center">
      <div className="grid justify-items-center gap-5">
        <div
          className={`grid size-24 place-items-center rounded-[24px] border border-white/12 shadow-[0_22px_70px_rgba(0,0,0,0.34)] ${
            showLogo ? 'bg-paper p-3' : 'bg-accent text-4xl font-black text-contrast'
          }`}
        >
          {showLogo ? (
            <img alt="" aria-hidden="true" className="size-full object-contain" onError={() => setLogoBroken(true)} src={logoSrc} />
          ) : (
            <span>{restaurantConfig.logoText}</span>
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
