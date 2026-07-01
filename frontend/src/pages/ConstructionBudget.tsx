import { useState, useMemo, useEffect } from 'react'
import {
  constructionBudgetService as svc,
  ConstructionBudget as CBudget, BudgetFamily, BudgetItem, WorkCertificate, SupplierPayment,
  Worksheet, WorksheetItem, WORKSHEET_TEMPLATES,
  ItemType, BudgetStatus, CertificateStatus,
  ITEM_TYPE_LABELS, ITEM_TYPE_COLORS, BUDGET_STATUS_LABELS, BUDGET_STATUS_COLORS,
  CERT_STATUS_LABELS, CERT_STATUS_COLORS,
} from '../services/constructionBudgetService'
import { loadClientsSync } from '../services/clients'
import { loadSuppliersSync } from '../services/suppliers'
import { useAuthStore } from '../stores/authStore'
import {
  Building2, Plus, X, Save, Eye, Edit2, Trash2, ChevronRight, ChevronDown,
  FileText, DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  BarChart3, Layers, Package, Users, Wrench, Briefcase, Printer, Search,
  ArrowLeft, Percent, Calculator, CreditCard, Receipt, Clock, Shield, ClipboardList,
  Check, Copy, ListChecks,
} from 'lucide-react'

const fmtPYG = (v: number) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(v)
const fmtPct = (v: number) => `${v.toFixed(1)}%`

type Tab = 'planilla' | 'presupuesto' | 'certificados' | 'costos' | 'pagos' | 'analisis'

export default function ConstructionBudgetPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rk, setRk] = useState(0)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { svc.initializeDemoData() }, [])
  const budgets = useMemo(() => svc.getBudgets(), [rk])
  const refresh = () => setRk(k => k + 1)

  if (selectedId) {
    return <BudgetDetail budgetId={selectedId} onBack={() => { setSelectedId(null); refresh() }} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Building2 size={24} />Presupuestos de Construcción</h1>
          <p className="text-sm text-gray-500">Gestión integral: presupuesto, certificaciones, costos reales y pagos</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700"><Plus size={16} />Nuevo Presupuesto</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4 text-center"><span className="text-xs text-gray-500 block">Total Presupuestos</span><span className="text-2xl font-bold">{budgets.length}</span></div>
        <div className="bg-white rounded-xl border p-4 text-center"><span className="text-xs text-blue-600 block">En Ejecución</span><span className="text-2xl font-bold text-blue-700">{budgets.filter(b => b.status === 'en_ejecucion').length}</span></div>
        <div className="bg-white rounded-xl border p-4 text-center"><span className="text-xs text-gray-500 block">Monto Total</span><span className="text-lg font-bold">{fmtPYG(budgets.reduce((s, b) => s + b.grand_total, 0))}</span></div>
        <div className="bg-white rounded-xl border p-4 text-center"><span className="text-xs text-green-600 block">Total Certificado</span><span className="text-lg font-bold text-green-700">{fmtPYG(budgets.reduce((s, b) => s + b.total_certified, 0))}</span></div>
      </div>

      <div className="space-y-3">
        {budgets.map(b => (
          <div key={b.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedId(b.id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-400">{b.code}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${BUDGET_STATUS_COLORS[b.status]}`}>{BUDGET_STATUS_LABELS[b.status]}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800">{b.project_name}</h3>
                <p className="text-sm text-gray-500">{b.client_name} {b.location ? `· ${b.location}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Presupuesto Total</p>
                <p className="text-xl font-bold text-indigo-700">{fmtPYG(b.grand_total)}</p>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="text-gray-500">Cert: {fmtPct(b.certified_percent)}</span>
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, b.certified_percent)}%` }} /></div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {budgets.length === 0 && <div className="text-center py-16 bg-white rounded-xl border"><Building2 size={48} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No hay presupuestos creados</p></div>}
      </div>

      {showNew && <NewBudgetModal onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); refresh() }} />}
    </div>
  )
}

// ==================== DETAIL VIEW ====================

function BudgetDetail({ budgetId, onBack }: { budgetId: string; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('presupuesto')
  const [rk, setRk] = useState(0)
  const budget = useMemo(() => svc.getBudget(budgetId), [budgetId, rk])
  const refresh = () => setRk(k => k + 1)

  if (!budget) return <div className="text-center py-20"><p>Presupuesto no encontrado</p><button onClick={onBack} className="mt-4 text-indigo-600">Volver</button></div>

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'planilla', label: 'Planilla', icon: ClipboardList },
    { id: 'presupuesto', label: 'Presupuesto', icon: Layers },
    { id: 'certificados', label: 'Certificados', icon: CheckCircle },
    { id: 'costos', label: 'Costos Reales', icon: DollarSign },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'analisis', label: 'Análisis', icon: BarChart3 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-400">{budget.code}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${BUDGET_STATUS_COLORS[budget.status]}`}>{BUDGET_STATUS_LABELS[budget.status]}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{budget.project_name}</h1>
          <p className="text-sm text-gray-500">{budget.client_name} {budget.location ? `· ${budget.location}` : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-700">{fmtPYG(budget.grand_total)}</p>
          <p className="text-xs text-gray-400">Cert: {fmtPct(budget.certified_percent)} · Pagado: {fmtPYG(budget.total_paid)}</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-6 gap-2">
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Costo Directo</span><span className="text-sm font-bold">{fmtPYG(budget.total_direct_cost)}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Gto Admin ({budget.admin_expense_percent}%)</span><span className="text-sm font-bold">{fmtPYG(budget.admin_expense_amount)}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Utilidad ({budget.profit_percent}%)</span><span className="text-sm font-bold text-green-700">{fmtPYG(budget.profit_amount)}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">IVA ({budget.iva_percent}%)</span><span className="text-sm font-bold">{fmtPYG(budget.iva_amount)}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Costo Real</span><span className={`text-sm font-bold ${budget.total_real_cost > budget.total_direct_cost ? 'text-red-600' : 'text-green-700'}`}>{fmtPYG(budget.total_real_cost)}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Certificado</span><span className="text-sm font-bold text-blue-700">{fmtPYG(budget.total_certified)}</span></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${tab === t.id ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-800'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'planilla' && <WorksheetTab budgetId={budgetId} onRefresh={refresh} onGoToBudget={() => setTab('presupuesto')} />}
      {tab === 'presupuesto' && <BudgetTab budget={budget} onRefresh={refresh} />}
      {tab === 'certificados' && <CertificatesTab budgetId={budgetId} budget={budget} onRefresh={refresh} />}
      {tab === 'costos' && <RealCostsTab budget={budget} onRefresh={refresh} />}
      {tab === 'pagos' && <PaymentsTab budgetId={budgetId} budget={budget} onRefresh={refresh} />}
      {tab === 'analisis' && <AnalysisTab budgetId={budgetId} />}
    </div>
  )
}

// ==================== BUDGET TAB ====================

function BudgetTab({ budget, onRefresh }: { budget: CBudget; onRefresh: () => void }) {
  const [editingPercents, setEditingPercents] = useState(false)
  const [adminPct, setAdminPct] = useState(budget.admin_expense_percent)
  const [profitPct, setProfitPct] = useState(budget.profit_percent)
  const [ivaPct, setIvaPct] = useState(budget.iva_percent)
  const [showAddFamily, setShowAddFamily] = useState<string | false>(false) // false or parent_id ('' for root)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [addingItem, setAddingItem] = useState<string | null>(null)

  const savePercents = () => {
    svc.updateBudget(budget.id, { admin_expense_percent: adminPct, profit_percent: profitPct, iva_percent: ivaPct })
    setEditingPercents(false); onRefresh()
  }

  const rootFamilies = budget.families.filter(f => !f.parent_id).sort((a, b) => a.order - b.order)

  const handleAddFamily = (parentId?: string) => {
    if (!newFamilyName.trim()) return
    svc.addFamily(budget.id, { name: newFamilyName, parent_id: parentId || undefined })
    setNewFamilyName(''); setShowAddFamily(false); onRefresh()
  }

  const toggleFamily = (fId: string) => {
    const f = budget.families.find(ff => ff.id === fId)
    if (f) { svc.updateFamily(budget.id, fId, { is_expanded: !f.is_expanded }); onRefresh() }
  }

  const renderFamily = (family: BudgetFamily, depth: number) => {
    const children = budget.families.filter(f => f.parent_id === family.id).sort((a, b) => a.order - b.order)
    const familyTotal = family.items.reduce((s, i) => s + i.total_cost, 0)
    const familyIncidence = budget.total_direct_cost > 0 ? (familyTotal / budget.total_direct_cost) * 100 : 0

    return (
      <div key={family.id} className={depth > 0 ? 'ml-4 border-l-2 border-indigo-100 pl-3' : ''}>
        <div className="flex items-center gap-2 py-2 px-3 bg-gradient-to-r from-indigo-50 to-white rounded-lg mb-1 group">
          <button onClick={() => toggleFamily(family.id)} className="p-0.5">
            {family.is_expanded ? <ChevronDown size={16} className="text-indigo-500" /> : <ChevronRight size={16} className="text-indigo-400" />}
          </button>
          <span className="font-mono text-xs text-indigo-400 w-10">{family.code}</span>
          <span className="font-semibold text-sm text-gray-800 flex-1">{family.name}</span>
          <span className="text-xs text-gray-400">{family.items.length} items</span>
          <span className="text-xs font-medium text-indigo-600 w-20 text-right">{fmtPct(familyIncidence)}</span>
          <span className="text-sm font-bold text-gray-700 w-32 text-right">{fmtPYG(familyTotal)}</span>
          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            <button onClick={() => { setShowAddFamily(family.id); setNewFamilyName('') }} className="p-1 hover:bg-indigo-100 rounded" title="Agregar sub-familia"><Plus size={12} className="text-indigo-500" /></button>
            <button onClick={() => setAddingItem(family.id)} className="p-1 hover:bg-green-100 rounded" title="Agregar item"><Package size={12} className="text-green-600" /></button>
            <button onClick={() => { if (confirm('¿Eliminar familia?')) { svc.removeFamily(budget.id, family.id); onRefresh() } }} className="p-1 hover:bg-red-100 rounded"><Trash2 size={12} className="text-red-400" /></button>
          </div>
        </div>

        {showAddFamily === family.id && (
          <div className="ml-8 mb-2 flex gap-2 items-center">
            <input value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)} className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="Nombre de sub-familia" autoFocus onKeyDown={e => e.key === 'Enter' && handleAddFamily(family.id)} />
            <button onClick={() => handleAddFamily(family.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs">Agregar</button>
            <button onClick={() => setShowAddFamily(false)} className="px-2 py-1.5 border rounded text-xs">Cancelar</button>
          </div>
        )}

        {family.is_expanded && (
          <>
            {family.items.length > 0 && (
              <div className="ml-6 mb-2">
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-400 border-b">
                    <th className="text-left py-1 w-16">Código</th><th className="text-left py-1">Descripción</th>
                    <th className="text-center py-1 w-20">Tipo</th><th className="text-center py-1 w-12">Ud</th>
                    <th className="text-right py-1 w-14">Cant</th><th className="text-right py-1 w-24">P.Unit</th>
                    <th className="text-right py-1 w-28">Total</th><th className="text-right py-1 w-14">Inc%</th>
                    <th className="w-10"></th>
                  </tr></thead>
                  <tbody>
                    {family.items.map(item => (
                      <ItemRow key={item.id} item={item} budgetId={budget.id} familyId={family.id} onRefresh={onRefresh} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {addingItem === family.id && <AddItemForm budgetId={budget.id} familyId={family.id} familyCode={family.code} itemCount={family.items.length} onSaved={() => { setAddingItem(null); onRefresh() }} onCancel={() => setAddingItem(null)} />}
            {children.map(c => renderFamily(c, depth + 1))}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Percentages bar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Percent size={14} />Porcentajes del Presupuesto</h4>
          {!editingPercents ? (
            <button onClick={() => setEditingPercents(true)} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Edit2 size={12} />Editar</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={savePercents} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs flex items-center gap-1"><Save size={12} />Guardar</button>
              <button onClick={() => setEditingPercents(false)} className="px-3 py-1 border rounded text-xs">Cancelar</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {editingPercents ? (
            <>
              <div><label className="text-[10px] text-gray-500 block">Gastos Administrativos %</label><input type="number" value={adminPct} onChange={e => setAdminPct(parseFloat(e.target.value) || 0)} className="w-full px-3 py-1.5 border rounded text-sm" step="0.5" /></div>
              <div><label className="text-[10px] text-gray-500 block">Utilidad %</label><input type="number" value={profitPct} onChange={e => setProfitPct(parseFloat(e.target.value) || 0)} className="w-full px-3 py-1.5 border rounded text-sm" step="0.5" /></div>
              <div><label className="text-[10px] text-gray-500 block">IVA %</label><input type="number" value={ivaPct} onChange={e => setIvaPct(parseFloat(e.target.value) || 0)} className="w-full px-3 py-1.5 border rounded text-sm" step="0.5" /></div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-3"><span className="text-[10px] text-gray-500 block">Gastos Administrativos</span><span className="text-lg font-bold">{budget.admin_expense_percent}%</span><span className="text-xs text-gray-400 block">{fmtPYG(budget.admin_expense_amount)}</span></div>
              <div className="bg-green-50 rounded-lg p-3"><span className="text-[10px] text-green-600 block">Utilidad</span><span className="text-lg font-bold text-green-700">{budget.profit_percent}%</span><span className="text-xs text-green-500 block">{fmtPYG(budget.profit_amount)}</span></div>
              <div className="bg-blue-50 rounded-lg p-3"><span className="text-[10px] text-blue-600 block">IVA</span><span className="text-lg font-bold text-blue-700">{budget.iva_percent}%</span><span className="text-xs text-blue-400 block">{fmtPYG(budget.iva_amount)}</span></div>
            </>
          )}
        </div>
      </div>

      {/* Families */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Layers size={14} />Estructura del Presupuesto</h4>
          <button onClick={() => { setShowAddFamily(''); setNewFamilyName('') }} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs flex items-center gap-1"><Plus size={12} />Nueva Familia</button>
        </div>

        {showAddFamily === '' && (
          <div className="mb-3 flex gap-2 items-center">
            <input value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)} className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="Nombre de la familia principal" autoFocus onKeyDown={e => e.key === 'Enter' && handleAddFamily()} />
            <button onClick={() => handleAddFamily()} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs">Agregar</button>
            <button onClick={() => setShowAddFamily(false)} className="px-2 py-1.5 border rounded text-xs">Cancelar</button>
          </div>
        )}

        <div className="space-y-1">
          {rootFamilies.map(f => renderFamily(f, 0))}
          {rootFamilies.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Agregá familias para empezar a armar el presupuesto</p>}
        </div>
      </div>
    </div>
  )
}

function ItemRow({ item, budgetId, familyId, onRefresh }: { item: BudgetItem; budgetId: string; familyId: string; onRefresh: () => void }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 group">
      <td className="py-1.5 font-mono text-gray-400">{item.code}</td>
      <td className="py-1.5 text-gray-700">{item.description}</td>
      <td className="py-1.5 text-center"><span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${ITEM_TYPE_COLORS[item.type]}`}>{ITEM_TYPE_LABELS[item.type]}</span></td>
      <td className="py-1.5 text-center text-gray-500">{item.unit}</td>
      <td className="py-1.5 text-right text-gray-700">{item.quantity.toLocaleString('es-PY')}</td>
      <td className="py-1.5 text-right text-gray-700">{fmtPYG(item.unit_cost)}</td>
      <td className="py-1.5 text-right font-semibold">{fmtPYG(item.total_cost)}</td>
      <td className="py-1.5 text-right text-indigo-600 font-medium">{fmtPct(item.incidence_percent)}</td>
      <td className="py-1.5 text-center">
        <button onClick={() => { if (confirm('¿Eliminar item?')) { svc.removeItem(budgetId, familyId, item.id); onRefresh() } }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded"><Trash2 size={11} className="text-red-400" /></button>
      </td>
    </tr>
  )
}

function AddItemForm({ budgetId, familyId, familyCode, itemCount, onSaved, onCancel }: { budgetId: string; familyId: string; familyCode: string; itemCount: number; onSaved: () => void; onCancel: () => void }) {
  const [desc, setDesc] = useState('')
  const [type, setType] = useState<ItemType>('material')
  const [unit, setUnit] = useState('unidad')
  const [qty, setQty] = useState(1)
  const [unitCost, setUnitCost] = useState(0)

  const handleSave = () => {
    if (!desc.trim()) return
    const code = `${familyCode}.${String(itemCount + 1).padStart(2, '0')}`
    svc.addItem(budgetId, familyId, { family_id: familyId, code, description: desc, type, unit, quantity: qty, unit_cost: unitCost, real_unit_cost: 0, real_quantity: 0, notes: '' })
    onSaved()
  }

  return (
    <div className="ml-6 mb-3 bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="grid grid-cols-6 gap-2 text-xs">
        <div className="col-span-2"><label className="text-[10px] text-gray-500 block mb-0.5">Descripción *</label><input value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs" autoFocus /></div>
        <div><label className="text-[10px] text-gray-500 block mb-0.5">Tipo</label>
          <select value={type} onChange={e => setType(e.target.value as ItemType)} className="w-full px-2 py-1.5 border rounded text-xs">
            {Object.entries(ITEM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-gray-500 block mb-0.5">Unidad</label><input value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
        <div><label className="text-[10px] text-gray-500 block mb-0.5">Cantidad</label><input type="number" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
        <div><label className="text-[10px] text-gray-500 block mb-0.5">Precio Unit.</label><input type="number" value={unitCost} onChange={e => setUnitCost(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">Total: <strong>{fmtPYG(qty * unitCost)}</strong></span>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1 border rounded text-xs">Cancelar</button>
          <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Agregar Item</button>
        </div>
      </div>
    </div>
  )
}

// ==================== CERTIFICATES TAB ====================

function CertificatesTab({ budgetId, budget, onRefresh }: { budgetId: string; budget: CBudget; onRefresh: () => void }) {
  const [rk, setRk] = useState(0)
  const [showNew, setShowNew] = useState(false)
  const [selectedCert, setSelectedCert] = useState<string | null>(null)
  const [period, setPeriod] = useState('')
  const certs = useMemo(() => svc.getCertificates(budgetId), [budgetId, rk])
  const user = useAuthStore(s => s.user)
  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  const handleCreate = () => {
    if (!period.trim()) return
    const cert = svc.createCertificate(budgetId, period)
    setSelectedCert(cert.id); setShowNew(false); setPeriod('')
    localRefresh()
  }

  if (selectedCert) {
    const cert = certs.find(c => c.id === selectedCert)
    if (!cert) return null
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => { setSelectedCert(null); localRefresh() }} className="p-1 hover:bg-gray-100 rounded"><ArrowLeft size={18} /></button>
            <div>
              <h3 className="font-bold text-gray-800">Certificado #{cert.certificate_number} - {cert.period}</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${CERT_STATUS_COLORS[cert.status]}`}>{CERT_STATUS_LABELS[cert.status]}</span>
            </div>
          </div>
          {cert.status === 'borrador' && (
            <button onClick={() => { svc.approveCertificate(cert.id, user?.full_name || 'Admin'); localRefresh() }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2"><CheckCircle size={14} />Aprobar Certificado</button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Certificado Actual</span><span className="text-lg font-bold text-blue-700">{fmtPYG(cert.total_current_certified)}</span></div>
          <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Acumulado</span><span className="text-lg font-bold">{fmtPYG(cert.total_accumulated_certified)}</span></div>
          <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">% Avance Global</span><span className="text-lg font-bold text-green-700">{fmtPct(cert.accumulated_percent)}</span></div>
        </div>

        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr className="border-b">
              <th className="text-left px-3 py-2">Código</th><th className="text-left px-3 py-2">Descripción</th>
              <th className="text-center px-3 py-2">Ud</th><th className="text-right px-3 py-2">Cant Pres.</th>
              <th className="text-right px-3 py-2">P.Unit</th><th className="text-right px-3 py-2">Cert Anterior</th>
              <th className="text-right px-3 py-2 bg-blue-50">Cert Actual</th>
              <th className="text-right px-3 py-2 bg-blue-50">Monto Actual</th>
              <th className="text-right px-3 py-2">Acumulado</th><th className="text-right px-3 py-2">% Acum</th>
            </tr></thead>
            <tbody>
              {cert.items.map(ci => (
                <tr key={ci.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-gray-400">{ci.item_code}</td>
                  <td className="px-3 py-2">{ci.item_description}</td>
                  <td className="px-3 py-2 text-center text-gray-500">{ci.item_unit}</td>
                  <td className="px-3 py-2 text-right">{ci.budgeted_quantity.toLocaleString('es-PY')}</td>
                  <td className="px-3 py-2 text-right">{fmtPYG(ci.budgeted_unit_cost)}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{ci.previous_certified_qty.toLocaleString('es-PY')}</td>
                  <td className="px-3 py-2 text-right bg-blue-50">
                    {cert.status === 'borrador' ? (
                      <input type="number" value={ci.current_certified_qty || ''} onChange={e => { svc.updateCertificateItem(cert.id, ci.id, parseFloat(e.target.value) || 0); localRefresh() }}
                        className="w-20 px-1 py-0.5 border rounded text-right text-xs" step="0.01" />
                    ) : ci.current_certified_qty.toLocaleString('es-PY')}
                  </td>
                  <td className="px-3 py-2 text-right bg-blue-50 font-medium">{fmtPYG(ci.current_certified_amount)}</td>
                  <td className="px-3 py-2 text-right font-medium">{ci.accumulated_certified_qty.toLocaleString('es-PY')}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-medium ${ci.accumulated_certified_percent >= 100 ? 'text-green-600' : ci.accumulated_certified_percent > 50 ? 'text-blue-600' : 'text-gray-600'}`}>
                      {fmtPct(ci.accumulated_certified_percent)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><CheckCircle size={18} />Certificados de Obra</h3>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2"><Plus size={14} />Nuevo Certificado</button>
      </div>

      {showNew && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex gap-3 items-end">
          <div className="flex-1"><label className="text-sm font-medium block mb-1">Período *</label><input value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Marzo 2026, Semana 1-15 Mar" /></div>
          <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Crear</button>
          <button onClick={() => setShowNew(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
        </div>
      )}

      {certs.map(c => (
        <div key={c.id} className="bg-white rounded-xl border p-4 hover:shadow-sm cursor-pointer" onClick={() => setSelectedCert(c.id)}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">Certificado #{c.certificate_number}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${CERT_STATUS_COLORS[c.status]}`}>{CERT_STATUS_LABELS[c.status]}</span>
              </div>
              <p className="text-sm text-gray-500">{c.period} · {c.date}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-700">{fmtPYG(c.total_current_certified)}</p>
              <p className="text-xs text-gray-400">Acumulado: {fmtPct(c.accumulated_percent)}</p>
            </div>
          </div>
        </div>
      ))}
      {certs.length === 0 && <div className="text-center py-12 bg-white rounded-xl border"><FileText size={48} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No hay certificados creados</p></div>}
    </div>
  )
}

// ==================== REAL COSTS TAB ====================

function RealCostsTab({ budget, onRefresh }: { budget: CBudget; onRefresh: () => void }) {
  const handleUpdateRealCost = (familyId: string, itemId: string, field: 'real_unit_cost' | 'real_quantity', value: number) => {
    svc.updateItem(budget.id, familyId, itemId, { [field]: value })
    onRefresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><DollarSign size={18} />Costos Reales vs Presupuestados</h3>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-gray-100 rounded">Presupuestado: <strong>{fmtPYG(budget.total_direct_cost)}</strong></span>
          <span className={`px-2 py-1 rounded ${budget.total_real_cost > budget.total_direct_cost ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            Real: <strong>{fmtPYG(budget.total_real_cost)}</strong>
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50"><tr className="border-b">
            <th className="text-left px-3 py-2">Código</th><th className="text-left px-3 py-2">Descripción</th>
            <th className="text-center px-3 py-2">Tipo</th>
            <th className="text-right px-3 py-2">Cant Pres.</th><th className="text-right px-3 py-2">P.U. Pres.</th><th className="text-right px-3 py-2">Total Pres.</th>
            <th className="text-right px-3 py-2 bg-yellow-50">Cant Real</th><th className="text-right px-3 py-2 bg-yellow-50">P.U. Real</th><th className="text-right px-3 py-2 bg-yellow-50">Total Real</th>
            <th className="text-right px-3 py-2">Variación</th>
          </tr></thead>
          <tbody>
            {budget.families.map(f => f.items.map(item => {
              const variance = item.real_total_cost - item.total_cost
              const varPct = item.total_cost > 0 ? (variance / item.total_cost) * 100 : 0
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-gray-400">{item.code}</td>
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="px-3 py-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[9px] ${ITEM_TYPE_COLORS[item.type]}`}>{ITEM_TYPE_LABELS[item.type]}</span></td>
                  <td className="px-3 py-2 text-right">{item.quantity.toLocaleString('es-PY')}</td>
                  <td className="px-3 py-2 text-right">{fmtPYG(item.unit_cost)}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmtPYG(item.total_cost)}</td>
                  <td className="px-3 py-2 text-right bg-yellow-50">
                    <input type="number" value={item.real_quantity || ''} onChange={e => handleUpdateRealCost(f.id, item.id, 'real_quantity', parseFloat(e.target.value) || 0)}
                      className="w-16 px-1 py-0.5 border rounded text-right text-xs" step="0.01" />
                  </td>
                  <td className="px-3 py-2 text-right bg-yellow-50">
                    <input type="number" value={item.real_unit_cost || ''} onChange={e => handleUpdateRealCost(f.id, item.id, 'real_unit_cost', parseFloat(e.target.value) || 0)}
                      className="w-24 px-1 py-0.5 border rounded text-right text-xs" />
                  </td>
                  <td className="px-3 py-2 text-right bg-yellow-50 font-medium">{fmtPYG(item.real_total_cost)}</td>
                  <td className="px-3 py-2 text-right">
                    {item.real_total_cost > 0 && (
                      <span className={`font-medium ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {variance > 0 ? '+' : ''}{fmtPct(varPct)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            }))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== PAYMENTS TAB ====================

function PaymentsTab({ budgetId, budget, onRefresh }: { budgetId: string; budget: CBudget; onRefresh: () => void }) {
  const [rk, setRk] = useState(0)
  const [showNew, setShowNew] = useState(false)
  const payments = useMemo(() => svc.getPayments(budgetId), [budgetId, rk])
  const certs = useMemo(() => svc.getCertificates(budgetId), [budgetId])
  const suppliers = useMemo(() => loadSuppliersSync(), [])
  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  const [suppId, setSuppId] = useState('')
  const [certId, setCertId] = useState('')
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [invNumber, setInvNumber] = useState('')

  const handleCreate = () => {
    if (!suppId || !concept || amount <= 0) return
    const supp = suppliers.find(s => s.id === suppId)
    svc.createPayment({ budget_id: budgetId, certificate_id: certId || undefined, supplier_id: suppId, supplier_name: supp?.business_name || '', concept, amount, paid_amount: paidAmount, payment_date: paidAmount > 0 ? new Date().toISOString().split('T')[0] : undefined, invoice_number: invNumber })
    setShowNew(false); setSuppId(''); setCertId(''); setConcept(''); setAmount(0); setPaidAmount(0); setInvNumber('')
    localRefresh()
  }

  const totalPending = payments.reduce((s, p) => s + p.balance, 0)

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><CreditCard size={18} />Pagos a Proveedores</h3>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2"><Plus size={14} />Registrar Pago</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Total Comprometido</span><span className="text-lg font-bold">{fmtPYG(payments.reduce((s, p) => s + p.amount, 0))}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-green-600 block">Total Pagado</span><span className="text-lg font-bold text-green-700">{fmtPYG(payments.reduce((s, p) => s + p.paid_amount, 0))}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-red-600 block">Pendiente</span><span className="text-lg font-bold text-red-700">{fmtPYG(totalPending)}</span></div>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h4 className="font-semibold text-sm">Nuevo Pago</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><label className="text-xs text-gray-500 block mb-1">Proveedor *</label>
              <select value={suppId} onChange={e => setSuppId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Seleccionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-gray-500 block mb-1">Certificado (opc)</label>
              <select value={certId} onChange={e => setCertId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Sin certificado</option>
                {certs.map(c => <option key={c.id} value={c.id}>#{c.certificate_number} - {c.period}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-gray-500 block mb-1">N° Factura</label><input value={invNumber} onChange={e => setInvNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><label className="text-xs text-gray-500 block mb-1">Concepto *</label><input value={concept} onChange={e => setConcept(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Monto Total *</label><input type="number" value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Monto Pagado</label><input type="number" value={paidAmount || ''} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNew(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Registrar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Proveedor</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Concepto</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-600">Certificado</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-600">Monto</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-600">Pagado</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-600">Saldo</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-600">Estado</th>
          </tr></thead>
          <tbody className="divide-y">
            {payments.map(p => {
              const cert = p.certificate_id ? certs.find(c => c.id === p.certificate_id) : null
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-xs">{p.supplier_name}</td>
                  <td className="px-4 py-3 text-xs">{p.concept}</td>
                  <td className="px-4 py-3 text-center text-xs">{cert ? `#${cert.certificate_number}` : '-'}</td>
                  <td className="px-4 py-3 text-right text-xs font-medium">{fmtPYG(p.amount)}</td>
                  <td className="px-4 py-3 text-right text-xs text-green-700">{fmtPYG(p.paid_amount)}</td>
                  <td className="px-4 py-3 text-right text-xs text-red-600">{fmtPYG(p.balance)}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-medium ${p.status === 'pagado' ? 'bg-green-100 text-green-700' : p.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.status === 'pagado' ? 'Pagado' : p.status === 'parcial' ? 'Parcial' : 'Pendiente'}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {payments.length === 0 && <div className="text-center py-12"><CreditCard size={48} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500 text-sm">No hay pagos registrados</p></div>}
      </div>
    </div>
  )
}

// ==================== ANALYSIS TAB ====================

function AnalysisTab({ budgetId }: { budgetId: string }) {
  const analysis = useMemo(() => svc.getAnalysis(budgetId), [budgetId])
  if (!analysis) return null
  const { budget, byType, byFamily, totalItems, costVariance, costVariancePercent, paymentBalance } = analysis

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><BarChart3 size={18} />Análisis Integral del Presupuesto</h3>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4">
          <span className="text-[10px] text-gray-500 block">Items Totales</span>
          <span className="text-2xl font-bold">{totalItems}</span>
        </div>
        <div className={`rounded-xl border p-4 ${costVariance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <span className="text-[10px] block">{costVariance > 0 ? 'Sobrecosto' : 'Ahorro'}</span>
          <span className={`text-2xl font-bold ${costVariance > 0 ? 'text-red-700' : 'text-green-700'}`}>{fmtPYG(Math.abs(costVariance))}</span>
          <span className="text-xs block">{costVariancePercent > 0 ? '+' : ''}{fmtPct(costVariancePercent)}</span>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <span className="text-[10px] text-gray-500 block">Por Certificar</span>
          <span className="text-2xl font-bold text-blue-700">{fmtPYG(budget.total_budget - budget.total_certified)}</span>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <span className="text-[10px] text-gray-500 block">Saldo por Pagar</span>
          <span className="text-2xl font-bold text-orange-700">{fmtPYG(paymentBalance)}</span>
        </div>
      </div>

      {/* By Type */}
      <div className="bg-white rounded-xl border p-4">
        <h4 className="text-sm font-semibold mb-3">Distribución por Tipo de Carga</h4>
        <div className="space-y-2">
          {(Object.entries(byType) as [ItemType, { budgeted: number; real: number; count: number }][]).map(([type, data]) => {
            const pct = budget.total_direct_cost > 0 ? (data.budgeted / budget.total_direct_cost) * 100 : 0
            const realPct = data.budgeted > 0 ? ((data.real - data.budgeted) / data.budgeted) * 100 : 0
            return (
              <div key={type} className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-[10px] font-semibold w-24 text-center ${ITEM_TYPE_COLORS[type]}`}>{ITEM_TYPE_LABELS[type]}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>{data.count} items · {fmtPct(pct)}</span>
                    <span>Pres: {fmtPYG(data.budgeted)} | Real: {fmtPYG(data.real)}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
                {data.real > 0 && <span className={`text-xs font-medium w-16 text-right ${realPct > 0 ? 'text-red-600' : 'text-green-600'}`}>{realPct > 0 ? '+' : ''}{fmtPct(realPct)}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* By Family - Incidence */}
      <div className="bg-white rounded-xl border p-4">
        <h4 className="text-sm font-semibold mb-3">Incidencia por Familia</h4>
        <div className="space-y-2">
          {byFamily.sort((a, b) => b.incidence - a.incidence).map(f => (
            <div key={f.id} className="flex items-center gap-3">
              <span className="font-mono text-xs text-gray-400 w-8">{f.code}</span>
              <span className="text-sm w-48 truncate">{f.name}</span>
              <div className="flex-1">
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all" style={{ width: `${Math.min(100, f.incidence)}%` }} />
                </div>
              </div>
              <span className="text-sm font-bold text-indigo-700 w-14 text-right">{fmtPct(f.incidence)}</span>
              <span className="text-xs text-gray-500 w-28 text-right">{fmtPYG(f.budgeted)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Composition chart */}
      <div className="bg-white rounded-xl border p-4">
        <h4 className="text-sm font-semibold mb-3">Composición del Presupuesto Total</h4>
        <div className="flex items-center h-10 rounded-full overflow-hidden">
          {budget.total_direct_cost > 0 && <div className="h-full bg-indigo-500 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${(budget.total_direct_cost / budget.grand_total) * 100}%` }}>Directo</div>}
          {budget.admin_expense_amount > 0 && <div className="h-full bg-orange-400 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${(budget.admin_expense_amount / budget.grand_total) * 100}%` }}>Admin</div>}
          {budget.profit_amount > 0 && <div className="h-full bg-green-500 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${(budget.profit_amount / budget.grand_total) * 100}%` }}>Utilidad</div>}
          {budget.iva_amount > 0 && <div className="h-full bg-blue-400 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${(budget.iva_amount / budget.grand_total) * 100}%` }}>IVA</div>}
        </div>
        <div className="flex gap-4 mt-2 text-xs justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500" />Costo Directo: {fmtPct((budget.total_direct_cost / budget.grand_total) * 100)}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400" />Gto Admin: {fmtPct((budget.admin_expense_amount / budget.grand_total) * 100)}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" />Utilidad: {fmtPct((budget.profit_amount / budget.grand_total) * 100)}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400" />IVA: {fmtPct((budget.iva_amount / budget.grand_total) * 100)}</span>
        </div>
      </div>
    </div>
  )
}

// ==================== NEW BUDGET MODAL ====================

function NewBudgetModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [clientId, setClientId] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [adminPct, setAdminPct] = useState(15)
  const [profitPct, setProfitPct] = useState(20)
  const clients = useMemo(() => loadClientsSync(), [])

  const handleSave = () => {
    if (!name.trim()) return
    svc.createBudget({ project_name: name, description: desc, client_id: clientId || undefined, location, start_date: startDate || undefined, end_date: endDate || undefined, admin_expense_percent: adminPct, profit_percent: profitPct })
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Building2 size={18} />Nuevo Presupuesto de Construcción</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-sm font-medium block mb-1">Nombre del Proyecto *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Ampliación Oficinas" autoFocus /></div>
          <div><label className="text-sm font-medium block mb-1">Descripción</label><textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Cliente</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Sin cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium block mb-1">Ubicación</label><input value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Fecha Inicio</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Fecha Fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Gastos Administrativos %</label><input type="number" value={adminPct} onChange={e => setAdminPct(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg text-sm" step="0.5" /></div>
            <div><label className="text-sm font-medium block mb-1">Utilidad %</label><input type="number" value={profitPct} onChange={e => setProfitPct(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg text-sm" step="0.5" /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Crear Presupuesto</button>
        </div>
      </div>
    </div>
  )
}

// ==================== WORKSHEET TAB ====================

function WorksheetTab({ budgetId, onRefresh, onGoToBudget }: { budgetId: string; onRefresh: () => void; onGoToBudget: () => void }) {
  const [rk, setRk] = useState(0)
  const [showNew, setShowNew] = useState(false)
  const [selectedWs, setSelectedWs] = useState<string | null>(null)
  const worksheets = useMemo(() => svc.getWorksheets(budgetId), [budgetId, rk])
  const localRefresh = () => { setRk(k => k + 1); onRefresh() }

  if (selectedWs) {
    const ws = worksheets.find(w => w.id === selectedWs)
    if (!ws) { setSelectedWs(null); return null }
    return <WorksheetDetail ws={ws} onBack={() => { setSelectedWs(null); localRefresh() }} onRefresh={localRefresh} onGoToBudget={onGoToBudget} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ClipboardList size={18} />Planillas de Items</h3>
          <p className="text-xs text-gray-500">Creá planillas con los items necesarios para la obra y luego aplicalas al presupuesto</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700"><Plus size={14} />Nueva Planilla</button>
      </div>

      {showNew && <NewWorksheetModal budgetId={budgetId} onClose={() => setShowNew(false)} onCreated={(id) => { setShowNew(false); setSelectedWs(id); localRefresh() }} />}

      <div className="space-y-3">
        {worksheets.map(ws => {
          const selected = ws.items.filter(i => i.selected)
          const total = selected.reduce((s, i) => s + i.estimated_total, 0)
          return (
            <div key={ws.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedWs(ws.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">{ws.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ws.status === 'aplicado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {ws.status === 'aplicado' ? 'Aplicada al Presupuesto' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{ws.items.length} items · {selected.length} seleccionados · {new Date(ws.created_at).toLocaleDateString('es-PY')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-700">{fmtPYG(total)}</p>
                  <p className="text-xs text-gray-400">Total estimado</p>
                </div>
              </div>
            </div>
          )
        })}
        {worksheets.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed">
            <ClipboardList size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay planillas creadas</p>
            <p className="text-xs text-gray-400 mt-1">Creá una planilla desde plantilla o en blanco para empezar</p>
          </div>
        )}
      </div>
    </div>
  )
}

function NewWorksheetModal({ budgetId, onClose, onCreated }: { budgetId: string; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')

  const handleCreate = () => {
    if (!name.trim() || !templateId) return
    const ws = svc.createWorksheetFromTemplate(budgetId, templateId, name)
    onCreated(ws.id)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><ClipboardList size={18} />Nueva Planilla</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div><label className="text-sm font-medium block mb-1">Nombre de la Planilla *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Planilla principal de obra" autoFocus /></div>
          <div>
            <label className="text-sm font-medium block mb-2">Seleccioná una plantilla base *</label>
            <div className="grid grid-cols-2 gap-2">
              {WORKSHEET_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplateId(t.id)} className={`text-left p-3 rounded-lg border-2 transition-colors ${templateId === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                  {t.families.length > 0 && <p className="text-[10px] text-indigo-600 mt-1">{t.families.length} familias · {t.families.reduce((s, f) => s + f.items.length, 0)} items</p>}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleCreate} disabled={!name.trim() || !templateId} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">Crear Planilla</button>
        </div>
      </div>
    </div>
  )
}

function WorksheetDetail({ ws, onBack, onRefresh, onGoToBudget }: { ws: Worksheet; onBack: () => void; onRefresh: () => void; onGoToBudget: () => void }) {
  const [addingItem, setAddingItem] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState<ItemType>('material')
  const [newUnit, setNewUnit] = useState('unidad')
  const [newQty, setNewQty] = useState(1)
  const [newCost, setNewCost] = useState(0)
  const [newFamily, setNewFamily] = useState('')

  const selectedItems = ws.items.filter(i => i.selected)
  const totalEstimated = selectedItems.reduce((s, i) => s + i.estimated_total, 0)
  const families = [...new Set(ws.items.map(i => i.family_suggestion))].filter(Boolean)

  const toggleItem = (itemId: string) => {
    const item = ws.items.find(i => i.id === itemId)
    if (item) { svc.updateWorksheetItem(ws.id, itemId, { selected: !item.selected }); onRefresh() }
  }

  const toggleAll = (selected: boolean) => {
    ws.items.forEach(i => svc.updateWorksheetItem(ws.id, i.id, { selected }))
    onRefresh()
  }

  const handleAddItem = () => {
    if (!newDesc.trim()) return
    svc.addWorksheetItem(ws.id, { code: `CU.${String(ws.items.length + 1).padStart(2, '0')}`, description: newDesc, type: newType, unit: newUnit, estimated_quantity: newQty, estimated_unit_cost: newCost, family_suggestion: newFamily || 'Personalizado', notes: '' })
    setNewDesc(''); setNewQty(1); setNewCost(0); setNewFamily(''); setAddingItem(false); onRefresh()
  }

  const handleApply = () => {
    if (selectedItems.length === 0) { alert('Seleccioná al menos un item'); return }
    if (!confirm(`¿Aplicar ${selectedItems.length} items al presupuesto? Se crearán las familias y items correspondientes.`)) return
    svc.applyWorksheetToBudget(ws.id)
    onRefresh()
    onGoToBudget()
  }

  const handleUpdateField = (itemId: string, field: string, value: number) => {
    svc.updateWorksheetItem(ws.id, itemId, { [field]: value })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></button>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{ws.name}</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ws.status === 'aplicado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {ws.status === 'aplicado' ? 'Aplicada' : 'Borrador'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {ws.status === 'borrador' && (
            <>
              <button onClick={() => setAddingItem(true)} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"><Plus size={14} />Agregar Item</button>
              <button onClick={handleApply} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-700"><CheckCircle size={14} />Aplicar al Presupuesto</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Total Items</span><span className="text-2xl font-bold">{ws.items.length}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-green-600 block">Seleccionados</span><span className="text-2xl font-bold text-green-700">{selectedItems.length}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-gray-500 block">Familias</span><span className="text-2xl font-bold">{families.length}</span></div>
        <div className="bg-white rounded-lg border p-3"><span className="text-[10px] text-indigo-600 block">Total Estimado</span><span className="text-lg font-bold text-indigo-700">{fmtPYG(totalEstimated)}</span></div>
      </div>

      {addingItem && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold mb-2">Agregar Item Personalizado</h4>
          <div className="grid grid-cols-6 gap-2 text-xs">
            <div className="col-span-2"><label className="text-[10px] block mb-0.5">Descripción *</label><input value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs" autoFocus /></div>
            <div><label className="text-[10px] block mb-0.5">Tipo</label><select value={newType} onChange={e => setNewType(e.target.value as ItemType)} className="w-full px-2 py-1.5 border rounded text-xs">{Object.entries(ITEM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="text-[10px] block mb-0.5">Unidad</label><input value={newUnit} onChange={e => setNewUnit(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
            <div><label className="text-[10px] block mb-0.5">Cantidad</label><input type="number" value={newQty} onChange={e => setNewQty(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
            <div><label className="text-[10px] block mb-0.5">Precio Unit.</label><input type="number" value={newCost} onChange={e => setNewCost(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <div className="flex-1"><label className="text-[10px] block mb-0.5">Familia sugerida</label><input value={newFamily} onChange={e => setNewFamily(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs" placeholder="Ej: Instalaciones" /></div>
            <button onClick={handleAddItem} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs">Agregar</button>
            <button onClick={() => setAddingItem(false)} className="px-3 py-1.5 border rounded text-xs">Cancelar</button>
          </div>
        </div>
      )}

      {/* Items by family */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
          <span className="text-xs font-medium text-gray-600">Items de la Planilla</span>
          {ws.status === 'borrador' && (
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)} className="text-[10px] text-indigo-600 hover:underline">Seleccionar todos</button>
              <button onClick={() => toggleAll(false)} className="text-[10px] text-gray-500 hover:underline">Deseleccionar todos</button>
            </div>
          )}
        </div>
        {families.map(family => {
          const familyItems = ws.items.filter(i => i.family_suggestion === family)
          const familyTotal = familyItems.filter(i => i.selected).reduce((s, i) => s + i.estimated_total, 0)
          return (
            <div key={family}>
              <div className="flex items-center justify-between px-4 py-2 bg-indigo-50/50 border-b">
                <span className="text-xs font-semibold text-indigo-800">{family}</span>
                <span className="text-xs text-indigo-600">{familyItems.filter(i => i.selected).length}/{familyItems.length} · {fmtPYG(familyTotal)}</span>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {familyItems.map(item => (
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!item.selected ? 'opacity-40' : ''}`}>
                      <td className="px-3 py-2 w-8">
                        {ws.status === 'borrador' && (
                          <input type="checkbox" checked={item.selected} onChange={() => toggleItem(item.id)} className="rounded" />
                        )}
                      </td>
                      <td className="py-2 font-mono text-gray-400 w-14">{item.code}</td>
                      <td className="py-2 text-gray-700">{item.description}</td>
                      <td className="py-2 w-20 text-center"><span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${ITEM_TYPE_COLORS[item.type]}`}>{ITEM_TYPE_LABELS[item.type]}</span></td>
                      <td className="py-2 w-12 text-center text-gray-500">{item.unit}</td>
                      <td className="py-2 w-20 text-right">
                        {ws.status === 'borrador' ? (
                          <input type="number" value={item.estimated_quantity || ''} onChange={e => handleUpdateField(item.id, 'estimated_quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1 py-0.5 border rounded text-right text-xs" step="0.01" />
                        ) : item.estimated_quantity.toLocaleString('es-PY')}
                      </td>
                      <td className="py-2 w-24 text-right">
                        {ws.status === 'borrador' ? (
                          <input type="number" value={item.estimated_unit_cost || ''} onChange={e => handleUpdateField(item.id, 'estimated_unit_cost', parseFloat(e.target.value) || 0)}
                            className="w-24 px-1 py-0.5 border rounded text-right text-xs" />
                        ) : fmtPYG(item.estimated_unit_cost)}
                      </td>
                      <td className="py-2 w-28 text-right font-semibold pr-3">{fmtPYG(item.estimated_total)}</td>
                      <td className="py-2 w-8 text-center">
                        {ws.status === 'borrador' && (
                          <button onClick={() => { svc.removeWorksheetItem(ws.id, item.id); onRefresh() }} className="p-0.5 hover:bg-red-100 rounded"><Trash2 size={11} className="text-red-400" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
        {ws.items.length === 0 && <div className="text-center py-12"><p className="text-gray-400 text-sm">La planilla está vacía. Agregá items manualmente.</p></div>}
      </div>
    </div>
  )
}
