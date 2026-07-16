import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dish } from '../types';

type CartItem = {
  dishId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addDish: (dish: Dish) => void;
  increment: (dishId: string) => void;
  decrement: (dishId: string) => void;
  getQuantity: (dishId: string) => number;
  totalQuantity: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addDish: (dish) =>
        set((state) => {
          const existing = state.items.find((item) => item.dishId === dish.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item
              )
            };
          }

          return {
            items: [
              ...state.items,
              {
                dishId: dish.id,
                name: dish.name,
                price: dish.price,
                image: dish.image,
                quantity: 1
              }
            ]
          };
        }),
      increment: (dishId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.dishId === dishId ? { ...item, quantity: item.quantity + 1 } : item
          )
        })),
      decrement: (dishId) =>
        set((state) => ({
          items: state.items
            .map((item) => (item.dishId === dishId ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0)
        })),
      getQuantity: (dishId) => get().items.find((item) => item.dishId === dishId)?.quantity ?? 0,
      totalQuantity: () => get().items.reduce((total, item) => total + item.quantity, 0)
    }),
    {
      name: 'foodreel-cart'
    }
  )
);
