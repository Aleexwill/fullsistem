import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ticketsService, Ticket, QuoteItem } from '../services/tickets'
import { clientsService } from '../services/clients'
import { suppliersService } from '../services/suppliers'
import { techniciansService } from '../services/technicians'
import { useAuthStore } from '../stores/authStore'
import { 
  Plus, Search, X, Trash2, 
  ClipboardList, FileText, Calculator, Eye, CheckCircle, XCircle,
  UserPlus, Truck, Camera, Image as ImageIcon, Sparkles, Loader2,
  MessageCircle, Send, Smartphone, Copy, ExternalLink,
  LayoutGrid, List, Filter, SortAsc, SortDesc, Clock, AlertTriangle,
  BarChart3, ArrowUpDown, Calendar, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react'

// Categorías predefinidas de tickets
const TICKET_CATEGORIES = [
  'Climatización', 'Refrigeración', 'Seguridad', 'Infraestructura IT',
  'Automatización', 'Electricidad', 'Plomería', 'Mantenimiento General',
  'Redes y Telecomunicaciones', 'Sistemas de Incendio', 'Ascensores',
  'Generadores', 'Sistemas Solares', 'Otros'
]

// Tipos de ticket con labels
const TICKET_TYPES: Record<string, string> = {
  maintenance: 'Mantenimiento',
  repair: 'Reparación',
  installation: 'Instalación',
  inspection: 'Inspección',
  emergency: 'Emergencia',
  consultation: 'Consulta'
}

type ViewMode = 'list' | 'kanban'
type SortField = 'created_at' | 'priority' | 'due_date' | 'status'
type SortOrder = 'asc' | 'desc'

// Helper para calcular si un ticket está vencido o por vencer
function getSLAStatus(ticket: Ticket): { status: 'ok' | 'warning' | 'overdue' | 'none'; label: string; daysLeft?: number } {
  if (!ticket.due_date || ticket.status === 'completed' || ticket.status === 'closed') {
    return { status: 'none', label: '' }
  }
  const now = new Date()
  const due = new Date(ticket.due_date)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return { status: 'overdue', label: `Vencido hace ${Math.abs(diffDays)} día(s)`, daysLeft: diffDays }
  if (diffDays === 0) return { status: 'warning', label: 'Vence hoy', daysLeft: 0 }
  if (diffDays <= 2) return { status: 'warning', label: `Vence en ${diffDays} día(s)`, daysLeft: diffDays }
  return { status: 'ok', label: `${diffDays} días restantes`, daysLeft: diffDays }
}

// Prioridad numérica para ordenar
const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

// Determinar la etapa del pipeline de un ticket según su progreso real
function hasSurveyDone(ticket: Ticket): boolean {
  return !!ticket.survey || !!ticket.internal_documents?.survey_report
}

function hasInternalQuoteDraft(ticket: Ticket): boolean {
  const q = ticket.internal_documents?.quote_admin || ticket.internal_documents?.quote
  if (!q) return false
  return (
    (q.items?.length ?? 0) > 0 ||
    ((q as any).labor_cost ?? 0) > 0 ||
    ((q as any).labor_sale ?? 0) > 0
  )
}

function getPipelineStage(ticket: Ticket): string {
  if (ticket.financial_links?.invoice_id || ticket.status === 'closed') return 'invoiced'
  if (ticket.status === 'completed' || (ticket.report && ticket.client_documents?.quote)) return 'in_execution'
  if (ticket.internal_documents?.quote_approval?.status === 'approved') return 'approved'
  if (hasInternalQuoteDraft(ticket) || !!ticket.quote) return 'quoted'
  if (hasSurveyDone(ticket)) return 'surveyed'
  if (ticket.assigned_to) return 'assigned'
  return 'new'
}

export default function Tickets() {
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showAssignSupplierModal, setShowAssignSupplierModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  
  // Modales de acciones
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  
  const ITEMS_PER_PAGE = 10
  
  const queryClient = useQueryClient()
  
  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, statusFilter, search, user?.id, user?.user_type],
    queryFn: () => ticketsService.list({ 
      page: String(page), 
      per_page: '20',
      ...(statusFilter && { status: statusFilter }),
      ...(search && { search }),
      ...(user && { user_id: user.id, user_type: user.user_type })
    }),
  })
  
  const { data: clientsData } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => clientsService.list({ per_page: '100' }),
    enabled: user?.user_type === 'admin' || user?.user_type === 'client'
  })
  
  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => techniciansService.list(),
    enabled: user?.user_type === 'admin'
  })
  
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-select'],
    queryFn: () => suppliersService.list({ per_page: '100' }),
    enabled: user?.user_type === 'admin'
  })
  
  const createMutation = useMutation({
    mutationFn: (data: Partial<Ticket>) => ticketsService.create(data),
    onSuccess: async () => {
      // Invalidar y refrescar todas las queries de tickets
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
      await queryClient.invalidateQueries({ queryKey: ['tickets-dashboard'] })
      // Forzar un refetch inmediato
      await queryClient.refetchQueries({ queryKey: ['tickets'] })
      setShowModal(false)
    }
  })
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets-dashboard'] })
    }
  })
  
  const assignMutation = useMutation({
    mutationFn: ({ id, techId, techName }: { id: string, techId: string, techName: string }) => 
      ticketsService.assign(id, techId, techName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets-dashboard'] })
      setShowAssignModal(false)
      setSelectedTicket(null)
    }
  })
  
  const assignSupplierMutation = useMutation({
    mutationFn: ({ id, supplierId, supplierName, supplierUserId }: { id: string, supplierId: string, supplierName: string, supplierUserId?: string }) => 
      ticketsService.assignSupplier(id, supplierId, supplierName, supplierUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets-dashboard'] })
      setShowAssignSupplierModal(false)
      setSelectedTicket(null)
    }
  })
  
  const surveyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => ticketsService.addSurvey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets-dashboard'] })
      setShowSurveyModal(false)
      setSelectedTicket(null)
    }
  })
  
  const quoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => ticketsService.addQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets-dashboard'] })
      setShowQuoteModal(false)
      setSelectedTicket(null)
    }
  })
  
  const reportMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => ticketsService.addReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets-dashboard'] })
      setShowReportModal(false)
      setSelectedTicket(null)
    }
  })
  
  const quoteStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'approved' | 'rejected'; notes?: string }) =>
      ticketsService.reviewInternalQuoteApproval(
        id,
        status,
        user?.full_name || 'Admin',
        user?.email || '',
        notes
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets-dashboard'] })
    }
  })
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      received: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      closed: 'bg-purple-100 text-purple-800',
    }
    const labels: Record<string, string> = {
      received: 'Recibido',
      assigned: 'Asignado',
      in_progress: 'En Progreso',
      completed: 'Completado',
      closed: 'Cerrado',
    }
    return { style: styles[status] || 'bg-gray-100 text-gray-800', label: labels[status] || status }
  }
  
  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    }
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    }
    return { style: styles[priority] || 'bg-gray-100 text-gray-600', label: labels[priority] || priority }
  }
  
  const canCreateTicket = user?.user_type === 'admin' || user?.user_type === 'client'
  const canEditTicket = user?.user_type === 'admin'
  const canSurvey = user?.user_type === 'admin' || user?.user_type === 'technician' || user?.user_type === 'supplier'
  const canQuote = user?.user_type === 'admin' || user?.user_type === 'technician'
  const canReport = user?.user_type === 'admin' || user?.user_type === 'technician' || user?.user_type === 'supplier'
  const canApproveQuote = (user?.email || '').toLowerCase() === 'admin@sosc.com'
  const canAssign = user?.user_type === 'admin'
  
  const getEmptyMessage = () => {
    switch (user?.user_type) {
      case 'technician':
        return { title: 'No tienes tickets asignados', desc: 'Cuando se te asigne un ticket, aparecerá aquí' }
      case 'client':
        return { title: 'No tienes tickets', desc: 'Crea un nuevo ticket para solicitar servicio' }
      case 'supplier':
        return { title: 'No tienes tickets asignados', desc: 'Cuando se requiera tu participación como proveedor, aparecerá aquí' }
      default:
        return { title: 'No hay tickets', desc: 'Crea un nuevo ticket para comenzar' }
    }
  }

  // ==================== ESTADÍSTICAS KPIs ====================
  const stats = useMemo(() => {
    const items = data?.items || []
    const total = items.length
    const newTickets = items.filter(t => getPipelineStage(t) === 'new').length
    const assigned = items.filter(t => getPipelineStage(t) === 'assigned').length
    const surveyed = items.filter(t => getPipelineStage(t) === 'surveyed').length
    const quoted = items.filter(t => getPipelineStage(t) === 'quoted').length
    const approved = items.filter(t => getPipelineStage(t) === 'approved').length
    const inExecution = items.filter(t => getPipelineStage(t) === 'in_execution').length
    const invoiced = items.filter(t => getPipelineStage(t) === 'invoiced').length
    const overdue = items.filter(t => getSLAStatus(t).status === 'overdue').length
    return { total, newTickets, assigned, surveyed, quoted, approved, inExecution, invoiced, overdue }
  }, [data?.items])

  // ==================== ORDENAMIENTO Y FILTRADO LOCAL ====================
  const sortedAndFilteredItems = useMemo(() => {
    let items = [...(data?.items || [])]
    
    // Filtro por prioridad
    if (priorityFilter) {
      items = items.filter(t => t.priority === priorityFilter)
    }
    // Filtro por tipo
    if (typeFilter) {
      items = items.filter(t => t.ticket_type === typeFilter)
    }
    
    // Ordenamiento
    items.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
          break
        case 'due_date':
          const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity
          const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity
          cmp = aDate - bDate
          break
        case 'status':
          const statusOrder: Record<string, number> = { received: 0, assigned: 1, in_progress: 2, completed: 3, closed: 4 }
          cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
          break
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })
    
    return items
  }, [data?.items, priorityFilter, typeFilter, sortField, sortOrder])

  // Paginación local
  const totalPages = Math.ceil(sortedAndFilteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = sortedAndFilteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Pipeline Kanban con 7 columnas tipo Kommo
  const PIPELINE_COLUMNS = [
    { id: 'new', label: 'Ingresos Nuevos', color: 'border-slate-300 bg-slate-50', headerBg: 'bg-slate-500', headerColor: 'text-white', dotColor: 'bg-slate-400' },
    { id: 'assigned', label: 'Asignados', color: 'border-blue-300 bg-blue-50', headerBg: 'bg-blue-500', headerColor: 'text-white', dotColor: 'bg-blue-400' },
    { id: 'surveyed', label: 'Relevados', color: 'border-purple-300 bg-purple-50', headerBg: 'bg-purple-500', headerColor: 'text-white', dotColor: 'bg-purple-400' },
    { id: 'quoted', label: 'Presupuestados', color: 'border-amber-300 bg-amber-50', headerBg: 'bg-amber-500', headerColor: 'text-white', dotColor: 'bg-amber-400' },
    { id: 'approved', label: 'Aprobados', color: 'border-emerald-300 bg-emerald-50', headerBg: 'bg-emerald-500', headerColor: 'text-white', dotColor: 'bg-emerald-400' },
    { id: 'in_execution', label: 'En Ejecución', color: 'border-orange-300 bg-orange-50', headerBg: 'bg-orange-500', headerColor: 'text-white', dotColor: 'bg-orange-400' },
    { id: 'invoiced', label: 'Facturados', color: 'border-green-300 bg-green-50', headerBg: 'bg-green-600', headerColor: 'text-white', dotColor: 'bg-green-500' },
  ]

  const kanbanColumns = useMemo(() => {
    return PIPELINE_COLUMNS.map(col => ({
      ...col,
      tickets: sortedAndFilteredItems.filter(t => getPipelineStage(t) === col.id)
    }))
  }, [sortedAndFilteredItems])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const activeFiltersCount = [priorityFilter, typeFilter].filter(Boolean).length
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Tickets</h2>
          <p className="text-sm text-gray-500">
            {user?.user_type === 'technician' && 'Tickets asignados a ti'}
            {user?.user_type === 'client' && 'Tickets de tu empresa'}
            {user?.user_type === 'supplier' && 'Tickets donde participas como proveedor'}
            {user?.user_type === 'admin' && 'Panel completo de gestión de tickets'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} title="Vista lista">
              <List size={18} />
            </button>
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} title="Vista Kanban">
              <LayoutGrid size={18} />
            </button>
          </div>
          {canCreateTicket && (
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
              <Plus size={20} /> Nuevo Ticket
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats - Pipeline */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
          <div className="text-xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">Total</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 text-center cursor-pointer hover:border-slate-400 transition-colors" onClick={() => setStatusFilter(statusFilter === 'received' ? '' : 'received')}>
          <div className="text-xl font-bold text-slate-600">{stats.newTickets}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Nuevos</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 text-center cursor-pointer hover:border-blue-400 transition-colors" onClick={() => setStatusFilter(statusFilter === 'assigned' ? '' : 'assigned')}>
          <div className="text-xl font-bold text-blue-600">{stats.assigned}</div>
          <div className="text-[10px] text-blue-500 mt-0.5 font-medium">Asignados</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-3 text-center cursor-pointer hover:border-purple-400 transition-colors">
          <div className="text-xl font-bold text-purple-600">{stats.surveyed}</div>
          <div className="text-[10px] text-purple-500 mt-0.5 font-medium">Relevados</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-3 text-center cursor-pointer hover:border-amber-400 transition-colors">
          <div className="text-xl font-bold text-amber-600">{stats.quoted}</div>
          <div className="text-[10px] text-amber-500 mt-0.5 font-medium">Presupuestados</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-3 text-center cursor-pointer hover:border-emerald-400 transition-colors">
          <div className="text-xl font-bold text-emerald-600">{stats.approved}</div>
          <div className="text-[10px] text-emerald-500 mt-0.5 font-medium">Aprobados</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-3 text-center cursor-pointer hover:border-orange-400 transition-colors">
          <div className="text-xl font-bold text-orange-600">{stats.inExecution}</div>
          <div className="text-[10px] text-orange-500 mt-0.5 font-medium">En Ejecución</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-3 text-center cursor-pointer hover:border-green-400 transition-colors">
          <div className="text-xl font-bold text-green-600">{stats.invoiced}</div>
          <div className="text-[10px] text-green-500 mt-0.5 font-medium">Facturados</div>
        </div>
        <div className={`bg-white rounded-xl shadow-sm border p-3 text-center ${stats.overdue > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
          <div className={`text-xl font-bold ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{stats.overdue}</div>
          <div className={`text-[10px] mt-0.5 font-medium ${stats.overdue > 0 ? 'text-red-500' : 'text-gray-500'}`}>Vencidos</div>
        </div>
      </div>
      
      {/* Filters & Sort Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Buscar por número, título o cliente..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los estados</option>
            <option value="received">Recibido</option>
            <option value="assigned">Asignado</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completado</option>
            <option value="closed">Cerrado</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 text-sm transition-colors ${showFilters || activeFiltersCount > 0 ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <Filter size={16} />
            Filtros {activeFiltersCount > 0 && <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
          {/* Ordenar */}
          <div className="flex items-center gap-1">
            <button onClick={() => toggleSort('created_at')} className={`px-3 py-2 border rounded-lg text-xs flex items-center gap-1 ${sortField === 'created_at' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <Calendar size={14} /> Fecha {sortField === 'created_at' && (sortOrder === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}
            </button>
            <button onClick={() => toggleSort('priority')} className={`px-3 py-2 border rounded-lg text-xs flex items-center gap-1 ${sortField === 'priority' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <AlertTriangle size={14} /> Prioridad {sortField === 'priority' && (sortOrder === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}
            </button>
            <button onClick={() => toggleSort('due_date')} className={`px-3 py-2 border rounded-lg text-xs flex items-center gap-1 ${sortField === 'due_date' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <Clock size={14} /> Vencimiento {sortField === 'due_date' && (sortOrder === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}
            </button>
          </div>
        </div>
        
        {/* Filtros expandibles */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3">
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas las prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los tipos</option>
              {Object.entries(TICKET_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {activeFiltersCount > 0 && (
              <button onClick={() => { setPriorityFilter(''); setTypeFilter(''); setPage(1) }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1">
                <X size={14} /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* ==================== VISTA KANBAN PIPELINE (tipo Kommo) ==================== */}
      {viewMode === 'kanban' ? (
        <div className="space-y-4">
          {/* Pipeline progress bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-gray-100">
              {kanbanColumns.map((col, i) => {
                const pct = sortedAndFilteredItems.length > 0 
                  ? (col.tickets.length / sortedAndFilteredItems.length) * 100 
                  : 0
                return pct > 0 ? (
                  <div key={col.id} className={`h-full ${col.headerBg} transition-all duration-500`} 
                    style={{ width: `${pct}%` }} title={`${col.label}: ${col.tickets.length}`} />
                ) : null
              })}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
              {kanbanColumns.map(col => (
                <div key={col.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span>{col.label}</span>
                  <span className="font-semibold text-gray-800">({col.tickets.length})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban columns */}
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
            {kanbanColumns.map(col => (
              <div key={col.id} className="flex-shrink-0 w-64 rounded-xl border bg-white flex flex-col shadow-sm">
                {/* Column header */}
                <div className={`px-3 py-3 rounded-t-xl ${col.headerBg} flex justify-between items-center`}>
                  <span className={`font-semibold text-sm ${col.headerColor}`}>{col.label}</span>
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold backdrop-blur-sm">
                    {col.tickets.length}
                  </span>
                </div>
                {/* Column body */}
                <div className={`p-2 space-y-2 overflow-y-auto flex-1 ${col.tickets.length === 0 ? '' : 'bg-gray-50/50'}`} style={{ maxHeight: '62vh' }}>
                  {col.tickets.length === 0 ? (
                    <div className="text-center text-gray-300 text-xs py-10 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <ClipboardList size={18} className="text-gray-300" />
                      </div>
                      Sin tickets
                    </div>
                  ) : col.tickets.map(ticket => {
                    const priorityBadge = getPriorityBadge(ticket.priority)
                    const sla = getSLAStatus(ticket)
                    return (
                      <Link to={`/tickets/${ticket.id}`} key={ticket.id}
                        className="block bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group">
                        {/* Header: Number + Priority */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] text-blue-600 font-semibold">{ticket.ticket_number}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${priorityBadge.style}`}>{priorityBadge.label}</span>
                        </div>
                        {/* Title */}
                        <h4 className="text-[13px] font-medium text-gray-800 line-clamp-2 mb-1.5 leading-tight">{ticket.title}</h4>
                        {/* Client + Tech */}
                        <div className="text-[11px] text-gray-500 space-y-0.5">
                          {ticket.client && <div className="truncate">
                            <span className="text-gray-400">Cliente:</span> {ticket.client.business_name}
                          </div>}
                          {ticket.assigned_to && <div className="truncate">
                            <span className="text-gray-400">Tec:</span> {ticket.assigned_to.full_name}
                          </div>}
                          {ticket.supplier && <div className="truncate">
                            <span className="text-gray-400">Prov:</span> {ticket.supplier.business_name}
                          </div>}
                        </div>
                        {/* SLA */}
                        {sla.status !== 'none' && (
                          <div className={`mt-1.5 flex items-center gap-1 text-[10px] font-medium ${
                            sla.status === 'overdue' ? 'text-red-600' : sla.status === 'warning' ? 'text-orange-500' : 'text-gray-400'
                          }`}>
                            {sla.status === 'overdue' ? <AlertCircle size={10} /> : <Clock size={10} />}
                            {sla.label}
                          </div>
                        )}
                        {/* Progress dots */}
                        <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-50">
                          <span className={`w-4 h-1 rounded-full ${ticket.assigned_to ? 'bg-blue-400' : 'bg-gray-200'}`} title="Asignado" />
                          <span className={`w-4 h-1 rounded-full ${hasSurveyDone(ticket) ? 'bg-purple-400' : 'bg-gray-200'}`} title="Relevado" />
                          <span className={`w-4 h-1 rounded-full ${hasInternalQuoteDraft(ticket) ? (ticket.internal_documents?.quote_approval?.status === 'approved' ? 'bg-emerald-400' : ticket.internal_documents?.quote_approval?.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400') : 'bg-gray-200'}`} title="Presupuesto" />
                          <span className={`w-4 h-1 rounded-full ${ticket.report ? 'bg-green-500' : 'bg-gray-200'}`} title="Informe" />
                          <span className={`w-4 h-1 rounded-full ${ticket.financial_links?.invoice_id ? 'bg-green-600' : 'bg-gray-200'}`} title="Facturado" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
                {/* Column footer with total */}
                {col.tickets.length > 0 && (
                  <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                    {col.tickets.length} ticket{col.tickets.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ==================== VISTA LISTA ==================== */
        <>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={20} /> Cargando tickets...</div>
          ) : paginatedItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">{getEmptyMessage().title}</h3>
              <p className="text-gray-500">{getEmptyMessage().desc}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {paginatedItems.map((ticket) => {
                const statusBadge = getStatusBadge(ticket.status)
                const priorityBadge = getPriorityBadge(ticket.priority)
                const sla = getSLAStatus(ticket)
                
                return (
                  <div key={ticket.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-colors ${
                    sla.status === 'overdue' ? 'border-red-200 border-l-4 border-l-red-500' :
                    sla.status === 'warning' ? 'border-orange-200 border-l-4 border-l-orange-400' :
                    'border-gray-100'
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Info principal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-mono text-sm text-blue-600 font-semibold">{ticket.ticket_number}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${statusBadge.style}`}>{statusBadge.label}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${priorityBadge.style}`}>{priorityBadge.label}</span>
                          {ticket.ticket_type && TICKET_TYPES[ticket.ticket_type] && (
                            <span className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600">{TICKET_TYPES[ticket.ticket_type]}</span>
                          )}
                          {/* SLA Badge */}
                          {sla.status === 'overdue' && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1 animate-pulse">
                              <AlertCircle size={12} /> {sla.label}
                            </span>
                          )}
                          {sla.status === 'warning' && (
                            <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                              <Clock size={12} /> {sla.label}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-1">{ticket.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                          <span>Cliente: <strong>{ticket.client?.business_name || '-'}</strong></span>
                          {ticket.assigned_to && <span>Técnico: <strong>{ticket.assigned_to.full_name}</strong></span>}
                          {ticket.supplier && <span>Proveedor: <strong>{ticket.supplier.business_name}</strong></span>}
                          <span>Creado: {new Date(ticket.created_at).toLocaleDateString()}</span>
                          {ticket.due_date && <span className={sla.status === 'overdue' ? 'text-red-600 font-semibold' : ''}>Vence: {new Date(ticket.due_date).toLocaleDateString()}</span>}
                        </div>
                        
                        {/* Indicadores */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {hasSurveyDone(ticket) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              <ClipboardList size={12} /> Relevado
                            </span>
                          )}
                          {hasInternalQuoteDraft(ticket) && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              ticket.internal_documents?.quote_approval?.status === 'approved' ? 'bg-green-100 text-green-700' :
                              ticket.internal_documents?.quote_approval?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              <Calculator size={12} /> 
                              Presupuesto {ticket.internal_documents?.quote_approval?.status === 'approved' ? 'Aprobado' : 
                                           ticket.internal_documents?.quote_approval?.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                            </span>
                          )}
                          {ticket.report && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              <FileText size={12} /> Informe
                            </span>
                          )}
                          {ticket.expenses && ticket.expenses.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {ticket.expenses.length} gasto(s)
                            </span>
                          )}
                          {ticket.workflow_checklist && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              ticket.workflow_checklist.completed_at ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              Workflow paso {ticket.workflow_checklist.current_step}/7
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/tickets/${ticket.id}`} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm">
                          <Eye size={16} /> Ver
                        </Link>
                        
                        {canAssign && !ticket.assigned_to && (
                          <button onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true) }}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2 text-sm">
                            <UserPlus size={16} /> Asignar
                          </button>
                        )}
                        
                        {canAssign && !ticket.supplier && ticket.assigned_to && (
                          <button onClick={() => { setSelectedTicket(ticket); setShowAssignSupplierModal(true) }}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2 text-sm">
                            <Truck size={16} /> Proveedor
                          </button>
                        )}
                        
                        {canSurvey && !hasSurveyDone(ticket) && ticket.status !== 'completed' && ticket.assigned_to && (
                          <Link
                            to={`/tickets/${ticket.id}?open=survey`}
                            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-2 text-sm"
                          >
                            <ClipboardList size={16} /> Relevar
                          </Link>
                        )}
                        
                        {canQuote && hasSurveyDone(ticket) && (
                          <Link
                            to={`/tickets/${ticket.id}?open=quote`}
                            className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-2 text-sm"
                          >
                            <Calculator size={16} /> {hasInternalQuoteDraft(ticket) ? 'Editar presupuesto' : 'Presupuestar'}
                          </Link>
                        )}
                        
                        {canApproveQuote && ticket.internal_documents?.quote_approval?.status === 'pending' && (
                          <>
                            <button onClick={() => quoteStatusMutation.mutate({ id: ticket.id, status: 'approved' })}
                              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2 text-sm">
                              <CheckCircle size={16} /> Aprobar
                            </button>
                            <button
                              onClick={() => {
                                const notes = prompt('Motivo del rechazo (opcional):') ?? ''
                                quoteStatusMutation.mutate({ id: ticket.id, status: 'rejected', notes: notes || undefined })
                              }}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 text-sm">
                              <XCircle size={16} /> Rechazar
                            </button>
                          </>
                        )}
                        
                        {canReport && ticket.internal_documents?.quote_approval?.status === 'approved' && !ticket.report && (
                          <Link
                            to={`/tickets/${ticket.id}?open=report`}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2 text-sm"
                          >
                            <FileText size={16} /> Informar
                          </Link>
                        )}
                        
                        {canEditTicket && (
                          <button onClick={() => setShowDeleteConfirm(ticket.id)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 text-sm">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <span className="text-sm text-gray-600">
                Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, sortedAndFilteredItems.length)} de {sortedAndFilteredItems.length}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Eliminar Ticket</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este ticket? Se perderán todos los datos asociados (relevamientos, presupuestos, informes, gastos, etc.).
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => { deleteMutation.mutate(showDeleteConfirm); setShowDeleteConfirm(null) }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Crear Ticket */}
      {showModal && (
        <CreateTicketModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          clients={clientsData?.items || []}
          userType={user?.user_type || 'client'}
          userId={user?.id || ''}
          userName={user?.company_name || user?.full_name || ''}
        />
      )}
      
      {/* Modal Asignar Técnico */}
      {showAssignModal && selectedTicket && (
        <AssignTechnicianModal
          isOpen={showAssignModal}
          onClose={() => { setShowAssignModal(false); setSelectedTicket(null) }}
          ticket={selectedTicket}
          technicians={technicians || []}
          onSubmit={(techId, techName) => assignMutation.mutate({ id: selectedTicket.id, techId, techName })}
          isLoading={assignMutation.isPending}
        />
      )}
      
      {/* Modal Asignar Proveedor */}
      {showAssignSupplierModal && selectedTicket && (
        <AssignSupplierModal
          isOpen={showAssignSupplierModal}
          onClose={() => { setShowAssignSupplierModal(false); setSelectedTicket(null) }}
          ticket={selectedTicket}
          suppliers={suppliersData?.items || []}
          onSubmit={(supplierId, supplierName, supplierUserId) => 
            assignSupplierMutation.mutate({ id: selectedTicket.id, supplierId, supplierName, supplierUserId })}
          isLoading={assignSupplierMutation.isPending}
        />
      )}
      
      {/* Modal de Relevamiento */}
      <SurveyModal
        isOpen={showSurveyModal}
        onClose={() => { setShowSurveyModal(false); setSelectedTicket(null) }}
        ticket={selectedTicket}
        onSubmit={(data) => selectedTicket && surveyMutation.mutate({ id: selectedTicket.id, data })}
        isLoading={surveyMutation.isPending}
        userName={user?.full_name || ''}
      />
      
      {/* Modal de Presupuesto */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => { setShowQuoteModal(false); setSelectedTicket(null) }}
        ticket={selectedTicket}
        onSubmit={(data) => selectedTicket && quoteMutation.mutate({ id: selectedTicket.id, data })}
        isLoading={quoteMutation.isPending}
        userName={user?.full_name || ''}
      />
      
      {/* Modal de Informe */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setSelectedTicket(null) }}
        ticket={selectedTicket}
        onSubmit={(data) => selectedTicket && reportMutation.mutate({ id: selectedTicket.id, data })}
        isLoading={reportMutation.isPending}
        userName={user?.full_name || ''}
      />
    </div>
  )
}

// Modal Crear Ticket
function CreateTicketModal({ isOpen, onClose, onSubmit, isLoading, clients, userType, userId, userName }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    ticket_type: 'maintenance',
    category: '',
    address: '',
    contact_phone: '',
    client_id: userType === 'client' ? userId : '',
    // Campos de sucursal
    branch_name: '',
    branch_manager_name: '',
    branch_manager_phone: '',
    branch_manager_email: ''
  })
  const [photos, setPhotos] = useState<string[]>([])
  
  if (!isOpen) return null
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB por imagen.')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
    
    // Limpiar el input para permitir subir la misma imagen
    e.target.value = ''
  }
  
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let clientData = null
    if (userType === 'client') {
      clientData = { id: userId, business_name: userName, user_id: userId }
    } else {
      const client = clients.find((c: any) => c.id === formData.client_id)
      if (client) {
        clientData = { id: client.id, business_name: client.business_name, tax_id: client.tax_id, user_id: client.user_id }
      }
    }
    
    onSubmit({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      ticket_type: formData.ticket_type,
      category: formData.category,
      address: formData.address,
      contact_phone: formData.contact_phone,
      client: clientData,
      branch_name: formData.branch_name,
      branch_manager_name: formData.branch_manager_name,
      branch_manager_phone: formData.branch_manager_phone,
      branch_manager_email: formData.branch_manager_email,
      photos: photos
    })
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Nuevo Ticket</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción breve del problema"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalles adicionales"
            />
          </div>
          
          {userType === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar cliente</option>
                {clients.map((client: any) => (
                  <option key={client.id} value={client.id}>{client.business_name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={formData.ticket_type}
                onChange={(e) => setFormData({...formData, ticket_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(TICKET_TYPES).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar categoría...</option>
              {TICKET_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dirección del servicio"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
            <input
              type="text"
              value={formData.contact_phone}
              onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0981 123 456"
            />
          </div>
          
          {/* Sección Sucursal */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Datos de Sucursal</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Sucursal</label>
                <input
                  type="text"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Sucursal Centro, Sucursal Villa Morra"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Encargado</label>
                <input
                  type="text"
                  value={formData.branch_manager_name}
                  onChange={(e) => setFormData({...formData, branch_manager_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre completo del encargado"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Encargado</label>
                  <input
                    type="text"
                    value={formData.branch_manager_phone}
                    onChange={(e) => setFormData({...formData, branch_manager_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0981 123 456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Encargado</label>
                  <input
                    type="email"
                    value={formData.branch_manager_email}
                    onChange={(e) => setFormData({...formData, branch_manager_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="encargado@email.com"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección Fotos */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Camera size={18} className="text-gray-500" />
              Fotos del Evento
            </h4>
            
            <div className="space-y-3">
              {/* Área de carga */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-blue-600">Haz clic para subir</span> o arrastra las imágenes
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                />
              </label>
              
              {/* Vista previa de fotos */}
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {photos.length > 0 && (
                <p className="text-xs text-gray-500">{photos.length} foto(s) seleccionada(s)</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Creando...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal Asignar Técnico
function AssignTechnicianModal({ isOpen, onClose, ticket, technicians, onSubmit, isLoading }: any) {
  const [selectedTech, setSelectedTech] = useState('')
  
  if (!isOpen) return null
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tech = technicians.find((t: any) => t.user_id === selectedTech)
    if (tech) {
      onSubmit(tech.user_id, tech.full_name)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b bg-blue-50">
          <h3 className="text-xl font-semibold text-blue-900">Asignar Técnico</h3>
          <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Ticket: <strong>{ticket.ticket_number}</strong></p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Técnico *</label>
            <select
              required
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              {technicians.map((tech: any) => (
                <option key={tech.user_id} value={tech.user_id}>{tech.full_name} - {tech.email}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading || !selectedTech} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal Asignar Proveedor
function AssignSupplierModal({ isOpen, onClose, ticket, suppliers, onSubmit, isLoading }: any) {
  const [selectedSupplier, setSelectedSupplier] = useState('')
  
  if (!isOpen) return null
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const supplier = suppliers.find((s: any) => s.id === selectedSupplier)
    if (supplier) {
      onSubmit(supplier.id, supplier.business_name, supplier.user_id)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b bg-green-50">
          <h3 className="text-xl font-semibold text-green-900">Asignar Proveedor</h3>
          <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Ticket: <strong>{ticket.ticket_number}</strong></p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Proveedor *</label>
            <select
              required
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar...</option>
              {suppliers.map((supplier: any) => (
                <option key={supplier.id} value={supplier.id}>{supplier.business_name} ({supplier.category})</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading || !selectedSupplier} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {isLoading ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de Relevamiento con WhatsApp
function SurveyModal({ isOpen, onClose, ticket, onSubmit, isLoading, userName }: any) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'ai' | 'manual'>('whatsapp')
  const [formData, setFormData] = useState({
    equipment_condition: '',
    issues_found: '',
    recommendations: '',
    raw_notes: '',
    whatsapp_text: ''
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [whatsappSent, setWhatsappSent] = useState(false)
  
  // Número de WhatsApp de la empresa (cambiar en producción)
  const WHATSAPP_NUMBER = '595981123456'
  
  if (!isOpen || !ticket) return null
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB por imagen.')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }
  
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }
  
  // Generar mensaje para WhatsApp
  const generateWhatsAppMessage = () => {
    return `🔧 *RELEVAMIENTO TÉCNICO*
━━━━━━━━━━━━━━━━━━
📋 *Ticket:* ${ticket.ticket_number}
📍 *Cliente:* ${ticket.client?.business_name || 'N/A'}
📌 *Trabajo:* ${ticket.title}

Por favor envía:
1️⃣ Estado del equipo/situación
2️⃣ Problemas encontrados
3️⃣ Fotos del relevamiento
4️⃣ Recomendaciones

_Ejemplo: "El aire hace ruido, tiene fuga de gas, filtro sucio. Recomiendo cambiar filtro y recargar gas."_`
  }
  
  // Abrir WhatsApp con mensaje
  const openWhatsApp = () => {
    const message = encodeURIComponent(generateWhatsAppMessage())
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
    setWhatsappSent(true)
  }
  
  // Copiar mensaje al portapapeles
  const copyMessage = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage())
    alert('Mensaje copiado al portapapeles')
  }
  
  // Función de IA para procesar texto (desde WhatsApp o manual)
  const processWithAI = async (textToProcess?: string) => {
    const text = textToProcess || formData.raw_notes || formData.whatsapp_text
    if (!text.trim()) {
      alert('Escribe o pega el texto del relevamiento primero')
      return
    }
    
    setIsProcessingAI(true)
    
    // Simular procesamiento de IA
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const notes = text.toLowerCase()
    
    // Limpiar texto de WhatsApp (emojis, fechas, etc.)
    const cleanText = text
      .replace(/\d{1,2}:\d{2}\s*(am|pm)?/gi, '') // Quitar horas
      .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '') // Quitar fechas
      .replace(/[📋🔧📍📌1️⃣2️⃣3️⃣4️⃣━*_]/g, '') // Quitar emojis y formato
      .replace(/RELEVAMIENTO TÉCNICO/gi, '')
      .replace(/Ticket:/gi, '')
      .replace(/Cliente:/gi, '')
      .replace(/Trabajo:/gi, '')
      .trim()
    
    // Extraer condición del equipo
    let condition = ''
    if (notes.includes('buen estado') || notes.includes('funciona bien') || notes.includes('funcionando') || notes.includes('operativo')) {
      condition = 'El equipo se encuentra en estado operativo con algunas observaciones menores.'
    } else if (notes.includes('mal estado') || notes.includes('no funciona') || notes.includes('dañado') || notes.includes('roto') || notes.includes('averiado')) {
      condition = 'El equipo presenta fallas significativas que requieren atención inmediata.'
    } else if (notes.includes('regular') || notes.includes('deterioro') || notes.includes('desgaste')) {
      condition = 'El equipo muestra signos de desgaste y deterioro que afectan su funcionamiento.'
    } else {
      const firstSentence = cleanText.split(/[.!?\n]/)[0]
      condition = firstSentence.length > 10 ? firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1) : 'Evaluación realizada en sitio.'
    }
    
    // Extraer problemas
    const problemPatterns = [
      'fuga', 'ruido', 'no enciende', 'no enfría', 'no calienta', 'gotea', 
      'vibración', 'olor', 'humo', 'corto', 'cable', 'conexión', 'sensor',
      'desgaste', 'corrosión', 'suciedad', 'filtro', 'compresor', 'motor',
      'falla', 'problema', 'daño', 'roto', 'quemado', 'oxidado', 'tapado'
    ]
    
    const foundProblems: string[] = []
    const sentences = cleanText.split(/[.!?\n]+/)
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim()
      if (trimmed.length > 8) {
        const hasPattern = problemPatterns.some(p => trimmed.toLowerCase().includes(p))
        if (hasPattern || trimmed.toLowerCase().includes('encontr') || trimmed.toLowerCase().includes('detect')) {
          foundProblems.push('• ' + trimmed.charAt(0).toUpperCase() + trimmed.slice(1))
        }
      }
    })
    
    // Si no encontró problemas específicos
    if (foundProblems.length === 0) {
      const lines = cleanText.split(/[\n]+/).filter(l => l.trim().length > 8)
      lines.slice(0, 4).forEach(line => {
        foundProblems.push('• ' + line.trim().charAt(0).toUpperCase() + line.trim().slice(1))
      })
    }
    
    // Generar recomendaciones
    const recommendations: string[] = []
    if (notes.includes('fuga') || notes.includes('gotea') || notes.includes('gas')) {
      recommendations.push('Reparar fuga y recargar gas refrigerante')
    }
    if (notes.includes('ruido') || notes.includes('vibración') || notes.includes('vibra')) {
      recommendations.push('Inspeccionar componentes mecánicos y ajustar soportes')
    }
    if (notes.includes('filtro') || notes.includes('suciedad') || notes.includes('sucio') || notes.includes('tapado')) {
      recommendations.push('Realizar limpieza profunda y cambio de filtros')
    }
    if (notes.includes('no enciende') || notes.includes('eléctrico') || notes.includes('cable') || notes.includes('quemado')) {
      recommendations.push('Verificar conexiones eléctricas y componentes')
    }
    if (notes.includes('compresor') || notes.includes('motor')) {
      recommendations.push('Evaluar estado del compresor/motor - posible reemplazo')
    }
    if (notes.includes('cambiar') || notes.includes('reemplaz')) {
      recommendations.push('Proceder con el reemplazo de componentes dañados')
    }
    if (recommendations.length === 0) {
      recommendations.push('Realizar mantenimiento correctivo según hallazgos')
      recommendations.push('Programar seguimiento post-reparación')
    }
    
    setFormData({
      ...formData,
      equipment_condition: condition,
      issues_found: foundProblems.length > 0 ? foundProblems.join('\n') : '• Requiere evaluación detallada',
      recommendations: recommendations.join('. ') + '.'
    })
    
    setIsProcessingAI(false)
    setActiveTab('manual')
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      equipment_condition: formData.equipment_condition,
      issues_found: formData.issues_found.split('\n').filter(Boolean).map(s => s.replace(/^[•\-]\s*/, '')),
      recommendations: formData.recommendations,
      photos: photos,
      created_by: userName
    })
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b bg-purple-50">
          <div>
            <h3 className="text-xl font-semibold text-purple-900 flex items-center gap-2">
              <ClipboardList size={24} />
              Relevamiento
            </h3>
            <p className="text-sm text-purple-700">{ticket.ticket_number} - {ticket.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-purple-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs de opciones */}
        <div className="flex border-b bg-gray-50">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'whatsapp' 
                ? 'bg-green-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'ai' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sparkles size={18} />
            Asistente IA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'manual' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText size={18} />
            Manual
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Tab WhatsApp */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              {/* Paso 1: Enviar por WhatsApp */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500 rounded-full">
                    <MessageCircle size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 text-lg">Paso 1: Enviar desde el campo</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Abre WhatsApp y envía el relevamiento con fotos directamente desde donde estás trabajando.
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mt-4">
                      <button
                        type="button"
                        onClick={openWhatsApp}
                        className="px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 font-medium shadow-lg"
                      >
                        <Send size={20} />
                        Abrir WhatsApp
                        <ExternalLink size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={copyMessage}
                        className="px-4 py-3 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 flex items-center gap-2"
                      >
                        <Copy size={18} />
                        Copiar mensaje
                      </button>
                    </div>
                    
                    {whatsappSent && (
                      <div className="mt-3 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle size={16} />
                        WhatsApp abierto. Envía tu relevamiento con fotos.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Paso 2: Pegar respuesta */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 rounded-full text-white font-bold text-lg">2</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 text-lg">Paso 2: Pegar el texto de WhatsApp</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Copia los mensajes que enviaste por WhatsApp y pégalos aquí. La IA los organizará automáticamente.
                    </p>
                    
                    <textarea
                      rows={5}
                      value={formData.whatsapp_text}
                      onChange={(e) => setFormData({...formData, whatsapp_text: e.target.value})}
                      className="w-full mt-3 px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Pega aquí los mensajes de WhatsApp...&#10;&#10;Ejemplo:&#10;El aire hace mucho ruido&#10;Tiene fuga de gas&#10;El filtro está muy sucio&#10;[Aquí irían las fotos que enviaste]"
                    />
                    
                    <button
                      type="button"
                      onClick={() => processWithAI(formData.whatsapp_text)}
                      disabled={isProcessingAI || !formData.whatsapp_text.trim()}
                      className="mt-3 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      {isProcessingAI ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Procesando con IA...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Procesar con IA
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Paso 3: Subir fotos de WhatsApp */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500 rounded-full text-white font-bold text-lg">3</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 text-lg">Paso 3: Subir fotos enviadas por WhatsApp</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Guarda las fotos que enviaste por WhatsApp en tu dispositivo y súbelas aquí.
                    </p>
                    
                    <label className="mt-3 flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Smartphone size={28} className="text-amber-500" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-amber-700">Subir fotos de WhatsApp</p>
                          <p className="text-xs text-amber-500">PNG, JPG hasta 5MB</p>
                        </div>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                      />
                    </label>
                    
                    {photos.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tab Asistente IA */}
          {activeTab === 'ai' && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500 rounded-full">
                  <Sparkles size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-purple-900 text-lg">Asistente IA para Relevamiento</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Escribe tus notas de forma libre y la IA las organizará automáticamente.
                  </p>
                  
                  <textarea
                    rows={6}
                    value={formData.raw_notes}
                    onChange={(e) => setFormData({...formData, raw_notes: e.target.value})}
                    className="w-full mt-3 px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    placeholder="Escribe todo lo que observaste en el sitio...&#10;&#10;Ejemplo: El aire acondicionado hace mucho ruido cuando arranca. Tiene fuga de gas en la tubería de cobre. El filtro está muy sucio, no lo han limpiado en meses. Recomiendo cambiar el filtro y recargar el gas refrigerante."
                  />
                  
                  <button
                    type="button"
                    onClick={() => processWithAI()}
                    disabled={isProcessingAI || !formData.raw_notes.trim()}
                    className="mt-3 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                  >
                    {isProcessingAI ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Organizando con IA...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Organizar con IA
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Sección de fotos en tab IA */}
              <div className="mt-6 pt-4 border-t border-purple-200">
                <label className="block text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
                  <Camera size={18} />
                  Fotos del Relevamiento
                </label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50">
                  <Camera size={24} className="text-purple-400 mb-1" />
                  <p className="text-sm text-purple-600">Subir fotos</p>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} />
                </label>
                {photos.length > 0 && (
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-16 object-cover rounded-lg" />
                        <button type="button" onClick={() => removePhoto(index)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tab Manual / Resultado */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {formData.equipment_condition && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Relevamiento procesado correctamente. Puedes editarlo si es necesario.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del Equipo *
                </label>
                <textarea 
                  required 
                  rows={3} 
                  value={formData.equipment_condition}
                  onChange={(e) => setFormData({...formData, equipment_condition: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe el estado actual del equipo..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problemas Encontrados * (uno por línea)
                </label>
                <textarea 
                  required 
                  rows={5} 
                  value={formData.issues_found}
                  onChange={(e) => setFormData({...formData, issues_found: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="• Problema 1&#10;• Problema 2" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recomendaciones *
                </label>
                <textarea 
                  required 
                  rows={3} 
                  value={formData.recommendations}
                  onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Acciones recomendadas para solucionar los problemas..." 
                />
              </div>
              
              {/* Sección de Fotos en Manual */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Camera size={18} />
                  Fotos del Relevamiento ({photos.length})
                </label>
                
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera size={28} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Subir fotos</p>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} />
                </label>
                
                {photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                        <button type="button" onClick={() => removePhoto(index)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Guardar Relevamiento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de Presupuesto
function QuoteModal({ isOpen, onClose, ticket, onSubmit, isLoading, userName }: any) {
  const [items, setItems] = useState<QuoteItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }])
  const [laborCost, setLaborCost] = useState(0)
  const [notes, setNotes] = useState('')
  
  if (!isOpen || !ticket) return null
  
  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }])
  
  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    }
    setItems(newItems)
  }
  
  const materialsCost = items.reduce((sum, item) => sum + item.total, 0)
  const total = materialsCost + laborCost
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validDate = new Date()
    validDate.setDate(validDate.getDate() + 30)
    onSubmit({
      items: items.filter(i => i.description),
      labor_cost: laborCost,
      materials_cost: materialsCost,
      total,
      valid_until: validDate.toISOString().split('T')[0],
      notes,
      created_by: userName
    })
  }
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value)
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b bg-yellow-50">
          <div>
            <h3 className="text-xl font-semibold text-yellow-900">Presupuesto</h3>
            <p className="text-sm text-yellow-700">{ticket.ticket_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-yellow-100 rounded-lg"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Materiales y Servicios</label>
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-center mb-2">
                <input type="text" placeholder="Descripción" value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" placeholder="Cant." value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" placeholder="Precio" value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <span className="w-28 text-right text-sm">{formatCurrency(item.total)}</span>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">+ Agregar</button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mano de Obra (Gs.)</label>
            <input type="number" value={laborCost} onChange={(e) => setLaborCost(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Condiciones, garantías..." />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm mb-1"><span>Materiales:</span><span>{formatCurrency(materialsCost)}</span></div>
            <div className="flex justify-between text-sm mb-2"><span>Mano de Obra:</span><span>{formatCurrency(laborCost)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>TOTAL:</span><span className="text-green-600">{formatCurrency(total)}</span></div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50">
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de Informe (mejorado con soporte de fotos)
function ReportModal({ isOpen, onClose, ticket, onSubmit, isLoading, userName }: any) {
  const [formData, setFormData] = useState({ description: '', diagnosis: '', actions_taken: '', materials_used: '' })
  const [photos, setPhotos] = useState<string[]>([])
  
  if (!isOpen || !ticket) return null

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) return // Max 5MB
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...formData, photos, created_by: userName })
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b bg-green-50">
          <div>
            <h3 className="text-xl font-semibold text-green-900">Informe de Trabajo</h3>
            <p className="text-sm text-green-700">{ticket.ticket_number} - {ticket.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-lg"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Trabajo *</label>
            <textarea required rows={2} value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Resumen del trabajo realizado..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico *</label>
            <textarea required rows={2} value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Causa raíz del problema identificado..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acciones Realizadas *</label>
            <textarea required rows={3} value={formData.actions_taken}
              onChange={(e) => setFormData({...formData, actions_taken: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Detalle de las reparaciones y trabajos realizados..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materiales Utilizados</label>
            <textarea rows={2} value={formData.materials_used}
              onChange={(e) => setFormData({...formData, materials_used: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Lista de materiales y repuestos utilizados..." />
          </div>
          
          {/* Fotos del trabajo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotos del Trabajo</label>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
                <Camera size={20} className="text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Agregar</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            {photos.length > 0 && <p className="text-xs text-gray-500 mt-1">{photos.length} foto(s) adjuntas</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><CheckCircle size={16} /> Completar Informe</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
