import type { Dish } from '../types';
import { GridMenu } from './GridMenu';
import { ReelMenu } from './ReelMenu';
import { useMenuStore } from '../store/useMenuStore';

export function MenuExperience({
  dishes,
  hasMore,
  loadingMore,
  onLoadMore
}: {
  dishes: Dish[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  const viewMode = useMenuStore((state) => state.viewMode);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="h-full w-full transition-opacity duration-200 ease-out">
        {viewMode === 'grid' ? (
          <GridMenu dishes={dishes} hasMore={hasMore} loadingMore={loadingMore} onLoadMore={onLoadMore} />
        ) : (
          <ReelMenu dishes={dishes} hasMore={hasMore} loadingMore={loadingMore} onLoadMore={onLoadMore} />
        )}
      </div>
    </div>
  );
}
