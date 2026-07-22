import {
  BarChart3,
  ChefHat,
  ClipboardList,
  Cog,
  ExternalLink,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  PanelLeft,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import type { AdminSession, EmployeeRole } from '../adminTypes';
import { getCurrentAdminSession, setDemoRole } from '../../services/employeesService';
import { ThemeSelector } from '../../theme/ThemeSelector';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, ready: true },
  { to: '/admin/menu', label: 'Carta', icon: ClipboardList, ready: true },
  { to: '/admin/categories', label: 'Categorias', icon: BarChart3, ready: false },
  { to: '/admin/employees', label: 'Empleados', icon: Users, ready: true },
  { to: '/admin/publications', label: 'Publicaciones', icon: Newspaper, ready: false },
  { to: '/admin/comments', label: 'Comentarios', icon: MessageSquare, ready: false },
  { to: '/admin/settings', label: 'Configuracion', icon: Cog, ready: false }
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<AdminSession>(() => getCurrentAdminSession());

  useEffect(() => {
    const syncSession = () => setSession(getCurrentAdminSession());
    window.addEventListener('foodreel:admin-session', syncSession);
    return () => window.removeEventListener('foodreel:admin-session', syncSession);
  }, []);

  if (session.role !== 'ADMINISTRADOR') {
    return (
      <div className="min-h-dvh bg-base px-4 py-6 text-white md:p-8">
        <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-card p-6 shadow-2xl">
          <div className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="mt-5 text-2xl font-black">Acceso administrativo restringido</h1>
          <p className="mt-2 text-sm leading-6 text-white/68">
            Solo administradores pueden crear platos, editar empleados y ver metricas completas. Cambia al usuario demo
            administrador para probar esta etapa.
          </p>
          <RoleSelector currentRole={session.role} onChange={(role) => setSession(setDemoRole(role))} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-base text-white">
      <div className="flex min-h-dvh">
        <AdminSidebar open={open} onClose={() => setOpen(false)} />
        <div className="min-w-0 flex-1">
          <AdminHeader currentRole={session.role} onMenu={() => setOpen(true)} onRoleChange={(role) => setSession(setDemoRole(role))} />
          <main className="mx-auto grid max-w-[1480px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <button
        aria-label="Cerrar menu administrativo"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
        type="button"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col border-r border-white/10 bg-base/98 p-4 shadow-2xl transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-card p-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-accent text-contrast shadow-glow">
            <ChefHat className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">FoodReel Admin</p>
            <p className="truncate text-xs text-muted">Operacion del restaurante</p>
          </div>
        </div>

        <nav className="mt-5 grid gap-1.5">
          <Link
            className="mb-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-3 text-sm font-black text-contrast shadow-glow transition hover:bg-accent/90"
            onClick={onClose}
            to="/menu"
          >
            <ExternalLink className="size-5 shrink-0" />
            Ir a la carta
          </Link>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  `flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition ${
                    isActive
                      ? 'bg-accent text-white shadow-glow'
                      : 'text-white/72 hover:bg-white/7 hover:text-white'
                  }`
                }
                end={item.end}
                key={item.to}
                onClick={onClose}
                to={item.to}
              >
                <Icon className="size-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {!item.ready ? (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-black text-white/54">
                    Prep
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[24px] border border-accent/20 bg-accent/10 p-4 text-xs leading-5 text-white/68">
          Notificaciones push, cocina completa, pedidos avanzados, facturacion, inventario y nomina quedan preparados para
          la siguiente etapa.
        </div>
      </aside>
    </>
  );
}

export function AdminHeader({
  currentRole,
  onMenu,
  onRoleChange
}: {
  currentRole: EmployeeRole;
  onMenu: () => void;
  onRoleChange: (role: EmployeeRole) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-base/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Abrir menu administrativo"
            className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-card text-white lg:hidden"
            onClick={onMenu}
            type="button"
          >
            <PanelLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-accent">Administrador</p>
            <h1 className="truncate text-xl font-black sm:text-2xl">Panel del restaurante</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-card px-3 text-sm font-black text-white transition hover:border-accent/50 hover:text-accent"
            to="/menu"
          >
            <ExternalLink className="size-4" />
            <span>Ver carta</span>
          </Link>
          <ThemeSelector compact />
          <RoleSelector currentRole={currentRole} onChange={onRoleChange} compact />
        </div>
      </div>
    </header>
  );
}

function RoleSelector({
  compact = false,
  currentRole,
  onChange
}: {
  compact?: boolean;
  currentRole: EmployeeRole;
  onChange: (role: EmployeeRole) => void;
}) {
  return (
    <label className={`grid gap-1 ${compact ? 'min-w-[150px]' : 'mt-5'}`}>
      {!compact ? <span className="text-xs font-bold text-white/60">Usuario demo</span> : null}
      <select
        className="h-11 rounded-2xl border border-white/10 bg-card px-3 text-sm font-bold text-white outline-none focus:border-accent"
        onChange={(event) => onChange(event.target.value as EmployeeRole)}
        value={currentRole}
      >
        <option value="ADMINISTRADOR">Administrador</option>
        <option value="MESERO">Mesero</option>
        <option value="COCINA">Cocina</option>
      </select>
    </label>
  );
}

export function EmptyState({ action, message, title }: { action?: ReactNode; message: string; title: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/12 bg-card/70 p-8 text-center">
      <p className="text-lg font-black">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{message}</div>;
}

export function LoadingSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="h-24 animate-pulse rounded-[24px] bg-white/8" key={index} />
      ))}
    </div>
  );
}
