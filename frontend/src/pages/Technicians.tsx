import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { techniciansService, Technician, TECHNICIAN_SPECIALTIES } from '../services/technicians'
import { ticketsService, Ticket } from '../services/tickets'
import { inventoryService, InventoryMovement, ITEM_CONDITIONS } from '../services/inventory'
import { useAuthStore } from '../stores/authStore'
import { 
  Wrench, Mail, Phone, CheckCircle, UserCheck, Plus, X, 
  Edit2, Trash2, XCircle, Star, History, Clock, Ticket as TicketIcon,
  Package, TrendingUp, Calendar, ArrowUpFromLine, ArrowDownToLine
} from 'lucide-react'

export default function Technicians() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null)
  
  const { data: technicians, isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => techniciansService.list()
  })

  const { data: ticketsData } = useQuery({
    queryKey: ['all-tickets'],
    queryFn: () => ticketsService.list()
  })
  const allTickets = ticketsData?.items || []

  const { data: allMovements = [] } = useQuery({
    queryKey: ['all-movements'],
    queryFn: () => inventoryService.listMovements()
  })

  const [historyTechnician, setHistoryTechnician] = useState<Technician | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: Omit<Technician, 'id' | 'user_id'>) => techniciansService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
      setShowModal(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Technician> }) => 
      techniciansService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
      setEditingTechnician(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => techniciansService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
    }
  })

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: string, available: boolean }) => 
      techniciansService.update(id, { available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
    }
  })

  const rateMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string, rating: number }) => 
      techniciansService.rate(id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
      setRatingTechnician(null)
    }
  })

  const [ratingTechnician, setRatingTechnician] = useState<Technician | null>(null)

  const handleDelete = (tech: Technician) => {
    if (tech.is_registered_user) {
      alert('No se puede eliminar un técnico que está registrado como usuario')
      return
    }
    if (confirm(`¿Eliminar al técnico ${tech.full_name}?`)) {
      deleteMutation.mutate(tech.id)
    }
  }

  const handleToggleAvailability = (tech: Technician) => {
    toggleAvailabilityMutation.mutate({ id: tech.id, available: !tech.available })
  }

  const isAdmin = user?.user_type === 'admin'
  const registeredCount = technicians?.filter(t => t.is_registered_user).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Técnicos</h2>
          <p className="text-sm text-gray-500">
            {technicians?.length || 0} técnicos en total
            {registeredCount > 0 && ` • ${registeredCount} registrados`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> Nuevo Técnico
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Cargando...</div>
      ) : technicians?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No hay técnicos</h3>
          <p className="text-gray-500 mb-4">Los técnicos aparecerán aquí cuando se agreguen</p>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} /> Agregar Técnico
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians?.map((tech: Technician) => (
            <div key={tech.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wrench className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{tech.full_name}</h3>
                    {tech.is_registered_user && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        <UserCheck size={12} /> Registrado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isAdmin ? (
                      <button
                        onClick={() => handleToggleAvailability(tech)}
                        disabled={toggleAvailabilityMutation.isPending}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                          tech.available 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                        title={tech.available ? 'Clic para desactivar' : 'Clic para activar'}
                      >
                        {tech.available ? (
                          <><CheckCircle size={12} /> Disponible</>
                        ) : (
                          <><XCircle size={12} /> No disponible</>
                        )}
                      </button>
                    ) : (
                      tech.available ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={12} /> Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <XCircle size={12} /> No disponible
                        </span>
                      )
                    )}
                  </div>
                </div>
                {isAdmin && !tech.is_registered_user && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingTechnician(tech)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tech)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span>{tech.email}</span>
                </div>
                {tech.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span>{tech.phone}</span>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <StarRating rating={tech.rating} size={16} />
                    <span className="text-sm text-gray-600 ml-1">
                      {tech.rating > 0 ? tech.rating.toFixed(1) : 'Sin calificar'}
                    </span>
                    {tech.total_ratings > 0 && (
                      <span className="text-xs text-gray-400">
                        ({tech.total_ratings} {tech.total_ratings === 1 ? 'voto' : 'votos'})
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setRatingTechnician(tech)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Calificar
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {tech.specialties.map((spec, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                    {spec}
                  </span>
                ))}
              </div>
              
              {/* Botón Historial */}
              <button
                onClick={() => setHistoryTechnician(tech)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
              >
                <History size={16} />
                Ver Historial y Métricas
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Historial del Técnico */}
      {historyTechnician && (
        <TechnicianHistoryModal
          technician={historyTechnician}
          tickets={allTickets.filter(t => t.assigned_to?.user_id === historyTechnician.user_id)}
          movements={allMovements.filter(m => m.technician_id === historyTechnician.user_id)}
          onClose={() => setHistoryTechnician(null)}
        />
      )}

      {/* Modal Calificar Técnico */}
      {ratingTechnician && (
        <RatingModal
          technician={ratingTechnician}
          onClose={() => setRatingTechnician(null)}
          onSubmit={(rating) => rateMutation.mutate({ id: ratingTechnician.id, rating })}
          isLoading={rateMutation.isPending}
        />
      )}

      {/* Modal Crear/Editar Técnico */}
      {(showModal || editingTechnician) && (
        <TechnicianModal
          technician={editingTechnician}
          isOpen={showModal || !!editingTechnician}
          onClose={() => {
            setShowModal(false)
            setEditingTechnician(null)
          }}
          onSubmit={(data) => {
            if (editingTechnician) {
              updateMutation.mutate({ id: editingTechnician.id, data })
            } else {
              createMutation.mutate(data)
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

// Modal para crear/editar técnico
interface TechnicianModalProps {
  technician: Technician | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}

function TechnicianModal({ technician, isOpen, onClose, onSubmit, isLoading }: TechnicianModalProps) {
  const [formData, setFormData] = useState({
    full_name: technician?.full_name || '',
    email: technician?.email || '',
    phone: technician?.phone || '',
    specialties: technician?.specialties || [],
    available: technician?.available ?? true
  })

  if (!isOpen) return null

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.specialties.length === 0) {
      alert('Debe seleccionar al menos una especialidad')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">
            {technician ? 'Editar Técnico' : 'Nuevo Técnico'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre y apellido"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tecnico@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0981 123 456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especialidades *
            </label>
            <div className="flex flex-wrap gap-2">
              {TECHNICIAN_SPECIALTIES.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => handleSpecialtyToggle(specialty)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    formData.specialties.includes(specialty)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
            {formData.specialties.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Seleccione al menos una especialidad</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="available" className="text-sm text-gray-700">
              Disponible para asignaciones
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : technician ? 'Guardar Cambios' : 'Crear Técnico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente de estrellas de visualización
function StarRating({ rating, size = 16 }: { rating: number, size?: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : star - 0.5 <= rating
              ? 'text-yellow-400 fill-yellow-400/50'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

// Modal para calificar técnico
interface RatingModalProps {
  technician: Technician
  onClose: () => void
  onSubmit: (rating: number) => void
  isLoading: boolean
}

function RatingModal({ technician, onClose, onSubmit, isLoading }: RatingModalProps) {
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRating === 0) {
      alert('Seleccione una calificación')
      return
    }
    onSubmit(selectedRating)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Calificar Técnico</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="text-center mb-6">
            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
              <Wrench className="text-blue-600" size={32} />
            </div>
            <h4 className="font-semibold text-gray-800">{technician.full_name}</h4>
            {technician.rating > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Calificación actual: {technician.rating.toFixed(1)} ({technician.total_ratings} votos)
              </p>
            )}
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setSelectedRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={36}
                  className={`transition-colors ${
                    star <= (hoverRating || selectedRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-gray-600 mb-6">
            {selectedRating === 0 && 'Selecciona una calificación'}
            {selectedRating === 1 && 'Muy malo'}
            {selectedRating === 2 && 'Malo'}
            {selectedRating === 3 && 'Regular'}
            {selectedRating === 4 && 'Bueno'}
            {selectedRating === 5 && 'Excelente'}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedRating === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Calificar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal Historial del Técnico
interface TechnicianHistoryModalProps {
  technician: Technician
  tickets: Ticket[]
  movements: InventoryMovement[]
  onClose: () => void
}

function TechnicianHistoryModal({ technician, tickets, movements, onClose }: TechnicianHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'tickets' | 'stock'>('metrics')
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Calcular métricas de tickets
  const completedTickets = tickets.filter(t => t.status === 'completed')
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress')
  const pendingTickets = tickets.filter(t => t.status === 'pending' || t.status === 'open')
  
  // Calcular tiempo promedio de respuesta (desde creación hasta primera actualización o completado)
  const calculateResponseTimes = () => {
    const times: number[] = []
    
    completedTickets.forEach(ticket => {
      if (ticket.created_at && ticket.updated_at) {
        const created = new Date(ticket.created_at).getTime()
        const updated = new Date(ticket.updated_at).getTime()
        const diffHours = (updated - created) / (1000 * 60 * 60)
        if (diffHours > 0) times.push(diffHours)
      }
    })
    
    if (times.length === 0) return { avg: 0, min: 0, max: 0 }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)
    
    return { avg, min, max }
  }
  
  const responseTimes = calculateResponseTimes()
  
  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`
    if (hours < 24) return `${hours.toFixed(1)} hrs`
    return `${(hours / 24).toFixed(1)} días`
  }
  
  // Métricas de stock
  const withdrawals = movements.filter(m => m.type === 'withdrawal')
  const returns = movements.filter(m => m.type === 'return')
  
  // Calcular tasa de efectividad (tickets completados / total asignados)
  const effectivenessRate = tickets.length > 0 
    ? ((completedTickets.length / tickets.length) * 100).toFixed(0) 
    : '0'
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-indigo-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Wrench className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-indigo-900">Historial de Actividades</h3>
              <p className="text-sm text-indigo-700">{technician.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-indigo-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'metrics' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp size={18} />
            Métricas
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'tickets' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TicketIcon size={18} />
            Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'stock' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package size={18} />
            Stock ({movements.length})
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab Métricas */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {/* Resumen de Tickets */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Resumen de Tickets</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <p className="text-3xl font-bold text-blue-600">{tickets.length}</p>
                    <p className="text-xs text-blue-600 mt-1">Total Asignados</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl text-center">
                    <p className="text-3xl font-bold text-green-600">{completedTickets.length}</p>
                    <p className="text-xs text-green-600 mt-1">Completados</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl text-center">
                    <p className="text-3xl font-bold text-yellow-600">{inProgressTickets.length}</p>
                    <p className="text-xs text-yellow-600 mt-1">En Progreso</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <p className="text-3xl font-bold text-gray-600">{pendingTickets.length}</p>
                    <p className="text-xs text-gray-600 mt-1">Pendientes</p>
                  </div>
                </div>
              </div>
              
              {/* Tiempos de Respuesta */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Tiempos de Respuesta</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={20} className="text-indigo-600" />
                      <span className="text-sm text-indigo-600 font-medium">Promedio</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-700">
                      {responseTimes.avg > 0 ? formatHours(responseTimes.avg) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={20} className="text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Más Rápido</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {responseTimes.min > 0 ? formatHours(responseTimes.min) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={20} className="text-orange-600" />
                      <span className="text-sm text-orange-600 font-medium">Más Lento</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">
                      {responseTimes.max > 0 ? formatHours(responseTimes.max) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Efectividad y Stock */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Efectividad</h4>
                  <div className="bg-white border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Tasa de Completación</span>
                      <span className="text-lg font-bold text-indigo-600">{effectivenessRate}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${effectivenessRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {completedTickets.length} completados de {tickets.length} asignados
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Actividad de Stock</h4>
                  <div className="bg-white border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                          <ArrowUpFromLine size={16} />
                          <span className="text-2xl font-bold">{withdrawals.length}</span>
                        </div>
                        <p className="text-xs text-gray-500">Retiros</p>
                      </div>
                      <div className="h-12 w-px bg-gray-200" />
                      <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                          <ArrowDownToLine size={16} />
                          <span className="text-2xl font-bold">{returns.length}</span>
                        </div>
                        <p className="text-xs text-gray-500">Devoluciones</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Calificación */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Calificación</h4>
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={24}
                        className={`${
                          star <= Math.round(technician.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {technician.rating > 0 ? technician.rating.toFixed(1) : 'Sin calificar'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {technician.total_ratings} {technician.total_ratings === 1 ? 'calificación' : 'calificaciones'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tab Tickets */}
          {activeTab === 'tickets' && (
            <div>
              {tickets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <TicketIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>No hay tickets asignados a este técnico</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map(ticket => (
                    <div 
                      key={ticket.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        ticket.status === 'completed' ? 'bg-green-50 border-green-500' :
                        ticket.status === 'in_progress' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-gray-50 border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-gray-500">{ticket.ticket_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              ticket.status === 'completed' ? 'bg-green-200 text-green-800' :
                              ticket.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' :
                              ticket.status === 'pending' ? 'bg-gray-200 text-gray-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {ticket.status === 'completed' ? 'Completado' :
                               ticket.status === 'in_progress' ? 'En Progreso' :
                               ticket.status === 'pending' ? 'Pendiente' : 'Abierto'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              ticket.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {ticket.priority === 'critical' ? 'Crítico' :
                               ticket.priority === 'high' ? 'Alto' :
                               ticket.priority === 'medium' ? 'Medio' : 'Bajo'}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-800">{ticket.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Cliente: {ticket.client?.business_name || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar size={14} />
                            {formatDate(ticket.created_at)}
                          </div>
                          {ticket.status === 'completed' && ticket.updated_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Completado: {formatDate(ticket.updated_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Tab Stock */}
          {activeTab === 'stock' && (
            <div>
              {movements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>No hay movimientos de stock para este técnico</p>
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
                          'bg-gray-50 border-gray-400'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                mov.type === 'withdrawal' ? 'bg-orange-200 text-orange-800' :
                                'bg-green-200 text-green-800'
                              }`}>
                                {mov.type === 'withdrawal' ? '↑ RETIRO' : '↓ DEVOLUCIÓN'}
                              </span>
                              <span className="font-semibold text-gray-800">{mov.quantity} unidades</span>
                            </div>
                            <h4 className="font-medium text-gray-800">{mov.item_name}</h4>
                            <p className="text-xs text-gray-400">{mov.item_code}</p>
                            
                            <div className="flex gap-4 mt-2 text-sm">
                              {mov.ticket_number && (
                                <span className="text-blue-600">Ticket: {mov.ticket_number}</span>
                              )}
                              {conditionWithdrawal && (
                                <span className="text-gray-500">
                                  Estado retiro: <span className="font-medium">{conditionWithdrawal.label}</span>
                                </span>
                              )}
                              {mov.type === 'return' && conditionReturn && (
                                <span className="text-gray-500">
                                  Estado devolución: <span className="font-medium">{conditionReturn.label}</span>
                                </span>
                              )}
                            </div>
                            
                            {mov.notes && (
                              <p className="text-sm text-gray-500 mt-2 italic">"{mov.notes}"</p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            {formatDateTime(mov.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
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
