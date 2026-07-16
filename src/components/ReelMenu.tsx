import { useEffect, useRef, useState } from 'react';
import type { Dish } from '../types';
import { useMenuStore } from '../store/useMenuStore';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ReelDishCard } from './ReelDishCard';

export function ReelMenu({ dishes }: { dishes: Dish[] }) {
  const [loading, setLoading] = useState(true);
  const storedActiveDishId = useMenuStore((state) => state.activeDishId);
  const setStoredActiveDishId = useMenuStore((state) => state.setActiveDishId);
  const [activeDishId, setActiveDishId] = useState<string | undefined>(storedActiveDishId ?? dishes[0]?.id);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeIndex = Math.max(
    0,
    dishes.findIndex((dish) => dish.id === activeDishId)
  );
  const nextDish = dishes[activeIndex + 1];

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !containerRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target instanceof HTMLElement) {
          const nextDishId = visibleEntry.target.dataset.dishId ?? dishes[0]?.id;
          setActiveDishId(nextDishId);
          if (nextDishId) {
            setStoredActiveDishId(nextDishId);
          }
        }
      },
      {
        root: containerRef.current,
        threshold: [0.65, 0.82]
      }
    );

    const cards = containerRef.current.querySelectorAll<HTMLElement>('[data-dish-id]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [dishes, loading, setStoredActiveDishId]);

  if (loading) {
    return (
      <div className="h-full overflow-hidden pb-[84px]">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <>
      <div
        className="reel-scroll h-full snap-y snap-mandatory overflow-y-auto overscroll-contain pb-[84px]"
        ref={containerRef}
      >
        {dishes.map((dish) => (
          <ReelDishCard active={activeDishId === dish.id} dish={dish} key={dish.id} />
        ))}
      </div>
      <NextVideoPreloader dish={nextDish} />
    </>
  );
}

function NextVideoPreloader({ dish }: { dish?: Dish }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!dish?.video) {
      return undefined;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = dish.video;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [dish?.video]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !dish?.video) {
      return undefined;
    }

    video.muted = true;
    video.preload = 'auto';
    video.load();

    const warmFirstTwoSeconds = () => {
      const targetTime = Number.isFinite(video.duration) && video.duration > 2.2 ? 2 : 0.5;

      try {
        if (video.currentTime < targetTime) {
          video.currentTime = targetTime;
        }
      } catch {
        // Mobile browsers can defer seeking; preload still keeps fetching from the start.
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      warmFirstTwoSeconds();
      return undefined;
    }

    video.addEventListener('loadedmetadata', warmFirstTwoSeconds, { once: true });
    return () => video.removeEventListener('loadedmetadata', warmFirstTwoSeconds);
  }, [dish?.video]);

  if (!dish?.video) {
    return null;
  }

  return (
    <video
      aria-hidden="true"
      className="pointer-events-none fixed -left-2 -top-2 size-px opacity-0"
      muted
      playsInline
      preload="auto"
      ref={videoRef}
      src={dish.video}
      tabIndex={-1}
    />
  );
}
