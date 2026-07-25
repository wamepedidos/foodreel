import {
  Bike,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  LocateFixed,
  MapPin,
  Minus,
  Pencil,
  Plus,
  SendHorizonal,
  Utensils
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
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
const DELIVERY_ADDRESS_STORAGE_KEY = 'foodreel-delivery-address';
const RESTAURANT_COORDINATES = {
  lat: 6.155345424087648,
  lon: -75.61113974978285
};

type DeliveryCoordinates = {
  lat: number;
  lon: number;
};

type DeliveryQuote = {
  coordinates?: DeliveryCoordinates;
  distanceKm?: number;
  displayName?: string;
  durationMin?: number;
  fee?: number;
  message?: string;
  routeCoordinates?: DeliveryCoordinates[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  trafficLabel?: string;
};

type DeliverySuggestion = {
  coordinates: DeliveryCoordinates;
  displayName: string;
  id: string;
};

type StoredDeliveryState = {
  address: string;
  orderType: 'restaurant' | 'delivery';
  quote: DeliveryQuote;
  reference: string;
};

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

function hasProductImage(src?: string) {
  return Boolean(src && !src.includes('/brand/foodreel-logo'));
}

function OrderItemMedia({ image, name, video }: { image?: string; name: string; video?: string }) {
  const [failed, setFailed] = useState(false);

  if (!failed && hasProductImage(image)) {
    return <img alt={name} className="size-[82px] rounded-2xl bg-[#f2f2f1] object-cover" onError={() => setFailed(true)} src={image} />;
  }

  if (!failed && video) {
    return (
      <video
        aria-label={name}
        autoPlay
        className="size-[82px] rounded-2xl bg-[#f2f2f1] object-cover"
        loop
        muted
        onError={() => setFailed(true)}
        playsInline
        poster={hasProductImage(image) ? image : undefined}
        preload="metadata"
        src={video}
      />
    );
  }

  return (
    <div className="grid size-[82px] place-items-center rounded-2xl bg-[#f2f2f1] text-accent">
      <Utensils className="size-7" />
    </div>
  );
}

function parseStoredCoordinates(value: unknown): DeliveryCoordinates | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const coordinates = value as Partial<DeliveryCoordinates>;
  return typeof coordinates.lat === 'number' && Number.isFinite(coordinates.lat) && typeof coordinates.lon === 'number' && Number.isFinite(coordinates.lon)
    ? { lat: coordinates.lat, lon: coordinates.lon }
    : undefined;
}

function parseStoredRouteCoordinates(value: unknown): DeliveryCoordinates[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const coordinates = value.flatMap((item) => {
    const coordinate = parseStoredCoordinates(item);
    return coordinate ? [coordinate] : [];
  });
  return coordinates.length ? coordinates : undefined;
}

function parseStoredNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readStoredDeliveryAddress(): StoredDeliveryState {
  if (typeof window === 'undefined') return { address: '', orderType: 'restaurant', quote: { status: 'idle' }, reference: '' };

  try {
    const stored = window.localStorage.getItem(DELIVERY_ADDRESS_STORAGE_KEY);
    if (!stored) return { address: '', orderType: 'restaurant', quote: { status: 'idle' }, reference: '' };

    const parsed = JSON.parse(stored) as Record<string, unknown>;
    const address = typeof parsed.address === 'string' ? parsed.address : '';
    const coordinates = parseStoredCoordinates(parsed.coordinates);
    const distanceKm = parseStoredNumber(parsed.distanceKm);
    const durationMin = parseStoredNumber(parsed.durationMin);
    const fee = parseStoredNumber(parsed.fee);
    const routeCoordinates = parseStoredRouteCoordinates(parsed.routeCoordinates);
    const savedOrderType = parsed.orderType === 'restaurant' || parsed.orderType === 'delivery' ? parsed.orderType : undefined;
    const quoteReady = Boolean(coordinates && typeof fee === 'number' && typeof distanceKm === 'number' && typeof durationMin === 'number');

    return {
      address,
      orderType: savedOrderType ?? (coordinates || address ? 'delivery' : 'restaurant'),
      quote: coordinates
        ? {
            coordinates,
            displayName: typeof parsed.displayName === 'string' ? parsed.displayName : address,
            distanceKm,
            durationMin,
            fee,
            message: quoteReady ? undefined : 'Direccion guardada. Verificando costo de envio...',
            routeCoordinates,
            status: quoteReady ? 'ready' : 'idle',
            trafficLabel: typeof parsed.trafficLabel === 'string' ? parsed.trafficLabel : undefined
          }
        : { status: 'idle' },
      reference: typeof parsed.reference === 'string' ? parsed.reference : ''
    };
  } catch {
    return { address: '', orderType: 'restaurant', quote: { status: 'idle' }, reference: '' };
  }
}

function persistDeliveryAddress(orderType: 'restaurant' | 'delivery', address: string, reference: string, quote: DeliveryQuote) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      DELIVERY_ADDRESS_STORAGE_KEY,
      JSON.stringify({
        address,
        coordinates: quote.coordinates,
        displayName: quote.displayName,
        distanceKm: quote.distanceKm,
        durationMin: quote.durationMin,
        fee: quote.fee,
        orderType,
        reference,
        routeCoordinates: quote.routeCoordinates,
        trafficLabel: quote.trafficLabel
      })
    );
  } catch {
    // The address still works for the current order when storage is unavailable.
  }
}

function calculateDeliveryFee(distanceKm: number) {
  if (distanceKm <= 2) return 5000;
  if (distanceKm <= 4) return 6000;
  if (distanceKm <= 6) return 7000;
  if (distanceKm <= 8) return 8000;
  if (distanceKm <= 10) return 9000;
  return 9000 + Math.ceil(distanceKm - 10) * 1000;
}

function getTrafficEstimate(date = new Date()) {
  const hour = date.getHours();
  if ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 20)) {
    return { label: 'Trafico alto', multiplier: 1.35 };
  }
  if ((hour >= 11 && hour < 14) || (hour >= 15 && hour < 17)) {
    return { label: 'Trafico medio', multiplier: 1.15 };
  }
  return { label: 'Trafico normal', multiplier: 1 };
}

function formatDistance(distanceKm?: number) {
  return typeof distanceKm === 'number' ? `${distanceKm.toFixed(distanceKm >= 10 ? 0 : 1)} km` : '--';
}

function formatDuration(durationMin?: number) {
  return typeof durationMin === 'number' ? `${Math.max(1, Math.round(durationMin))} min` : '--';
}

async function searchDeliveryAddresses(address: string, signal: AbortSignal): Promise<DeliverySuggestion[]> {
  const query = address.toLowerCase().includes('colombia') ? address : `${address}, Colombia`;
  const params = new URLSearchParams({
    addressdetails: '1',
    countrycodes: 'co',
    format: 'jsonv2',
    limit: '5',
    q: query
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: 'application/json', 'Accept-Language': 'es-CO,es;q=0.9' },
    signal
  });

  if (!response.ok) {
    throw new Error('No pudimos validar la direccion.');
  }

  const results = (await response.json()) as Array<{ display_name?: string; lat: string; lon: string; osm_id?: number; place_id?: number }>;
  if (!results.length) {
    throw new Error('No encontramos esa direccion. Intenta con barrio, ciudad y nomenclatura.');
  }

  return results.map((match, index) => ({
    coordinates: {
      lat: Number(match.lat),
      lon: Number(match.lon)
    },
    displayName: match.display_name ?? address,
    id: String(match.place_id ?? match.osm_id ?? `${match.lat}-${match.lon}-${index}`)
  }));
}

async function reverseGeocodeCoordinates(coordinates: DeliveryCoordinates, signal: AbortSignal) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coordinates.lat),
    lon: String(coordinates.lon)
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { Accept: 'application/json', 'Accept-Language': 'es-CO,es;q=0.9' },
    signal
  });

  if (!response.ok) {
    throw new Error('Tomamos tu ubicacion, pero no pudimos convertirla en direccion.');
  }

  const result = (await response.json()) as { display_name?: string };
  return result.display_name;
}

function requestBrowserLocation() {
  return new Promise<DeliveryCoordinates>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no permite tomar la ubicacion por GPS.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => reject(new Error('No pudimos tomar tu ubicacion. Puedes escribir la direccion manualmente.')),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 12000 }
    );
  });
}

async function calculateRoadRoute(destination: DeliveryCoordinates, signal: AbortSignal) {
  const params = new URLSearchParams({
    alternatives: 'false',
    geometries: 'geojson',
    overview: 'full',
    steps: 'false'
  });
  const coordinates = `${RESTAURANT_COORDINATES.lon},${RESTAURANT_COORDINATES.lat};${destination.lon},${destination.lat}`;
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error('No pudimos calcular la ruta del domicilio.');
  }

  const result = (await response.json()) as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: {
        coordinates?: Array<[number, number]>;
        type?: string;
      };
    }>;
  };
  const route = result.routes?.[0];
  if (!route) {
    throw new Error('No encontramos una ruta disponible para esa direccion.');
  }

  const distanceKm = route.distance / 1000;
  const traffic = getTrafficEstimate();
  return {
    distanceKm,
    durationMin: (route.duration / 60) * traffic.multiplier,
    fee: calculateDeliveryFee(distanceKm),
    routeCoordinates:
      route.geometry?.coordinates?.map(([lon, lat]) => ({ lat, lon })) ?? [
        RESTAURANT_COORDINATES,
        destination
      ],
    trafficLabel: traffic.label
  };
}

function DeliveryRouteMap({
  destination,
  routeCoordinates
}: {
  destination?: DeliveryCoordinates;
  routeCoordinates?: DeliveryCoordinates[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      attributionControl: true,
      scrollWheelZoom: false,
      zoomControl: true
    }).setView([RESTAURANT_COORDINATES.lat, RESTAURANT_COORDINATES.lon], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    window.setTimeout(() => map.invalidateSize(), 80);

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const restaurantLatLng: L.LatLngExpression = [RESTAURANT_COORDINATES.lat, RESTAURANT_COORDINATES.lon];
    const restaurantMarker = L.circleMarker(restaurantLatLng, {
      color: '#fc2d04',
      fillColor: '#fc2d04',
      fillOpacity: 1,
      radius: 8,
      weight: 3
    }).bindTooltip('Restaurante');
    restaurantMarker.addTo(layerGroup);

    if (!destination) {
      map.setView(restaurantLatLng, 15);
      window.setTimeout(() => map.invalidateSize(), 80);
      return;
    }

    const destinationLatLng: L.LatLngExpression = [destination.lat, destination.lon];
    const customerMarker = L.circleMarker(destinationLatLng, {
      color: '#ffffff',
      fillColor: '#14942d',
      fillOpacity: 1,
      radius: 8,
      weight: 3
    }).bindTooltip('Cliente');
    customerMarker.addTo(layerGroup);

    const routeLatLngs = routeCoordinates?.length
      ? routeCoordinates.map((point) => [point.lat, point.lon] as L.LatLngExpression)
      : [restaurantLatLng, destinationLatLng];

    const routeLine = L.polyline(routeLatLngs, {
      color: '#fc2d04',
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.92,
      weight: 5
    });
    routeLine.addTo(layerGroup);

    map.fitBounds(routeLine.getBounds().extend(destinationLatLng).extend(restaurantLatLng), {
      maxZoom: 16,
      padding: [24, 24]
    });
    window.setTimeout(() => map.invalidateSize(), 80);
  }, [destination, routeCoordinates]);

  return <div className="absolute inset-0 h-full w-full" ref={containerRef} />;
}

function ServiceTypeCard({
  onSelectDelivery,
  orderType,
  setOrderType
}: {
  onSelectDelivery: () => void;
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
          onClick={onSelectDelivery}
          type="button"
        >
          <Bike className="size-4" />
          Domicilio
        </button>
      </div>
    </section>
  );
}

function DeliveryAddressCard({
  address,
  onSelectSuggestion,
  onUseCurrentLocation,
  quote,
  reference,
  setAddress,
  setReference,
  suggestions
}: {
  address: string;
  onSelectSuggestion: (suggestion: DeliverySuggestion) => void;
  onUseCurrentLocation: () => void;
  quote: DeliveryQuote;
  reference: string;
  setAddress: (address: string) => void;
  setReference: (reference: string) => void;
  suggestions: DeliverySuggestion[];
}) {
  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-[#eee9e5] bg-white p-3">
      <div className="mb-3 grid gap-3">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className={orderStyles.label}>Direccion de entrega</p>
            <button
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-2xl border border-[#eee9e5] bg-white px-3 text-[11px] font-black text-accent transition hover:border-accent/50"
              onClick={onUseCurrentLocation}
              type="button"
            >
              <LocateFixed className="size-3.5" />
              Usar GPS
            </button>
          </div>
          <label className="mt-2 block">
            <span className="sr-only">Direccion de entrega</span>
            <input
              className="h-11 w-full rounded-2xl border border-[#eee9e5] bg-white px-4 text-sm font-bold leading-5 text-[#252832] outline-none transition placeholder:text-[#9aa0aa] focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Ej: Carrera 50 # 12 Sur - 45, Sabaneta"
              value={address}
            />
          </label>
          {suggestions.length ? (
            <div className="mt-2 overflow-hidden rounded-[18px] border border-accent/15 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
              <div className="border-b border-[#eee9e5] bg-[#fff7f5] px-3 py-2">
                <p className="text-[11px] font-black uppercase leading-4 tracking-[0.14em] text-accent">Resultados encontrados</p>
              </div>
              {suggestions.map((suggestion) => {
                const [locationName, ...locationParts] = suggestion.displayName
                  .split(',')
                  .map((part) => part.trim())
                  .filter(Boolean);
                const locationDetail = locationParts.join(', ');

                return (
                  <button
                    className="group grid w-full grid-cols-[38px_1fr] gap-3 border-b border-[#eee9e5] px-3 py-3 text-left last:border-b-0 hover:bg-[#fff7f5] focus-visible:bg-[#fff7f5] focus-visible:outline-none"
                    key={suggestion.id}
                    onClick={() => onSelectSuggestion(suggestion)}
                    type="button"
                  >
                    <span className="grid size-9 place-items-center rounded-2xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-white">
                      <MapPin className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black leading-5 text-[#252832]">
                        {locationName ?? suggestion.displayName}
                      </span>
                      {locationDetail ? (
                        <span className="mt-0.5 line-clamp-2 block text-[11px] font-medium leading-4 text-[#737987]">
                          {locationDetail}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[11px] font-black text-accent">Tocar para usar esta direccion</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <label className="mt-2 block">
            <span className="sr-only">Apartamento o referencia</span>
            <input
              className="h-10 w-full rounded-2xl border border-[#eee9e5] bg-white px-4 text-xs font-medium leading-5 text-[#252832] outline-none transition placeholder:text-[#9aa0aa] focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              onChange={(event) => setReference(event.target.value)}
              placeholder="Apartamento, torre, referencia..."
              value={reference}
            />
          </label>

          {quote.status === 'ready' ? (
            <div className="mt-3 flex items-start gap-2">
              <MapPin className="mt-0.5 size-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-black leading-5 text-[#252832]">{quote.displayName ?? address}</p>
                {reference ? <p className={orderStyles.body}>{reference}</p> : null}
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-2">
              <MapPin className="mt-0.5 size-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-sm font-black leading-5 text-[#252832]">
                  {quote.status === 'loading' ? 'Calculando domicilio...' : 'Ingresa tu direccion para calcular el envio'}
                </p>
                {quote.message ? <p className={orderStyles.body}>{quote.message}</p> : null}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="delivery-route-map relative isolate z-0 h-[230px] overflow-hidden rounded-2xl border border-[#eee9e5] bg-[#eef0eb]">
        <DeliveryRouteMap destination={quote.coordinates} routeCoordinates={quote.routeCoordinates} />
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-[#252832] shadow-[0_8px_20px_rgba(15,23,42,0.12)]">
          Ruta restaurante - cliente
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-[#eee9e5] bg-white p-3">
        <div className="flex min-w-0 items-center gap-3">
          <Bike className="size-5 shrink-0 text-[#505662]" />
          <div>
            <p className="text-xs font-medium text-[#737987]">Distancia y tiempo estimado</p>
            <p className="text-sm font-black text-[#252832]">
              {formatDistance(quote.distanceKm)} - {formatDuration(quote.durationMin)}
            </p>
            {quote.trafficLabel ? <p className="text-[11px] font-bold text-[#737987]">{quote.trafficLabel}</p> : null}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-[#737987]">Costo de envio</p>
          <p className="text-lg font-black text-[#14942d]">{quote.fee ? formatCurrency(quote.fee) : '--'}</p>
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
  const storedDeliveryState = useMemo(() => readStoredDeliveryAddress(), []);
  const [orderType, setOrderType] = useState<'restaurant' | 'delivery'>(storedDeliveryState.orderType);
  const [deliveryAddress, setDeliveryAddress] = useState(storedDeliveryState.address);
  const [deliveryReference, setDeliveryReference] = useState(storedDeliveryState.reference);
  const [deliverySuggestions, setDeliverySuggestions] = useState<DeliverySuggestion[]>([]);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote>(storedDeliveryState.quote);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const resolvedDeliveryAddressRef = useRef(storedDeliveryState.quote.coordinates ? storedDeliveryState.address : '');
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
  const deliveryFee = orderType === 'delivery' ? deliveryQuote.fee ?? 0 : 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    persistDeliveryAddress(orderType, deliveryAddress, deliveryReference, deliveryQuote);
  }, [deliveryAddress, deliveryQuote, deliveryReference, orderType]);

  useEffect(() => {
    if (orderType !== 'delivery') {
      setDeliverySuggestions([]);
      return undefined;
    }

    const trimmedAddress = deliveryAddress.trim();
    if (trimmedAddress.length < 8) {
      setDeliveryQuote({
        status: 'idle',
        message: 'Escribe una direccion completa para calcular distancia, tiempo y costo.'
      });
      setDeliverySuggestions([]);
      return undefined;
    }

    if (trimmedAddress === resolvedDeliveryAddressRef.current && deliveryQuote.coordinates && deliveryQuote.status === 'ready') {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setDeliveryQuote((current) => ({
        ...current,
        message: 'Buscando direccion y calculando ruta...',
        status: 'loading'
      }));

      void searchDeliveryAddresses(trimmedAddress, controller.signal)
        .then(async (suggestions) => {
          if (controller.signal.aborted) return;
          setDeliverySuggestions(suggestions);
          const selectedSuggestion = suggestions[0];
          const route = await calculateRoadRoute(selectedSuggestion.coordinates, controller.signal);
          if (controller.signal.aborted) return;

          resolvedDeliveryAddressRef.current = trimmedAddress;
          setDeliveryQuote({
            coordinates: selectedSuggestion.coordinates,
            displayName: selectedSuggestion.displayName,
            distanceKm: route.distanceKm,
            durationMin: route.durationMin,
            fee: route.fee,
            routeCoordinates: route.routeCoordinates,
            status: 'ready',
            trafficLabel: route.trafficLabel
          });
        })
        .catch((caughtError) => {
          if (controller.signal.aborted) return;
          setDeliverySuggestions([]);
          setDeliveryQuote({
            message: caughtError instanceof Error ? caughtError.message : 'No pudimos calcular el domicilio.',
            status: 'error'
          });
        });
    }, 900);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [deliveryAddress, deliveryQuote.coordinates, orderType]);

  const calculateQuoteForLocation = async (coordinates: DeliveryCoordinates, displayName: string, signal?: AbortSignal) => {
    const route = await calculateRoadRoute(coordinates, signal ?? new AbortController().signal);
    setDeliveryQuote({
      coordinates,
      displayName,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      fee: route.fee,
      routeCoordinates: route.routeCoordinates,
      status: 'ready',
      trafficLabel: route.trafficLabel
    });
  };

  const selectDeliverySuggestion = (suggestion: DeliverySuggestion) => {
    resolvedDeliveryAddressRef.current = suggestion.displayName;
    setDeliveryAddress(suggestion.displayName);
    setDeliverySuggestions([]);
    setDeliveryQuote((current) => ({ ...current, coordinates: suggestion.coordinates, displayName: suggestion.displayName, status: 'loading' }));
    void calculateQuoteForLocation(suggestion.coordinates, suggestion.displayName).catch((caughtError) => {
      setDeliveryQuote({
        message: caughtError instanceof Error ? caughtError.message : 'No pudimos calcular el domicilio.',
        status: 'error'
      });
    });
  };

  const updateDeliveryAddress = (address: string) => {
    resolvedDeliveryAddressRef.current = '';
    setDeliveryAddress(address);
    setDeliverySuggestions([]);
    setDeliveryQuote({
      message:
        address.trim().length >= 8
          ? 'Buscando coincidencias mientras escribes...'
          : 'Escribe una direccion completa para calcular distancia, tiempo y costo.',
      status: address.trim().length >= 8 ? 'loading' : 'idle'
    });
  };

  const selectDeliveryMode = () => {
    const previousQuote = deliveryQuote;
    setOrderType('delivery');
    setError('');

    setDeliveryQuote((current) => ({
      ...current,
      message: 'Permite la ubicacion para calcular tu domicilio por GPS.',
      status: 'loading'
    }));

    void requestBrowserLocation()
      .then(async (coordinates) => {
        const controller = new AbortController();
        const displayName = (await reverseGeocodeCoordinates(coordinates, controller.signal).catch(() => undefined)) ?? 'Ubicacion actual del cliente';
        resolvedDeliveryAddressRef.current = displayName;
        setDeliveryAddress(displayName);
        setDeliverySuggestions([]);
        await calculateQuoteForLocation(coordinates, displayName, controller.signal);
      })
      .catch((caughtError) => {
        const message = caughtError instanceof Error ? caughtError.message : 'No pudimos tomar tu ubicacion por GPS.';
        setDeliveryQuote({
          ...previousQuote,
          message,
          status: previousQuote.status === 'ready' ? 'ready' : 'idle'
        });
      });
  };

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

    if (orderType === 'delivery' && deliveryQuote.status !== 'ready') {
      setError('Ingresa una direccion valida y espera el calculo del domicilio antes de enviar.');
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
      orderType === 'delivery' ? `Direccion: ${deliveryQuote.displayName ?? deliveryAddress.trim()}` : '',
      orderType === 'delivery' && deliveryReference.trim() ? `Referencia: ${deliveryReference.trim()}` : '',
      orderType === 'delivery' && deliveryQuote.coordinates
        ? `Coordenadas: ${deliveryQuote.coordinates.lat}, ${deliveryQuote.coordinates.lon}`
        : '',
      orderType === 'delivery' && deliveryQuote.distanceKm
        ? `Distancia: ${formatDistance(deliveryQuote.distanceKm)}`
        : '',
      orderType === 'delivery' && deliveryQuote.durationMin
        ? `Tiempo estimado: ${formatDuration(deliveryQuote.durationMin)}`
        : '',
      orderType === 'delivery' && deliveryQuote.trafficLabel ? `Trafico: ${deliveryQuote.trafficLabel}` : '',
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
                      <OrderItemMedia image={item.image} name={item.name} video={item.video} />
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

            <ServiceTypeCard onSelectDelivery={selectDeliveryMode} orderType={orderType} setOrderType={setOrderType} />

            {orderType === 'delivery' ? (
              <DeliveryAddressCard
                address={deliveryAddress}
                onSelectSuggestion={selectDeliverySuggestion}
                onUseCurrentLocation={selectDeliveryMode}
                quote={deliveryQuote}
                reference={deliveryReference}
                setAddress={updateDeliveryAddress}
                setReference={setDeliveryReference}
                suggestions={deliverySuggestions}
              />
            ) : null}

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
