export type DishStatus = 'draft' | 'active' | 'unavailable' | 'archived';

export type Sauce = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  defaultSelected: boolean;
  imageUrl: string;
};

export type DishMediaItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
};

export type AdminDish = {
  id: string;
  restaurantId: string;
  categoryId: string;
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  status: DishStatus;
  mainImageUrl: string;
  gallery: DishMediaItem[];
  videoUrl: string;
  videoThumbnailUrl: string;
  servingSizes: number[];
  servingDescription: string;
  spicyLevel: 0 | 1 | 2 | 3;
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  sauces: Sauce[];
  sauceSelectionRequired: boolean;
  minimumSauces: number;
  maximumSauces: number;
  features: string[];
  ingredients: string[];
  allergens: string[];
  dietaryNotes: string;
  crossContaminationWarning: string;
  preparationTimeMin: number | '';
  preparationTimeMax: number | '';
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  addedToOrderCount: number;
  ordersCount: number;
  customerPostsCount: number;
  soldCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeRole = 'ADMINISTRADOR' | 'MESERO' | 'COCINA';

export type EmployeeStatus = 'active' | 'inactive' | 'archived';

export type Employee = {
  id: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  temporaryPassword: string;
  invitationSent: boolean;
  notificationsEnabled: boolean;
  pushSubscriptionId: string;
  deviceTokens: string[];
  lastNotificationAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastAccessAt: string | null;
};

export type AdminSession = {
  userId: string;
  role: EmployeeRole;
  restaurantId: string;
};

export type DashboardStats = {
  viewsTotal: number;
  likesTotal: number;
  commentsTotal: number;
  dishSharesTotal: number;
  menuSharesCount: number;
  addedToOrderTotal: number;
  ordersSentTotal: number;
  customerPostsTotal: number;
  activeDishes: number;
  unavailableDishes: number;
  topViewedDish: AdminDish | null;
  topLikedDish: AdminDish | null;
  topCommentedDish: AdminDish | null;
  topSharedDish: AdminDish | null;
  topAddedDish: AdminDish | null;
  topCategory: string;
  averageViews: number;
  averageInteractions: number;
  interactionRate: number;
};
