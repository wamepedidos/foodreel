import { ArrowDownUp, Flame, ImageIcon, TrendingUp } from 'lucide-react';
import type { AdminDish, DashboardStats } from '../adminTypes';
import { formatCurrency } from '../../utils/format';

export function DashboardMetricCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-card p-4 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold leading-5 text-white/62">{label}</p>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/14 text-accent">{icon}</span>
      </div>
      <p className="mt-4 text-2xl font-black text-white">{value}</p>
    </article>
  );
}

export function DashboardTopDishCard({ dish, label }: { dish: AdminDish | null; label: string }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{label}</p>
      {dish ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-black/30">
            {dish.mainImageUrl ? (
              <img alt="" className="size-full object-cover" src={dish.mainImageUrl} />
            ) : (
              <ImageIcon className="size-5 text-muted" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-black">{dish.title}</p>
            <p className="mt-1 truncate text-xs text-white/56">
              {dish.categoryId} · {formatCurrency(dish.price)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/56">Sin datos todavia</p>
      )}
    </article>
  );
}

export type DishSortKey =
  | 'views'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'added'
  | 'sold'
  | 'lowInteraction';

export function DishPerformanceTable({
  category,
  dishes,
  onCategoryChange,
  onSortChange,
  sort
}: {
  category: string;
  dishes: AdminDish[];
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: DishSortKey) => void;
  sort: DishSortKey;
}) {
  const categories = ['Todas', ...Array.from(new Set(dishes.map((dish) => dish.categoryId)))];

  return (
    <section className="rounded-[28px] border border-white/10 bg-card p-4 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Estadisticas de la carta</p>
          <h2 className="mt-1 text-xl font-black">Rendimiento por plato</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-bold text-white/56">
            Categoria
            <select
              className="h-11 rounded-2xl border border-white/10 bg-base px-3 text-sm text-white outline-none focus:border-accent"
              onChange={(event) => onCategoryChange(event.target.value)}
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
            Ordenar
            <select
              className="h-11 rounded-2xl border border-white/10 bg-base px-3 text-sm text-white outline-none focus:border-accent"
              onChange={(event) => onSortChange(event.target.value as DishSortKey)}
              value={sort}
            >
              <option value="views">Mas visto</option>
              <option value="likes">Mas gustado</option>
              <option value="comments">Mas comentado</option>
              <option value="shares">Mas compartido</option>
              <option value="added">Mas agregado</option>
              <option value="sold">Mas vendido</option>
              <option value="lowInteraction">Menor interaccion</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-white/42">
            <tr>
              <th className="px-3 py-2">Plato</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Vistas</th>
              <th className="px-3 py-2">Likes</th>
              <th className="px-3 py-2">Comentarios</th>
              <th className="px-3 py-2">Compartidos</th>
              <th className="px-3 py-2">Agregados</th>
              <th className="px-3 py-2">Vendidos</th>
              <th className="px-3 py-2">Tasa</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((dish) => (
              <DishPerformanceRow dish={dish} key={dish.id} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 lg:hidden">
        {dishes.map((dish) => (
          <DishPerformanceCard dish={dish} key={dish.id} />
        ))}
      </div>
    </section>
  );
}

function DishPerformanceRow({ dish }: { dish: AdminDish }) {
  const rate = getInteractionRate(dish);
  return (
    <tr className="rounded-2xl bg-base/70">
      <td className="rounded-l-2xl px-3 py-3">
        <DishIdentity dish={dish} />
      </td>
      <td className="px-3 py-3">
        <StatusPill status={dish.status} />
      </td>
      <td className="px-3 py-3 font-bold">{dish.viewsCount}</td>
      <td className="px-3 py-3 font-bold">{dish.likesCount}</td>
      <td className="px-3 py-3 font-bold">{dish.commentsCount}</td>
      <td className="px-3 py-3 font-bold">{dish.sharesCount}</td>
      <td className="px-3 py-3 font-bold">{dish.addedToOrderCount}</td>
      <td className="px-3 py-3 font-bold">{dish.soldCount}</td>
      <td className="rounded-r-2xl px-3 py-3 font-bold text-accent">{rate}%</td>
    </tr>
  );
}

function DishPerformanceCard({ dish }: { dish: AdminDish }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-base/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <DishIdentity dish={dish} />
        <StatusPill status={dish.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <MiniStat label="Vistas" value={dish.viewsCount} />
        <MiniStat label="Likes" value={dish.likesCount} />
        <MiniStat label="Comentarios" value={dish.commentsCount} />
        <MiniStat label="Tasa" value={`${getInteractionRate(dish)}%`} />
      </div>
    </article>
  );
}

function DishIdentity({ dish }: { dish: AdminDish }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-black/30">
        {dish.mainImageUrl ? <img alt="" className="size-full object-cover" src={dish.mainImageUrl} /> : <Flame className="size-5" />}
      </div>
      <div className="min-w-0">
        <p className="truncate font-black">{dish.title}</p>
        <p className="truncate text-xs text-white/52">{dish.categoryId}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <p className="text-white/48">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: AdminDish['status'] }) {
  const map = {
    active: 'bg-emerald-500/15 text-emerald-300',
    unavailable: 'bg-amber-500/15 text-amber-200',
    draft: 'bg-white/10 text-white/70',
    archived: 'bg-red-500/15 text-red-200'
  };
  const labels = {
    active: 'Activo',
    unavailable: 'Agotado',
    draft: 'Borrador',
    archived: 'Archivado'
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${map[status]}`}>{labels[status]}</span>;
}

export function getInteractionRate(dish: AdminDish) {
  const interactions = dish.likesCount + dish.commentsCount + dish.sharesCount;
  return dish.viewsCount > 0 ? Math.round((interactions / dish.viewsCount) * 1000) / 10 : 0;
}

export function sortPerformanceDishes(dishes: AdminDish[], sort: DishSortKey) {
  const sorted = [...dishes];
  const sortMap: Record<DishSortKey, (dish: AdminDish) => number> = {
    views: (dish) => dish.viewsCount,
    likes: (dish) => dish.likesCount,
    comments: (dish) => dish.commentsCount,
    shares: (dish) => dish.sharesCount,
    added: (dish) => dish.addedToOrderCount,
    sold: (dish) => dish.soldCount,
    lowInteraction: (dish) => -getInteractionRate(dish)
  };
  return sorted.sort((a, b) => sortMap[sort](b) - sortMap[sort](a));
}

export function DashboardSummary({ stats }: { stats: DashboardStats }) {
  return (
    <article className="rounded-[28px] border border-accent/20 bg-accent/10 p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-accent text-white">
          <TrendingUp className="size-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Interaccion</p>
          <p className="font-black">
            {Math.round(stats.averageInteractions)} promedio por plato · tasa aproximada {Math.round(stats.interactionRate * 1000) / 10}%
          </p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm leading-6 text-white/68">
        <ArrowDownUp className="size-4 text-accent" />
        interactions = likes + comments + shares. Se evita division por cero cuando no hay vistas.
      </p>
    </article>
  );
}

