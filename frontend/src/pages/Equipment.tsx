import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { equipmentService, Equipment, ServiceRecord, SERVICE_TYPES, getMaintenanceStatus } from '../services/equipment'
import { clientsService } from '../services/clients'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  QrCode, Plus, Search, X, Edit2, Trash2, Check, Loader2,
  History, Camera, Download, Printer, ChevronRight, ChevronDown, Calendar,
  Wrench, Shield, MapPin, Building, User, Clock, FileText,
  Package, AlertCircle, ScanLine, Video, VideoOff, LayoutGrid, Users,
  ChevronsDownUp, ChevronsUpDown
} from 'lucide-react'

export default function EquipmentPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [scannedCode, setScannedCode] = useState('')
  // Vista: agrupada por familia (cliente) o grilla plana
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped')
  const [clientFilter, setClientFilter] = useState<string>('')
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [userTouchedExpand, setUserTouchedExpand] = useState(false)
  // Estado para impresión de QRs en lote
  const [bulkPrint, setBulkPrint] = useState<{ title: string; items: Equipment[] } | null>(null)
  // Filtros adicionales
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'due_soon' | 'in_warranty' | 'no_recent_service'>('all')
  
  // Queries
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', search],
    queryFn: () => equipmentService.list({ search: search || undefined })
  })
  
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.list().then(r => r.items)
  })
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: equipmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      setShowAddModal(false)
    }
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Equipment> }) => 
      equipmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      setShowEditModal(false)
      setSelectedEquipment(null)
    }
  })
  
  const deleteMutation = useMutation({
    mutationFn: equipmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      setShowEditModal(false)
      setSelectedEquipment(null)
    }
  })

  // Equipos filtrados por filtros activos (cliente + estado)
  const filteredEquipment = useMemo(() => {
    let list = clientFilter ? equipment.filter(e => e.client_id === clientFilter) : equipment
    if (statusFilter === 'overdue' || statusFilter === 'due_soon') {
      list = list.filter(e => getMaintenanceStatus(e).status === statusFilter)
    } else if (statusFilter === 'in_warranty') {
      list = list.filter(e => e.warranty_until && new Date(e.warranty_until) > new Date())
    } else if (statusFilter === 'no_recent_service') {
      const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      list = list.filter(e => !e.last_service_date || new Date(e.last_service_date) < ninetyDaysAgo)
    }
    return list
  }, [equipment, clientFilter, statusFilter])

  // Conteo de alertas para mostrar en KPIs
  const maintenanceCounts = useMemo(() => {
    let overdue = 0, dueSoon = 0
    for (const e of equipment) {
      const s = getMaintenanceStatus(e).status
      if (s === 'overdue') overdue++
      else if (s === 'due_soon') dueSoon++
    }
    return { overdue, dueSoon }
  }, [equipment])

  // Agrupar equipos filtrados por familia (cliente) y luego por sucursal
  const groupedByClient = useMemo(() => {
    const filtered = filteredEquipment

    const groups = new Map<string, {
      client_id: string
      client_name: string
      client_category?: string
      client_segment?: string | null
      items: Equipment[]
      branches: Map<string, Equipment[]>
    }>()

    for (const eq of filtered) {
      const key = eq.client_id || 'sin-cliente'
      let group = groups.get(key)
      if (!group) {
        const clientRecord = clients.find(c => c.id === eq.client_id)
        group = {
          client_id: eq.client_id,
          client_name: eq.client_name || clientRecord?.business_name || 'Sin cliente',
          client_category: clientRecord?.category,
          client_segment: clientRecord?.segment,
          items: [],
          branches: new Map()
        }
        groups.set(key, group)
      }
      group.items.push(eq)

      const branchKey = eq.branch_name?.trim() || 'Sede principal'
      const arr = group.branches.get(branchKey) || []
      arr.push(eq)
      group.branches.set(branchKey, arr)
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.client_name.localeCompare(b.client_name)
    )
  }, [filteredEquipment, clients])

  // Expandir todos los grupos por defecto cuando hay búsqueda activa
  useEffect(() => {
    if (userTouchedExpand) return
    if (search.trim() || clientFilter || statusFilter !== 'all') {
      setExpandedClients(new Set(groupedByClient.map(g => g.client_id)))
    } else if (groupedByClient.length <= 3) {
      setExpandedClients(new Set(groupedByClient.map(g => g.client_id)))
    }
  }, [groupedByClient, search, clientFilter, statusFilter, userTouchedExpand])

  const toggleClient = (clientId: string) => {
    setUserTouchedExpand(true)
    setExpandedClients(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) next.delete(clientId)
      else next.add(clientId)
      return next
    })
  }

  const expandAll = () => {
    setUserTouchedExpand(true)
    setExpandedClients(new Set(groupedByClient.map(g => g.client_id)))
  }

  const collapseAll = () => {
    setUserTouchedExpand(true)
    setExpandedClients(new Set())
  }

  // Buscar por QR
  const handleScanSearch = async () => {
    if (!scannedCode.trim()) return
    const found = await equipmentService.getByQRCode(scannedCode.trim())
    if (found) {
      setSelectedEquipment(found)
      setShowHistoryModal(true)
      setShowScanModal(false)
      setScannedCode('')
    } else {
      alert('Equipo no encontrado con ese código QR')
    }
  }

  const isAdmin = user?.user_type === 'admin'
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <QrCode className="text-indigo-600" />
            Equipos y Activos
          </h1>
          <p className="text-gray-500">Gestiona los equipos de clientes con código QR e historial de servicios</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <ScanLine size={20} />
            Buscar por QR
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Nuevo Equipo
            </button>
          )}
        </div>
      </div>
      
      {/* Search + Filtros + Vista */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código QR, marca, modelo, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
          >
            <option value="">Todos los clientes</option>
            {clients
              .slice()
              .sort((a, b) => a.business_name.localeCompare(b.business_name))
              .map(c => (
                <option key={c.id} value={c.id}>{c.business_name}</option>
              ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los estados</option>
            <option value="overdue">Mantenimiento vencido</option>
            <option value="due_soon">Próximo a vencer</option>
            <option value="in_warranty">En garantía</option>
            <option value="no_recent_service">Sin servicio en 90 días</option>
          </select>
          <div className="inline-flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-2 flex items-center gap-2 text-sm ${viewMode === 'grouped' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="Vista por familias de clientes"
            >
              <Users size={16} />
              Por familia
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 flex items-center gap-2 text-sm border-l ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="Vista de grilla plana"
            >
              <LayoutGrid size={16} />
              Grilla
            </button>
          </div>
        </div>
        {viewMode === 'grouped' && groupedByClient.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {groupedByClient.length} {groupedByClient.length === 1 ? 'familia' : 'familias'} de clientes · {equipment.length} equipos
            </span>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1"
              >
                <ChevronsUpDown size={14} /> Expandir todo
              </button>
              <button
                onClick={collapseAll}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1"
              >
                <ChevronsDownUp size={14} /> Colapsar todo
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Banda de alertas de mantenimiento */}
      {(maintenanceCounts.overdue > 0 || maintenanceCounts.dueSoon > 0) && statusFilter === 'all' && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {maintenanceCounts.overdue > 0 && (
            <button
              onClick={() => setStatusFilter('overdue')}
              className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition text-left"
            >
              <AlertCircle size={20} className="text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-800 text-sm">
                  {maintenanceCounts.overdue} {maintenanceCounts.overdue === 1 ? 'equipo con mantenimiento vencido' : 'equipos con mantenimiento vencido'}
                </p>
                <p className="text-xs text-red-600">Clic para filtrar</p>
              </div>
              <ChevronRight size={16} className="text-red-400" />
            </button>
          )}
          {maintenanceCounts.dueSoon > 0 && (
            <button
              onClick={() => setStatusFilter('due_soon')}
              className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition text-left"
            >
              <Calendar size={20} className="text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 text-sm">
                  {maintenanceCounts.dueSoon} {maintenanceCounts.dueSoon === 1 ? 'equipo próximo a mantenimiento' : 'equipos próximos a mantenimiento'}
                </p>
                <p className="text-xs text-amber-600">Vence en los próximos 14 días</p>
              </div>
              <ChevronRight size={16} className="text-amber-400" />
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left hover:shadow-md transition ${statusFilter === 'all' ? 'ring-2 ring-indigo-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Package size={24} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{equipment.length}</p>
              <p className="text-sm text-gray-500">Equipos</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('in_warranty')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left hover:shadow-md transition ${statusFilter === 'in_warranty' ? 'ring-2 ring-green-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {equipment.filter(e => e.warranty_until && new Date(e.warranty_until) > new Date()).length}
              </p>
              <p className="text-sm text-gray-500">En garantía</p>
            </div>
          </div>
        </button>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {new Set(equipment.map(e => e.client_id)).size}
              </p>
              <p className="text-sm text-gray-500">Clientes</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setStatusFilter('overdue')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left hover:shadow-md transition ${statusFilter === 'overdue' ? 'ring-2 ring-red-500' : ''} ${maintenanceCounts.overdue > 0 ? 'bg-red-50' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${maintenanceCounts.overdue > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertCircle size={24} className={maintenanceCounts.overdue > 0 ? 'text-red-600' : 'text-gray-400'} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${maintenanceCounts.overdue > 0 ? 'text-red-700' : 'text-gray-800'}`}>{maintenanceCounts.overdue}</p>
              <p className="text-sm text-gray-500">Mant. vencido</p>
            </div>
          </div>
        </button>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {equipment.reduce((acc, e) => acc + (e.total_services || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">Servicios</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Equipment listing */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      ) : equipment.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <QrCode size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay equipos registrados</p>
        </div>
      ) : viewMode === 'grouped' ? (
        groupedByClient.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No se encontraron equipos con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByClient.map(group => (
              <ClientFamilyGroup
                key={group.client_id}
                group={group}
                expanded={expandedClients.has(group.client_id)}
                onToggle={() => toggleClient(group.client_id)}
                onShowQR={(eq) => { setSelectedEquipment(eq); setShowQRModal(true) }}
                onShowHistory={(eq) => { setSelectedEquipment(eq); setShowHistoryModal(true) }}
                onEdit={(eq) => { setSelectedEquipment(eq); setShowEditModal(true) }}
                onBulkPrint={(title, items) => setBulkPrint({ title, items })}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map(eq => (
            <EquipmentCard
              key={eq.id}
              eq={eq}
              onShowQR={() => { setSelectedEquipment(eq); setShowQRModal(true) }}
              onShowHistory={() => { setSelectedEquipment(eq); setShowHistoryModal(true) }}
              onEdit={() => { setSelectedEquipment(eq); setShowEditModal(true) }}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
      
      {/* Modals */}
      {showAddModal && (
        <AddEquipmentModal
          clients={clients}
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}
      
      {showEditModal && selectedEquipment && (
        <EditEquipmentModal
          equipment={selectedEquipment}
          clients={clients}
          onClose={() => { setShowEditModal(false); setSelectedEquipment(null) }}
          onSubmit={(data) => updateMutation.mutate({ id: selectedEquipment.id, data })}
          onDelete={() => {
            if (confirm('¿Eliminar este equipo y todo su historial?')) {
              deleteMutation.mutate(selectedEquipment.id)
            }
          }}
          isLoading={updateMutation.isPending}
        />
      )}
      
      {showQRModal && selectedEquipment && (
        <QRCodeModal
          equipment={selectedEquipment}
          onClose={() => { setShowQRModal(false); setSelectedEquipment(null) }}
        />
      )}
      
      {showHistoryModal && selectedEquipment && (
        <HistoryModal
          equipment={selectedEquipment}
          onClose={() => { setShowHistoryModal(false); setSelectedEquipment(null) }}
        />
      )}
      
      {showScanModal && (
        <ScanQRModal
          value={scannedCode}
          onChange={setScannedCode}
          onSearch={handleScanSearch}
          onClose={() => { setShowScanModal(false); setScannedCode('') }}
        />
      )}

      {/* Host oculto para renderizar QRs en lote antes de imprimir */}
      {bulkPrint && (
        <div data-bulk-qr-host>
          <BulkQRRenderer
            items={bulkPrint.items}
            onReady={() => {
              openBulkQRPrint(bulkPrint.title, bulkPrint.items)
              // Limpiar el host después de abrir la ventana de impresión
              setTimeout(() => setBulkPrint(null), 600)
            }}
          />
        </div>
      )}
    </div>
  )
}

// Tarjeta individual de equipo (usada en grilla y dentro de familias)
function EquipmentCard({ eq, onShowQR, onShowHistory, onEdit, isAdmin }: {
  eq: Equipment
  onShowQR: () => void
  onShowHistory: () => void
  onEdit: () => void
  isAdmin: boolean
}) {
  const maint = getMaintenanceStatus(eq)
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative flex items-center justify-center">
        {eq.photo ? (
          <img src={eq.photo} alt={eq.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={48} className="text-white/50" />
        )}
        <button
          onClick={onShowQR}
          className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
          title="Ver código QR"
        >
          <QrCode size={20} className="text-indigo-600" />
        </button>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {eq.warranty_until && new Date(eq.warranty_until) > new Date() && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
              <Shield size={12} />
              En garantía
            </span>
          )}
          {maint.status === 'overdue' && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1">
              <AlertCircle size={12} />
              Mant. vencido
            </span>
          )}
          {maint.status === 'due_soon' && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full flex items-center gap-1">
              <Calendar size={12} />
              {maint.daysUntilDue}d
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3">
          <span className="text-xs text-gray-400 font-mono">{eq.qr_code}</span>
          <h3 className="font-semibold text-gray-800">{eq.name}</h3>
          {eq.brand && eq.model && (
            <p className="text-sm text-gray-500">{eq.brand} - {eq.model}</p>
          )}
        </div>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Building size={14} className="text-gray-400" />
            <span className="truncate">{eq.client_name}</span>
          </div>
          {eq.location && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />
              <span className="truncate">{eq.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Wrench size={14} className="text-gray-400" />
            <span>{eq.total_services || 0} servicios realizados</span>
          </div>
          {maint.nextDate && (
            <div className={`flex items-center gap-2 ${maint.status === 'overdue' ? 'text-red-600' : maint.status === 'due_soon' ? 'text-amber-600' : 'text-gray-600'}`}>
              <Calendar size={14} className={maint.status === 'overdue' ? 'text-red-500' : maint.status === 'due_soon' ? 'text-amber-500' : 'text-gray-400'} />
              <span className="truncate">
                Próximo mant.: {new Date(maint.nextDate).toLocaleDateString()}
                {maint.status === 'overdue' && ` (${Math.abs(maint.daysUntilDue || 0)}d vencido)`}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onShowHistory}
            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center justify-center gap-1"
          >
            <History size={16} />
            Historial
          </button>
          {isAdmin && (
            <button
              onClick={onEdit}
              className="p-2 border rounded-lg hover:bg-gray-50"
              title="Editar"
            >
              <Edit2 size={16} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente oculto que renderiza los QR SVG en el DOM para poder serializarlos en la impresión por lote.
function BulkQRRenderer({ items, onReady }: { items: Equipment[]; onReady: () => void }) {
  useEffect(() => {
    // Un tick para asegurar que los SVG ya están en el DOM
    const t = setTimeout(() => onReady(), 50)
    return () => clearTimeout(t)
  }, [items, onReady])
  return (
    <div style={{ position: 'fixed', left: -10000, top: -10000, pointerEvents: 'none' }} aria-hidden="true">
      {items.map(eq => (
        <div key={eq.id} data-qr-id={eq.id}>
          <QRCodeSVG value={eq.qr_code} size={180} level="H" includeMargin={true} />
        </div>
      ))}
    </div>
  )
}

// Abre ventana de impresión con todos los QR de los items indicados.
function openBulkQRPrint(title: string, items: Equipment[], containerSelector = '[data-bulk-qr-host]') {
  const host = document.querySelector(containerSelector)
  if (!host) return
  const cards = items.map(eq => {
    const wrapper = host.querySelector(`[data-qr-id="${eq.id}"]`)
    const svg = wrapper?.querySelector('svg')
    const svgData = svg ? new XMLSerializer().serializeToString(svg) : ''
    const meta2 = [eq.branch_name, eq.location].filter(Boolean).join(' · ')
    return `
      <div class="card">
        <div class="qr">${svgData}</div>
        <div class="code">${eq.qr_code}</div>
        <div class="name">${eq.name}</div>
        <div class="meta">${[eq.brand, eq.model].filter(Boolean).join(' · ')}</div>
        ${meta2 ? `<div class="meta">${meta2}</div>` : ''}
      </div>`
  }).join('')

  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(`<!DOCTYPE html><html><head><title>QR - ${title}</title>
    <style>
      @page { margin: 10mm; }
      body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }
      h1 { font-size: 16px; margin: 0 0 12px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; text-align: center; page-break-inside: avoid; }
      .qr svg { width: 100%; height: auto; max-width: 180px; }
      .code { font-family: monospace; font-size: 12px; font-weight: bold; margin-top: 6px; }
      .name { font-size: 13px; margin-top: 4px; }
      .meta { font-size: 11px; color: #6b7280; margin-top: 2px; }
    </style></head><body>
    <h1>QR Equipos · ${title} (${items.length})</h1>
    <div class="grid">${cards}</div>
    <script>window.onload = () => { window.print(); };<\/script>
    </body></html>`)
  printWindow.document.close()
}

// Grupo de familia (cliente) con equipos agrupados por sucursal
function ClientFamilyGroup({ group, expanded, onToggle, onShowQR, onShowHistory, onEdit, onBulkPrint, isAdmin }: {
  group: {
    client_id: string
    client_name: string
    client_category?: string
    client_segment?: string | null
    items: Equipment[]
    branches: Map<string, Equipment[]>
  }
  expanded: boolean
  onToggle: () => void
  onShowQR: (eq: Equipment) => void
  onShowHistory: (eq: Equipment) => void
  onEdit: (eq: Equipment) => void
  onBulkPrint: (title: string, items: Equipment[]) => void
  isAdmin: boolean
}) {
  const totalServices = group.items.reduce((acc, e) => acc + (e.total_services || 0), 0)
  const inWarranty = group.items.filter(e => e.warranty_until && new Date(e.warranty_until) > new Date()).length
  const branchesArr = Array.from(group.branches.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  // Inicial del cliente para avatar
  const initials = group.client_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() || '')
    .join('') || 'C'

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header de la familia */}
      <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
          aria-label={expanded ? 'Colapsar' : 'Expandir'}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800 truncate">{group.client_name}</h3>
              {group.client_category && (
                <span className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full">
                  {group.client_category}
                </span>
              )}
              {group.client_segment && (
                <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded-full">
                  {group.client_segment}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Package size={12} />
                {group.items.length} equipos
              </span>
              <span className="flex items-center gap-1">
                <Building size={12} />
                {branchesArr.length} {branchesArr.length === 1 ? 'sucursal' : 'sucursales'}
              </span>
              <span className="flex items-center gap-1">
                <Wrench size={12} />
                {totalServices} servicios
              </span>
              {inWarranty > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <Shield size={12} />
                  {inWarranty} en garantía
                </span>
              )}
            </div>
          </div>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onBulkPrint(group.client_name, group.items) }}
          className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 flex items-center gap-1 text-gray-600 shrink-0"
          title="Imprimir todos los QRs del cliente"
        >
          <Printer size={14} />
          QRs
        </button>
      </div>

      {/* Contenido expandido */}
      {expanded && (
        <div className="border-t bg-gray-50/50">
          {branchesArr.map(([branchName, items]) => (
            <div key={branchName} className="p-4 border-b last:border-b-0">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{branchName}</span>
                <span className="text-xs text-gray-400">· {items.length} {items.length === 1 ? 'equipo' : 'equipos'}</span>
                {branchesArr.length > 1 && (
                  <button
                    onClick={() => onBulkPrint(`${group.client_name} - ${branchName}`, items)}
                    className="ml-auto px-2 py-1 text-xs text-gray-500 hover:bg-white rounded flex items-center gap-1"
                    title="Imprimir QRs de esta sucursal"
                  >
                    <Printer size={12} />
                    Imprimir QRs
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(eq => (
                  <EquipmentCard
                    key={eq.id}
                    eq={eq}
                    onShowQR={() => onShowQR(eq)}
                    onShowHistory={() => onShowHistory(eq)}
                    onEdit={() => onEdit(eq)}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Modal para agregar equipo
function AddEquipmentModal({ clients, onClose, onSubmit, isLoading }: {
  clients: any[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    serial_number: '',
    description: '',
    location: '',
    photo: '',
    client_id: '',
    client_name: '',
    branch_name: '',
    branch_address: '',
    installation_date: '',
    warranty_until: '',
    maintenance_interval_days: 0,
    next_maintenance_date: '',
    maintenance_notes: ''
  })
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar 5MB')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setFormData({ ...formData, photo: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    setFormData({
      ...formData,
      client_id: clientId,
      client_name: client?.business_name || ''
    })
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-semibold">Nuevo Equipo</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Foto */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Equipo</label>
              {formData.photo ? (
                <div className="relative inline-block">
                  <img src={formData.photo} alt="Preview" className="h-32 w-auto rounded-lg border object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photo: '' })}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <Camera size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Clic para subir imagen</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Equipo *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Aire Acondicionado Split 3000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Serie</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
              <input
                type="text"
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Sucursal</label>
              <input
                type="text"
                value={formData.branch_address}
                onChange={(e) => setFormData({ ...formData, branch_address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación del Equipo</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Oficina 201, Piso 2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Instalación</label>
              <input
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantía hasta</label>
              <input
                type="date"
                value={formData.warranty_until}
                onChange={(e) => setFormData({ ...formData, warranty_until: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Mantenimiento preventivo */}
            <div className="col-span-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3 text-amber-800 font-medium text-sm">
                <Calendar size={16} />
                Mantenimiento preventivo
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Frecuencia (días)</label>
                  <select
                    value={formData.maintenance_interval_days}
                    onChange={(e) => setFormData({ ...formData, maintenance_interval_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value={0}>Sin programación</option>
                    <option value={30}>Mensual (30 días)</option>
                    <option value={60}>Bimestral (60 días)</option>
                    <option value={90}>Trimestral (90 días)</option>
                    <option value={180}>Semestral (180 días)</option>
                    <option value={365}>Anual (365 días)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Próximo mantenimiento</label>
                  <input
                    type="date"
                    value={formData.next_maintenance_date}
                    onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-700 mb-1">Notas / Tareas recurrentes</label>
                  <textarea
                    value={formData.maintenance_notes}
                    onChange={(e) => setFormData({ ...formData, maintenance_notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Ej: Limpieza filtros, recarga gas, ajuste sensores"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal para editar equipo
function EditEquipmentModal({ equipment, clients, onClose, onSubmit, onDelete, isLoading }: {
  equipment: Equipment
  clients: any[]
  onClose: () => void
  onSubmit: (data: Partial<Equipment>) => void
  onDelete: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: equipment.name,
    brand: equipment.brand || '',
    model: equipment.model || '',
    serial_number: equipment.serial_number || '',
    description: equipment.description || '',
    location: equipment.location || '',
    photo: equipment.photo || '',
    client_id: equipment.client_id,
    client_name: equipment.client_name,
    branch_name: equipment.branch_name || '',
    branch_address: equipment.branch_address || '',
    installation_date: equipment.installation_date || '',
    warranty_until: equipment.warranty_until || '',
    maintenance_interval_days: equipment.maintenance_interval_days || 0,
    next_maintenance_date: equipment.next_maintenance_date || '',
    maintenance_notes: equipment.maintenance_notes || ''
  })
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar 5MB')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setFormData({ ...formData, photo: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    setFormData({
      ...formData,
      client_id: clientId,
      client_name: client?.business_name || ''
    })
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-semibold">Editar Equipo</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-gray-500 mb-2">Código QR: <span className="font-mono">{equipment.qr_code}</span></div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Foto */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Equipo</label>
              {formData.photo ? (
                <div className="relative inline-block">
                  <img src={formData.photo} alt="Preview" className="h-32 w-auto rounded-lg border object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photo: '' })}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <Camera size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Clic para subir imagen</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Equipo *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Serie</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
              <input
                type="text"
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Sucursal</label>
              <input
                type="text"
                value={formData.branch_address}
                onChange={(e) => setFormData({ ...formData, branch_address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación del Equipo</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Instalación</label>
              <input
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantía hasta</label>
              <input
                type="date"
                value={formData.warranty_until}
                onChange={(e) => setFormData({ ...formData, warranty_until: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Mantenimiento preventivo */}
            <div className="col-span-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3 text-amber-800 font-medium text-sm">
                <Calendar size={16} />
                Mantenimiento preventivo
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Frecuencia (días)</label>
                  <select
                    value={formData.maintenance_interval_days}
                    onChange={(e) => setFormData({ ...formData, maintenance_interval_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value={0}>Sin programación</option>
                    <option value={30}>Mensual (30 días)</option>
                    <option value={60}>Bimestral (60 días)</option>
                    <option value={90}>Trimestral (90 días)</option>
                    <option value={180}>Semestral (180 días)</option>
                    <option value={365}>Anual (365 días)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Próximo mantenimiento</label>
                  <input
                    type="date"
                    value={formData.next_maintenance_date}
                    onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-700 mb-1">Notas / Tareas recurrentes</label>
                  <textarea
                    value={formData.maintenance_notes}
                    onChange={(e) => setFormData({ ...formData, maintenance_notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Ej: Limpieza filtros, recarga gas, ajuste sensores"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal para mostrar QR
function QRCodeModal({ equipment, onClose }: { equipment: Equipment; onClose: () => void }) {
  const qrRef = useRef<HTMLDivElement>(null)
  
  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `QR-${equipment.qr_code}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${equipment.qr_code}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container { text-align: center; padding: 20px; }
            .qr-code { margin-bottom: 20px; }
            .info { font-size: 14px; color: #333; }
            .code { font-family: monospace; font-size: 18px; font-weight: bold; margin: 10px 0; }
            .name { font-size: 16px; color: #666; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-code">${svgData}</div>
            <div class="code">${equipment.qr_code}</div>
            <div class="name">${equipment.name}</div>
            <div class="info">${equipment.client_name}</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Código QR del Equipo</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div ref={qrRef} className="flex flex-col items-center mb-6">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
              <QRCodeSVG 
                value={equipment.qr_code} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="mt-4 font-mono text-lg font-bold text-gray-800">{equipment.qr_code}</p>
            <p className="text-gray-600">{equipment.name}</p>
            <p className="text-sm text-gray-500">{equipment.client_name}</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Descargar PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <Printer size={16} />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal de historial de servicios
function HistoryModal({ equipment, onClose }: { equipment: Equipment; onClose: () => void }) {
  const { data: serviceHistory = [], isLoading } = useQuery({
    queryKey: ['service-history', equipment.id],
    queryFn: () => equipmentService.getServiceHistory(equipment.id)
  })
  
  const getServiceTypeStyle = (type: string) => {
    const st = SERVICE_TYPES.find(s => s.value === type)
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700',
      orange: 'bg-orange-100 text-orange-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700',
      red: 'bg-red-100 text-red-700'
    }
    return colors[st?.color || 'blue'] || colors.blue
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold">Historial de Servicios</h3>
            <p className="text-sm text-gray-500">{equipment.name} - {equipment.qr_code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        {/* Equipment Info */}
        <div className="p-4 bg-gray-50 border-b grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Cliente</span>
            <p className="font-medium">{equipment.client_name}</p>
          </div>
          <div>
            <span className="text-gray-500">Ubicación</span>
            <p className="font-medium">{equipment.location || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">Instalación</span>
            <p className="font-medium">{equipment.installation_date ? new Date(equipment.installation_date).toLocaleDateString() : '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">Total Servicios</span>
            <p className="font-medium text-indigo-600">{equipment.total_services || 0}</p>
          </div>
        </div>
        
        {/* Service History */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
          ) : serviceHistory.length === 0 ? (
            <div className="text-center py-12">
              <History size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay registros de servicio</p>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceHistory.map((record, index) => (
                <div key={record.id} className="relative pl-8 pb-4">
                  {/* Timeline line */}
                  {index < serviceHistory.length - 1 && (
                    <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200" />
                  )}
                  
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Wrench size={12} className="text-white" />
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getServiceTypeStyle(record.service_type)}`}>
                            {SERVICE_TYPES.find(s => s.value === record.service_type)?.label || record.service_type}
                          </span>
                          <span className="text-sm text-gray-500">#{record.ticket_number}</span>
                        </div>
                        <h4 className="font-medium text-gray-800">{record.description}</h4>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-600">{new Date(record.service_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{record.work_performed}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {record.technician_name}
                      </span>
                      {record.notes && (
                        <span className="flex items-center gap-1">
                          <FileText size={12} />
                          {record.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal para escanear/buscar QR
function ScanQRModal({ value, onChange, onSearch, onClose }: {
  value: string
  onChange: (v: string) => void
  onSearch: () => void
  onClose: () => void
}) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = 'qr-scanner-container'
  
  const startScanner = async () => {
    setScanError('')
    
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId)
      scannerRef.current = html5QrCode
      
      await html5QrCode.start(
        { facingMode: "environment" }, // Cámara trasera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // QR escaneado exitosamente
          onChange(decodedText.toUpperCase())
          stopScanner()
          // Auto-buscar cuando se escanea
          setTimeout(() => onSearch(), 100)
        },
        () => {
          // Error de escaneo (ignorar, es normal mientras busca)
        }
      )
      
      setIsScanning(true)
    } catch (err: any) {
      console.error('Error al iniciar escáner:', err)
      if (err.toString().includes('NotAllowedError')) {
        setScanError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.')
      } else if (err.toString().includes('NotFoundError')) {
        setScanError('No se encontró ninguna cámara en este dispositivo.')
      } else {
        setScanError('Error al acceder a la cámara: ' + err.message)
      }
    }
  }
  
  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (err) {
        console.error('Error al detener escáner:', err)
      }
    }
    setIsScanning(false)
  }
  
  // Cleanup al cerrar el modal
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])
  
  const handleClose = () => {
    stopScanner()
    onClose()
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ScanLine className="text-purple-600" />
            Escanear Código QR
          </h3>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Área del escáner */}
          <div className="mb-4">
            <div 
              id={scannerContainerId}
              className={`w-full aspect-square rounded-lg overflow-hidden bg-gray-900 ${!isScanning ? 'hidden' : ''}`}
            />
            
            {!isScanning && (
              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
                <Camera size={64} className="text-gray-400 mb-4" />
                <p className="text-gray-500 text-center mb-4">
                  Presiona el botón para activar la cámara<br/>y escanear el código QR
                </p>
                <button
                  onClick={startScanner}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Video size={20} />
                  Activar Cámara
                </button>
              </div>
            )}
            
            {isScanning && (
              <button
                onClick={stopScanner}
                className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <VideoOff size={16} />
                Detener Cámara
              </button>
            )}
          </div>
          
          {scanError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {scanError}
            </div>
          )}
          
          {/* Separador */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400">O ingresa manualmente</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          
          {/* Input manual */}
          <div className="space-y-4">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              placeholder="SOSC-EQ-XXXXXX"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-lg text-center"
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => { stopScanner(); onSearch(); }}
                disabled={!value.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Search size={16} />
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
