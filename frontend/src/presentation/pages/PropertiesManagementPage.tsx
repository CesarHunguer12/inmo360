import { ArrowUpRight, Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Property, PropertyModality, PropertyType } from '../../domain/entities/property';
import { modalityLabel, propertyTypeLabel, statusLabel } from '../../domain/entities/property';
import type { Owner } from '../../domain/repositories/real-estate.repository';
import { getErrorMessage } from '../../infrastructure/api/http-client';
import { httpClient } from '../../infrastructure/api/http-client';
import { ApiPropertyRepository } from '../../infrastructure/repositories/api-property.repository';
import { ApiRealEstateRepository } from '../../infrastructure/repositories/api-real-estate.repository';
import type { PropertyWrite } from '../../domain/repositories/property.repository';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { useAuth } from '../hooks/AuthProvider';

const propertiesApi = new ApiPropertyRepository();
const realEstateApi = new ApiRealEstateRepository();

export function PropertiesManagementPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; fullName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Property | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const managed = user?.role !== 'ADMINISTRADOR';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [list, ownerList, userList] = await Promise.all([
        propertiesApi.list({}, true),
        realEstateApi.owners(),
        user?.role === 'ADMINISTRADOR' ? realEstateApi.users() : Promise.resolve([]),
      ]);
      setProperties(list);
      setOwners(ownerList);
      setAgents(userList.filter((item) => item.role === 'AGENTE' && item.isActive !== false).map(({ id, fullName }) => ({ id, fullName })));
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [user?.role]);

  const rows = useMemo(() => properties.filter((property) => `${property.code} ${property.title} ${property.zone}`.toLowerCase().includes(search.toLowerCase())), [properties, search]);

  async function save(input: PropertyWrite, id?: string) {
    try {
      const result = id ? await propertiesApi.update(id, input) : await propertiesApi.create(input);
      setProperties((items) => id ? items.map((item) => item.id === id ? { ...item, ...result } : item) : [result, ...items]);
      setEditing(undefined);
      setNotice(id ? 'Propiedad actualizada correctamente.' : 'Propiedad registrada correctamente.');
      window.setTimeout(() => setNotice(''), 3500);
    } catch (reason) {
      throw new Error(getErrorMessage(reason));
    }
  }

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{managed ? 'CARTERA ASIGNADA' : 'INVENTARIO INMO360'}</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] text-ink">{managed ? 'Mis propiedades' : 'Propiedades'}</h1><p className="mt-2 text-sm text-slate-500">{managed ? 'Gestiona los inmuebles que tienes asignados.' : 'Administra el inventario inmobiliario.'}</p></div><button className="button-primary" onClick={() => setEditing(null)}><Plus size={16} />Registrar propiedad</button></div>
      {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      <label className="relative mb-4 block max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="filter-input !pl-9" placeholder="Buscar por código, nombre o zona…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => void load()} /> : rows.length ? <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left text-xs"><thead className="bg-[#f8fafc] text-[9px] font-bold uppercase tracking-[.12em] text-slate-400"><tr>{['Propiedad', 'Modalidad', 'Precio', 'Estado', 'Agente', 'Acciones'].map((title) => <th key={title} className="px-5 py-4">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((property) => <tr key={property.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-bold text-ink">{property.title}</p><p className="mt-1 text-[10px] text-slate-400">{property.code} · {property.zone}</p></td><td className="px-5 py-4 text-slate-500">{modalityLabel[property.modality]}</td><td className="px-5 py-4 font-semibold text-ink">Bs {Number(property.price).toLocaleString('es-BO')}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${property.status === 'DISPONIBLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{statusLabel[property.status]}</span></td><td className="px-5 py-4 text-slate-500">{property.agent?.fullName ?? (agents.find((agent) => agent.id === property.agentId)?.fullName ?? '—')}</td><td className="px-5 py-4"><div className="flex gap-2"><button className="icon-button !h-8 !w-8" onClick={() => setEditing(property)} title="Editar propiedad"><Pencil size={14} /></button><Link className="icon-button !h-8 !w-8" to={`/properties/${property.id}`} title="Ver ficha pública"><ArrowUpRight size={14} /></Link></div></td></tr>)}</tbody></table></div></div> : <EmptyState title="Aún no hay propiedades en esta cartera"><p>Registra un inmueble para comenzar a gestionar tu inventario.</p><button className="mt-3 font-semibold text-electric" onClick={() => setEditing(null)}>Registrar propiedad</button></EmptyState>}
      {editing !== undefined && <PropertyEditor property={editing} owners={owners} agents={agents} agentId={user?.role === 'AGENTE' ? user.id : undefined} close={() => setEditing(undefined)} save={(input) => save(input, editing?.id)} />}
    </>
  );
}

function PropertyEditor({ property, owners, agents, agentId, close, save }: {
  property: Property | null;
  owners: Owner[];
  agents: Array<{ id: string; fullName: string }>;
  agentId?: string;
  close: () => void;
  save(input: PropertyWrite): Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [features, setFeatures] = useState(property?.features.join(', ') ?? '');
  const [photoUrl, setPhotoUrl] = useState(property?.images?.map((image) => image.url).join('\n') ?? '');
  const [selectedModality, setSelectedModality] = useState<PropertyModality>(property?.modality ?? 'VENTA');
  const [selectedType, setSelectedType] = useState<PropertyType>(property?.type ?? 'DEPARTAMENTO');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: PropertyWrite = {
      code: String(form.get('code')).trim(),
      title: String(form.get('title')).trim(),
      description: String(form.get('description')).trim(),
      modality: selectedModality,
      type: selectedType,
      price: Number(form.get('price')),
      zone: String(form.get('zone')).trim(),
      address: String(form.get('address')).trim(),
      bedrooms: Number(form.get('bedrooms')),
      bathrooms: Number(form.get('bathrooms')),
      areaM2: Number(form.get('areaM2')),
      hasGarage: form.get('hasGarage') === 'on',
      features: features.split(',').map((feature) => feature.trim()).filter(Boolean),
      ownerId: String(form.get('ownerId')),
      ...(!agentId && form.get('agentId') ? { agentId: String(form.get('agentId')) } : {}),
      ...(!property && photoUrl.trim() ? { images: photoUrl.split(/\r?\n/).map((url, position) => ({ url: url.trim(), position })).filter((image) => image.url) } : {}),
    };
    if (!input.ownerId) { setError('Selecciona un propietario antes de guardar.'); return; }
    if (!agentId && !input.agentId) { setError('Asigna un agente responsable.'); return; }
    setPending(true);
    setError('');
    try { await save(input); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar la propiedad.'); }
    finally { setPending(false); }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b1830]/55 p-3 sm:p-6" onClick={close}>
      <form className="mx-auto my-4 max-w-3xl rounded-[22px] bg-white shadow-2xl sm:my-8" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}>
        <div className="sticky top-0 z-10 flex items-start justify-between rounded-t-[22px] border-b border-slate-100 bg-white px-6 py-5"><div><p className="eyebrow">GESTIÓN DE INVENTARIO</p><h2 className="mt-1 text-xl font-bold text-ink">{property ? 'Editar propiedad' : 'Registrar propiedad'}</h2></div><button className="icon-button" type="button" onClick={close}>×</button></div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <label className="form-label">Código<input name="code" className="form-input" required maxLength={32} defaultValue={property?.code} placeholder="LP-001" /></label>
          <label className="form-label">Título<input name="title" className="form-input" required minLength={3} maxLength={160} defaultValue={property?.title} /></label>
          <label className="form-label">Modalidad<select className="form-input" value={selectedModality} onChange={(event) => setSelectedModality(event.target.value as PropertyModality)}>{Object.entries(modalityLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="form-label">Tipo<select className="form-input" value={selectedType} onChange={(event) => setSelectedType(event.target.value as PropertyType)}>{Object.entries(propertyTypeLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="form-label">Precio (Bs)<input name="price" className="form-input" type="number" min="0.01" step="0.01" required defaultValue={property?.price} /></label>
          <label className="form-label">Zona<input name="zone" className="form-input" required maxLength={100} defaultValue={property?.zone} /></label>
          <label className="form-label sm:col-span-2">Dirección o referencia<input name="address" className="form-input" required maxLength={240} defaultValue={property?.address} /></label>
          <label className="form-label">Superficie (m²)<input name="areaM2" className="form-input" type="number" min="0.01" step="0.01" required defaultValue={property?.areaM2} /></label>
          <div className="grid grid-cols-2 gap-3"><label className="form-label">Dormitorios<input name="bedrooms" className="form-input" type="number" min="0" max="100" required defaultValue={property?.bedrooms ?? 0} /></label><label className="form-label">Baños<input name="bathrooms" className="form-input" type="number" min="0" max="100" required defaultValue={property?.bathrooms ?? 0} /></label></div>
          <label className="form-label">Propietario<select name="ownerId" className="form-input" required defaultValue={property?.ownerId ?? ''}><option value="" disabled>Selecciona propietario</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.fullName}</option>)}</select></label>
          {!agentId && <label className="form-label">Agente responsable<select name="agentId" className="form-input" required defaultValue={property?.agentId ?? ''}><option value="" disabled>Selecciona agente</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.fullName}</option>)}</select></label>}
          <label className="flex items-center gap-2 self-end pb-3 text-xs font-medium text-slate-600"><input name="hasGarage" type="checkbox" className="h-4 w-4 accent-[#246bfe]" defaultChecked={property?.hasGarage} />Incluye garaje</label>
          <label className="form-label sm:col-span-2">Descripción<textarea name="description" className="form-input min-h-24 resize-y" required minLength={10} defaultValue={property?.description} /></label>
          <label className="form-label sm:col-span-2">Características <span className="font-normal text-slate-400">(separadas por coma)</span><input className="form-input" value={features} onChange={(event) => setFeatures(event.target.value)} placeholder="Balcón, calefacción, ascensor" /></label>
          {!property && <label className="form-label sm:col-span-2">URLs de fotografías <span className="font-normal text-slate-400">(una URL HTTP/HTTPS por línea)</span><textarea className="form-input min-h-20" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://…" /></label>}
          {property && <div className="sm:col-span-2"><PropertyImagesManager propertyId={property.id} /></div>}
          {error && <p role="alert" className="sm:col-span-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" className="button-secondary" onClick={close}>Cancelar</button><button disabled={pending || !owners.length || (!agentId && !agents.length)} className="button-primary disabled:opacity-55">{pending ? 'Guardando…' : property ? 'Guardar cambios' : 'Registrar propiedad'}</button></div>
      </form>
    </div>
  );
}

function PropertyImagesManager({ propertyId }: { propertyId: string }) {
  const [images, setImages] = useState<Array<{ id: string; url: string; caption?: string | null; position: number }>>([]);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await httpClient.get<typeof images>(`/properties/${propertyId}/images`);
      setImages(data);
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [propertyId]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError('');
    try {
      const { data } = await httpClient.post(`/properties/${propertyId}/images`, {
        url: url.trim(),
        caption: caption.trim() || undefined,
        position: images.length ? Math.max(...images.map((image) => image.position)) + 1 : 0,
      });
      setImages((current) => [...current, data]);
      setUrl(''); setCaption('');
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setPending(false); }
  }

  async function remove(imageId: string) {
    setPending(true); setError('');
    try {
      await httpClient.delete(`/properties/${propertyId}/images/${imageId}`);
      setImages((current) => current.filter((image) => image.id !== imageId));
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setPending(false); }
  }

  async function editCaption(image: { id: string; url: string; caption?: string | null; position: number }, nextCaption: string) {
    setPending(true); setError('');
    try {
      const { data } = await httpClient.patch(`/properties/${propertyId}/images/${image.id}`, {
        caption: nextCaption.trim() || null,
        position: image.position,
      });
      setImages((current) => current.map((item) => item.id === image.id ? data : item));
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setPending(false); }
  }

  return <section className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4"><div className="mb-3"><p className="text-xs font-bold text-ink">Fotografías asociadas</p><p className="mt-1 text-[10px] text-slate-500">Agrega URLs HTTPS y administra sus asociaciones. No se cargan archivos.</p></div>{loading ? <p className="py-4 text-xs text-slate-500">Cargando fotografías…</p> : images.length ? <div className="mb-4 space-y-2">{images.map((image) => <ImageAssociation key={image.id} image={image} disabled={pending} remove={() => void remove(image.id)} update={editCaption} />)}</div> : <p className="mb-4 text-xs text-slate-400">Esta propiedad aún no tiene fotografías asociadas.</p>}{error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}<form className="grid gap-2 sm:grid-cols-[1.4fr_1fr_auto]" onSubmit={(event) => void add(event)}><input className="filter-input" type="url" required pattern="https?://.+" placeholder="https://sitio.com/foto.jpg" value={url} onChange={(event) => setUrl(event.target.value)} /><input className="filter-input" placeholder="Descripción opcional" maxLength={200} value={caption} onChange={(event) => setCaption(event.target.value)} /><button className="button-secondary !py-2" disabled={pending}>{pending ? 'Guardando…' : 'Agregar URL'}</button></form></section>;
}

function ImageAssociation({ image, disabled, remove, update }: {
  image: { id: string; url: string; caption?: string | null; position: number };
  disabled: boolean;
  remove(): void;
  update(image: { id: string; url: string; caption?: string | null; position: number }, caption: string): Promise<void>;
}) {
  const [caption, setCaption] = useState(image.caption ?? '');
  const [editing, setEditing] = useState(false);
  return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2"><img src={image.url} alt={image.caption ?? 'Fotografía de la propiedad'} className="h-12 w-16 shrink-0 rounded-lg bg-slate-100 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-medium text-slate-600">{image.url}</p>{editing ? <input className="filter-input mt-1 !min-h-7 !py-1" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={200} /> : <p className="mt-1 truncate text-[10px] text-slate-400">{caption || 'Sin descripción'}</p>}</div>{editing ? <button type="button" className="button-secondary !px-2 !py-2 !text-[10px]" disabled={disabled} onClick={() => { void update(image, caption).then(() => setEditing(false)); }}>Guardar</button> : <button type="button" className="button-secondary !px-2 !py-2 !text-[10px]" disabled={disabled} onClick={() => setEditing(true)}>Editar</button>}<button type="button" className="rounded-lg px-2 py-2 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50" disabled={disabled} onClick={remove}>Quitar</button></div>;
}
