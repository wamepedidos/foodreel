import type { OrderStatus } from '../types';

export const ORDER_STATUSES: OrderStatus[] = [
  'new',
  'received',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'account_requested',
  'paid',
  'cancelled'
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Nuevo',
  received: 'Recibido',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  delivered: 'Entregado',
  account_requested: 'Cuenta solicitada',
  paid: 'Pagado',
  cancelled: 'Cancelado'
};

export const ORDER_STATUS_ORDER: Record<OrderStatus, number> = ORDER_STATUSES.reduce(
  (accumulator, status, index) => ({ ...accumulator, [status]: index }),
  {} as Record<OrderStatus, number>
);

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['received', 'confirmed', 'cancelled'],
  received: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'account_requested'],
  delivered: ['account_requested', 'paid'],
  account_requested: ['paid'],
  paid: [],
  cancelled: []
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus) {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function getAllowedNextStatuses(status: OrderStatus) {
  return ORDER_STATUS_TRANSITIONS[status];
}
