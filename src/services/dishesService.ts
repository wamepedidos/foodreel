import type { AdminDish, DashboardStats, DishMediaItem, DishStatus } from '../admin/adminTypes';
import { restaurantConfig } from '../config/restaurant';
import { dishes as demoDishes } from '../data/dishes';
import type { Dish } from '../types';
import type {
  AdminDishesResult,
  CategoryRecord,
  DashboardMetricsResult,
  MenuPayload,
  MenuResult,
  RegisterSharePayload,
  RegisterViewPayload,
  ToggleLikePayload
} from '../types/api';
import { apiRequest, createVisibilityPoller } from './apiClient';
import { getCurrentAdminSession } from './employeesService';
import { uploadMediaFile } from './mediaService';

const listeners = new Set<(dishes: AdminDish[]) => void>();
let dishesCache: AdminDish[] = [];
let menuCache: { data: MenuResult; expiresAt: number } | null = null;
let dashboardCache: DashboardMetricsResult | null = null;
export const dishCommentsCountChangedEvent = 'foodreel:dish-comments-count';

const categoryFallbacks: Record<string, string> = {
  Parrilla: 'Plato fuerte',
  'Street food': 'Entrada',
  Entradas: 'Entrada',
  Especiales: 'Plato fuerte',
  Pizzas: 'Plato fuerte',
  Tacos: 'Plato fuerte',
  Pollo: 'Plato fuerte',
  Pastas: 'Plato fuerte',
  Postres: 'Postre',
  Sandwiches: 'Plato fuerte'
};

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toSeedDish(index: number): AdminDish {
  const dish = demoDishes[index];
  const categoryId = categoryFallbacks[dish.category] ?? dish.category;

  return {
    id: dish.id,
    restaurantId: restaurantConfig.restaurantId,
    categoryId,
    title: dish.name,
    shortDescription: dish.shortDescription,
    description: dish.description,
    price: dish.price,
    status: dish.available ? 'active' : 'unavailable',
    mainImageUrl: dish.image,
    gallery: [],
    videoUrl: dish.video ?? '',
    videoThumbnailUrl: dish.image,
    servingSizes: index % 3 === 0 ? [2, 3] : [1],
    servingDescription: index % 3 === 0 ? 'Ideal para compartir entre 2 y 3 personas' : '',
    spicyLevel: index % 5 === 0 ? 2 : index % 4 === 0 ? 1 : 0,
    isVegan: false,
    isVegetarian: index % 7 === 0,
    isGlutenFree: index % 6 === 0,
    sauces: [
      {
        id: createId('sauce'),
        name: 'Salsa de ajo',
        description: 'Cremosa y suave',
        price: 0,
        available: true,
        defaultSelected: true,
        imageUrl: ''
      }
    ],
    sauceSelectionRequired: false,
    minimumSauces: 0,
    maximumSauces: 2,
    features: [dish.tag ?? 'Favorito de los clientes'],
    ingredients: dish.ingredients,
    removableIngredients: dish.ingredients,
    additions: [
      {
        id: createId('addition'),
        name: 'Extra queso',
        description: 'Porcion adicional',
        price: 3500,
        available: true,
        defaultSelected: false
      }
    ],
    allergens: index % 4 === 0 ? ['Lacteos'] : [],
    dietaryNotes: '',
    crossContaminationWarning: '',
    preparationTimeMin: 15,
    preparationTimeMax: 25,
    likesCount: dish.likesCount,
    viewsCount: dish.viewsCount,
    commentsCount: dish.commentsCount,
    sharesCount: Math.round(dish.viewsCount * 0.018),
    addedToOrderCount: Math.round(dish.likesCount * 0.35),
    ordersCount: Math.round(dish.likesCount * 0.16),
    customerPostsCount: Math.round(dish.commentsCount * 0.25),
    soldCount: Math.round(dish.likesCount * 0.22),
    sortOrder: index + 1,
    createdAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
    updatedAt: now()
  };
}

function notifyDishes(dishes: AdminDish[]) {
  dishesCache = dishes;
  listeners.forEach((listener) => listener(dishes));
}

export function adminDishToDish(dish: AdminDish): Dish {
  const features = normalizeStringArray(dish.features);
  const allergens = normalizeStringArray(dish.allergens);
  const ingredients = normalizeStringArray(dish.ingredients);
  const sauces = Array.isArray(dish.sauces)
    ? dish.sauces
        .filter((sauce) => sauce.available !== false)
        .map((sauce) => ({
          available: sauce.available !== false,
          defaultSelected: Boolean(sauce.defaultSelected),
          description: String(sauce.description ?? ''),
          id: String(sauce.id || sauce.name),
          name: String(sauce.name).trim(),
          price: Number(sauce.price) || 0
        }))
        .filter((sauce) => sauce.name)
    : [];
  const additions = Array.isArray(dish.additions)
    ? dish.additions
        .filter((addition) => addition.available !== false)
        .map((addition) => ({
          available: addition.available !== false,
          defaultSelected: Boolean(addition.defaultSelected),
          description: String(addition.description ?? ''),
          id: String(addition.id || addition.name),
          name: String(addition.name).trim(),
          price: Number(addition.price) || 0
        }))
        .filter((addition) => addition.name)
    : [];
  const servingSizes = normalizeNumberArray(dish.servingSizes);

  return {
    addedToOrderCount: dish.addedToOrderCount,
    available: dish.status === 'active',
    category: dish.categoryId,
    commentsCount: dish.commentsCount,
    description: dish.description,
    id: dish.id,
    image: dish.mainImageUrl || dish.videoThumbnailUrl || '/brand/foodreel-logo.png',
    ingredients,
    removableIngredients: normalizeStringArray(dish.removableIngredients).length
      ? normalizeStringArray(dish.removableIngredients)
      : ingredients,
    sauces,
    sauceSelectionRequired: normalizeBoolean(dish.sauceSelectionRequired),
    minimumSauces: Number(dish.minimumSauces) || 0,
    maximumSauces: Number(dish.maximumSauces) || sauces.length,
    additions,
    allergens,
    crossContaminationWarning: dish.crossContaminationWarning,
    dietaryNotes: dish.dietaryNotes,
    features,
    isGlutenFree: normalizeBoolean(dish.isGlutenFree),
    isVegan: normalizeBoolean(dish.isVegan),
    isVegetarian: normalizeBoolean(dish.isVegetarian),
    likesCount: dish.likesCount,
    name: dish.title,
    price: dish.price,
    sharesCount: dish.sharesCount,
    shortDescription: dish.shortDescription,
    servingDescription: dish.servingDescription,
    servingSizes,
    spicyLevel: normalizeSpicyLevel(dish.spicyLevel),
    tag: features[0] as Dish['tag'],
    video: dish.videoUrl || undefined,
    viewsCount: dish.viewsCount
  };
}

export function getSeedDishes(): AdminDish[] {
  return demoDishes.map((_, index) => toSeedDish(index));
}

export function getDishesSnapshot() {
  return dishesCache.length ? dishesCache : getSeedDishes();
}

export async function getMenu(options: { forceRefresh?: boolean } = {}) {
  const cached = menuCache;
  if (!options.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const data = await apiRequest<MenuResult, MenuPayload>('getMenu', {
    restaurantId: restaurantConfig.restaurantId
  });

  const adminResult = await apiRequest<AdminDishesResult, { restaurantId: string }>('getDishes', {
    restaurantId: restaurantConfig.restaurantId
  });
  const activeDishes = adminResult.dishes
    .filter((dish) => dish.status === 'active')
    .sort((left, right) => Number(left.sortOrder) - Number(right.sortOrder));
  const baseDishes = activeDishes.length ? activeDishes.map(adminDishToDish) : data.dishes;
  const dishesWithCommentCounts = await hydrateDishCommentCounts(baseDishes);
  const enrichedData = { ...data, dishes: dishesWithCommentCounts };

  menuCache = { data: enrichedData, expiresAt: Date.now() + 60_000 };
  notifyDishes(adminResult.dishes);
  return enrichedData;
}

async function hydrateDishCommentCounts(dishes: Dish[]) {
  if (!dishes.length) return dishes;

  const commentCountResults = await Promise.allSettled(
    dishes.map(async (dish) => {
      const comments = await apiRequest<unknown[], { restaurantId: string; targetId: string; targetType: 'dish' }>('getComments', {
        restaurantId: restaurantConfig.restaurantId,
        targetId: dish.id,
        targetType: 'dish'
      });
      return [dish.id, comments.length] as const;
    })
  );

  const countsByDishId = new Map<string, number>();
  commentCountResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      countsByDishId.set(result.value[0], result.value[1]);
    }
  });

  return dishes.map((dish) => {
    const commentsCount = countsByDishId.get(dish.id);
    return typeof commentsCount === 'number' ? { ...dish, commentsCount } : dish;
  });
}

export async function getCategories() {
  return apiRequest<CategoryRecord[], { restaurantId: string }>('getCategories', {
    restaurantId: restaurantConfig.restaurantId
  });
}

export async function getAdminDishes(signal?: AbortSignal) {
  const result = await apiRequest<AdminDishesResult, { restaurantId: string }>(
    'getDishes',
    { restaurantId: restaurantConfig.restaurantId },
    { signal }
  );
  notifyDishes(result.dishes);
  return result.dishes;
}

export function subscribeToDishes(listener: (dishes: AdminDish[]) => void) {
  listeners.add(listener);
  if (dishesCache.length) {
    listener(dishesCache);
  }

  const unsubscribe = createVisibilityPoller((signal) => getAdminDishes(signal), listener, {
    intervalMs: 30_000,
    onError: () => undefined
  });

  return () => {
    listeners.delete(listener);
    unsubscribe();
  };
}

export async function uploadDishMedia(files: File[], onProgress?: (progress: number) => void): Promise<DishMediaItem[]> {
  const uploaded: DishMediaItem[] = [];
  for (const [index, file] of files.entries()) {
    onProgress?.(Math.round((index / Math.max(1, files.length)) * 85));
    const record = await uploadMediaFile(file, {
      isPrimary: index === 0,
      sortOrder: index + 1
    });
    uploaded.push({
      id: record.id,
      name: record.fileName,
      type: record.type,
      url: record.fileUrl
    });
  }
  onProgress?.(100);
  return uploaded;
}

export async function createDish(input: AdminDish) {
  const saved = await apiRequest<AdminDish, AdminDish>('createDish', normalizeDish(input), {
    auth: getCurrentAdminSession()
  });
  notifyDishes([saved, ...dishesCache.filter((dish) => dish.id !== saved.id)]);
  menuCache = null;
  return saved;
}

export async function updateDish(dishId: string, input: AdminDish) {
  const saved = await apiRequest<AdminDish, { dishId: string; dish: AdminDish }>(
    'updateDish',
    {
      dish: normalizeDish({ ...input, id: dishId }),
      dishId
    },
    { auth: getCurrentAdminSession() }
  );
  notifyDishes(dishesCache.map((dish) => (dish.id === dishId ? saved : dish)));
  menuCache = null;
  return saved;
}

export async function archiveDish(dishId: string) {
  const saved = await apiRequest<AdminDish, { dishId: string; restaurantId: string }>(
    'archiveDish',
    {
      dishId,
      restaurantId: restaurantConfig.restaurantId
    },
    { auth: getCurrentAdminSession() }
  );
  notifyDishes(dishesCache.map((dish) => (dish.id === dishId ? saved : dish)));
  menuCache = null;
  return saved;
}

export async function duplicateDish(dishId: string) {
  const source = getDishesSnapshot().find((dish) => dish.id === dishId);
  if (!source) throw new Error('Dish not found');

  return createDish({
    ...source,
    id: '',
    title: `${source.title} copia`,
    status: 'draft',
    likesCount: 0,
    viewsCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    addedToOrderCount: 0,
    ordersCount: 0,
    customerPostsCount: 0,
    soldCount: 0,
    sortOrder: getDishesSnapshot().length + 1,
    createdAt: now(),
    updatedAt: now()
  });
}

export async function updateDishAvailability(dishId: string, status: DishStatus) {
  const saved = await apiRequest<AdminDish, { dishId: string; restaurantId: string; status: DishStatus }>(
    'updateDishStatus',
    {
      dishId,
      restaurantId: restaurantConfig.restaurantId,
      status
    },
    { auth: getCurrentAdminSession() }
  );
  notifyDishes(dishesCache.map((dish) => (dish.id === dishId ? saved : dish)));
  menuCache = null;
  return saved;
}

export async function incrementDishShare(dishId: string, shareMethod: RegisterSharePayload['shareMethod'] = 'nativeShare') {
  const result = await apiRequest<{ count: number }, RegisterSharePayload>('registerShare', {
    restaurantId: restaurantConfig.restaurantId,
    shareMethod,
    targetId: dishId,
    targetType: 'dish'
  });
  notifyDishes(dishesCache.map((dish) => (dish.id === dishId ? { ...dish, sharesCount: result.count } : dish)));
  return result.count;
}

export async function incrementMenuSharesCount(shareMethod: RegisterSharePayload['shareMethod'] = 'nativeShare') {
  const result = await apiRequest<{ count: number }, RegisterSharePayload>('registerShare', {
    restaurantId: restaurantConfig.restaurantId,
    shareMethod,
    targetId: restaurantConfig.restaurantId,
    targetType: 'menu'
  });
  window.dispatchEvent(new CustomEvent('foodreel:menu-share', { detail: result.count }));
  dashboardCache = dashboardCache ? { ...dashboardCache, menuSharesCount: result.count } : null;
  return result.count;
}

export async function incrementDishAddedToOrder(dishId: string) {
  const result = await apiRequest<{ count: number }, { dishId: string; restaurantId: string }>('registerDishAddedToOrder', {
    dishId,
    restaurantId: restaurantConfig.restaurantId
  });
  notifyDishes(dishesCache.map((dish) => (dish.id === dishId ? { ...dish, addedToOrderCount: result.count } : dish)));
  return result.count;
}

export function incrementCachedDishComments(dishId: string) {
  if (dishesCache.length) {
    notifyDishes(dishesCache.map((dish) => (dish.id === dishId ? { ...dish, commentsCount: dish.commentsCount + 1 } : dish)));
  }

  if (menuCache) {
    menuCache = {
      ...menuCache,
      data: {
        ...menuCache.data,
        dishes: menuCache.data.dishes.map((dish) => (dish.id === dishId ? { ...dish, commentsCount: dish.commentsCount + 1 } : dish))
      }
    };
  }

  dashboardCache = null;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(dishCommentsCountChangedEvent, { detail: { dishId, delta: 1 } }));
  }
}

export async function toggleDishLike(dishId: string, liked: boolean, sessionId: string) {
  const result = await apiRequest<{ liked: boolean; count: number }, ToggleLikePayload>('toggleLike', {
    liked,
    restaurantId: restaurantConfig.restaurantId,
    sessionId,
    targetId: dishId,
    targetType: 'dish'
  });
  notifyDishes(dishesCache.map((dish) => (dish.id === dishId ? { ...dish, likesCount: result.count } : dish)));
  return result;
}

export async function registerDishView(dishId: string, sessionId: string) {
  const result = await apiRequest<{ counted: boolean; count: number }, RegisterViewPayload>('registerView', {
    restaurantId: restaurantConfig.restaurantId,
    sessionId,
    targetId: dishId,
    targetType: 'dish'
  });
  notifyDishes(dishesCache.map((dish) => (dish.id === dishId ? { ...dish, viewsCount: result.count } : dish)));
  return result;
}

export async function getMenuSharesCount() {
  const metrics = dashboardCache ?? (await getDashboardMetrics());
  return metrics.menuSharesCount;
}

export async function getDashboardMetrics(signal?: AbortSignal) {
  const metrics = await apiRequest<DashboardMetricsResult, { restaurantId: string }>(
    'getDashboardMetrics',
    { restaurantId: restaurantConfig.restaurantId },
    { auth: getCurrentAdminSession(), signal }
  );
  dashboardCache = metrics;
  return metrics;
}

export function getDashboardStats(dishes: AdminDish[], menuSharesCount = dashboardCache?.menuSharesCount ?? 0): DashboardStats {
  const visibleDishes = dishes.filter((dish) => dish.status !== 'archived');
  const totals = visibleDishes.reduce(
    (acc, dish) => ({
      added: acc.added + dish.addedToOrderCount,
      comments: acc.comments + dish.commentsCount,
      likes: acc.likes + dish.likesCount,
      orders: acc.orders + dish.ordersCount,
      posts: acc.posts + dish.customerPostsCount,
      shares: acc.shares + dish.sharesCount,
      views: acc.views + dish.viewsCount
    }),
    { added: 0, comments: 0, likes: 0, orders: 0, posts: 0, shares: 0, views: 0 }
  );
  const interactions = totals.likes + totals.comments + totals.shares;
  const categoryViews = visibleDishes.reduce<Record<string, number>>((acc, dish) => {
    acc[dish.categoryId] = (acc[dish.categoryId] ?? 0) + dish.viewsCount;
    return acc;
  }, {});

  return {
    activeDishes: visibleDishes.filter((dish) => dish.status === 'active').length,
    addedToOrderTotal: totals.added,
    averageInteractions: visibleDishes.length ? interactions / visibleDishes.length : 0,
    averageViews: visibleDishes.length ? totals.views / visibleDishes.length : 0,
    commentsTotal: totals.comments,
    customerPostsTotal: totals.posts,
    dishSharesTotal: totals.shares,
    interactionRate: totals.views > 0 ? interactions / totals.views : 0,
    likesTotal: totals.likes,
    menuSharesCount,
    ordersSentTotal: totals.orders,
    topAddedDish: topBy(visibleDishes, 'addedToOrderCount'),
    topCategory: Object.entries(categoryViews).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Sin datos',
    topCommentedDish: topBy(visibleDishes, 'commentsCount'),
    topLikedDish: topBy(visibleDishes, 'likesCount'),
    topSharedDish: topBy(visibleDishes, 'sharesCount'),
    topViewedDish: topBy(visibleDishes, 'viewsCount'),
    unavailableDishes: visibleDishes.filter((dish) => dish.status === 'unavailable').length,
    viewsTotal: totals.views
  };
}

function topBy(dishes: AdminDish[], metric: keyof AdminDish) {
  return [...dishes].sort((a, b) => Number(b[metric]) - Number(a[metric]))[0] ?? null;
}

function normalizeDish(dish: AdminDish): AdminDish {
  return {
    ...dish,
    restaurantId: dish.restaurantId || restaurantConfig.restaurantId,
    servingSizes: dish.servingSizes.map(Number).filter((item) => Number.isFinite(item)),
    preparationTimeMin: normalizePreparationTime(dish.preparationTimeMin),
    preparationTimeMax: normalizePreparationTime(dish.preparationTimeMax)
  };
}

function normalizePreparationTime(value: number | ''): number | '' {
  return value === '' ? '' : Number(value);
}

function dishToAdminDish(dish: Dish): AdminDish {
  return {
    addedToOrderCount: dish.addedToOrderCount ?? 0,
    allergens: dish.allergens ?? [],
    categoryId: dish.category,
    commentsCount: dish.commentsCount,
    createdAt: now(),
    crossContaminationWarning: dish.crossContaminationWarning ?? '',
    customerPostsCount: 0,
    description: dish.description,
    dietaryNotes: dish.dietaryNotes ?? '',
    features: dish.features ?? (dish.tag ? [dish.tag] : []),
    gallery: [],
    id: dish.id,
    ingredients: dish.ingredients,
    isGlutenFree: dish.isGlutenFree ?? false,
    isVegan: dish.isVegan ?? false,
    isVegetarian: dish.isVegetarian ?? false,
    likesCount: dish.likesCount,
    mainImageUrl: dish.image,
    maximumSauces: dish.sauces?.length ? Math.min(2, dish.sauces.length) : 0,
    minimumSauces: 0,
    ordersCount: 0,
    preparationTimeMax: '',
    preparationTimeMin: '',
    price: dish.price,
    restaurantId: restaurantConfig.restaurantId,
    removableIngredients: dish.removableIngredients ?? dish.ingredients,
    sauceSelectionRequired: Boolean(dish.sauceSelectionRequired),
    sauces:
      dish.sauces?.map((sauce) => ({
        id: createId('sauce'),
        name: sauce.name,
        description: sauce.description ?? '',
        price: sauce.price,
        available: sauce.available,
        defaultSelected: Boolean(sauce.defaultSelected),
        imageUrl: ''
      })) ?? [],
    additions:
      dish.additions?.map((addition) => ({
        id: createId('addition'),
        name: addition.name,
        description: addition.description ?? '',
        price: addition.price,
        available: addition.available,
        defaultSelected: Boolean(addition.defaultSelected)
      })) ?? [],
    servingDescription: dish.servingDescription ?? '',
    servingSizes: dish.servingSizes ?? [1],
    sharesCount: dish.sharesCount ?? 0,
    shortDescription: dish.shortDescription,
    soldCount: 0,
    sortOrder: 0,
    spicyLevel: dish.spicyLevel ?? 0,
    status: dish.available ? 'active' : 'unavailable',
    title: dish.name,
    updatedAt: now(),
    videoThumbnailUrl: dish.image,
    videoUrl: dish.video ?? '',
    viewsCount: dish.viewsCount
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return normalizeStringArray(parsed);
  } catch {
    return [trimmed];
  }
}

function normalizeNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? [value] : [];
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return normalizeNumberArray(parsed);
  } catch {
    const parsedNumber = Number(trimmed);
    return Number.isFinite(parsedNumber) ? [parsedNumber] : [];
  }
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || String(value).toLowerCase() === 'true';
}

function normalizeSpicyLevel(value: unknown): 0 | 1 | 2 | 3 {
  const level = Math.max(0, Math.min(3, Math.round(Number(value) || 0)));
  return level as 0 | 1 | 2 | 3;
}
