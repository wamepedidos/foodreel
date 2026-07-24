import { useEffect, useRef, useState } from 'react';
import type { Dish } from '../types';
import { getVideoResumeTime, hasVideoLoaded, markVideoLoaded, saveVideoResumeTime } from '../utils/reelVideoCache';

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
  const videoAlreadyLoaded = hasVideoLoaded(dish.video);

  useEffect(() => {
    setVideoFailed(false);
  }, [dish.video]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !dish.video) {
      return undefined;
    }

    const restoreTime = () => {
      const resumeTime = getVideoResumeTime(dish.video);
      if (resumeTime > 0.25 && Number.isFinite(video.duration) && resumeTime < video.duration - 0.25) {
        try {
          video.currentTime = resumeTime;
        } catch {
          // Some mobile browsers only allow seeking after enough metadata is available.
        }
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      restoreTime();
    } else {
      video.addEventListener('loadedmetadata', restoreTime, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', restoreTime);
      saveVideoResumeTime(dish.video, video.currentTime);
    };
  }, [dish.video]);

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
          onCanPlay={() => markVideoLoaded(dish.video)}
          onLoadedData={() => markVideoLoaded(dish.video)}
          onError={() => setVideoFailed(true)}
          onTimeUpdate={(event) => saveVideoResumeTime(dish.video, event.currentTarget.currentTime)}
          playsInline
          poster={poster}
          preload={active || videoAlreadyLoaded ? 'auto' : 'metadata'}
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

