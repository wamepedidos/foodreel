import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dish, DishAddition } from '../types';

type CartItem = {
  cartItemId: string;
  dishId: string;
  name: string;
  price: number;
  image: string;
  ingredients: string[];
  removableIngredients: string[];
  additions: DishAddition[];
  removedIngredients: string[];
  selectedAdditions: DishAddition[];
  quantity: number;
};

type CartState = {
  items: CartItem[];
  selectedCartItemId?: string;
  selectedDishId?: string;
  addDish: (dish: Dish) => void;
  increment: (cartItemId: string) => void;
  decrement: (cartItemId: string) => void;
  clearCart: () => void;
  getQuantity: (dishId: string) => number;
  selectDish: (cartItemId: string) => void;
  toggleRemovedIngredient: (cartItemId: string, ingredient: string) => void;
  toggleAddition: (cartItemId: string, addition: DishAddition) => void;
  totalQuantity: () => number;
};

function createCartItemId(dishId: string) {
  return `${dishId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedCartItemId: undefined,
      selectedDishId: undefined,
      addDish: (dish) =>
        set((state) => {
          const existing = state.items.find((item) => item.dishId === dish.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item
              ),
              selectedCartItemId: existing.cartItemId,
              selectedDishId: dish.id
            };
          }

          const defaultAdditions = (dish.additions ?? []).filter((addition) => addition.available && addition.defaultSelected);
          const cartItemId = createCartItemId(dish.id);
          return {
            items: [
              ...state.items,
              {
                cartItemId,
                additions: (dish.additions ?? []).filter((addition) => addition.available),
                dishId: dish.id,
                image: dish.image,
                ingredients: dish.ingredients,
                name: dish.name,
                price: dish.price,
                removableIngredients: dish.removableIngredients?.length ? dish.removableIngredients : dish.ingredients,
                removedIngredients: [],
                selectedAdditions: defaultAdditions,
                quantity: 1
              }
            ],
            selectedCartItemId: cartItemId,
            selectedDishId: dish.id
          };
        }),
      increment: (cartItemId) =>
        set((state) => {
          const selected = state.items.find((item) => item.cartItemId === cartItemId || item.dishId === cartItemId);
          return {
            items: state.items.map((item) =>
              item.cartItemId === cartItemId || item.dishId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
            ),
            selectedCartItemId: selected?.cartItemId ?? cartItemId,
            selectedDishId: selected?.dishId
          };
        }),
      decrement: (cartItemId) =>
        set((state) => {
          const nextItems = state.items
            .map((item) => (item.cartItemId === cartItemId || item.dishId === cartItemId ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0);
          const selectedRemoved = nextItems.some((item) => item.cartItemId === state.selectedCartItemId);
          return {
            items: nextItems,
            selectedCartItemId: selectedRemoved ? state.selectedCartItemId : nextItems[nextItems.length - 1]?.cartItemId,
            selectedDishId: selectedRemoved ? state.selectedDishId : nextItems[nextItems.length - 1]?.dishId
          };
        }),
      clearCart: () => set({ items: [], selectedCartItemId: undefined, selectedDishId: undefined }),
      getQuantity: (dishId) => get().items.find((item) => item.dishId === dishId)?.quantity ?? 0,
      selectDish: (cartItemId) =>
        set((state) => {
          const item = state.items.find((value) => value.cartItemId === cartItemId || value.dishId === cartItemId);
          return { selectedCartItemId: item?.cartItemId ?? cartItemId, selectedDishId: item?.dishId };
        }),
      toggleRemovedIngredient: (cartItemId, ingredient) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.cartItemId !== cartItemId) return item;
            const removed = item.removedIngredients.includes(ingredient)
              ? item.removedIngredients.filter((value) => value !== ingredient)
              : [...item.removedIngredients, ingredient];
            return { ...item, removedIngredients: removed };
          }),
          selectedCartItemId: cartItemId,
          selectedDishId: state.items.find((item) => item.cartItemId === cartItemId)?.dishId
        })),
      toggleAddition: (cartItemId, addition) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.cartItemId !== cartItemId) return item;
            const selected = item.selectedAdditions.some((value) => value.id === addition.id)
              ? item.selectedAdditions.filter((value) => value.id !== addition.id)
              : [...item.selectedAdditions, addition];
            return { ...item, selectedAdditions: selected };
          }),
          selectedCartItemId: cartItemId,
          selectedDishId: state.items.find((item) => item.cartItemId === cartItemId)?.dishId
        })),
      totalQuantity: () => get().items.reduce((total, item) => total + item.quantity, 0)
    }),
    {
      name: 'foodreel-cart',
      version: 3,
      migrate: () => ({ items: [], selectedCartItemId: undefined, selectedDishId: undefined })
    }
  )
);
