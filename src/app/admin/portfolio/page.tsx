'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, FolderOpen, X, Save, Loader2, MapPin, Calendar, User, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface Project {
  id: string; title: string; description: string; category: string; location: string;
  duration: string; year: string; client: string; image: string; gallery: string[];
  badge: string; size: string; isActive: boolean; isFeatured: boolean; order: number;
}

const CATEGORIES = ['civil', 'metalurgica', 'mantenimiento'];
const CAT_LABELS: Record<string, string> = { civil: 'Construccion civil', metalurgica: 'Metalurgica', mantenimiento: 'Mantenimiento' };

export default function AdminPortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fetch_ = useCallback(() => {
    setLoading(true);
    fetch('/api/portfolio').then((r) => r.json()).then((d) => { setProjects(d.projects || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openNew = () => {
    setIsNew(true);
    setEditing({ id: '', title: '', description: '', category: 'civil', location: '', duration: '', year: new Date().getFullYear().toString(), client: '', image: '', gallery: [], badge: 'blue', size: 'small', isActive: true, isFeatured: false, order: projects.length });
  };

  const saveProject = async () => {
    if (!editing) return;
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/portfolio' : `/api/portfolio/${editing.id}`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    setEditing(null); fetch_();
  };

  const del = async (id: string) => { if (!confirm('¿Eliminar este proyecto?')) return; await fetch(`/api/portfolio/${id}`, { method: 'DELETE' }); fetch_(); };
  const toggle = async (id: string, field: string, val: boolean) => { await fetch(`/api/portfolio/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: !val }) }); fetch_(); };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Portfolio</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">{projects.length} proyectos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch_} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo proyecto</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-20 rounded bg-steel-900" /></div>)}</div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin proyectos</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Agrega proyectos para mostrarlos en tu portfolio publico.</p>
          <button onClick={openNew} className="btn-primary mt-6 inline-flex"><Plus className="h-4 w-4" /> Crear proyecto</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="relative h-40 bg-gradient-to-br from-steel-900 to-steel-700">
                {p.image ? <img src={p.image} alt={p.title} className="h-full w-full object-cover" /> : <FolderOpen className="absolute inset-0 m-auto h-12 w-12 text-steel-700" />}
                <div className="absolute left-2 top-2 flex gap-1">
                  <span className={`badge-${p.badge}`}>{CAT_LABELS[p.category] || p.category}</span>
                  {p.isFeatured && <span className="badge-yellow">Destacado</span>}
                </div>
                {!p.isActive && <div className="absolute inset-0 flex items-center justify-center bg-carbon/60"><span className="badge-red">Inactivo</span></div>}
              </div>
              <div className="p-4">
                <h3 className="font-display text-h4 text-arctic line-clamp-1">{p.title}</h3>
                <p className="mt-1 font-body text-caption text-steel-500 line-clamp-2">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-caption text-steel-500">
                  {p.client && <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.client}</span>}
                  {p.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</span>}
                  {p.year && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.year}</span>}
                </div>
                <div className="mt-3 flex items-center gap-1 border-t border-steel-900/30 pt-3">
                  <button onClick={() => toggle(p.id, 'isFeatured', p.isFeatured)} className={`rounded p-1.5 transition-colors ${p.isFeatured ? 'text-yellow-bright hover:bg-yellow-muted' : 'text-steel-700 hover:text-steel-300'}`}><Star className="h-4 w-4" fill={p.isFeatured ? 'currentColor' : 'none'} /></button>
                  <button onClick={() => toggle(p.id, 'isActive', p.isActive)} className="rounded p-1.5 text-steel-500 hover:text-arctic">{p.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                  <button onClick={() => { setIsNew(false); setEditing(p); }} className="rounded p-1.5 text-steel-500 hover:bg-blue-muted hover:text-blue-bright"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(p.id)} className="rounded p-1.5 text-steel-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
            <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
              <h2 className="font-display text-h2 text-arctic">{isNew ? 'Nuevo proyecto' : 'Editar proyecto'}</h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label mb-1 block">Titulo *</label><input type="text" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input" /></div>
                <div className="col-span-2"><label className="label mb-1 block">Descripcion</label><textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input min-h-[80px]" rows={3} /></div>
                <div><label className="label mb-1 block">Categoria</label><select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="input">{CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}</select></div>
                <div><label className="label mb-1 block">Color badge</label><select value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} className="input"><option value="blue">Azul</option><option value="green">Verde</option><option value="yellow">Amarillo</option><option value="neutral">Neutro</option></select></div>
                <div><label className="label mb-1 block">Cliente</label><input type="text" value={editing.client} onChange={(e) => setEditing({ ...editing, client: e.target.value })} className="input" /></div>
                <div><label className="label mb-1 block">Ubicacion</label><input type="text" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="input" /></div>
                <div><label className="label mb-1 block">Duracion</label><input type="text" value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} className="input" placeholder="Ej: 3 meses" /></div>
                <div><label className="label mb-1 block">Ano</label><input type="text" value={editing.year} onChange={(e) => setEditing({ ...editing, year: e.target.value })} className="input" /></div>
                <div className="col-span-2"><label className="label mb-1 block">Imagen principal (URL)</label><input type="url" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="input" placeholder="https://..." /></div>
                {editing.image && <div className="col-span-2"><img src={editing.image} alt="" className="h-32 w-full rounded-md object-cover" /></div>}
                <div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="h-4 w-4 accent-blue" /><span className="font-body text-body-sm text-arctic">Activo</span></label></div>
                <div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editing.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} className="h-4 w-4 accent-yellow-bright" /><span className="font-body text-body-sm text-arctic">Destacado</span></label></div>
              </div>
              <button onClick={saveProject} disabled={!editing.title} className="btn-primary w-full justify-center gap-2 py-3"><Save className="h-4 w-4" />{isNew ? 'Crear proyecto' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
