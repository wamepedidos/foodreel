import {
  Bike,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  MapPin,
  Minus,
  Pencil,
  Plus,
  SendHorizonal,
  Utensils
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantConfig } from '../config/restaurant';
import { ORDER_STATUS_LABELS } from '../orders/orderStatus';
import { createOrder, getOrderById, subscribeToOrder } from '../services/ordersService';
import { useCartStore } from '../store/useCartStore';
import type { CreateOrderInput, DishAddition, OrderRecord } from '../types';
import { formatCurrency } from '../utils/format';
import { readCustomerProfile } from '../utils/customerProfile';
import { getOrCreateCustomerSessionId, getOrCreateTableSessionId, makeIdempotencyKey } from '../utils/session';
import { CustomerNameDialog } from './CustomerNameDialog';
import { useToast } from './Toast';

const PENDING_IDEMPOTENCY_KEY = 'foodreel-pending-order-idempotency-key';
const ACTIVE_ORDER_ID = 'foodreel-active-order-id';
const DELIVERY_FEE = 3000;
const DELIVERY_ADDRESS = 'Carrera 50 # 12 Sur - 45, Sabaneta, Antioquia';
const DELIVERY_REFERENCE = 'Apartamento 302 - Referencia: Porteria azul';
const OSM_EMBED_URL =
  'https://www.openstreetmap.org/export/embed.html?bbox=-75.6220%2C6.1472%2C-75.6008%2C6.1598&layer=mapnik&marker=6.1535%2C-75.6112';

const orderStyles = {
  shell: 'order-page-shell h-full overflow-y-auto bg-[#f7f7f6] px-4 pb-[116px] pt-4 text-[#252832]',
  content: 'mx-auto flex max-w-[520px] flex-col gap-3',
  card: 'order-white-card rounded-[18px] border border-[#e9e5e1] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]',
  softCard: 'order-white-card rounded-[18px] border border-[#eee9e5] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]',
  body: 'text-xs font-medium leading-5 text-[#737987]',
  label: 'text-sm font-black leading-5 text-[#252832]',
  smallLabel: 'text-[11px] font-black uppercase leading-4 tracking-[0.16em] text-[#252832]',
  redPill:
    'inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-accent bg-accent/5 px-3 text-[11px] font-black text-accent',
  quietPill:
    'inline-flex h-8 items-center justify-center rounded-full bg-[#f2f2f1] px-3 text-[11px] font-bold text-[#656b76]',
  quantityButton:
    'grid size-9 place-items-center rounded-full border border-accent bg-white text-accent transition hover:bg-accent hover:text-white',
  quantityShell:
    'inline-flex h-12 items-center gap-5 rounded-2xl border border-accent/25 bg-white px-2 text-sm font-black text-[#252832]',
  primaryButton:
    'inline-flex h-12 min-w-[146px] items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(252,45,4,0.26)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
};

function compactList(items: unknown) {
  return Array.isArray(items) ? items.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function getItemUnitPrice(item: { price: number; selectedAdditions?: { price: number }[] }) {
  return item.price + (item.selectedAdditions ?? []).reduce((total, addition) => total + Number(addition.price || 0), 0);
}

function compactAdditions(items: unknown): DishAddition[] {
  return Array.isArray(items) ? (items as DishAddition[]) : [];
}

function ServiceTypeCard({
  orderType,
  setOrderType
}: {
  orderType: 'restaurant' | 'delivery';
  setOrderType: (orderType: 'restaurant' | 'delivery') => void;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-[#eee9e5] bg-white p-3">
      <div className="min-w-0">
        <p className={orderStyles.label}>Servicio</p>
        <p className={orderStyles.body}>Elige si lo recibes en mesa o a domicilio.</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className={orderType === 'restaurant' ? orderStyles.redPill : 'inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[#eee9e5] bg-white px-3 text-[11px] font-bold text-[#505662]'}
          onClick={() => setOrderType('restaurant')}
          type="button"
        >
          <Utensils className="size-4" />
          En mesa
        </button>
        <button
          className={orderType === 'delivery' ? orderStyles.redPill : 'inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[#eee9e5] bg-white px-3 text-[11px] font-bold text-[#505662]'}
          onClick={() => setOrderType('delivery')}
          type="button"
        >
          <Bike className="size-4" />
          Domicilio
        </button>
      </div>
    </section>
  );
}

function DeliveryAddressCard() {
  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-[#eee9e5] bg-white p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={orderStyles.label}>Direccion de entrega</p>
          <div className="mt-2 flex items-start gap-2">
            <MapPin className="mt-0.5 size-5 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-sm font-black leading-5 text-[#252832]">{DELIVERY_ADDRESS}</p>
              <p className={orderStyles.body}>{DELIVERY_REFERENCE}</p>
            </div>
          </div>
        </div>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-2xl border border-[#eee9e5] bg-white px-3 text-xs font-bold text-[#505662] transition hover:border-accent/40 hover:text-accent"
          type="button"
        >
          <Pencil className="size-4" />
          Editar
        </button>
      </div>

      <div className="relative h-[132px] overflow-hidden rounded-2xl border border-[#eee9e5] bg-[#eef0eb]">
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={OSM_EMBED_URL}
          title="Mapa de direccion de entrega en OpenStreetMap"
        />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-[#eee9e5] bg-white p-3">
        <div className="flex min-w-0 items-center gap-3">
          <Bike className="size-5 shrink-0 text-[#505662]" />
          <div>
            <p className="text-xs font-medium text-[#737987]">Tiempo estimado de entrega</p>
            <p className="text-sm font-black text-[#252832]">30 - 40 min</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-[#737987]">Costo de envio</p>
          <p className="text-lg font-black text-[#14942d]">{formatCurrency(DELIVERY_FEE)}</p>
        </div>
      </div>
    </section>
  );
}

export function OrderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const items = useCartStore((state) => state.items);
  const selectedCartItemId = useCartStore((state) => state.selectedCartItemId);
  const selectDish = useCartStore((state) => state.selectDish);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const toggleRemovedIngredient = useCartStore((state) => state.toggleRemovedIngredient);
  const toggleAddition = useCartStore((state) => state.toggleAddition);
  const clearCart = useCartStore((state) => state.clearCart);
  const [customerNotes, setCustomerNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmNameOpen, setConfirmNameOpen] = useState(false);
  const [orderType, setOrderType] = useState<'restaurant' | 'delivery'>('restaurant');
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
  const subtotal = items.reduce((total, item) => total + getItemUnitPrice(item) * item.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

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
    const serviceMode = orderType === 'restaurant' ? 'Comer en restaurante' : 'Domicilio';
    const notesWithCustomer = [
      `Cliente: ${customerName}`,
      `Tipo de pedido: ${serviceMode}`,
      orderType === 'delivery' ? `Direccion: ${DELIVERY_ADDRESS}` : '',
      orderType === 'delivery' ? DELIVERY_REFERENCE : '',
      trimmedNotes ? `Observaciones: ${trimmedNotes}` : ''
    ].filter(Boolean).join(' - ');

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
        selectedExtras: item.selectedAdditions.map((addition) => ({
          name: addition.name,
          price: addition.price,
          value: addition.name
        })),
        selectedOptions: item.removedIngredients.map((ingredient) => ({
          name: 'Sin ingrediente',
          value: ingredient
        })),
        subtotal: getItemUnitPrice(item) * item.quantity,
        unitPrice: getItemUnitPrice(item)
      })),
      subtotal,
      upsellTotal: deliveryFee,
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
        {items.length ? (
          <section className={`p-4 ${orderStyles.card}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className={orderStyles.label}>Resumen del pedido</p>
                <p className={orderStyles.body}>
                  {items.length} {items.length === 1 ? 'producto' : 'productos'} {orderType === 'delivery' ? 'para entregar' : 'en la mesa'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-accent">{formatCurrency(total)}</p>
                <ChevronDown className="size-5 text-[#505662]" />
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const selected = (selectedCartItemId ?? items[items.length - 1]?.cartItemId) === item.cartItemId;
                const ingredients = compactList(item.ingredients);
                const removableIngredients = compactList(item.removableIngredients);
                const selectedAdditions = compactAdditions(item.selectedAdditions);
                const additions = compactAdditions(item.additions).filter((addition) => addition.available);
                const unitPrice = getItemUnitPrice(item);

                return (
                  <article
                    className={`rounded-[18px] border bg-white p-3 transition ${
                      selected ? 'border-accent/25 shadow-[0_16px_34px_rgba(252,45,4,0.08)]' : 'border-[#eee9e5]'
                    }`}
                    key={item.cartItemId}
                  >
                    <div className="grid grid-cols-[82px_1fr] gap-3">
                      <img alt="" className="size-[82px] rounded-2xl object-cover" src={item.image} />
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-black leading-5 text-[#252832]">{item.name}</p>
                            <p className="mt-1 text-xs font-medium text-[#737987]">{formatCurrency(item.price)}</p>
                          </div>
                          <p className="shrink-0 text-sm font-black text-accent">{formatCurrency(unitPrice * item.quantity)}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <div className={orderStyles.quantityShell}>
                            <button
                              aria-label={`Quitar ${item.name}`}
                              className={orderStyles.quantityButton}
                              onClick={() => decrement(item.cartItemId)}
                              type="button"
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="min-w-3 text-center">{item.quantity}</span>
                            <button
                              aria-label={`Agregar ${item.name}`}
                              className="grid size-9 place-items-center rounded-full bg-accent text-white transition hover:brightness-110"
                              onClick={() => increment(item.cartItemId)}
                              type="button"
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>

                          <button
                            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#eee9e5] bg-white px-3 text-xs font-bold text-[#505662] transition hover:border-accent/40 hover:text-accent"
                            onClick={() => selectDish(item.cartItemId)}
                            type="button"
                          >
                            <Pencil className="size-4" />
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>

                    {selected ? (
                      <div className="mt-3 space-y-2 rounded-[16px] border border-[#eee9e5] bg-white p-3">
                        {ingredients.length ? (
                          <div>
                            <p className={orderStyles.smallLabel}>Ingredientes incluidos</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {ingredients.map((ingredient) => (
                                <span className="inline-flex h-7 items-center rounded-full bg-[#eaf7ec] px-3 text-[11px] font-bold text-[#207a32]" key={`${item.cartItemId}-included-${ingredient}`}>
                                  {ingredient}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {removableIngredients.length ? (
                          <div>
                            <p className={orderStyles.smallLabel}>Quitar ingredientes</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {removableIngredients.map((ingredient) => {
                                const removed = item.removedIngredients.includes(ingredient);
                                return (
                                  <button
                                    className={`inline-flex h-8 items-center rounded-full px-3 text-[11px] font-bold transition ${
                                      removed ? 'bg-accent text-white' : 'bg-[#f2f2f1] text-[#505662] hover:bg-accent/10 hover:text-accent'
                                    }`}
                                    key={`${item.cartItemId}-remove-${ingredient}`}
                                    onClick={() => toggleRemovedIngredient(item.cartItemId, ingredient)}
                                    type="button"
                                  >
                                    Sin {ingredient}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        {additions.length ? (
                          <div>
                            <p className={orderStyles.smallLabel}>Adiciones</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {additions.map((addition) => {
                                const active = selectedAdditions.some((selectedAddition) => selectedAddition.id === addition.id);
                                return (
                                  <button
                                    className={`inline-flex h-8 items-center rounded-full px-3 text-[11px] font-bold transition ${
                                      active ? 'bg-accent text-white' : 'bg-[#f2f2f1] text-[#505662] hover:bg-accent/10 hover:text-accent'
                                    }`}
                                    key={`${item.cartItemId}-addition-${addition.id}`}
                                    onClick={() => toggleAddition(item.cartItemId, addition)}
                                    type="button"
                                  >
                                    {addition.name} + {formatCurrency(addition.price)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        <div className="flex justify-end">
                          <span className="inline-flex h-8 items-center gap-1.5 rounded-2xl bg-accent/5 px-3 text-[11px] font-black text-accent">
                            <Eye className="size-3.5" />
                            Publicable
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <label className="mt-4 block">
              <span className={orderStyles.label}>Observaciones</span>
              <textarea
                className="mt-2 min-h-20 w-full resize-none rounded-2xl border border-[#eee9e5] bg-white px-4 py-3 text-sm font-medium leading-6 text-[#252832] outline-none transition placeholder:text-[#9aa0aa] focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                maxLength={240}
                onChange={(event) => setCustomerNotes(event.target.value)}
                placeholder="Ej: traer cubiertos, bebida sin hielo..."
                value={customerNotes}
              />
            </label>

            <ServiceTypeCard orderType={orderType} setOrderType={setOrderType} />

            {orderType === 'delivery' ? <DeliveryAddressCard /> : null}

            {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-700">{error}</p> : null}

            <div className="mt-4 rounded-2xl border border-accent/25 bg-white p-3">
              <div className="grid min-w-0 grid-cols-3 gap-2">
                <div>
                  <p className="text-[11px] font-medium text-[#737987]">Subtotal</p>
                  <p className="text-xs font-bold text-[#252832]">{formatCurrency(subtotal)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#737987]">Envio</p>
                  <p className="text-xs font-bold text-[#252832]">{formatCurrency(deliveryFee)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#737987]">Total</p>
                  <p className="text-sm font-black text-accent">{formatCurrency(total)}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 min-[390px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
                <button
                  className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e2ddd8] bg-white px-2 text-xs font-black text-accent transition hover:border-accent/50"
                  onClick={() => navigate('/menu')}
                  type="button"
                >
                  <Plus className="size-4 shrink-0" />
                  <span className="truncate">Agregar producto</span>
                </button>
                <button className={`order-submit-button ${orderStyles.primaryButton}`} disabled={sending} onClick={() => setConfirmNameOpen(true)} type="button">
                  {sending ? (
                    <>
                      <Clock3 className="size-5 animate-pulse" />
                      Enviando
                    </>
                  ) : (
                    <>
                      <SendHorizonal className="size-5" />
                      Enviar a cocina
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        ) : activeOrder ? (
          <ActiveOrderReceipt order={activeOrder} onCreateAnother={() => navigate('/menu')} />
        ) : (
          <section className={`grid min-h-[42dvh] place-items-center p-6 text-center ${orderStyles.card}`}>
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent">
                <CheckCircle2 className="size-7" />
              </div>
              <h2 className="mt-4 text-lg font-black leading-7 text-[#252832]">Tu pedido esta listo para seguimiento</h2>
              <p className={orderStyles.body}>Agrega productos desde el menu para crear otro pedido.</p>
              <button className={`mx-auto mt-5 ${orderStyles.primaryButton}`} onClick={() => navigate('/menu')} type="button">
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
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || 0);
  const upsellTotal = Number(order.upsellTotal || 0);
  const total = Number(order.total || subtotal + upsellTotal);

  return (
    <section className={`p-4 ${orderStyles.card}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={orderStyles.label}>Pedido enviado</p>
          <h2 className="text-lg font-black leading-6 text-[#252832]">Resumen #{order.orderNumber}</h2>
          <p className={`mt-1 ${orderStyles.body}`}>{ORDER_STATUS_LABELS[order.status]}</p>
        </div>
        <span className={orderStyles.redPill}>{formatCurrency(total)}</span>
      </div>

      <div className="space-y-2.5">
        {orderItems.map((item) => {
          const selectedOptions = Array.isArray(item.selectedOptions) ? item.selectedOptions : [];
          const selectedExtras = Array.isArray(item.selectedExtras) ? item.selectedExtras : [];

          return (
            <article className="rounded-[18px] border border-[#eee9e5] bg-white p-3" key={`${order.id}-${item.dishId}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-black leading-5 text-[#252832]">{item.name}</p>
                  <p className="mt-1 text-xs font-medium text-[#737987]">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black text-accent">{formatCurrency(item.subtotal)}</p>
              </div>
              {selectedOptions.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedOptions.map((option) => (
                    <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-[11px] font-bold text-white" key={`${order.id}-${item.dishId}-option-${option.value}`}>
                      Sin {option.value}
                    </span>
                  ))}
                </div>
              ) : null}
              {selectedExtras.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedExtras.map((extra) => (
                    <span className="inline-flex h-7 items-center rounded-full bg-[#f2f2f1] px-3 text-[11px] font-bold text-[#505662]" key={`${order.id}-${item.dishId}-extra-${extra.value}`}>
                      {extra.name} + {formatCurrency(extra.price ?? 0)}
                    </span>
                  ))}
                </div>
              ) : null}
              {item.notes ? <p className="mt-2 text-xs font-medium text-[#737987]">Nota: {item.notes}</p> : null}
            </article>
          );
        })}
      </div>

      {order.customerNotes ? (
        <p className="mt-3 rounded-2xl border border-[#eee9e5] bg-[#fafafa] p-3 text-sm font-medium leading-6 text-[#252832]">
          <span className="font-bold text-accent">Observaciones: </span>
          {order.customerNotes}
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl bg-[#f3f3f2] p-3">
        <div className="flex items-center justify-between text-sm font-medium leading-6 text-[#737987]">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {upsellTotal > 0 ? (
          <div className="flex items-center justify-between text-sm font-medium leading-6 text-[#737987]">
            <span>Envio</span>
            <span>{formatCurrency(upsellTotal)}</span>
          </div>
        ) : null}
        <div className="mt-1 flex items-center justify-between text-lg font-black leading-7 text-[#252832]">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <button className={`mt-4 w-full ${orderStyles.primaryButton}`} onClick={onCreateAnother} type="button">
        Ver menu
      </button>
    </section>
  );
}
