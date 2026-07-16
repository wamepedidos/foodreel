import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Dish } from '../types';

export function ReelMedia({ dish, active }: { dish: Dish; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (active && !videoFailed) {
      video.muted = muted;
      void video.play().catch(() => setVideoFailed(true));
      return;
    }

    video.pause();
  }, [active, muted, videoFailed]);

  return (
    <div className="absolute inset-0 bg-black">
      {dish.video && !videoFailed ? (
        <video
          className="h-full w-full object-cover"
          loop
          muted={muted}
          onError={() => setVideoFailed(true)}
          playsInline
          poster={dish.image}
          preload="metadata"
          ref={videoRef}
          src={dish.video}
        />
      ) : (
        <img alt={dish.name} className="h-full w-full object-cover" src={dish.image} />
      )}
      <button
        aria-label={muted ? 'Activar sonido' : 'Silenciar video'}
        className="absolute left-4 top-4 z-20 grid size-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition hover:border-accent/50"
        onClick={() => setMuted((value) => !value)}
        type="button"
      >
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>
    </div>
  );
}
