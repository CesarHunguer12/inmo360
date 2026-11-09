import { Plus, Search, UserRoundCog } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { getErrorMessage, httpClient } from '../../infrastructure/api/http-client';
import type { User, UserRole } from '../../domain/entities/user';
import { roleLabel } from '../../domain/entities/user';
import { ErrorState, LoadingState, EmptyState } from '../components/Feedback';
import { useRemoteData } from '../hooks/useRemoteData';

const roles: UserRole[] = ['ADMINISTRADOR', 'AGENTE', 'CLIENTE'];
const loadUsers = async () => (await httpClient.get<User[]>('/users')).data;

export function UsersManagementPage() {
  const { data, loading, error, refresh } = useRemoteData(loadUsers);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const filtered = useMemo(() => (data ?? []).filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(search.toLowerCase())), [data, search]);

  async function changeRole(userId: string, role: UserRole) {
    setBusyId(userId); setMessage('');
    try { await httpClient.patch(`/users/${userId}/role`, { role }); await refresh(); setMessage('El rol se actualizó correctamente.'); }
    catch (reason) { setMessage(getErrorMessage(reason)); }
    finally { setBusyId(''); }
  }
  async function changeStatus(user: User) {
    setBusyId(user.id); setMessage('');
    try { await httpClient.patch(`/users/${user.id}/status`, { isActive: !user.isActive }); await refresh(); setMessage('El estado de la cuenta se actualizó.'); }
    catch (reason) { setMessage(getErrorMessage(reason)); }
    finally { setBusyId(''); }
  }

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">CONTROL DE ACCESO</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink">Usuarios y roles</h1><p className="mt-2 text-sm text-slate-500">Gestiona las cuentas y sus permisos. El servidor valida cada operación.</p></div><button className="button-primary" onClick={() => setCreating(true)}><Plus size={16} />Crear usuario</button></div>
      {message && <p role="status" className={`mb-4 rounded-xl p-3 text-sm ${message.includes('actualizó') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message}</p>}
      <label className="relative mb-4 block max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="filter-input !pl-9" placeholder="Buscar usuario…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => void refresh()} /> : filtered.length ? <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left text-xs"><thead className="bg-[#f8fafc] text-[9px] font-bold uppercase tracking-[.12em] text-slate-400"><tr>{['Usuario', 'Rol', 'Estado', 'Registro', 'Acciones'].map((column) => <th className="px-5 py-4" key={column}>{column}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((user) => <tr key={user.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-bold text-ink">{user.fullName}</p><p className="mt-1 text-[10px] text-slate-400">{user.email}</p></td><td className="px-5 py-4"><select disabled={busyId === user.id} className="filter-input !min-h-8 !w-40 !py-1" value={user.role} onChange={(event) => void changeRole(user.id, event.target.value as UserRole)}>{roles.map((role) => <option value={role} key={role}>{roleLabel[role]}</option>)}</select></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{user.isActive ? 'Activa' : 'Inactiva'}</span></td><td className="px-5 py-4 text-slate-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-BO') : '—'}</td><td className="px-5 py-4"><button disabled={busyId === user.id} className="button-secondary !px-3 !py-2 !text-[10px] disabled:opacity-50" onClick={() => void changeStatus(user)}>{busyId === user.id ? 'Actualizando…' : user.isActive ? 'Desactivar' : 'Activar'}</button></td></tr>)}</tbody></table></div></div> : <EmptyState title="No se encontraron usuarios">Ajusta el texto de búsqueda.</EmptyState>}
      {creating && <CreateUserDialog close={() => setCreating(false)} created={() => { setCreating(false); void refresh(); setMessage('La cuenta se creó correctamente.'); }} failed={(reason) => setMessage(reason)} />}
    </>
  );
}

function CreateUserDialog({ close, created, failed }: { close: () => void; created: () => void; failed: (message: string) => void }) {
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState<UserRole>('AGENTE');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await httpClient.post('/users', {
        email: String(form.get('email')).trim(),
        fullName: String(form.get('fullName')).trim(),
        phone: String(form.get('phone')).trim() || undefined,
        password: String(form.get('password')),
        role,
      });
      created();
    } catch (reason) { failed(getErrorMessage(reason)); setPending(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1830]/50 p-4" onClick={close}><form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="mb-5 flex items-center gap-3"><span className="metric-icon metric-blue"><UserRoundCog size={18} /></span><div><p className="eyebrow">NUEVA CUENTA</p><h2 className="mt-1 text-xl font-bold text-ink">Crear usuario</h2></div></div><div className="space-y-4"><label className="form-label">Nombre completo<input name="fullName" className="form-input" required minLength={2} maxLength={120} /></label><label className="form-label">Correo electrónico<input name="email" type="email" className="form-input" required maxLength={254} /></label><label className="form-label">Teléfono <span className="font-normal text-slate-400">(opcional)</span><input name="phone" className="form-input" maxLength={30} /></label><label className="form-label">Contraseña inicial<input name="password" type="password" className="form-input" required minLength={12} maxLength={72} autoComplete="new-password" /></label><label className="form-label">Rol<select className="form-input" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>{roles.map((item) => <option key={item} value={item}>{roleLabel[item]}</option>)}</select></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" className="button-secondary" onClick={close}>Cancelar</button><button disabled={pending} className="button-primary disabled:opacity-60">{pending ? 'Creando…' : 'Crear cuenta'}</button></div></form></div>;
}
