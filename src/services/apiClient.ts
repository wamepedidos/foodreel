import type { ApiRequest, ApiResponse, StaffAuth } from '../types/api';

const DEFAULT_TIMEOUT_MS = 15000;
const SAFE_ACTIONS = new Set([
  'getRestaurant',
  'getMenu',
  'getCategories',
  'getDish',
  'getOrder',
  'getRestaurantOrders',
  'getApprovedPosts',
  'getComments',
  'getDashboardMetrics',
  'getDishes',
  'getEmployees',
  'getWaiterCalls'
]);

type RequestOptions = {
  auth?: StaffAuth;
  retries?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export class ApiClientError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code = 'API_ERROR', status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

function appsScriptUrl() {
  return (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ?? '').trim();
}

function logDevelopment(message: string, detail?: unknown) {
  if (import.meta.env.DEV) {
    console.info(`[apps-script-api] ${message}`, detail ?? '');
  }
}

function mergeAbortSignals(left: AbortSignal, right?: AbortSignal) {
  if (!right) return left;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (left.aborted || right.aborted) {
    controller.abort();
    return controller.signal;
  }
  left.addEventListener('abort', abort, { once: true });
  right.addEventListener('abort', abort, { once: true });
  return controller.signal;
}

async function sleep(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function apiRequest<TData, TPayload = unknown>(
  action: string,
  payload?: TPayload,
  options: RequestOptions = {}
): Promise<TData> {
  const url = appsScriptUrl();
  if (!url) {
    throw new ApiClientError('Configura VITE_GOOGLE_APPS_SCRIPT_URL para conectar la app con Google Apps Script.', 'MISSING_APPS_SCRIPT_URL');
  }

  const retries = options.retries ?? (SAFE_ACTIONS.has(action) ? 1 : 0);
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= retries) {
    const timeoutController = new AbortController();
    const timeoutId = window.setTimeout(() => timeoutController.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const body: ApiRequest<TPayload> = { action, payload, auth: options.auth };

    try {
      logDevelopment(`request ${action}`, payload);
      const response = await fetch(url, {
        body: JSON.stringify(body),
        headers: { 'content-type': 'text/plain;charset=utf-8' },
        method: 'POST',
        mode: 'cors',
        signal: mergeAbortSignals(timeoutController.signal, options.signal)
      });
      const data = (await response.json().catch(() => null)) as ApiResponse<TData> | null;

      if (!data) {
        throw new ApiClientError('Apps Script no devolvio JSON valido.', 'INVALID_JSON', response.status);
      }
      if (!response.ok) {
        throw new ApiClientError(data.success ? 'La solicitud fallo.' : data.error.message, data.success ? 'HTTP_ERROR' : data.error.code, response.status);
      }
      if (!data.success) {
        throw new ApiClientError(data.error.message, data.error.code, response.status);
      }

      return data.data;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) {
        break;
      }
      await sleep(400 * (attempt + 1));
    } finally {
      window.clearTimeout(timeoutId);
    }

    attempt += 1;
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new ApiClientError('No se pudo conectar con Google Apps Script.', 'NETWORK_ERROR');
}

export function createVisibilityPoller<T>(
  load: (signal: AbortSignal) => Promise<T>,
  callback: (value: T) => void,
  options: {
    intervalMs: number;
    onError?: (error: unknown) => void;
    shouldStop?: (value: T) => boolean;
  }
) {
  let stopped = false;
  let timer = 0;
  let controller: AbortController | null = null;

  const schedule = () => {
    if (stopped) return;
    window.clearTimeout(timer);
    if (document.visibilityState === 'hidden') return;
    timer = window.setTimeout(run, options.intervalMs);
  };

  const run = () => {
    if (stopped || document.visibilityState === 'hidden') return;
    controller?.abort();
    controller = new AbortController();
    void load(controller.signal)
      .then((value) => {
        callback(value);
        if (options.shouldStop?.(value)) {
          stopped = true;
          return;
        }
        schedule();
      })
      .catch((error) => {
        if (!stopped) {
          options.onError?.(error);
          schedule();
        }
      });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      run();
    } else {
      controller?.abort();
      window.clearTimeout(timer);
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  run();

  return () => {
    stopped = true;
    controller?.abort();
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
