import { ArrowDownToLine, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { DashboardData } from '../../domain/entities/dashboard';
import { getErrorMessage, httpClient } from '../../infrastructure/api/http-client';
import { LoadingState } from '../components/Feedback';
import { useAuth } from '../hooks/AuthProvider';

const reports = [
  ['properties', 'Propiedades'],
  ['inquiries', 'Consultas'],
  ['visits', 'Visitas'],
  ['opportunities', 'Oportunidades'],
  ['operations', 'Operaciones'],
  ['commissions', 'Comisiones'],
  ['agents', 'Actividad de agentes'],
] as const;

function formatKey(key: string) {
  return key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    if ('_all' in object) return String(object._all);
    if ('fullName' in object) return String(object.fullName);
    if ('title' in object) return String(object.title);
    if ('code' in object) return String(object.code);
    return Object.entries(object).map(([key, inner]) => `${formatKey(key)}: ${formatValue(inner)}`).join(' · ');
  }
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString('es-BO', { dateStyle: 'medium' });
  }
  return String(value);
}

export function ReportsPage() {
  const { user } = useAuth();
  const [kind, setKind] = useState<(typeof reports)[number][0]>('properties');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function load(event?: FormEvent) {
    event?.preventDefault();
    if (from && to && from > to) {
      setError('La fecha inicial debe ser anterior a la fecha final.');
      return;
    }
    setLoading(true); setError('');
    try {
      const { data } = await httpClient.get<Array<Record<string, unknown>>>(`/reports/${kind}`, { params: { ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}), ...(to ? { to: new Date(`${to}T23:59:59`).toISOString() } : {}) } });
      setRows(Array.isArray(data) ? data : []);
      setLoaded(true);
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setLoading(false); }
  }

  async function download() {
    if (from && to && from > to) {
      setError('La fecha inicial debe ser anterior a la fecha final.');
      return;
    }
    setDownloading(true); setError('');
    try {
      const { data } = await httpClient.get(`/reports/${kind}/export.csv`, {
        params: { ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}), ...(to ? { to: new Date(`${to}T23:59:59`).toISOString() } : {}) },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `inmo360-${kind}-report.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setDownloading(false); }
  }

  const columns = rows.length ? Object.keys(rows[0]) : [];
  return (
    <>
      <div className="mb-7"><p className="eyebrow">INFORMACIÓN PARA DECIDIR</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink">Reportes y actividad</h1><p className="mt-2 text-sm text-slate-500">Los datos respetan tu rol y cartera, según los permisos del backend.</p></div>
      <form className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto]" onSubmit={(event) => void load(event)}>
        <label className="filter-label">Reporte<select className="filter-input" value={kind} onChange={(event) => { setKind(event.target.value as typeof kind); setLoaded(false); }} >{reports.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="filter-label">Desde<input className="filter-input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="filter-label">Hasta<input className="filter-input" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <button className="button-primary self-end" disabled={loading}>{loading ? <RefreshCw size={15} className="animate-spin" /> : <RefreshCw size={15} />}Consultar</button>
        <button type="button" className="button-secondary self-end" disabled={!loaded || downloading} onClick={() => void download()}><ArrowDownToLine size={15} />{downloading ? 'Descargando…' : 'Exportar CSV'}</button>
      </form>
      {from && to && from > to && <p role="alert" className="mb-4 text-sm text-rose-600">La fecha inicial debe ser anterior a la fecha final.</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {loading ? <LoadingState label="Consultando reporte en el servidor…" /> : loaded ? rows.length ? <div className="panel overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-bold text-ink">{reports.find(([value]) => value === kind)?.[1]}</p><p className="mt-1 text-[10px] text-slate-400">{rows.length} registros devueltos por la API</p></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-[#f8fafc] text-[9px] font-bold uppercase tracking-[.12em] text-slate-400"><tr>{columns.map((key) => <th className="px-4 py-3" key={key}>{formatKey(key)}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.slice(0, 100).map((row, index) => <tr key={String(row.id ?? index)}>{columns.map((key) => <td className="max-w-[260px] px-4 py-3 text-slate-600" key={key}><span className="line-clamp-2">{formatValue(row[key])}</span></td>)}</tr>)}</tbody></table></div>{rows.length > 100 && <p className="px-5 py-3 text-xs text-slate-400">Se muestran 100 filas en pantalla; el CSV incluye los resultados del endpoint.</p>}</div> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">La consulta se completó correctamente y no hay registros para esos filtros.</div> : <div className="panel flex min-h-56 flex-col items-center justify-center text-center"><RefreshCw className="text-slate-300" size={25} /><p className="mt-3 text-sm font-semibold text-ink">Elige un reporte y consulta sus datos</p><p className="mt-1 text-xs text-slate-400">Los filtros de fecha se aplican en PostgreSQL.</p></div>}
      <DashboardSummary />
      {user?.role === 'AGENTE' && <p className="mt-4 text-[10px] text-slate-400">La API aplica el alcance del agente automáticamente; el cliente no solicita identificadores de otros agentes.</p>}
    </>
  );
}

function DashboardSummary() {
  const { data, loading } = useSummary();
  if (loading || !data) return null;
  const statuses = data.propertiesByStatusAndModality;
  return <section className="mt-6 grid gap-4 sm:grid-cols-3">
    <div className="metric-card"><p className="text-xs text-slate-500">Propiedades registradas</p><p className="mt-2 text-2xl font-extrabold text-ink">{statuses.reduce((total, item) => total + item._count._all, 0)}</p><p className="mt-1 text-[10px] text-slate-400">Resumen de la API</p></div>
    <div className="metric-card"><p className="text-xs text-slate-500">Consultas recibidas</p><p className="mt-2 text-2xl font-extrabold text-ink">{data.inquiries}</p><p className="mt-1 text-[10px] text-slate-400">Resumen de la API</p></div>
    <div className="metric-card"><p className="text-xs text-slate-500">Monto de operaciones</p><p className="mt-2 text-2xl font-extrabold text-ink">Bs {Number(data.operations._sum.amount ?? 0).toLocaleString('es-BO')}</p><p className="mt-1 text-[10px] text-slate-400">Resumen de la API</p></div>
  </section>;
}

function useSummary() {
  const [state, setState] = useState<{ data: DashboardData | null; loading: boolean }>({ data: null, loading: true });
  useEffect(() => {
    httpClient.get<DashboardData>('/reports/summary').then(({ data }) => setState({ data, loading: false })).catch(() => setState({ data: null, loading: false }));
  }, []);
  return state;
}
