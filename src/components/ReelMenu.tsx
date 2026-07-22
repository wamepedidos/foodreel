import { Grid2X2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dish } from '../types';
import { useMenuStore } from '../store/useMenuStore';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ReelDishCard } from './ReelDishCard';
import { WaiterCallButton } from './WaiterCallButton';

export function ReelMenu({ dishes }: { dishes: Dish[] }) {
  const [loading, setLoading] = useState(true);
  const storedActiveDishId = useMenuStore((state) => state.activeDishId);
  const setStoredActiveDishId = useMenuStore((state) => state.setActiveDishId);
  const selectedCategory = useMenuStore((state) => state.selectedCategory);
  const setSelectedCategory = useMenuStore((state) => state.setSelectedCategory);
  const setViewMode = useMenuStore((state) => state.setViewMode);
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(dishes.map((dish) => dish.category).filter(Boolean)))], [dishes]);
  const [activeDishId, setActiveDishId] = useState<string | undefined>(storedActiveDishId ?? dishes[0]?.id);
  const [muted, setMuted] = useState(true);
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
    if (selectedCategory === 'Todos' || categories.includes(selectedCategory)) {
      return;
    }
    setSelectedCategory('Todos');
  }, [categories, selectedCategory, setSelectedCategory]);

  useEffect(() => {
    const firstDishId = dishes[0]?.id;
    if (!firstDishId) {
      setActiveDishId(undefined);
      return;
    }

    if (!dishes.some((dish) => dish.id === activeDishId)) {
      setActiveDishId(firstDishId);
      setStoredActiveDishId(firstDishId);
      containerRef.current?.scrollTo({ top: 0 });
    }
  }, [activeDishId, dishes, setStoredActiveDishId]);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    const targetDish = category === 'Todos' ? dishes[0] : dishes.find((dish) => dish.category === category);
    if (!targetDish || !containerRef.current) return;

    const target = containerRef.current.querySelector<HTMLElement>(`[data-dish-id="${targetDish.id}"]`);
    if (!target) return;

    setActiveDishId(targetDish.id);
    setStoredActiveDishId(targetDish.id);
    containerRef.current.scrollTo({ behavior: 'smooth', top: target.offsetTop });
  };

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
            const activeDish = dishes.find((dish) => dish.id === nextDishId);
            if (activeDish?.category) {
              setSelectedCategory(activeDish.category);
            }
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
  }, [dishes, loading, setSelectedCategory, setStoredActiveDishId]);

  if (loading) {
    return (
      <div className="h-full overflow-hidden">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <>
      <ReelCategoryBar
        categories={categories}
        onSelect={selectCategory}
        onShowGrid={() => setViewMode('grid')}
        selectedCategory={selectedCategory}
      />
      <div
        className="reel-scroll h-full snap-y snap-mandatory overflow-y-auto overscroll-contain"
        ref={containerRef}
      >
        {dishes.map((dish) => (
          <ReelDishCard
            active={activeDishId === dish.id}
            dish={dish}
            key={dish.id}
            muted={muted}
            onToggleAudio={() => setMuted((value) => !value)}
            topBar
          />
        ))}
      </div>
      <NextVideoPreloader dish={nextDish} />
    </>
  );
}

function ReelCategoryBar({
  categories,
  onSelect,
  onShowGrid,
  selectedCategory
}: {
  categories: string[];
  onSelect: (category: string) => void;
  onShowGrid: () => void;
  selectedCategory: string;
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-30 bg-transparent px-4 pt-[calc(1px+env(safe-area-inset-top))] text-paper">
      <div className="flex h-8 items-center gap-3 border-b border-paper/28">
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-4 overflow-x-auto">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                aria-pressed={active}
                className="relative h-8 shrink-0 px-0 text-xs font-normal text-paper transition hover:text-paper"
                key={category}
                onClick={() => onSelect(category)}
                type="button"
              >
                {formatCategoryLabel(category)}
                {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent" /> : null}
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label="Abrir carta en cuadricula"
            className="grid size-6 place-items-center rounded-full border border-paper/45 bg-transparent text-paper transition hover:border-accent/80 hover:text-accent"
            onClick={onShowGrid}
            title="Abrir carta en cuadricula"
            type="button"
          >
            <Grid2X2 className="size-3.5" />
          </button>
          <WaiterCallButton variant="reel" />
        </div>
      </div>
    </div>
  );
}

function formatCategoryLabel(category: string) {
  if (category === 'Plato fuerte') return 'Platos fuertes';
  return category;
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
