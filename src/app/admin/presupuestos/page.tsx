'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Plus, Eye, Trash2, X, Send, User, Mail, Phone, Building, MapPin, MessageSquare, Clock, Calendar, DollarSign, Loader2, FileText, ChevronRight, AlertTriangle, Wrench, HardHat, Factory, Filter } from 'lucide-react';

interface Presupuesto {
  id: string; code: string; status: string; serviceType: string; serviceTitle: string;
  customer: { name: string; email: string; phone: string; company: string; address: string };
  description: string; details: string; estimatedValue: number | null; finalValue: number | null;
  estimatedDuration: string; priority: string; source: string; assignedTo: string; scheduledDate: string;
  notes: { id: string; text: string; createdAt: string }[];
  createdAt: string; updatedAt: string;
}

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  nuevo: { label: 'Nuevo', badge: 'badge-blue' },
  en_revision: { label: 'En revision', badge: 'badge-yellow' },
  cotizado: { label: 'Cotizado', badge: 'badge-yellow' },
  aprobado: { label: 'Aprobado', badge: 'badge-green' },
  en_ejecucion: { label: 'En ejecucion', badge: 'badge-green' },
  completado: { label: 'Completado', badge: 'badge-neutral' },
  rechazado: { label: 'Rechazado', badge: 'badge-red' },
};

const TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  mantenimiento: { label: 'Mantenimiento', icon: Wrench, color: 'text-blue-bright' },
  civil: { label: 'Construccion civil', icon: HardHat, color: 'text-yellow-bright' },
  metalurgica: { label: 'Metalurgica', icon: Factory, color: 'text-[#48BB78]' },
  otro: { label: 'Otro', icon: FileText, color: 'text-steel-300' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'text-steel-500' }, media: { label: 'Media', color: 'text-yellow-bright' },
  alta: { label: 'Alta', color: 'text-[#FC8181]' }, urgente: { label: 'Urgente', color: 'text-[#FC8181]' },
};

const formatGs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminPresupuestosPage() {
  const [items, setItems] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState<Presupuesto | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (filterStatus) p.set('status', filterStatus);
    if (filterType) p.set('type', filterType);
    fetch(`/api/presupuestos?${p}`).then((r) => r.json()).then((d) => { setItems(d.presupuestos || []); setLoading(false); }).catch(() => setLoading(false));
  }, [search, filterStatus, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/presupuestos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { fetchData(); if (selected?.id === id) { const u = await res.json(); setSelected(u); } }
  };

  const updateField = async (id: string, field: string, value: any) => {
    const res = await fetch(`/api/presupuestos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value }) });
    if (res.ok && selected?.id === id) { const u = await res.json(); setSelected(u); }
  };

  const addNote = async () => {
    if (!selected || !newNote.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/presupuestos/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _addNote: newNote.trim() }) });
    if (res.ok) { const u = await res.json(); setSelected(u); setNewNote(''); }
    setAddingNote(false);
  };

  const del = async (id: string) => { if (!confirm('¿Eliminar este presupuesto?')) return; await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' }); fetchData(); if (selected?.id === id) setSelected(null); };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Presupuestos</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Solicitudes de presupuesto de servicios</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> Nueva solicitud</button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" /><input type="text" placeholder="Buscar por codigo, cliente, servicio..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" /></div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input max-w-[160px]"><option value="">Todo estado</option>{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input max-w-[160px]"><option value="">Todo tipo</option>{Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-16 rounded bg-steel-900" /></div>)}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin presupuestos</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Las solicitudes de presupuesto de servicios apareceran aqui.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-6 inline-flex"><Plus className="h-4 w-4" /> Crear solicitud</button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const st = STATUS_MAP[item.status] || STATUS_MAP.nuevo;
            const tp = TYPE_MAP[item.serviceType] || TYPE_MAP.otro;
            const pr = PRIORITY_MAP[item.priority] || PRIORITY_MAP.media;
            const TpIcon = tp.icon;
            return (
              <div key={item.id} className="card-interactive flex items-center gap-4 p-4" onClick={() => setSelected(item)}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-steel-900 ${tp.color}`}><TpIcon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-caption text-blue-bright">{item.code}</span>
                    <span className={st.badge}>{st.label}</span>
                    {(item.priority === 'alta' || item.priority === 'urgente') && <AlertTriangle className={`h-3.5 w-3.5 ${pr.color}`} />}
                  </div>
                  <p className="mt-0.5 font-body text-body-sm font-medium text-arctic">{item.serviceTitle}</p>
                  <p className="truncate font-body text-caption text-steel-500">{item.customer.name}{item.customer.company ? ` — ${item.customer.company}` : ''}</p>
                </div>
                <div className="hidden shrink-0 text-right md:block">
                  {item.estimatedValue && <p className="font-mono text-body-sm text-arctic">{formatGs(item.estimatedValue)}</p>}
                  <p className="font-body text-caption text-steel-700">{formatDate(item.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {item.notes.length > 0 && <span className="flex items-center gap-0.5 font-mono text-caption text-steel-700"><MessageSquare className="h-3 w-3" />{item.notes.length}</span>}
                  <button onClick={(e) => { e.stopPropagation(); del(item.id); }} className="rounded p-1 text-steel-700 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  <ChevronRight className="h-4 w-4 text-steel-700" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end">
          <div className="absolute inset-0 bg-carbon/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative h-full w-full max-w-lg overflow-y-auto border-l border-steel-900/40 bg-carbon-light shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-steel-900/40 bg-carbon-light px-6 py-4">
              <div><span className="font-mono text-caption text-blue-bright">{selected.code}</span><h2 className="font-display text-h3 text-arctic">{selected.serviceTitle}</h2></div>
              <button onClick={() => setSelected(null)} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-6">
              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label mb-1 block">Estado</label><select value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)} className="input">{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                <div><label className="label mb-1 block">Prioridad</label><select value={selected.priority} onChange={(e) => updateField(selected.id, 'priority', e.target.value)} className="input">{Object.entries(PRIORITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              </div>
              {/* Customer */}
              <div className="card p-4">
                <h3 className="mb-2 flex items-center gap-2 font-display text-h4 text-arctic"><User className="h-4 w-4 text-blue-bright" /> Cliente</h3>
                <div className="space-y-1 font-body text-body-sm">
                  <p className="font-medium text-arctic">{selected.customer.name}</p>
                  {selected.customer.company && <p className="flex items-center gap-1 text-steel-300"><Building className="h-3 w-3" />{selected.customer.company}</p>}
                  {selected.customer.email && <p className="flex items-center gap-1 text-steel-300"><Mail className="h-3 w-3" />{selected.customer.email}</p>}
                  {selected.customer.phone && <p className="flex items-center gap-1 text-steel-300"><Phone className="h-3 w-3" />{selected.customer.phone}</p>}
                  {selected.customer.address && <p className="flex items-center gap-1 text-steel-300"><MapPin className="h-3 w-3" />{selected.customer.address}</p>}
                </div>
              </div>
              {/* Description */}
              <div className="card p-4">
                <h3 className="mb-2 font-display text-h4 text-arctic">Descripcion del servicio</h3>
                <p className="whitespace-pre-line font-body text-body-sm text-steel-300">{selected.description || 'Sin descripcion'}</p>
                {selected.details && <><div className="my-2 border-t border-steel-900/30" /><p className="whitespace-pre-line font-body text-caption text-steel-500">{selected.details}</p></>}
              </div>
              {/* Values */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3 text-center"><p className="label">Estimado</p><p className="mt-1 font-display text-h3 text-arctic">{selected.estimatedValue ? formatGs(selected.estimatedValue) : '—'}</p></div>
                <div className="card p-3 text-center"><p className="label">Final</p><p className="mt-1 font-display text-h3 text-[#48BB78]">{selected.finalValue ? formatGs(selected.finalValue) : '—'}</p></div>
              </div>
              {selected.estimatedDuration && <div className="flex items-center gap-2 font-body text-body-sm text-steel-300"><Clock className="h-4 w-4 text-steel-500" /> Duracion estimada: <span className="text-arctic">{selected.estimatedDuration}</span></div>}
              {selected.scheduledDate && <div className="flex items-center gap-2 font-body text-body-sm text-steel-300"><Calendar className="h-4 w-4 text-steel-500" /> Fecha programada: <span className="text-arctic">{selected.scheduledDate}</span></div>}
              {/* Notes */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-h4 text-arctic"><MessageSquare className="h-4 w-4 text-blue-bright" /> Seguimiento</h3>
                {selected.notes.length > 0 && <div className="mb-3 space-y-2">{selected.notes.map((n) => (<div key={n.id} className="rounded-md border border-steel-900/30 bg-carbon p-3"><p className="font-body text-body-sm text-steel-300">{n.text}</p><p className="mt-1 font-mono text-[0.6rem] text-steel-700">{formatDate(n.createdAt)}</p></div>))}</div>}
                <div className="flex gap-2"><input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Agregar nota de seguimiento..." className="input flex-1" onKeyDown={(e) => e.key === 'Enter' && addNote()} /><button onClick={addNote} disabled={addingNote || !newNote.trim()} className="btn-primary shrink-0 px-3 disabled:opacity-50">{addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div>
              </div>
              <p className="font-mono text-[0.6rem] text-steel-700">Creado: {formatDate(selected.createdAt)} | Actualizado: {formatDate(selected.updatedAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && <CreatePresupuestoModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchData(); }} />}
    </div>
  );
}

function CreatePresupuestoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ customerName: '', customerEmail: '', customerPhone: '', customerCompany: '', customerAddress: '', serviceTitle: '', serviceType: 'mantenimiento', description: '', estimatedValue: '', estimatedDuration: '', priority: 'media' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await fetch('/api/presupuestos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customer: { name: f.customerName, email: f.customerEmail, phone: f.customerPhone, company: f.customerCompany, address: f.customerAddress },
      serviceTitle: f.serviceTitle, serviceType: f.serviceType, description: f.description,
      estimatedValue: f.estimatedValue ? Number(f.estimatedValue) : null, estimatedDuration: f.estimatedDuration, priority: f.priority, source: 'admin',
    }) });
    setSaving(false); onCreated();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
        <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
          <h2 className="font-display text-h2 text-arctic">Nueva solicitud de presupuesto</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="card p-4"><h3 className="mb-3 font-display text-h4 text-arctic">Servicio solicitado</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Servicio (ej: Instalacion electrica) *" value={f.serviceTitle} onChange={(e) => setF({ ...f, serviceTitle: e.target.value })} className="input col-span-2" required />
              <select value={f.serviceType} onChange={(e) => setF({ ...f, serviceType: e.target.value })} className="input"><option value="mantenimiento">Mantenimiento</option><option value="civil">Construccion civil</option><option value="metalurgica">Metalurgica</option><option value="otro">Otro</option></select>
              <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className="input"><option value="baja">Prioridad baja</option><option value="media">Prioridad media</option><option value="alta">Prioridad alta</option><option value="urgente">Urgente</option></select>
            </div>
            <textarea placeholder="Descripcion del servicio requerido" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="input mt-3" rows={3} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input type="number" placeholder="Valor estimado (Gs.)" value={f.estimatedValue} onChange={(e) => setF({ ...f, estimatedValue: e.target.value })} className="input font-mono" />
              <input type="text" placeholder="Duracion estimada" value={f.estimatedDuration} onChange={(e) => setF({ ...f, estimatedDuration: e.target.value })} className="input" />
            </div>
          </div>
          <div className="card p-4"><h3 className="mb-3 font-display text-h4 text-arctic">Datos del cliente</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nombre *" value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} className="input" required />
              <input type="text" placeholder="Empresa" value={f.customerCompany} onChange={(e) => setF({ ...f, customerCompany: e.target.value })} className="input" />
              <input type="email" placeholder="Email" value={f.customerEmail} onChange={(e) => setF({ ...f, customerEmail: e.target.value })} className="input" />
              <input type="text" placeholder="Telefono" value={f.customerPhone} onChange={(e) => setF({ ...f, customerPhone: e.target.value })} className="input" />
              <input type="text" placeholder="Direccion" value={f.customerAddress} onChange={(e) => setF({ ...f, customerAddress: e.target.value })} className="input col-span-2" />
            </div>
          </div>
          <button type="submit" disabled={saving || !f.customerName || !f.serviceTitle} className="btn-primary w-full justify-center gap-2 py-3">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : <><FileText className="h-4 w-4" />Crear presupuesto</>}
          </button>
        </form>
      </div>
    </div>
  );
}
