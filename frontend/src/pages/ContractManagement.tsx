import { useState, useMemo, useEffect } from 'react'
import {
  contractService,
  ServiceContract, ContractFacility, ContractPersonnel,
  WeeklyInspection, WorkPlan, WorkTask, WorkConfirmation,
  ContractStatus, FacilityType, PersonnelRole, InspectionItemStatus,
  TaskPriority, TaskStatus, WeekDay,
  CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS,
  FACILITY_TYPE_LABELS, PERSONNEL_ROLE_LABELS,
  INSPECTION_ITEM_STATUS_LABELS, INSPECTION_ITEM_STATUS_COLORS,
  TASK_PRIORITY_COLORS, WEEKDAY_LABELS,
  ScopeItem, FacilityInspectionResult, InspectionItemResult,
  ScheduledService, ServiceCategory, ServiceFrequency, DailyChecklist, DailyReport,
  SERVICE_CATEGORY_LABELS, SERVICE_FREQUENCY_LABELS,
  DAILY_CHECK_STATUS_LABELS, DAILY_CHECK_STATUS_COLORS,
  DailyCheckStatus, PersonnelSchedule,
} from '../services/contractService'
import {
  Building2, Plus, Search, X, Save, Eye, Edit2, Trash2,
  CheckCircle, XCircle, AlertTriangle, FileText, Users,
  Calendar, Clock, ChevronRight, ChevronDown, Shield,
  Star, ClipboardCheck, ClipboardList, MapPin, UserPlus,
  UserMinus, RefreshCw, ArrowRight, Printer, Briefcase,
  BarChart3, TrendingUp, AlertOctagon, Check, Layers,
  Play, Pause, ChevronLeft, Hash, Wrench, Sparkles,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { employeesService, Employee } from '../services/employees'

const fmtPYG = (v: number) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(v)
const fmtMoney = (v: number, c: string) => c === 'USD' ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : fmtPYG(v)

export default function ContractManagement() {
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { contractService.initializeDemoData() }, [])
  const refresh = () => setRefreshKey(k => k + 1)

  if (view === 'detail' && selectedContractId) {
    return <ContractDetail contractId={selectedContractId} onBack={() => { setView('list'); setSelectedContractId(null) }} onRefresh={refresh} key={refreshKey} />
  }

  return <ContractList onSelect={(id) => { setSelectedContractId(id); setView('detail') }} onRefresh={refresh} key={refreshKey} />
}

// ==================== LISTA DE CONTRATOS ====================

function ContractList({ onSelect, onRefresh }: { onSelect: (id: string) => void; onRefresh: () => void }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all')
  const [showNew, setShowNew] = useState(false)
  const [rk, setRk] = useState(0)

  const contracts = useMemo(() => contractService.getContracts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
  }), [search, statusFilter, rk])

  const stats = useMemo(() => ({
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    monthly: contracts.filter(c => c.status === 'active').reduce((s, c) => s + c.monthly_value, 0),
  }), [contracts])

  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Briefcase size={28} className="text-indigo-600" />Gestión de Contratos de Servicio</h1>
          <p className="text-sm text-gray-500 mt-1">Administra contratos, personal, inspecciones y planes de trabajo</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-lg"><Plus size={16} />Nuevo Contrato</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5"><div className="text-xs text-gray-500 mb-1">Total Contratos</div><div className="text-3xl font-bold">{stats.total}</div></div>
        <div className="bg-white rounded-xl border-2 border-green-200 p-5"><div className="text-xs text-green-600 mb-1">Contratos Activos</div><div className="text-3xl font-bold text-green-700">{stats.active}</div></div>
        <div className="bg-white rounded-xl border p-5"><div className="text-xs text-gray-500 mb-1">Facturación Mensual Activa</div><div className="text-2xl font-bold text-indigo-700">{fmtPYG(stats.monthly)}</div></div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por título, cliente, N° contrato..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Todos los estados</option>
          {Object.entries(CONTRACT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {contracts.map(c => {
          const dash = contractService.getContractDashboard(c.id)
          return (
            <div key={c.id} className="bg-white rounded-xl border hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer p-5" onClick={() => onSelect(c.id)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-gray-400">{c.contract_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CONTRACT_STATUS_COLORS[c.status]}`}>{CONTRACT_STATUS_LABELS[c.status]}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{c.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{c.client_name} · {c.client_contact}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-indigo-700">{fmtMoney(c.monthly_value, c.currency)}<span className="text-xs text-gray-400 font-normal">/mes</span></div>
                  <div className="text-xs text-gray-400 mt-1">{c.start_date} → {c.end_date}</div>
                </div>
              </div>
              <div className="flex gap-6 mt-3 pt-3 border-t text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin size={12} />{dash.activeFacilities} dependencias</span>
                <span className="flex items-center gap-1"><Users size={12} />{dash.activePersonnel} personal activo</span>
                <span className="flex items-center gap-1"><ClipboardCheck size={12} />{dash.totalInspections} inspecciones</span>
                <span className="flex items-center gap-1"><CheckCircle size={12} />{dash.taskCompletionRate.toFixed(0)}% tareas completadas</span>
                {dash.avgRating > 0 && <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" />{dash.avgRating.toFixed(1)} calidad</span>}
                {dash.daysToEnd <= 30 && dash.daysToEnd > 0 && <span className="text-orange-600 font-medium flex items-center gap-1"><AlertTriangle size={12} />Vence en {dash.daysToEnd} días</span>}
              </div>
            </div>
          )
        })}
        {contracts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Briefcase size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-500">Sin contratos</h3>
            <p className="text-sm text-gray-400">Crea tu primer contrato de servicio</p>
          </div>
        )}
      </div>

      {showNew && <NewContractModal onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); localRefresh() }} />}
    </div>
  )
}

// ==================== DETALLE DE CONTRATO ====================

type ContractTab = 'dashboard' | 'scope' | 'services' | 'facilities' | 'personnel' | 'schedules' | 'daily_control' | 'inspections' | 'workplans' | 'confirmations' | 'reports'

function ContractDetail({ contractId, onBack, onRefresh }: { contractId: string; onBack: () => void; onRefresh: () => void }) {
  const [activeTab, setActiveTab] = useState<ContractTab>('dashboard')
  const [rk, setRk] = useState(0)
  const contract = useMemo(() => contractService.getContract(contractId), [contractId, rk])
  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  if (!contract) return <div className="p-6"><button onClick={onBack} className="flex items-center gap-1 text-gray-500"><ChevronLeft size={16} />Volver</button><p className="mt-4">Contrato no encontrado</p></div>

  const tabs: { id: ContractTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'scope', label: 'Alcance', icon: ClipboardList },
    { id: 'services', label: 'Servicios', icon: Sparkles },
    { id: 'facilities', label: 'Dependencias', icon: MapPin },
    { id: 'personnel', label: 'Personal', icon: Users },
    { id: 'schedules', label: 'Horarios', icon: Clock },
    { id: 'daily_control', label: 'Control Diario', icon: Check },
    { id: 'inspections', label: 'Inspecciones', icon: ClipboardCheck },
    { id: 'workplans', label: 'Planes de Trabajo', icon: Layers },
    { id: 'confirmations', label: 'Confirmaciones', icon: CheckCircle },
    { id: 'reports', label: 'Informes', icon: FileText },
  ]

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-2"><ChevronLeft size={16} />Volver a contratos</button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">{contract.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[contract.status]}`}>{CONTRACT_STATUS_LABELS[contract.status]}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{contract.contract_number} · {contract.client_name} · {contract.client_contact}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-700">{fmtMoney(contract.monthly_value, contract.currency)}<span className="text-xs text-gray-400 font-normal">/mes</span></div>
          <div className="text-xs text-gray-400">{contract.start_date} → {contract.end_date}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto pb-px">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard' && <DashboardTab contractId={contractId} key={rk} />}
      {activeTab === 'scope' && <ScopeTab contract={contract} onRefresh={localRefresh} />}
      {activeTab === 'services' && <ServicesTab contractId={contractId} onRefresh={localRefresh} key={rk} />}
      {activeTab === 'facilities' && <FacilitiesTab contractId={contractId} onRefresh={localRefresh} key={rk} />}
      {activeTab === 'personnel' && <PersonnelTab contractId={contractId} onRefresh={localRefresh} key={rk} />}
      {activeTab === 'schedules' && <SchedulesTab contractId={contractId} key={rk} />}
      {activeTab === 'daily_control' && <DailyControlTab contractId={contractId} onRefresh={localRefresh} key={rk} />}
      {activeTab === 'inspections' && <InspectionsTab contractId={contractId} onRefresh={localRefresh} key={rk} />}
      {activeTab === 'workplans' && <WorkPlansTab contractId={contractId} onRefresh={localRefresh} key={rk} />}
      {activeTab === 'confirmations' && <ConfirmationsTab contractId={contractId} key={rk} />}
      {activeTab === 'reports' && <ReportsTab contractId={contractId} key={rk} />}
    </div>
  )
}

// ==================== DASHBOARD TAB ====================

function DashboardTab({ contractId }: { contractId: string }) {
  const dash = useMemo(() => contractService.getContractDashboard(contractId), [contractId])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-gray-500 mb-1">Dependencias Activas</div><div className="text-2xl font-bold">{dash.activeFacilities}<span className="text-sm text-gray-400 font-normal">/{dash.totalFacilities}</span></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-gray-500 mb-1">Personal Activo</div><div className="text-2xl font-bold">{dash.activePersonnel}<span className="text-sm text-gray-400 font-normal">/{dash.totalPersonnel}</span></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-gray-500 mb-1">Tasa Cumplimiento</div><div className={`text-2xl font-bold ${dash.taskCompletionRate >= 80 ? 'text-green-700' : dash.taskCompletionRate >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>{dash.taskCompletionRate.toFixed(0)}%</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-gray-500 mb-1">Calidad Promedio</div><div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">{dash.avgRating > 0 ? dash.avgRating.toFixed(1) : '-'}<Star size={18} /></div></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <h4 className="font-semibold text-gray-700 mb-3">Resumen de Tareas</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Total generadas</span><span className="font-bold">{dash.totalTasks}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-green-600">Completadas</span><span className="font-bold text-green-700">{dash.completedTasks}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-orange-600">Pendientes</span><span className="font-bold text-orange-700">{dash.pendingTasks}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Confirmaciones</span><span className="font-bold">{dash.totalConfirmations}</span></div>
          </div>
          {dash.totalTasks > 0 && (
            <div className="mt-3 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${dash.taskCompletionRate}%` }} />
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h4 className="font-semibold text-gray-700 mb-3">Estado del Contrato</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Inspecciones realizadas</span><span className="font-bold">{dash.totalInspections}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Días restantes</span><span className={`font-bold ${dash.daysToEnd <= 30 ? 'text-red-700' : dash.daysToEnd <= 90 ? 'text-yellow-700' : 'text-green-700'}`}>{dash.daysToEnd}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Última inspección</span><span className="text-sm">{dash.lastInspection ? new Date(dash.lastInspection.inspection_date).toLocaleDateString('es-PY') : 'Ninguna'}</span></div>
            {dash.contract?.auto_renew && <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-2"><RefreshCw size={12} />Renovación automática activada</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== SCOPE TAB ====================

function ScopeTab({ contract, onRefresh }: { contract: ServiceContract; onRefresh: () => void }) {
  const [items, setItems] = useState<ScopeItem[]>(contract.scope_items)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState<ScopeItem['category']>('limpieza')
  const [newFreq, setNewFreq] = useState<ScopeItem['frequency']>('diario')
  const [editDesc, setEditDesc] = useState('')
  const [editCat, setEditCat] = useState<ScopeItem['category']>('limpieza')
  const [editFreq, setEditFreq] = useState<ScopeItem['frequency']>('diario')
  const [dirty, setDirty] = useState(false)

  const catLabels: Record<string, { label: string; color: string; icon: any }> = {
    limpieza: { label: 'Limpieza', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Sparkles },
    mantenimiento: { label: 'Mantenimiento', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Wrench },
    seguridad: { label: 'Seguridad', color: 'bg-red-50 text-red-700 border-red-200', icon: Shield },
    otro: { label: 'Otros', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: FileText },
  }
  const freqLabels: Record<string, string> = { diario: 'Diario', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual', trimestral: 'Trimestral' }
  const categories: ScopeItem['category'][] = ['limpieza', 'mantenimiento', 'seguridad', 'otro']
  const frequencies: ScopeItem['frequency'][] = ['diario', 'semanal', 'quincenal', 'mensual', 'trimestral']

  const grouped = useMemo(() => {
    const g: Record<string, ScopeItem[]> = { limpieza: [], mantenimiento: [], seguridad: [], otro: [] }
    for (const s of items) { (g[s.category] || g.otro).push(s) }
    return g
  }, [items])

  const toggleIncluded = (id: string) => {
    setItems(prev => prev.map(s => s.id === id ? { ...s, included: !s.included } : s))
    setDirty(true)
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(s => s.id !== id))
    setDirty(true)
  }

  const startEdit = (item: ScopeItem) => {
    setEditingId(item.id)
    setEditDesc(item.description)
    setEditCat(item.category)
    setEditFreq(item.frequency)
  }

  const saveEdit = () => {
    if (!editDesc.trim()) return
    setItems(prev => prev.map(s => s.id === editingId ? { ...s, description: editDesc.trim(), category: editCat, frequency: editFreq } : s))
    setEditingId(null)
    setDirty(true)
  }

  const addItem = () => {
    if (!newDesc.trim()) return
    const newItem: ScopeItem = { id: `scope-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, category: newCat, description: newDesc.trim(), frequency: newFreq, included: true }
    setItems(prev => [...prev, newItem])
    setNewDesc('')
    setShowAdd(false)
    setDirty(true)
  }

  const handleSave = () => {
    contractService.updateContract(contract.id, { scope_items: items })
    setDirty(false)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Alcance del Contrato</h3>
          <p className="text-xs text-gray-500">{items.filter(s => s.included).length} servicios incluidos de {items.length}</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-700 animate-pulse"><Save size={14} />Guardar Cambios</button>}
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700"><Plus size={14} />Agregar Item</button>
        </div>
      </div>

      {/* Inline add form */}
      {showAdd && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-indigo-800 mb-3">Nuevo Item de Alcance</h4>
          <div className="flex gap-3 items-end">
            <div className="flex-1"><label className="text-xs font-medium block mb-1">Descripción *</label><input value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Describe el servicio..." autoFocus /></div>
            <div className="w-40"><label className="text-xs font-medium block mb-1">Categoría</label>
              <select value={newCat} onChange={e => setNewCat(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm">
                {categories.map(c => <option key={c} value={c}>{catLabels[c].label}</option>)}
              </select>
            </div>
            <div className="w-36"><label className="text-xs font-medium block mb-1">Frecuencia</label>
              <select value={newFreq} onChange={e => setNewFreq(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm">
                {frequencies.map(f => <option key={f} value={f}>{freqLabels[f]}</option>)}
              </select>
            </div>
            <button onClick={addItem} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Agregar</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => {
        if (catItems.length === 0) return null
        const ci = catLabels[cat]
        return (
          <div key={cat} className={`rounded-xl border p-4 ${ci.color}`}>
            <h4 className="font-semibold flex items-center gap-2 mb-3"><ci.icon size={16} />{ci.label} <span className="text-xs font-normal opacity-70">({catItems.filter(i => i.included).length}/{catItems.length})</span></h4>
            <div className="space-y-1.5">
              {catItems.map(item => (
                <div key={item.id}>
                  {editingId === item.id ? (
                    <div className="flex gap-2 items-center bg-white rounded-lg p-2 border-2 border-indigo-400">
                      <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm" autoFocus />
                      <select value={editCat} onChange={e => setEditCat(e.target.value as any)} className="px-2 py-1.5 border rounded-lg text-xs w-32">
                        {categories.map(c => <option key={c} value={c}>{catLabels[c].label}</option>)}
                      </select>
                      <select value={editFreq} onChange={e => setEditFreq(e.target.value as any)} className="px-2 py-1.5 border rounded-lg text-xs w-28">
                        {frequencies.map(f => <option key={f} value={f}>{freqLabels[f]}</option>)}
                      </select>
                      <button onClick={saveEdit} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className={`flex items-center justify-between py-1.5 px-3 rounded-lg group ${item.included ? 'bg-white/80' : 'bg-white/40 opacity-60'}`}>
                      <div className="flex items-center gap-2 flex-1">
                        <button onClick={() => toggleIncluded(item.id)} className="flex-shrink-0" title={item.included ? 'Excluir del alcance' : 'Incluir en el alcance'}>
                          {item.included ? <CheckCircle size={16} className="text-green-500 hover:text-green-700" /> : <XCircle size={16} className="text-gray-400 hover:text-green-500" />}
                        </button>
                        <span className="text-sm">{item.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/50">{freqLabels[item.frequency]}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button onClick={() => startEdit(item)} className="p-1 hover:bg-white/50 rounded" title="Editar"><Edit2 size={12} className="text-gray-500" /></button>
                          <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-red-100 rounded" title="Eliminar"><Trash2 size={12} className="text-red-400" /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {contract.special_conditions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h4 className="font-semibold text-yellow-800 text-sm mb-1">Condiciones Especiales</h4>
          <p className="text-sm text-yellow-700">{contract.special_conditions}</p>
        </div>
      )}
    </div>
  )
}

// ==================== FACILITIES TAB ====================

function FacilitiesTab({ contractId, onRefresh }: { contractId: string; onRefresh: () => void }) {
  const [showNew, setShowNew] = useState(false)
  const [rk, setRk] = useState(0)
  const facilities = useMemo(() => contractService.getFacilities(contractId), [contractId, rk])

  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Dependencias / Instalaciones</h3>
        <button onClick={() => setShowNew(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-1"><Plus size={14} />Agregar Dependencia</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {facilities.map(f => (
          <div key={f.id} className={`bg-white rounded-xl border p-4 ${!f.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-800">{f.name}</h4>
                  {!f.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded">Inactivo</span>}
                </div>
                <p className="text-xs text-gray-500">{FACILITY_TYPE_LABELS[f.type]} · Piso {f.floor} · {f.area_sqm}m²</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { contractService.updateFacility(f.id, { is_active: !f.is_active }); localRefresh() }} className="p-1.5 hover:bg-gray-100 rounded" title={f.is_active ? 'Desactivar' : 'Activar'}>
                  {f.is_active ? <Pause size={14} className="text-orange-500" /> : <Play size={14} className="text-green-500" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2">{f.description}</p>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <ClipboardCheck size={10} />{f.inspection_points.length} puntos de inspección
            </div>
          </div>
        ))}
      </div>

      {facilities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Agrega las dependencias del contrato</p>
        </div>
      )}

      {showNew && <NewFacilityModal contractId={contractId} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); localRefresh() }} />}
    </div>
  )
}

// ==================== PERSONNEL TAB ====================

function PersonnelTab({ contractId, onRefresh }: { contractId: string; onRefresh: () => void }) {
  const [showNew, setShowNew] = useState(false)
  const [rk, setRk] = useState(0)
  const personnel = useMemo(() => contractService.getPersonnel(contractId), [contractId, rk])

  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  const roleColors: Record<PersonnelRole, string> = {
    limpieza: 'bg-blue-100 text-blue-700', mantenimiento: 'bg-orange-100 text-orange-700', supervisor: 'bg-purple-100 text-purple-700', ambos: 'bg-teal-100 text-teal-700'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Personal Asignado</h3>
        <button onClick={() => setShowNew(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-1"><UserPlus size={14} />Agregar Personal</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2">
        <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-gray-500 block">Total</span><span className="text-xl font-bold">{personnel.length}</span></div>
        <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-green-600 block">Activos</span><span className="text-xl font-bold text-green-700">{personnel.filter(p => p.is_active).length}</span></div>
        <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-red-600 block">Inactivos</span><span className="text-xl font-bold text-red-700">{personnel.filter(p => !p.is_active).length}</span></div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Documento</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Horario</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Teléfono</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {personnel.map(p => (
              <tr key={p.id} className={`hover:bg-gray-50 ${!p.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{p.full_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.document_number}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[p.role]}`}>{PERSONNEL_ROLE_LABELS[p.role]}</span></td>
                <td className="px-4 py-3 text-xs">{p.schedule}</td>
                <td className="px-4 py-3 text-xs">{p.phone}</td>
                <td className="px-4 py-3 text-center">{p.is_active ? <CheckCircle size={16} className="mx-auto text-green-500" /> : <XCircle size={16} className="mx-auto text-red-400" />}</td>
                <td className="px-4 py-3 text-center">
                  {p.is_active && <button onClick={() => { contractService.deactivatePersonnel(p.id); localRefresh() }} className="p-1 hover:bg-red-50 rounded" title="Dar de baja"><UserMinus size={14} className="text-red-500" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {personnel.length === 0 && <div className="text-center py-12"><Users size={48} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500">Agrega personal al contrato</p></div>}
      </div>

      {showNew && <NewPersonnelModal contractId={contractId} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); localRefresh() }} />}
    </div>
  )
}

// ==================== INSPECTIONS TAB ====================

function InspectionsTab({ contractId, onRefresh }: { contractId: string; onRefresh: () => void }) {
  const user = useAuthStore(s => s.user)
  const [rk, setRk] = useState(0)
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null)
  const inspections = useMemo(() => contractService.getInspections(contractId), [contractId, rk])

  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  const handleNew = () => {
    const insp = contractService.createInspection(contractId, user?.full_name || 'Inspector')
    setActiveInspectionId(insp.id)
    localRefresh()
  }

  if (activeInspectionId) {
    return <InspectionWizard inspectionId={activeInspectionId} onClose={() => { setActiveInspectionId(null); localRefresh() }} />
  }

  const statusColors: Record<string, string> = { pendiente: 'bg-gray-100 text-gray-600', en_progreso: 'bg-yellow-100 text-yellow-700', completado: 'bg-green-100 text-green-700' }
  const statusLabels: Record<string, string> = { pendiente: 'Pendiente', en_progreso: 'En Progreso', completado: 'Completada' }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Inspecciones Semanales (Lunes)</h3>
        <button onClick={handleNew} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-700"><ClipboardCheck size={16} />Nueva Inspección</button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <ClipboardCheck size={14} className="inline mr-1" />
        <strong>Flujo semanal:</strong> Cada lunes se realiza una inspección general de todas las dependencias. A partir de los resultados, se genera automáticamente el plan de trabajo para martes a viernes.
      </div>

      <div className="space-y-3">
        {inspections.map(insp => {
          const report = contractService.generateInspectionReport(insp.id)
          return (
            <div key={insp.id} className="bg-white rounded-xl border p-4 hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">Semana {insp.week_number}/{insp.year}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[insp.status]}`}>{statusLabels[insp.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(insp.inspection_date).toLocaleDateString('es-PY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Inspector: {insp.inspector_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  {report && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${report.healthScore >= 80 ? 'text-green-700' : report.healthScore >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>{report.healthScore}%</div>
                      <div className="text-[10px] text-gray-400">Salud</div>
                    </div>
                  )}
                  <div className="flex gap-1">
                    {insp.status === 'en_progreso' && <button onClick={() => setActiveInspectionId(insp.id)} className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs hover:bg-yellow-200">Continuar</button>}
                    {insp.status === 'completado' && <button onClick={() => setActiveInspectionId(insp.id)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200">Ver Detalle</button>}
                  </div>
                </div>
              </div>
              {report && (
                <div className="flex gap-4 mt-2 pt-2 border-t text-xs">
                  <span className="text-green-600 flex items-center gap-1"><CheckCircle size={10} />{report.okPoints} OK</span>
                  <span className="text-yellow-600 flex items-center gap-1"><AlertTriangle size={10} />{report.attentionPoints} Atención</span>
                  <span className="text-red-600 flex items-center gap-1"><AlertOctagon size={10} />{report.criticalPoints} Críticos</span>
                  <span className="text-gray-500">{report.facilitiesInspected} dependencias</span>
                </div>
              )}
            </div>
          )
        })}
        {inspections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay inspecciones registradas</p>
            <p className="text-xs text-gray-400 mt-1">Inicia la inspección semanal del lunes</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== INSPECTION WIZARD (ANTI-FOOL) ====================

function InspectionWizard({ inspectionId, onClose }: { inspectionId: string; onClose: () => void }) {
  const [inspection, setInspection] = useState<WeeklyInspection | null>(null)
  const [currentFacilityIdx, setCurrentFacilityIdx] = useState(0)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    const insp = contractService.getInspection(inspectionId)
    if (insp) setInspection(insp)
  }, [inspectionId])

  if (!inspection) return null
  const isCompleted = inspection.status === 'completado'

  const handleItemChange = (facilityIdx: number, itemIdx: number, field: keyof InspectionItemResult, value: any) => {
    const updated = { ...inspection }
    const item = updated.facility_results[facilityIdx].items[itemIdx]
    ;(item as any)[field] = value
    if (field === 'status' && (value === 'necesita_atencion' || value === 'critico')) {
      item.requires_action = true
    }
    setInspection(updated)
  }

  const handleFacilityNote = (facilityIdx: number, field: 'observation' | 'photo_notes', value: string) => {
    const updated = { ...inspection }
    updated.facility_results[facilityIdx][field] = value
    setInspection(updated)
  }

  const saveProgress = () => {
    if (inspection) contractService.updateInspection(inspection.id, inspection)
  }

  const handleComplete = () => {
    saveProgress()
    contractService.completeInspection(inspection.id)
    setShowReport(true)
  }

  const handleGenerateWorkPlan = () => {
    try {
      contractService.generateWorkPlan(inspection.id)
      alert('Plan de trabajo generado exitosamente para Martes a Viernes')
      onClose()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const currentFacility = inspection.facility_results[currentFacilityIdx]
  const totalFacilities = inspection.facility_results.length
  const progress = ((currentFacilityIdx + 1) / totalFacilities) * 100

  if (showReport) {
    const report = contractService.generateInspectionReport(inspection.id)
    if (!report) return null
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-green-800 flex items-center gap-2"><CheckCircle size={20} />Inspección Completada</h3>
          <button onClick={onClose} className="px-3 py-2 border rounded-lg text-sm">Cerrar</button>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${report.healthScore >= 80 ? 'border-green-500 text-green-700' : report.healthScore >= 50 ? 'border-yellow-500 text-yellow-700' : 'border-red-500 text-red-700'}`}>
              <span className="text-3xl font-bold">{report.healthScore}%</span>
            </div>
            <h4 className="text-lg font-bold mt-3">Índice de Salud de Instalaciones</h4>
            <p className="text-sm text-gray-500">Semana {report.inspection.week_number}/{report.inspection.year}</p>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg"><div className="text-xl font-bold">{report.totalPoints}</div><div className="text-xs text-gray-500">Puntos Evaluados</div></div>
            <div className="text-center p-3 bg-green-50 rounded-lg"><div className="text-xl font-bold text-green-700">{report.okPoints}</div><div className="text-xs text-green-600">Conformes</div></div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg"><div className="text-xl font-bold text-yellow-700">{report.attentionPoints}</div><div className="text-xs text-yellow-600">Requieren Atención</div></div>
            <div className="text-center p-3 bg-red-50 rounded-lg"><div className="text-xl font-bold text-red-700">{report.criticalPoints}</div><div className="text-xs text-red-600">Críticos</div></div>
          </div>

          {report.actionRequired > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <h4 className="font-semibold text-indigo-800 mb-2">Acciones Requeridas ({report.actionRequired})</h4>
              {inspection.facility_results.map(fr => {
                const actionItems = fr.items.filter(i => i.requires_action)
                if (actionItems.length === 0) return null
                return (
                  <div key={fr.facility_id} className="mb-2">
                    <p className="text-sm font-medium text-gray-700">{fr.facility_name}</p>
                    {actionItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 ml-4 text-xs mt-1">
                        <span className={`px-1.5 py-0.5 rounded ${INSPECTION_ITEM_STATUS_COLORS[item.status]}`}>{INSPECTION_ITEM_STATUS_LABELS[item.status]}</span>
                        <span>{item.label}</span>
                        {item.observation && <span className="text-gray-400 italic">- {item.observation}</span>}
                      </div>
                    ))}
                  </div>
                )
              })}
              <button onClick={handleGenerateWorkPlan} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2 w-full justify-center">
                <Layers size={16} />Generar Plan de Trabajo (Mar-Vie)
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Wizard header */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><ClipboardCheck size={18} className="text-green-600" />Relevamiento Semanal</h3>
            <p className="text-xs text-gray-500">Semana {inspection.week_number}/{inspection.year} · {new Date(inspection.inspection_date).toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { saveProgress(); onClose() }} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1"><Save size={14} />Guardar y Salir</button>
            {!isCompleted && <button onClick={handleComplete} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"><CheckCircle size={14} />Finalizar Inspección</button>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm font-medium text-gray-600">{currentFacilityIdx + 1}/{totalFacilities}</span>
        </div>

        {/* Facility nav pills */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {inspection.facility_results.map((fr, i) => {
            const hasIssues = fr.items.some(it => it.status === 'necesita_atencion' || it.status === 'critico')
            return (
              <button key={fr.facility_id} onClick={() => { saveProgress(); setCurrentFacilityIdx(i) }}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1 ${i === currentFacilityIdx ? 'bg-indigo-600 text-white' : hasIssues ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {fr.facility_name}
                {hasIssues && i !== currentFacilityIdx && <AlertTriangle size={10} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Current facility inspection */}
      {currentFacility && (
        <div className="bg-white rounded-xl border p-5">
          <h4 className="font-bold text-lg text-gray-800 mb-1">{currentFacility.facility_name}</h4>
          <p className="text-xs text-gray-400 mb-4">{currentFacility.items.length} puntos de inspección</p>

          <div className="space-y-3">
            {currentFacility.items.map((item, idx) => (
              <div key={item.point_id} className={`border rounded-xl p-4 transition-colors ${item.status === 'critico' ? 'border-red-300 bg-red-50' : item.status === 'necesita_atencion' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">#{idx + 1}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100">{item.category}</span>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                  </div>
                  {/* Status buttons - big, anti-fool */}
                  <div className="flex gap-1">
                    {(['ok', 'necesita_atencion', 'critico', 'no_aplica'] as InspectionItemStatus[]).map(s => (
                      <button key={s} onClick={() => !isCompleted && handleItemChange(currentFacilityIdx, idx, 'status', s)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${item.status === s ? INSPECTION_ITEM_STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                        {INSPECTION_ITEM_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {(item.status === 'necesita_atencion' || item.status === 'critico') && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Observación</label>
                      <input type="text" value={item.observation} onChange={e => !isCompleted && handleItemChange(currentFacilityIdx, idx, 'observation', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Describe el problema..." readOnly={isCompleted} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Prioridad</label>
                      <select value={item.priority} onChange={e => !isCompleted && handleItemChange(currentFacilityIdx, idx, 'priority', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm" disabled={isCompleted}>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Facility observation */}
          <div className="mt-4 pt-4 border-t">
            <label className="text-sm font-medium text-gray-700 block mb-1">Observaciones generales de esta dependencia</label>
            <textarea value={currentFacility.observation} onChange={e => !isCompleted && handleFacilityNote(currentFacilityIdx, 'observation', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Comentarios adicionales..." readOnly={isCompleted} />
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-4 pt-4 border-t">
            <button onClick={() => { saveProgress(); setCurrentFacilityIdx(Math.max(0, currentFacilityIdx - 1)) }}
              disabled={currentFacilityIdx === 0} className="px-4 py-2 border rounded-lg text-sm flex items-center gap-1 disabled:opacity-40">
              <ChevronLeft size={16} />Anterior
            </button>
            {currentFacilityIdx < totalFacilities - 1 ? (
              <button onClick={() => { saveProgress(); setCurrentFacilityIdx(currentFacilityIdx + 1) }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-1">
                Siguiente<ChevronRight size={16} />
              </button>
            ) : !isCompleted ? (
              <button onClick={handleComplete} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
                <CheckCircle size={16} />Finalizar Inspección
              </button>
            ) : (
              <button onClick={() => setShowReport(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
                <FileText size={16} />Ver Informe
              </button>
            )}
          </div>
        </div>
      )}

      {/* General fields */}
      <div className="bg-white rounded-xl border p-4">
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs font-medium block mb-1">Condiciones Climáticas</label>
            <input type="text" value={inspection.weather_conditions} onChange={e => !isCompleted && setInspection({ ...inspection, weather_conditions: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Soleado, 28°C" readOnly={isCompleted} />
          </div>
          <div><label className="text-xs font-medium block mb-1">Representante del Cliente</label>
            <input type="text" value={inspection.client_representative} onChange={e => !isCompleted && setInspection({ ...inspection, client_representative: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nombre del contacto" readOnly={isCompleted} />
          </div>
          <div><label className="text-xs font-medium block mb-1">Observaciones Generales</label>
            <input type="text" value={inspection.general_observations} onChange={e => !isCompleted && setInspection({ ...inspection, general_observations: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Notas generales de la inspección" readOnly={isCompleted} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== WORK PLANS TAB ====================

function WorkPlansTab({ contractId, onRefresh }: { contractId: string; onRefresh: () => void }) {
  const [rk, setRk] = useState(0)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const plans = useMemo(() => contractService.getWorkPlans(contractId), [contractId, rk])

  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  const statusColors: Record<string, string> = { borrador: 'bg-gray-100 text-gray-600', activo: 'bg-green-100 text-green-700', completado: 'bg-blue-100 text-blue-700' }
  const statusLabels: Record<string, string> = { borrador: 'Borrador', activo: 'Activo', completado: 'Completado' }

  if (selectedPlanId) {
    return <WorkPlanDetail planId={selectedPlanId} contractId={contractId} onBack={() => { setSelectedPlanId(null); localRefresh() }} onRefresh={localRefresh} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Planes de Trabajo Semanales</h3>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
        <Layers size={14} className="inline mr-1" />
        Los planes de trabajo se generan automáticamente a partir de las inspecciones del lunes, distribuyendo tareas de martes a viernes según prioridad y personal disponible.
      </div>

      <div className="space-y-3">
        {plans.map(p => {
          const tasks = contractService.getTasks(p.id)
          const completed = tasks.filter(t => t.status === 'completado').length
          return (
            <div key={p.id} className="bg-white rounded-xl border p-4 hover:shadow-sm cursor-pointer" onClick={() => setSelectedPlanId(p.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">Semana {p.week_number}/{p.year}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[p.status]}`}>{statusLabels[p.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500">{tasks.length} tareas · {completed} completadas</p>
                </div>
                <div className="flex items-center gap-3">
                  {tasks.length > 0 && (
                    <div className="w-20 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(completed / tasks.length) * 100}%` }} />
                    </div>
                  )}
                  {p.status === 'borrador' && (
                    <button onClick={(e) => { e.stopPropagation(); contractService.activateWorkPlan(p.id); localRefresh() }} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200">Activar</button>
                  )}
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          )
        })}
        {plans.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Layers size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Sin planes de trabajo</p>
            <p className="text-xs text-gray-400 mt-1">Completa una inspección para generar un plan</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== WORK PLAN DETAIL ====================

function WorkPlanDetail({ planId, contractId, onBack, onRefresh }: { planId: string; contractId: string; onBack: () => void; onRefresh: () => void }) {
  const [rk, setRk] = useState(0)
  const [showConfirm, setShowConfirm] = useState<WorkTask | null>(null)
  const tasks = useMemo(() => contractService.getTasks(planId), [planId, rk])
  const personnel = useMemo(() => contractService.getPersonnel(contractId, true), [contractId])

  const localRefresh = () => { setRk(k => k + 1); onRefresh() }
  const days: WeekDay[] = ['martes', 'miercoles', 'jueves', 'viernes']

  const tasksByDay = useMemo(() => {
    const map: Record<WeekDay, WorkTask[]> = { martes: [], miercoles: [], jueves: [], viernes: [] }
    for (const t of tasks) { map[t.scheduled_day]?.push(t) }
    return map
  }, [tasks])

  const statusColors: Record<TaskStatus, string> = {
    pendiente: 'bg-gray-100 text-gray-600', en_progreso: 'bg-blue-100 text-blue-700', completado: 'bg-green-100 text-green-700', no_realizado: 'bg-red-100 text-red-700', reprogramado: 'bg-purple-100 text-purple-700'
  }
  const statusLabels: Record<TaskStatus, string> = {
    pendiente: 'Pendiente', en_progreso: 'En Progreso', completado: 'Completado', no_realizado: 'No Realizado', reprogramado: 'Reprogramado'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"><ChevronLeft size={16} />Volver a planes</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {days.map(day => (
          <div key={day} className="bg-white rounded-xl border">
            <div className="p-3 border-b bg-gray-50 rounded-t-xl">
              <h4 className="font-bold text-gray-700">{WEEKDAY_LABELS[day]}</h4>
              <p className="text-xs text-gray-400">{tasksByDay[day].length} tareas</p>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {tasksByDay[day].map(task => (
                <div key={task.id} className={`border rounded-lg p-3 text-xs ${task.status === 'completado' ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TASK_PRIORITY_COLORS[task.priority]}`}>{task.priority.toUpperCase()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusColors[task.status]}`}>{statusLabels[task.status]}</span>
                  </div>
                  <p className="font-medium text-gray-800 mb-0.5">{task.title}</p>
                  <p className="text-gray-500 mb-1">{task.facility_name}</p>
                  <p className="text-gray-400 flex items-center gap-1"><Users size={10} />{task.assigned_name}</p>
                  {task.status !== 'completado' && (
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => { contractService.updateTask(task.id, { status: 'en_progreso' }); localRefresh() }} className="flex-1 py-1 bg-blue-50 text-blue-600 rounded text-[10px] hover:bg-blue-100">Iniciar</button>
                      <button onClick={() => setShowConfirm(task)} className="flex-1 py-1 bg-green-50 text-green-600 rounded text-[10px] hover:bg-green-100">Confirmar</button>
                    </div>
                  )}
                </div>
              ))}
              {tasksByDay[day].length === 0 && <div className="text-center py-8 text-gray-300 text-xs">Sin tareas</div>}
            </div>
          </div>
        ))}
      </div>

      {showConfirm && <ConfirmTaskModal task={showConfirm} contractId={contractId} onClose={() => setShowConfirm(null)} onSaved={() => { setShowConfirm(null); localRefresh() }} />}
    </div>
  )
}

// ==================== CONFIRMATIONS TAB ====================

function ConfirmationsTab({ contractId }: { contractId: string }) {
  const confirmations = useMemo(() => contractService.getConfirmations(contractId), [contractId])

  const ratingColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500']

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Historial de Confirmaciones</h3>

      {confirmations.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-gray-500 block">Total</span><span className="text-xl font-bold">{confirmations.length}</span></div>
          <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-gray-500 block">Calidad Promedio</span><span className="text-xl font-bold text-yellow-600">{(confirmations.reduce((s, c) => s + c.quality_rating, 0) / confirmations.length).toFixed(1)}<Star size={14} className="inline ml-0.5" /></span></div>
          <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-gray-500 block">Requieren Seguimiento</span><span className="text-xl font-bold text-orange-600">{confirmations.filter(c => c.requires_followup).length}</span></div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Confirmado por</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Calidad</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Observaciones</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Seguimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {confirmations.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs">{new Date(c.confirmed_at).toLocaleString('es-PY')}</td>
                <td className="px-4 py-3 font-medium">{c.confirmed_by_name}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className={s <= c.quality_rating ? ratingColors[c.quality_rating] : 'text-gray-200'} fill={s <= c.quality_rating ? 'currentColor' : 'none'} />)}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{c.observations || '-'}</td>
                <td className="px-4 py-3 text-center">{c.requires_followup ? <AlertTriangle size={16} className="mx-auto text-orange-500" /> : <CheckCircle size={16} className="mx-auto text-green-400" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {confirmations.length === 0 && <div className="text-center py-12"><CheckCircle size={48} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500">Sin confirmaciones aún</p></div>}
      </div>
    </div>
  )
}

// ==================== MODALS ====================

function NewContractModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [monthlyValue, setMonthlyValue] = useState(0)
  const [currency, setCurrency] = useState<'PYG' | 'USD'>('PYG')
  const [specialConditions, setSpecialConditions] = useState('')

  const handleSave = () => {
    if (!title || !clientName || !startDate || !endDate) { alert('Completa los campos obligatorios'); return }
    const scopeItems = contractService.getDefaultScopeItems()
    contractService.createContract({
      contract_number: '',
      title, client_name: clientName, client_contact: clientContact,
      client_phone: clientPhone, client_address: clientAddress,
      description, status: 'draft', start_date: startDate, end_date: endDate,
      monthly_value: monthlyValue, currency, payment_day: 5,
      scope_items: scopeItems, special_conditions: specialConditions,
      auto_renew: false, renewal_notice_days: 60, created_by: 'Admin',
    })
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Nuevo Contrato de Servicio</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-sm font-medium block mb-1">Título del Contrato *</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Servicio Integral de Limpieza - Edificio Central" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Empresa Cliente *</label><input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Contacto</label><input value={clientContact} onChange={e => setClientContact(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Teléfono</label><input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Dirección</label><input value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div><label className="text-sm font-medium block mb-1">Descripción</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium block mb-1">Fecha Inicio *</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Fecha Fin *</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Valor Mensual</label>
              <div className="flex gap-1">
                <select value={currency} onChange={e => setCurrency(e.target.value as any)} className="px-2 py-2 border rounded-lg text-sm w-20"><option value="PYG">PYG</option><option value="USD">USD</option></select>
                <input type="number" value={monthlyValue || ''} onChange={e => setMonthlyValue(parseInt(e.target.value) || 0)} className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono" />
              </div>
            </div>
          </div>
          <div><label className="text-sm font-medium block mb-1">Condiciones Especiales</label><textarea value={specialConditions} onChange={e => setSpecialConditions(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Horarios, condiciones, exclusiones..." /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Crear Contrato</button>
        </div>
      </div>
    </div>
  )
}

function NewFacilityModal({ contractId, onClose, onSaved }: { contractId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<FacilityType>('oficina')
  const [floor, setFloor] = useState('')
  const [area, setArea] = useState(0)
  const [description, setDescription] = useState('')

  const handleSave = () => {
    if (!name) { alert('Ingresa un nombre'); return }
    const existing = contractService.getFacilities(contractId)
    contractService.createFacility({
      contract_id: contractId, name, type, floor, area_sqm: area, description,
      inspection_points: [], is_active: true, order: existing.length + 1,
    })
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Nueva Dependencia</h3><button onClick={onClose}><X size={20} /></button></div>
        <div className="space-y-3">
          <div><label className="text-sm font-medium block mb-1">Nombre *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Oficina Gerencia" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as FacilityType)} className="w-full px-3 py-2 border rounded-lg text-sm">
                {Object.entries(FACILITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium block mb-1">Piso</label><input value={floor} onChange={e => setFloor(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="PB, 1er, 2do..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Área (m²)</label><input type="number" value={area || ''} onChange={e => setArea(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div><label className="text-sm font-medium block mb-1">Descripción</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <Shield size={12} className="inline mr-1" />
            Los puntos de inspección se cargarán automáticamente según el tipo de dependencia seleccionada. Podrás personalizarlos después.
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Agregar</button>
        </div>
      </div>
    </div>
  )
}

function NewPersonnelModal({ contractId, onClose, onSaved }: { contractId: string; onClose: () => void; onSaved: () => void }) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchText, setSearchText] = useState('')
  const [role, setRole] = useState<PersonnelRole>('limpieza')
  const [functions, setFunctions] = useState('')
  const [schedule, setSchedule] = useState('Lun-Vie 06:00-14:00')
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const existingPersonnel = useMemo(() => contractService.getPersonnel(contractId, false), [contractId])
  const assignedDocs = useMemo(() => new Set(existingPersonnel.map(p => p.document_number)), [existingPersonnel])

  useEffect(() => {
    let cancelled = false
    employeesService.list({ status: 'activo' })
      .then(result => {
        if (!cancelled) {
          setAllEmployees(result.items.filter(e => !assignedDocs.has(e.document_number)))
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) { setAllEmployees([]); setLoading(false) } })
    return () => { cancelled = true }
  }, [assignedDocs])

  const filtered = useMemo(() => {
    if (!searchText.trim()) return allEmployees
    const q = searchText.toLowerCase()
    return allEmployees.filter(e => e.full_name.toLowerCase().includes(q) || e.document_number.includes(q) || e.position.toLowerCase().includes(q) || e.department.toLowerCase().includes(q))
  }, [allEmployees, searchText])

  const handleSave = () => {
    if (!selectedEmployee) return
    contractService.createPersonnel({
      contract_id: contractId,
      full_name: selectedEmployee.full_name,
      document_number: selectedEmployee.document_number,
      role,
      specialty: functions || selectedEmployee.position,
      phone: selectedEmployee.phone || '',
      schedule,
      is_active: true,
      start_date: new Date().toISOString().split('T')[0],
      notes: `RRHH: ${selectedEmployee.employee_code} · ${selectedEmployee.department} · ${selectedEmployee.position}`,
    })
    onSaved()
  }

  const schedulePresets = ['Lun-Vie 06:00-14:00', 'Lun-Vie 07:00-15:00', 'Lun-Vie 08:00-16:00', 'Lun-Sab 06:00-14:00']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2"><UserPlus size={18} />Asignar Funcionario al Contrato</h3>
            <p className="text-xs text-gray-500 mt-0.5">Seleccione un funcionario activo de Recursos Humanos</p>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {!selectedEmployee ? (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle size={14} className="flex-shrink-0" />
              <span>Los funcionarios deben estar registrados en <strong>Recursos Humanos</strong> antes de ser asignados a un contrato.</span>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" placeholder="Buscar por nombre, documento, cargo o departamento..." autoFocus />
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Cargando funcionarios...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <Users size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  {allEmployees.length === 0
                    ? 'No hay funcionarios activos disponibles. Registre funcionarios en Recursos Humanos primero.'
                    : 'No se encontraron funcionarios con ese criterio.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto border rounded-lg p-2">
                {filtered.map(emp => (
                  <button key={emp.id} onClick={() => setSelectedEmployee(emp)}
                    className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {emp.first_name?.[0]}{emp.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{emp.full_name}</p>
                      <p className="text-xs text-gray-500">CI: {emp.document_number} · {emp.position}</p>
                      <p className="text-[10px] text-gray-400">{emp.department} · {emp.phone || 'Sin teléfono'}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-center text-gray-400">{filtered.length} funcionario(s) disponible(s) · {assignedDocs.size} ya asignado(s)</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900">{selectedEmployee.full_name}</h4>
                    <p className="text-xs text-indigo-600">CI: {selectedEmployee.document_number} · {selectedEmployee.employee_code}</p>
                    <p className="text-xs text-indigo-500">{selectedEmployee.department} · {selectedEmployee.position}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEmployee(null)} className="px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-gray-50">Cambiar</button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Rol en el Contrato *</label>
              <select value={role} onChange={e => setRole(e.target.value as PersonnelRole)} className="w-full px-3 py-2 border rounded-lg text-sm">
                {Object.entries(PERSONNEL_ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Horario en el Contrato *</label>
              <input value={schedule} onChange={e => setSchedule(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Lun-Vie 06:00-14:00" />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {schedulePresets.map(s => (
                  <button key={s} onClick={() => setSchedule(s)} className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${schedule === s ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'hover:bg-gray-50'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Funciones / Responsabilidades</label>
              <textarea value={functions} onChange={e => setFunctions(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3}
                placeholder="Describe las funciones específicas en este contrato. Ej: Encargada de limpieza de Planta Baja, responsable de sanitarios y recepción." />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
          {selectedEmployee && (
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
              <Check size={14} />Asignar al Contrato
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfirmTaskModal({ task, contractId, onClose, onSaved }: { task: WorkTask; contractId: string; onClose: () => void; onSaved: () => void }) {
  const user = useAuthStore(s => s.user)
  const [rating, setRating] = useState<1|2|3|4|5>(4)
  const [observations, setObservations] = useState('')
  const [issues, setIssues] = useState('')
  const [followup, setFollowup] = useState(false)

  const handleSave = () => {
    contractService.confirmTask(task.id, contractId, user?.id || '', user?.full_name || 'Supervisor', rating, observations, issues, followup)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-green-800 flex items-center gap-2"><CheckCircle size={18} />Confirmar Tarea</h3><button onClick={onClose}><X size={20} /></button></div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
          <p className="font-medium">{task.title}</p>
          <p className="text-xs text-gray-500">{task.facility_name} · {task.assigned_name} · {WEEKDAY_LABELS[task.scheduled_day]}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-2">Calificación de Calidad *</label>
            <div className="flex gap-2 justify-center">
              {([1, 2, 3, 4, 5] as const).map(s => (
                <button key={s} onClick={() => setRating(s)} className={`p-2 rounded-lg transition-all ${rating >= s ? 'text-yellow-500' : 'text-gray-200'}`}>
                  <Star size={28} fill={rating >= s ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-1">{['', 'Deficiente', 'Regular', 'Aceptable', 'Bueno', 'Excelente'][rating]}</p>
          </div>
          <div><label className="text-sm font-medium block mb-1">Observaciones</label><textarea value={observations} onChange={e => setObservations(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Comentarios sobre el trabajo realizado" /></div>
          <div><label className="text-sm font-medium block mb-1">Problemas Encontrados</label><input value={issues} onChange={e => setIssues(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Si hubo algún inconveniente..." /></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={followup} onChange={e => setFollowup(e.target.checked)} className="rounded" /><span className="text-sm">Requiere seguimiento posterior</span></label>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Confirmar Trabajo</button>
        </div>
      </div>
    </div>
  )
}

// ==================== SERVICES TAB ====================

function ServicesTab({ contractId, onRefresh }: { contractId: string; onRefresh: () => void }) {
  const [showNew, setShowNew] = useState(false)
  const [rk, setRk] = useState(0)
  const services = useMemo(() => contractService.getScheduledServices(contractId), [contractId, rk])
  const facilities = useMemo(() => contractService.getFacilities(contractId), [contractId])
  const personnel = useMemo(() => contractService.getPersonnel(contractId, true), [contractId])

  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  const catColors: Record<string, string> = {
    limpieza_general: 'bg-blue-100 text-blue-700', limpieza_profunda: 'bg-cyan-100 text-cyan-700',
    sanitizacion: 'bg-teal-100 text-teal-700', mantenimiento_preventivo: 'bg-orange-100 text-orange-700',
    mantenimiento_correctivo: 'bg-red-100 text-red-700', jardineria: 'bg-green-100 text-green-700',
    seguridad: 'bg-purple-100 text-purple-700', fumigacion: 'bg-yellow-100 text-yellow-700',
    residuos: 'bg-gray-100 text-gray-700', otro: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Servicios y Eventos Programados</h3>
          <p className="text-xs text-gray-500">Define todos los servicios que deben ejecutarse según el contrato</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2"><Plus size={16} />Nuevo Servicio</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-gray-500 block">Total Servicios</span><span className="text-xl font-bold">{services.length}</span></div>
        <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-green-600 block">Activos</span><span className="text-xl font-bold text-green-700">{services.filter(s => s.is_active).length}</span></div>
        <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-gray-500 block">Personal Requerido (máx.)</span><span className="text-xl font-bold">{Math.max(...services.map(s => s.required_headcount), 0)}</span></div>
      </div>

      <div className="space-y-3">
        {services.map(svc => (
          <div key={svc.id} className={`bg-white rounded-xl border p-5 ${!svc.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${catColors[svc.category] || 'bg-gray-100'}`}>{SERVICE_CATEGORY_LABELS[svc.category]}</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium">{SERVICE_FREQUENCY_LABELS[svc.frequency]}</span>
                  {!svc.is_active && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px]">Inactivo</span>}
                </div>
                <h4 className="font-bold text-gray-800 text-lg">{svc.title}</h4>
                <p className="text-sm text-gray-500 mt-0.5">{svc.description}</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div className="bg-gray-50 rounded-lg px-3 py-2">{svc.time_start} - {svc.time_end}</div>
                <div className="mt-1 flex items-center gap-1 justify-end"><Users size={12} />{svc.required_headcount} persona(s)</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1">DEPENDENCIAS ASIGNADAS</p>
                <div className="flex flex-wrap gap-1">
                  {svc.facility_names.map((fn, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{fn}</span>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1">PERSONAL ASIGNADO</p>
                <div className="flex flex-wrap gap-1">
                  {svc.assigned_names.map((an, i) => <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{an}</span>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1">CHECKLIST ({svc.checklist_items.length} items)</p>
                <div className="space-y-0.5 max-h-20 overflow-y-auto">
                  {svc.checklist_items.map(ci => (
                    <div key={ci.id} className="flex items-center gap-1 text-xs">
                      {ci.is_required ? <CheckCircle size={10} className="text-green-500 flex-shrink-0" /> : <Check size={10} className="text-gray-300 flex-shrink-0" />}
                      <span className={ci.is_required ? '' : 'text-gray-400'}>{ci.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-1 mt-3">
              <button onClick={() => { contractService.updateScheduledService(svc.id, { is_active: !svc.is_active }); localRefresh() }} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50">
                {svc.is_active ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => { contractService.deleteScheduledService(svc.id); localRefresh() }} className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Eliminar</button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Sparkles size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Sin servicios programados</p>
            <p className="text-xs text-gray-400 mt-1">Agrega los servicios del contrato</p>
          </div>
        )}
      </div>

      {showNew && <NewServiceModal contractId={contractId} facilities={facilities} personnel={personnel} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); localRefresh() }} />}
    </div>
  )
}

function NewServiceModal({ contractId, facilities, personnel, onClose, onSaved }: {
  contractId: string; facilities: ContractFacility[]; personnel: ContractPersonnel[];
  onClose: () => void; onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ServiceCategory>('limpieza_general')
  const [frequency, setFrequency] = useState<ServiceFrequency>('diario')
  const [timeStart, setTimeStart] = useState('06:00')
  const [timeEnd, setTimeEnd] = useState('10:00')
  const [headcount, setHeadcount] = useState(1)
  const [selFacilities, setSelFacilities] = useState<string[]>([])
  const [selPersonnel, setSelPersonnel] = useState<string[]>([])
  const [checklistItems, setChecklistItems] = useState<{ label: string; required: boolean }[]>([
    { label: '', required: true },
  ])

  const addCheckItem = () => setChecklistItems([...checklistItems, { label: '', required: false }])
  const removeCheckItem = (i: number) => setChecklistItems(checklistItems.filter((_, idx) => idx !== i))

  const toggleFacility = (id: string) => setSelFacilities(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  const togglePerson = (id: string) => setSelPersonnel(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const handleSave = () => {
    if (!title) { alert('Ingresa un título'); return }
    if (selFacilities.length === 0) { alert('Selecciona al menos una dependencia'); return }
    const validItems = checklistItems.filter(ci => ci.label.trim())
    if (validItems.length === 0) { alert('Agrega al menos un item al checklist'); return }

    contractService.createScheduledService({
      contract_id: contractId, category, title, description, frequency,
      facilities: selFacilities,
      facility_names: selFacilities.map(id => facilities.find(f => f.id === id)?.name || ''),
      assigned_personnel: selPersonnel,
      assigned_names: selPersonnel.map(id => personnel.find(p => p.id === id)?.full_name || ''),
      required_headcount: headcount, time_start: timeStart, time_end: timeEnd,
      checklist_items: validItems.map((ci, i) => ({ id: `ci-${Date.now()}-${i}`, label: ci.label, is_required: ci.required, order: i + 1 })),
      is_active: true,
    })
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Nuevo Servicio Programado</h3><button onClick={onClose}><X size={20} /></button></div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Título *</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Limpieza General Diaria" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium block mb-1">Categoría</label>
                <select value={category} onChange={e => setCategory(e.target.value as ServiceCategory)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.entries(SERVICE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium block mb-1">Frecuencia</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value as ServiceFrequency)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.entries(SERVICE_FREQUENCY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div><label className="text-sm font-medium block mb-1">Descripción</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium block mb-1">Hora Inicio</label><input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Hora Fin</label><input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Personal Req.</label><input type="number" min={1} value={headcount} onChange={e => setHeadcount(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>

          {/* Facilities selection */}
          <div>
            <label className="text-sm font-medium block mb-2">Dependencias *</label>
            <div className="flex flex-wrap gap-2">
              {facilities.filter(f => f.is_active).map(f => (
                <button key={f.id} onClick={() => toggleFacility(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${selFacilities.includes(f.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Personnel selection */}
          <div>
            <label className="text-sm font-medium block mb-2">Personal Asignado</label>
            <div className="flex flex-wrap gap-2">
              {personnel.map(p => (
                <button key={p.id} onClick={() => togglePerson(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${selPersonnel.includes(p.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {p.full_name} ({PERSONNEL_ROLE_LABELS[p.role]})
                </button>
              ))}
            </div>
          </div>

          {/* Checklist builder */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Checklist de Ejecución *</label>
              <button onClick={addCheckItem} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Plus size={12} />Agregar item</button>
            </div>
            <div className="space-y-2">
              {checklistItems.map((ci, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-6">{i + 1}.</span>
                  <input value={ci.label} onChange={e => { const u = [...checklistItems]; u[i].label = e.target.value; setChecklistItems(u) }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Descripción del paso..." />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={ci.required} onChange={e => { const u = [...checklistItems]; u[i].required = e.target.checked; setChecklistItems(u) }} className="rounded" />
                    Obligatorio
                  </label>
                  {checklistItems.length > 1 && <button onClick={() => removeCheckItem(i)} className="text-red-400 hover:text-red-600"><X size={14} /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Crear Servicio</button>
        </div>
      </div>
    </div>
  )
}

// ==================== SCHEDULES TAB ====================

function SchedulesTab({ contractId }: { contractId: string }) {
  const personnel = useMemo(() => contractService.getPersonnel(contractId, true), [contractId])
  const schedules = useMemo(() => contractService.getPersonnelSchedules(contractId), [contractId])
  const services = useMemo(() => contractService.getScheduledServices(contractId, true), [contractId])

  const dayLabels = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  const roleColors: Record<PersonnelRole, string> = {
    limpieza: 'bg-blue-50 border-blue-200', mantenimiento: 'bg-orange-50 border-orange-200',
    supervisor: 'bg-purple-50 border-purple-200', ambos: 'bg-teal-50 border-teal-200',
  }

  const getSchedule = (personId: string, dow: number) =>
    schedules.find(s => s.personnel_id === personId && s.day_of_week === dow)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Horarios del Personal</h3>
          <p className="text-xs text-gray-500">{personnel.length} personas activas · {services.length} servicios programados</p>
        </div>
      </div>

      {/* Schedule matrix */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-48">Personal</th>
              {[1, 2, 3, 4, 5].map(d => <th key={d} className="text-center px-2 py-3 font-medium text-gray-600">{dayLabels[d]}</th>)}
              <th className="text-center px-4 py-3 font-medium text-gray-600">Total Hrs/Sem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {personnel.map(p => {
              let totalHrs = 0
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.full_name}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${roleColors[p.role] || 'bg-gray-50'} border`}>{PERSONNEL_ROLE_LABELS[p.role]}</span>
                  </td>
                  {[1, 2, 3, 4, 5].map(d => {
                    const sched = getSchedule(p.id, d)
                    if (sched && sched.is_active) {
                      const [sh, sm] = sched.time_start.split(':').map(Number)
                      const [eh, em] = sched.time_end.split(':').map(Number)
                      const hrs = (eh + em / 60) - (sh + sm / 60)
                      totalHrs += hrs
                      return (
                        <td key={d} className="px-2 py-3 text-center">
                          <div className={`${roleColors[p.role] || 'bg-gray-50'} border rounded-lg px-2 py-1.5`}>
                            <div className="font-mono text-xs font-medium">{sched.time_start} - {sched.time_end}</div>
                            <div className="text-[10px] text-gray-400">{hrs.toFixed(1)}h</div>
                          </div>
                        </td>
                      )
                    }
                    return <td key={d} className="px-2 py-3 text-center"><span className="text-xs text-gray-300">—</span></td>
                  })}
                  <td className="px-4 py-3 text-center font-bold">{totalHrs.toFixed(0)}h</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {personnel.length === 0 && <div className="text-center py-12"><Users size={48} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500">Sin personal activo</p></div>}
      </div>

      {/* Services schedule */}
      <div className="bg-white rounded-xl border p-4">
        <h4 className="font-semibold text-gray-700 mb-3">Servicios por Día de la Semana</h4>
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(dow => {
            const d = new Date()
            d.setDate(d.getDate() - d.getDay() + dow)
            const todayServices = services.filter(s => contractService.shouldRunToday(s, d))
            return (
              <div key={dow} className="border rounded-lg p-3">
                <h5 className="font-medium text-sm mb-2 text-center">{dayLabels[dow]}</h5>
                <div className="space-y-1.5">
                  {todayServices.map(s => (
                    <div key={s.id} className="bg-gray-50 rounded p-2 text-xs">
                      <p className="font-medium truncate">{s.title}</p>
                      <p className="text-gray-400">{s.time_start}-{s.time_end} · {s.required_headcount}p</p>
                    </div>
                  ))}
                  {todayServices.length === 0 && <p className="text-xs text-gray-300 text-center py-2">Sin servicios</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ==================== DAILY CONTROL TAB ====================

function DailyControlTab({ contractId, onRefresh }: { contractId: string; onRefresh: () => void }) {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [rk, setRk] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const checklists = useMemo(() => contractService.getDailyChecklists(contractId, selectedDate), [contractId, selectedDate, rk])
  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  const handleGenerate = () => {
    contractService.generateDailyChecklists(contractId, selectedDate)
    localRefresh()
  }

  const handleToggleItem = (checklistId: string, itemIdx: number) => {
    const cl = checklists.find(c => c.id === checklistId)
    if (!cl) return
    const newItems = [...cl.items]
    newItems[itemIdx] = { ...newItems[itemIdx], completed: !newItems[itemIdx].completed }
    contractService.updateDailyChecklist(checklistId, { items: newItems })
    localRefresh()
  }

  const handleCheckIn = (checklistId: string) => {
    contractService.updateDailyChecklist(checklistId, { check_in_time: new Date().toTimeString().slice(0, 5), status: 'parcial' })
    localRefresh()
  }

  const handleCheckOut = (checklistId: string) => {
    contractService.updateDailyChecklist(checklistId, { check_out_time: new Date().toTimeString().slice(0, 5) })
    localRefresh()
  }

  const handleGenerateReport = () => {
    contractService.generateDailyReport(contractId, selectedDate)
    alert('Informe diario generado exitosamente')
  }

  const stats = useMemo(() => {
    const total = checklists.length
    const completed = checklists.filter(c => c.status === 'completado').length
    const partial = checklists.filter(c => c.status === 'parcial').length
    const pending = checklists.filter(c => c.status === 'pendiente').length
    return { total, completed, partial, pending, rate: total > 0 ? (completed / total) * 100 : 0 }
  }, [checklists])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Control Diario de Servicios</h3>
          <p className="text-xs text-gray-500">Checklist de ejecución por servicio, dependencia y personal</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          {checklists.length === 0 && <button onClick={handleGenerate} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2"><Play size={14} />Generar Checklists del Día</button>}
          {checklists.length > 0 && <button onClick={handleGenerateReport} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2"><FileText size={14} />Generar Informe</button>}
        </div>
      </div>

      {/* KPIs */}
      {checklists.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-gray-500 block">Programados</span><span className="text-xl font-bold">{stats.total}</span></div>
          <div className="bg-white rounded-lg border-2 border-green-200 p-3 text-center"><span className="text-xs text-green-600 block">Completados</span><span className="text-xl font-bold text-green-700">{stats.completed}</span></div>
          <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-yellow-600 block">Parciales</span><span className="text-xl font-bold text-yellow-700">{stats.partial}</span></div>
          <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-gray-500 block">Pendientes</span><span className="text-xl font-bold">{stats.pending}</span></div>
          <div className="bg-white rounded-lg border p-3 text-center"><span className="text-xs text-gray-500 block">Cumplimiento</span>
            <span className={`text-xl font-bold ${stats.rate >= 80 ? 'text-green-700' : stats.rate >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>{stats.rate.toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Checklist cards */}
      <div className="space-y-3">
        {checklists.map(cl => {
          const completedItems = cl.items.filter(i => i.completed).length
          const totalItems = cl.items.length
          const pct = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
          const isExpanded = expandedId === cl.id
          return (
            <div key={cl.id} className={`bg-white rounded-xl border overflow-hidden ${cl.status === 'completado' ? 'border-green-200' : ''}`}>
              <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(isExpanded ? null : cl.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${pct === 100 ? 'bg-green-100 text-green-700' : pct > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                      {pct.toFixed(0)}%
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{cl.service_title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin size={10} />{cl.facility_name}</span>
                        <span className="flex items-center gap-1"><Users size={10} />{cl.personnel_name}</span>
                        {cl.check_in_time && <span className="text-green-600">Entrada: {cl.check_in_time}</span>}
                        {cl.check_out_time && <span className="text-blue-600">Salida: {cl.check_out_time}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DAILY_CHECK_STATUS_COLORS[cl.status]}`}>{DAILY_CHECK_STATUS_LABELS[cl.status]}</span>
                    <span className="text-xs text-gray-400">{completedItems}/{totalItems}</span>
                    {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </div>
                </div>
                <div className="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {isExpanded && (
                <div className="border-t px-4 py-3 bg-gray-50">
                  <div className="flex gap-2 mb-3">
                    {!cl.check_in_time && <button onClick={() => handleCheckIn(cl.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs">Marcar Entrada</button>}
                    {cl.check_in_time && !cl.check_out_time && <button onClick={() => handleCheckOut(cl.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs">Marcar Salida</button>}
                  </div>
                  <div className="space-y-1.5">
                    {cl.items.map((item, idx) => (
                      <div key={item.item_id} className="flex items-center gap-3 py-1.5">
                        <button onClick={() => handleToggleItem(cl.id, idx)}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}>
                          {item.completed && <Check size={14} />}
                        </button>
                        <span className={`text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <input type="text" placeholder="Observaciones del servicio..."
                      value={cl.observations}
                      onChange={e => { contractService.updateDailyChecklist(cl.id, { observations: e.target.value }); localRefresh() }}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {checklists.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-500">Sin checklists para esta fecha</h3>
            <p className="text-xs text-gray-400 mt-1">Genera los checklists diarios para comenzar el control</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== REPORTS TAB ====================

function ReportsTab({ contractId }: { contractId: string }) {
  const dailyReports = useMemo(() => contractService.getDailyReports(contractId), [contractId])
  const weeklyReports = useMemo(() => contractService.getWeeklyReports(contractId), [contractId])
  const personnel = useMemo(() => contractService.getPersonnel(contractId, true), [contractId])
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Informes</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setTab('daily')} className={`px-4 py-1.5 rounded-md text-sm ${tab === 'daily' ? 'bg-white shadow text-indigo-700 font-medium' : 'text-gray-500'}`}>Diarios</button>
          <button onClick={() => setTab('weekly')} className={`px-4 py-1.5 rounded-md text-sm ${tab === 'weekly' ? 'bg-white shadow text-indigo-700 font-medium' : 'text-gray-500'}`}>Semanales</button>
        </div>
      </div>

      {tab === 'daily' && (
        <div className="space-y-3">
          {dailyReports.map(r => (
            <div key={r.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold">{new Date(r.date + 'T12:00:00').toLocaleDateString('es-PY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                  <p className="text-xs text-gray-400">Generado: {new Date(r.generated_at).toLocaleString('es-PY')}</p>
                </div>
                <div className={`text-2xl font-bold ${r.total_services_scheduled > 0 ? ((r.services_completed / r.total_services_scheduled) * 100 >= 80 ? 'text-green-700' : 'text-yellow-700') : 'text-gray-400'}`}>
                  {r.total_services_scheduled > 0 ? ((r.services_completed / r.total_services_scheduled) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-2 text-center"><span className="text-gray-500 block">Programados</span><span className="font-bold text-lg">{r.total_services_scheduled}</span></div>
                <div className="bg-green-50 rounded-lg p-2 text-center"><span className="text-green-600 block">Completados</span><span className="font-bold text-lg text-green-700">{r.services_completed}</span></div>
                <div className="bg-yellow-50 rounded-lg p-2 text-center"><span className="text-yellow-600 block">Parciales</span><span className="font-bold text-lg text-yellow-700">{r.services_partial}</span></div>
                <div className="bg-red-50 rounded-lg p-2 text-center"><span className="text-red-600 block">No Realizados</span><span className="font-bold text-lg text-red-700">{r.services_not_done}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">PERSONAL PRESENTE ({r.personnel_present.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {r.personnel_present.map(pid => {
                      const p = personnel.find(pe => pe.id === pid)
                      return <span key={pid} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{p?.full_name || pid}</span>
                    })}
                    {r.personnel_present.length === 0 && <span className="text-xs text-gray-400">Sin registros</span>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">PERSONAL AUSENTE ({r.personnel_absent.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {r.personnel_absent.map(pid => {
                      const p = personnel.find(pe => pe.id === pid)
                      return <span key={pid} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">{p?.full_name || pid}</span>
                    })}
                    {r.personnel_absent.length === 0 && <span className="text-xs text-green-600">Todo el personal presente</span>}
                  </div>
                </div>
              </div>
              {r.incidents.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-[10px] text-gray-400 font-medium mb-1">INCIDENTES / OBSERVACIONES</p>
                  {r.incidents.map((inc, i) => <p key={i} className="text-xs text-gray-600">• {inc}</p>)}
                </div>
              )}
            </div>
          ))}
          {dailyReports.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Sin informes diarios</p>
              <p className="text-xs text-gray-400">Genera informes desde la pestaña de Control Diario</p>
            </div>
          )}
        </div>
      )}

      {tab === 'weekly' && (
        <div className="space-y-3">
          {weeklyReports.map(r => (
            <div key={r.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold">Semana {r.week_number}/{r.year}</h4>
                  <p className="text-xs text-gray-400">{r.start_date} → {r.end_date}</p>
                </div>
                <div className={`text-2xl font-bold ${r.completion_rate >= 80 ? 'text-green-700' : 'text-yellow-700'}`}>{r.completion_rate.toFixed(0)}%</div>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {r.daily_summaries.map(ds => (
                  <div key={ds.date} className="bg-gray-50 rounded-lg p-2 text-center text-xs">
                    <p className="text-gray-500">{new Date(ds.date + 'T12:00:00').toLocaleDateString('es-PY', { weekday: 'short' })}</p>
                    <p className="font-bold">{ds.completed}/{ds.total}</p>
                  </div>
                ))}
              </div>
              {r.personnel_attendance.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">ASISTENCIA DEL PERSONAL</p>
                  <div className="flex flex-wrap gap-2">
                    {r.personnel_attendance.map(pa => (
                      <span key={pa.name} className="px-2 py-1 bg-gray-50 rounded text-xs">{pa.name}: <span className="text-green-600 font-medium">{pa.days_present}</span>/<span className="text-red-600">{pa.days_absent}</span></span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {weeklyReports.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Sin informes semanales</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
