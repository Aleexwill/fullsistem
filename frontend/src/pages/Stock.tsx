import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { inventoryService, InventoryItem, InventoryMovement, TechnicianAssignment, getItemCategories, addCategory, deleteCategory, UNITS, ITEM_CONDITIONS } from '../services/inventory'
import { techniciansService } from '../services/technicians'
import { ticketsService, Ticket } from '../services/tickets'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  Package, Wrench, Box, Plus, Search, Filter, AlertTriangle,
  ArrowDownToLine, ArrowUpFromLine, X, History, Users, Edit2,
  Trash2, Check, Loader2, MapPin, BarChart3, Camera, ImageIcon,
  QrCode, ScanLine, Video, VideoOff, Download, Printer, Tag, FolderPlus
} from 'lucide-react'

export default function Stock() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState<'items' | 'movements' | 'assignments'>('items')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [categories, setCategories] = useState(getItemCategories())
  const [selectedImage, setSelectedImage] = useState<{ url: string, name: string } | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  
  // Refrescar categorías
  const refreshCategories = () => setCategories(getItemCategories())
  
  // Queries
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['inventory-items', categoryFilter, search],
    queryFn: () => inventoryService.listItems({ category: categoryFilter || undefined, search: search || undefined })
  })
  
  const { data: movements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => inventoryService.listMovements()
  })
  
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['inventory-assignments'],
    queryFn: () => inventoryService.listAssignments()
  })
  
  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryService.getStats()
  })
  
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => techniciansService.list()
  })
  
  const { data: ticketsData } = useQuery({
    queryKey: ['tickets-for-stock'],
    queryFn: () => ticketsService.list()
  })
  const tickets = ticketsData?.items || []
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof inventoryService.createItem>[0]) => inventoryService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      setShowAddModal(false)
    }
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) => inventoryService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      setShowEditModal(false)
      setSelectedItem(null)
    }
  })
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
    }
  })
  
  const withdrawMutation = useMutation({
    mutationFn: (data: Parameters<typeof inventoryService.withdraw>[0]) => inventoryService.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      setShowWithdrawModal(false)
      setSelectedItem(null)
    }
  })
  
  const returnMutation = useMutation({
    mutationFn: (data: Parameters<typeof inventoryService.return>[0]) => inventoryService.return(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      setShowReturnModal(false)
      setSelectedItem(null)
    }
  })
  
  const lowStockItems = items.filter(i => i.available_quantity <= i.min_stock)
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Package className="text-indigo-500" />
            Stock de Herramientas y Materiales
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona el inventario, retiros y devoluciones
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <ScanLine size={20} />
            Escanear QR
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Item
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Package size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.totalItems || 0}</p>
              <p className="text-xs text-gray-500">Total Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.totalTools || 0}</p>
              <p className="text-xs text-gray-500">Herramientas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Box size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.totalMaterials || 0}</p>
              <p className="text-xs text-gray-500">Materiales</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.lowStockCount || 0}</p>
              <p className="text-xs text-gray-500">Stock Bajo</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.pendingReturns || 0}</p>
              <p className="text-xs text-gray-500">En Préstamo</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-700 mb-2">
            <AlertTriangle size={20} />
            <span className="font-semibold">Items con Stock Bajo</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <span key={item.id} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {item.name}: {item.available_quantity}/{item.min_stock} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'items' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={18} />
              Inventario
            </div>
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'movements' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <History size={18} />
              Movimientos
            </div>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'assignments' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              Asignaciones
            </div>
          </button>
        </div>
      </div>
      
      {/* Content */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowCategoriesModal(true)}
                className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium"
                title="Gestionar categorías"
              >
                + Categorías
              </button>
            </div>
          </div>
          
          {/* Items Grid */}
          {loadingItems ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay items en el inventario</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  {/* Imagen del artículo */}
                  {item.image ? (
                    <div 
                      className="h-40 bg-gray-100 relative cursor-pointer group"
                      onClick={() => { setSelectedImage({ url: item.image!, name: item.name }); setShowImageModal(true) }}
                    >
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                        <ImageIcon size={24} className="text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                      </div>
                      <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        item.available_quantity <= item.min_stock 
                          ? 'bg-red-500 text-white' 
                          : 'bg-green-500 text-white'
                      }`}>
                        {item.available_quantity} disp.
                      </span>
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                      {item.category === 'tool' ? (
                        <Wrench size={48} className="text-gray-300" />
                      ) : (
                        <Box size={48} className="text-gray-300" />
                      )}
                      <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        item.available_quantity <= item.min_stock 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.available_quantity} disp.
                      </span>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${item.category === 'tool' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {item.category === 'tool' ? (
                            <Wrench size={14} className="text-blue-600" />
                          ) : (
                            <Box size={14} className="text-green-600" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">{item.code}</span>
                          <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                        </div>
                      </div>
                    </div>
                  
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {item.location}
                    </span>
                    <span>{item.unit}</span>
                  </div>
                  
                  {/* Stock Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Stock: {item.available_quantity} / {item.total_quantity}</span>
                      <span>Min: {item.min_stock}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          item.available_quantity <= item.min_stock ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(item.available_quantity / item.total_quantity) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedItem(item); setShowWithdrawModal(true) }}
                        disabled={item.available_quantity === 0}
                        className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <ArrowUpFromLine size={16} />
                        Retirar
                      </button>
                      <button
                        onClick={() => { setSelectedItem(item); setShowReturnModal(true) }}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center justify-center gap-1"
                      >
                        <ArrowDownToLine size={16} />
                        Devolver
                      </button>
                      <button
                        onClick={() => { setSelectedItem(item); setShowHistoryModal(true) }}
                        className="p-2 border rounded-lg hover:bg-gray-50"
                        title="Ver historial"
                      >
                        <History size={16} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => { setSelectedItem(item); setShowQRModal(true) }}
                        className="p-2 border rounded-lg hover:bg-gray-50"
                        title="Ver código QR"
                      >
                        <QrCode size={16} className="text-purple-500" />
                      </button>
                      <button
                        onClick={() => { setSelectedItem(item); setShowEditModal(true) }}
                        className="p-2 border rounded-lg hover:bg-gray-50"
                        title="Editar"
                      >
                        <Edit2 size={16} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl shadow-sm border">
          {loadingMovements ? (
            <div className="p-12 text-center text-gray-500">Cargando...</div>
          ) : movements.length === 0 ? (
            <div className="p-12 text-center">
              <History size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Retiro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Devolución</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movements.map(mov => {
                    const conditionAtWithdrawal = ITEM_CONDITIONS.find(c => c.value === mov.condition_at_withdrawal)
                    const conditionAtReturn = ITEM_CONDITIONS.find(c => c.value === mov.condition_at_return)
                    
                    return (
                      <tr key={mov.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(mov.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mov.type === 'withdrawal' ? 'bg-orange-100 text-orange-700' :
                            mov.type === 'return' ? 'bg-green-100 text-green-700' :
                            mov.type === 'purchase' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {mov.type === 'withdrawal' ? 'Retiro' :
                             mov.type === 'return' ? 'Devolución' :
                             mov.type === 'purchase' ? 'Compra' : 'Ajuste'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-800">{mov.item_name}</div>
                          <div className="text-xs text-gray-400">{mov.item_code}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{mov.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{mov.technician_name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-blue-600">{mov.ticket_number || '-'}</td>
                        <td className="px-4 py-3">
                          {conditionAtWithdrawal ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${conditionAtWithdrawal.color}-100 text-${conditionAtWithdrawal.color}-700`}>
                              {conditionAtWithdrawal.label}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {mov.type === 'return' && conditionAtReturn ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${conditionAtReturn.color}-100 text-${conditionAtReturn.color}-700`}>
                              {conditionAtReturn.label}
                            </span>
                          ) : mov.type === 'return' ? '-' : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={mov.notes}>{mov.notes || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl shadow-sm border">
          {loadingAssignments ? (
            <div className="p-12 text-center text-gray-500">Cargando...</div>
          ) : assignments.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay items asignados a técnicos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado al Retirar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Retiro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignments.map((asn, idx) => {
                    const condition = ITEM_CONDITIONS.find(c => c.value === asn.condition_at_withdrawal)
                    return (
                      <tr key={`${asn.technician_id}-${asn.item_id}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm">
                              {asn.technician_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium text-gray-800">{asn.technician_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-800">{asn.item_name}</div>
                          <div className="text-xs text-gray-400">{asn.item_code}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{asn.quantity}</td>
                        <td className="px-4 py-3">
                          {condition ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${condition.color}-100 text-${condition.color}-700`}>
                              {condition.label}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(asn.withdrawn_at)}</td>
                        <td className="px-4 py-3 text-sm text-blue-600">{asn.ticket_number || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate" title={asn.notes}>{asn.notes || '-'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              const item = items.find(i => i.id === asn.item_id)
                              if (item) {
                                setSelectedItem({ ...item, _assignment: asn } as any)
                                setShowReturnModal(true)
                              }
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center gap-1"
                          >
                            <ArrowDownToLine size={14} />
                            Devolver
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Modal Agregar Item */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          categories={categories}
        />
      )}
      
      {/* Modal Editar Item */}
      {showEditModal && selectedItem && (
        <EditItemModal
          item={selectedItem}
          onClose={() => { setShowEditModal(false); setSelectedItem(null) }}
          onSubmit={(data) => updateMutation.mutate({ id: selectedItem.id, data })}
          onDelete={() => {
            if (confirm('¿Eliminar este item?')) {
              deleteMutation.mutate(selectedItem.id)
              setShowEditModal(false)
              setSelectedItem(null)
            }
          }}
          isLoading={updateMutation.isPending}
        />
      )}
      
      {/* Modal Retirar */}
      {showWithdrawModal && selectedItem && (
        <WithdrawModal
          item={selectedItem}
          technicians={technicians}
          tickets={tickets}
          onClose={() => { setShowWithdrawModal(false); setSelectedItem(null) }}
          onSubmit={(data) => withdrawMutation.mutate({ ...data, created_by: user?.full_name || 'Sistema' })}
          isLoading={withdrawMutation.isPending}
        />
      )}
      
      {/* Modal Devolver */}
      {showReturnModal && selectedItem && (
        <ReturnModal
          item={selectedItem}
          assignments={assignments.filter(a => a.item_id === selectedItem.id)}
          onClose={() => { setShowReturnModal(false); setSelectedItem(null) }}
          onSubmit={(data) => returnMutation.mutate({ ...data, created_by: user?.full_name || 'Sistema' })}
          isLoading={returnMutation.isPending}
        />
      )}
      
      {/* Modal Historial del Item */}
      {showHistoryModal && selectedItem && (
        <ItemHistoryModal
          item={selectedItem}
          movements={movements.filter(m => m.item_id === selectedItem.id)}
          onClose={() => { setShowHistoryModal(false); setSelectedItem(null) }}
        />
      )}
      
      {/* Modal de imagen completa */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => { setShowImageModal(false); setSelectedImage(null) }}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 bg-gray-100 border-b">
              <h3 className="font-medium text-gray-800">{selectedImage.name}</h3>
              <button 
                onClick={() => { setShowImageModal(false); setSelectedImage(null) }}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-2 bg-gray-50">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Modal QR del item */}
      {showQRModal && selectedItem && (
        <ItemQRModal
          item={selectedItem}
          onClose={() => { setShowQRModal(false); setSelectedItem(null) }}
        />
      )}
      
      {/* Modal Escáner QR */}
      {showScanModal && (
        <ScanStockQRModal
          items={items}
          onClose={() => setShowScanModal(false)}
          onFound={(item) => {
            setShowScanModal(false)
            setSelectedItem(item)
            setShowHistoryModal(true)
          }}
        />
      )}
      
      {/* Modal Gestionar Categorías */}
      {showCategoriesModal && (
        <CategoriesModal
          categories={categories}
          onClose={() => setShowCategoriesModal(false)}
          onAdd={(label) => {
            try {
              addCategory(label)
              refreshCategories()
            } catch (err: any) {
              alert(err.message)
            }
          }}
          onDelete={(value) => {
            try {
              deleteCategory(value)
              refreshCategories()
              if (categoryFilter === value) setCategoryFilter('')
            } catch (err: any) {
              alert(err.message)
            }
          }}
        />
      )}
    </div>
  )
}

// Modal Agregar Item
function AddItemModal({ onClose, onSubmit, isLoading, categories }: {
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  categories: { value: string; label: string }[]
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: categories[0]?.value || 'tool',
    unit: 'Unidad',
    total_quantity: 1,
    min_stock: 1,
    location: '',
    image: ''
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
        setFormData({ ...formData, image: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Nuevo Item de Inventario</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Taladro Inalámbrico"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder="Descripción del item..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Inicial *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.total_quantity}
                onChange={(e) => setFormData({...formData, total_quantity: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Estante A-1"
              />
            </div>
            
            {/* Foto del artículo */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Artículo</label>
              {formData.image ? (
                <div className="relative inline-block">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="h-32 w-auto rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Clic para subir imagen</span>
                  <span className="text-xs text-gray-400">PNG, JPG hasta 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
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

// Modal Editar Item
function EditItemModal({ item, onClose, onSubmit, onDelete, isLoading }: {
  item: InventoryItem
  onClose: () => void
  onSubmit: (data: Partial<InventoryItem>) => void
  onDelete: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description,
    unit: item.unit,
    total_quantity: item.total_quantity,
    min_stock: item.min_stock,
    location: item.location,
    image: item.image || ''
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
        setFormData({ ...formData, image: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Editar Item</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-gray-500 mb-4">Código: {item.code}</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Total</label>
              <input
                type="number"
                min="0"
                value={formData.total_quantity}
                onChange={(e) => setFormData({...formData, total_quantity: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {/* Foto del artículo */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Artículo</label>
              {formData.image ? (
                <div className="relative inline-block">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="h-32 w-auto rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Clic para subir imagen</span>
                  <span className="text-xs text-gray-400">PNG, JPG hasta 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
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

// Modal Retirar
function WithdrawModal({ item, technicians, tickets, onClose, onSubmit, isLoading }: {
  item: InventoryItem
  technicians: any[]
  tickets: Ticket[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    item_id: item.id,
    quantity: 1,
    technician_id: '',
    technician_name: '',
    ticket_id: '',
    ticket_number: '',
    condition: 'good', // Estado al retirar
    notes: ''
  })
  
  // Filtrar tickets asignados al técnico seleccionado o donde es proveedor asignado
  const technicianTickets = (formData.technician_id && Array.isArray(tickets))
    ? tickets.filter(t => {
        if (!t) return false
        const assignedToId = t.assigned_to?.user_id
        const assignedSupplierId = (t as any).assigned_supplier?.user_id
        return assignedToId === formData.technician_id || assignedSupplierId === formData.technician_id
      })
    : []
  
  const handleTechnicianChange = (techId: string) => {
    const tech = technicians.find(t => t.user_id === techId)
    setFormData({
      ...formData,
      technician_id: techId,
      technician_name: tech?.full_name || '',
      ticket_id: '', // Limpiar ticket al cambiar técnico
      ticket_number: ''
    })
  }
  
  const handleTicketChange = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId)
    setFormData({
      ...formData,
      ticket_id: ticketId,
      ticket_number: ticket?.ticket_number || ''
    })
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.technician_id) {
      alert('Selecciona un técnico')
      return
    }
    if (formData.quantity > item.available_quantity) {
      alert('Cantidad excede el stock disponible')
      return
    }
    onSubmit(formData)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b bg-orange-50">
          <h3 className="text-xl font-semibold text-orange-900">Registrar Retiro</h3>
          <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Item</p>
            <p className="font-semibold text-gray-800">{item.name}</p>
            <p className="text-sm text-green-600">Disponible: {item.available_quantity} {item.unit}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Técnico *</label>
            <select
              required
              value={formData.technician_id}
              onChange={(e) => handleTechnicianChange(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Seleccionar técnico...</option>
              {technicians.map(tech => (
                <option key={tech.user_id} value={tech.user_id}>{tech.full_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
            <input
              type="number"
              required
              min="1"
              max={item.available_quantity}
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Asignado (opcional)</label>
            {!formData.technician_id ? (
              <p className="text-sm text-gray-400 italic py-2">Selecciona primero un técnico</p>
            ) : technicianTickets.length === 0 ? (
              <p className="text-sm text-amber-600 italic py-2">Este técnico no tiene tickets asignados</p>
            ) : (
              <select
                value={formData.ticket_id}
                onChange={(e) => handleTicketChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Sin ticket específico</option>
                {technicianTickets.map(ticket => {
                  const title = ticket.title || 'Sin título'
                  return (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.ticket_number} - {title.substring(0, 40)}{title.length > 40 ? '...' : ''}
                    </option>
                  )
                })}
              </select>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado del Item al Retirar *</label>
            <select
              required
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {ITEM_CONDITIONS.map(cond => (
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={2}
              placeholder="Motivo del retiro..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpFromLine size={16} />}
              Registrar Retiro
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal Devolver
function ReturnModal({ item, assignments, onClose, onSubmit, isLoading }: {
  item: InventoryItem & { _assignment?: TechnicianAssignment }
  assignments: TechnicianAssignment[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const preselectedAssignment = (item as any)._assignment
  const [formData, setFormData] = useState({
    item_id: item.id,
    quantity: preselectedAssignment?.quantity || 1,
    technician_id: preselectedAssignment?.technician_id || '',
    technician_name: preselectedAssignment?.technician_name || '',
    condition: 'good', // Estado al devolver
    notes: ''
  })
  
  const selectedAssignment = assignments.find(a => a.technician_id === formData.technician_id)
  const maxQuantity = selectedAssignment?.quantity || 0
  
  const handleTechnicianChange = (techId: string) => {
    const asn = assignments.find(a => a.technician_id === techId)
    setFormData({
      ...formData,
      technician_id: techId,
      technician_name: asn?.technician_name || '',
      quantity: asn?.quantity || 1
    })
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.technician_id) {
      alert('Selecciona un técnico')
      return
    }
    onSubmit(formData)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b bg-green-50">
          <h3 className="text-xl font-semibold text-green-900">Registrar Devolución</h3>
          <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Item</p>
            <p className="font-semibold text-gray-800">{item.name}</p>
          </div>
          
          {assignments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No hay técnicos con este item asignado
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Técnico *</label>
                <select
                  required
                  value={formData.technician_id}
                  onChange={(e) => handleTechnicianChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar técnico...</option>
                  {assignments.map(asn => (
                    <option key={asn.technician_id} value={asn.technician_id}>
                      {asn.technician_name} (tiene {asn.quantity})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedAssignment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad a devolver (máx: {maxQuantity})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={maxQuantity}
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}
              
              {selectedAssignment && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="text-blue-700">
                    <span className="font-medium">Retirado el:</span> {new Date(selectedAssignment.withdrawn_at).toLocaleDateString('es-AR')}
                  </p>
                  {selectedAssignment.condition_at_withdrawal && (
                    <p className="text-blue-700">
                      <span className="font-medium">Estado al retiro:</span> {ITEM_CONDITIONS.find(c => c.value === selectedAssignment.condition_at_withdrawal)?.label}
                    </p>
                  )}
                  {selectedAssignment.ticket_number && (
                    <p className="text-blue-700">
                      <span className="font-medium">Ticket:</span> {selectedAssignment.ticket_number}
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado del Item al Devolver *</label>
                <select
                  required
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {ITEM_CONDITIONS.map(cond => (
                    <option key={cond.value} value={cond.value}>{cond.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Observaciones sobre el estado del item..."
                />
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading || assignments.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
              Registrar Devolución
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal Historial del Item
function ItemHistoryModal({ item, movements, onClose }: {
  item: InventoryItem
  movements: InventoryMovement[]
  onClose: () => void
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Estadísticas del item
  const totalWithdrawals = movements.filter(m => m.type === 'withdrawal').length
  const totalReturns = movements.filter(m => m.type === 'return').length
  const totalQuantityWithdrawn = movements.filter(m => m.type === 'withdrawal').reduce((sum, m) => sum + m.quantity, 0)
  const totalQuantityReturned = movements.filter(m => m.type === 'return').reduce((sum, m) => sum + m.quantity, 0)
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b bg-blue-50">
          <div>
            <h3 className="text-xl font-semibold text-blue-900">Historial del Item</h3>
            <p className="text-sm text-blue-700">{item.code} - {item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        {/* Estadísticas */}
        <div className="p-4 border-b bg-gray-50 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{totalWithdrawals}</p>
            <p className="text-xs text-gray-500">Retiros</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalReturns}</p>
            <p className="text-xs text-gray-500">Devoluciones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{totalQuantityWithdrawn}</p>
            <p className="text-xs text-gray-500">Cant. Retirada</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalQuantityReturned}</p>
            <p className="text-xs text-gray-500">Cant. Devuelta</p>
          </div>
        </div>
        
        {/* Lista de movimientos */}
        <div className="flex-1 overflow-y-auto p-4">
          {movements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No hay movimientos registrados para este item</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map(mov => {
                const conditionWithdrawal = ITEM_CONDITIONS.find(c => c.value === mov.condition_at_withdrawal)
                const conditionReturn = ITEM_CONDITIONS.find(c => c.value === mov.condition_at_return)
                
                return (
                  <div 
                    key={mov.id} 
                    className={`p-4 rounded-lg border-l-4 ${
                      mov.type === 'withdrawal' ? 'bg-orange-50 border-orange-500' :
                      mov.type === 'return' ? 'bg-green-50 border-green-500' :
                      'bg-gray-50 border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          mov.type === 'withdrawal' ? 'bg-orange-200 text-orange-800' :
                          mov.type === 'return' ? 'bg-green-200 text-green-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {mov.type === 'withdrawal' ? '↑ RETIRO' :
                           mov.type === 'return' ? '↓ DEVOLUCIÓN' :
                           mov.type === 'purchase' ? 'COMPRA' : 'AJUSTE'}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {mov.quantity} {item.unit}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(mov.created_at)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {mov.technician_name && (
                        <div>
                          <span className="text-gray-500">Técnico:</span>
                          <span className="ml-1 font-medium">{mov.technician_name}</span>
                        </div>
                      )}
                      {mov.ticket_number && (
                        <div>
                          <span className="text-gray-500">Ticket:</span>
                          <span className="ml-1 font-medium text-blue-600">{mov.ticket_number}</span>
                        </div>
                      )}
                      {conditionWithdrawal && (
                        <div>
                          <span className="text-gray-500">Estado al retiro:</span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-xs bg-${conditionWithdrawal.color}-100 text-${conditionWithdrawal.color}-700`}>
                            {conditionWithdrawal.label}
                          </span>
                        </div>
                      )}
                      {mov.type === 'return' && conditionReturn && (
                        <div>
                          <span className="text-gray-500">Estado al devolver:</span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-xs bg-${conditionReturn.color}-100 text-${conditionReturn.color}-700`}>
                            {conditionReturn.label}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {mov.notes && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        "{mov.notes}"
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Registrado por: {mov.created_by}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <button 
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal QR del Item
function ItemQRModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
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
      downloadLink.download = `QR-${item.qr_code}.png`
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
          <title>QR - ${item.qr_code}</title>
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
            <div class="code">${item.qr_code}</div>
            <div class="name">${item.name}</div>
            <div class="info">${item.code} - ${item.location}</div>
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
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <QrCode className="text-purple-600" />
            Código QR del Item
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div ref={qrRef} className="flex flex-col items-center mb-6">
            <div className="p-4 bg-white border-2 border-purple-200 rounded-xl">
              <QRCodeSVG 
                value={item.qr_code} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="mt-4 font-mono text-lg font-bold text-purple-600">{item.qr_code}</p>
            <p className="text-gray-800 font-medium">{item.name}</p>
            <p className="text-sm text-gray-500">{item.code} - {item.location}</p>
            <p className="text-xs text-gray-400">
              Stock: {item.available_quantity} / {item.total_quantity} {item.unit}
            </p>
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
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

// Modal Escanear QR de Stock
function ScanStockQRModal({ items, onClose, onFound }: {
  items: InventoryItem[]
  onClose: () => void
  onFound: (item: InventoryItem) => void
}) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = 'stock-qr-scanner'
  
  const startScanner = async () => {
    setScanError('')
    
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId)
      scannerRef.current = html5QrCode
      
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Buscar item por QR code
          const foundItem = items.find(
            i => i.qr_code?.toUpperCase() === decodedText.toUpperCase()
          )
          if (foundItem) {
            stopScanner()
            onFound(foundItem)
          } else {
            setScanError(`Item no encontrado: ${decodedText}`)
          }
        },
        () => {}
      )
      
      setIsScanning(true)
    } catch (err: any) {
      console.error('Error al iniciar escáner:', err)
      if (err.toString().includes('NotAllowedError')) {
        setScanError('Permiso de cámara denegado')
      } else if (err.toString().includes('NotFoundError')) {
        setScanError('No se encontró cámara')
      } else {
        setScanError('Error al acceder a la cámara')
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
  
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])
  
  const handleManualSearch = () => {
    if (!manualCode.trim()) return
    const foundItem = items.find(
      i => i.qr_code?.toUpperCase() === manualCode.toUpperCase().trim()
    )
    if (foundItem) {
      stopScanner()
      onFound(foundItem)
    } else {
      setScanError(`Item no encontrado: ${manualCode}`)
    }
  }
  
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
            Escanear QR de Stock
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
              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col items-center justify-center">
                <QrCode size={64} className="text-purple-400 mb-4" />
                <p className="text-gray-600 text-center mb-4">
                  Escanea el código QR del item<br/>para ver su información
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
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="SOSC-STK-XXXXXX"
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
                onClick={handleManualSearch}
                disabled={!manualCode.trim()}
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

// Modal Gestionar Categorías
function CategoriesModal({ categories, onClose, onAdd, onDelete }: {
  categories: { value: string; label: string; icon?: string }[]
  onClose: () => void
  onAdd: (label: string) => void
  onDelete: (value: string) => void
}) {
  const [newCategory, setNewCategory] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  // Categorías predefinidas que no se pueden eliminar
  const defaultCategories = ['tool', 'material', 'equipment', 'safety', 'consumable', 'spare']
  
  const handleAdd = () => {
    if (!newCategory.trim()) return
    onAdd(newCategory.trim())
    setNewCategory('')
    setIsAdding(false)
  }
  
  const getCategoryIcon = (icon?: string) => {
    switch (icon) {
      case 'wrench': return <Wrench size={18} />
      case 'box': return <Box size={18} />
      case 'monitor': return <Package size={18} />
      case 'shield': return <Package size={18} />
      case 'package': return <Package size={18} />
      case 'cog': return <Package size={18} />
      default: return <Tag size={18} />
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="text-indigo-600" />
            Gestionar Categorías
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Lista de categorías */}
          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
            {categories.map(cat => (
              <div 
                key={cat.value}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border text-gray-600">
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{cat.label}</p>
                    <p className="text-xs text-gray-400">{cat.value}</p>
                  </div>
                </div>
                {!defaultCategories.includes(cat.value) && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la categoría "${cat.label}"?`)) {
                        onDelete(cat.value)
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Eliminar categoría"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Agregar nueva categoría */}
          {isAdding ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nombre de la categoría"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                disabled={!newCategory.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Check size={20} />
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewCategory('') }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full px-4 py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2"
            >
              <FolderPlus size={20} />
              Agregar Nueva Categoría
            </button>
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
