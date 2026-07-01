'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Wrench, X, Save, GripVertical, RefreshCw } from 'lucide-react';

interface Service {
  id: string; title: string; description: string; category: string; icon: string;
  features: string[]; image: string; isActive: boolean; isFeatured: boolean; order: number;
}

const CATEGORIES = ['mantenimiento', 'civil', 'metalurgica'];
const CAT_LABELS: Record<string, string> = { mantenimiento: 'Mantenimiento', civil: 'Construccion civil', metalurgica: 'Metalurgica' };
const ICONS = ['Zap', 'Droplets', 'Paintbrush', 'ShieldCheck', 'Thermometer', 'Wrench', 'HardHat', 'Factory', 'Hammer', 'Cog', 'Flame', 'Ruler'];

export default function AdminServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const fetch_ = useCallback(() => {
    setLoading(true);
    fetch('/api/servicios-cms').then((r) => r.json()).then((d) => { setServices(d.services || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openNew = () => {
    setIsNew(true);
    setEditing({ id: '', title: '', description: '', category: 'mantenimiento', icon: 'Wrench', features: [], image: '', isActive: true, isFeatured: false, order: services.length });
  };

  const saveService = async () => {
    if (!editing) return;
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/servicios-cms' : `/api/servicios-cms/${editing.id}`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    setEditing(null); fetch_();
  };

  const del = async (id: string) => { if (!confirm('¿Eliminar?')) return; await fetch(`/api/servicios-cms/${id}`, { method: 'DELETE' }); fetch_(); };
  const toggle = async (id: string, field: string, val: boolean) => { await fetch(`/api/servicios-cms/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: !val }) }); fetch_(); };

  const addFeature = () => {
    if (!editing || !newFeature.trim()) return;
    setEditing({ ...editing, features: [...editing.features, newFeature.trim()] });
    setNewFeature('');
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Servicios</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">{services.length} servicios configurados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch_} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo servicio</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-16 rounded bg-steel-900" /></div>)}</div>
      ) : services.length === 0 ? (
        <div className="card p-12 text-center">
          <Wrench className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin servicios</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Agrega los servicios que ofreces para mostrarlos en el sitio.</p>
          <button onClick={openNew} className="btn-primary mt-6 inline-flex"><Plus className="h-4 w-4" /> Crear servicio</button>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="card flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-muted font-mono text-caption text-blue-bright">{s.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-h4 text-arctic">{s.title}</h3>
                  <span className="badge-blue">{CAT_LABELS[s.category] || s.category}</span>
                  {!s.isActive && <span className="badge-red">Inactivo</span>}
                  {s.isFeatured && <span className="badge-yellow">Destacado</span>}
                </div>
                <p className="mt-0.5 truncate font-body text-caption text-steel-500">{s.description}</p>
                {s.features.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{s.features.slice(0, 4).map((f) => <span key={f} className="badge-neutral text-[0.55rem]">{f}</span>)}{s.features.length > 4 && <span className="badge-neutral text-[0.55rem]">+{s.features.length - 4}</span>}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => toggle(s.id, 'isFeatured', s.isFeatured)} className={`rounded p-1.5 ${s.isFeatured ? 'text-yellow-bright' : 'text-steel-700 hover:text-steel-300'}`}><Star className="h-4 w-4" fill={s.isFeatured ? 'currentColor' : 'none'} /></button>
                <button onClick={() => toggle(s.id, 'isActive', s.isActive)} className="rounded p-1.5 text-steel-500 hover:text-arctic">{s.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                <button onClick={() => { setIsNew(false); setEditing(s); }} className="rounded p-1.5 text-steel-500 hover:bg-blue-muted hover:text-blue-bright"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => del(s.id)} className="rounded p-1.5 text-steel-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
            <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
              <h2 className="font-display text-h2 text-arctic">{isNew ? 'Nuevo servicio' : 'Editar servicio'}</h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div><label className="label mb-1 block">Titulo *</label><input type="text" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input" /></div>
              <div><label className="label mb-1 block">Descripcion</label><textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input min-h-[80px]" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label mb-1 block">Categoria</label><select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="input">{CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}</select></div>
                <div><label className="label mb-1 block">Icono</label><select value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} className="input font-mono">{ICONS.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
              </div>
              <div><label className="label mb-1 block">Imagen (URL)</label><input type="url" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="input" placeholder="https://..." /></div>
              {editing.image && <img src={editing.image} alt="" className="h-24 w-full rounded-md object-cover" />}
              <div>
                <label className="label mb-1 block">Caracteristicas</label>
                <div className="flex gap-2"><input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} className="input flex-1" placeholder="Agregar caracteristica" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())} /><button type="button" onClick={addFeature} className="btn-secondary shrink-0"><Plus className="h-4 w-4" /></button></div>
                {editing.features.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">{editing.features.map((f, i) => (
                    <span key={i} className="badge-blue flex items-center gap-1">{f}<button onClick={() => setEditing({ ...editing, features: editing.features.filter((_, j) => j !== i) })} className="ml-0.5 hover:text-red-400"><X className="h-3 w-3" /></button></span>
                  ))}</div>
                )}
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="h-4 w-4 accent-blue" /><span className="text-body-sm text-arctic">Activo</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editing.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} className="h-4 w-4 accent-yellow-bright" /><span className="text-body-sm text-arctic">Destacado</span></label>
              </div>
              <button onClick={saveService} disabled={!editing.title} className="btn-primary w-full justify-center gap-2 py-3"><Save className="h-4 w-4" />{isNew ? 'Crear servicio' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
