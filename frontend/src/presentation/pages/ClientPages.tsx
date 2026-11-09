import { ArrowRight, Heart, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ClientPreference, Favorite } from '../../domain/repositories/real-estate.repository';
import { getErrorMessage } from '../../infrastructure/api/http-client';
import { ApiRealEstateRepository } from '../../infrastructure/repositories/api-real-estate.repository';
import { propertyTypeLabel, modalityLabel } from '../../domain/entities/property';
import type { PropertyModality, PropertyType } from '../../domain/entities/property';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PropertyCard } from '../components/PropertyCard';
import { useRemoteData } from '../hooks/useRemoteData';
import { useAuth } from '../hooks/AuthProvider';

const api = new ApiRealEstateRepository();
const emptyPreferences: ClientPreference = { zones: [], modalities: [], types: [], features: [] };

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <><div className="mb-7"><p className="eyebrow">TU CUENTA INMO360</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink">Mi perfil</h1><p className="mt-2 text-sm text-slate-500">Información de tu cuenta confirmada por el backend.</p></div><section className="panel max-w-2xl p-6"><div className="grid gap-5 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Nombre completo</p><p className="mt-2 text-sm font-semibold text-ink">{user.fullName}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Correo</p><p className="mt-2 text-sm font-semibold text-ink">{user.email}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Rol</p><p className="mt-2 text-sm font-semibold text-ink">Cliente</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Teléfono</p><p className="mt-2 text-sm font-semibold text-ink">{user.phone || 'No registrado'}</p></div></div><p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Para proteger la seguridad de tu cuenta, este portal muestra la información de sesión; la API actual no ofrece una operación para editar perfil.</p></section></>;
}

export function RecommendationsPage() {
  const { data, loading, error, refresh } = useRemoteData(() => api.recommendations());
  const { user } = useAuth();
  return <><div className="mb-7"><p className="eyebrow">COMPATIBILIDAD PERSONALIZADA</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink">Recomendaciones para ti</h1><p className="mt-2 text-sm text-slate-500">Puntuaciones y explicaciones calculadas por el motor del backend a partir de tus preferencias.</p></div>{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => void refresh()} /> : data?.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.map((property) => <div key={property.id}><PropertyCard property={property} score={property.score} /><div className="mt-3 grid grid-cols-2 gap-3 text-[10px]"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="font-bold text-emerald-700">Coincide</p><p className="mt-1 leading-5 text-emerald-800">{property.matchedCriteria.length ? property.matchedCriteria.join(' · ') : 'Sin coincidencias registradas'}</p></div><div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><p className="font-bold text-amber-700">No coincide</p><p className="mt-1 leading-5 text-amber-800">{property.unmatchedCriteria.length ? property.unmatchedCriteria.join(' · ') : 'Sin diferencias registradas'}</p></div></div></div>)}</div> : <EmptyState title="No hay propiedades recomendadas"><Link to="/app/preferences" className="font-semibold text-electric">Revisa tus preferencias</Link></EmptyState>}{user && <p className="mt-6 text-xs text-slate-400">El porcentaje es una referencia de compatibilidad; no garantiza una decisión inmobiliaria.</p>}</>;
}

export function PreferencesPage() {
  const [values, setValues] = useState<ClientPreference>(emptyPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    api.preferences().then((preference) => {
      if (preference) setValues(preference);
    }).catch((reason) => setError(getErrorMessage(reason))).finally(() => setLoading(false));
  }, []);

  function toggle<T extends string>(list: T[], value: T, key: 'modalities' | 'types' | 'zones' | 'features') {
    setValues((current) => ({ ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try { setValues(await api.savePreferences(values)); setSuccess('Tus preferencias se guardaron correctamente.'); }
    catch (reason) { setError(getErrorMessage(reason)); }
    finally { setSaving(false); }
  }
  if (loading) return <LoadingState label="Cargando tus preferencias…" />;
  const modalities: PropertyModality[] = ['VENTA', 'ALQUILER', 'ANTICRETICO'];
  const types = Object.keys(propertyTypeLabel) as PropertyType[];
  return <><div className="mb-7"><p className="eyebrow">TU PERFIL DE BÚSQUEDA</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink">Mis preferencias</h1><p className="mt-2 text-sm text-slate-500">Ayuda a nuestro motor de recomendación a encontrar propiedades adecuadas para ti.</p></div>{error && <div role="alert" className="mb-4"><ErrorState message={error} /></div>}{success && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}<form className="panel p-5 sm:p-7" onSubmit={(event) => void submit(event)}><div className="grid gap-5 sm:grid-cols-2"><label className="form-label">Presupuesto mínimo (Bs)<input className="form-input" type="number" min="0" step="100" value={values.minBudget ?? ''} onChange={(event) => setValues({ ...values, minBudget: event.target.value === '' ? null : Number(event.target.value) })} /></label><label className="form-label">Presupuesto máximo (Bs)<input className="form-input" type="number" min="0" step="100" value={values.maxBudget ?? ''} onChange={(event) => setValues({ ...values, maxBudget: event.target.value === '' ? null : Number(event.target.value) })} /></label><label className="form-label">Dormitorios mínimos<input className="form-input" type="number" min="0" max="100" value={values.minBedrooms ?? ''} onChange={(event) => setValues({ ...values, minBedrooms: event.target.value === '' ? null : Number(event.target.value) })} /></label><label className="form-label">Baños mínimos<input className="form-input" type="number" min="0" max="100" value={values.minBathrooms ?? ''} onChange={(event) => setValues({ ...values, minBathrooms: event.target.value === '' ? null : Number(event.target.value) })} /></label><label className="form-label">Superficie mínima (m²)<input className="form-input" type="number" min="0" step="1" value={values.minAreaM2 ?? ''} onChange={(event) => setValues({ ...values, minAreaM2: event.target.value === '' ? null : Number(event.target.value) })} /></label><label className="form-label">Garaje<select className="form-input" value={values.requiresGarage === null || values.requiresGarage === undefined ? '' : String(values.requiresGarage)} onChange={(event) => setValues({ ...values, requiresGarage: event.target.value === '' ? null : event.target.value === 'true' })}><option value="">Indiferente</option><option value="true">Requiere garaje</option><option value="false">Prefiere sin garaje</option></select></label></div><ChoiceGroup title="Modalidad" values={modalities} labels={modalityLabel} selected={values.modalities as PropertyModality[]} onToggle={(value) => toggle(values.modalities as PropertyModality[], value, 'modalities')} /><ChoiceGroup title="Tipo de propiedad" values={types} labels={propertyTypeLabel} selected={values.types as PropertyType[]} onToggle={(value) => toggle(values.types as PropertyType[], value, 'types')} /><label className="form-label mt-6">Zonas de interés <span className="font-normal text-slate-400">(separadas por coma)</span><input className="form-input" value={values.zones.join(', ')} onChange={(event) => setValues({ ...values, zones: event.target.value.split(',').map((zone) => zone.trim()).filter(Boolean) })} placeholder="Sopocachi, Calacoto, Centro" /></label><label className="form-label mt-5">Características deseadas<input className="form-input" value={values.features.join(', ')} onChange={(event) => setValues({ ...values, features: event.target.value.split(',').map((feature) => feature.trim()).filter(Boolean) })} placeholder="Balcón, ascensor, calefacción" /></label><button disabled={saving} className="button-primary mt-7 disabled:opacity-60"><Save size={16} />{saving ? 'Guardando…' : 'Guardar preferencias'}</button></form></>;
}

function ChoiceGroup<T extends string>({ title, values, labels, selected, onToggle }: { title: string; values: T[]; labels: Record<T, string>; selected: T[]; onToggle(value: T): void }) {
  return <fieldset className="mt-6"><legend className="mb-3 text-xs font-bold text-slate-700">{title}</legend><div className="flex flex-wrap gap-2">{values.map((value) => <button key={value} type="button" onClick={() => onToggle(value)} className={`filter-pill ${selected.includes(value) ? 'filter-pill-active' : ''}`}>{labels[value]}</button>)}</div></fieldset>;
}

export function FavoritesPage() {
  const { data, loading, error, refresh, setData } = useRemoteData(() => api.favorites());
  const [message, setMessage] = useState('');
  async function remove(favorite: Favorite) {
    try { await api.removeFavorite(favorite.id); setData((data ?? []).filter((item) => item.id !== favorite.id)); }
    catch (reason) { setMessage(getErrorMessage(reason)); }
  }
  return <><div className="mb-7"><p className="eyebrow">TUS ESPACIOS GUARDADOS</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink">Mis favoritos</h1></div>{message && <p role="alert" className="mb-4 text-sm text-rose-700">{message}</p>}{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => void refresh()} /> : data?.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.map((favorite: Favorite) => <div key={favorite.id}><PropertyCard property={favorite.property} /><button className="mt-3 flex items-center gap-2 text-xs font-semibold text-rose-600" onClick={() => void remove(favorite)}><Heart size={15} />Quitar de favoritos</button></div>)}</div> : <EmptyState title="Todavía no guardaste propiedades"><Link to="/app/catalog" className="font-semibold text-electric">Explorar el catálogo <ArrowRight size={14} className="inline" /></Link></EmptyState>}</>;
}

export function ClientVisitsPage() {
  const { data, loading, error, refresh } = useRemoteData(() => api.visits());
  const rows = data ?? [];
  return <><div className="mb-7"><p className="eyebrow">TU AGENDA</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink">Mis visitas</h1></div>{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => void refresh()} /> : rows.length ? <div className="space-y-3">{rows.map((row, index) => <div key={String(row.id ?? index)} className="panel flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-bold text-ink">{String((row.property as Record<string, unknown> | undefined)?.title ?? 'Visita de propiedad')}</p><p className="mt-1 text-xs text-slate-500">{row.scheduledAt ? new Date(String(row.scheduledAt)).toLocaleString('es-BO') : 'Fecha no disponible'}</p></div><span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold text-sky-700">{String(row.status ?? '—')}</span></div>)}</div> : <EmptyState title="No tienes visitas solicitadas"><p>Encuentra una propiedad y solicita una visita desde su ficha.</p><Link to="/app/catalog" className="mt-2 font-semibold text-electric">Explorar propiedades</Link></EmptyState>}</>;
}
