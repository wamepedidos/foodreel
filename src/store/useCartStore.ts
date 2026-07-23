import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dish } from '../types';

type CartItem = {
  dishId: string;
  name: string;
  price: number;
  image: string;
  ingredients: string[];
  quantity: number;
};

type CartState = {
  items: CartItem[];
  selectedDishId?: string;
  addDish: (dish: Dish) => void;
  increment: (dishId: string) => void;
  decrement: (dishId: string) => void;
  clearCart: () => void;
  getQuantity: (dishId: string) => number;
  selectDish: (dishId: string) => void;
  totalQuantity: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedDishId: undefined,
      addDish: (dish) =>
        set((state) => {
          const existing = state.items.find((item) => item.dishId === dish.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item
              ),
              selectedDishId: dish.id
            };
          }

          return {
            items: [
              ...state.items,
              {
                dishId: dish.id,
                image: dish.image,
                ingredients: dish.ingredients,
                name: dish.name,
                price: dish.price,
                quantity: 1
              }
            ],
            selectedDishId: dish.id
          };
        }),
      increment: (dishId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.dishId === dishId ? { ...item, quantity: item.quantity + 1 } : item
          ),
          selectedDishId: dishId
        })),
      decrement: (dishId) =>
        set((state) => {
          const nextItems = state.items
            .map((item) => (item.dishId === dishId ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0);
          return {
            items: nextItems,
            selectedDishId:
              state.selectedDishId === dishId && !nextItems.some((item) => item.dishId === dishId)
                ? nextItems[nextItems.length - 1]?.dishId
                : state.selectedDishId
          };
        }),
      clearCart: () => set({ items: [], selectedDishId: undefined }),
      getQuantity: (dishId) => get().items.find((item) => item.dishId === dishId)?.quantity ?? 0,
      selectDish: (dishId) => set({ selectedDishId: dishId }),
      totalQuantity: () => get().items.reduce((total, item) => total + item.quantity, 0)
    }),
    {
      name: 'foodreel-cart',
      version: 2,
      migrate: () => ({ items: [], selectedDishId: undefined })
    }
  )
);
