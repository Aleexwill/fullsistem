'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, RefreshCw, Plus, Trash2, X, Send, User, Mail, Phone, MessageSquare,
  Clock, ChevronRight, AlertTriangle, Star, Loader2, Users, LayoutGrid, List,
  Building, ArrowRight, CheckCircle2, XCircle, DollarSign, Tag, Calendar,
  PhoneCall, MessageCircle, Video, CheckSquare, Square, MoreHorizontal, Sparkles,
  TrendingUp, Eye, Edit3, Globe, UserPlus,
} from 'lucide-react';

interface Activity { id: string; type: string; text: string; metadata?: Record<string, string>; createdAt: string; }
interface Task { id: string; text: string; dueDate: string; completed: boolean; createdAt: string; }
interface Lead {
  id: string; status: string; priority: string; source: string;
  customer: { name: string; email: string; phone: string; company: string; position: string; avatar: string };
  subject: string; message: string; serviceInterest: string; estimatedValue: number | null;
  tags: string[]; activities: Activity[]; tasks: Task[]; notes: { id: string; text: string; createdAt: string }[];
  assignedTo: string; lastContactedAt: string; nextFollowUp: string; lostReason: string; leadType: string;
  createdAt: string; updatedAt: string;
}

const PIPELINE: { key: string; label: string; color: string; bg: string; border: string }[] = [
  { key: 'new', label: 'Nuevos', color: 'text-blue-bright', bg: 'bg-blue-muted', border: 'border-blue-bright/30' },
  { key: 'contacted', label: 'Contactados', color: 'text-[#38BDF8]', bg: 'bg-[#0C2D48]', border: 'border-[#38BDF8]/30' },
  { key: 'in_progress', label: 'En progreso', color: 'text-orange-bright', bg: 'bg-orange-muted', border: 'border-orange-bright/30' },
  { key: 'quoted', label: 'Cotizados', color: 'text-yellow-bright', bg: 'bg-yellow-muted', border: 'border-yellow-bright/30' },
  { key: 'negotiation', label: 'Negociacion', color: 'text-[#A78BFA]', bg: 'bg-[#2D1B69]', border: 'border-[#A78BFA]/30' },
  { key: 'converted', label: 'Ganados', color: 'text-[#48BB78]', bg: 'bg-[#1A3D2A]', border: 'border-[#48BB78]/30' },
  { key: 'lost', label: 'Perdidos', color: 'text-[#FC8181]', bg: 'bg-[#3D1A1A]', border: 'border-[#FC8181]/30' },
];

const PRIORITY_MAP: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: 'Baja', color: 'text-steel-500', dot: 'bg-steel-500' },
  medium: { label: 'Media', color: 'text-yellow-bright', dot: 'bg-yellow-bright' },
  high: { label: 'Alta', color: 'text-orange', dot: 'bg-orange' },
  urgent: { label: 'Urgente', color: 'text-[#FC8181]', dot: 'bg-[#FC8181]' },
};

const SOURCE_MAP: Record<string, { label: string; icon: any }> = {
  contact_form: { label: 'Formulario', icon: Globe },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  phone: { label: 'Telefono', icon: Phone },
  referral: { label: 'Referido', icon: UserPlus },
  walk_in: { label: 'Presencial', icon: User },
  social_media: { label: 'Redes', icon: Globe },
  website: { label: 'Sitio web', icon: Globe },
  other: { label: 'Otro', icon: Star },
};

const ACTIVITY_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  note: { icon: Edit3, color: 'text-blue-bright', bg: 'bg-blue-muted' },
  status_change: { icon: ArrowRight, color: 'text-orange-bright', bg: 'bg-orange-muted' },
  call: { icon: PhoneCall, color: 'text-[#48BB78]', bg: 'bg-[#1A3D2A]' },
  email: { icon: Mail, color: 'text-[#38BDF8]', bg: 'bg-[#0C2D48]' },
  whatsapp: { icon: MessageCircle, color: 'text-[#25D366]', bg: 'bg-[#0D2E1A]' },
  meeting: { icon: Video, color: 'text-[#A78BFA]', bg: 'bg-[#2D1B69]' },
  task: { icon: CheckSquare, color: 'text-yellow-bright', bg: 'bg-yellow-muted' },
  system: { icon: Sparkles, color: 'text-steel-500', bg: 'bg-steel-900' },
};

const formatGs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const timeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; const dy = Math.floor(h / 24); return dy < 30 ? `${dy}d` : `${Math.floor(dy / 30)}mes`; };
const getInitials = (n: string) => n.split(' ').map((w) => w[0]).join('').toUpperCase().substring(0, 2);
const AVATAR_COLORS = ['bg-blue-muted', 'bg-orange-muted', 'bg-[#1A3D2A]', 'bg-[#2D1B69]', 'bg-[#0C2D48]', 'bg-[#3D1A1A]'];
const getAvatarColor = (name: string) => AVATAR_COLORS[name.length % AVATAR_COLORS.length];

export default function AdminLeadsCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [detailTab, setDetailTab] = useState<'timeline' | 'notes' | 'tasks' | 'info'>('timeline');
  const [newNote, setNewNote] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [actType, setActType] = useState<string>('note');
  const [actText, setActText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    fetch(`/api/leads?${p}`).then((r) => r.json()).then((d) => { setLeads(d.leads || []); setLoading(false); }).catch(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const api = async (id: string, body: any) => {
    setSaving(true);
    const res = await fetch(`/api/leads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { const u = await res.json(); setSelected(u); fetchLeads(); }
    setSaving(false);
    return res;
  };

  const moveToStage = (id: string, status: string) => api(id, { status });
  const del = async (id: string) => { if (!confirm('Eliminar lead?')) return; await fetch(`/api/leads/${id}`, { method: 'DELETE' }); fetchLeads(); if (selected?.id === id) setSelected(null); };

  const addNote = async () => { if (!selected || !newNote.trim()) return; await api(selected.id, { _addNote: newNote.trim() }); setNewNote(''); };
  const logActivity = async () => { if (!selected || !actText.trim()) return; await api(selected.id, { _addActivity: { type: actType, text: actText.trim() } }); setActText(''); };
  const addTask = async () => { if (!selected || !newTaskText.trim()) return; await api(selected.id, { _addTask: { text: newTaskText.trim() } }); setNewTaskText(''); };
  const toggleTask = async (taskId: string) => { if (!selected) return; await api(selected.id, { _toggleTask: taskId }); };

  const pipelineStats = PIPELINE.map((stage) => {
    const stageLeads = leads.filter((l) => l.status === stage.key);
    const value = stageLeads.reduce((a, l) => a + (l.estimatedValue || 0), 0);
    return { ...stage, count: stageLeads.length, value };
  });
  const totalValue = leads.reduce((a, l) => a + (l.estimatedValue || 0), 0);
  const filteredLeads = leads.filter((l) => !search || l.customer.name.toLowerCase().includes(search.toLowerCase()) || l.subject.toLowerCase().includes(search.toLowerCase()) || l.customer.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 border-b border-steel-900/40 bg-carbon-light px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-h1 uppercase text-arctic">CRM Leads</h1>
            <p className="mt-0.5 font-body text-caption text-steel-500">{leads.length} leads — Pipeline: {formatGs(totalValue)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" /><input type="text" placeholder="Buscar leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="input h-9 pl-9 text-body-sm" style={{ minWidth: 200 }} /></div>
            <div className="flex rounded-md border border-steel-900/40">
              <button onClick={() => setView('kanban')} className={`flex items-center gap-1 px-3 py-1.5 text-caption transition-colors ${view === 'kanban' ? 'bg-blue-muted text-blue-bright' : 'text-steel-500 hover:text-arctic'}`}><LayoutGrid className="h-3.5 w-3.5" />Kanban</button>
              <button onClick={() => setView('list')} className={`flex items-center gap-1 px-3 py-1.5 text-caption transition-colors ${view === 'list' ? 'bg-blue-muted text-blue-bright' : 'text-steel-500 hover:text-arctic'}`}><List className="h-3.5 w-3.5" />Lista</button>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary h-9 text-[0.65rem]"><Plus className="h-3.5 w-3.5" />Nuevo lead</button>
            <button onClick={fetchLeads} className="rounded-md border border-steel-900/40 p-2 text-steel-500 hover:text-arctic"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {/* Pipeline summary bar */}
        <div className="mt-3 flex gap-1 overflow-x-auto">
          {pipelineStats.map((s) => (
            <div key={s.key} className={`flex min-w-0 flex-1 items-center gap-2 rounded-md border ${s.border} px-3 py-2 ${s.bg}`}>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-body text-[0.6rem] font-medium ${s.color}`}>{s.label}</p>
                <p className="font-display text-h4 text-arctic">{s.count}</p>
              </div>
              {s.value > 0 && <p className="font-mono text-[0.55rem] text-steel-500 whitespace-nowrap">{formatGs(s.value)}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <div className={`flex-1 overflow-auto ${selected ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-bright" /></div>
          ) : view === 'kanban' ? (
            /* ====== KANBAN VIEW ====== */
            <div className="flex h-full gap-2 overflow-x-auto p-4">
              {PIPELINE.map((stage) => {
                const stageLeads = filteredLeads.filter((l) => l.status === stage.key);
                return (
                  <div key={stage.key} className="flex w-[260px] shrink-0 flex-col rounded-lg bg-carbon-light/50">
                    <div className={`flex items-center justify-between border-b px-3 py-2.5 ${stage.border}`}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${stage.bg.replace('bg-', 'bg-').includes('[') ? stage.bg : ''}`} style={{ backgroundColor: stage.color.includes('[') ? stage.color.replace('text-[', '').replace(']', '') : undefined }} />
                        <span className={`font-body text-caption font-semibold uppercase ${stage.color}`}>{stage.label}</span>
                      </div>
                      <span className="rounded-full bg-steel-900 px-2 py-0.5 font-mono text-[0.55rem] text-steel-500">{stageLeads.length}</span>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto p-2">
                      {stageLeads.map((lead) => {
                        const pr = PRIORITY_MAP[lead.priority] || PRIORITY_MAP.medium;
                        return (
                          <div key={lead.id} onClick={() => { setSelected(lead); setDetailTab('timeline'); }} className="cursor-pointer rounded-md border border-steel-900/40 bg-carbon p-3 transition-all hover:border-steel-700 hover:shadow-card">
                            <div className="mb-2 flex items-center gap-2">
                              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${getAvatarColor(lead.customer.name)} font-display text-[0.55rem] font-bold text-arctic`}>{getInitials(lead.customer.name)}</div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-body text-body-sm font-medium text-arctic">{lead.customer.name}</p>
                                {lead.customer.company && <p className="truncate font-body text-[0.6rem] text-steel-500">{lead.customer.company}</p>}
                              </div>
                              <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${pr.dot}`} title={pr.label} />
                            </div>
                            <p className="mb-2 truncate font-body text-caption text-steel-300">{lead.subject}</p>
                            <div className="flex flex-wrap gap-1">
                              {lead.tags?.slice(0, 2).map((t) => <span key={t} className="rounded bg-steel-900 px-1.5 py-0.5 font-mono text-[0.5rem] text-steel-300">{t}</span>)}
                              {lead.estimatedValue ? <span className="rounded bg-[#1A3D2A] px-1.5 py-0.5 font-mono text-[0.5rem] text-[#48BB78]">{formatGs(lead.estimatedValue)}</span> : null}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="font-mono text-[0.5rem] text-steel-700">{timeAgo(lead.updatedAt)}</span>
                              <div className="flex items-center gap-1">
                                {lead.tasks?.some((t) => !t.completed) && <CheckSquare className="h-3 w-3 text-yellow-bright" />}
                                {lead.notes?.length > 0 && <span className="flex items-center gap-0.5 font-mono text-[0.5rem] text-steel-700"><MessageSquare className="h-2.5 w-2.5" />{lead.notes.length}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {stageLeads.length === 0 && <p className="py-6 text-center font-body text-[0.6rem] text-steel-700">Sin leads</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ====== LIST VIEW ====== */
            <div className="p-4">
              <div className="space-y-1">
                {filteredLeads.map((lead) => {
                  const stage = PIPELINE.find((s) => s.key === lead.status) || PIPELINE[0];
                  const pr = PRIORITY_MAP[lead.priority] || PRIORITY_MAP.medium;
                  return (
                    <div key={lead.id} onClick={() => { setSelected(lead); setDetailTab('timeline'); }} className="flex cursor-pointer items-center gap-3 rounded-md border border-steel-900/30 bg-carbon-light p-3 transition-all hover:border-steel-700">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getAvatarColor(lead.customer.name)} font-display text-caption font-bold text-arctic`}>{getInitials(lead.customer.name)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><p className="truncate font-body text-body-sm font-medium text-arctic">{lead.customer.name}</p><div className={`h-1.5 w-1.5 rounded-full ${pr.dot}`} /></div>
                        <p className="truncate font-body text-caption text-steel-500">{lead.subject}{lead.customer.company ? ` — ${lead.customer.company}` : ''}</p>
                      </div>
                      <div className="hidden shrink-0 md:flex md:items-center md:gap-2">{lead.tags?.slice(0, 2).map((t) => <span key={t} className="rounded bg-steel-900 px-1.5 py-0.5 font-mono text-[0.5rem] text-steel-300">{t}</span>)}</div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.55rem] font-medium ${stage.color} ${stage.bg}`}>{stage.label}</span>
                      {lead.estimatedValue ? <span className="hidden shrink-0 font-mono text-caption text-[#48BB78] md:block">{formatGs(lead.estimatedValue)}</span> : null}
                      <span className="shrink-0 font-mono text-[0.55rem] text-steel-700">{timeAgo(lead.updatedAt)}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-steel-700" />
                    </div>
                  );
                })}
                {filteredLeads.length === 0 && <div className="card p-12 text-center"><Users className="mx-auto h-12 w-12 text-steel-700" /><h3 className="mt-4 font-display text-h3 text-arctic">No hay leads</h3><p className="mt-2 font-body text-body-sm text-steel-500">Los leads se generan desde el formulario de contacto o puedes crear uno manualmente.</p></div>}
              </div>
            </div>
          )}
        </div>

        {/* ====== DETAIL PANEL ====== */}
        {selected && (
          <div className="w-full border-l border-steel-900/40 bg-carbon-light lg:w-[420px] xl:w-[480px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 border-b border-steel-900/40 px-5 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${getAvatarColor(selected.customer.name)} font-display text-h4 font-bold text-arctic`}>{getInitials(selected.customer.name)}</div>
                  <div>
                    <h2 className="font-display text-h3 text-arctic">{selected.customer.name}</h2>
                    <div className="flex items-center gap-2 font-body text-caption text-steel-500">
                      {selected.customer.company && <span className="flex items-center gap-0.5"><Building className="h-3 w-3" />{selected.customer.company}</span>}
                      {selected.customer.position && <span>· {selected.customer.position}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-md p-1 text-steel-500 hover:bg-steel-900 hover:text-arctic"><X className="h-5 w-5" /></button>
              </div>

              {/* Quick contact buttons */}
              <div className="mt-3 flex gap-2">
                {selected.customer.phone && <a href={`https://wa.me/${selected.customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={() => api(selected.id, { _addActivity: { type: 'whatsapp', text: 'Mensaje de WhatsApp enviado' } })} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#25D366]/10 py-2 font-body text-[0.6rem] font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>}
                {selected.customer.email && <a href={`mailto:${selected.customer.email}`} onClick={() => api(selected.id, { _addActivity: { type: 'email', text: `Email enviado a ${selected.customer.email}` } })} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-muted py-2 font-body text-[0.6rem] font-medium text-blue-bright transition-colors hover:bg-blue-muted/80"><Mail className="h-3.5 w-3.5" />Email</a>}
                {selected.customer.phone && <a href={`tel:${selected.customer.phone}`} onClick={() => api(selected.id, { _addActivity: { type: 'call', text: `Llamada a ${selected.customer.phone}` } })} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#1A3D2A] py-2 font-body text-[0.6rem] font-medium text-[#48BB78] transition-colors hover:bg-[#1A3D2A]/80"><PhoneCall className="h-3.5 w-3.5" />Llamar</a>}
              </div>

              {/* Pipeline stage selector */}
              <div className="mt-3 flex gap-1 overflow-x-auto">
                {PIPELINE.map((s) => (
                  <button key={s.key} onClick={() => moveToStage(selected.id, s.key)} className={`whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[0.55rem] font-medium transition-all ${selected.status === s.key ? `${s.bg} ${s.color} ring-1 ring-current` : 'bg-steel-900 text-steel-500 hover:text-steel-300'}`}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="shrink-0 flex border-b border-steel-900/40">
              {[
                { key: 'timeline', label: 'Timeline', icon: Clock },
                { key: 'notes', label: 'Notas', icon: MessageSquare },
                { key: 'tasks', label: 'Tareas', icon: CheckSquare },
                { key: 'info', label: 'Info', icon: User },
              ].map((tab) => { const Icon = tab.icon; return (
                <button key={tab.key} onClick={() => setDetailTab(tab.key as any)} className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 font-body text-[0.6rem] font-medium uppercase tracking-[0.06em] transition-colors ${detailTab === tab.key ? 'border-b-2 border-blue-bright text-blue-bright' : 'text-steel-500 hover:text-steel-300'}`}><Icon className="h-3.5 w-3.5" />{tab.label}</button>
              ); })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {detailTab === 'timeline' && (
                <div className="space-y-3">
                  {/* Log activity form */}
                  <div className="rounded-lg border border-steel-900/40 bg-carbon p-3">
                    <div className="mb-2 flex gap-1.5">
                      {[
                        { key: 'note', label: 'Nota', icon: Edit3 },
                        { key: 'call', label: 'Llamada', icon: PhoneCall },
                        { key: 'email', label: 'Email', icon: Mail },
                        { key: 'meeting', label: 'Reunion', icon: Video },
                      ].map((a) => { const Icon = a.icon; return (
                        <button key={a.key} onClick={() => setActType(a.key)} className={`flex items-center gap-1 rounded px-2 py-1 text-[0.55rem] font-medium transition-colors ${actType === a.key ? 'bg-blue-muted text-blue-bright' : 'text-steel-500 hover:text-steel-300'}`}><Icon className="h-3 w-3" />{a.label}</button>
                      ); })}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={actText} onChange={(e) => setActText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && logActivity()} placeholder={`Registrar ${actType === 'note' ? 'nota' : actType === 'call' ? 'llamada' : actType === 'email' ? 'email' : 'reunion'}...`} className="input h-8 flex-1 text-body-sm" />
                      <button onClick={logActivity} disabled={saving || !actText.trim()} className="btn-primary h-8 shrink-0 px-3 text-[0.6rem] disabled:opacity-50">{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}</button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative space-y-0">
                    <div className="absolute left-[15px] top-0 h-full w-px bg-steel-900/60" />
                    {[...(selected.activities || [])].reverse().map((act) => {
                      const cfg = ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.system;
                      const Icon = cfg.icon;
                      return (
                        <div key={act.id} className="relative flex gap-3 pb-3">
                          <div className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full ${cfg.bg}`}><Icon className={`h-3.5 w-3.5 ${cfg.color}`} /></div>
                          <div className="min-w-0 flex-1 pt-1">
                            <p className="font-body text-body-sm text-steel-300">{act.text}</p>
                            <p className="mt-0.5 font-mono text-[0.55rem] text-steel-700">{formatDate(act.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                    {(!selected.activities || selected.activities.length === 0) && <p className="py-6 text-center font-body text-caption text-steel-500">Sin actividades registradas</p>}
                  </div>
                </div>
              )}

              {detailTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex gap-2"><input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} placeholder="Agregar nota..." className="input h-9 flex-1 text-body-sm" /><button onClick={addNote} disabled={saving || !newNote.trim()} className="btn-primary h-9 shrink-0 px-3 disabled:opacity-50"><Send className="h-3.5 w-3.5" /></button></div>
                  {selected.notes?.length > 0 ? [...selected.notes].reverse().map((n) => (
                    <div key={n.id} className="rounded-md border border-steel-900/30 bg-carbon p-3"><p className="font-body text-body-sm text-steel-300">{n.text}</p><p className="mt-1 font-mono text-[0.55rem] text-steel-700">{formatDate(n.createdAt)}</p></div>
                  )) : <p className="py-6 text-center font-body text-caption text-steel-500">Sin notas</p>}
                </div>
              )}

              {detailTab === 'tasks' && (
                <div className="space-y-3">
                  <div className="flex gap-2"><input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="Nueva tarea..." className="input h-9 flex-1 text-body-sm" /><button onClick={addTask} disabled={saving || !newTaskText.trim()} className="btn-primary h-9 shrink-0 px-3 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /></button></div>
                  {selected.tasks?.length > 0 ? selected.tasks.map((t) => (
                    <div key={t.id} onClick={() => toggleTask(t.id)} className="flex cursor-pointer items-start gap-2.5 rounded-md border border-steel-900/30 bg-carbon p-3 transition-colors hover:border-steel-700">
                      {t.completed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#48BB78]" /> : <Square className="mt-0.5 h-4 w-4 shrink-0 text-steel-500" />}
                      <div className="flex-1"><p className={`font-body text-body-sm ${t.completed ? 'text-steel-500 line-through' : 'text-arctic'}`}>{t.text}</p>{t.dueDate && <p className="mt-0.5 flex items-center gap-1 font-mono text-[0.55rem] text-steel-700"><Calendar className="h-2.5 w-2.5" />{t.dueDate}</p>}</div>
                    </div>
                  )) : <p className="py-6 text-center font-body text-caption text-steel-500">Sin tareas</p>}
                </div>
              )}

              {detailTab === 'info' && (
                <div className="space-y-4">
                  <div className="card p-4 space-y-2">
                    <h3 className="font-display text-h4 text-arctic">Contacto</h3>
                    {selected.customer.email && <p className="flex items-center gap-2 font-body text-body-sm text-steel-300"><Mail className="h-3.5 w-3.5 text-steel-500" />{selected.customer.email}</p>}
                    {selected.customer.phone && <p className="flex items-center gap-2 font-body text-body-sm text-steel-300"><Phone className="h-3.5 w-3.5 text-steel-500" />{selected.customer.phone}</p>}
                    {selected.customer.company && <p className="flex items-center gap-2 font-body text-body-sm text-steel-300"><Building className="h-3.5 w-3.5 text-steel-500" />{selected.customer.company}</p>}
                  </div>
                  <div className="card p-4 space-y-2">
                    <h3 className="font-display text-h4 text-arctic">Consulta</h3>
                    <p className="font-body text-body-sm font-medium text-arctic">{selected.subject}</p>
                    {selected.message && <p className="whitespace-pre-line font-body text-body-sm text-steel-300">{selected.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-carbon p-3"><p className="font-body text-[0.6rem] text-steel-500">Fuente</p><p className="mt-0.5 font-body text-body-sm text-arctic">{SOURCE_MAP[selected.source]?.label || selected.source}</p></div>
                    <div className="rounded-md bg-carbon p-3"><p className="font-body text-[0.6rem] text-steel-500">Prioridad</p><select value={selected.priority} onChange={(e) => api(selected.id, { priority: e.target.value })} className="mt-0.5 w-full bg-transparent font-body text-body-sm text-arctic outline-none">{Object.entries(PRIORITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                    <div className="rounded-md bg-carbon p-3"><p className="font-body text-[0.6rem] text-steel-500">Valor estimado</p><p className="mt-0.5 font-body text-body-sm text-[#48BB78]">{selected.estimatedValue ? formatGs(selected.estimatedValue) : '—'}</p></div>
                    <div className="rounded-md bg-carbon p-3"><p className="font-body text-[0.6rem] text-steel-500">Creado</p><p className="mt-0.5 font-mono text-caption text-arctic">{formatDate(selected.createdAt)}</p></div>
                  </div>
                  {selected.tags?.length > 0 && <div className="flex flex-wrap gap-1">{selected.tags.map((t) => <span key={t} className="rounded-full bg-blue-muted px-2.5 py-0.5 font-mono text-[0.55rem] text-blue-bright">{t}</span>)}</div>}
                  <button onClick={() => del(selected.id)} className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[#FC8181]/20 bg-[#3D1A1A]/30 py-2 font-body text-caption text-[#FC8181] transition-colors hover:bg-[#3D1A1A]"><Trash2 className="h-3.5 w-3.5" />Eliminar lead</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {showCreate && <CreateLeadModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchLeads(); }} />}
    </div>
  );
}

function CreateLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: '', email: '', phone: '', company: '', position: '', subject: '', message: '', source: 'other', priority: 'medium', estimatedValue: '', tags: '', leadType: 'general' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customer: { name: f.name, email: f.email, phone: f.phone, company: f.company, position: f.position },
      subject: f.subject || 'Nuevo lead', message: f.message, source: f.source, priority: f.priority,
      estimatedValue: f.estimatedValue ? Number(f.estimatedValue) : null,
      tags: f.tags ? f.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      serviceInterest: f.subject, leadType: f.leadType,
    }) });
    setSaving(false); onCreated();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
        <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
          <h2 className="font-display text-h2 text-arctic">Nuevo lead</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nombre *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" required />
            <input type="text" placeholder="Empresa" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className="input" />
            <input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="input" />
            <input type="text" placeholder="Telefono" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="input" />
          </div>
          <input type="text" placeholder="Asunto / Interes *" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className="input" required />
          <textarea placeholder="Mensaje o detalle" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className="input" rows={3} />
          <div className="grid grid-cols-3 gap-3">
            <select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} className="input"><option value="other">Fuente...</option><option value="contact_form">Formulario</option><option value="whatsapp">WhatsApp</option><option value="phone">Telefono</option><option value="referral">Referido</option><option value="walk_in">Presencial</option><option value="social_media">Redes</option></select>
            <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className="input"><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="urgent">Urgente</option></select>
            <input type="number" placeholder="Valor (Gs.)" value={f.estimatedValue} onChange={(e) => setF({ ...f, estimatedValue: e.target.value })} className="input font-mono" />
          </div>
          <input type="text" placeholder="Tags (separados por coma)" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} className="input" />
          <button type="submit" disabled={saving || !f.name || !f.subject} className="btn-primary w-full justify-center py-3">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : <><UserPlus className="h-4 w-4" />Crear lead</>}</button>
        </form>
      </div>
    </div>
  );
}
