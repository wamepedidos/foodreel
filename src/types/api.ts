import type { AdminDish, DashboardStats, Employee, EmployeeRole } from '../admin/adminTypes';
import type {
  CreateExperiencePostInput,
  CreateOrderInput,
  Dish,
  ExperienceComment,
  ExperiencePost,
  OrderRecord,
  OrderStatus
} from '../types';

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type StaffAuth = {
  userId?: string;
  role?: EmployeeRole | 'admin' | 'waiter' | 'kitchen';
  token?: string;
  restaurantId?: string;
};

export type ApiRequest<TPayload = unknown> = {
  action: string;
  payload?: TPayload;
  auth?: StaffAuth;
};

export type RestaurantRecord = {
  id: string;
  name: string;
  slug: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  description: string;
  address: string;
  phone: string;
  primaryColor: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryRecord = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MediaUploadInput = {
  restaurantId: string;
  dishId?: string;
  postId?: string;
  fileName: string;
  mimeType: string;
  base64: string;
  type: 'image' | 'video';
  isPrimary?: boolean;
  sortOrder?: number;
};

export type MediaRecord = {
  id: string;
  restaurantId: string;
  dishId: string;
  type: 'image' | 'video';
  driveFileId: string;
  fileUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
};

export type WaiterCallType = 'help' | 'cutlery' | 'order' | 'drink' | 'account' | 'other';

export type WaiterCallRecord = {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  tableSessionId: string;
  customerSessionId: string;
  type: WaiterCallType;
  message: string;
  status: 'pending' | 'accepted' | 'resolved' | 'cancelled';
  waiterId: string;
  createdAt: string;
  acceptedAt: string;
  resolvedAt: string;
  cancelledAt: string;
};

export type LoginEmployeeInput = {
  email: string;
  password: string;
  restaurantId: string;
};

export type LoginEmployeeResult = {
  employee: Employee;
  token: string;
  session: StaffAuth;
};

export type CreateOrderPayload = CreateOrderInput & {
  tableAccessToken?: string;
};

export type UpdateOrderStatusPayload = {
  orderId: string;
  status: OrderStatus;
};

export type MenuPayload = {
  restaurantId: string;
};

export type MenuResult = {
  restaurant: RestaurantRecord | null;
  categories: CategoryRecord[];
  dishes: Dish[];
};

export type AdminDishesResult = {
  dishes: AdminDish[];
};

export type EmployeesResult = {
  employees: Employee[];
};

export type DashboardMetricsResult = DashboardStats & {
  salesTotal: number;
  postSharesTotal: number;
  pendingPostsTotal: number;
  topInteractionDish: AdminDish | null;
};

export type CreateCommentPayload = {
  restaurantId: string;
  targetType: 'dish' | 'experiencePost';
  targetId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string | null;
  parentCommentId?: string | null;
  text: string;
};

export type ToggleLikePayload = {
  restaurantId: string;
  targetType: 'dish' | 'experiencePost' | 'comment';
  targetId: string;
  userId?: string;
  sessionId?: string;
  liked: boolean;
};

export type RegisterViewPayload = {
  restaurantId: string;
  targetType: 'dish' | 'experiencePost' | 'menu';
  targetId: string;
  userId?: string;
  sessionId?: string;
};

export type RegisterSharePayload = {
  restaurantId: string;
  targetType: 'dish' | 'experiencePost' | 'menu';
  targetId: string;
  userId?: string;
  sessionId?: string;
  shareMethod: 'nativeShare' | 'copiedLink' | 'whatsapp' | 'other';
};

export type CreateExperiencePayload = CreateExperiencePostInput & {
  mediaDriveFileId?: string | null;
};
