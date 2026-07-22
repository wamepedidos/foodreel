import type { AdminSession, Employee, EmployeeRole, EmployeeStatus } from '../admin/adminTypes';
import { restaurantConfig } from '../config/restaurant';
import type { EmployeesResult, LoginEmployeeInput, LoginEmployeeResult } from '../types/api';
import { apiRequest, createVisibilityPoller } from './apiClient';

const ADMIN_SESSION_STORAGE_KEY = 'foodreel-admin-session';
const listeners = new Set<(employees: Employee[]) => void>();
let employeesCache: Employee[] = [];

export const demoUsers = [
  {
    email: 'admin@foodreel.demo',
    password: 'AdminDemo2026',
    role: 'ADMINISTRADOR' as const
  },
  {
    email: 'mesero@foodreel.demo',
    password: 'MeseroDemo2026',
    role: 'MESERO' as const
  },
  {
    email: 'cocina@foodreel.demo',
    password: 'CocinaDemo2026',
    role: 'COCINA' as const
  }
];

function notifyEmployees(employees: Employee[]) {
  employeesCache = employees;
  listeners.forEach((listener) => listener(employees));
}

function storage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function getCurrentAdminSession(): AdminSession {
  const raw = storage()?.getItem(ADMIN_SESSION_STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as AdminSession;
    } catch {
      storage()?.removeItem(ADMIN_SESSION_STORAGE_KEY);
    }
  }

  return {
    restaurantId: restaurantConfig.restaurantId,
    role: 'ADMINISTRADOR',
    userId: 'employee-admin-demo'
  };
}

export function setAdminSession(session: AdminSession) {
  storage()?.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent('foodreel:admin-session'));
  return session;
}

export function setDemoRole(role: EmployeeRole) {
  const user = employeesCache.find((employee) => employee.role === role) ?? employeesCache[0];
  return setAdminSession({
    restaurantId: user?.restaurantId ?? restaurantConfig.restaurantId,
    role,
    userId: user?.id ?? `employee-${role.toLowerCase()}-demo`
  });
}

export async function loginEmployee(input: Omit<LoginEmployeeInput, 'restaurantId'>) {
  const result = await apiRequest<LoginEmployeeResult, LoginEmployeeInput>('loginEmployee', {
    ...input,
    restaurantId: restaurantConfig.restaurantId
  });
  setAdminSession({
    restaurantId: result.employee.restaurantId,
    role: result.employee.role,
    userId: result.employee.id
  });
  return result;
}

export async function getEmployees(signal?: AbortSignal) {
  const result = await apiRequest<EmployeesResult, { restaurantId: string }>(
    'getEmployees',
    { restaurantId: restaurantConfig.restaurantId },
    { auth: getCurrentAdminSession(), signal }
  );
  notifyEmployees(result.employees);
  return result.employees;
}

export function subscribeToEmployees(listener: (employees: Employee[]) => void) {
  listeners.add(listener);
  if (employeesCache.length) {
    listener(employeesCache);
  }

  const unsubscribe = createVisibilityPoller((signal) => getEmployees(signal), listener, {
    intervalMs: 30_000,
    onError: () => undefined
  });

  return () => {
    listeners.delete(listener);
    unsubscribe();
  };
}

export async function createEmployee(input: Omit<Employee, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>) {
  const employee = await apiRequest<Employee, typeof input & { restaurantId: string }>(
    'createEmployee',
    { ...input, restaurantId: restaurantConfig.restaurantId },
    { auth: getCurrentAdminSession() }
  );
  notifyEmployees([employee, ...employeesCache.filter((item) => item.id !== employee.id)]);
  return employee;
}

export async function updateEmployee(employeeId: string, input: Employee) {
  const employee = await apiRequest<Employee, { employeeId: string; employee: Employee }>(
    'updateEmployee',
    { employee: input, employeeId },
    { auth: getCurrentAdminSession() }
  );
  notifyEmployees(employeesCache.map((item) => (item.id === employeeId ? employee : item)));
  return employee;
}

export async function updateEmployeeStatus(employeeId: string, status: EmployeeStatus) {
  const employee = await apiRequest<Employee, { employeeId: string; restaurantId: string; status: EmployeeStatus }>(
    'updateEmployeeStatus',
    { employeeId, restaurantId: restaurantConfig.restaurantId, status },
    { auth: getCurrentAdminSession() }
  );
  notifyEmployees(employeesCache.map((item) => (item.id === employeeId ? employee : item)));
}

export async function changeEmployeeRole(employeeId: string, role: EmployeeRole) {
  const employee = await apiRequest<Employee, { employeeId: string; restaurantId: string; role: EmployeeRole }>(
    'updateEmployeeRole',
    { employeeId, restaurantId: restaurantConfig.restaurantId, role },
    { auth: getCurrentAdminSession() }
  );
  notifyEmployees(employeesCache.map((item) => (item.id === employeeId ? employee : item)));
}

export async function resetEmployeeAccess(employeeId: string) {
  const result = await apiRequest<{ temporaryPassword: string }, { employeeId: string; restaurantId: string }>(
    'resetEmployeeAccess',
    { employeeId, restaurantId: restaurantConfig.restaurantId },
    { auth: getCurrentAdminSession() }
  );
  void getEmployees().catch(() => undefined);
  return result.temporaryPassword;
}
