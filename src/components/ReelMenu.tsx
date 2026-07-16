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
    <div
      className="reel-scroll h-full snap-y snap-mandatory overflow-y-auto overscroll-contain pb-[84px]"
      ref={containerRef}
    >
      {dishes.map((dish) => (
        <ReelDishCard active={activeDishId === dish.id} dish={dish} key={dish.id} />
      ))}
    </div>
  );
}
