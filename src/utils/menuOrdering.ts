import type { Dish } from '../types';

export const MENU_CATEGORY_ORDER = ['Entrada', 'Plato fuerte', 'Bebida', 'Postre'] as const;

const categoryAliases: Record<string, string> = {
  bebida: 'Bebida',
  bebidas: 'Bebida',
  'cat-bebida': 'Bebida',
  'cat-bebidas': 'Bebida',
  entrada: 'Entrada',
  entradas: 'Entrada',
  'cat-entrada': 'Entrada',
  'cat-entradas': 'Entrada',
  postre: 'Postre',
  postres: 'Postre',
  'cat-postre': 'Postre',
  'cat-postres': 'Postre',
  'plato fuerte': 'Plato fuerte',
  'platos fuertes': 'Plato fuerte',
  'cat-plato-fuerte': 'Plato fuerte',
  'cat-platos-fuertes': 'Plato fuerte'
};

const categoryLabels: Record<string, string> = {
  Bebida: 'Bebidas',
  Entrada: 'Entradas',
  Postre: 'Postres',
  'Plato fuerte': 'Platos fuertes'
};

function normalizeCategoryKey(category: string) {
  return category.trim().toLowerCase();
}

export function normalizeMenuCategory(category: string) {
  return categoryAliases[normalizeCategoryKey(category)] ?? category.trim();
}

export function formatMenuCategoryLabel(category: string) {
  return categoryLabels[normalizeMenuCategory(category)] ?? category;
}

export function getMenuCategoryRank(category: string) {
  const normalized = normalizeMenuCategory(category);
  const index = MENU_CATEGORY_ORDER.indexOf(normalized as (typeof MENU_CATEGORY_ORDER)[number]);
  return index === -1 ? MENU_CATEGORY_ORDER.length : index;
}

export function getMenuSortOrder(sortOrder: number | undefined) {
  const parsed = Number(sortOrder);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.MAX_SAFE_INTEGER;
}

export function compareMenuDishes(a: Pick<Dish, 'category' | 'name' | 'sortOrder'>, b: Pick<Dish, 'category' | 'name' | 'sortOrder'>) {
  const categoryDelta = getMenuCategoryRank(a.category) - getMenuCategoryRank(b.category);
  if (categoryDelta !== 0) return categoryDelta;

  const sortDelta = getMenuSortOrder(a.sortOrder) - getMenuSortOrder(b.sortOrder);
  if (sortDelta !== 0) return sortDelta;

  return a.name.localeCompare(b.name, 'es');
}

export function getOrderedMenuCategories(dishes: Pick<Dish, 'category'>[]) {
  const categories = new Map<string, string>();
  dishes.forEach((dish) => {
    const category = normalizeMenuCategory(dish.category);
    if (category) categories.set(category, category);
  });

  return Array.from(categories.values()).sort((a, b) => {
    const categoryDelta = getMenuCategoryRank(a) - getMenuCategoryRank(b);
    return categoryDelta || a.localeCompare(b, 'es');
  });
}
