import { useState, useMemo } from 'react'
import { Ticket } from '../services/tickets'
import {
  calculateTicketCosts,
  getEmployeeHourlyRate,
  buildLaborEntry,
  buildMaterialUsage,
  formatProfit,
  formatMargin,
  getMarginColor,
  COST_CONFIG,
} from '../services/costAnalysisService'
import { ticketsService } from '../services/tickets'
import {
  TrendingUp, TrendingDown, Wrench, Package, Receipt, DollarSign,
  Plus, Clock, Trash2, AlertTriangle, CheckCircle, BarChart3,
  Users, FileText,
} from 'lucide-react'

interface Props {
  ticket: Ticket
  onUpdate?: () => void
  readOnly?: boolean
}

export default function TicketProfitabilityPanel({ ticket, onUpdate, readOnly }: Props) {
  const breakdown = useMemo(() => calculateTicketCosts(ticket), [ticket])
  const [showLaborForm, setShowLaborForm] = useState(false)

  const marginColor = getMarginColor(breakdown.margin_percent)
  const colorClasses: Record<string, { bg: string; text: string; border: string; ring: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-400' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-400' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-400' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', ring: 'ring-orange-400' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', ring: 'ring-red-400' },
  }
  const c = colorClasses[marginColor]

  const handleDeleteLabor = async (entryId: string) => {
    if (!confirm('¿Eliminar este registro de horas?')) return
    await ticketsService.deleteLaborEntry(ticket.id, entryId)
    onUpdate?.()
  }

  const handleDeleteMaterial = async (usageId: string) => {
    if (!confirm('¿Eliminar este consumo de material?')) return
    await ticketsService.deleteMaterialUsage(ticket.id, usageId)
    onUpdate?.()
  }

  return (
    <div className="space-y-4">
      {/* ==== HEADER: Utilidad Total ==== */}
      <div className={`rounded-xl border-2 ${c.border} ${c.bg} p-5`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 size={16} className={c.text} />
              Análisis de Rentabilidad
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {breakdown.revenue_source === 'invoiced' && 'Basado en factura emitida'}
              {breakdown.revenue_source === 'quoted' && 'Basado en presupuesto (aún sin facturar)'}
              {breakdown.revenue_source === 'none' && 'Sin ingresos registrados'}
            </p>
          </div>
          <div className={`text-right`}>
            <div className="flex items-center gap-1.5 justify-end">
              {breakdown.profit > 0 ? (
                <TrendingUp size={18} className={c.text} />
              ) : breakdown.profit < 0 ? (
                <TrendingDown size={18} className="text-red-600" />
              ) : null}
              <span className={`text-2xl font-bold ${c.text}`}>{formatMargin(breakdown.margin_percent)}</span>
            </div>
            <p className={`text-sm font-semibold ${breakdown.profit >= 0 ? c.text : 'text-red-600'}`}>
              {formatProfit(breakdown.profit)}
            </p>
          </div>
        </div>

        {/* Barras: composición ingreso vs costo */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-green-600" />
              <span className="text-xs text-gray-500">Ingreso</span>
            </div>
            <p className="text-lg font-bold text-green-700">{formatProfit(breakdown.revenue)}</p>
            {breakdown.revenue_collected > 0 && (
              <p className="text-xs text-gray-500">Cobrado: {formatProfit(breakdown.revenue_collected)}</p>
            )}
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Receipt size={14} className="text-red-600" />
              <span className="text-xs text-gray-500">Costo Total</span>
            </div>
            <p className="text-lg font-bold text-red-700">{formatProfit(breakdown.total_cost)}</p>
            <p className="text-xs text-gray-500">
              Directo: {formatProfit(breakdown.direct_cost)} + OH {(COST_CONFIG.INDIRECT_COST_PERCENT * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Alertas */}
        {breakdown.margin_status === 'loss' && (
          <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-2.5 flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <strong>Trabajo no rentable.</strong> El costo supera al ingreso. Revisar presupuesto, tiempos o gastos.
            </div>
          </div>
        )}
        {breakdown.margin_status === 'profit' && breakdown.margin_percent < COST_CONFIG.MIN_TARGET_MARGIN * 100 && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              Margen por debajo del objetivo ({(COST_CONFIG.MIN_TARGET_MARGIN * 100).toFixed(0)}%).
            </div>
          </div>
        )}
        {breakdown.revenue_source === 'none' && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2">
            <FileText size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              Sin presupuesto ni factura. Genera un presupuesto para comenzar el seguimiento financiero.
            </div>
          </div>
        )}
      </div>

      {/* ==== DESGLOSE DE COSTOS ==== */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Desglose de Costos</h4>
        <div className="space-y-2">
          <CostRow
            icon={<Users size={14} className="text-purple-600" />}
            label="Mano de Obra"
            detail={`${breakdown.labor_hours.toFixed(1)} hs`}
            amount={breakdown.labor_cost}
            total={breakdown.total_cost}
          />
          <CostRow
            icon={<Package size={14} className="text-blue-600" />}
            label="Materiales / Repuestos"
            detail={`${breakdown.materials_count} ítem(s)`}
            amount={breakdown.materials_cost}
            total={breakdown.total_cost}
          />
          <CostRow
            icon={<Wrench size={14} className="text-amber-600" />}
            label="Gastos Operativos"
            detail="Transporte, viáticos, etc."
            amount={breakdown.expenses_cost}
            total={breakdown.total_cost}
          />
          {breakdown.purchases_cost > 0 && (
            <CostRow
              icon={<Receipt size={14} className="text-red-600" />}
              label="Compras Imputadas"
              detail="Facturas de proveedor directas"
              amount={breakdown.purchases_cost}
              total={breakdown.total_cost}
            />
          )}
          <CostRow
            icon={<BarChart3 size={14} className="text-gray-500" />}
            label="Overhead / Indirectos"
            detail={`${(COST_CONFIG.INDIRECT_COST_PERCENT * 100).toFixed(0)}% sobre directo`}
            amount={breakdown.indirect_cost}
            total={breakdown.total_cost}
            muted
          />
        </div>
      </div>

      {/* ==== REGISTRO DE HORAS TRABAJADAS ==== */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={14} className="text-purple-600" />
            Horas de Mano de Obra
          </h4>
          {!readOnly && (
            <button
              onClick={() => setShowLaborForm(!showLaborForm)}
              className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 flex items-center gap-1"
            >
              <Plus size={12} /> Registrar horas
            </button>
          )}
        </div>

        {showLaborForm && (
          <LaborForm
            ticket={ticket}
            onSubmit={() => {
              setShowLaborForm(false)
              onUpdate?.()
            }}
            onCancel={() => setShowLaborForm(false)}
          />
        )}

        {(ticket.labor_entries || []).length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">Sin horas registradas aún.</p>
        ) : (
          <div className="space-y-1.5">
            {ticket.labor_entries!.map(entry => (
              <div key={entry.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{entry.technician_name}</p>
                  <p className="text-xs text-gray-500">
                    {entry.date} · {entry.hours} hs × Gs. {entry.hourly_rate.toLocaleString('es-PY')}/hs
                    {entry.description && ` · ${entry.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-700">{formatProfit(entry.cost)}</span>
                  {!readOnly && (
                    <button
                      onClick={() => handleDeleteLabor(entry.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==== MATERIALES CONSUMIDOS ==== */}
      {(ticket.material_usages && ticket.material_usages.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <Package size={14} className="text-blue-600" />
            Materiales Consumidos (valorizados al costo)
          </h4>
          <div className="space-y-1.5">
            {ticket.material_usages.map(usage => (
              <div key={usage.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {usage.item_name}
                    {usage.item_code && <span className="text-xs text-gray-400 ml-1">({usage.item_code})</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {usage.quantity} {usage.unit} × Gs. {usage.unit_cost.toLocaleString('es-PY')}
                    {usage.unit_cost === 0 && <span className="text-amber-600 ml-1">(sin costo registrado)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-700">{formatProfit(usage.total_cost)}</span>
                  {!readOnly && (
                    <button
                      onClick={() => handleDeleteMaterial(usage.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==== FOOTER: Estado de facturación ==== */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-gray-500">Facturado</p>
            <p className="font-bold text-gray-800">{formatProfit(breakdown.revenue_invoiced)}</p>
          </div>
          <div>
            <p className="text-gray-500">Presupuestado</p>
            <p className="font-bold text-gray-800">{formatProfit(breakdown.revenue_quoted)}</p>
          </div>
          <div>
            <p className="text-gray-500">Cobrado</p>
            <p className="font-bold text-gray-800">{formatProfit(breakdown.revenue_collected)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CostRow({
  icon, label, detail, amount, total, muted,
}: {
  icon: React.ReactNode
  label: string
  detail?: string
  amount: number
  total: number
  muted?: boolean
}) {
  const percent = total > 0 ? (amount / total) * 100 : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`font-medium ${muted ? 'text-gray-500' : 'text-gray-800'}`}>{label}</span>
          <span className={`font-semibold ${muted ? 'text-gray-500' : 'text-gray-800'}`}>
            {formatProfit(amount)}
          </span>
        </div>
        {detail && <p className="text-xs text-gray-400 mb-0.5">{detail}</p>}
        <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={muted ? 'bg-gray-300 h-full' : 'bg-gradient-to-r from-blue-400 to-purple-500 h-full'}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function LaborForm({
  ticket, onSubmit, onCancel,
}: {
  ticket: Ticket
  onSubmit: () => void
  onCancel: () => void
}) {
  // Usar técnico asignado por defecto
  const defaultTech = ticket.assigned_to
  const [technicianId, setTechnicianId] = useState(defaultTech?.id || '')
  const [technicianName, setTechnicianName] = useState(defaultTech?.full_name || '')
  const [hours, setHours] = useState<string>('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [customRate, setCustomRate] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const suggestedRate = useMemo(() => {
    return getEmployeeHourlyRate(technicianId || technicianName)
  }, [technicianId, technicianName])

  const numericHours = parseFloat(hours) || 0
  const numericRate = customRate ? parseFloat(customRate) : suggestedRate
  const computedCost = numericHours * numericRate

  const handleSubmit = async () => {
    if (!technicianName || numericHours <= 0) {
      alert('Indica el técnico y las horas trabajadas.')
      return
    }
    setSaving(true)
    try {
      const entry = buildLaborEntry(
        technicianId,
        technicianName,
        numericHours,
        date,
        description || undefined,
        'usuario',
        customRate ? numericRate : undefined
      )
      await ticketsService.addLaborEntry(ticket.id, entry)
      onSubmit()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600">Técnico</label>
          <input
            type="text"
            value={technicianName}
            onChange={(e) => setTechnicianName(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
            placeholder="Nombre del técnico"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600">Horas</label>
          <input
            type="number"
            step="0.25"
            min="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
            placeholder="8"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">
            Tasa (Gs/h) <span className="text-gray-400">sug: {suggestedRate.toLocaleString('es-PY')}</span>
          </label>
          <input
            type="number"
            value={customRate}
            onChange={(e) => setCustomRate(e.target.value)}
            placeholder={String(suggestedRate)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-600">Descripción (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
          placeholder="Actividad realizada"
        />
      </div>
      <div className="flex items-center justify-between bg-white rounded px-3 py-2 border border-purple-200">
        <span className="text-xs text-gray-600">Costo calculado:</span>
        <span className="font-bold text-purple-700">{formatProfit(computedCost)}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-purple-600 text-white text-sm py-1.5 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {saving ? '...' : <><CheckCircle size={13} /> Registrar</>}
        </button>
        <button
          onClick={onCancel}
          className="px-3 bg-gray-200 text-gray-700 text-sm py-1.5 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
