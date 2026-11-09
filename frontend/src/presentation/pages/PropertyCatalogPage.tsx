import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Property, PropertyFilters, PropertyModality, PropertyType } from '../../domain/entities/property';
import { propertyTypeLabel } from '../../domain/entities/property';
import { getErrorMessage } from '../../infrastructure/api/http-client';
import { ApiPropertyRepository } from '../../infrastructure/repositories/api-property.repository';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PropertyCard } from '../components/PropertyCard';
import { useAuth } from '../hooks/AuthProvider';

const repository = new ApiPropertyRepository();

export function PropertyCatalogPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [zoneInput, setZoneInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  async function load(next = filters) {
    setLoading(true);
    setError('');
    try {
      const results = await repository.list(next);
      setProperties(results.filter((property) =>
        (!next.minPrice || Number(property.price) >= next.minPrice)
        && (!next.maxPrice || Number(property.price) <= next.maxPrice)
        && (!next.minBedrooms || property.bedrooms >= next.minBedrooms)
        && (!next.minBathrooms || property.bathrooms >= next.minBathrooms)
        && (!next.minAreaM2 || Number(property.areaM2) >= next.minAreaM2),
      ));
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const update = (key: keyof PropertyFilters, value: string | number) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
  };

  const activeFilters = useMemo(() => Object.values(filters).some((value) => value !== '' && value !== undefined), [filters]);

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-12">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow">INVENTARIO DISPONIBLE</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink sm:text-[40px]">Encuentra tu espacio</h1><p className="mt-2 text-sm text-slate-500">Propiedades disponibles en La Paz, obtenidas de nuestro catálogo.</p></div>
        <p className="text-xs font-medium text-slate-400">{properties.length} {properties.length === 1 ? 'resultado' : 'resultados'}</p>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {([
          ['', 'Todas'],
          ['VENTA', 'Venta'],
          ['ALQUILER', 'Alquiler'],
          ['ANTICRETICO', 'Anticrético'],
        ] as Array<[PropertyModality | '', string]>).map(([value, label]) => (
          <button key={label} onClick={() => { const next = { ...filters, modality: value }; setFilters(next); void load(next); }} className={`filter-pill ${filters.modality === value || (!filters.modality && !value) ? 'filter-pill-active' : ''}`}>{label}</button>
        ))}
        <button className={`filter-pill ml-auto flex items-center gap-2 ${showFilters ? 'filter-pill-active' : ''}`} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={14} />Filtros {activeFilters && <span className="h-1.5 w-1.5 rounded-full bg-electric" />}</button>
      </div>
      {showFilters && (
        <div className="panel mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="filter-label">Zona<input className="filter-input" value={zoneInput} onChange={(event) => setZoneInput(event.target.value)} placeholder="Ej. Sopocachi" /></label>
          <label className="filter-label">Tipo<select className="filter-input" value={filters.type || ''} onChange={(event) => update('type', event.target.value as PropertyType | '')}><option value="">Todos los tipos</option>{Object.entries(propertyTypeLabel).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
          <label className="filter-label">Precio mínimo (Bs)<input type="number" min="0" className="filter-input" value={filters.minPrice ?? ''} onChange={(event) => update('minPrice', Number(event.target.value) || 0)} /></label>
          <label className="filter-label">Precio máximo (Bs)<input type="number" min="0" className="filter-input" value={filters.maxPrice ?? ''} onChange={(event) => update('maxPrice', Number(event.target.value) || 0)} /></label>
          <label className="filter-label">Dormitorios mín.<input type="number" min="0" className="filter-input" value={filters.minBedrooms ?? ''} onChange={(event) => update('minBedrooms', Number(event.target.value) || 0)} /></label>
          <label className="filter-label">Baños mín.<input type="number" min="0" className="filter-input" value={filters.minBathrooms ?? ''} onChange={(event) => update('minBathrooms', Number(event.target.value) || 0)} /></label>
          <label className="filter-label">Superficie mín. (m²)<input type="number" min="0" className="filter-input" value={filters.minAreaM2 ?? ''} onChange={(event) => update('minAreaM2', Number(event.target.value) || 0)} /></label>
          <div className="flex items-end gap-2"><button className="button-primary flex-1" onClick={() => { const next = { ...filters, zone: zoneInput }; setFilters(next); void load(next); }}><Search size={15} />Aplicar filtros</button><button className="icon-button !h-10 !w-10" aria-label="Limpiar filtros" onClick={() => { setZoneInput(''); setFilters({}); void load({}); }}><X size={16} /></button></div>
        </div>
      )}
      {!showFilters && zoneInput && <button className="mb-5 flex items-center gap-2 text-xs text-slate-500" onClick={() => { const next = { ...filters, zone: zoneInput }; setFilters(next); void load(next); }}><Search size={14} />Buscar la zona “{zoneInput}”</button>}
      {error ? <ErrorState message={error} retry={() => void load()} /> : loading ? <LoadingState label="Consultando propiedades disponibles…" /> : properties.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
      ) : <EmptyState title="No encontramos propiedades con esos filtros"><button className="mt-2 font-semibold text-electric" onClick={() => { setFilters({}); setZoneInput(''); void load({}); }}>Quitar filtros y ver todas</button></EmptyState>}
      {user?.role === 'CLIENTE' && <p className="mt-8 text-center text-xs text-slate-400">Inicia sesión para consultar una propiedad o coordinar una visita.</p>}
    </section>
  );
}
