import { Eye, Heart, MessageCircle, PackagePlus, Send, ShoppingBag, Star, ThumbsUp, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AdminDish } from '../adminTypes';
import {
  DashboardMetricCard,
  DashboardSummary,
  DashboardTopDishCard,
  DishPerformanceTable,
  sortPerformanceDishes,
  type DishSortKey
} from '../components/DashboardComponents';
import { getDashboardMetrics, getDashboardStats, subscribeToDishes } from '../../services/dishesService';

export function AdminDashboardPage() {
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [sort, setSort] = useState<DishSortKey>('views');
  const [category, setCategory] = useState('Todas');
  const [serverStats, setServerStats] = useState<ReturnType<typeof getDashboardStats> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToDishes(setDishes);
    return () => {
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    const load = () => {
      void getDashboardMetrics()
        .then((metrics) => {
          if (mounted) setServerStats(metrics);
        })
        .catch(() => undefined);
    };
    load();
    const sync = () => load();
    window.addEventListener('foodreel:menu-share', sync);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 60_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener('foodreel:menu-share', sync);
    };
  }, []);

  const visibleDishes = useMemo(
    () => dishes.filter((dish) => dish.status !== 'archived' && (category === 'Todas' || dish.categoryId === category)),
    [category, dishes]
  );
  const fallbackStats = useMemo(() => getDashboardStats(dishes), [dishes]);
  const stats = serverStats ?? fallbackStats;
  const tableDishes = useMemo(() => sortPerformanceDishes(visibleDishes, sort), [sort, visibleDishes]);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Dashboard</p>
          <h2 className="mt-1 text-2xl font-black">Estadisticas principales</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardMetricCard icon={<Eye className="size-5" />} label="Visualizaciones totales de platos" value={stats.viewsTotal} />
          <DashboardMetricCard icon={<Heart className="size-5" />} label="Me gusta totales" value={stats.likesTotal} />
          <DashboardMetricCard icon={<MessageCircle className="size-5" />} label="Comentarios totales" value={stats.commentsTotal} />
          <DashboardMetricCard icon={<Send className="size-5" />} label="Compartidos de platos" value={stats.dishSharesTotal} />
          <DashboardMetricCard icon={<Send className="size-5" />} label="Compartidos de carta completa" value={stats.menuSharesCount} />
          <DashboardMetricCard icon={<PackagePlus className="size-5" />} label="Productos agregados al Pedido" value={stats.addedToOrderTotal} />
          <DashboardMetricCard icon={<ShoppingBag className="size-5" />} label="Pedidos enviados" value={stats.ordersSentTotal} />
          <DashboardMetricCard icon={<Users className="size-5" />} label="Publicaciones creadas por clientes" value={stats.customerPostsTotal} />
          <DashboardMetricCard icon={<ThumbsUp className="size-5" />} label="Platos activos" value={stats.activeDishes} />
          <DashboardMetricCard icon={<Star className="size-5" />} label="Platos agotados" value={stats.unavailableDishes} />
        </div>
      </section>

      <DashboardSummary stats={stats} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardTopDishCard dish={stats.topViewedDish} label="Plato mas visto" />
        <DashboardTopDishCard dish={stats.topLikedDish} label="Plato con mas me gusta" />
        <DashboardTopDishCard dish={stats.topCommentedDish} label="Plato mas comentado" />
        <DashboardTopDishCard dish={stats.topSharedDish} label="Plato mas compartido" />
        <DashboardTopDishCard dish={stats.topAddedDish} label="Mas agregado al Pedido" />
        <InfoCard label="Categoria mas consultada" value={stats.topCategory} />
        <InfoCard label="Promedio de visualizaciones por plato" value={Math.round(stats.averageViews)} />
        <InfoCard label="Promedio de interaccion por plato" value={Math.round(stats.averageInteractions)} />
      </section>

      <DishPerformanceTable
        category={category}
        dishes={tableDishes}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        sort={sort}
      />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/44">{label}</p>
      <p className="mt-3 text-xl font-black">{value}</p>
    </article>
  );
}
