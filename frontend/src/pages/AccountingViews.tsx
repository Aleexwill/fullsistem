import { useState, useMemo } from 'react'
import {
  accountingService,
  AccountGroup,
  Account,
  AccountType,
  JournalEntry,
  JournalEntryState,
  JournalLine,
  Tax,
  TaxType,
  EInvoiceDocument,
  EInvoiceState,
  EInvoiceDocumentType,
  BankStatement,
  BankTransaction,
  BankTransactionState,
  ReportData,
  ReportLine,
  Journal,
  JournalType
} from '../services/accounting'
import {
  ChevronRight, ChevronDown, Plus, Search, Edit2, Trash2, X, Save, Loader2,
  Eye, Printer, Download, CheckCircle, XCircle, AlertTriangle, Filter,
  FileText, Calculator, Zap, RefreshCw, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Send, Ban, Clock, Check, Copy,
  Building2, LayoutDashboard, FileBarChart, Landmark, Sparkles
} from 'lucide-react'

const fmtPYG = (v: number) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(v)

// ==================== PLAN DE CUENTAS ====================
export function PlanCuentasView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['g1', 'g2', 'g3', 'g4', 'g5']))
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const tree = useMemo(() => accountingService.getAccountGroupTree(), [refreshKey])
  const accounts = useMemo(() => accountingService.getAccounts(), [refreshKey])
  const groups = useMemo(() => accountingService.getAccountGroups(), [refreshKey])

  const toggleGroup = (id: string) => {
    const next = new Set(expandedGroups)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedGroups(next)
  }

  const expandAll = () => setExpandedGroups(new Set(groups.map(g => g.id)))
  const collapseAll = () => setExpandedGroups(new Set())

  const filteredAccounts = searchTerm
    ? accounts.filter(a => a.code.includes(searchTerm) || a.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : null

  const typeColors: Record<string, string> = {
    receivable: 'bg-blue-100 text-blue-700', payable: 'bg-red-100 text-red-700',
    bank: 'bg-purple-100 text-purple-700', cash: 'bg-green-100 text-green-700',
    current_asset: 'bg-cyan-100 text-cyan-700', non_current_asset: 'bg-teal-100 text-teal-700',
    current_liability: 'bg-orange-100 text-orange-700', non_current_liability: 'bg-amber-100 text-amber-700',
    equity: 'bg-indigo-100 text-indigo-700', income: 'bg-emerald-100 text-emerald-700',
    expense: 'bg-rose-100 text-rose-700', cost_of_sales: 'bg-pink-100 text-pink-700',
    other_income: 'bg-lime-100 text-lime-700', other_expense: 'bg-fuchsia-100 text-fuchsia-700'
  }

  const groupTypeColors: Record<string, string> = {
    asset: 'border-l-blue-500', liability: 'border-l-red-500', equity: 'border-l-indigo-500',
    income: 'border-l-green-500', expense: 'border-l-rose-500'
  }

  const renderGroup = (group: AccountGroup, level: number = 0): React.ReactNode => {
    const isExpanded = expandedGroups.has(group.id)
    const groupAccounts = accounts.filter(a => a.account_group_id === group.id)
    const hasChildren = (group.children && group.children.length > 0) || groupAccounts.length > 0

    return (
      <div key={group.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-l-4 ${groupTypeColors[group.group_type] || 'border-l-gray-300'}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => toggleGroup(group.id)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />
          ) : <div className="w-3.5" />}
          <span className="font-mono text-xs text-gray-400 w-16 shrink-0">{group.code}</span>
          <span className={`text-sm ${level === 0 ? 'font-bold text-gray-900' : level === 1 ? 'font-semibold text-gray-800' : 'font-medium text-gray-700'}`}>{group.name}</span>
          <span className="text-xs text-gray-400 ml-auto">{groupAccounts.length > 0 ? `${groupAccounts.length} ctas` : ''}</span>
        </div>
        {isExpanded && (
          <>
            {group.children?.map(child => renderGroup(child, level + 1))}
            {groupAccounts.map(acc => (
              <div
                key={acc.id}
                className={`flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer border-l-4 border-l-transparent ${selectedAccount?.id === acc.id ? 'bg-blue-50' : ''}`}
                style={{ paddingLeft: `${(level + 1) * 20 + 26}px` }}
                onClick={() => setSelectedAccount(acc)}
              >
                <span className="font-mono text-xs text-blue-600 w-24 shrink-0">{acc.code}</span>
                <span className="text-sm text-gray-700">{acc.name}</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors[acc.account_type] || 'bg-gray-100 text-gray-600'}`}>{acc.account_type.replace(/_/g, ' ')}</span>
                  {acc.is_reconcilable && <span className="text-[10px] text-purple-500">Conciliable</span>}
                  {acc.balance !== undefined && acc.balance !== 0 && (
                    <span className={`text-xs font-mono font-medium ${acc.balance > 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmtPYG(acc.balance)}</span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  // KPIs
  const totalAccounts = accounts.length
  const activeAccounts = accounts.filter(a => a.is_active).length
  const reconcilableAccounts = accounts.filter(a => a.is_reconcilable).length

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-gray-800">Plan de Cuentas - Paraguay</h2><p className="text-sm text-gray-500">Normas contables paraguayas</p></div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50">Expandir Todo</button>
          <button onClick={collapseAll} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50">Colapsar</button>
          <button onClick={() => setShowNewAccount(true)} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Nueva Cuenta</button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { l: 'Total Cuentas', v: totalAccounts, c: 'text-slate-700' },
          { l: 'Activas', v: activeAccounts, c: 'text-green-600' },
          { l: 'Conciliables', v: reconcilableAccounts, c: 'text-purple-600' },
          { l: 'Grupos', v: groups.length, c: 'text-blue-600' },
          { l: 'Monedas', v: 'PYG / USD', c: 'text-amber-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <p className={`text-xl font-bold ${k.c}`}>{k.v}</p>
            <p className="text-xs text-gray-500">{k.l}</p>
          </div>
        ))}
      </div>

      <div className="relative"><Search size={16} className="absolute left-3 top-2.5 text-gray-400" /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por código o nombre..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>

      {filteredAccounts ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="text-left px-3 py-2">Código</th><th className="text-left px-3 py-2">Nombre</th><th className="text-center px-3 py-2">Tipo</th><th className="text-center px-3 py-2">Moneda</th><th className="text-right px-3 py-2">Saldo</th></tr></thead>
            <tbody>
              {filteredAccounts.map(acc => (
                <tr key={acc.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedAccount(acc)}>
                  <td className="px-3 py-2 font-mono text-blue-600">{acc.code}</td>
                  <td className="px-3 py-2">{acc.name}</td>
                  <td className="px-3 py-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors[acc.account_type]}`}>{acc.account_type.replace(/_/g, ' ')}</span></td>
                  <td className="px-3 py-2 text-center text-xs">{acc.currency_code}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtPYG(acc.balance || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAccounts.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No se encontraron cuentas</p>}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden max-h-[65vh] overflow-y-auto">
          {tree.map(group => renderGroup(group))}
        </div>
      )}

      {showNewAccount && <NewAccountModal onClose={() => setShowNewAccount(false)} onSave={() => { setRefreshKey(r => r + 1); setShowNewAccount(false) }} groups={groups} />}
    </div>
  )
}

function NewAccountModal({ onClose, onSave, groups }: { onClose: () => void; onSave: () => void; groups: AccountGroup[] }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [accType, setAccType] = useState<AccountType>(AccountType.CURRENT_ASSET)
  const [currency, setCurrency] = useState('PYG')
  const [reconcilable, setReconcilable] = useState(false)

  const handleSave = () => {
    if (!code || !name || !groupId) return
    accountingService.createAccount({ code, name, account_group_id: groupId, account_type: accType, currency_code: currency, is_reconcilable: reconcilable, is_active: true })
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Nueva Cuenta Contable</h3><button onClick={onClose}><X size={20} /></button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Código *</label><input value={code} onChange={e => setCode(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="1.1.01.015" /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Moneda</label><select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="PYG">PYG</option><option value="USD">USD</option></select></div>
          </div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Nombre *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Grupo *</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Seleccionar...</option>
              {groups.sort((a, b) => a.code.localeCompare(b.code)).map(g => <option key={g.id} value={g.id}>{g.code} - {g.name}</option>)}
            </select>
          </div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Tipo</label>
            <select value={accType} onChange={e => setAccType(e.target.value as AccountType)} className="w-full px-3 py-2 border rounded-lg text-sm">
              {Object.values(AccountType).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={reconcilable} onChange={e => setReconcilable(e.target.checked)} className="rounded" /><span className="text-sm">Cuenta conciliable</span></label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={!code || !name || !groupId} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-40">Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ==================== LIBRO DIARIO ====================
export function LibroDiarioView() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [filterState, setFilterState] = useState<JournalEntryState | ''>('')
  const [filterJournal, setFilterJournal] = useState('')
  const [dateFrom, setDateFrom] = useState(new Date().getFullYear() + '-01-01')
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const journals = useMemo(() => accountingService.getJournals(), [])

  useMemo(() => {
    setEntries(accountingService.getJournalEntries({
      state: filterState || undefined,
      journal_id: filterJournal || undefined,
      date_from: dateFrom,
      date_to: dateTo
    }))
  }, [filterState, filterJournal, dateFrom, dateTo, refreshKey])

  const refresh = () => setRefreshKey(r => r + 1)

  const handlePost = (id: string) => {
    try { accountingService.postJournalEntry(id); refresh() } catch (e: any) { alert(e.message) }
  }
  const handleReverse = (id: string) => {
    try { accountingService.reverseJournalEntry(id); refresh() } catch (e: any) { alert(e.message) }
  }

  const stateColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700', posted: 'bg-green-100 text-green-700', reversed: 'bg-red-100 text-red-700'
  }
  const stateLabels: Record<string, string> = { draft: 'Borrador', posted: 'Contabilizado', reversed: 'Reversado' }

  const totalDebit = entries.reduce((s, e) => s + e.total_debit, 0)
  const totalCredit = entries.reduce((s, e) => s + e.total_credit, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-gray-800">Libro Diario</h2><p className="text-sm text-gray-500">Asientos contables</p></div>
        <button onClick={() => setShowNewEntry(true)} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Nuevo Asiento</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-xl font-bold text-slate-700">{entries.length}</p><p className="text-xs text-gray-500">Asientos</p></div>
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-xl font-bold text-green-600">{entries.filter(e => e.state === 'posted').length}</p><p className="text-xs text-gray-500">Contabilizados</p></div>
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-lg font-bold text-blue-600">{fmtPYG(totalDebit)}</p><p className="text-xs text-gray-500">Total Débitos</p></div>
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-lg font-bold text-red-600">{fmtPYG(totalCredit)}</p><p className="text-xs text-gray-500">Total Créditos</p></div>
      </div>

      <div className="flex gap-3 items-center">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
        <span className="text-gray-400">a</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
        <select value={filterState} onChange={e => setFilterState(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Todos los estados</option>
          {Object.values(JournalEntryState).map(s => <option key={s} value={s}>{stateLabels[s]}</option>)}
        </select>
        <select value={filterJournal} onChange={e => setFilterJournal(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Todos los diarios</option>
          {journals.map(j => <option key={j.id} value={j.id}>{j.code} - {j.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="text-left px-3 py-2">Número</th><th className="text-left px-3 py-2">Fecha</th><th className="text-left px-3 py-2">Diario</th><th className="text-left px-3 py-2">Referencia</th><th className="text-center px-3 py-2">Estado</th><th className="text-right px-3 py-2">Débito</th><th className="text-right px-3 py-2">Crédito</th><th className="text-center px-3 py-2">Acciones</th></tr></thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-blue-600 cursor-pointer" onClick={() => setSelectedEntry(entry)}>{entry.entry_number}</td>
                <td className="px-3 py-2">{new Date(entry.entry_date).toLocaleDateString('es-PY')}</td>
                <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{entry.journal_code}</span></td>
                <td className="px-3 py-2 text-gray-600 truncate max-w-[200px]">{entry.reference || entry.narration || '-'}</td>
                <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stateColors[entry.state]}`}>{stateLabels[entry.state]}</span></td>
                <td className="px-3 py-2 text-right font-mono">{fmtPYG(entry.total_debit)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtPYG(entry.total_credit)}</td>
                <td className="px-3 py-2 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => setSelectedEntry(entry)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Eye size={14} /></button>
                    {entry.state === 'draft' && <button onClick={() => handlePost(entry.id)} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Contabilizar"><CheckCircle size={14} /></button>}
                    {entry.state === 'posted' && <button onClick={() => handleReverse(entry.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Reversar"><RefreshCw size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-center py-12 text-gray-400">No hay asientos en el período seleccionado</p>}
      </div>

      {showNewEntry && <NewJournalEntryModal journals={journals} onClose={() => setShowNewEntry(false)} onSave={() => { refresh(); setShowNewEntry(false) }} />}
      {selectedEntry && <JournalEntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} onPost={() => { handlePost(selectedEntry.id); setSelectedEntry(null) }} onReverse={() => { handleReverse(selectedEntry.id); setSelectedEntry(null) }} />}
    </div>
  )
}

function NewJournalEntryModal({ journals, onClose, onSave }: { journals: Journal[]; onClose: () => void; onSave: () => void }) {
  const accounts = useMemo(() => accountingService.getAccounts(), [])
  const [journalId, setJournalId] = useState(journals[0]?.id || '')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState('')
  const [narration, setNarration] = useState('')
  const [lines, setLines] = useState<{ account_id: string; name: string; debit: number; credit: number }[]>([
    { account_id: '', name: '', debit: 0, credit: 0 },
    { account_id: '', name: '', debit: 0, credit: 0 }
  ])

  const addLine = () => setLines([...lines, { account_id: '', name: '', debit: 0, credit: 0 }])
  const removeLine = (i: number) => { if (lines.length > 2) setLines(lines.filter((_, j) => j !== i)) }
  const updateLine = (i: number, field: string, value: any) => {
    const updated = [...lines]
    ;(updated[i] as any)[field] = value
    if (field === 'account_id') {
      const acc = accounts.find(a => a.id === value)
      if (acc) updated[i].name = acc.name
    }
    setLines(updated)
  }

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  const handleSave = () => {
    if (!isBalanced || !journalId) return
    accountingService.createJournalEntry({
      journal_id: journalId, entry_date: entryDate, reference, narration,
      lines: lines.filter(l => l.account_id).map((l, i) => ({ sequence: i + 1, account_id: l.account_id, name: l.name, debit: l.debit || 0, credit: l.credit || 0 }))
    })
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-slate-800 to-slate-700 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">Nuevo Asiento Contable</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium block mb-1">Diario *</label>
              <select value={journalId} onChange={e => setJournalId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                {journals.map(j => <option key={j.id} value={j.id}>{j.code} - {j.name}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium block mb-1">Fecha *</label><input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Referencia</label><input value={reference} onChange={e => setReference(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div><label className="text-sm font-medium block mb-1">Descripción</label><input value={narration} onChange={e => setNarration(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold">Líneas del Asiento</label>
              <button onClick={addLine} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"><Plus size={12} /> Línea</button>
            </div>
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-100"><tr><th className="text-left px-2 py-2">Cuenta</th><th className="text-left px-2 py-2">Etiqueta</th><th className="text-right px-2 py-2 w-36">Débito</th><th className="text-right px-2 py-2 w-36">Crédito</th><th className="w-8"></th></tr></thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1"><select value={line.account_id} onChange={e => updateLine(i, 'account_id', e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs">
                      <option value="">Seleccionar...</option>
                      {accounts.sort((a, b) => a.code.localeCompare(b.code)).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                    </select></td>
                    <td className="px-2 py-1"><input value={line.name} onChange={e => updateLine(i, 'name', e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs" /></td>
                    <td className="px-2 py-1"><input type="number" min={0} value={line.debit || ''} onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-xs text-right" /></td>
                    <td className="px-2 py-1"><input type="number" min={0} value={line.credit || ''} onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border rounded text-xs text-right" /></td>
                    <td className="px-1"><button onClick={() => removeLine(i)} className="p-0.5 text-red-400 hover:text-red-600"><Trash2 size={12} /></button></td>
                  </tr>
                ))}
                <tr className="border-t-2 bg-gray-50 font-bold">
                  <td colSpan={2} className="px-2 py-2 text-right">TOTALES</td>
                  <td className="px-2 py-2 text-right font-mono">{fmtPYG(totalDebit)}</td>
                  <td className="px-2 py-2 text-right font-mono">{fmtPYG(totalCredit)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            {!isBalanced && totalDebit > 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"><AlertTriangle size={14} /> Diferencia: {fmtPYG(Math.abs(totalDebit - totalCredit))} - El asiento debe estar balanceado</div>
            )}
            {isBalanced && <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2"><CheckCircle size={14} /> Asiento balanceado</div>}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={!isBalanced} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-40 flex items-center gap-1"><Save size={14} /> Guardar Borrador</button>
        </div>
      </div>
    </div>
  )
}

function JournalEntryDetailModal({ entry, onClose, onPost, onReverse }: { entry: JournalEntry; onClose: () => void; onPost: () => void; onReverse: () => void }) {
  const stateColors: Record<string, string> = { draft: 'bg-yellow-100 text-yellow-700', posted: 'bg-green-100 text-green-700', reversed: 'bg-red-100 text-red-700' }
  const stateLabels: Record<string, string> = { draft: 'Borrador', posted: 'Contabilizado', reversed: 'Reversado' }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div><h3 className="text-lg font-bold">{entry.entry_number}</h3><p className="text-sm text-gray-500">{entry.journal_name} - {new Date(entry.entry_date).toLocaleDateString('es-PY')}</p></div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stateColors[entry.state]}`}>{stateLabels[entry.state]}</span>
            <button onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {entry.reference && <div className="text-sm"><span className="text-gray-500">Referencia:</span> <strong>{entry.reference}</strong></div>}
          {entry.narration && <div className="text-sm"><span className="text-gray-500">Descripción:</span> {entry.narration}</div>}
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-slate-800 text-white"><tr><th className="text-left px-3 py-2">Cuenta</th><th className="text-left px-3 py-2">Etiqueta</th><th className="text-right px-3 py-2">Débito</th><th className="text-right px-3 py-2">Crédito</th></tr></thead>
            <tbody>
              {entry.lines.map((l, i) => (
                <tr key={l.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2"><span className="font-mono text-xs text-blue-600">{l.account_code}</span> {l.account_name}</td>
                  <td className="px-3 py-2 text-gray-600">{l.name}</td>
                  <td className="px-3 py-2 text-right font-mono">{l.debit > 0 ? fmtPYG(l.debit) : ''}</td>
                  <td className="px-3 py-2 text-right font-mono">{l.credit > 0 ? fmtPYG(l.credit) : ''}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold border-t-2">
                <td colSpan={2} className="px-3 py-2 text-right">TOTALES</td>
                <td className="px-3 py-2 text-right font-mono">{fmtPYG(entry.total_debit)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtPYG(entry.total_credit)}</td>
              </tr>
            </tbody>
          </table>
          {entry.posted_at && <p className="text-xs text-gray-400">Contabilizado: {new Date(entry.posted_at).toLocaleString('es-PY')}</p>}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          {entry.state === 'draft' && <button onClick={onPost} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"><CheckCircle size={14} /> Contabilizar</button>}
          {entry.state === 'posted' && <button onClick={onReverse} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-1"><RefreshCw size={14} /> Reversar</button>}
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ==================== IMPUESTOS ====================
export function ImpuestosView() {
  const taxes = useMemo(() => accountingService.getTaxes(), [])
  const fiscalPositions = useMemo(() => accountingService.getFiscalPositions(), [])
  const [activeTab, setActiveTab] = useState<'taxes' | 'fiscal'>('taxes')
  const [calcBase, setCalcBase] = useState(1000000)
  const [calcTax, setCalcTax] = useState('tax1')

  const calcResult = accountingService.computeTax(calcBase, calcTax)

  const saleTaxes = taxes.filter(t => t.tax_type === TaxType.SALE)
  const purchaseTaxes = taxes.filter(t => t.tax_type === TaxType.PURCHASE && !t.is_withholding)
  const withholdings = taxes.filter(t => t.is_withholding)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Impuestos - Paraguay</h2>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('taxes')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'taxes' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}>Impuestos</button>
        <button onClick={() => setActiveTab('fiscal')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'fiscal' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}>Posiciones Fiscales</button>
      </div>

      {activeTab === 'taxes' && <>
        {/* Calculadora rápida */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2"><Calculator size={16} /> Calculadora de Impuestos</h3>
          <div className="grid grid-cols-4 gap-3 items-end">
            <div><label className="text-xs text-gray-600 block mb-1">Monto Base</label><input type="number" value={calcBase} onChange={e => setCalcBase(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-gray-600 block mb-1">Impuesto</label><select value={calcTax} onChange={e => setCalcTax(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">{taxes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div className="text-center"><p className="text-xs text-gray-500">Impuesto</p><p className="text-lg font-bold text-red-600">{fmtPYG(calcResult.tax)}</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold text-green-600">{fmtPYG(calcResult.total)}</p></div>
          </div>
        </div>

        {[{ title: 'IVA Ventas', items: saleTaxes, color: 'green' }, { title: 'IVA Compras', items: purchaseTaxes, color: 'blue' }, { title: 'Retenciones', items: withholdings, color: 'red' }].map(section => (
          <div key={section.title} className="bg-white rounded-lg border overflow-hidden">
            <div className={`px-4 py-2 bg-${section.color}-50 border-b`}><h3 className="font-semibold text-gray-800">{section.title}</h3></div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="text-left px-3 py-2">Nombre</th><th className="text-center px-3 py-2">Tasa %</th><th className="text-center px-3 py-2">IVA Incluido</th><th className="text-center px-3 py-2">Grupo</th><th className="text-left px-3 py-2">Cuenta</th></tr></thead>
              <tbody>
                {section.items.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{t.name}</td>
                    <td className="px-3 py-2 text-center font-mono font-bold">{t.amount}%</td>
                    <td className="px-3 py-2 text-center">{t.price_include ? <CheckCircle size={14} className="text-green-500 mx-auto" /> : <span className="text-gray-300">-</span>}</td>
                    <td className="px-3 py-2 text-center"><span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{t.tax_group}</span></td>
                    <td className="px-3 py-2 text-xs text-gray-500">{t.account_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </>}

      {activeTab === 'fiscal' && (
        <div className="space-y-3">
          {fiscalPositions.map(fp => (
            <div key={fp.id} className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{fp.name}</h3>
                <div className="flex gap-2">
                  {fp.auto_apply && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Auto-aplicar</span>}
                  {fp.vat_required && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">RUC requerido</span>}
                </div>
              </div>
              {fp.tax_mappings.length > 0 ? (
                <div className="text-xs text-gray-600 space-y-1">
                  {fp.tax_mappings.map((tm, i) => {
                    const src = taxes.find(t => t.id === tm.tax_src_id)
                    const dest = tm.tax_dest_id ? taxes.find(t => t.id === tm.tax_dest_id) : null
                    return <div key={i} className="flex items-center gap-2"><span className="bg-red-50 px-2 py-0.5 rounded">{src?.name}</span><span>→</span><span className="bg-green-50 px-2 py-0.5 rounded">{dest?.name || 'Exento'}</span></div>
                  })}
                </div>
              ) : <p className="text-xs text-gray-400">Sin mapeos de impuestos (se usan los impuestos originales)</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== FACTURA ELECTRÓNICA SIFEN ====================
export function FacturaElectronicaView() {
  const [invoices, setInvoices] = useState<EInvoiceDocument[]>([])
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<EInvoiceDocument | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useMemo(() => { setInvoices(accountingService.getEInvoices()) }, [refreshKey])
  const refresh = () => setRefreshKey(r => r + 1)

  const handleSend = (id: string) => { accountingService.sendEInvoice(id); refresh() }
  const handleCancel = (id: string) => { const reason = prompt('Motivo de anulación (min 10 caracteres):'); if (reason && reason.length >= 10) { accountingService.cancelEInvoice(id, reason); refresh() } }

  const stateColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700', to_send: 'bg-yellow-100 text-yellow-700', sent: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-800 text-white'
  }
  const stateLabels: Record<string, string> = { draft: 'Borrador', to_send: 'Por enviar', sent: 'Enviado', approved: 'Aprobado', rejected: 'Rechazado', cancelled: 'Anulado' }
  const docLabels: Record<string, string> = { invoice: 'Factura', credit_note: 'Nota de Crédito', debit_note: 'Nota de Débito', receipt: 'Recibo' }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-gray-800">Facturación Electrónica</h2><p className="text-sm text-gray-500">Sistema SIFEN - SET Paraguay</p></div>
        <button onClick={() => setShowNew(true)} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Nueva Factura</button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { l: 'Total', v: invoices.length, c: 'text-slate-700' },
          { l: 'Aprobados', v: invoices.filter(i => i.state === 'approved').length, c: 'text-green-600' },
          { l: 'Pendientes', v: invoices.filter(i => i.state === 'draft').length, c: 'text-yellow-600' },
          { l: 'Facturado', v: fmtPYG(invoices.filter(i => i.state === 'approved').reduce((s, i) => s + i.total, 0)), c: 'text-blue-600' },
          { l: 'Anulados', v: invoices.filter(i => i.state === 'cancelled').length, c: 'text-red-600' },
        ].map((k, i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><p className={`text-lg font-bold ${k.c}`}>{k.v}</p><p className="text-xs text-gray-500">{k.l}</p></div>)}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="text-left px-3 py-2">Número</th><th className="text-left px-3 py-2">Tipo</th><th className="text-left px-3 py-2">Cliente</th><th className="text-left px-3 py-2">RUC</th><th className="text-center px-3 py-2">Estado</th><th className="text-right px-3 py-2">Total</th><th className="text-center px-3 py-2">Acciones</th></tr></thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-blue-600 cursor-pointer" onClick={() => setSelected(inv)}>{inv.document_number}</td>
                <td className="px-3 py-2"><span className="px-2 py-0.5 bg-blue-50 rounded text-xs">{docLabels[inv.document_type]}</span></td>
                <td className="px-3 py-2">{inv.partner_name}</td>
                <td className="px-3 py-2 font-mono text-xs">{inv.partner_tax_id}</td>
                <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stateColors[inv.state]}`}>{stateLabels[inv.state]}</span></td>
                <td className="px-3 py-2 text-right font-mono font-medium">{fmtPYG(inv.total)}</td>
                <td className="px-3 py-2 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => setSelected(inv)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Eye size={14} /></button>
                    {inv.state === 'draft' && <button onClick={() => handleSend(inv.id)} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Enviar a SIFEN"><Send size={14} /></button>}
                    {inv.state === 'approved' && <button onClick={() => handleCancel(inv.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Anular"><Ban size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="text-center py-12 text-gray-400">No hay documentos electrónicos</p>}
      </div>

      {showNew && <NewEInvoiceModal onClose={() => setShowNew(false)} onSave={() => { refresh(); setShowNew(false) }} />}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div><h3 className="text-lg font-bold">{docLabels[selected.document_type]} {selected.document_number}</h3><p className="text-sm text-gray-500">{selected.partner_name} - RUC: {selected.partner_tax_id}</p></div>
              <div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${stateColors[selected.state]}`}>{stateLabels[selected.state]}</span><button onClick={() => setSelected(null)}><X size={20} /></button></div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selected.cdc && <div className="bg-green-50 p-3 rounded-lg border border-green-200"><p className="text-xs text-green-600 font-medium">CDC (Código de Control)</p><p className="font-mono text-xs break-all">{selected.cdc}</p></div>}
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-100"><tr><th className="text-left px-3 py-2">Descripción</th><th className="text-center px-3 py-2">Cant.</th><th className="text-right px-3 py-2">P. Unit.</th><th className="text-right px-3 py-2">IVA</th><th className="text-right px-3 py-2">Total</th></tr></thead>
                <tbody>
                  {selected.items.map(item => (
                    <tr key={item.id} className="border-t"><td className="px-3 py-1.5">{item.description}</td><td className="px-3 py-1.5 text-center">{item.quantity}</td><td className="px-3 py-1.5 text-right font-mono">{fmtPYG(item.unit_price)}</td><td className="px-3 py-1.5 text-right">{item.tax_rate}%</td><td className="px-3 py-1.5 text-right font-mono font-medium">{fmtPYG(item.total)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-3 text-center gap-4">
                <div><p className="text-xs text-gray-500">Subtotal</p><p className="font-bold">{fmtPYG(selected.subtotal)}</p></div>
                <div><p className="text-xs text-gray-500">IVA</p><p className="font-bold text-red-600">{fmtPYG(selected.tax_total)}</p></div>
                <div><p className="text-xs text-gray-500">Total</p><p className="font-bold text-lg">{fmtPYG(selected.total)}</p></div>
              </div>
              <div><h4 className="text-sm font-semibold mb-2">Historial de Eventos</h4>
                <div className="space-y-1">{selected.events.map(evt => (
                  <div key={evt.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                    {evt.success ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
                    <span className="text-gray-500">{new Date(evt.timestamp).toLocaleString('es-PY')}</span>
                    <span>{evt.message}</span>
                  </div>
                ))}</div>
              </div>
            </div>
            <div className="p-3 border-t flex justify-end"><button onClick={() => setSelected(null)} className="px-4 py-2 border rounded-lg text-sm">Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewEInvoiceModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [docType, setDocType] = useState<EInvoiceDocumentType>(EInvoiceDocumentType.INVOICE)
  const [partnerName, setPartnerName] = useState('')
  const [partnerTaxId, setPartnerTaxId] = useState('')
  const [timbrado, setTimbrado] = useState('16000002')
  const [items, setItems] = useState([{ id: `i-${Date.now()}`, description: '', quantity: 1, unit_price: 0, tax_rate: 10, tax_amount: 0, total: 0 }])

  const addItem = () => setItems([...items, { id: `i-${Date.now()}`, description: '', quantity: 1, unit_price: 0, tax_rate: 10, tax_amount: 0, total: 0 }])
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...items]
    ;(updated[idx] as any)[field] = value
    const item = updated[idx]
    const subtotal = item.quantity * item.unit_price
    item.tax_amount = Math.round(subtotal * item.tax_rate / 100)
    item.total = subtotal + item.tax_amount
    setItems(updated)
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxTotal = items.reduce((s, i) => s + i.tax_amount, 0)
  const total = subtotal + taxTotal

  const handleSave = () => {
    if (!partnerName || !partnerTaxId || items.some(i => !i.description)) return
    const docNum = `001-001-${String(Math.floor(Math.random() * 9999999) + 1).padStart(7, '0')}`
    accountingService.createEInvoice({
      document_type: docType, partner_name: partnerName, partner_tax_id: partnerTaxId,
      timbrado, document_number: docNum, establishment_code: '001', emission_point_code: '001',
      currency_code: 'PYG', subtotal, tax_total: taxTotal, total, items
    })
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">Nueva Factura Electrónica</h3><button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium block mb-1">Tipo</label><select value={docType} onChange={e => setDocType(e.target.value as EInvoiceDocumentType)} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="invoice">Factura</option><option value="credit_note">Nota Crédito</option><option value="debit_note">Nota Débito</option></select></div>
            <div><label className="text-sm font-medium block mb-1">Timbrado</label><input value={timbrado} onChange={e => setTimbrado(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Razón Social *</label><input value={partnerName} onChange={e => setPartnerName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">RUC *</label><input value={partnerTaxId} onChange={e => setPartnerTaxId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="80012345-6" /></div>
          </div>
          <div>
            <div className="flex justify-between mb-2"><label className="text-sm font-bold">Items</label><button onClick={addItem} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs"><Plus size={12} /></button></div>
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-100"><tr><th className="text-left px-2 py-2">Descripción</th><th className="text-center px-2 py-2 w-16">Cant</th><th className="text-right px-2 py-2 w-28">P.Unit</th><th className="text-center px-2 py-2 w-20">IVA%</th><th className="text-right px-2 py-2 w-28">Total</th><th className="w-8"></th></tr></thead>
              <tbody>{items.map((item, i) => (
                <tr key={item.id} className="border-t">
                  <td className="px-2 py-1"><input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></td>
                  <td className="px-2 py-1"><input type="number" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-full px-2 py-1 border rounded text-xs text-center" /></td>
                  <td className="px-2 py-1"><input type="number" min={0} value={item.unit_price} onChange={e => updateItem(i, 'unit_price', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border rounded text-xs text-right" /></td>
                  <td className="px-2 py-1"><select value={item.tax_rate} onChange={e => updateItem(i, 'tax_rate', parseInt(e.target.value))} className="w-full px-1 py-1 border rounded text-xs"><option value={10}>10%</option><option value={5}>5%</option><option value={0}>Exento</option></select></td>
                  <td className="px-2 py-1 text-right font-mono text-xs font-medium">{fmtPYG(item.total)}</td>
                  <td><button onClick={() => setItems(items.filter((_, j) => j !== i))} className="p-0.5 text-red-400"><Trash2 size={12} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-3 text-center">
            <div><p className="text-xs text-gray-500">Subtotal</p><p className="font-bold">{fmtPYG(subtotal)}</p></div>
            <div><p className="text-xs text-gray-500">IVA</p><p className="font-bold text-red-600">{fmtPYG(taxTotal)}</p></div>
            <div><p className="text-xs text-gray-500">TOTAL</p><p className="font-bold text-lg text-green-700">{fmtPYG(total)}</p></div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={!partnerName || !partnerTaxId} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-40"><Save size={14} /> Crear</button>
        </div>
      </div>
    </div>
  )
}

// ==================== REPORTES CONTABLES ====================
export function ReportesContablesView() {
  const [reportType, setReportType] = useState<'balance' | 'resultados' | 'diario' | 'mayor' | 'iva'>('balance')
  const [dateFrom, setDateFrom] = useState(new Date().getFullYear() + '-01-01')
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [libroEntries, setLibroEntries] = useState<JournalEntry[]>([])
  const [libroMayor, setLibroMayor] = useState<any[]>([])
  const [libroIVA, setLibroIVA] = useState<any>(null)
  const [ivaType, setIvaType] = useState<'sale' | 'purchase'>('sale')

  const generateReport = () => {
    if (reportType === 'balance') { setReportData(accountingService.getBalanceGeneral(dateTo)); setLibroEntries([]); setLibroMayor([]); setLibroIVA(null) }
    else if (reportType === 'resultados') { setReportData(accountingService.getEstadoResultados(dateFrom, dateTo)); setLibroEntries([]); setLibroMayor([]); setLibroIVA(null) }
    else if (reportType === 'diario') { setLibroEntries(accountingService.getLibroDiario(dateFrom, dateTo)); setReportData(null); setLibroMayor([]); setLibroIVA(null) }
    else if (reportType === 'mayor') { setLibroMayor(accountingService.getLibroMayor(dateFrom, dateTo)); setReportData(null); setLibroEntries([]); setLibroIVA(null) }
    else if (reportType === 'iva') { setLibroIVA(accountingService.getLibroIVA(dateFrom, dateTo, ivaType)); setReportData(null); setLibroEntries([]); setLibroMayor([]) }
  }

  const renderReportLine = (line: ReportLine, depth: number = 0): React.ReactNode => (
    <div key={line.code + line.name}>
      <div className={`flex justify-between px-4 py-1.5 ${line.is_total ? 'font-bold bg-gray-100 border-t-2' : line.is_group ? 'font-semibold' : ''}`} style={{ paddingLeft: `${depth * 20 + 16}px` }}>
        <span className="text-sm">{line.code && <span className="font-mono text-xs text-gray-400 mr-2">{line.code}</span>}{line.name}</span>
        <span className={`font-mono text-sm ${line.amount < 0 ? 'text-red-600' : ''}`}>{fmtPYG(Math.abs(line.amount))}</span>
      </div>
      {line.children?.map(child => renderReportLine(child, depth + 1))}
    </div>
  )

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Reportes Contables</h2>
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-5 gap-3 items-end">
          <div><label className="text-xs font-medium block mb-1">Reporte</label>
            <select value={reportType} onChange={e => setReportType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="balance">Balance General</option><option value="resultados">Estado de Resultados</option>
              <option value="diario">Libro Diario</option><option value="mayor">Libro Mayor</option><option value="iva">Libro IVA</option>
            </select>
          </div>
          <div><label className="text-xs font-medium block mb-1">Desde</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="text-xs font-medium block mb-1">Hasta</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          {reportType === 'iva' && <div><label className="text-xs font-medium block mb-1">Tipo</label><select value={ivaType} onChange={e => setIvaType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="sale">IVA Ventas</option><option value="purchase">IVA Compras</option></select></div>}
          <button onClick={generateReport} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm flex items-center gap-1"><FileBarChart size={14} /> Generar</button>
        </div>
      </div>

      {reportData && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 bg-slate-800 text-white text-center">
            <h3 className="text-lg font-bold">{reportData.title}</h3>
            <p className="text-sm text-slate-300">{reportData.company_name} | {reportData.date_from ? `${reportData.date_from} al ` : 'Al '}{reportData.date_to} | {reportData.currency}</p>
          </div>
          <div className="p-4">{reportData.sections.map(s => renderReportLine(s))}</div>
          {reportData.totals && (
            <div className="p-4 bg-gray-50 border-t grid grid-cols-2 gap-4">
              {Object.entries(reportData.totals).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-sm font-medium text-gray-600">{k.replace(/_/g, ' ').toUpperCase()}</span><span className="font-mono font-bold">{fmtPYG(v)}</span></div>
              ))}
            </div>
          )}
        </div>
      )}

      {libroEntries.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 bg-slate-800 text-white text-center"><h3 className="text-lg font-bold">Libro Diario</h3><p className="text-sm text-slate-300">{dateFrom} al {dateTo}</p></div>
          <div className="p-4 space-y-4">
            {libroEntries.map(e => (
              <div key={e.id} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 flex justify-between items-center text-sm"><div><strong>{e.entry_number}</strong> <span className="text-gray-500 ml-2">{new Date(e.entry_date).toLocaleDateString('es-PY')}</span></div><span className="text-gray-500">{e.reference}</span></div>
                <table className="w-full text-xs"><tbody>
                  {e.lines.map(l => <tr key={l.id} className="border-t"><td className="px-3 py-1 font-mono text-blue-600 w-24">{l.account_code}</td><td className="px-3 py-1">{l.account_name}</td><td className="px-3 py-1 text-right w-28 font-mono">{l.debit > 0 ? fmtPYG(l.debit) : ''}</td><td className="px-3 py-1 text-right w-28 font-mono">{l.credit > 0 ? fmtPYG(l.credit) : ''}</td></tr>)}
                </tbody></table>
              </div>
            ))}
          </div>
        </div>
      )}

      {libroMayor.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 bg-slate-800 text-white text-center"><h3 className="text-lg font-bold">Libro Mayor</h3></div>
          <div className="p-4 space-y-4">
            {libroMayor.map((am: any) => (
              <div key={am.account.id} className="border rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-3 py-2 text-sm font-semibold">{am.account.code} - {am.account.name}</div>
                <table className="w-full text-xs"><thead className="bg-gray-50"><tr><th className="px-3 py-1 text-left">Fecha</th><th className="px-3 py-1 text-left">Ref</th><th className="px-3 py-1 text-right">Débito</th><th className="px-3 py-1 text-right">Crédito</th><th className="px-3 py-1 text-right">Saldo</th></tr></thead>
                  <tbody>{am.entries.map((e: any, i: number) => <tr key={i} className="border-t"><td className="px-3 py-1">{new Date(e.date).toLocaleDateString('es-PY')}</td><td className="px-3 py-1">{e.ref}</td><td className="px-3 py-1 text-right font-mono">{e.debit > 0 ? fmtPYG(e.debit) : ''}</td><td className="px-3 py-1 text-right font-mono">{e.credit > 0 ? fmtPYG(e.credit) : ''}</td><td className="px-3 py-1 text-right font-mono font-medium">{fmtPYG(e.balance)}</td></tr>)}</tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {libroIVA && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 bg-slate-800 text-white text-center"><h3 className="text-lg font-bold">Libro IVA {ivaType === 'sale' ? 'Ventas' : 'Compras'}</h3></div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-2 py-2 text-left">Fecha</th><th className="px-2 py-2 text-left">Doc.</th><th className="px-2 py-2 text-left">Proveedor/Cliente</th><th className="px-2 py-2 text-right">Base 10%</th><th className="px-2 py-2 text-right">IVA 10%</th><th className="px-2 py-2 text-right">Base 5%</th><th className="px-2 py-2 text-right">IVA 5%</th><th className="px-2 py-2 text-right">Exento</th><th className="px-2 py-2 text-right">Total</th></tr></thead>
            <tbody>
              {libroIVA.entries.map((e: any, i: number) => <tr key={i} className="border-t"><td className="px-2 py-1">{e.date}</td><td className="px-2 py-1">{e.document}</td><td className="px-2 py-1">{e.partner}</td><td className="px-2 py-1 text-right font-mono">{fmtPYG(e.base_10)}</td><td className="px-2 py-1 text-right font-mono">{fmtPYG(e.iva_10)}</td><td className="px-2 py-1 text-right font-mono">{fmtPYG(e.base_5)}</td><td className="px-2 py-1 text-right font-mono">{fmtPYG(e.iva_5)}</td><td className="px-2 py-1 text-right font-mono">{fmtPYG(e.exento)}</td><td className="px-2 py-1 text-right font-mono font-bold">{fmtPYG(e.total)}</td></tr>)}
              <tr className="border-t-2 bg-gray-100 font-bold"><td colSpan={3} className="px-2 py-2 text-right">TOTALES</td><td className="px-2 py-2 text-right font-mono">{fmtPYG(libroIVA.totals.base_10)}</td><td className="px-2 py-2 text-right font-mono">{fmtPYG(libroIVA.totals.iva_10)}</td><td className="px-2 py-2 text-right font-mono">{fmtPYG(libroIVA.totals.base_5)}</td><td className="px-2 py-2 text-right font-mono">{fmtPYG(libroIVA.totals.iva_5)}</td><td className="px-2 py-2 text-right font-mono">{fmtPYG(libroIVA.totals.exento)}</td><td className="px-2 py-2 text-right font-mono">{fmtPYG(libroIVA.totals.total)}</td></tr>
            </tbody>
          </table>
          {libroIVA.entries.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Sin movimientos IVA en el período</p>}
        </div>
      )}

      {!reportData && libroEntries.length === 0 && libroMayor.length === 0 && !libroIVA && (
        <div className="bg-white rounded-lg border p-12 text-center"><FileBarChart size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">Seleccioná un reporte y hacé clic en "Generar"</p></div>
      )}
    </div>
  )
}

// ==================== CONCILIACIÓN BANCARIA ====================
export function ConciliacionBancariaView() {
  const journals = useMemo(() => accountingService.getJournals().filter(j => j.journal_type === JournalType.BANK), [])
  const [selectedJournal, setSelectedJournal] = useState(journals[0]?.id || '')
  const [statements, setStatements] = useState<BankStatement[]>([])
  const [showImport, setShowImport] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useMemo(() => { setStatements(accountingService.getBankStatements(selectedJournal || undefined)) }, [selectedJournal, refreshKey])
  const refresh = () => setRefreshKey(r => r + 1)

  const handleReconcile = (stmtId: string, txId: string) => { accountingService.reconcileTransaction(stmtId, txId); refresh() }

  const stateColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', suggested: 'bg-blue-100 text-blue-700', confirmed: 'bg-purple-100 text-purple-700', reconciled: 'bg-green-100 text-green-700' }
  const stateLabels: Record<string, string> = { pending: 'Pendiente', suggested: 'Sugerido', confirmed: 'Confirmado', reconciled: 'Conciliado' }

  const handleImportDemo = () => {
    const journal = journals.find(j => j.id === selectedJournal)
    if (!journal) return
    const today = new Date().toISOString().split('T')[0]
    const transactions: BankTransaction[] = [
      { id: `bt-${Date.now()}-1`, statement_id: '', transaction_date: today, amount: 5500000, reference: 'TRANS-001', description: 'Cobro Factura VTA/00001', partner_name: 'ABC Corp', state: BankTransactionState.PENDING },
      { id: `bt-${Date.now()}-2`, statement_id: '', transaction_date: today, amount: -2300000, reference: 'TRANS-002', description: 'Pago Proveedor CMP/00001', partner_name: 'Proveedor XYZ', state: BankTransactionState.PENDING },
      { id: `bt-${Date.now()}-3`, statement_id: '', transaction_date: today, amount: -150000, reference: 'COM-BANCO', description: 'Comisión bancaria mensual', state: BankTransactionState.PENDING },
      { id: `bt-${Date.now()}-4`, statement_id: '', transaction_date: today, amount: 12000000, reference: 'TRANS-003', description: 'Depósito cliente', partner_name: 'Cliente Final', state: BankTransactionState.PENDING },
      { id: `bt-${Date.now()}-5`, statement_id: '', transaction_date: today, amount: -800000, reference: 'TRANS-004', description: 'Pago servicio ANDE', state: BankTransactionState.PENDING },
    ]
    accountingService.createBankStatement({
      journal_id: selectedJournal, journal_name: journal.name,
      name: `EC-${journal.code}-${today}`, statement_date: today, date_from: today, date_to: today,
      balance_start: 25000000, balance_end: 25000000 + transactions.reduce((s, t) => s + t.amount, 0),
      transactions
    })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-gray-800">Conciliación Bancaria</h2><p className="text-sm text-gray-500">Importar extractos y conciliar movimientos</p></div>
        <div className="flex gap-2">
          <select value={selectedJournal} onChange={e => setSelectedJournal(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {journals.map(j => <option key={j.id} value={j.id}>{j.code} - {j.name} ({j.currency_code})</option>)}
          </select>
          <button onClick={handleImportDemo} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm flex items-center gap-1"><Download size={14} /> Importar Demo</button>
        </div>
      </div>

      {statements.length > 0 ? statements.map(stmt => {
        const pendingCount = stmt.transactions.filter(t => t.state !== 'reconciled').length
        const reconciledCount = stmt.transactions.filter(t => t.state === 'reconciled').length
        const totalIn = stmt.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
        const totalOut = stmt.transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

        return (
          <div key={stmt.id} className="bg-white rounded-lg border overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <div className="flex justify-between items-center">
                <div><h3 className="font-semibold">{stmt.name}</h3><p className="text-xs text-gray-500">{new Date(stmt.statement_date).toLocaleDateString('es-PY')} | {stmt.journal_name}</p></div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div><p className="text-xs text-gray-500">Inicio</p><p className="font-mono text-sm font-medium">{fmtPYG(stmt.balance_start)}</p></div>
                  <div><p className="text-xs text-gray-500">Ingresos</p><p className="font-mono text-sm font-medium text-green-600">+{fmtPYG(totalIn)}</p></div>
                  <div><p className="text-xs text-gray-500">Egresos</p><p className="font-mono text-sm font-medium text-red-600">-{fmtPYG(totalOut)}</p></div>
                  <div><p className="text-xs text-gray-500">Final</p><p className="font-mono text-sm font-bold">{fmtPYG(stmt.balance_end)}</p></div>
                </div>
              </div>
              <div className="mt-2 flex gap-2"><span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">{pendingCount} pendientes</span><span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{reconciledCount} conciliados</span></div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="text-left px-3 py-2">Fecha</th><th className="text-left px-3 py-2">Referencia</th><th className="text-left px-3 py-2">Descripción</th><th className="text-left px-3 py-2">Contraparte</th><th className="text-right px-3 py-2">Monto</th><th className="text-center px-3 py-2">Estado</th><th className="text-center px-3 py-2">Acción</th></tr></thead>
              <tbody>
                {stmt.transactions.map(tx => (
                  <tr key={tx.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs">{new Date(tx.transaction_date).toLocaleDateString('es-PY')}</td>
                    <td className="px-3 py-2 font-mono text-xs">{tx.reference}</td>
                    <td className="px-3 py-2 text-xs">{tx.description}</td>
                    <td className="px-3 py-2 text-xs">{tx.partner_name || '-'}</td>
                    <td className={`px-3 py-2 text-right font-mono font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{tx.amount > 0 ? '+' : ''}{fmtPYG(tx.amount)}</td>
                    <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stateColors[tx.state]}`}>{stateLabels[tx.state]}</span></td>
                    <td className="px-3 py-2 text-center">
                      {tx.state !== 'reconciled' && <button onClick={() => handleReconcile(stmt.id, tx.id)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Conciliar</button>}
                      {tx.state === 'reconciled' && <CheckCircle size={14} className="text-green-500 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }) : (
        <div className="bg-white rounded-lg border p-12 text-center"><Building2 size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No hay extractos bancarios. Importá uno para comenzar la conciliación.</p></div>
      )}
    </div>
  )
}
