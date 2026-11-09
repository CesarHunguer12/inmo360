import { ArrowUpRight, BedDouble, MapPin, Maximize2, ShowerHead } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Property } from '../../domain/entities/property';
import { modalityLabel, propertyTypeLabel } from '../../domain/entities/property';

function priceText(property: Property) {
  const amount = Number(property.price);
  if (!Number.isFinite(amount)) return 'Consultar precio';
  return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(amount);
}

export function PropertyCard({ property, score }: { property: Property; score?: number }) {
  const cover = property.images?.[0]?.url;
  return (
    <article className="property-card group">
      <Link to={`/properties/${property.id}`} className="relative block aspect-[1.42/1] overflow-hidden bg-slate-100">
        {cover ? (
          <img src={cover} alt={property.images?.[0]?.caption || property.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="property-placeholder"><span>INMO<span className="text-electric">360</span></span></div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-ink shadow-sm">
          {modalityLabel[property.modality]}
        </span>
        {typeof score === 'number' && <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white">{score}% compatible</span>}
        <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-sm transition group-hover:bg-electric group-hover:text-white"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-electric">
          <span>{propertyTypeLabel[property.type]}</span><span className="text-slate-300">/</span><span>{property.code}</span>
        </div>
        <Link to={`/properties/${property.id}`} className="line-clamp-1 text-[17px] font-bold tracking-[-0.025em] text-ink hover:text-electric">{property.title}</Link>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} className="shrink-0 text-electric" />{property.zone}, La Paz</p>
        <div className="my-4 flex items-center gap-4 border-y border-slate-100 py-3 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5"><BedDouble size={15} />{property.bedrooms} dorm.</span>
          <span className="flex items-center gap-1.5"><ShowerHead size={15} />{property.bathrooms} baños</span>
          <span className="flex items-center gap-1.5"><Maximize2 size={14} />{Number(property.areaM2)} m²</span>
        </div>
        <div className="flex items-end justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{property.modality === 'ALQUILER' ? 'Precio mensual' : 'Precio'}</p><p className="mt-1 text-xl font-extrabold tracking-[-0.04em] text-ink">Bs {priceText(property)}</p></div>
        </div>
      </div>
    </article>
  );
}
