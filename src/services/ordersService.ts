import { restaurantConfig } from '../config/restaurant';
import type { CreateOrderInput, OrderRecord, OrderStatus } from '../types';
import type { CreateOrderPayload, UpdateOrderStatusPayload } from '../types/api';
import { apiRequest, createVisibilityPoller } from './apiClient';
import { getCurrentAdminSession } from './employeesService';

type OrderCallback = (order: OrderRecord | null) => void;
type OrdersCallback = (orders: OrderRecord[]) => void;
type Unsubscribe = () => void;

const FINAL_ORDER_STATES = new Set<OrderStatus>(['delivered', 'paid', 'cancelled']);

export async function createOrder(input: CreateOrderInput) {
  return apiRequest<OrderRecord, CreateOrderPayload>('createOrder', {
    ...input,
    tableAccessToken: restaurantConfig.tableAccessToken
  });
}

export async function getOrderById(orderId: string, customerSessionId?: string, signal?: AbortSignal) {
  return apiRequest<OrderRecord | null, { orderId: string; customerSessionId?: string }>(
    'getOrder',
    { customerSessionId, orderId },
    { signal }
  );
}

export async function getOrdersByTableSession(restaurantId: string, tableSessionId: string, signal?: AbortSignal) {
  return apiRequest<OrderRecord[], { restaurantId: string; tableSessionId: string }>(
    'getRestaurantOrders',
    { restaurantId, tableSessionId },
    { auth: getCurrentAdminSession(), signal }
  );
}

export function subscribeToOrder(orderId: string, customerSessionId: string, callback: OrderCallback): Unsubscribe {
  return createVisibilityPoller((signal) => getOrderById(orderId, customerSessionId, signal), callback, {
    intervalMs: 4000,
    onError: () => undefined,
    shouldStop: (order) => Boolean(order && FINAL_ORDER_STATES.has(order.status))
  });
}

export function subscribeToRestaurantOrders(restaurantId: string, callback: OrdersCallback): Unsubscribe {
  return createVisibilityPoller(
    (signal) =>
      apiRequest<OrderRecord[], { restaurantId: string }>(
        'getRestaurantOrders',
        { restaurantId },
        { auth: getCurrentAdminSession(), signal }
      ),
    callback,
    {
      intervalMs: 4000,
      onError: () => undefined
    }
  );
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return apiRequest<OrderRecord, UpdateOrderStatusPayload>(
    'updateOrderStatus',
    { orderId, status },
    { auth: getCurrentAdminSession() }
  );
}

export async function assignWaiter(orderId: string, waiterId: string) {
  return apiRequest<OrderRecord, { orderId: string; waiterId: string }>(
    'assignWaiter',
    { orderId, waiterId },
    { auth: getCurrentAdminSession() }
  );
}

export async function cancelOrder(orderId: string, reason: string, customerSessionId?: string) {
  return apiRequest<OrderRecord, { customerSessionId?: string; orderId: string; reason: string }>(
    'cancelOrder',
    { customerSessionId, orderId, reason },
    { auth: getCurrentAdminSession() }
  );
}
