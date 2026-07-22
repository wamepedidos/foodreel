import { AlertTriangle, Award, BadgeCheck, ChefHat, Eye, FileText, Flame, Leaf, MessageCircle, Send, ShoppingBag, Sparkles, UsersRound, Volume2, VolumeX, WheatOff, X } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Dish, ExperienceComment } from '../types';
import { createDishComment, mergeComments, subscribeToDishComments } from '../services/commentsService';
import { registerDishView } from '../services/dishesService';
import { useCartStore } from '../store/useCartStore';
import { FavoriteButton } from './FavoriteButton';
import { compactCount } from '../utils/format';
import { getOrCreateCustomerSessionId } from '../utils/session';
import { readCustomerProfile } from '../utils/customerProfile';
import { useCustomerHasName } from '../utils/useCustomerHasName';
import { AddToCartButton } from './AddToCartButton';
import { CustomerNameDialog } from './CustomerNameDialog';
import { ReelMedia } from './ReelMedia';
import { SocialActions } from './SocialActions';
import { SocialMetricsRow } from './SocialMetricsRow';
import { useToast } from './Toast';

export function ReelDishCard({
  dish,
  active,
  muted,
  onToggleAudio,
  topBar = false
}: {
  dish: Dish;
  active: boolean;
  muted: boolean;
  onToggleAudio: () => void;
  topBar?: boolean;
}) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [commentsScrollSignal, setCommentsScrollSignal] = useState(0);
  const [commentCount, setCommentCount] = useState(dish.commentsCount);
  const [viewCount, setViewCount] = useState(dish.viewsCount);
  const viewedRef = useRef(false);
  const navigate = useNavigate();
  const totalQuantity = useCartStore((state) => state.totalQuantity());

  useEffect(() => {
    if (!active || viewedRef.current) {
      return undefined;
    }

    const key = `foodreel-viewed-${dish.id}`;
    if (sessionStorage.getItem(key)) {
      viewedRef.current = true;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(key, 'true');
      viewedRef.current = true;
      setViewCount((count) => count + 1);
      void registerDishView(dish.id, getOrCreateCustomerSessionId()).then((result) => {
        if (result.count) {
          setViewCount(result.count);
        }
      });
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [active, dish.id]);

  useEffect(() => {
    setCommentCount(dish.commentsCount);
  }, [dish.commentsCount, dish.id]);

  useEffect(() => {
    if (!active) return undefined;
    return subscribeToDishComments(dish.id, (comments) => {
      setCommentCount(comments.length);
    });
  }, [active, dish.id]);

  const mediaActive = active;
  const primaryFeature = getPrimaryFeature(dish);
  const primaryAllergen = getPrimaryAllergen(dish);
  const reelBadges = getReelBadges(dish, primaryFeature);
  const openComments = () => {
    setDescriptionOpen(true);
    setCommentsScrollSignal((value) => value + 1);
  };

  return (
    <section className="h-full snap-start" data-dish-id={dish.id}>
      <article className="media-overlay relative h-full overflow-hidden bg-black shadow-2xl">
        <ReelMedia
          active={mediaActive}
          compressed={descriptionOpen}
          dish={dish}
          muted={muted}
          onMediaClick={descriptionOpen ? () => setDescriptionOpen(false) : undefined}
        />

        <div
          data-view-count
          className={`absolute right-4 z-20 transition duration-300 ${
            topBar ? 'top-[calc(48px+env(safe-area-inset-top))]' : 'top-[calc(18px+env(safe-area-inset-top))]'
          } ${
            descriptionOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="inline-flex h-6 min-w-[52px] items-center justify-center gap-1 rounded-full border border-paper/45 bg-black/[0.20] px-2 text-paper backdrop-blur-md">
              <Eye className="size-3.5" />
              <p className="text-xs font-normal leading-none">{compactCount(viewCount)}</p>
            </div>
            <button
              aria-label={muted ? 'Activar sonido' : 'Silenciar video'}
              className="grid size-6 place-items-center rounded-full border border-paper/45 bg-black/[0.20] text-paper backdrop-blur-md transition hover:border-accent/80"
              onClick={onToggleAudio}
              type="button"
            >
              {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
            </button>
          </div>
        </div>

        <div
          className={`absolute right-1.5 top-[63%] z-20 -translate-y-1/2 transition duration-300 ${
            descriptionOpen ? 'pointer-events-none translate-x-4 opacity-0' : 'opacity-100'
          }`}
        >
          <SocialActions commentsCount={commentCount} dish={dish} onComments={openComments} />
        </div>

        <div
          className={`absolute inset-x-0 bottom-[calc(54px+env(safe-area-inset-bottom))] z-10 px-4 pb-3 transition duration-300 ${
            descriptionOpen ? 'pointer-events-none translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="pr-[68px]">
            {primaryFeature || primaryAllergen ? (
              <div className="no-scrollbar mb-2 flex max-w-full flex-nowrap gap-2 overflow-x-auto pr-2 text-[0.72rem] font-semibold">
                {primaryFeature ? (
                  <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-accent/65 bg-black/[0.34] px-3 text-accent backdrop-blur-md">
                    <Sparkles className="size-3.5" />
                    {primaryFeature}
                  </span>
                ) : null}
                {primaryAllergen ? (
                  <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-red-400/70 bg-red-950/45 px-3 text-red-100 backdrop-blur-md">
                    <AlertTriangle className="size-3.5 text-red-300" />
                    {primaryAllergen}
                  </span>
                ) : null}
              </div>
            ) : null}

            <h1 className="max-w-[17rem] truncate text-[1.05rem] font-extrabold leading-tight tracking-normal text-white drop-shadow-2xl">
              {dish.name}
            </h1>
            <p data-reel-description className="mt-1 max-w-[17rem] truncate text-[0.78rem] font-medium leading-5 text-white/[0.92]">
              {dish.shortDescription}
            </p>
          </div>

          {reelBadges.length ? (
            <div data-dish-badges className="no-scrollbar mt-3 flex w-full flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain pr-20 text-[0.7rem] font-semibold">
              {reelBadges.map((badge) => (
                <ReelBadge badge={badge} key={`${badge.group}-${badge.label}`} />
              ))}
            </div>
          ) : null}

          <div data-reel-cta-row className="mt-3 grid grid-cols-[0.92fr_1.45fr_44px] items-center gap-2">
            <button
              className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-[16px] border border-white/10 bg-white/10 px-2 text-[0.72rem] font-semibold text-white backdrop-blur-xl transition hover:border-accent/50"
              onClick={() => setDescriptionOpen(true)}
              type="button"
            >
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate">Ver descripcion</span>
            </button>
            <AddToCartButton dish={dish} variant="reel" />
            <button
              aria-label="Ver carrito"
              className="relative grid size-11 place-items-center rounded-full border border-white/10 bg-black/[0.56] text-white shadow-[0_14px_36px_rgba(0,0,0,0.36)] backdrop-blur-xl transition hover:border-accent/60"
              onClick={() => navigate('/pedido')}
              type="button"
            >
              <ShoppingBag className="size-6" strokeWidth={2.2} />
              {totalQuantity > 0 ? (
                <span className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {totalQuantity}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <ReelDescriptionPanel
          dish={dish}
          onCart={() => navigate('/pedido')}
          onClose={() => setDescriptionOpen(false)}
          onComments={openComments}
          open={descriptionOpen}
          totalQuantity={totalQuantity}
          viewCount={viewCount}
          commentsCount={commentCount}
          onCommentsCountChange={setCommentCount}
          primaryFeature={primaryFeature}
          commentsScrollSignal={commentsScrollSignal}
        />
      </article>
    </section>
  );
}

function ReelDescriptionPanel({
  commentsScrollSignal,
  dish,
  onCart,
  onClose,
  onComments,
  onCommentsCountChange,
  open,
  totalQuantity,
  viewCount,
  commentsCount,
  primaryFeature
}: {
  commentsScrollSignal: number;
  commentsCount: number;
  dish: Dish;
  onCart: () => void;
  onClose: () => void;
  onComments: () => void;
  onCommentsCountChange: (count: number) => void;
  open: boolean;
  totalQuantity: number;
  viewCount: number;
  primaryFeature: string | null;
}) {
  const sections = getDetailSections(dish, primaryFeature);
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || commentsScrollSignal <= 0) return undefined;
    const timer = window.setTimeout(() => {
      const container = scrollContainerRef.current;
      const target = commentsRef.current;
      if (!container || !target) return;

      const targetTop = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({
        behavior: 'smooth',
        top: Math.max(0, targetTop - 10)
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [commentsScrollSignal, open]);

  return (
    <aside
      aria-hidden={!open}
      className={`absolute inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] top-[43%] z-30 flex flex-col rounded-t-[28px] border-t border-black/[0.08] bg-paper px-4 pb-4 pt-3 text-black shadow-[0_-14px_40px_rgba(0,0,0,0.08)] transition duration-500 ease-out ${
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-300" />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">{dish.category}</p>
            <h2 className="mt-1 truncate text-[1.08rem] font-bold leading-tight text-neutral-950">{dish.name}</h2>
          </div>
          <button
            aria-label="Cerrar descripcion"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-950 transition hover:border-accent/60"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="no-scrollbar mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pr-1" ref={scrollContainerRef}>
          <div className="flex items-center justify-between gap-3">
            <SocialMetricsRow dish={{ ...dish, commentsCount }} onComments={onComments} tone="light" viewCount={viewCount} />
            <FavoriteButton dishId={dish.id} tone="light" variant="icon" />
          </div>

          <p className="mt-3 text-[0.88rem] font-medium leading-5 text-neutral-900">{dish.description}</p>

          {sections.length ? (
            <div className="bg-paper pb-2 pt-3">
              <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
                {sections.map((section) => (
                  <DetailSectionCard section={section} key={section.title} />
                ))}
              </div>
            </div>
          ) : null}

          <InlineDishComments dish={dish} onCommentsCountChange={onCommentsCountChange} open={open} refTarget={commentsRef} />
        </div>

        <div className="mt-3 grid grid-cols-[1fr_40px] items-center gap-2">
          <AddToCartButton dish={dish} variant="reel" />
          <button
            aria-label="Ver carrito"
            className="relative grid size-10 place-items-center rounded-full border border-neutral-950 bg-neutral-950 text-white transition hover:border-accent/60"
            onClick={onCart}
            type="button"
          >
            <ShoppingBag className="size-5" strokeWidth={2.2} />
            {totalQuantity > 0 ? (
              <span className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {totalQuantity}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

function InlineDishComments({
  dish,
  onCommentsCountChange,
  open,
  refTarget
}: {
  dish: Dish;
  onCommentsCountChange: (count: number) => void;
  open: boolean;
  refTarget: RefObject<HTMLDivElement | null>;
}) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<ExperienceComment[]>([]);
  const [draft, setDraft] = useState('');
  const [hasCustomerName, setHasCustomerName] = useCustomerHasName(open);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    return subscribeToDishComments(dish.id, (nextComments) => {
      setComments((current) => {
        const merged = mergeComments(current, nextComments);
        onCommentsCountChange(merged.length);
        return merged;
      });
    });
  }, [dish.id, onCommentsCountChange, open]);

  const sendComment = () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (!hasCustomerName) {
      setNameDialogOpen(true);
      return;
    }

    setSending(true);
    void createDishComment({
      dishId: dish.id,
      text,
      userId: getOrCreateCustomerSessionId(),
      userName: readCustomerProfile().displayName.trim() || 'Cliente'
    })
      .then((comment) => {
        setComments((current) => {
          const merged = mergeComments(current, [comment]);
          onCommentsCountChange(merged.length);
          return merged;
        });
        setDraft('');
        showToast('Comentario enviado');
      })
      .catch((error) => showToast(error instanceof Error ? error.message : 'No se pudo comentar'))
      .finally(() => setSending(false));
  };

  return (
    <section className="mt-4 scroll-mt-3" ref={refTarget}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-neutral-100 text-neutral-950">
            <MessageCircle className="size-4" />
          </span>
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-neutral-500">Comunidad</p>
            <h3 className="text-sm font-bold leading-4 text-neutral-950">Comentarios</h3>
          </div>
        </div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-700">{compactCount(comments.length)}</span>
      </div>

      <div className="mt-3 grid gap-2">
        {comments.length ? (
          comments.map((comment) => (
            <article className="rounded-[14px] border border-neutral-200 bg-paper p-3 shadow-sm" key={comment.id}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-bold text-neutral-950">{comment.userName}</span>
                <span className="shrink-0 font-medium text-neutral-500">
                  {new Date(comment.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium leading-5 text-neutral-800">{comment.text}</p>
            </article>
          ))
        ) : (
          <p className="rounded-[14px] border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm font-medium text-neutral-600">
            Aun no hay comentarios aprobados.
          </p>
        )}
      </div>

      {hasCustomerName ? (
        <form
          className="mt-3 flex items-center gap-2 rounded-[16px] border border-neutral-200 bg-neutral-50 p-2"
          onSubmit={(event) => {
            event.preventDefault();
            sendComment();
          }}
        >
          <input
            className="min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-neutral-950 outline-none placeholder:text-neutral-500"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe un comentario..."
            value={draft}
          />
          <button
            aria-label="Enviar comentario"
            className="grid size-9 place-items-center rounded-full bg-accent text-white disabled:opacity-50"
            disabled={sending}
            type="submit"
          >
            <Send className="size-4" />
          </button>
        </form>
      ) : (
        <button
          className="mt-3 h-11 w-full rounded-[16px] bg-accent px-4 text-sm font-normal text-white shadow-glow"
          onClick={() => setNameDialogOpen(true)}
          type="button"
        >
          Dinos tu nombre para enviar comentarios
        </button>
      )}

      <CustomerNameDialog
        description="Tu nombre aparecera junto a los comentarios que hagas en los platos."
        onClose={() => setNameDialogOpen(false)}
        onConfirm={() => setHasCustomerName(true)}
        open={nameDialogOpen}
        title="Dinos tu nombre"
      />
    </section>
  );
}

type BadgeTone = 'accent' | 'amber' | 'emerald' | 'green' | 'red' | 'zinc';
type IconComponent = typeof Flame;

type DishBadge = {
  group: string;
  label: string;
  icon: IconComponent;
  tone: BadgeTone;
};

type DetailSection = {
  title: string;
  eyebrow: string;
  icon: IconComponent;
  tone: BadgeTone;
  items: string[];
};

const featurePriority = [
  { label: 'Nuevo', keys: ['nuevo'] },
  { label: 'Mas vendido', keys: ['mas vendido', 'mas pedido', 'vendido'] },
  { label: 'Recomendado por el chef', keys: ['recomendado por el chef', 'chef recomienda', 'recomendado'] },
  { label: 'Especialista de la casa', keys: ['especialista de la casa', 'especial de la casa', 'de la casa'] },
  { label: 'Edicion limitada', keys: ['edicion limitada', 'limitada'] }
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function unique(values: Array<string | undefined | null>) {
  const seen = new Set<string>();
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const key = normalizeText(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getFeatures(dish: Dish) {
  return unique([...(dish.features ?? []), dish.tag]);
}

function getPrimaryFeature(dish: Dish) {
  const features = getFeatures(dish);
  for (const priority of featurePriority) {
    const match = features.find((feature) => {
      const normalized = normalizeText(feature);
      return priority.keys.some((key) => normalized.includes(key));
    });
    if (match) return priority.label;
  }
  return features[0] ?? null;
}

function getRemainingFeatures(dish: Dish, primaryFeature: string | null) {
  const primaryGroup = primaryFeature
    ? featurePriority.find((priority) => normalizeText(priority.label) === normalizeText(primaryFeature))
    : null;

  return getFeatures(dish).filter((feature) => {
    const normalized = normalizeText(feature);
    if (normalized === normalizeText(primaryFeature ?? '')) return false;
    return !primaryGroup?.keys.some((key) => normalized.includes(key));
  });
}

function getPrimaryAllergen(dish: Dish) {
  const allergen = dish.allergens?.find(Boolean);
  return allergen ? `Alergeno: ${allergen}` : null;
}

function getSpicyLabel(level = 0) {
  if (level >= 3) return 'Picante alto';
  if (level === 2) return 'Picante medio';
  if (level === 1) return 'Picante suave';
  return null;
}

function getServingLabel(dish: Dish) {
  if (dish.servingDescription?.trim()) return dish.servingDescription.trim();
  const sizes = [...(dish.servingSizes ?? [])].map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sizes.length) return null;
  if (sizes.length === 1) return sizes[0] === 1 ? 'Para 1 persona' : `Para ${sizes[0]} personas`;
  return `Para ${sizes[0]} a ${sizes[sizes.length - 1]} personas`;
}

function getDietaryFeatures(dish: Dish) {
  return unique([
    dish.isVegan ? 'Vegano' : null,
    dish.isVegetarian ? 'Vegetariano' : null,
    dish.isGlutenFree ? 'Libre de gluten' : null,
    dish.dietaryNotes
  ]);
}

function getReelBadges(dish: Dish, primaryFeature: string | null): DishBadge[] {
  const dietary = getDietaryFeatures(dish);
  const features = getRemainingFeatures(dish, primaryFeature);
  const spicyLabel = getSpicyLabel(dish.spicyLevel);
  const servingLabel = getServingLabel(dish);
  const badges: DishBadge[] = [];

  if (spicyLabel) badges.push({ group: 'Nivel de picante', label: spicyLabel, icon: Flame, tone: 'accent' });
  if (servingLabel) badges.push({ group: 'Personas', label: servingLabel, icon: UsersRound, tone: 'amber' });
  dietary.forEach((label) => badges.push({ group: 'Caracteristicas alimentarias', label, icon: label === 'Libre de gluten' ? WheatOff : Leaf, tone: 'green' }));
  features.forEach((label) => badges.push({ group: 'Caracteristicas del plato', label, icon: label.toLowerCase().includes('chef') ? ChefHat : BadgeCheck, tone: 'emerald' }));

  return badges;
}

function getDetailSections(dish: Dish, primaryFeature: string | null): DetailSection[] {
  const dietary = getDietaryFeatures(dish);
  const features = unique([primaryFeature, ...getRemainingFeatures(dish, primaryFeature)]);
  const spicyLabel = getSpicyLabel(dish.spicyLevel);
  const servingLabel = getServingLabel(dish);
  const allergens = unique(dish.allergens ?? []);
  const ingredients = unique(dish.ingredients);

  return [
    spicyLabel ? { title: 'Nivel de picante', eyebrow: 'Intensidad', icon: Flame, tone: 'accent' as const, items: [spicyLabel] } : null,
    servingLabel ? { title: 'Para cuantas personas', eyebrow: 'Porcion', icon: UsersRound, tone: 'amber' as const, items: [servingLabel] } : null,
    dietary.length ? { title: 'Caracteristicas alimentarias', eyebrow: 'Dieta', icon: Leaf, tone: 'green' as const, items: dietary } : null,
    features.length ? { title: 'Caracteristicas del plato', eyebrow: 'Perfil', icon: Award, tone: 'emerald' as const, items: features } : null,
    allergens.length ? { title: 'Alergenos', eyebrow: 'Atencion', icon: AlertTriangle, tone: 'red' as const, items: allergens } : null,
    ingredients.length ? { title: 'Ingredientes', eyebrow: 'Composicion', icon: BadgeCheck, tone: 'zinc' as const, items: ingredients } : null
  ].filter((section): section is DetailSection => Boolean(section));
}

function ReelBadge({ badge }: { badge: DishBadge }) {
  const Icon = badge.icon;
  const styles = {
    accent: 'border-accent/80 bg-black/[0.24] text-white [&_svg]:text-accent',
    amber: 'border-yellow-300/75 bg-black/[0.24] text-yellow-200',
    emerald: 'border-emerald-400/75 bg-black/[0.24] text-white [&_svg]:text-emerald-300',
    green: 'border-green-500/75 bg-black/[0.24] text-white [&_svg]:text-green-400',
    red: 'border-red-400/75 bg-red-950/35 text-red-100',
    zinc: 'border-white/20 bg-black/[0.24] text-white'
  } satisfies Record<BadgeTone, string>;

  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 backdrop-blur-md ${styles[badge.tone]}`}>
      <Icon className="size-3.5" />
      {badge.label}
    </span>
  );
}

function DetailSectionCard({ section }: { section: DetailSection }) {
  const Icon = section.icon;
  const styles = {
    accent: 'border-neutral-200 bg-paper text-accent before:bg-accent [&_.section-icon]:bg-red-50',
    amber: 'border-neutral-200 bg-paper text-amber-700 before:bg-amber-500 [&_.section-icon]:bg-amber-50',
    emerald: 'border-neutral-200 bg-paper text-emerald-700 before:bg-emerald-500 [&_.section-icon]:bg-emerald-50',
    green: 'border-neutral-200 bg-paper text-lime-700 before:bg-lime-500 [&_.section-icon]:bg-lime-50',
    red: 'border-neutral-200 bg-paper text-red-700 before:bg-red-500 [&_.section-icon]:bg-red-50',
    zinc: 'border-neutral-200 bg-paper text-neutral-700 before:bg-neutral-400 [&_.section-icon]:bg-neutral-100'
  } satisfies Record<BadgeTone, string>;

  return (
    <section className={`relative w-[78%] shrink-0 snap-start overflow-hidden rounded-[14px] border p-2.5 pl-3 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full ${styles[section.tone]}`}>
      <div className="flex items-center gap-2">
        <span className="section-icon grid size-7 shrink-0 place-items-center rounded-full">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-neutral-500">{section.eyebrow}</p>
          <h3 className="truncate text-[0.82rem] font-bold leading-4 text-neutral-950">{section.title}</h3>
        </div>
      </div>
      <div className="no-scrollbar mt-2 flex flex-nowrap gap-1.5 overflow-x-auto">
        {section.items.map((item) => (
          <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-neutral-100 px-2.5 text-[0.7rem] font-semibold text-neutral-950 ring-1 ring-black/[0.06]" key={item}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
