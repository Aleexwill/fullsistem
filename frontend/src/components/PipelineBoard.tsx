import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Lead,
  PIPELINE_STAGES,
  PipelineStage,
  commercialService,
  pipelineService,
  getSourceIcon,
  getTagColor,
  formatCurrency,
  formatRelativeDate,
  getInitials
} from '../services/commercial'
import {
  Users, DollarSign, TrendingUp, BarChart3, Phone, Mail,
  Calendar, ChevronDown, ChevronRight, Plus,
  Search, X, CheckCircle, Clock, AlertCircle, ArrowRight
} from 'lucide-react'

// ==================== LEAD CARD ====================

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
  onClick?: () => void
  onAdvance?: (lead: Lead) => void
}

function LeadCard({ lead, isDragging, onClick, onAdvance }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: lead.id,
    data: { type: 'lead', lead },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isCurrentlyDragging = isDragging || isSortableDragging
  const taskBadge = pipelineService.getTaskBadge(lead.next_follow_up)

  const badgeStyles: Record<string, string> = {
    'overdue': 'bg-red-100 text-red-700 border-red-200',
    'today': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'upcoming': 'bg-green-100 text-green-700 border-green-200',
    'future': 'bg-blue-100 text-blue-700 border-blue-200',
    'no-tasks': 'bg-gray-100 text-gray-500 border-gray-200'
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === lead.status)
  const nextStage = PIPELINE_STAGES[currentStageIndex + 1]
  const canAdvance = nextStage && nextStage.id !== 'perdido'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative bg-white rounded-lg border border-gray-100 p-3
        shadow-sm hover:shadow-md transition-all duration-200
        cursor-grab active:cursor-grabbing
        ${isCurrentlyDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-400' : ''}
      `}
    >
      {/* Header: Avatar + Name */}
      <div className="flex items-start gap-2.5 mb-2" onClick={onClick}>
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs">
            {getInitials(lead.contact_name)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-[13px] truncate leading-tight">
            {lead.contact_name}
          </h4>
          <p className="text-gray-500 text-[11px] truncate mt-0.5">
            {lead.company_name}
          </p>
        </div>
        <div className="flex-shrink-0" title={lead.source}>
          <span className="text-sm">{getSourceIcon(lead.source)}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-2" onClick={onClick}>
        <span className="text-base font-semibold text-gray-900">
          {formatCurrency(lead.estimated_value, lead.currency)}
        </span>
      </div>

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {lead.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 2 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
              +{lead.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer: Task badge + Advance button */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${badgeStyles[taskBadge.type]}`}>
          {taskBadge.type === 'overdue' && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
          )}
          {taskBadge.label}
        </span>

        {canAdvance && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onAdvance?.(lead)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 hover:bg-green-100 text-green-700 text-[10px] font-medium border border-green-200"
            title={`Avanzar a ${nextStage.name}`}
          >
            <CheckCircle size={10} />
            Avanzar
            <ArrowRight size={10} />
          </button>
        )}
      </div>

      {/* Top color indicator on hover */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: PIPELINE_STAGES.find(s => s.id === lead.status)?.color || '#6366F1' }}
      />
    </div>
  )
}

// ==================== STAGE COLUMN ====================

interface StageColumnProps {
  stage: PipelineStage
  leads: Lead[]
  isLoading?: boolean
  onLeadClick?: (lead: Lead) => void
  onAdvanceLead?: (lead: Lead) => void
}

function StageColumn({ stage, leads, isLoading, onLeadClick, onAdvanceLead }: StageColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'stage', stage },
  })

  const totalValue = leads.reduce((sum, lead) => sum + lead.estimated_value, 0)
  const leadIds = leads.map(lead => lead.id)

  return (
    <div className={`flex flex-col rounded-xl min-w-[260px] max-w-[260px] bg-white shadow-sm border ${isCollapsed ? 'w-16 min-w-[64px] max-w-[64px]' : ''}`}>
      {/* Header with stage color */}
      <div
        className="rounded-t-xl px-3 py-3 flex items-center justify-between"
        style={{ backgroundColor: stage.color }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-white hover:bg-white/10 rounded p-0.5 -m-0.5 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          {!isCollapsed && (
            <>
              <h3 className="font-semibold text-sm">{stage.name}</h3>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                {leads.length}
              </span>
            </>
          )}
        </button>
      </div>

      {!isCollapsed && leads.length > 0 && (
        <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] text-gray-500">
          <span className="font-medium text-gray-700">{formatCurrency(totalValue)}</span>
          {' '}en {leads.length} lead{leads.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Content */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[150px] max-h-[calc(100vh-320px)] ${isOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : 'bg-gray-50/50'}`}
        >
          {isLoading ? (
            <>
              <LeadCardSkeleton />
              <LeadCardSkeleton />
            </>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-[11px] text-gray-400">Sin leads</p>
              <p className="text-[10px] text-gray-300 mt-0.5">Arrastra leads aquí</p>
            </div>
          ) : (
            <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick?.(lead)}
                  onAdvance={onAdvanceLead}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}

      {isCollapsed && (
        <div className="flex-1 flex items-center justify-center p-2">
          <div className="text-xs font-medium px-2 py-1 rounded text-white" style={{ backgroundColor: stage.color }}>
            {leads.length}
          </div>
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && leads.length > 0 && (
        <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400 text-center">
          {leads.length} lead{leads.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

function LeadCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 animate-pulse">
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-5 bg-gray-200 rounded w-24 mb-2" />
      <div className="flex gap-1 mb-2">
        <div className="h-4 bg-gray-200 rounded w-14" />
        <div className="h-4 bg-gray-200 rounded w-10" />
      </div>
    </div>
  )
}

// ==================== METRICS HEADER ====================

interface MetricsHeaderProps {
  metrics: {
    totalLeads: number
    totalValue: number
    byStage: { stageId: string; stageName: string; count: number; value: number }[]
  }
  isLoading?: boolean
}

function MetricsHeader({ metrics, isLoading }: MetricsHeaderProps) {
  if (isLoading) {
    return (
      <div className="bg-white border-b border-gray-200 p-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg p-3 h-20" />
          ))}
        </div>
      </div>
    )
  }

  const avgValue = metrics.totalLeads > 0 ? metrics.totalValue / metrics.totalLeads : 0
  const wonStage = metrics.byStage.find(s => s.stageId === 'ganado')
  const activeStages = metrics.byStage.filter(s => s.stageId !== 'perdido' && s.stageId !== 'ganado')
  const activeLeads = activeStages.reduce((sum, s) => sum + s.count, 0)
  const activeValue = activeStages.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            label="Leads Activos"
            value={activeLeads.toString()}
            color="blue"
          />
          <MetricCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Valor en Pipeline"
            value={formatCurrency(activeValue)}
            color="green"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Promedio/Lead"
            value={formatCurrency(avgValue)}
            color="purple"
          />
          <MetricCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Ganados"
            value={String(wonStage?.count || 0)}
            subtitle={wonStage ? formatCurrency(wonStage.value) : undefined}
            color="orange"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-0.5 h-3 rounded-full overflow-hidden bg-gray-100">
          {metrics.byStage.filter(s => s.count > 0).map((stage) => {
            const pct = metrics.totalLeads > 0 ? (stage.count / metrics.totalLeads) * 100 : 0
            const stageData = PIPELINE_STAGES.find(s => s.id === stage.stageId)
            return (
              <div
                key={stage.stageId}
                className="h-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: stageData?.color || '#ccc' }}
                title={`${stage.stageName}: ${stage.count} leads`}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-x-4 gap-y-1 mt-2 flex-wrap">
          {metrics.byStage.filter(s => s.count > 0).map((stage) => {
            const stageData = PIPELINE_STAGES.find(s => s.id === stage.stageId)
            return (
              <div key={stage.stageId} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stageData?.color || '#ccc' }} />
                <span>{stage.stageName}</span>
                <span className="font-semibold text-gray-800">({stage.count})</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, subtitle, color }: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-md ${colorClasses[color]}`}>{icon}</div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-lg font-semibold text-gray-900 truncate">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
    </div>
  )
}

// ==================== CONFIRM ADVANCE MODAL ====================

interface ConfirmAdvanceModalProps {
  lead: Lead
  nextStage: PipelineStage
  onConfirm: (notes: string) => void
  onCancel: () => void
  isLoading: boolean
}

function ConfirmAdvanceModal({ lead, nextStage, onConfirm, onCancel, isLoading }: ConfirmAdvanceModalProps) {
  const [notes, setNotes] = useState('')
  const currentStage = PIPELINE_STAGES.find(s => s.id === lead.status)

  const stageChecklist: Record<string, string[]> = {
    contactado: ['Primer contacto realizado', 'Datos de contacto verificados', 'Necesidad identificada'],
    calificado: ['Lead calificado por presupuesto', 'Decisor identificado', 'Timeline definido'],
    propuesta: ['Propuesta/cotización enviada', 'Términos discutidos', 'Seguimiento programado'],
    negociacion: ['Negociación de precio iniciada', 'Objeciones manejadas', 'Próximos pasos acordados'],
    ganado: ['Contrato firmado', 'Orden de compra recibida', 'Pago inicial confirmado'],
  }

  const checklist = stageChecklist[nextStage.id] || []
  const [checks, setChecks] = useState<boolean[]>(checklist.map(() => false))
  const allChecked = checks.every(Boolean) || checklist.length === 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Confirmar avance</h3>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <span className="px-2 py-0.5 rounded-full text-white text-xs font-medium" style={{ backgroundColor: currentStage?.color }}>
              {currentStage?.name}
            </span>
            <ArrowRight size={14} className="text-gray-400" />
            <span className="px-2 py-0.5 rounded-full text-white text-xs font-medium" style={{ backgroundColor: nextStage.color }}>
              {nextStage.name}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <strong>{lead.contact_name}</strong> - {lead.company_name}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {checklist.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirma las siguientes tareas:
              </label>
              <div className="space-y-2">
                {checklist.map((item, i) => (
                  <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checks[i]}
                      onChange={() => {
                        const newChecks = [...checks]
                        newChecks[i] = !newChecks[i]
                        setChecks(newChecks)
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className={`text-sm transition-colors ${checks[i] ? 'text-green-700 line-through' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Observaciones sobre este avance..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(notes)}
            disabled={!allChecked || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Confirmar avance
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== MAIN PIPELINE BOARD ====================

interface PipelineBoardProps {
  onLeadClick?: (lead: Lead) => void
  onCreateLead?: () => void
}

export default function PipelineBoard({ onLeadClick, onCreateLead }: PipelineBoardProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [advancingLead, setAdvancingLead] = useState<Lead | null>(null)
  const [isAdvancing, setIsAdvancing] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    setIsLoading(true)
    try {
      const { items } = await commercialService.listLeads()
      setLeads(items)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLeads = useMemo(() => {
    let result = leads

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(l =>
        l.company_name.toLowerCase().includes(search) ||
        l.contact_name.toLowerCase().includes(search) ||
        l.contact_email.toLowerCase().includes(search)
      )
    }

    if (filterPriority) {
      result = result.filter(l => l.priority === filterPriority)
    }

    return result
  }, [leads, searchTerm, filterPriority])

  const leadsByStage = useMemo(() => {
    const grouped = new Map<string, Lead[]>()
    PIPELINE_STAGES.forEach(stage => {
      grouped.set(stage.id, filteredLeads.filter(l => l.status === stage.id))
    })
    return grouped
  }, [filteredLeads])

  const metrics = useMemo(() => {
    return {
      totalLeads: filteredLeads.length,
      totalValue: filteredLeads.reduce((sum, l) => sum + l.estimated_value, 0),
      byStage: PIPELINE_STAGES.map(stage => {
        const stageLeads = filteredLeads.filter(l => l.status === stage.id)
        return {
          stageId: stage.id,
          stageName: stage.name,
          count: stageLeads.length,
          value: stageLeads.reduce((sum, l) => sum + l.estimated_value, 0)
        }
      })
    }
  }, [filteredLeads])

  const activeLead = useMemo(() => {
    if (!activeDragId) return null
    return leads.find(lead => lead.id === activeDragId) || null
  }, [activeDragId, leads])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const leadToMove = leads.find(l => l.id === activeId)
    if (!leadToMove) return

    let targetStageId: string | null = null

    if (over.data.current?.type === 'stage') {
      targetStageId = overId
    } else if (over.data.current?.type === 'lead') {
      const overLead = leads.find(l => l.id === overId)
      if (overLead) {
        targetStageId = overLead.status
      }
    }

    if (targetStageId && targetStageId !== leadToMove.status) {
      setLeads(prev => prev.map(l =>
        l.id === activeId ? { ...l, status: targetStageId as Lead['status'] } : l
      ))

      try {
        await pipelineService.moveLeadToStage(activeId, targetStageId)
      } catch (error) {
        console.error('Error moving lead:', error)
        loadLeads()
      }
    }
  }, [leads])

  const handleAdvanceLead = (lead: Lead) => {
    setAdvancingLead(lead)
  }

  const confirmAdvance = async (notes: string) => {
    if (!advancingLead) return

    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === advancingLead.status)
    const nextStage = PIPELINE_STAGES[currentIndex + 1]
    if (!nextStage) return

    setIsAdvancing(true)
    try {
      setLeads(prev => prev.map(l =>
        l.id === advancingLead.id ? { ...l, status: nextStage.id as Lead['status'] } : l
      ))
      await pipelineService.moveLeadToStage(advancingLead.id, nextStage.id)
      if (notes) {
        await commercialService.updateLead(advancingLead.id, {
          notes: advancingLead.notes ? `${advancingLead.notes}\n[${nextStage.name}] ${notes}` : `[${nextStage.name}] ${notes}`
        })
      }
    } catch (error) {
      console.error('Error advancing lead:', error)
      loadLeads()
    } finally {
      setIsAdvancing(false)
      setAdvancingLead(null)
    }
  }

  const nextStageForAdvancing = advancingLead
    ? PIPELINE_STAGES[PIPELINE_STAGES.findIndex(s => s.id === advancingLead.status) + 1]
    : null

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header with metrics */}
      <MetricsHeader metrics={metrics} isLoading={isLoading} />

      {/* Filter bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        <button
          onClick={onCreateLead}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Nuevo Lead
        </button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-3 h-full min-w-max">
            {PIPELINE_STAGES.filter(s => s.id !== 'perdido').map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                leads={leadsByStage.get(stage.id) || []}
                isLoading={isLoading}
                onLeadClick={onLeadClick}
                onAdvanceLead={handleAdvanceLead}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead && (
            <div className="transform rotate-3 scale-105">
              <LeadCard lead={activeLead} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Confirm Advance Modal */}
      {advancingLead && nextStageForAdvancing && (
        <ConfirmAdvanceModal
          lead={advancingLead}
          nextStage={nextStageForAdvancing}
          onConfirm={confirmAdvance}
          onCancel={() => setAdvancingLead(null)}
          isLoading={isAdvancing}
        />
      )}
    </div>
  )
}
