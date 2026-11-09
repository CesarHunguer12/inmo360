import { ArrowLeft, ArrowUpRight, BedDouble, CalendarDays, Check, ChevronLeft, ChevronRight, Heart, MapPin, Maximize2, MessageSquareText, ShowerHead, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { modalityLabel, propertyTypeLabel } from '../../domain/entities/property';
import type { Property } from '../../domain/entities/property';
import { getErrorMessage } from '../../infrastructure/api/http-client';
import { ApiPropertyRepository } from '../../infrastructure/repositories/api-property.repository';
import { ApiRealEstateRepository } from '../../infrastructure/repositories/api-real-estate.repository';
import { ErrorState, LoadingState } from '../components/Feedback';
import { useAuth } from '../hooks/AuthProvider';

const properties = new ApiPropertyRepository();
const realEstate = new ApiRealEstateRepository();

export function PropertyDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [visitAt, setVisitAt] = useState('');
  const [pending, setPending] = useState<'inquiry' | 'visit' | ''>('');
  const [notice, setNotice] = useState('');
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    properties.get(id).then(setProperty).catch((reason) => setError(getErrorMessage(reason)));
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'CLIENTE') return;
    realEstate.favorites()
      .then((items) => setFavorite(items.some((item) => item.propertyId === id)))
      .catch((reason) => setNotice(getErrorMessage(reason)));
  }, [id, user?.role]);

  if (error) return <div className="mx-auto max-w-4xl px-5 py-12"><ErrorState message={error} retry={() => { setError(''); properties.get(id).then(setProperty).catch((reason) => setError(getErrorMessage(reason))); }} /></div>;
  if (!property) return <LoadingState label="Cargando detalle de la propiedad…" />;

  const images = property.images ?? [];
  const image = images[imageIndex];
  const price = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(Number(property.price));
  const isClient = user?.role === 'CLIENTE';

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return navigate('/login');
    if (!isClient) return;
    setPending('inquiry');
    setNotice('');
    try {
      await realEstate.createInquiry(property!.id, message);
      setNotice('Tu consulta se envió correctamente. El equipo se pondrá en contacto contigo.');
      setMessage('');
    } catch (reason) { setNotice(getErrorMessage(reason)); }
    finally { setPending(''); }
  }

  async function submitVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return navigate('/login');
    if (!isClient) return;
    setPending('visit');
    setNotice('');
    try {
      await realEstate.createVisit(property!.id, new Date(visitAt).toISOString());
      setNotice('Tu solicitud de visita quedó registrada.');
      setVisitAt('');
    } catch (reason) { setNotice(getErrorMessage(reason)); }
    finally { setPending(''); }
  }

  async function toggleFavorite() {
    if (!user) return navigate('/login');
    try {
      if (favorite) {
        const items = await realEstate.favorites();
        const found = items.find((item) => item.propertyId === property!.id);
        if (found) await realEstate.removeFavorite(found.id);
        setFavorite(false);
      } else {
        await realEstate.addFavorite(property!.id);
        setFavorite(true);
      }
    } catch (reason) { setNotice(getErrorMessage(reason)); }
  }

  return (
    <div className="mx-auto max-w-[1250px] px-5 py-8 sm:px-8 lg:py-12">
      <Link to="/properties" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-electric"><ArrowLeft size={15} />Volver al catálogo</Link>
      <div className="grid gap-8 lg:grid-cols-[1fr_370px]">
        <div>
          <div className="relative aspect-[1.65/1] overflow-hidden rounded-[24px] bg-slate-100">
            {image ? <img src={image.url} alt={image.caption || property.title} className="h-full w-full object-cover" /> : <div className="property-placeholder"><span>INMO<span className="text-electric">360</span></span></div>}
            {images.length > 1 && <div className="absolute inset-x-4 bottom-4 flex justify-between"><button className="image-nav" onClick={() => setImageIndex((imageIndex + images.length - 1) % images.length)} aria-label="Fotografía anterior"><ChevronLeft size={18} /></button><span className="rounded-full bg-black/45 px-3 py-1 text-[11px] text-white">{imageIndex + 1} / {images.length}</span><button className="image-nav" onClick={() => setImageIndex((imageIndex + 1) % images.length)} aria-label="Fotografía siguiente"><ChevronRight size={18} /></button></div>}
          </div>
          {images.length > 1 && <div className="mt-3 flex gap-2 overflow-auto">{images.map((photo, index) => <button key={photo.id} onClick={() => setImageIndex(index)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${index === imageIndex ? 'border-electric' : 'border-transparent'}`}><img src={photo.url} alt={photo.caption || ''} className="h-full w-full object-cover" /></button>)}</div>}
          <div className="mt-7 flex flex-wrap items-start justify-between gap-4">
            <div><p className="eyebrow">{propertyTypeLabel[property.type]} · {property.code}</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink sm:text-[38px]">{property.title}</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={15} className="text-electric" />{property.address}, {property.zone}, La Paz</p></div>
            <button className={`icon-button !h-11 !w-11 ${favorite ? '!bg-rose-50 !text-rose-500' : ''}`} onClick={() => void toggleFavorite()} aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></button>
          </div>
          <div className="my-7 flex flex-wrap gap-3 border-y border-slate-200 py-5">
            <span className="detail-spec"><BedDouble size={17} />{property.bedrooms} dormitorios</span><span className="detail-spec"><ShowerHead size={17} />{property.bathrooms} baños</span><span className="detail-spec"><Maximize2 size={16} />{Number(property.areaM2)} m²</span><span className="detail-spec"><ShieldCheck size={16} />{property.hasGarage ? 'Con garaje' : 'Sin garaje'}</span>
          </div>
          <div><p className="eyebrow">SOBRE EL ESPACIO</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{property.description}</p></div>
          {property.features?.length > 0 && <div className="mt-7"><p className="eyebrow">CARACTERÍSTICAS</p><div className="mt-3 flex flex-wrap gap-2">{property.features.map((feature) => <span key={feature} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">{feature}</span>)}</div></div>}
        </div>
        <aside className="h-fit rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_12px_42px_-30px_rgba(16,35,63,.24)] lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-400">{modalityLabel[property.modality]}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-[-.05em] text-ink">Bs {price}</p>
          <p className="mt-1 text-xs text-slate-400">{property.modality === 'ALQUILER' ? 'por mes' : 'Precio publicado'}</p>
          <div className="mt-5 border-t border-slate-100 pt-5">
            {property.agent && <p className="mb-4 text-xs text-slate-500">Atiende <span className="font-semibold text-ink">{property.agent.fullName}</span></p>}
            {!user ? <div className="space-y-3"><p className="text-sm leading-6 text-slate-500">Inicia sesión como cliente para consultar o solicitar una visita.</p><Link to="/login" className="button-primary w-full">Iniciar sesión</Link></div> : isClient ? (
              <>
                <form onSubmit={submitInquiry} className="space-y-3"><label className="form-label">¿Te interesa esta propiedad?<textarea className="form-input min-h-24 resize-y" required minLength={3} maxLength={4000} placeholder="Cuéntanos qué deseas saber…" value={message} onChange={(event) => setMessage(event.target.value)} /></label><button disabled={pending !== ''} className="button-primary w-full disabled:opacity-60"><MessageSquareText size={16} />{pending === 'inquiry' ? 'Enviando…' : 'Enviar consulta'}</button></form>
                <form onSubmit={submitVisit} className="mt-5 border-t border-slate-100 pt-5"><label className="form-label">Solicitar una visita<input className="form-input" required type="datetime-local" value={visitAt} onChange={(event) => setVisitAt(event.target.value)} /></label><button disabled={pending !== ''} className="button-secondary mt-3 w-full disabled:opacity-60"><CalendarDays size={16} />{pending === 'visit' ? 'Enviando…' : 'Solicitar visita'}</button></form>
              </>
            ) : <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Las consultas y visitas están disponibles para cuentas de cliente.</p>}
            {notice && <p role="status" className={`mt-4 rounded-xl p-3 text-xs leading-5 ${notice.includes('correctamente') || notice.includes('registrada') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{notice}</p>}
            <p className="mt-5 flex items-center gap-2 text-[10px] text-slate-400"><Check size={13} className="text-emerald-500" />Disponibilidad consultada en tiempo real</p>
          </div>
        </aside>
      </div>
      <Link to="/properties" className="mt-10 inline-flex items-center gap-2 text-xs font-bold text-electric">Ver más propiedades <ArrowUpRight size={15} /></Link>
    </div>
  );
}
