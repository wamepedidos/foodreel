import { useEffect, useRef, useState } from 'react';
import type { Dish } from '../types';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ReelDishCard } from './ReelDishCard';
import { useMenuStore } from '../store/useMenuStore';

export function ReelMenu({ dishes }: { dishes: Dish[] }) {
  const [loading, setLoading] = useState(true);
  const storedActiveDishId = useMenuStore((state) => state.activeDishId);
  const setStoredActiveDishId = useMenuStore((state) => state.setActiveDishId);
  const restoreDishId = sessionStorage.getItem('foodreel-active-dish-id') ?? storedActiveDishId ?? dishes[0]?.id;
  const [activeDishId, setActiveDishId] = useState<string | undefined>(restoreDishId);
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
            sessionStorage.setItem('foodreel-active-dish-id', nextDishId);
          }
        }
      },
      {
        root: containerRef.current,
        threshold: [0.75, 0.85, 0.92]
      }
    );

    const cards = containerRef.current.querySelectorAll<HTMLElement>('[data-dish-id]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [dishes, loading, setStoredActiveDishId]);

  useEffect(() => {
    const targetDishId = sessionStorage.getItem('foodreel-active-dish-id') ?? storedActiveDishId;

    if (loading || !targetDishId || !containerRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      const cards = Array.from(container?.querySelectorAll<HTMLElement>('[data-dish-id]') ?? []);
      const targetIndex = cards.findIndex((card) => card.dataset.dishId === targetDishId);

      if (!container || targetIndex < 0) {
        return;
      }

      container.scrollTo({ top: targetIndex * container.clientHeight, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loading, storedActiveDishId]);

  if (loading) {
    return (
      <div className="reel-viewport overflow-hidden">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div
      className="reel-scroll reel-viewport"
      ref={containerRef}
    >
      {dishes.map((dish) => (
        <ReelDishCard active={activeDishId === dish.id} dish={dish} key={dish.id} />
      ))}
    </div>
  );
}
