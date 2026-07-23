import { ArrowLeft, CheckCircle2, Clock3, Minus, Plus, ReceiptText, SendHorizonal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantConfig } from '../config/restaurant';
import { ORDER_STATUS_LABELS } from '../orders/orderStatus';
import { createOrder, getOrderById, subscribeToOrder } from '../services/ordersService';
import { useCartStore } from '../store/useCartStore';
import type { CreateOrderInput, OrderRecord } from '../types';
import { formatCurrency } from '../utils/format';
import { readCustomerProfile } from '../utils/customerProfile';
import { getOrCreateCustomerSessionId, getOrCreateTableSessionId, makeIdempotencyKey } from '../utils/session';
import { CustomerNameDialog } from './CustomerNameDialog';
import { useToast } from './Toast';

const PENDING_IDEMPOTENCY_KEY = 'foodreel-pending-order-idempotency-key';
const ACTIVE_ORDER_ID = 'foodreel-active-order-id';

const orderStyles = {
  shell: 'h-full overflow-y-auto px-3 pb-[112px] pt-3 sm:px-4',
  content: 'mx-auto flex max-w-[520px] flex-col gap-3',
  card: 'rounded-[22px] border border-white/10 bg-card p-4 shadow-2xl shadow-black/25',
  surfaceCard: 'rounded-[22px] border border-white/10 bg-surface p-3 shadow-2xl shadow-black/20',
  iconButton:
    'grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-card text-white transition hover:border-accent/50 hover:text-accent',
  eyebrow: 'text-xs font-bold uppercase leading-none tracking-[0.18em] text-accent',
  pageTitle: 'text-xl font-black leading-6 text-white',
  sectionTitle: 'text-base font-black leading-5 text-white',
  itemTitle: 'text-sm font-black leading-5 text-white',
  itemPrice: 'text-sm font-black leading-5 text-accent',
  body: 'text-sm font-medium leading-6 text-muted',
  meta: 'text-xs font-medium leading-5 text-muted',
  label: 'text-xs font-bold uppercase leading-4 tracking-[0.12em] text-muted',
  detailLabel: 'text-[11px] font-black uppercase leading-4 tracking-[0.12em] text-white/48',
  detailChip:
    'inline-flex h-7 items-center rounded-full border border-white/10 bg-black/20 px-2.5 text-[11px] font-bold leading-none text-white/72',
  pill:
    'inline-flex h-7 shrink-0 items-center justify-center rounded-full border border-accent/35 bg-accent/10 px-2.5 text-[11px] font-black text-accent',
  primaryButton:
    'flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-bold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
};

function compactList(items: unknown) {
  return Array.isArray(items) ? items.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

export function OrderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const items = useCartStore((state) => state.items);
  const selectedDishId = useCartStore((state) => state.selectedDishId);
  const selectDish = useCartStore((state) => state.selectDish);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const clearCart = useCartStore((state) => state.clearCart);
  const [customerNotes, setCustomerNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmNameOpen, setConfirmNameOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [activeOrderId, setActiveOrderId] = useState(() => window.localStorage.getItem(ACTIVE_ORDER_ID) ?? '');
  const [idempotencyKey, setIdempotencyKey] = useState(() => {
    const existing = window.localStorage.getItem(PENDING_IDEMPOTENCY_KEY);
    if (existing) return existing;
    const next = makeIdempotencyKey();
    window.localStorage.setItem(PENDING_IDEMPOTENCY_KEY, next);
    return next;
  });

  const customerSessionId = useMemo(() => getOrCreateCustomerSessionId(), []);
  const tableSessionId = useMemo(
    () => getOrCreateTableSessionId(restaurantConfig.restaurantId, restaurantConfig.tableId),
    []
  );
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal;

  useEffect(() => {
    if (!activeOrderId) return undefined;

    let mounted = true;
    void getOrderById(activeOrderId, customerSessionId)
      .then((order) => {
        if (!mounted) return;
        if (!order) {
          setActiveOrderId('');
          window.localStorage.removeItem(ACTIVE_ORDER_ID);
        }
        setActiveOrder(order);
      })
      .catch(() => undefined);

    const unsubscribe = subscribeToOrder(activeOrderId, customerSessionId, setActiveOrder);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [activeOrderId, customerSessionId]);

  const submitOrder = async () => {
    if (sending || items.length === 0) return;

    const customerName = readCustomerProfile().displayName.trim();
    if (!customerName) {
      setConfirmNameOpen(true);
      return;
    }

    setSending(true);
    setError('');
    setConfirmNameOpen(false);
    const trimmedNotes = customerNotes.trim();
    const notesWithCustomer = trimmedNotes ? `Cliente: ${customerName} - ${trimmedNotes}` : `Cliente: ${customerName}`;

    const payload: CreateOrderInput = {
      restaurantId: restaurantConfig.restaurantId,
      tableId: restaurantConfig.tableId,
      tableNumber: restaurantConfig.tableNumber,
      tableSessionId,
      customerSessionId,
      idempotencyKey,
      source: 'customer_pwa',
      items: items.map((item) => ({
        dishId: item.dishId,
        image: item.image,
        ingredients: compactList(item.ingredients),
        name: item.name,
        notes: '',
        quantity: item.quantity,
        selectedExtras: [],
        selectedOptions: [],
        subtotal: item.price * item.quantity,
        unitPrice: item.price
      })),
      subtotal,
      upsellTotal: 0,
      total,
      customerNotes: notesWithCustomer
    };

    try {
      const order = await createOrder(payload);
      setActiveOrder(order);
      setActiveOrderId(order.id);
      window.localStorage.setItem(ACTIVE_ORDER_ID, order.id);
      window.localStorage.removeItem(PENDING_IDEMPOTENCY_KEY);
      const nextKey = makeIdempotencyKey();
      window.localStorage.setItem(PENDING_IDEMPOTENCY_KEY, nextKey);
      setIdempotencyKey(nextKey);
      clearCart();
      showToast(`Pedido #${order.orderNumber} enviado`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'No se pudo enviar el pedido.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={orderStyles.shell}>
      <div className={orderStyles.content}>
        <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-card p-3 shadow-2xl shadow-black/20">
          <button aria-label="Volver al menu" className={orderStyles.iconButton} onClick={() => navigate('/menu')} type="button">
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <p className={orderStyles.eyebrow}>Mesa {restaurantConfig.tableNumber}</p>
            <h1 className={orderStyles.pageTitle}>Tu pedido</h1>
          </div>
        </div>

        {activeOrder ? (
          <section className={orderStyles.card}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <Clock3 className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className={orderStyles.sectionTitle}>Pedido #{activeOrder.orderNumber}</p>
                  <p className={`truncate ${orderStyles.meta}`}>{ORDER_STATUS_LABELS[activeOrder.status]}</p>
                </div>
              </div>
              <span className={orderStyles.pill}>En vivo</span>
            </div>
          </section>
        ) : null}

        {items.length ? (
          <section className={orderStyles.card}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <ReceiptText className="size-4" />
                </div>
                <div className="min-w-0">
                  <h2 className={orderStyles.sectionTitle}>Productos</h2>
                  <p className={`truncate ${orderStyles.meta}`}>
                    {items.length} {items.length === 1 ? 'producto' : 'productos'} en la mesa
                  </p>
                </div>
              </div>
              <span className={orderStyles.pill}>{formatCurrency(total)}</span>
            </div>

            <div className="space-y-2.5">
              {items.map((item) => {
                const selected = (selectedDishId ?? items[items.length - 1]?.dishId) === item.dishId;
                const ingredients = compactList(item.ingredients);
                return (
                  <article
                    className={`flex cursor-pointer gap-3 rounded-[22px] border p-3 transition ${
                      selected ? 'border-accent/60 bg-accent/10 shadow-[0_18px_42px_rgb(var(--color-primary-rgb)/0.12)]' : 'border-white/10 bg-surface'
                    }`}
                    key={item.dishId}
                    onClick={() => selectDish(item.dishId)}
                  >
                    <img alt="" className="size-[76px] shrink-0 rounded-2xl object-cover" src={item.image} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`line-clamp-2 ${orderStyles.itemTitle}`}>{item.name}</p>
                        <p className={`shrink-0 ${orderStyles.itemPrice}`}>{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      <p className={`mt-1 ${orderStyles.meta}`}>
                        {formatCurrency(item.price)}
                        {selected ? ' - seleccionado para publicar' : ''}
                      </p>
                      {ingredients.length ? (
                        <div className="mt-3 grid gap-1.5 rounded-2xl bg-black/20 p-2.5">
                          <p className={orderStyles.detailLabel}>Ingredientes</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ingredients.map((ingredient) => (
                              <span className={orderStyles.detailChip} key={`${item.dishId}-${ingredient}`}>
                                {ingredient}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex h-10 items-center rounded-2xl bg-accent px-1 text-white shadow-[0_14px_36px_rgba(252,45,4,0.24)]">
                          <button
                            aria-label={`Quitar ${item.name}`}
                            className="grid size-8 place-items-center rounded-full bg-black/20 text-white transition hover:bg-black/30"
                            onClick={(event) => {
                              event.stopPropagation();
                              decrement(item.dishId);
                            }}
                            type="button"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-bold leading-none text-white">{item.quantity}</span>
                          <button
                            aria-label={`Agregar ${item.name}`}
                            className="grid size-8 place-items-center rounded-full bg-black/20 text-white transition hover:bg-black/30"
                            onClick={(event) => {
                              event.stopPropagation();
                              increment(item.dishId);
                            }}
                            type="button"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        {selected ? <span className={orderStyles.pill}>Publicable</span> : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <label className="mt-4 block">
              <span className={orderStyles.label}>Observaciones</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-base px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                maxLength={240}
                onChange={(event) => setCustomerNotes(event.target.value)}
                placeholder="Ej: sin cebolla, traer cubiertos..."
                value={customerNotes}
              />
            </label>

            {error ? <p className="mt-3 rounded-2xl border border-error/30 bg-error/10 p-3 text-sm font-bold leading-6 text-red-100">{error}</p> : null}

            <div className="mt-4 rounded-2xl bg-black/20 p-3">
              <div className="flex items-center justify-between text-sm font-medium leading-6 text-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-lg font-black leading-7 text-white">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button className={`mt-4 ${orderStyles.primaryButton}`} disabled={sending} onClick={() => setConfirmNameOpen(true)} type="button">
              {sending ? (
                <>
                  <Clock3 className="size-5 animate-pulse" />
                  Enviando pedido
                </>
              ) : (
                <>
                  <SendHorizonal className="size-5" />
                  Enviar pedido
                </>
              )}
            </button>
          </section>
        ) : activeOrder ? (
          <ActiveOrderReceipt order={activeOrder} onCreateAnother={() => navigate('/menu')} />
        ) : (
          <section className={`grid min-h-[48dvh] place-items-center text-center ${orderStyles.card}`}>
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/15 text-accent">
                <CheckCircle2 className="size-7" />
              </div>
              <h2 className="mt-4 text-lg font-black leading-7 text-white">Tu pedido esta listo para seguimiento</h2>
              <p className={orderStyles.body}>Agrega productos desde el menu para crear otro pedido.</p>
              <button className={`mx-auto mt-5 max-w-[180px] ${orderStyles.primaryButton}`} onClick={() => navigate('/menu')} type="button">
                Ver menu
              </button>
            </div>
          </section>
        )}
      </div>

      <CustomerNameDialog
        description="Confirma el nombre para asociarlo a este pedido de mesa."
        onClose={() => setConfirmNameOpen(false)}
        onConfirm={() => void submitOrder()}
        open={confirmNameOpen}
        title="Confirma tu nombre"
      />
    </div>
  );
}

function ActiveOrderReceipt({ order, onCreateAnother }: { order: OrderRecord; onCreateAnother: () => void }) {
  return (
    <section className={orderStyles.card}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={orderStyles.label}>Pedido enviado</p>
          <h2 className={orderStyles.sectionTitle}>Resumen #{order.orderNumber}</h2>
          <p className={`mt-1 ${orderStyles.meta}`}>{ORDER_STATUS_LABELS[order.status]}</p>
        </div>
        <span className={orderStyles.pill}>{formatCurrency(order.total)}</span>
      </div>

      <div className="space-y-2.5">
        {order.items.map((item) => (
          <article className={orderStyles.surfaceCard} key={`${order.id}-${item.dishId}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`line-clamp-2 ${orderStyles.itemTitle}`}>{item.name}</p>
                <p className={`mt-1 ${orderStyles.meta}`}>
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <p className={`shrink-0 ${orderStyles.itemPrice}`}>{formatCurrency(item.subtotal)}</p>
            </div>
            {item.notes ? <p className={`mt-2 ${orderStyles.meta}`}>Nota: {item.notes}</p> : null}
          </article>
        ))}
      </div>

      {order.customerNotes ? (
        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-medium leading-6 text-white">
          <span className="font-bold text-accent">Observaciones: </span>
          {order.customerNotes}
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl bg-black/20 p-3">
        <div className="flex items-center justify-between text-sm font-medium leading-6 text-muted">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-lg font-black leading-7 text-white">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      <button className={`mt-4 ${orderStyles.primaryButton}`} onClick={onCreateAnother} type="button">
        Ver menu
      </button>
    </section>
  );
}
