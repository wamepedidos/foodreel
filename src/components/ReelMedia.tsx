import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Dish } from '../types';

export function ReelMedia({ dish, active, preload = false }: { dish: Dish; active: boolean; preload?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prewarmedRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const poster = dish.image.includes('foodreel-logo') ? undefined : dish.image;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (active && !videoFailed) {
      video.muted = muted;
      if (prewarmedRef.current && video.currentTime > 0.05) {
        try {
          video.currentTime = 0;
        } catch {
          // Keep playback natural if the browser blocks the reset during a gesture.
        }
      }
      prewarmedRef.current = false;
      void video.play().catch((error: unknown) => {
        if (!(error instanceof DOMException) || error.name !== 'AbortError') {
          setVideoFailed(true);
        }
      });
      return;
    }

    video.pause();
  }, [active, muted, videoFailed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || active || !preload || videoFailed) {
      return undefined;
    }

    video.muted = true;
    video.preload = 'auto';
    video.load();

    let restored = false;
    const restoreStart = () => {
      if (restored) {
        return;
      }

      restored = true;
      prewarmedRef.current = true;

      try {
        video.currentTime = 0;
      } catch {
        // If the reset is deferred, active playback will reset before playing.
      }
    };

    const warmFirstTwoSeconds = () => {
      const targetTime = Number.isFinite(video.duration) && video.duration > 2.2 ? 2 : 0.5;

      try {
        if (video.currentTime < targetTime) {
          video.addEventListener('seeked', restoreStart, { once: true });
          video.currentTime = targetTime;
        } else {
          restoreStart();
        }
      } catch {
        restoreStart();
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      warmFirstTwoSeconds();
      return undefined;
    }

    video.addEventListener('loadedmetadata', warmFirstTwoSeconds, { once: true });
    return () => {
      video.removeEventListener('loadedmetadata', warmFirstTwoSeconds);
      video.removeEventListener('seeked', restoreStart);
    };
  }, [active, preload, videoFailed, dish.video]);

  return (
    <div className="absolute inset-0 bg-black">
      {dish.video && !videoFailed ? (
        <video
          className="h-full w-full object-cover"
          loop
          muted={muted}
          onError={() => setVideoFailed(true)}
          playsInline
          poster={poster}
          preload={active || preload ? 'auto' : 'metadata'}
          ref={videoRef}
          src={dish.video}
        />
      ) : (
        poster ? (
          <img alt={dish.name} className="h-full w-full object-cover" src={poster} />
        ) : (
          <div className="h-full w-full bg-black" />
        )
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
