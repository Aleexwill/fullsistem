import { useState } from 'react'
import {
  type ConstructionBudget,
  type BudgetFamily,
  type BudgetItem,
  type ItemType,
  ITEM_TYPE_LABELS,
  ITEM_TYPE_COLORS,
  ticketObraAddFamily,
  ticketObraRemoveFamily,
  ticketObraAddItem,
  ticketObraRemoveItem,
  ticketObraUpdateItem,
  ticketObraToggleFamilyExpanded,
  ticketObraUpdatePercents,
} from '../services/constructionBudgetService'
import { Plus, Trash2, ChevronRight, ChevronDown, Layers, Package, Percent, Edit2, Save } from 'lucide-react'

const fmtPYG = (v: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(v)
const fmtPct = (v: number) => `${v.toFixed(1)}%`

function familyLevelLabel(code: string): string {
  const level = String(code || '').split('.').filter(Boolean).length
  if (level <= 1) return 'CAPITULO'
  if (level === 2) return 'RUBRO'
  if (level === 3) return 'SUBRUBRO'
  return `NIVEL ${level}`
}

type Props = {
  budget: ConstructionBudget
  onChange: (next: ConstructionBudget) => void
  readOnly?: boolean
}

export default function TicketObraBudgetEditor({ budget, onChange, readOnly }: Props) {
  const [editingPercents, setEditingPercents] = useState(false)
  const [adminPct, setAdminPct] = useState(budget.admin_expense_percent)
  const [profitPct, setProfitPct] = useState(budget.profit_percent)
  const [imprevistosPct, setImprevistosPct] = useState(budget.imprevistos_percent ?? 0)
  const [ivaPct, setIvaPct] = useState(budget.iva_percent)
  const [showAddFamily, setShowAddFamily] = useState<string | false>(false)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [addingItem, setAddingItem] = useState<string | null>(null)

  const savePercents = () => {
    onChange(
      ticketObraUpdatePercents(budget, {
        admin_expense_percent: adminPct,
        profit_percent: profitPct,
        imprevistos_percent: imprevistosPct,
        iva_percent: ivaPct,
      })
    )
    setEditingPercents(false)
  }

  const rootFamilies = budget.families.filter((f) => !f.parent_id).sort((a, b) => a.order - b.order)

  const handleAddFamily = (parentId?: string) => {
    if (!newFamilyName.trim() || readOnly) return
    onChange(ticketObraAddFamily(budget, newFamilyName, parentId))
    setNewFamilyName('')
    setShowAddFamily(false)
  }

  const toggleFamily = (fId: string) => {
    if (readOnly) return
    onChange(ticketObraToggleFamilyExpanded(budget, fId))
  }

  const renderFamily = (family: BudgetFamily, depth: number) => {
    const children = budget.families.filter((f) => f.parent_id === family.id).sort((a, b) => a.order - b.order)
    const familyTotal = family.items.reduce((s, i) => s + i.total_cost, 0)
    const familyIncidence = budget.total_direct_cost > 0 ? (familyTotal / budget.total_direct_cost) * 100 : 0

    return (
      <div key={family.id} className={depth > 0 ? 'ml-4 border-l-2 border-indigo-100 pl-3' : ''}>
        <div className="flex items-center gap-2 py-2 px-3 bg-gradient-to-r from-indigo-50 to-white rounded-lg mb-1 group">
          <button type="button" onClick={() => toggleFamily(family.id)} className="p-0.5" disabled={readOnly}>
            {family.is_expanded ? (
              <ChevronDown size={16} className="text-indigo-500" />
            ) : (
              <ChevronRight size={16} className="text-indigo-400" />
            )}
          </button>
          <span className="font-mono text-xs text-indigo-400 w-10">{family.code}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{familyLevelLabel(family.code)}</span>
          <span className="font-semibold text-sm text-gray-800 flex-1">{family.name}</span>
          <span className="text-xs text-gray-400">{family.items.length} ítems</span>
          <span className="text-xs font-medium text-indigo-600 w-20 text-right">{fmtPct(familyIncidence)}</span>
          <span className="text-sm font-bold text-gray-700 w-32 text-right">{fmtPYG(familyTotal)}</span>
          {!readOnly && (
            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setShowAddFamily(family.id)
                  setNewFamilyName('')
                }}
                className="p-1 hover:bg-indigo-100 rounded"
                title="Sub-familia"
              >
                <Plus size={12} className="text-indigo-500" />
              </button>
              <button
                type="button"
                onClick={() => setAddingItem(family.id)}
                className="p-1 hover:bg-green-100 rounded"
                title="Ítem"
              >
                <Package size={12} className="text-green-600" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Eliminar esta familia y su contenido?')) onChange(ticketObraRemoveFamily(budget, family.id))
                }}
                className="p-1 hover:bg-red-100 rounded"
              >
                <Trash2 size={12} className="text-red-400" />
              </button>
            </div>
          )}
        </div>

        {showAddFamily === family.id && !readOnly && (
          <div className="ml-8 mb-2 flex gap-2 items-center">
            <input
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              className="flex-1 px-3 py-1.5 border rounded text-sm"
              placeholder={`Nombre de ${familyLevelLabel(`${family.code}.1`).toLowerCase()}`}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddFamily(family.id)}
            />
            <button type="button" onClick={() => handleAddFamily(family.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs">
              Agregar
            </button>
            <button type="button" onClick={() => setShowAddFamily(false)} className="px-2 py-1.5 border rounded text-xs">
              Cancelar
            </button>
          </div>
        )}

        {family.is_expanded && (
          <>
            {family.items.length > 0 && (
              <div className="ml-6 mb-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b">
                      <th className="text-left py-1 w-16">Código</th>
                      <th className="text-left py-1">Descripción</th>
                      <th className="text-center py-1 w-20">Tipo</th>
                      <th className="text-center py-1 w-12">Ud</th>
                      <th className="text-right py-1 w-14">Cant</th>
                      <th className="text-right py-1 w-24">P.Unit</th>
                      <th className="text-right py-1 w-14">%GG</th>
                      <th className="text-right py-1 w-14">%UT</th>
                      <th className="text-right py-1 w-24">P.Venta</th>
                      <th className="text-right py-1 w-28">Total</th>
                      <th className="text-right py-1 w-28">Total Venta</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {family.items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        familyId={family.id}
                        readOnly={readOnly}
                        onPatch={(patch) => onChange(ticketObraUpdateItem(budget, family.id, item.id, patch))}
                        onRemove={() => {
                          if (confirm('¿Eliminar ítem?')) onChange(ticketObraRemoveItem(budget, family.id, item.id))
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {addingItem === family.id && !readOnly && (
              <AddItemForm
                familyCode={family.code}
                itemCount={family.items.length}
                onSaved={(input) => {
                  onChange(ticketObraAddItem(budget, family.id, input))
                  setAddingItem(null)
                }}
                onCancel={() => setAddingItem(null)}
              />
            )}
            {children.map((c) => renderFamily(c, depth + 1))}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <Percent size={14} />
            Configuración del presupuesto (modelo obra)
          </h4>
          {!readOnly &&
            (!editingPercents ? (
              <button type="button" onClick={() => setEditingPercents(true)} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                <Edit2 size={12} />
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={savePercents} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs flex items-center gap-1">
                  <Save size={12} />
                  Guardar
                </button>
                <button type="button" onClick={() => setEditingPercents(false)} className="px-3 py-1 border rounded text-xs">
                  Cancelar
                </button>
              </div>
            ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {editingPercents && !readOnly ? (
            <>
              <div>
                <label className="text-[10px] text-gray-500 block">% GG</label>
                <input
                  type="number"
                  value={adminPct}
                  onChange={(e) => setAdminPct(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border rounded text-sm"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block">% Utilidad</label>
                <input
                  type="number"
                  value={profitPct}
                  onChange={(e) => setProfitPct(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border rounded text-sm"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block">Imprevistos %</label>
                <input
                  type="number"
                  value={imprevistosPct}
                  onChange={(e) => setImprevistosPct(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border rounded text-sm"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block">IVA %</label>
                <input
                  type="number"
                  value={ivaPct}
                  onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border rounded text-sm"
                  step="0.5"
                />
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-[10px] text-gray-500 block">Gastos administrativos</span>
                <span className="text-lg font-bold">{budget.admin_expense_percent}%</span>
                <span className="text-xs text-gray-400 block">{fmtPYG(budget.admin_expense_amount)}</span>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <span className="text-[10px] text-green-600 block">Utilidad obra</span>
                <span className="text-lg font-bold text-green-700">{budget.profit_percent}%</span>
                <span className="text-xs text-green-500 block">{fmtPYG(budget.profit_amount)}</span>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <span className="text-[10px] text-amber-700 block">Imprevistos</span>
                <span className="text-lg font-bold text-amber-700">{budget.imprevistos_percent ?? 0}%</span>
                <span className="text-xs text-amber-600 block">{fmtPYG(budget.imprevistos_amount ?? 0)}</span>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <span className="text-[10px] text-blue-600 block">IVA</span>
                <span className="text-lg font-bold text-blue-700">{budget.iva_percent}%</span>
                <span className="text-xs text-blue-400 block">{fmtPYG(budget.iva_amount)}</span>
              </div>
            </>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Total presupuestado obra (con IVA): <strong>{fmtPYG(budget.grand_total)}</strong> · Costo directo:{' '}
          <strong>{fmtPYG(budget.total_direct_cost)}</strong>
        </p>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <Layers size={14} />
            Capítulos / Rubros / Subrubros / Ítems
          </h4>
          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setShowAddFamily('')
                setNewFamilyName('')
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs flex items-center gap-1"
            >
              <Plus size={12} />
              Nuevo capítulo/rubro
            </button>
          )}
        </div>

        {showAddFamily === '' && !readOnly && (
          <div className="mb-3 flex gap-2 items-center">
            <input
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              className="flex-1 px-3 py-1.5 border rounded text-sm"
              placeholder="Nombre del capítulo principal"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddFamily()}
            />
            <button type="button" onClick={() => handleAddFamily()} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs">
              Agregar
            </button>
            <button type="button" onClick={() => setShowAddFamily(false)} className="px-2 py-1.5 border rounded text-xs">
              Cancelar
            </button>
          </div>
        )}

        <div className="space-y-1">
          {rootFamilies.map((f) => renderFamily(f, 0))}
          {rootFamilies.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Sin familias — agregá una para comenzar</p>}
        </div>
      </div>
    </div>
  )
}

function ItemRow({
  item,
  familyId,
  readOnly,
  onPatch,
  onRemove,
}: {
  item: BudgetItem
  familyId: string
  readOnly?: boolean
  onPatch: (p: Partial<Pick<BudgetItem, 'description' | 'quantity' | 'unit_cost' | 'unit' | 'type'>>) => void
  onRemove: () => void
}) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 group">
      <td className="py-1.5 font-mono text-gray-400">{item.code}</td>
      <td className="py-1.5 text-gray-700">
        {readOnly ? (
          item.description
        ) : (
          <input
            className="w-full px-1 py-0.5 border rounded text-[11px]"
            value={item.description}
            onChange={(e) => onPatch({ description: e.target.value })}
          />
        )}
      </td>
      <td className="py-1.5 text-center">
        {readOnly ? (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${ITEM_TYPE_COLORS[item.type]}`}>{ITEM_TYPE_LABELS[item.type]}</span>
        ) : (
          <select
            className="text-[10px] border rounded px-0.5 py-0.5 max-w-[5.5rem]"
            value={item.type}
            onChange={(e) => onPatch({ type: e.target.value as ItemType })}
          >
            {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map((k) => (
              <option key={k} value={k}>
                {ITEM_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="py-1.5 text-center text-gray-500">
        {readOnly ? (
          item.unit
        ) : (
          <input className="w-full px-0.5 border rounded text-center text-[10px]" value={item.unit} onChange={(e) => onPatch({ unit: e.target.value })} />
        )}
      </td>
      <td className="py-1.5 text-right text-gray-700">
        {readOnly ? (
          item.quantity.toLocaleString('es-PY')
        ) : (
          <input
            type="number"
            className="w-full px-0.5 border rounded text-right text-[10px]"
            value={item.quantity}
            onChange={(e) => onPatch({ quantity: parseFloat(e.target.value) || 0 })}
          />
        )}
      </td>
      <td className="py-1.5 text-right text-gray-700">
        {readOnly ? (
          fmtPYG(item.unit_cost)
        ) : (
          <input
            type="number"
            className="w-full px-0.5 border rounded text-right text-[10px]"
            value={item.unit_cost}
            onChange={(e) => onPatch({ unit_cost: parseFloat(e.target.value) || 0 })}
          />
        )}
      </td>
      <td className="py-1.5 text-right font-semibold">{fmtPYG(item.total_cost)}</td>
      <td className="py-1.5 text-center">
        {!readOnly && (
          <button type="button" onClick={onRemove} className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded">
            <Trash2 size={11} className="text-red-400" />
          </button>
        )}
      </td>
    </tr>
  )
}

function AddItemForm({
  familyCode,
  itemCount,
  onSaved,
  onCancel,
}: {
  familyCode: string
  itemCount: number
  onSaved: (input: { description: string; type: ItemType; unit: string; quantity: number; unit_cost: number }) => void
  onCancel: () => void
}) {
  const [desc, setDesc] = useState('')
  const [type, setType] = useState<ItemType>('material')
  const [unit, setUnit] = useState('unidad')
  const [qty, setQty] = useState(1)
  const [unitCost, setUnitCost] = useState(0)

  const handleSave = () => {
    if (!desc.trim()) return
    onSaved({ description: desc.trim(), type, unit, quantity: qty, unit_cost: unitCost })
  }

  return (
    <div className="ml-6 mb-3 bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="grid grid-cols-6 gap-2 text-xs">
        <div className="col-span-2">
          <label className="text-[10px] text-gray-500 block mb-0.5">Descripción *</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs" autoFocus />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value as ItemType)} className="w-full px-2 py-1.5 border rounded text-xs">
            {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map((k) => (
              <option key={k} value={k}>
                {ITEM_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Unidad</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Cantidad</label>
          <input type="number" value={qty} onChange={(e) => setQty(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">P. unit.</label>
          <input type="number" value={unitCost} onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">
          Código sugerido: {familyCode}.{itemCount + 1}
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1 border rounded text-xs">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} className="px-3 py-1 bg-green-600 text-white rounded text-xs">
            Agregar ítem
          </button>
        </div>
      </div>
    </div>
  )
}
