import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Compass, MoveUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../../domain/entities/property';
import { ApiPropertyRepository } from '../../infrastructure/repositories/api-property.repository';
import { ErrorState } from '../components/Feedback';
import { PropertyCard } from '../components/PropertyCard';

const propertyRepository = new ApiPropertyRepository();

export function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertyRepository.list()
      .then(setProperties)
      .catch(() => setError('No pudimos cargar las propiedades destacadas. Intenta nuevamente en unos minutos.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="hero-lines" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:py-[100px]">
          <div className="relative z-10 max-w-2xl">
            <p className="eyebrow text-sky-300"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-sky-300" />INMOBILIARIA · LA PAZ, BOLIVIA</p>
            <h1 className="mt-7 text-[46px] font-semibold leading-[1.03] tracking-[-0.055em] text-white sm:text-[62px] lg:text-[70px]">Un lugar para<br />lo que <span className="font-serif italic font-normal text-sky-300">sigue.</span></h1>
            <p className="mt-7 max-w-[490px] text-[15px] leading-7 text-white/65">Encuentra un espacio que acompañe tu próxima historia. Propiedades seleccionadas y asesoría cercana en cada paso.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/properties" className="button-primary !px-6 !py-3.5">Explorar propiedades <ArrowRight size={17} /></Link>
              <Link to="/register" className="button-hero-secondary">Quiero asesoría <MoveUpRight size={16} /></Link>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-[11px] font-medium text-white/55">
              <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-sky-300" />Atención personalizada</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-sky-300" />Información verificada</span>
              <span className="flex items-center gap-2"><Compass size={15} className="text-sky-300" />La Paz y alrededores</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[590px] lg:ml-auto">
            <div className="hero-art-wrap">
              {properties[0]?.images?.[0]?.url ? (
                <img src={properties[0].images[0].url} alt={properties[0].title} className="hero-art" />
              ) : (
                <div className="hero-art hero-art-fallback"><div className="building-silhouette"><span /><span /><span /></div></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1830]/75 via-transparent to-[#0b1830]/10" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white sm:bottom-8 sm:left-8 sm:right-8">
                <div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-sky-200">HECHO PARA TU PRÓXIMO CAPÍTULO</p><p className="mt-2 text-xl font-semibold tracking-[-.03em]">Tu espacio, tu ritmo.</p></div>
                <Link to="/properties" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 backdrop-blur transition hover:bg-white hover:text-ink"><ArrowUpRight size={19} /></Link>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-2 flex items-center gap-3 rounded-2xl border border-white/50 bg-white p-4 shadow-xl sm:-left-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf1ff] text-electric"><Sparkles size={18} /></span>
              <div><p className="text-xs font-bold text-ink">Una búsqueda más simple</p><p className="mt-1 text-[10px] text-slate-500">Acompañamiento de principio a fin</p></div>
            </div>
          </div>
        </div>
        <a href="#featured" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-[.17em] text-white/40 lg:flex">Desliza para descubrir <ArrowDownRight size={14} /></a>
      </section>
      <section id="about" className="mx-auto grid max-w-[1440px] gap-8 px-5 py-16 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:items-end lg:px-12 lg:py-20">
        <div><p className="eyebrow">MÁS QUE UNA DIRECCIÓN</p><h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-[-.045em] text-ink sm:text-[38px]">Decisiones inmobiliarias, con otra perspectiva.</h2></div>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><p className="max-w-xl text-sm leading-7 text-slate-500">Conectamos personas con lugares y oportunidades en La Paz. Una experiencia clara, cercana y pensada para avanzar con confianza.</p><span className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-electric">Descubre INMO360 <ArrowUpRight size={16} /></span></div>
      </section>
      <section id="featured" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div><p className="eyebrow">SELECCIÓN INMO360</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-ink">Espacios para descubrir</h2></div>
            <Link to="/properties" className="flex items-center gap-2 text-xs font-bold text-electric hover:underline">Ver todas las propiedades <ArrowRight size={15} /></Link>
          </div>
          {error ? <ErrorState message={error} retry={() => { setError(''); setLoading(true); void propertyRepository.list().then(setProperties).catch(() => setError('No pudimos cargar las propiedades.')).finally(() => setLoading(false)); }} /> : loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[380px] animate-pulse rounded-2xl bg-slate-100" />)}</div>
          ) : properties.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{properties.slice(0, 3).map((property) => <PropertyCard key={property.id} property={property} />)}</div>
          ) : <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-8 text-center text-sm text-slate-500">Aún no hay propiedades disponibles. Vuelve pronto para descubrir nuevos espacios.</div>}
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="overflow-hidden rounded-[26px] bg-[#10233f] px-7 py-10 text-white sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between">
          <div><p className="eyebrow text-sky-300">EMPECEMOS CONVERSANDO</p><h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-.04em] sm:text-[38px]">Cada gran decisión empieza con una pregunta.</h2></div>
          <Link to="/register" className="button-primary mt-7 !px-6 !py-3.5 lg:mt-0">Hablemos <ArrowRight size={17} /></Link>
        </div>
      </section>
    </>
  );
}
