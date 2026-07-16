import type { Dish } from '../types';
import { GridMenu } from './GridMenu';
import { ReelMenu } from './ReelMenu';
import { useMenuStore } from '../store/useMenuStore';

export function MenuExperience({ dishes }: { dishes: Dish[] }) {
  const viewMode = useMenuStore((state) => state.viewMode);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="h-full w-full transition-opacity duration-200 ease-out">
        {viewMode === 'grid' ? <GridMenu dishes={dishes} /> : <ReelMenu dishes={dishes} />}
      </div>
    </div>
  );
}
