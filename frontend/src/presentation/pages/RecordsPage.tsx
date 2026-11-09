import { ArrowUpRight, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { roleLabel } from '../../domain/entities/user';
import type { UserRole } from '../../domain/entities/user';
import type { Owner } from '../../domain/repositories/real-estate.repository';
import { getErrorMessage, httpClient } from '../../infrastructure/api/http-client';
import { ApiRealEstateRepository } from '../../infrastructure/repositories/api-real-estate.repository';
import { ErrorState, LoadingState, EmptyState } from '../components/Feedback';
import { useAuth } from '../hooks/AuthProvider';
import { useRemoteData } from '../hooks/useRemoteData';

const api = new ApiRealEstateRepository();

const modules: Record<string, { title: string; subtitle: string; endpoint: string; roles: UserRole[] }> = {
  users: { title: 'Usuarios y roles', subtitle: 'Cuentas con acceso a INMO360.', endpoint: '/users', roles: ['ADMINISTRADOR'] },
  agents: { title: 'Agentes', subtitle: 'Equipo inmobiliario y actividad asignada.', endpoint: '/users', roles: ['ADMINISTRADOR'] },
  clients: { title: 'Clientes', subtitle: 'Clientes vinculados a tu cartera.', endpoint: '/clients', roles: ['ADMINISTRADOR', 'AGENTE'] },
  inquiries: { title: 'Consultas recibidas', subtitle: 'Solicitudes de información de propiedades.', endpoint: '/inquiries/agent', roles: ['ADMINISTRADOR', 'AGENTE'] },
  visits: { title: 'Visitas', subtitle: 'Agenda y estado de las visitas.', endpoint: '/visits/agent', roles: ['ADMINISTRADOR', 'AGENTE'] },
  opportunities: { title: 'Oportunidades', subtitle: 'Etapas del flujo comercial.', endpoint: '/opportunities', roles: ['ADMINISTRADOR', 'AGENTE'] },
  operations: { title: 'Operaciones', subtitle: 'Operaciones registradas en tu alcance.', endpoint: '/operations', roles: ['ADMINISTRADOR', 'AGENTE'] },
  commissions: { title: 'Comisiones', subtitle: 'Comisiones según configuración administrativa.', endpoint: '/commissions', roles: ['ADMINISTRADOR', 'AGENTE'] },
};

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.fullName ?? record.title ?? record.code ?? record.id ?? '—');
  }
  return String(value);
}

function columnsFor(module: string, rows: Array<Record<string, unknown>>) {
  const preferred: Record<string, string[]> = {
    users: ['fullName', 'email', 'role', 'isActive', 'createdAt'],
    agents: ['fullName', 'email', 'phone', 'isActive', 'createdAt'],
    clients: ['fullName', 'email', 'phone', 'isActive', 'createdAt'],
    inquiries: ['createdAt', 'client', 'property', 'status', 'message'],
    visits: ['scheduledAt', 'client', 'property', 'status', 'agent'],
    opportunities: ['client', 'property', 'stage', 'lastContactAt', 'agent'],
    operations: ['operatedAt', 'property', 'client', 'amount', 'status'],
    commissions: ['createdAt', 'operation', 'agent', 'amount', 'ratePercent', 'status'],
  };
  const keys = preferred[module] ?? Object.keys(rows[0] ?? {});
  return keys.filter((key) => rows.length === 0 || key in rows[0]);
}

function DataTable({ module, rows }: { module: string; rows: Array<Record<string, unknown>> }) {
  const columns = columnsFor(module, rows);
  if (!rows.length) return <EmptyState title="Aún no hay registros para mostrar">Los datos aparecerán aquí cuando se registren en INMO360.</EmptyState>;
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-xs">
          <thead className="bg-[#f8fafc] text-[9px] font-bold uppercase tracking-[.12em] text-slate-400"><tr>{columns.map((key) => <th className="px-5 py-4" key={key}>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={String(row.id ?? index)} className="transition hover:bg-slate-50/80">{columns.map((key) => <td className="max-w-[240px] px-5 py-4 text-slate-600" key={key}>{key === 'role' ? roleLabel[display(row[key]) as UserRole] ?? display(row[key]) : key === 'isActive' ? <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row[key] ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row[key] ? 'Activa' : 'Inactiva'}</span> : key.toLowerCase().includes('date') || key === 'scheduledAt' || key === 'operatedAt' ? display(row[key]) !== '—' ? new Date(String(row[key])).toLocaleDateString('es-BO', { dateStyle: 'medium' }) : '—' : <span className={key === 'message' ? 'line-clamp-2' : 'line-clamp-1'}>{display(row[key])}</span>}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

export function RecordsPage({ module }: { module: string }) {
  const { user } = useAuth();
  const config = modules[module];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState('');
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [viewingOwner, setViewingOwner] = useState<Owner | null>(null);
  const loader = async () => {
    if (module === 'owners') return await api.owners() as unknown as Array<Record<string, unknown>>;
    if (module === 'agents') return (await api.users()).filter((item) => item.role === 'AGENTE') as unknown as Array<Record<string, unknown>>;
    if (!config) return [];
    const { data } = await httpClient.get<Array<Record<string, unknown>>>(config.endpoint);
    return data;
  };
  const { data, loading, error, refresh, setData } = useRemoteData(loader, [module, config?.endpoint]);
  const filtered = useMemo(() => (data ?? []).filter((row) => JSON.stringify(row).toLocaleLowerCase().includes(search.toLocaleLowerCase())), [data, search]);
  const paged = filtered.slice(page * 10, page * 10 + 10);
  if (user && config && !config.roles.includes(user.role)) return <ErrorState message="Tu rol no tiene acceso a esta sección." />;

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">GESTIÓN INMOBILIARIA</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink">{module === 'owners' ? 'Propietarios' : config?.title ?? 'Sección'}</h1><p className="mt-2 text-sm text-slate-500">{module === 'owners' ? 'Contactos propietarios de inmuebles.' : config?.subtitle}</p></div>
        {module === 'owners' && <button className="button-primary" onClick={() => setOwnerOpen(true)}><Plus size={16} />Nuevo propietario</button>}
      </div>
      {actionError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="filter-input !pl-9" placeholder="Buscar en estos registros…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></label>
        {module === 'owners' && <Link to="/app/properties" className="text-xs font-semibold text-electric">Ver propiedades <ArrowUpRight size={14} className="inline" /></Link>}
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => void refresh()} /> : module === 'owners' ? <OwnerTable rows={paged as unknown as Owner[]} edit={setEditingOwner} view={setViewingOwner} /> : <DataTable module={module} rows={paged} />}
      {!loading && !error && filtered.length > 10 && <div className="mt-4 flex items-center justify-end gap-3 text-xs text-slate-500"><span>{page * 10 + 1}–{Math.min((page + 1) * 10, filtered.length)} de {filtered.length}</span><button className="button-secondary !px-3 !py-2" disabled={!page} onClick={() => setPage(page - 1)}>Anterior</button><button className="button-secondary !px-3 !py-2" disabled={(page + 1) * 10 >= filtered.length} onClick={() => setPage(page + 1)}>Siguiente</button></div>}
      {ownerOpen && <OwnerDialog close={() => setOwnerOpen(false)} saved={(owner) => { setData([owner as unknown as Record<string, unknown>, ...(data ?? [])]); setOwnerOpen(false); }} error={(message) => setActionError(message)} />}
      {editingOwner && <OwnerDialog owner={editingOwner} close={() => setEditingOwner(null)} saved={(owner) => { setData((data ?? []).map((item) => item.id === owner.id ? owner as unknown as Record<string, unknown> : item)); setEditingOwner(null); }} error={(message) => setActionError(message)} />}
      {viewingOwner && <OwnerDetails owner={viewingOwner} close={() => setViewingOwner(null)} />}
    </>
  );
}

function OwnerTable({ rows, edit, view }: { rows: Owner[]; edit(owner: Owner): void; view(owner: Owner): void }) {
  if (!rows.length) return <EmptyState title="Todavía no hay propietarios registrados">Agrega propietarios para asociarlos a las propiedades que gestiona tu equipo.</EmptyState>;
  return <div className="panel overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-[#f8fafc] text-[9px] font-bold uppercase tracking-[.12em] text-slate-400"><tr>{['Nombre', 'Correo', 'Teléfono', 'Propiedades', 'Acciones'].map((item) => <th key={item} className="px-5 py-4">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((owner) => <tr key={owner.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-semibold text-ink">{owner.fullName}</td><td className="px-5 py-4 text-slate-500">{owner.email || '—'}</td><td className="px-5 py-4 text-slate-500">{owner.phone}</td><td className="px-5 py-4 text-slate-500">{owner._count?.properties ?? owner.properties?.length ?? 0}</td><td className="px-5 py-4"><div className="flex gap-2"><button className="button-secondary !px-3 !py-2 !text-[10px]" onClick={() => view(owner)}>Ver</button><button className="button-secondary !px-3 !py-2 !text-[10px]" onClick={() => edit(owner)}>Editar</button></div></td></tr>)}</tbody></table></div>;
}

function OwnerDetails({ owner, close }: { owner: Owner; close: () => void }) {
  const { data, loading, error, refresh } = useRemoteData(() => api.getOwner(owner.id), [owner.id]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1830]/50 p-4" onClick={close}><section className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="eyebrow">DETALLE DEL PROPIETARIO</p><h2 className="mt-1 text-xl font-bold text-ink">{owner.fullName}</h2></div><button className="icon-button" onClick={close}>×</button></div>{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => void refresh()} /> : <><div className="mt-5 grid gap-3 rounded-xl bg-[#f7f9fc] p-4 text-xs sm:grid-cols-2"><p><span className="text-slate-400">Correo</span><br /><span className="mt-1 inline-block font-semibold text-ink">{data?.email || '—'}</span></p><p><span className="text-slate-400">Teléfono</span><br /><span className="mt-1 inline-block font-semibold text-ink">{data?.phone || '—'}</span></p></div><h3 className="mb-3 mt-6 text-sm font-bold text-ink">Propiedades relacionadas</h3>{data?.properties?.length ? <div className="space-y-2">{data.properties.map((property) => <div key={property.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="text-xs font-semibold text-ink">{property.title}</p><p className="mt-1 text-[10px] text-slate-400">{property.code} · {property.zone}</p></div><span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700">{property.status}</span></div>)}</div> : <p className="rounded-xl border border-slate-100 p-4 text-xs text-slate-500">Este propietario aún no tiene propiedades relacionadas.</p>}</>}</section></div>;
}

function OwnerDialog({ owner, close, saved, error }: { owner?: Owner; close: () => void; saved: (owner: Owner) => void; error: (message: string) => void }) {
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      fullName: String(form.get('fullName')).trim(),
      email: String(form.get('email')).trim() || undefined,
      phone: String(form.get('phone')).trim(),
      notes: owner ? String(form.get('notes')).trim() || null : String(form.get('notes')).trim() || undefined,
    };
    setPending(true);
    try { saved(owner ? await api.updateOwner(owner.id, input) : await api.createOwner(input)); }
    catch (reason) { error(getErrorMessage(reason)); setPending(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1830]/50 p-4" onClick={close}><form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="mb-5 flex items-start justify-between"><div><p className="eyebrow">{owner ? 'ACTUALIZAR REGISTRO' : 'NUEVO REGISTRO'}</p><h2 className="mt-1 text-xl font-bold text-ink">Propietario</h2></div><button type="button" className="icon-button" onClick={close}>×</button></div><div className="space-y-4"><label className="form-label">Nombre completo<input name="fullName" className="form-input" required minLength={2} maxLength={120} defaultValue={owner?.fullName} /></label><label className="form-label">Teléfono<input name="phone" className="form-input" required maxLength={30} defaultValue={owner?.phone} /></label><label className="form-label">Correo electrónico <span className="font-normal text-slate-400">(opcional)</span><input name="email" type="email" className="form-input" maxLength={254} defaultValue={owner?.email ?? ''} /></label><label className="form-label">Notas<textarea name="notes" className="form-input min-h-20" maxLength={2000} defaultValue={owner?.notes ?? ''} /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" className="button-secondary" onClick={close}>Cancelar</button><button disabled={pending} className="button-primary disabled:opacity-60">{pending ? 'Guardando…' : owner ? 'Guardar cambios' : 'Guardar propietario'}</button></div></form></div>;
}
