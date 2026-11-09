import { ArrowRight, CalendarDays, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { User } from '../../domain/entities/user';
import { ApiRealEstateRepository } from '../../infrastructure/repositories/api-real-estate.repository';
import type { Favorite } from '../../domain/repositories/real-estate.repository';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PropertyCard } from '../components/PropertyCard';
import { useRemoteData } from '../hooks/useRemoteData';

const api = new ApiRealEstateRepository();

export function ClientDashboardPage({ user }: { user: User }) {
  const { data: favorites, loading: favLoading, error: favError, refresh: reloadFavorites } = useRemoteData(() => api.favorites());
  const { data: visits, loading: visitsLoading, error: visitsError } = useRemoteData(() => api.visits());
  const { data: recommendations, loading: recLoading, error: recError } = useRemoteData(() => api.recommendations());
  const favoriteItems = favorites ?? [];

  return (
    <>
      <div className="mb-8 rounded-[22px] bg-[#10233f] px-6 py-7 text-white sm:px-9 sm:py-9">
        <p className="eyebrow text-sky-300">TU ESPACIO INMO360</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-[40px]">Hola, {user.fullName.split(' ')[0]}.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/60">Tus espacios guardados, visitas y recomendaciones en un solo lugar.</p>
        <Link to="/app/catalog" className="button-primary mt-6 !py-3">Explorar propiedades <ArrowRight size={16} /></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card"><span className="metric-icon metric-rose"><Heart size={18} /></span><p className="mt-4 text-3xl font-extrabold text-ink">{favLoading ? '—' : favoriteItems.length}</p><p className="mt-1 text-xs text-slate-500">Propiedades favoritas</p></div>
        <div className="metric-card"><span className="metric-icon metric-amber"><CalendarDays size={18} /></span><p className="mt-4 text-3xl font-extrabold text-ink">{visitsLoading ? '—' : visits?.length ?? 0}</p><p className="mt-1 text-xs text-slate-500">Visitas solicitadas</p></div>
        <div className="metric-card"><span className="metric-icon metric-violet"><Sparkles size={18} /></span><p className="mt-4 text-3xl font-extrabold text-ink">{recLoading ? '—' : recommendations?.length ?? 0}</p><p className="mt-1 text-xs text-slate-500">Recomendaciones del motor</p></div>
      </div>
      {(favError || visitsError) && <div className="mt-5"><ErrorState message={favError || visitsError || 'No se pudieron cargar tus datos.'} retry={() => { void reloadFavorites(); }} /></div>}
      <div className="mb-4 mt-9 flex items-end justify-between"><div><p className="eyebrow">MOTOR DE RECOMENDACIÓN</p><h2 className="mt-2 text-2xl font-bold tracking-[-.04em] text-ink">Espacios para ti</h2></div><Link to="/app/recommendations" className="text-xs font-bold text-electric">Ver recomendaciones <ArrowRight size={14} className="inline" /></Link></div>
      {recLoading ? <LoadingState /> : recError ? <ErrorState message={recError} /> : recommendations?.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{recommendations.slice(0, 3).map((property) => <PropertyCard key={property.id} property={property} score={property.score} />)}</div> : <EmptyState title="Aún no hay recomendaciones"><p>Configura tus preferencias para que el motor de INMO360 encuentre opciones relevantes.</p><Link className="mt-2 font-semibold text-electric" to="/app/preferences">Configurar preferencias</Link></EmptyState>}
      <div className="mb-4 mt-9 flex items-end justify-between"><div><p className="eyebrow">GUARDADOS</p><h2 className="mt-2 text-2xl font-bold tracking-[-.04em] text-ink">Mis favoritos</h2></div><Link to="/app/favorites" className="text-xs font-bold text-electric">Ver todos <ArrowRight size={14} className="inline" /></Link></div>
      {favLoading ? <LoadingState /> : favoriteItems.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{favoriteItems.slice(0, 3).map((favorite: Favorite) => <PropertyCard key={favorite.id} property={favorite.property} />)}</div> : <EmptyState title="Todavía no guardaste propiedades"><p>Explora el catálogo y guarda los espacios que quieras revisar después.</p></EmptyState>}
    </>
  );
}
