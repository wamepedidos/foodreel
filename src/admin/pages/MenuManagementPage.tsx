import {
  Archive,
  Copy,
  Edit3,
  Eye,
  Heart,
  ImageIcon,
  MessageCircle,
  PackagePlus,
  Plus,
  Search,
  Send,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminDish, DishStatus } from '../adminTypes';
import { StatusPill } from '../components/DashboardComponents';
import { EmptyState } from '../components/AdminLayout';
import { archiveDish, duplicateDish, subscribeToDishes, updateDishAvailability } from '../../services/dishesService';
import { formatCurrency } from '../../utils/format';
import { useToast } from '../../components/Toast';

type StateFilter = 'all' | DishStatus | 'featured' | 'new' | 'created';

export function MenuManagementPage() {
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToDishes(setDishes);
    return () => {
      unsubscribe();
    };
  }, []);

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(dishes.map((dish) => dish.categoryId)))], [dishes]);
  const filteredDishes = useMemo(() => {
    return dishes
      .filter((dish) => dish.status !== 'archived')
      .filter((dish) => category === 'Todas' || dish.categoryId === category)
      .filter((dish) => {
        if (stateFilter === 'all') return true;
        if (stateFilter === 'featured') return dish.features.some((feature) => feature.toLowerCase().includes('recomendado'));
        if (stateFilter === 'new') return dish.features.some((feature) => feature.toLowerCase().includes('nuevo'));
        if (stateFilter === 'created') {
          const created = new Date(dish.createdAt).getTime();
          return created > Date.now() - 14 * 86400000;
        }
        return dish.status === stateFilter;
      })
      .filter((dish) => `${dish.title} ${dish.categoryId} ${dish.features.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [category, dishes, query, stateFilter]);

  const handleStatus = async (dishId: string, status: DishStatus, message: string) => {
    await updateDishAvailability(dishId, status);
    showToast(message);
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Carta</p>
          <h2 className="mt-1 text-2xl font-black">Administracion de platos</h2>
        </div>
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-black text-white shadow-glow transition hover:brightness-110"
          to="/admin/menu/new"
        >
          <Plus className="size-5" />
          Crear plato
        </Link>
      </div>

      <section className="grid gap-3 rounded-[28px] border border-white/10 bg-card p-4 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <label className="relative grid gap-1 text-xs font-bold text-white/56">
          Buscar platos
          <Search className="pointer-events-none absolute bottom-3 left-3 size-5 text-white/38" />
          <input
            className="h-12 rounded-2xl border border-white/10 bg-base pl-10 pr-3 text-sm text-white outline-none focus:border-accent"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, categoria o etiqueta"
            value={query}
          />
        </label>
        <label className="grid gap-1 text-xs font-bold text-white/56">
          Categoria
          <select
            className="h-12 rounded-2xl border border-white/10 bg-base px-3 text-sm text-white outline-none focus:border-accent"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-white/56">
          Estado
          <select
            className="h-12 rounded-2xl border border-white/10 bg-base px-3 text-sm text-white outline-none focus:border-accent"
            onChange={(event) => setStateFilter(event.target.value as StateFilter)}
            value={stateFilter}
          >
            <option value="all">Todos</option>
            <option value="active">Disponible</option>
            <option value="unavailable">Agotado</option>
            <option value="draft">Borrador</option>
            <option value="featured">Destacado</option>
            <option value="new">Nuevo</option>
            <option value="created">Fecha de creacion reciente</option>
          </select>
        </label>
      </section>

      {filteredDishes.length ? (
        <section className="grid gap-3">
          {filteredDishes.map((dish) => (
            <DishManagementCard
              dish={dish}
              key={dish.id}
              onArchive={async () => {
                await archiveDish(dish.id);
                showToast('Plato archivado');
              }}
              onDuplicate={async () => {
                await duplicateDish(dish.id);
                showToast('Plato duplicado como borrador');
              }}
              onStatus={handleStatus}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          action={
            <Link className="inline-flex h-11 items-center rounded-2xl bg-accent px-4 text-sm font-black text-white" to="/admin/menu/new">
              Crear primer plato
            </Link>
          }
          message="No hay platos que coincidan con los filtros actuales."
          title="Sin platos para mostrar"
        />
      )}
    </div>
  );
}

function DishManagementCard({
  dish,
  onArchive,
  onDuplicate,
  onStatus
}: {
  dish: AdminDish;
  onArchive: () => void;
  onDuplicate: () => void;
  onStatus: (dishId: string, status: DishStatus, message: string) => void;
}) {
  return (
    <article className="grid gap-3 rounded-[28px] border border-white/10 bg-card p-3 shadow-2xl shadow-black/20 xl:grid-cols-[1.4fr_1fr_auto] xl:items-center">
      <div className="flex min-w-0 gap-3">
        <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-[22px] bg-black/35 sm:size-28">
          {dish.mainImageUrl ? <img alt="" className="size-full object-cover" src={dish.mainImageUrl} /> : <ImageIcon className="size-7 text-muted" />}
          {dish.videoUrl ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-black text-white">Video</span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-lg font-black">{dish.title}</h3>
            <StatusPill status={dish.status} />
          </div>
          <p className="mt-1 text-sm font-black text-accent">{formatCurrency(dish.price)}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/62">{dish.shortDescription}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-bold text-white/68">{dish.categoryId}</span>
            <span className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-bold text-white/68">
              {dish.preparationTimeMin || '-'}-{dish.preparationTimeMax || '-'} min
            </span>
            {dish.features.slice(0, 3).map((feature) => (
              <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent" key={feature}>
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5 xl:grid-cols-5">
        <MenuMetric icon={<Eye className="size-4" />} label="Vistas" value={dish.viewsCount} />
        <MenuMetric icon={<Heart className="size-4" />} label="Likes" value={dish.likesCount} />
        <MenuMetric icon={<MessageCircle className="size-4" />} label="Comentarios" value={dish.commentsCount} />
        <MenuMetric icon={<Send className="size-4" />} label="Shares" value={dish.sharesCount} />
        <MenuMetric icon={<PackagePlus className="size-4" />} label="Agregado" value={dish.addedToOrderCount} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:w-[420px]">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-base px-3 text-xs font-black text-white transition hover:border-accent/50"
          to={`/admin/menu/${dish.id}/edit`}
        >
          <Edit3 className="size-4" />
          Editar
        </Link>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-base px-3 text-xs font-black" onClick={onDuplicate} type="button">
          <Copy className="size-4" />
          Duplicar
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-base px-3 text-xs font-black"
          onClick={() => onStatus(dish.id, dish.status === 'active' ? 'draft' : 'active', dish.status === 'active' ? 'Plato desactivado' : 'Plato activado')}
          type="button"
        >
          {dish.status === 'active' ? <ToggleLeft className="size-4" /> : <ToggleRight className="size-4" />}
          {dish.status === 'active' ? 'Desactivar' : 'Activar'}
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-3 text-xs font-black text-amber-100"
          onClick={() => onStatus(dish.id, 'unavailable', 'Plato marcado como agotado')}
          type="button"
        >
          Agotar
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-3 text-xs font-black text-red-100"
          onClick={onArchive}
          type="button"
        >
          <Archive className="size-4" />
          Archivar
        </button>
      </div>
    </article>
  );
}

function MenuMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-base/70 p-3">
      <p className="flex items-center gap-1 text-white/46">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
