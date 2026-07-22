import { useEffect, useRef, useState } from 'react';
import type { Dish } from '../types';

export function ReelMedia({
  dish,
  active,
  compressed = false,
  muted,
  onMediaClick
}: {
  dish: Dish;
  active: boolean;
  compressed?: boolean;
  muted: boolean;
  onMediaClick?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const poster = dish.image.includes('foodreel-logo') ? undefined : dish.image;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (active && !videoFailed) {
      video.muted = muted;
      void video.play().catch((error: unknown) => {
        if (!(error instanceof DOMException) || error.name !== 'AbortError') {
          setVideoFailed(true);
        }
      });
      return;
    }

    video.pause();
  }, [active, muted, videoFailed]);

  return (
    <div
      className={`absolute inset-x-0 top-0 bg-black transition-[height] duration-500 ease-out ${
        compressed ? 'h-[46%]' : 'h-full'
      }`}
      onClick={onMediaClick}
      role={compressed ? 'button' : undefined}
      tabIndex={compressed ? 0 : undefined}
    >
      {dish.video && !videoFailed ? (
        <video
          className="h-full w-full object-cover"
          loop
          muted={muted}
          onError={() => setVideoFailed(true)}
          playsInline
          poster={poster}
          preload={active ? 'auto' : 'metadata'}
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
    </div>
  );
}

