import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SavedState = {
  savedIds: string[];
  toggleSaved: (dishId: string) => void;
  isSaved: (dishId: string) => boolean;
};

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSaved: (dishId) =>
        set((state) => ({
          savedIds: state.savedIds.includes(dishId)
            ? state.savedIds.filter((id) => id !== dishId)
            : [...state.savedIds, dishId]
        })),
      isSaved: (dishId) => get().savedIds.includes(dishId)
    }),
    {
      name: 'saborea-saved'
    }
  )
);
