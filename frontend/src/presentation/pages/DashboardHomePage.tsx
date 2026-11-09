import { ArrowDownRight, ArrowUpRight, Building2, CalendarDays, CircleDollarSign, ClipboardList, MessageSquareText, Sparkles, Users, WalletCards } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '../../domain/entities/dashboard';
import type { User } from '../../domain/entities/user';
import { roleLabel } from '../../domain/entities/user';
import { ApiRealEstateRepository } from '../../infrastructure/repositories/api-real-estate.repository';
import { ErrorState, LoadingState } from '../components/Feedback';
import { useRemoteData } from '../hooks/useRemoteData';

const api = new ApiRealEstateRepository();
const money = (value: string | number | null | undefined) => `Bs ${new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(Number(value ?? 0))}`;

function sum(groups: Array<{ _count: { _all: number } }> = []) {
  return groups.reduce((total, group) => total + group._count._all, 0);
}

function DashboardContents({ user, data, peopleCount }: { user: User; data: DashboardData; peopleCount: number | null }) {
  const stats = useMemo(() => {
    const available = data.propertiesByStatusAndModality.filter((item) => item.status === 'DISPONIBLE').reduce((total, item) => total + item._count._all, 0);
    const unavailable = data.propertiesByStatusAndModality.filter((item) => item.status !== 'DISPONIBLE').reduce((total, item) => total + item._count._all, 0);
    const visits = sum(data.visits);
    const nextVisits = data.visits.find((item) => item.status === 'PENDIENTE')?._count._all ?? 0;
    const opportunities = sum(data.opportunitiesByStage);
    return { available, unavailable, visits, nextVisits, opportunities };
  }, [data]);
  const admin = user.role === 'ADMINISTRADOR';
  const cards = [
    { label: 'Propiedades disponibles', value: stats.available, sub: `${stats.unavailable} en otros estados`, icon: Building2, tone: 'blue' },
    { label: 'Consultas recibidas', value: data.inquiries, sub: 'En el periodo seleccionado', icon: MessageSquareText, tone: 'violet' },
    { label: 'Visitas', value: stats.visits, sub: `${stats.nextVisits} pendientes`, icon: CalendarDays, tone: 'amber' },
    { label: 'Oportunidades activas', value: stats.opportunities, sub: 'En seguimiento comercial', icon: Sparkles, tone: 'green' },
    { label: 'Operaciones registradas', value: data.operations._count._all, sub: money(data.operations._sum.amount), icon: ClipboardList, tone: 'blue' },
    { label: 'Comisiones', value: sum(data.commissions), sub: money(data.commissions.reduce((total, item) => total + Number(item._sum?.amount ?? 0), 0)), icon: CircleDollarSign, tone: 'violet' },
    { label: admin ? 'Clientes registrados' : 'Clientes de mi cartera', value: peopleCount ?? '—', sub: admin ? 'Cuentas con rol cliente' : 'Clientes con relación asignada', icon: Users, tone: 'green' },
  ];
  const statusLabels: Record<string, string> = { DISPONIBLE: 'Disponibles', RESERVADA: 'Reservadas', NO_DISPONIBLE: 'No disponibles', INACTIVA: 'Inactivas' };
  const statuses = ['DISPONIBLE', 'RESERVADA', 'NO_DISPONIBLE', 'INACTIVA'];
  const maxCount = Math.max(1, ...statuses.map((status) => data.propertiesByStatusAndModality.filter((item) => item.status === status).reduce((total, item) => total + item._count._all, 0)));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">{roleLabel[user.role].toUpperCase()} · LA PAZ</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink sm:text-[38px]">Hola, {user.fullName.split(' ')[0]} <span className="text-electric">.</span></h1><p className="mt-2 text-sm text-slate-500">{admin ? 'Aquí tienes el pulso de la operación inmobiliaria.' : 'Revisa tu cartera y las actividades que requieren atención.'}</p></div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-500">Datos actualizados desde la API</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, sub, icon: Icon, tone }) => (
          <div className="metric-card" key={label}>
            <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-3 text-[30px] font-extrabold tracking-[-.05em] text-ink">{value}</p></div><span className={`metric-icon metric-${tone}`}><Icon size={18} /></span></div>
            <p className="mt-2 text-[10px] text-slate-400">{sub}</p>
          </div>
        ))}
        {admin && <div className="metric-card"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">Agentes activos</p><p className="mt-3 text-[30px] font-extrabold tracking-[-.05em] text-ink">{data.activityByAgent.length}</p></div><span className="metric-icon metric-green"><Users size={18} /></span></div><Link to="/app/agents" className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-electric">Ver agentes <ArrowUpRight size={12} /></Link></div>}
        {!admin && <div className="metric-card"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">Actividad por cerrar</p><p className="mt-3 text-[30px] font-extrabold tracking-[-.05em] text-ink">{stats.nextVisits}</p></div><span className="metric-icon metric-amber"><WalletCards size={18} /></span></div><Link to="/app/visits" className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-electric">Revisar agenda <ArrowUpRight size={12} /></Link></div>}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <section className="panel p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between"><div><h2 className="font-bold text-ink">Inventario inmobiliario</h2><p className="mt-1 text-xs text-slate-400">Propiedades por estado</p></div><Link to="/app/properties" className="icon-button !h-9 !w-9"><ArrowUpRight size={16} /></Link></div>
          <div className="space-y-5">
            {statuses.map((status, index) => {
              const count = data.propertiesByStatusAndModality.filter((item) => item.status === status).reduce((total, item) => total + item._count._all, 0);
              return <div key={status}><div className="mb-2 flex justify-between text-xs"><span className="font-medium text-slate-600">{statusLabels[status]}</span><span className="font-bold text-ink">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${['bg-electric', 'bg-amber-400', 'bg-slate-400', 'bg-slate-300'][index]}`} style={{ width: `${(count / maxCount) * 100}%` }} /></div></div>;
            })}
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Modalidad</p><div className="mt-3 flex flex-wrap gap-2">{['VENTA', 'ALQUILER', 'ANTICRETICO'].map((modality) => <span className="rounded-lg bg-[#f5f7fb] px-3 py-2 text-[10px] font-semibold text-slate-600" key={modality}>{modality}: {data.propertiesByStatusAndModality.filter((item) => item.modality === modality).reduce((total, item) => total + item._count._all, 0)}</span>)}</div></div>
        </section>
        <section className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="font-bold text-ink">{admin ? 'Actividad por agente' : 'Mi actividad'}</h2><p className="mt-1 text-xs text-slate-400">Consultas, visitas y operaciones</p></div><Link to="/app/reports" className="icon-button !h-9 !w-9"><ArrowUpRight size={16} /></Link></div>
          {data.activityByAgent.length ? <div className="space-y-1">
            <div className="grid grid-cols-[1.3fr_repeat(3,.7fr)] gap-2 border-b border-slate-100 pb-3 text-[9px] font-bold uppercase tracking-[.1em] text-slate-400"><span>Agente</span><span>Consultas</span><span>Visitas</span><span>Operaciones</span></div>
            {data.activityByAgent.slice(0, 6).map((agent) => <div key={agent.agentId} className="grid grid-cols-[1.3fr_repeat(3,.7fr)] items-center gap-2 border-b border-slate-50 py-3 text-[11px]"><span className="truncate font-semibold text-ink">{agent.agentName}</span><span className="text-slate-500">{agent.inquiries}</span><span className="text-slate-500">{agent.visits}</span><span className="font-semibold text-ink">{agent.operations}</span></div>)}
          </div> : <div className="flex min-h-40 flex-col items-center justify-center text-center"><Users className="text-slate-300" size={25} /><p className="mt-3 text-xs text-slate-500">Todavía no hay actividad registrada.</p></div>}
          <Link to="/app/reports" className="mt-5 flex items-center gap-1 text-[10px] font-bold text-electric">Ver estadísticas <ArrowDownRight size={13} /></Link>
        </section>
      </div>
    </>
  );
}

export function DashboardHomePage({ user }: { user: User }) {
  const { data, loading, error, refresh } = useRemoteData(() => api.dashboard(user.role), [user.role]);
  const { data: people, error: peopleError } = useRemoteData(
    () => user.role === 'ADMINISTRADOR' ? api.users() : api.clients(),
    [user.role],
  );
  if (loading) return <LoadingState label="Preparando tu panel con datos del backend…" />;
  if (error || !data) return <ErrorState message={error || 'No se pudo consultar el panel.'} retry={() => void refresh()} />;
  const peopleCount = people?.filter((person) => user.role !== 'ADMINISTRADOR' || person.role === 'CLIENTE').length ?? null;
  return <>{peopleError && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">No se pudo consultar el total de clientes: {peopleError}</p>}<DashboardContents user={user} data={data} peopleCount={peopleCount} /></>;
}
