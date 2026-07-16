import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MenuViewMode = 'reel' | 'grid';

type MenuState = {
  activeDishId?: string;
  likedIds: string[];
  searchQuery: string;
  selectedCategory: string;
  viewMode: MenuViewMode;
  isLiked: (dishId: string) => boolean;
  setActiveDishId: (dishId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setViewMode: (mode: MenuViewMode) => void;
  toggleLike: (dishId: string) => void;
};

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      activeDishId: undefined,
      likedIds: [],
      searchQuery: '',
      selectedCategory: 'Todos',
      viewMode: 'reel',
      isLiked: (dishId) => get().likedIds.includes(dishId),
      setActiveDishId: (dishId) => set({ activeDishId: dishId }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleLike: (dishId) =>
        set((state) => ({
          likedIds: state.likedIds.includes(dishId)
            ? state.likedIds.filter((id) => id !== dishId)
            : [...state.likedIds, dishId]
        }))
    }),
    {
      name: 'foodreel-menu'
    }
  )
);
