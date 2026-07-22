import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dish, DishCustomizationChoice, OrderItemOption } from '../types';

export type CartCustomization = {
  removedIngredients: string[];
  selectedAdditions: DishCustomizationChoice[];
  selectedSauces: DishCustomizationChoice[];
  notes: string;
};

type CartItem = {
  cartItemId: string;
  dishId: string;
  name: string;
  basePrice: number;
  price: number;
  image: string;
  ingredients: string[];
  removableIngredients: string[];
  sauceOptions: DishCustomizationChoice[];
  additionOptions: DishCustomizationChoice[];
  selectedSauces: DishCustomizationChoice[];
  removedIngredients: string[];
  selectedAdditions: DishCustomizationChoice[];
  notes: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  selectedCartItemId?: string;
  selectedDishId?: string;
  addDish: (dish: Dish, customization?: CartCustomization) => void;
  increment: (itemId: string) => void;
  decrement: (itemId: string) => void;
  clearCart: () => void;
  getQuantity: (dishId: string) => number;
  selectDish: (itemId: string) => void;
  totalQuantity: () => number;
};

function createCartItemId() {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeChoice(choice: DishCustomizationChoice): DishCustomizationChoice {
  return {
    available: choice.available !== false,
    defaultSelected: Boolean(choice.defaultSelected),
    description: choice.description ?? '',
    id: String(choice.id || choice.name),
    name: String(choice.name).trim(),
    price: Number(choice.price) || 0
  };
}

function normalizeChoices(choices: unknown = []) {
  return Array.isArray(choices) ? choices.map(normalizeChoice).filter((choice) => choice.name) : [];
}

function choiceKey(choice: DishCustomizationChoice) {
  return `${choice.id}:${choice.name}:${choice.price}`;
}

function listKey(values: string[]) {
  return [...values].map((value) => value.trim()).filter(Boolean).sort().join('|');
}

function customizationKey(item: Pick<CartItem, 'dishId' | 'removedIngredients' | 'selectedAdditions' | 'selectedSauces' | 'notes'>) {
  const removedIngredients = Array.isArray(item.removedIngredients) ? item.removedIngredients : [];
  const selectedSauces = normalizeChoices(item.selectedSauces);
  const selectedAdditions = normalizeChoices(item.selectedAdditions);
  return [
    item.dishId,
    listKey(removedIngredients),
    selectedSauces.map(choiceKey).sort().join('|'),
    selectedAdditions.map(choiceKey).sort().join('|'),
    String(item.notes ?? '').trim()
  ].join('::');
}

function toOrderOption(choice: DishCustomizationChoice): OrderItemOption {
  return {
    name: choice.name,
    price: choice.price,
    value: choice.name
  };
}

export function cartItemToOrderDetails(item: CartItem) {
  return {
    additions: normalizeChoices(item.selectedAdditions).map(toOrderOption),
    removedIngredients: Array.isArray(item.removedIngredients) ? item.removedIngredients : [],
    sauces: normalizeChoices(item.selectedSauces).map(toOrderOption)
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedCartItemId: undefined,
      selectedDishId: undefined,
      addDish: (dish, customization) =>
        set((state) => {
          const selectedAdditions = normalizeChoices(customization?.selectedAdditions);
          const selectedSauces = normalizeChoices(customization?.selectedSauces);
          const removedIngredients = customization?.removedIngredients.map((item) => item.trim()).filter(Boolean) ?? [];
          const notes = customization?.notes.trim() ?? '';
          const additionTotal = selectedAdditions.reduce((total, addition) => total + addition.price, 0);
          const nextItem: CartItem = {
            additionOptions: normalizeChoices(dish.additions),
            basePrice: dish.price,
            cartItemId: createCartItemId(),
            dishId: dish.id,
            image: dish.image,
            ingredients: dish.ingredients,
            name: dish.name,
            notes,
            price: dish.price + additionTotal,
            quantity: 1,
            removableIngredients: dish.removableIngredients?.length ? dish.removableIngredients : dish.ingredients,
            removedIngredients,
            sauceOptions: normalizeChoices(dish.sauces),
            selectedAdditions,
            selectedSauces
          };
          const nextKey = customizationKey(nextItem);
          const existing = state.items.find((item) => customizationKey(item) === nextKey);

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.cartItemId === existing.cartItemId ? { ...item, quantity: item.quantity + 1 } : item
              ),
              selectedCartItemId: existing.cartItemId,
              selectedDishId: dish.id
            };
          }

          return {
            items: [...state.items, nextItem],
            selectedCartItemId: nextItem.cartItemId,
            selectedDishId: dish.id
          };
        }),
      increment: (itemId) =>
        set((state) => {
          const target = state.items.find((item) => item.cartItemId === itemId) ?? state.items.find((item) => item.dishId === itemId);
          if (!target) return state;
          return {
            items: state.items.map((item) =>
              item.cartItemId === target.cartItemId ? { ...item, quantity: item.quantity + 1 } : item
            ),
            selectedCartItemId: target.cartItemId,
            selectedDishId: target.dishId
          };
        }),
      decrement: (itemId) =>
        set((state) => {
          const target = state.items.find((item) => item.cartItemId === itemId) ?? state.items.find((item) => item.dishId === itemId);
          if (!target) return state;
          const nextItems = state.items
            .map((item) => (item.cartItemId === target.cartItemId ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0);
          return {
            items: nextItems,
            selectedCartItemId:
              state.selectedCartItemId === target.cartItemId && !nextItems.some((item) => item.cartItemId === target.cartItemId)
                ? nextItems[nextItems.length - 1]?.cartItemId
                : state.selectedCartItemId,
            selectedDishId:
              state.selectedDishId === target.dishId && !nextItems.some((item) => item.dishId === target.dishId)
                ? nextItems[nextItems.length - 1]?.dishId
                : state.selectedDishId
          };
        }),
      clearCart: () => set({ items: [], selectedCartItemId: undefined, selectedDishId: undefined }),
      getQuantity: (dishId) => get().items.filter((item) => item.dishId === dishId).reduce((total, item) => total + item.quantity, 0),
      selectDish: (itemId) =>
        set((state) => {
          const target = state.items.find((item) => item.cartItemId === itemId) ?? state.items.find((item) => item.dishId === itemId);
          return {
            selectedCartItemId: target?.cartItemId,
            selectedDishId: target?.dishId ?? itemId
          };
        }),
      totalQuantity: () => get().items.reduce((total, item) => total + item.quantity, 0)
    }),
    {
      name: 'foodreel-cart'
    }
  )
);
