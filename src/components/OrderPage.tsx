import { ArrowLeft, CheckCircle2, Clock3, Minus, Plus, ReceiptText, SendHorizonal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantConfig } from '../config/restaurant';
import { ORDER_STATUS_LABELS } from '../orders/orderStatus';
import { createOrder, getOrderById, subscribeToOrder } from '../services/ordersService';
import { cartItemToOrderDetails, useCartStore } from '../store/useCartStore';
import type { CreateOrderInput, DishCustomizationChoice, OrderItemOption, OrderRecord } from '../types';
import { formatCurrency } from '../utils/format';
import { readCustomerProfile } from '../utils/customerProfile';
import { getOrCreateCustomerSessionId, getOrCreateTableSessionId, makeIdempotencyKey } from '../utils/session';
import { CustomerNameDialog } from './CustomerNameDialog';
import { useToast } from './Toast';

const PENDING_IDEMPOTENCY_KEY = 'foodreel-pending-order-idempotency-key';
const ACTIVE_ORDER_ID = 'foodreel-active-order-id';

const orderStyles = {
  shell: 'h-full overflow-y-auto px-4 pb-[112px] pt-4 sm:px-5',
  content: 'mx-auto flex max-w-[640px] flex-col gap-4',
  card: 'rounded-lg border border-white/10 bg-card/95 p-4 shadow-2xl shadow-black/20',
  iconButton:
    'grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-surface text-white transition hover:border-accent/50 hover:text-accent',
  eyebrow: 'text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-accent',
  pageTitle: 'text-[22px] font-black leading-7 text-white',
  sectionTitle: 'text-[15px] font-black leading-5 text-white',
  itemTitle: 'text-[14px] font-bold leading-5 text-white',
  itemPrice: 'text-[14px] font-black leading-5 text-white',
  body: 'text-[14px] font-medium leading-6 text-muted',
  meta: 'text-[12px] font-medium leading-5 text-muted',
  label: 'text-[12px] font-semibold uppercase leading-4 tracking-[0.08em] text-muted',
  detailLabel: 'text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-muted',
  detailChip:
    'rounded-full border border-white/10 bg-base px-2.5 py-1 text-[11px] font-semibold leading-4 text-white/80',
  pill:
    'inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-accent/35 bg-accent/10 px-3 text-[12px] font-bold text-accent',
  primaryButton:
    'flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[14px] font-black text-contrast shadow-glow transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60'
};

function compactList(items: unknown) {
  return Array.isArray(items) ? items.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function toOrderOptions(label: string, values: string[]) {
  return values.map((value) => ({ name: label, value }));
}

function choicesToOrderOptions(choices: unknown): OrderItemOption[] {
  if (!Array.isArray(choices)) {
    return [];
  }

  return choices
    .map((choice) => {
      if (typeof choice === 'string') {
        return { name: choice, value: choice };
      }

      if (choice && typeof choice === 'object' && 'name' in choice) {
        const option = choice as DishCustomizationChoice;
        return { name: option.name, price: option.price, value: option.name };
      }

      return null;
    })
    .filter((choice): choice is OrderItemOption => Boolean(choice?.value));
}

function optionValues(items: unknown) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (item && typeof item === 'object' && 'value' in item) {
        return String(item.value);
      }

      return '';
    })
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionList(items: unknown): OrderItemOption[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item, value: item };
      }

      if (item && typeof item === 'object' && 'value' in item) {
        const option = item as OrderItemOption;
        return { name: option.name || option.value, price: option.price, value: String(option.value) };
      }

      return null;
    })
    .filter((item): item is OrderItemOption => Boolean(item?.value));
}

export function OrderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const items = useCartStore((state) => state.items);
  const selectedCartItemId = useCartStore((state) => state.selectedCartItemId);
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
    if (existing) {
      return existing;
    }

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
    if (!activeOrderId) {
      return undefined;
    }

    let mounted = true;
    void getOrderById(activeOrderId, customerSessionId)
      .then((order) => {
        if (mounted) {
          if (!order) {
            setActiveOrderId('');
            window.localStorage.removeItem(ACTIVE_ORDER_ID);
          }
          setActiveOrder(order);
        }
      })
      .catch(() => undefined);

    const unsubscribe = subscribeToOrder(activeOrderId, customerSessionId, setActiveOrder);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [activeOrderId, customerSessionId]);

  const submitOrder = async () => {
    if (sending || items.length === 0) {
      return;
    }

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
      items: items.map((item) => {
        const ingredients = compactList(item.ingredients);
        const details = cartItemToOrderDetails(item);

        return {
          baseUnitPrice: item.basePrice,
          cartItemId: item.cartItemId,
          dishId: item.dishId,
          image: item.image,
          ingredients,
          name: item.name,
          notes: item.notes,
          quantity: item.quantity,
          removedIngredients: details.removedIngredients,
          sauces: details.sauces,
          additions: details.additions,
          selectedExtras: details.additions,
          selectedOptions: toOrderOptions('Sin ingrediente', details.removedIngredients),
          selectedSauces: details.sauces,
          subtotal: item.price * item.quantity,
          unitPrice: item.price
        };
      }),
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
        <div className="flex items-center gap-3">
          <button
            aria-label="Volver al menu"
            className={orderStyles.iconButton}
            onClick={() => navigate('/menu')}
            type="button"
          >
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
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
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
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
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
                const itemId = item.cartItemId ?? item.dishId;
                const selected = selectedCartItemId
                  ? selectedCartItemId === itemId
                  : (selectedDishId ?? items[items.length - 1]?.dishId) === item.dishId;
                const selectedSauces = choicesToOrderOptions(item.selectedSauces);
                const selectedAdditions = choicesToOrderOptions(item.selectedAdditions);
                const removedIngredients = compactList(item.removedIngredients);
                return (
                  <article
                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                      selected ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-surface'
                    }`}
                    key={itemId}
                    onClick={() => selectDish(itemId)}
                  >
                    <img alt="" className="size-[72px] shrink-0 rounded-lg object-cover" src={item.image} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`line-clamp-2 ${orderStyles.itemTitle}`}>{item.name}</p>
                        <p className={`shrink-0 ${orderStyles.itemPrice}`}>{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      <p className={`mt-1 ${orderStyles.meta}`}>
                        {formatCurrency(item.price)}
                        {selected ? ' - seleccionado para publicar' : ''}
                      </p>
                      {selectedSauces.length || removedIngredients.length || selectedAdditions.length || item.notes ? (
                        <div className="mt-3 grid gap-2">
                          {selectedSauces.length ? (
                            <div className="grid gap-1.5">
                              <p className={orderStyles.detailLabel}>Salsas elegidas</p>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedSauces.map((sauce) => (
                                  <span className={orderStyles.detailChip} key={`${itemId}-sauce-${sauce.value}`}>
                                    {sauce.value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {removedIngredients.length ? (
                            <div className="grid gap-1.5">
                              <p className={orderStyles.detailLabel}>Sin ingredientes</p>
                              <div className="flex flex-wrap gap-1.5">
                                {removedIngredients.map((ingredient) => (
                                  <span className={orderStyles.detailChip} key={`${itemId}-removed-${ingredient}`}>
                                    {ingredient}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {selectedAdditions.length ? (
                            <div className="grid gap-1.5">
                              <p className={orderStyles.detailLabel}>Adiciones</p>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedAdditions.map((addition) => (
                                  <span className={orderStyles.detailChip} key={`${itemId}-addition-${addition.value}`}>
                                    {addition.value}
                                    {addition.price ? ` +${formatCurrency(addition.price)}` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {item.notes ? <p className={`${orderStyles.meta} text-white/72`}>Nota: {item.notes}</p> : null}
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex h-9 items-center rounded-full border border-white/10 bg-base px-1">
                          <button
                            aria-label={`Quitar ${item.name}`}
                            className="grid size-7 place-items-center rounded-full text-white transition hover:bg-white/10"
                            onClick={(event) => {
                              event.stopPropagation();
                              decrement(itemId);
                            }}
                            type="button"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="min-w-8 text-center text-[14px] font-black leading-none text-white">{item.quantity}</span>
                          <button
                            aria-label={`Agregar ${item.name}`}
                            className="grid size-7 place-items-center rounded-full text-white transition hover:bg-white/10"
                            onClick={(event) => {
                              event.stopPropagation();
                              increment(itemId);
                            }}
                            type="button"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        {selected ? <span className="text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-accent">Publicable</span> : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <label className="mt-4 block">
              <span className={orderStyles.label}>Observaciones</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-lg border border-white/10 bg-base px-4 py-3 text-[14px] font-medium leading-6 text-white outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                maxLength={240}
                onChange={(event) => setCustomerNotes(event.target.value)}
                placeholder="Ej: sin cebolla, traer cubiertos..."
                value={customerNotes}
              />
            </label>

            {error ? <p className="mt-3 rounded-lg border border-error/30 bg-error/10 p-3 text-[14px] font-medium leading-6 text-red-100">{error}</p> : null}

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-[14px] font-medium leading-6 text-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[18px] font-black leading-7 text-white">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              className={`mt-4 ${orderStyles.primaryButton}`}
              disabled={sending}
              onClick={() => setConfirmNameOpen(true)}
              type="button"
            >
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
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent/15 text-accent">
                <CheckCircle2 className="size-7" />
              </div>
              <h2 className="mt-4 text-[18px] font-black leading-7 text-white">Tu pedido esta listo para seguimiento</h2>
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
        {order.items.map((item) => {
          const removedIngredients = compactList(item.removedIngredients).length
            ? compactList(item.removedIngredients)
            : optionValues(item.selectedOptions);
          const sauces = optionList(item.sauces).length ? optionList(item.sauces) : optionList(item.selectedSauces);
          const additions = optionList(item.additions).length ? optionList(item.additions) : optionList(item.selectedExtras);

          return (
            <article className="rounded-lg border border-white/10 bg-surface p-3" key={`${order.id}-${item.cartItemId ?? item.dishId}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`line-clamp-2 ${orderStyles.itemTitle}`}>{item.name}</p>
                  <p className={`mt-1 ${orderStyles.meta}`}>
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className={`shrink-0 ${orderStyles.itemPrice}`}>{formatCurrency(item.subtotal)}</p>
              </div>

              {sauces.length || removedIngredients.length || additions.length || item.notes ? (
                <div className="mt-3 grid gap-2">
                  {sauces.length ? (
                    <div className="grid gap-1.5">
                      <p className={orderStyles.detailLabel}>Salsas elegidas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sauces.map((sauce) => (
                          <span className={orderStyles.detailChip} key={`${order.id}-${item.dishId}-sauce-${sauce.value}`}>
                            {sauce.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {removedIngredients.length ? (
                    <div className="grid gap-1.5">
                      <p className={orderStyles.detailLabel}>Sin ingredientes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {removedIngredients.map((ingredient) => (
                          <span className={orderStyles.detailChip} key={`${order.id}-${item.dishId}-removed-${ingredient}`}>
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {additions.length ? (
                    <div className="grid gap-1.5">
                      <p className={orderStyles.detailLabel}>Adiciones</p>
                      <div className="flex flex-wrap gap-1.5">
                        {additions.map((addition) => (
                          <span className={orderStyles.detailChip} key={`${order.id}-${item.dishId}-addition-${addition.value}`}>
                            {addition.value}
                            {addition.price ? ` +${formatCurrency(addition.price)}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {item.notes ? <p className={`${orderStyles.meta} text-white/72`}>Nota: {item.notes}</p> : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {order.customerNotes ? (
        <p className="mt-3 rounded-lg border border-white/10 bg-base p-3 text-[14px] font-medium leading-6 text-white">
          <span className="font-bold text-accent">Observaciones: </span>
          {order.customerNotes}
        </p>
      ) : null}

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-[14px] font-medium leading-6 text-muted">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[18px] font-black leading-7 text-white">
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
