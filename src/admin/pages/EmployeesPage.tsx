import { Archive, KeyRound, Pencil, Plus, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Employee, EmployeeRole, EmployeeStatus } from '../adminTypes';
import { EmptyState } from '../components/AdminLayout';
import {
  changeEmployeeRole,
  createEmployee,
  demoUsers,
  resetEmployeeAccess,
  subscribeToEmployees,
  updateEmployee,
  updateEmployeeStatus
} from '../../services/employeesService';
import { useToast } from '../../components/Toast';

const roleDescriptions: Record<EmployeeRole, string> = {
  ADMINISTRADOR: 'Dashboard, carta, empleados, publicaciones y configuracion.',
  MESERO: 'Acceso futuro a pedidos, mesas y llamadas de clientes.',
  COCINA: 'Acceso futuro a pedidos en preparacion y cambios de estado.'
};

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToEmployees(setEmployees);
    return () => {
      unsubscribe();
    };
  }, []);

  const visibleEmployees = useMemo(() => employees.filter((employee) => employee.status !== 'archived'), [employees]);

  const handleStatus = async (employeeId: string, status: EmployeeStatus) => {
    await updateEmployeeStatus(employeeId, status);
    showToast(status === 'active' ? 'Empleado activado' : status === 'inactive' ? 'Empleado desactivado' : 'Empleado archivado');
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Empleados</p>
          <h2 className="mt-1 text-2xl font-black">Administracion basica de empleados</h2>
        </div>
        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-black text-white shadow-glow"
          onClick={() => {
            setEditingEmployee(null);
            setFormOpen(true);
          }}
          type="button"
        >
          <Plus className="size-5" />
          Crear empleado
        </button>
      </div>

      <section className="grid gap-3 rounded-[28px] border border-accent/20 bg-accent/10 p-4 md:grid-cols-3">
        {demoUsers.map((user) => (
          <div className="rounded-2xl bg-base/70 p-3" key={user.email}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">{user.role}</p>
            <p className="mt-2 text-sm font-black">{user.email}</p>
            <p className="mt-1 text-xs text-white/56">{user.password}</p>
          </div>
        ))}
      </section>

      {formOpen ? (
        <EmployeeForm
          employee={editingEmployee}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setEditingEmployee(null);
            showToast('Empleado guardado');
          }}
        />
      ) : null}

      {visibleEmployees.length ? (
        <section className="grid gap-3">
          {visibleEmployees.map((employee) => (
            <EmployeeCard
              employee={employee}
              key={employee.id}
              onArchive={() => handleStatus(employee.id, 'archived')}
              onEdit={() => {
                setEditingEmployee(employee);
                setFormOpen(true);
              }}
              onReset={async () => {
                const password = await resetEmployeeAccess(employee.id);
                showToast(`Acceso restablecido: ${password}`);
              }}
              onRole={(role) => changeEmployeeRole(employee.id, role)}
              onStatus={(status) => handleStatus(employee.id, status)}
            />
          ))}
        </section>
      ) : (
        <EmptyState message="Crea administradores, meseros y empleados de cocina para esta etapa." title="Sin empleados" />
      )}

      <section className="rounded-[28px] border border-white/10 bg-card p-4">
        <h3 className="text-lg font-black">Modelo preparado para notificaciones push</h3>
        <p className="mt-2 text-sm leading-6 text-white/62">
          Cada empleado guarda notificationsEnabled, pushSubscriptionId, deviceTokens y lastNotificationAt. La siguiente etapa
          podra crear solicitudes de mesa y enviar push al mesero sin que esta pantalla aparente que ya funciona.
        </p>
      </section>
    </div>
  );
}

export function EmployeeForm({
  employee,
  onCancel,
  onSaved
}: {
  employee: Employee | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(employee?.firstName ?? '');
  const [lastName, setLastName] = useState(employee?.lastName ?? '');
  const [photoUrl, setPhotoUrl] = useState(employee?.photoUrl ?? '');
  const [email, setEmail] = useState(employee?.email ?? '');
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [role, setRole] = useState<EmployeeRole>(employee?.role ?? 'MESERO');
  const [active, setActive] = useState(employee?.status !== 'inactive');
  const [temporaryPassword, setTemporaryPassword] = useState(employee?.temporaryPassword ?? 'Temporal2026');
  const [error, setError] = useState('');

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    if (!email.includes('@')) {
      setError('Correo no valido.');
      return;
    }
    setError('');

    const payload = {
      ...(employee ?? {}),
      firstName,
      lastName,
      photoUrl,
      email,
      phone,
      role,
      status: (active ? 'active' : 'inactive') as EmployeeStatus,
      temporaryPassword,
      invitationSent: Boolean(temporaryPassword),
      notificationsEnabled: false,
      pushSubscriptionId: '',
      deviceTokens: [],
      lastNotificationAt: null,
      lastAccessAt: employee?.lastAccessAt ?? null
    };

    if (employee) {
      await updateEmployee(employee.id, {
        ...employee,
        ...payload,
        id: employee.id,
        restaurantId: employee.restaurantId,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
      });
    } else {
      await createEmployee(payload as Omit<Employee, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>);
    }
    onSaved();
  };

  return (
    <section className="rounded-[28px] border border-white/10 bg-card p-4 shadow-2xl shadow-black/20">
      <h3 className="text-lg font-black">{employee ? 'Editar empleado' : 'Crear empleado'}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Nombre" onChange={setFirstName} value={firstName} />
        <Field label="Apellido" onChange={setLastName} value={lastName} />
        <Field label="Foto o avatar" onChange={setPhotoUrl} value={photoUrl} />
        <Field label="Correo" onChange={setEmail} value={email} />
        <Field label="Telefono" onChange={setPhone} value={phone} />
        <label className="grid gap-1 text-sm font-bold text-white/64">
          Rol
          <select className="h-12 rounded-2xl border border-white/10 bg-base px-3 text-sm text-white outline-none focus:border-accent" onChange={(event) => setRole(event.target.value as EmployeeRole)} value={role}>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="MESERO">Mesero</option>
            <option value="COCINA">Cocina</option>
          </select>
        </label>
        <Field label="Contrasena temporal o invitacion" onChange={setTemporaryPassword} value={temporaryPassword} />
        <label className="flex h-12 items-center gap-3 self-end rounded-2xl border border-white/10 bg-base px-3 text-sm font-bold text-white/72">
          <input checked={active} className="size-4 accent-accent" onChange={(event) => setActive(event.target.checked)} type="checkbox" />
          Estado activo
        </label>
      </div>
      <p className="mt-3 rounded-2xl bg-base p-3 text-sm leading-6 text-white/62">{roleDescriptions[role]}</p>
      {error ? <p className="mt-3 text-sm font-bold text-red-300">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="h-11 rounded-2xl bg-accent px-4 text-sm font-black text-white" onClick={save} type="button">
          Guardar empleado
        </button>
        <button className="h-11 rounded-2xl border border-white/10 bg-base px-4 text-sm font-black" onClick={onCancel} type="button">
          Cancelar
        </button>
      </div>
    </section>
  );
}

function Field({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-white/64">
      {label}
      <input className="h-12 rounded-2xl border border-white/10 bg-base px-3 text-sm text-white outline-none focus:border-accent" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function EmployeeCard({
  employee,
  onArchive,
  onEdit,
  onReset,
  onRole,
  onStatus
}: {
  employee: Employee;
  onArchive: () => void;
  onEdit: () => void;
  onReset: () => void;
  onRole: (role: EmployeeRole) => void;
  onStatus: (status: EmployeeStatus) => void;
}) {
  return (
    <article className="grid gap-3 rounded-[28px] border border-white/10 bg-card p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex min-w-0 gap-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-accent/12 text-accent">
          {employee.photoUrl ? <img alt="" className="size-full object-cover" src={employee.photoUrl} /> : <UserRound className="size-7" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black">{employee.firstName} {employee.lastName}</h3>
            <EmployeeRoleBadge role={employee.role} />
            <EmployeeStatusToggle status={employee.status} />
          </div>
          <p className="mt-1 text-sm text-white/62">{employee.email} · {employee.phone}</p>
          <p className="mt-1 text-xs text-white/44">
            Creado {new Date(employee.createdAt).toLocaleDateString('es-CO')} · Ultimo acceso {employee.lastAccessAt ? new Date(employee.lastAccessAt).toLocaleString('es-CO') : 'No disponible'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:w-[560px]">
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-base px-3 text-xs font-black" onClick={onEdit} type="button">
          <Pencil className="size-4" />
          Editar
        </button>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-base px-3 text-xs font-black" onClick={() => onStatus(employee.status === 'active' ? 'inactive' : 'active')} type="button">
          <ShieldCheck className="size-4" />
          {employee.status === 'active' ? 'Desactivar' : 'Activar'}
        </button>
        <select className="h-11 rounded-2xl border border-white/10 bg-base px-2 text-xs font-black text-white" onChange={(event) => onRole(event.target.value as EmployeeRole)} value={employee.role}>
          <option value="ADMINISTRADOR">Admin</option>
          <option value="MESERO">Mesero</option>
          <option value="COCINA">Cocina</option>
        </select>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-base px-3 text-xs font-black" onClick={onReset} type="button">
          <KeyRound className="size-4" />
          Acceso
        </button>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-3 text-xs font-black text-red-100" onClick={onArchive} type="button">
          <Archive className="size-4" />
          Archivar
        </button>
      </div>
    </article>
  );
}

export function EmployeeRoleBadge({ role }: { role: EmployeeRole }) {
  const map: Record<EmployeeRole, string> = {
    ADMINISTRADOR: 'bg-accent/15 text-accent',
    MESERO: 'bg-sky-500/15 text-sky-200',
    COCINA: 'bg-emerald-500/15 text-emerald-200'
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${map[role]}`}>{role}</span>;
}

export function EmployeeStatusToggle({ status }: { status: EmployeeStatus }) {
  const active = status === 'active';
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/10 text-white/58'}`}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}
