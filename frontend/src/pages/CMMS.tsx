import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import {
  cmmsService, Asset, WorkOrder, SparePart, MaintenancePlan,
  ASSET_CATEGORIES, ASSET_STATUS, CRITICALITY_LEVELS,
  WORK_ORDER_TYPES, WORK_ORDER_STATUS, PRIORITY_LEVELS, FREQUENCY_LABELS
} from '../services/cmms'
import {
  Wrench, ClipboardList, Package, Calendar, BarChart3,
  Plus, Edit2, Trash2, Eye, Search,
  AlertTriangle, CheckCircle, XCircle, Play,
  Loader2, Zap, Truck, Building2, Cpu, Box, X,
  TrendingUp, Activity, Timer, DollarSign,
  FileText, Cog, Gauge
} from 'lucide-react'

type ModuleType = 'dashboard' | 'assets' | 'work-orders' | 'preventive' | 'spare-parts' | 'reports'

const MODULES = [
  { id: 'dashboard' as ModuleType, label: 'Dashboard', icon: BarChart3, color: 'indigo' },
  { id: 'assets' as ModuleType, label: 'Activos', icon: Cpu, color: 'blue' },
  { id: 'work-orders' as ModuleType, label: 'Órdenes de Trabajo', icon: ClipboardList, color: 'green' },
  { id: 'preventive' as ModuleType, label: 'Mantenimiento Preventivo', icon: Calendar, color: 'purple' },
  { id: 'spare-parts' as ModuleType, label: 'Repuestos', icon: Package, color: 'orange' },
  { id: 'reports' as ModuleType, label: 'Reportes', icon: FileText, color: 'gray' }
]

export default function CMMS() {
  const { user } = useAuthStore()
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard')

  if (user?.user_type !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="mx-auto text-red-400 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-800">Acceso Restringido</h2>
          <p className="text-gray-600">Solo administradores pueden acceder al CMMS.</p>
        </div>
      </div>
    )
  }

  const getModuleColor = (color: string) => ({
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  }[color] || 'bg-gray-50 text-gray-600')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Wrench className="text-white" size={24} />
            </div>
            CMMS / GMAO
          </h1>
          <p className="text-gray-600 mt-1">Sistema de Gestión de Mantenimiento</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {MODULES.map(module => (
          <button
            key={module.id}
            onClick={() => setActiveModule(module.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all border ${
              activeModule === module.id
                ? getModuleColor(module.color)
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <module.icon size={18} />
            {module.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {activeModule === 'dashboard' && <DashboardView />}
        {activeModule === 'assets' && <AssetsView />}
        {activeModule === 'work-orders' && <WorkOrdersView />}
        {activeModule === 'preventive' && <PreventiveView />}
        {activeModule === 'spare-parts' && <SparePartsView />}
        {activeModule === 'reports' && <ReportsView />}
      </div>
    </div>
  )
}

// ==================== DASHBOARD VIEW ====================

function DashboardView() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['cmms-dashboard'],
    queryFn: () => cmmsService.getDashboardStats()
  })

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
  }

  if (!stats) return null

  const kpis = [
    { label: 'Activos Totales', value: stats.total_assets, icon: Cpu, color: 'blue', sub: `${stats.operational_assets} operativos` },
    { label: 'OT Abiertas', value: stats.open_work_orders, icon: ClipboardList, color: 'green', sub: `${stats.overdue_work_orders} vencidas` },
    { label: 'Disponibilidad', value: `${stats.availability_percent.toFixed(1)}%`, icon: Gauge, color: 'emerald' },
    { label: 'MTTR', value: `${stats.mttr_hours.toFixed(1)}h`, icon: Timer, color: 'orange', sub: 'Tiempo medio reparación' },
    { label: 'Completadas (Mes)', value: stats.completed_this_month, icon: CheckCircle, color: 'purple' },
    { label: 'Costo Mant. (Mes)', value: `₲ ${(stats.maintenance_cost_month / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'indigo' }
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{kpi.value}</p>
                {kpi.sub && <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>}
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${kpi.color}-50`}>
                <kpi.icon size={16} className={`text-${kpi.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preventivo vs Correctivo */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Preventivo vs Correctivo</h3>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-600">Preventivo</span>
                <span className="font-medium">{stats.preventive_vs_corrective.preventive}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${stats.preventive_vs_corrective.preventive + stats.preventive_vs_corrective.corrective > 0 
                    ? (stats.preventive_vs_corrective.preventive / (stats.preventive_vs_corrective.preventive + stats.preventive_vs_corrective.corrective)) * 100 
                    : 0}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-red-600">Correctivo</span>
                <span className="font-medium">{stats.preventive_vs_corrective.corrective}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${stats.preventive_vs_corrective.preventive + stats.preventive_vs_corrective.corrective > 0 
                    ? (stats.preventive_vs_corrective.corrective / (stats.preventive_vs_corrective.preventive + stats.preventive_vs_corrective.corrective)) * 100 
                    : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* OT por Prioridad */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Órdenes por Prioridad</h3>
          <div className="space-y-2">
            {stats.work_orders_by_priority.map((item, idx) => {
              const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
              const total = stats.work_orders_by_priority.reduce((s, i) => s + i.count, 0)
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm w-16">{item.priority}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[idx]} rounded-full`} style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Próximos Mantenimientos */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-purple-600" />
            Próximos Mantenimientos
          </h3>
          {stats.upcoming_maintenance.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No hay mantenimientos programados</p>
          ) : (
            <div className="space-y-2">
              {stats.upcoming_maintenance.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.asset}</p>
                    <p className="text-xs text-gray-500">{item.type === 'preventive' ? 'Preventivo' : 'Predictivo'}</p>
                  </div>
                  <span className="text-xs text-purple-600 font-medium">{new Date(item.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repuestos con Stock Bajo */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-600" />
            Repuestos con Stock Bajo
          </h3>
          {stats.low_stock_parts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Todos los repuestos tienen stock suficiente</p>
          ) : (
            <div className="space-y-2">
              {stats.low_stock_parts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                  <span className="font-medium text-sm">{item.part}</span>
                  <span className="text-sm text-orange-600">{item.stock} / {item.minimum} mín.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== ASSETS VIEW ====================

function AssetsView() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['cmms-assets', filterStatus, filterCategory],
    queryFn: () => cmmsService.listAssets({ 
      status: filterStatus || undefined, 
      category: filterCategory || undefined 
    })
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cmmsService.deleteAsset(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmms-assets'] }); queryClient.invalidateQueries({ queryKey: ['cmms-dashboard'] }) }
  })

  const filteredAssets = data?.items.filter(a => 
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase())
  ) || []

  const getStatusColor = (status: Asset['status']) => ({
    operational: 'bg-green-100 text-green-700',
    maintenance: 'bg-yellow-100 text-yellow-700',
    repair: 'bg-red-100 text-red-700',
    standby: 'bg-gray-100 text-gray-700',
    decommissioned: 'bg-gray-200 text-gray-500'
  }[status])

  const getCriticalityColor = (criticality: Asset['criticality']) => ({
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  }[criticality])

  const getCategoryIcon = (category: Asset['category']) => ({
    equipment: Cpu, machine: Cog, vehicle: Truck, facility: Building2, tool: Wrench, other: Box
  }[category] || Box)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar activos..."
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Todos los estados</option>
            {Object.entries(ASSET_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Todas las categorías</option>
            {Object.entries(ASSET_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuevo Activo
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => {
            const Icon = getCategoryIcon(asset.category)
            return (
              <div key={asset.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-mono">{asset.code}</p>
                      <h3 className="font-semibold text-gray-800">{asset.name}</h3>
                      <p className="text-xs text-gray-500">{asset.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(asset); setShowForm(true) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(asset.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                    {ASSET_STATUS[asset.status]}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(asset.criticality)}`}>
                    {CRITICALITY_LEVELS[asset.criticality]}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <p className="text-gray-400">Fabricante</p>
                    <p className="font-medium text-gray-700">{asset.manufacturer || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Modelo</p>
                    <p className="font-medium text-gray-700">{asset.model || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Mantenimientos</p>
                    <p className="font-medium text-gray-700">{asset.maintenance_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tiempo Inactivo</p>
                    <p className="font-medium text-gray-700">{asset.total_downtime_hours}h</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && <AssetForm asset={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
    </div>
  )
}

function AssetForm({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(asset?.name || '')
  const [category, setCategory] = useState<Asset['category']>(asset?.category || 'equipment')
  const [location, setLocation] = useState(asset?.location || '')
  const [manufacturer, setManufacturer] = useState(asset?.manufacturer || '')
  const [model, setModel] = useState(asset?.model || '')
  const [serialNumber, setSerialNumber] = useState(asset?.serial_number || '')
  const [status, setStatus] = useState<Asset['status']>(asset?.status || 'operational')
  const [criticality, setCriticality] = useState<Asset['criticality']>(asset?.criticality || 'medium')

  const mutation = useMutation({
    mutationFn: (data: any) => asset ? cmmsService.updateAsset(asset.id, data) : cmmsService.createAsset(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmms-assets'] }); queryClient.invalidateQueries({ queryKey: ['cmms-dashboard'] }); onClose() }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ name, category, location, manufacturer, model, serial_number: serialNumber, status, criticality })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{asset ? 'Editar' : 'Nuevo'} Activo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value as Asset['category'])} className="w-full px-3 py-2 border rounded-lg">
                {Object.entries(ASSET_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Criticidad</label>
              <select value={criticality} onChange={e => setCriticality(e.target.value as Asset['criticality'])} className="w-full px-3 py-2 border rounded-lg">
                {Object.entries(CRITICALITY_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <input value={location} onChange={e => setLocation(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante</label>
              <input value={manufacturer} onChange={e => setManufacturer(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input value={model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Serie</label>
              <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={status} onChange={e => setStatus(e.target.value as Asset['status'])} className="w-full px-3 py-2 border rounded-lg">
                {Object.entries(ASSET_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {mutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== WORK ORDERS VIEW ====================

function WorkOrdersView() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['cmms-work-orders', filterStatus, filterType, filterPriority],
    queryFn: () => cmmsService.listWorkOrders({
      status: filterStatus || undefined,
      type: filterType || undefined,
      priority: filterPriority || undefined
    })
  })

  const { data: assets } = useQuery({
    queryKey: ['cmms-assets'],
    queryFn: () => cmmsService.listAssets()
  })

  const startMutation = useMutation({
    mutationFn: (id: string) => cmmsService.startWorkOrder(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmms-work-orders'] }); queryClient.invalidateQueries({ queryKey: ['cmms-dashboard'] }) }
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => cmmsService.completeWorkOrder(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmms-work-orders'] }); queryClient.invalidateQueries({ queryKey: ['cmms-dashboard'] }); queryClient.invalidateQueries({ queryKey: ['cmms-assets'] }) }
  })

  const getStatusColor = (status: WorkOrder['status']) => ({
    pending: 'bg-gray-100 text-gray-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    on_hold: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }[status])

  const getPriorityColor = (priority: WorkOrder['priority']) => ({
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-green-500 text-white'
  }[priority])

  const getTypeIcon = (type: WorkOrder['type']) => ({
    preventive: Calendar, corrective: Wrench, predictive: Activity, emergency: Zap, improvement: TrendingUp
  }[type] || Wrench)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Todos los estados</option>
            {Object.entries(WORK_ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Todos los tipos</option>
            {Object.entries(WORK_ORDER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Todas las prioridades</option>
            {Object.entries(PRIORITY_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Nueva Orden
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay órdenes de trabajo</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Orden</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Activo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tipo</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Prioridad</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Programado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items.map(order => {
                const TypeIcon = getTypeIcon(order.type)
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-sm font-medium text-blue-600">{order.number}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{order.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{order.asset_name}</p>
                      <p className="text-xs text-gray-400">{order.asset_code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon size={14} className="text-gray-500" />
                        <span className="text-sm">{WORK_ORDER_TYPES[order.type]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(order.priority)}`}>
                        {PRIORITY_LEVELS[order.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {WORK_ORDER_STATUS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(order.scheduled_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {order.status === 'pending' && (
                          <button onClick={() => startMutation.mutate(order.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Iniciar">
                            <Play size={14} />
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button onClick={() => completeMutation.mutate({ id: order.id, data: { actual_hours: order.estimated_hours, actual_cost: order.estimated_cost } })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Completar">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <WorkOrderForm assets={assets?.items || []} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function WorkOrderForm({ assets, onClose }: { assets: Asset[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assetId, setAssetId] = useState('')
  const [type, setType] = useState<WorkOrder['type']>('corrective')
  const [priority, setPriority] = useState<WorkOrder['priority']>('medium')
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0])
  const [estimatedHours, setEstimatedHours] = useState(2)

  const mutation = useMutation({
    mutationFn: (data: any) => cmmsService.createWorkOrder(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmms-work-orders'] }); queryClient.invalidateQueries({ queryKey: ['cmms-dashboard'] }); onClose() }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const asset = assets.find(a => a.id === assetId)
    mutation.mutate({
      title, description, asset_id: assetId, asset_name: asset?.name || '', asset_code: asset?.code || '',
      type, priority, status: 'pending', requested_by: 'Admin', scheduled_date: scheduledDate,
      estimated_hours: estimatedHours, estimated_cost: estimatedHours * 150000
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nueva Orden de Trabajo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activo</label>
            <select value={assetId} onChange={e => setAssetId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
              <option value="">Seleccionar activo...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Mantenimiento preventivo mensual" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as WorkOrder['type'])} className="w-full px-3 py-2 border rounded-lg">
                {Object.entries(WORK_ORDER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={priority} onChange={e => setPriority(e.target.value as WorkOrder['priority'])} className="w-full px-3 py-2 border rounded-lg">
                {Object.entries(PRIORITY_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Programada</label>
              <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas Estimadas</label>
              <input type="number" value={estimatedHours} onChange={e => setEstimatedHours(Number(e.target.value))} min={0.5} step={0.5} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              {mutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Crear Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== PREVENTIVE VIEW ====================

function PreventiveView() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['cmms-plans'],
    queryFn: () => cmmsService.listPlans()
  })

  const { data: assets } = useQuery({
    queryKey: ['cmms-assets'],
    queryFn: () => cmmsService.listAssets()
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.items.length || 0} planes de mantenimiento</p>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuevo Plan
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay planes de mantenimiento preventivo</p>
          <p className="text-sm mt-2">Crea planes para programar mantenimientos automáticos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.items.map(plan => (
            <div key={plan.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <h3 className="font-semibold text-gray-800 mt-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.asset_name}</p>
                </div>
                <button className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Frecuencia</p>
                  <p className="font-medium">{FREQUENCY_LABELS[plan.frequency]}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Duración Est.</p>
                  <p className="font-medium">{plan.estimated_duration_hours}h</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Próxima Ejecución</p>
                  <p className="font-medium text-purple-600">{new Date(plan.next_execution).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Tareas</p>
                  <p className="font-medium">{plan.tasks.length}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <MaintenancePlanForm assets={assets?.items || []} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function MaintenancePlanForm({ assets, onClose }: { assets: Asset[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [assetId, setAssetId] = useState('')
  const [frequency, setFrequency] = useState<MaintenancePlan['frequency']>('monthly')
  const [durationHours, setDurationHours] = useState(2)

  const mutation = useMutation({
    mutationFn: (data: any) => cmmsService.createPlan(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmms-plans'] }); queryClient.invalidateQueries({ queryKey: ['cmms-dashboard'] }); onClose() }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const asset = assets.find(a => a.id === assetId)
    const nextDate = new Date()
    nextDate.setMonth(nextDate.getMonth() + 1)
    
    mutation.mutate({
      name, description, asset_id: assetId, asset_name: asset?.name || '',
      type: 'preventive', frequency, tasks: [],
      estimated_duration_hours: durationHours, estimated_cost: durationHours * 150000,
      is_active: true, next_execution: nextDate.toISOString()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nuevo Plan de Mantenimiento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Mantenimiento mensual HVAC" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activo</label>
            <select value={assetId} onChange={e => setAssetId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
              <option value="">Seleccionar activo...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value as MaintenancePlan['frequency'])} className="w-full px-3 py-2 border rounded-lg">
                {Object.entries(FREQUENCY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (horas)</label>
              <input type="number" value={durationHours} onChange={e => setDurationHours(Number(e.target.value))} min={0.5} step={0.5} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              {mutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Crear Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== SPARE PARTS VIEW ====================

function SparePartsView() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [filterLowStock, setFilterLowStock] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['cmms-spare-parts', filterLowStock],
    queryFn: () => cmmsService.listSpareParts({ low_stock: filterLowStock || undefined })
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">{data?.items.length || 0} repuestos</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filterLowStock} onChange={e => setFilterLowStock(e.target.checked)} className="rounded" />
            Solo stock bajo
          </label>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuevo Repuesto
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Código</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Repuesto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Categoría</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Mín/Máx</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Costo Unit.</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items.map(part => (
                <tr key={part.id} className={`hover:bg-gray-50 ${part.quantity_in_stock <= part.reorder_point ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-sm">{part.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{part.name}</p>
                    {part.part_number && <p className="text-xs text-gray-400">P/N: {part.part_number}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm">{part.category}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${part.quantity_in_stock <= part.reorder_point ? 'text-red-600' : 'text-green-600'}`}>
                      {part.quantity_in_stock}
                    </span>
                    <span className="text-gray-400 text-xs ml-1">{part.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{part.minimum_stock} / {part.maximum_stock}</td>
                  <td className="px-4 py-3 text-right text-sm">₲ {part.unit_cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{part.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <SparePartForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

function SparePartForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('unidad')
  const [quantity, setQuantity] = useState(0)
  const [minStock, setMinStock] = useState(5)
  const [maxStock, setMaxStock] = useState(20)
  const [unitCost, setUnitCost] = useState(0)
  const [location, setLocation] = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => cmmsService.createSparePart(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cmms-spare-parts'] }); queryClient.invalidateQueries({ queryKey: ['cmms-dashboard'] }); onClose() }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      code, name, category, unit, quantity_in_stock: quantity,
      minimum_stock: minStock, maximum_stock: maxStock, reorder_point: minStock + 2,
      unit_cost: unitCost, location, compatible_assets: []
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nuevo Repuesto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input value={code} onChange={e => setCode(e.target.value)} required className="w-full px-3 py-2 border rounded-lg font-mono" placeholder="SP-XXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input value={category} onChange={e => setCategory(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Filtros" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                <option value="unidad">Unidad</option>
                <option value="litro">Litro</option>
                <option value="kg">Kg</option>
                <option value="metro">Metro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={0} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unit.</label>
              <input type="number" value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} min={0} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input type="number" value={minStock} onChange={e => setMinStock(Number(e.target.value))} min={0} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Máximo</label>
              <input type="number" value={maxStock} onChange={e => setMaxStock(Number(e.target.value))} min={0} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <input value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Almacén A-1" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              {mutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== REPORTS VIEW ====================

function ReportsView() {
  const { data: stats } = useQuery({
    queryKey: ['cmms-dashboard'],
    queryFn: () => cmmsService.getDashboardStats()
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Cpu size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Inventario de Activos</h3>
              <p className="text-sm text-gray-500">Lista completa de equipos</p>
            </div>
          </div>
        </div>
        
        <div className="border rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <ClipboardList size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Órdenes de Trabajo</h3>
              <p className="text-sm text-gray-500">Historial y estado</p>
            </div>
          </div>
        </div>
        
        <div className="border rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Activity size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">KPIs de Mantenimiento</h3>
              <p className="text-sm text-gray-500">MTBF, MTTR, Disponibilidad</p>
            </div>
          </div>
        </div>
        
        <div className="border rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <DollarSign size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Costos de Mantenimiento</h3>
              <p className="text-sm text-gray-500">Análisis por activo y período</p>
            </div>
          </div>
        </div>
        
        <div className="border rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold">Análisis de Fallas</h3>
              <p className="text-sm text-gray-500">Códigos y frecuencia</p>
            </div>
          </div>
        </div>
        
        <div className="border rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Package size={20} className="text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold">Consumo de Repuestos</h3>
              <p className="text-sm text-gray-500">Uso y rotación</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Rápido */}
      {stats && (
        <div className="border rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Resumen del Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats.total_assets}</p>
              <p className="text-sm text-gray-500">Activos Registrados</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats.completed_this_month}</p>
              <p className="text-sm text-gray-500">OT Completadas (Mes)</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{stats.availability_percent.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Disponibilidad</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">₲ {(stats.maintenance_cost_month / 1000000).toFixed(1)}M</p>
              <p className="text-sm text-gray-500">Costo Mensual</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
