export type DishTag = 'Más pedido' | 'Nuevo' | 'Recomendado' | 'Promoción';

export type Dish = {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number;
  image: string;
  video?: string;
  ingredients: string[];
  available: boolean;
  tag?: DishTag;
  servingSizes?: number[];
  servingDescription?: string;
  spicyLevel?: 0 | 1 | 2 | 3;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  features?: string[];
  allergens?: string[];
  dietaryNotes?: string;
  crossContaminationWarning?: string;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount?: number;
  addedToOrderCount?: number;
};

export type RestaurantConfig = {
  restaurantId: string;
  brandName: string;
  restaurantName: string;
  logoSrc?: string;
  logoText: string;
  tableId: string;
  tableNumber: number;
  tableAccessToken?: string;
  colors: {
    primary: string;
    background: string;
    surface: string;
  };
  info: {
    address: string;
    serviceLabel: string;
  };
};

export type OrderStatus =
  | 'new'
  | 'received'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'account_requested'
  | 'paid'
  | 'cancelled';

export type OrderItemOption = {
  name: string;
  value: string;
  price?: number;
};

export type OrderItem = {
  dishId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: OrderItemOption[];
  selectedExtras: OrderItemOption[];
  ingredients?: string[];
  notes: string;
  subtotal: number;
};

export type OrderRecord = {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  tableSessionId: string;
  customerSessionId: string;
  orderNumber: number;
  idempotencyKey: string;
  source: 'customer_pwa';
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  upsellTotal: number;
  total: number;
  customerNotes: string;
  waiterId: string | null;
  createdAt: string;
  receivedAt: string | null;
  confirmedAt: string | null;
  preparationStartedAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
};

export type CreateOrderInput = {
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  tableSessionId: string;
  customerSessionId: string;
  idempotencyKey: string;
  source: 'customer_pwa';
  items: OrderItem[];
  subtotal: number;
  upsellTotal: number;
  total: number;
  customerNotes: string;
};

export type ExperiencePostStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

export type ExperiencePost = {
  id: string;
  restaurantId: string;
  tableSessionId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  userPhotoUrl?: string | null;
  mediaUrl: string | null;
  mediaDriveFileId?: string | null;
  mediaType: 'image' | 'video' | null;
  text: string;
  dishId: string | null;
  dishName: string | null;
  dishImage: string | null;
  orderId: string | null;
  status: ExperiencePostStatus;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateExperiencePostInput = {
  restaurantId: string;
  tableSessionId: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  userPhotoUrl?: string | null;
  mediaUrl?: string | null;
  mediaDriveFileId?: string | null;
  mediaType?: 'image' | 'video' | null;
  text: string;
  dishId?: string | null;
  dishName?: string | null;
  dishImage?: string | null;
  orderId?: string | null;
  idempotencyKey: string;
};

export type ExperienceComment = {
  id: string;
  restaurantId?: string;
  targetType?: 'dish' | 'experiencePost';
  targetId?: string;
  experiencePostId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string | null;
  text: string;
  status?: 'pending' | 'approved' | 'hidden' | 'deleted';
  likesCount?: number;
  parentId: string | null;
  parentCommentId?: string | null;
  createdAt: string;
  updatedAt?: string;
};
