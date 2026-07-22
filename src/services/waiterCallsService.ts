import { restaurantConfig } from '../config/restaurant';
import type { WaiterCallRecord, WaiterCallType } from '../types/api';
import { getOrCreateCustomerSessionId, getOrCreateTableSessionId } from '../utils/session';
import { apiRequest, createVisibilityPoller } from './apiClient';
import { getCurrentAdminSession } from './employeesService';

export async function createWaiterCall(input: { type: WaiterCallType; message?: string }) {
  return apiRequest<WaiterCallRecord, Partial<WaiterCallRecord> & { tableAccessToken?: string }>('createWaiterCall', {
    customerSessionId: getOrCreateCustomerSessionId(),
    message: input.message ?? '',
    restaurantId: restaurantConfig.restaurantId,
    tableAccessToken: restaurantConfig.tableAccessToken,
    tableId: restaurantConfig.tableId,
    tableNumber: restaurantConfig.tableNumber,
    tableSessionId: getOrCreateTableSessionId(restaurantConfig.restaurantId, restaurantConfig.tableId),
    type: input.type
  });
}

export async function getWaiterCalls(signal?: AbortSignal) {
  return apiRequest<WaiterCallRecord[], { restaurantId: string }>(
    'getWaiterCalls',
    { restaurantId: restaurantConfig.restaurantId },
    { auth: getCurrentAdminSession(), signal }
  );
}

export function subscribeToWaiterCalls(callback: (calls: WaiterCallRecord[]) => void) {
  return createVisibilityPoller((signal) => getWaiterCalls(signal), callback, {
    intervalMs: 4000,
    onError: () => undefined
  });
}

export async function updateWaiterCallStatus(callId: string, status: WaiterCallRecord['status']) {
  return apiRequest<WaiterCallRecord, { callId: string; restaurantId: string; status: WaiterCallRecord['status'] }>(
    'updateWaiterCallStatus',
    { callId, restaurantId: restaurantConfig.restaurantId, status },
    { auth: getCurrentAdminSession() }
  );
}
