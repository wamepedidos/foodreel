import { Check, ChefHat, Clock3, PackageCheck, RefreshCw, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { restaurantConfig } from '../config/restaurant';
import { canTransitionOrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_ORDER } from '../orders/orderStatus';
import { subscribeToRestaurantOrders, updateOrderStatus } from '../services/ordersService';
import type { OrderRecord, OrderStatus } from '../types';
import { ThemeSelector } from '../theme/ThemeSelector';
import { formatCurrency } from '../utils/format';

const previewEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_STAFF_PREVIEW === 'true';

const staffActions: Array<{ label: string; status: OrderStatus; icon: typeof Check }> = [
  { label: 'Confirmar', status: 'confirmed', icon: Check },
  { label: 'En preparacion', status: 'preparing', icon: ChefHat },
  { label: 'Listo', status: 'ready', icon: PackageCheck },
  { label: 'Entregado', status: 'delivered', icon: Truck }
];

export function StaffPreviewOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!previewEnabled) {
      return undefined;
    }

    return subscribeToRestaurantOrders(restaurantConfig.restaurantId, setOrders);
  }, []);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => ORDER_STATUS_ORDER[a.status] - ORDER_STATUS_ORDER[b.status] || b.createdAt.localeCompare(a.createdAt)
      ),
    [orders]
  );

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    setError('');

    try {
      await updateOrderStatus(orderId, status);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo actualizar el estado.');
    } finally {
      setUpdatingId('');
    }
  };

  if (!previewEnabled) {
    return (
      <div className="grid min-h-dvh place-items-center bg-base px-6 text-center text-white">
        <div>
          <h1 className="text-xl font-black">Vista tecnica desactivada</h1>
          <p className="mt-2 max-w-md text-sm text-muted">Activa VITE_ENABLE_STAFF_PREVIEW=true para revisar pedidos desde computador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-base px-4 py-5 text-white md:px-6">
      <header className="mx-auto flex max-w-[1100px] flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Staff preview</p>
          <h1 className="text-2xl font-black">{restaurantConfig.restaurantName}</h1>
          <p className="mt-1 text-sm text-muted">Recepcion tecnica de pedidos en tiempo real</p>
        </div>
        <div className="flex flex-col gap-2 self-start sm:items-end">
          <ThemeSelector compact />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 text-sm text-muted">
            <RefreshCw className="size-4 text-accent" />
            Listener activo
          </div>
        </div>
      </header>

      <main className="mx-auto mt-5 max-w-[1100px]">
        {error ? <p className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}

        {sortedOrders.length ? (
          <div className="grid gap-4">
            {sortedOrders.map((order) => (
              <article className="rounded-[20px] border border-white/10 bg-card p-4" key={order.id}>
                <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">Pedido #{order.orderNumber}</h2>
                      <span className="rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      Mesa {order.tableNumber} · {formatOrderTime(order.createdAt)}
                    </p>
                  </div>
                  <p className="text-xl font-black">{formatCurrency(order.total)}</p>
                </div>

                <div className="mt-3 grid gap-2">
                  {order.items.map((item) => (
                    <StaffOrderItem item={item} orderId={order.id} key={`${order.id}-${item.dishId}`} />
                  ))}
                </div>

                {order.customerNotes ? (
                  <p className="mt-3 rounded-2xl border border-white/10 bg-base p-3 text-sm text-white">
                    <span className="font-bold text-accent">Observaciones: </span>
                    {order.customerNotes}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {staffActions.map((action) => {
                    const Icon = action.icon;
                    const disabled = updatingId === order.id || order.status === action.status || !canTransitionOrderStatus(order.status, action.status);

                    return (
                      <button
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-surface px-3 text-sm font-bold text-white transition enabled:hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-45"
                        disabled={disabled}
                        key={action.status}
                        onClick={() => changeStatus(order.id, action.status)}
                        type="button"
                      >
                        <Icon className="size-4" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="grid min-h-[48dvh] place-items-center rounded-[20px] border border-white/10 bg-card p-6 text-center">
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent/15 text-accent">
                <Clock3 className="size-7" />
              </div>
              <h2 className="mt-4 text-lg font-black">Sin pedidos nuevos</h2>
              <p className="mt-2 text-sm text-muted">Cuando un cliente envie un pedido, aparecera aqui sin recargar.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StaffOrderItem({ item, orderId }: { item: OrderRecord['items'][number]; orderId: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-surface px-3 py-2" key={`${orderId}-${item.dishId}`}>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">{item.name}</p>
        {item.notes ? <p className="mt-1 text-xs text-muted">{item.notes}</p> : null}
      </div>
      <p className="shrink-0 text-sm font-black text-accent">x{item.quantity}</p>
    </div>
  );
}

function formatOrderTime(createdAt: string) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(createdAt));
}
