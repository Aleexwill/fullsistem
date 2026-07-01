import { useState, useMemo, useEffect } from 'react'
import {
  accountingService,
  BankAccountDetail,
  BankMovement,
  DeferredCheck,
  DeferredCheckStatus,
  CheckAlert,
  BankDashboardData,
  ExpiredCheckAnalytics,
  CHECK_DESTINATION_LABELS,
  CheckDestinationType
} from '../services/accounting'
import {
  Building2, Plus, Search, X, Save, Loader2, Eye, Printer,
  CheckCircle, XCircle, AlertTriangle, Filter, FileText,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Send, Ban, Clock, Check, RefreshCw, Download, Edit2,
  Trash2, Calendar, AlertOctagon, Bell, ChevronRight,
  ChevronDown, Wallet, CreditCard, DollarSign, Landmark,
  ArrowRight, BarChart3, History, Zap, Shield, Copy,
  Receipt
} from 'lucide-react'

const fmtPYG = (v: number) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(v)
const fmtUSD = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
const fmtMoney = (v: number, cur: string) => cur === 'USD' ? fmtUSD(v) : fmtPYG(v)

type BankTab = 'dashboard' | 'movements' | 'checks_received' | 'checks_issued' | 'expired' | 'alerts'

const CHECK_STATUS_LABELS: Record<DeferredCheckStatus, string> = {
  en_cartera: 'En Cartera', depositado: 'Depositado', cobrado: 'Cobrado', rechazado: 'Rechazado',
  vencido: 'Vencido', endosado: 'Endosado', anulado: 'Anulado', emitido: 'Emitido', entregado: 'Entregado'
}
const CHECK_STATUS_COLORS: Record<DeferredCheckStatus, string> = {
  en_cartera: 'bg-blue-100 text-blue-700', depositado: 'bg-purple-100 text-purple-700', cobrado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700', vencido: 'bg-red-200 text-red-800', endosado: 'bg-amber-100 text-amber-700',
  anulado: 'bg-gray-200 text-gray-600', emitido: 'bg-blue-100 text-blue-700', entregado: 'bg-orange-100 text-orange-700'
}
const MOVEMENT_CATEGORY_LABELS: Record<string, string> = {
  transferencia: 'Transferencia', deposito: 'Depósito', retiro: 'Retiro', cheque: 'Cheque',
  cheque_diferido: 'Cheque Diferido', debito_automatico: 'Débito Automático', comision: 'Comisión',
  interes: 'Interés', pago_proveedor: 'Pago Proveedor', cobro_cliente: 'Cobro Cliente', otro: 'Otro'
}

export default function BankManagementView() {
  const [activeTab, setActiveTab] = useState<BankTab>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedAccount, setSelectedAccount] = useState<string>('')

  const dashboard = useMemo(() => accountingService.getBankDashboard(), [refreshKey])
  const refresh = () => setRefreshKey(r => r + 1)

  const expiredCount = useMemo(() => accountingService.getExpiredChecks().length, [refreshKey])

  const tabs: { id: BankTab; label: string; icon: any; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Landmark },
    { id: 'movements', label: 'Movimientos', icon: History },
    { id: 'checks_received', label: 'Cheques Recibidos', icon: ArrowDownRight, badge: dashboard.checks_received_count },
    { id: 'checks_issued', label: 'Cheques Emitidos', icon: ArrowUpRight, badge: dashboard.checks_issued_count },
    { id: 'expired', label: 'Vencidos', icon: AlertOctagon, badge: expiredCount, badgeColor: 'bg-red-600 text-white' },
    { id: 'alerts', label: 'Alertas', icon: Bell, badge: dashboard.alerts.length },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestión Bancaria</h2>
          <p className="text-sm text-gray-500">Cuentas, movimientos y cheques diferidos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white shadow text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon size={16} />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab.badgeColor || (tab.id === 'alerts' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600')}`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <BankDashboard data={dashboard} onRefresh={refresh} onNavigate={setActiveTab} />}
      {activeTab === 'movements' && <BankMovementsTab accounts={dashboard.accounts} onRefresh={refresh} />}
      {activeTab === 'checks_received' && <DeferredChecksTab type="received" accounts={dashboard.accounts} onRefresh={refresh} />}
      {activeTab === 'checks_issued' && <DeferredChecksTab type="issued" accounts={dashboard.accounts} onRefresh={refresh} />}
      {activeTab === 'expired' && <ExpiredChecksTab onRefresh={refresh} />}
      {activeTab === 'alerts' && <AlertsTab alerts={dashboard.alerts} onRefresh={refresh} />}
    </div>
  )
}

// ==================== DASHBOARD ====================
function BankDashboard({ data, onRefresh, onNavigate }: { data: BankDashboardData; onRefresh: () => void; onNavigate: (tab: BankTab) => void }) {
  return (
    <div className="space-y-4">
      {/* Alertas urgentes */}
      {data.alerts.filter(a => a.alert_type === 'overdue' || a.alert_type === 'today').length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon size={20} className="text-red-600" />
            <h3 className="font-bold text-red-800">Cheques que requieren atención inmediata</h3>
          </div>
          <div className="space-y-1">
            {data.alerts.filter(a => a.alert_type === 'overdue' || a.alert_type === 'today').slice(0, 5).map(alert => (
              <div key={alert.check.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-red-200">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${alert.alert_type === 'overdue' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                    {alert.alert_type === 'overdue' ? 'VENCIDO' : 'HOY'}
                  </span>
                  <span className="text-sm font-medium">#{alert.check.check_number}</span>
                  <span className="text-sm text-gray-600">{alert.check.partner_name}</span>
                  <span className="text-xs text-gray-400">{alert.check.check_type === 'received' ? 'Recibido' : 'Emitido'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{new Date(alert.check.payment_date).toLocaleDateString('es-PY')}</span>
                  <span className="font-mono font-bold text-red-700">{fmtMoney(alert.check.amount, alert.check.currency)}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('alerts')} className="mt-2 text-sm text-red-700 hover:text-red-900 flex items-center gap-1">Ver todas las alertas <ChevronRight size={14} /></button>
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Landmark size={16} className="opacity-70" /><span className="text-xs opacity-80">Saldo Total PYG</span></div>
          <p className="text-2xl font-bold">{fmtPYG(data.total_balance_pyg)}</p>
          <p className="text-xs opacity-70 mt-1">{data.accounts.filter(a => a.currency === 'PYG').length} cuentas</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={16} className="opacity-70" /><span className="text-xs opacity-80">Saldo Total USD</span></div>
          <p className="text-2xl font-bold">{fmtUSD(data.total_balance_usd)}</p>
          <p className="text-xs opacity-70 mt-1">{data.accounts.filter(a => a.currency === 'USD').length} cuentas</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 text-white cursor-pointer hover:opacity-90" onClick={() => onNavigate('checks_received')}>
          <div className="flex items-center gap-2 mb-1"><ArrowDownRight size={16} className="opacity-70" /><span className="text-xs opacity-80">Cheques en Cartera</span></div>
          <p className="text-2xl font-bold">{fmtPYG(data.checks_received_portfolio)}</p>
          <p className="text-xs opacity-70 mt-1">{data.checks_received_count} cheques recibidos</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 text-white cursor-pointer hover:opacity-90" onClick={() => onNavigate('checks_issued')}>
          <div className="flex items-center gap-2 mb-1"><ArrowUpRight size={16} className="opacity-70" /><span className="text-xs opacity-80">Cheques Emitidos</span></div>
          <p className="text-2xl font-bold">{fmtPYG(data.checks_issued_pending)}</p>
          <p className="text-xs opacity-70 mt-1">{data.checks_issued_count} cheques pendientes</p>
        </div>
      </div>

      {/* Saldo proyectado */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-500" /> Proyección a 30 días (PYG)</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500">Saldo Actual</p><p className="text-lg font-bold text-blue-700">{fmtPYG(data.total_balance_pyg)}</p></div>
          <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-xs text-gray-500">+ Cheques a Cobrar</p><p className="text-lg font-bold text-green-600">+{fmtPYG(data.checks_to_receive_30d)}</p></div>
          <div className="text-center p-3 bg-red-50 rounded-lg"><p className="text-xs text-gray-500">- Cheques a Pagar</p><p className="text-lg font-bold text-red-600">-{fmtPYG(data.checks_to_pay_30d)}</p></div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg border-2 border-indigo-200"><p className="text-xs text-gray-500">Saldo Proyectado</p><p className={`text-lg font-bold ${data.projected_balance_30d >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{fmtPYG(data.projected_balance_30d)}</p></div>
        </div>
        {data.projected_balance_30d < 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"><AlertTriangle size={14} /> El saldo proyectado es negativo. Revise los cheques emitidos pendientes.</div>
        )}
      </div>

      {/* Cuentas bancarias */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b"><h3 className="font-semibold text-gray-800">Cuentas Bancarias</h3></div>
        <div className="divide-y">
          {data.accounts.map(acc => (
            <div key={acc.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${acc.currency === 'USD' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  <Building2 size={18} className={acc.currency === 'USD' ? 'text-green-600' : 'text-blue-600'} />
                </div>
                <div>
                  <p className="font-medium text-sm">{acc.name}</p>
                  <p className="text-xs text-gray-400">{acc.bank_name} | {acc.account_number} | {acc.account_type === 'corriente' ? 'Cta. Cte.' : 'Caja Ahorro'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-lg">{fmtMoney(acc.current_balance, acc.currency)}</p>
                <p className="text-xs text-gray-400">{acc.currency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos movimientos */}
      {data.recent_movements.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Últimos Movimientos</h3>
            <button onClick={() => onNavigate('movements')} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">Ver todos <ChevronRight size={14} /></button>
          </div>
          <div className="divide-y">
            {data.recent_movements.slice(0, 8).map(mov => (
              <div key={mov.id} className="px-5 py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mov.type === 'ingreso' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {mov.type === 'ingreso' ? <ArrowDownRight size={14} className="text-green-600" /> : <ArrowUpRight size={14} className="text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{mov.description}</p>
                    <p className="text-xs text-gray-400">{new Date(mov.date).toLocaleDateString('es-PY')} | {MOVEMENT_CATEGORY_LABELS[mov.category]}</p>
                  </div>
                </div>
                <span className={`font-mono font-medium ${mov.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>{mov.type === 'ingreso' ? '+' : '-'}{fmtPYG(mov.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== MOVIMIENTOS ====================
function BankMovementsTab({ accounts, onRefresh }: { accounts: BankAccountDetail[]; onRefresh: () => void }) {
  const [selectedAccount, setSelectedAccount] = useState('')
  const [showNewMovement, setShowNewMovement] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const movements = useMemo(() => accountingService.getBankMovements(selectedAccount || undefined), [selectedAccount, refreshKey])
  const refresh = () => { setRefreshKey(r => r + 1); onRefresh() }

  const totalIn = movements.filter(m => m.type === 'ingreso').reduce((s, m) => s + m.amount, 0)
  const totalOut = movements.filter(m => m.type === 'egreso').reduce((s, m) => s + m.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Todas las cuentas</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
          </select>
        </div>
        <button onClick={() => setShowNewMovement(true)} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Nuevo Movimiento</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-xs text-gray-500">Movimientos</p><p className="text-xl font-bold">{movements.length}</p></div>
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-xs text-gray-500">Ingresos</p><p className="text-xl font-bold text-green-600">+{fmtPYG(totalIn)}</p></div>
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-xs text-gray-500">Egresos</p><p className="text-xl font-bold text-red-600">-{fmtPYG(totalOut)}</p></div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="text-left px-3 py-2">Fecha</th><th className="text-left px-3 py-2">Descripción</th><th className="text-center px-3 py-2">Categoría</th><th className="text-left px-3 py-2">Contraparte</th><th className="text-right px-3 py-2">Monto</th><th className="text-right px-3 py-2">Saldo</th><th className="text-center px-3 py-2">Conc.</th></tr></thead>
          <tbody>
            {movements.map(mov => (
              <tr key={mov.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-xs">{new Date(mov.date).toLocaleDateString('es-PY')}</td>
                <td className="px-3 py-2">{mov.description}{mov.reference && <span className="text-xs text-gray-400 ml-1">({mov.reference})</span>}</td>
                <td className="px-3 py-2 text-center"><span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{MOVEMENT_CATEGORY_LABELS[mov.category]}</span></td>
                <td className="px-3 py-2 text-xs text-gray-600">{mov.partner_name || '-'}</td>
                <td className={`px-3 py-2 text-right font-mono font-medium ${mov.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>{mov.type === 'ingreso' ? '+' : '-'}{fmtPYG(mov.amount)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{fmtPYG(mov.balance_after)}</td>
                <td className="px-3 py-2 text-center">{mov.reconciled ? <CheckCircle size={14} className="text-green-500 mx-auto" /> : <span className="text-gray-300">-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {movements.length === 0 && <p className="text-center py-12 text-gray-400">No hay movimientos registrados</p>}
      </div>

      {showNewMovement && <NewMovementModal accounts={accounts} onClose={() => setShowNewMovement(false)} onSave={() => { refresh(); setShowNewMovement(false) }} />}
    </div>
  )
}

function NewMovementModal({ accounts, onClose, onSave }: { accounts: BankAccountDetail[]; onClose: () => void; onSave: () => void }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<'ingreso' | 'egreso'>('ingreso')
  const [category, setCategory] = useState('deposito')
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [partnerName, setPartnerName] = useState('')

  const handleSave = () => {
    if (!accountId || amount <= 0 || !description) return
    accountingService.createBankMovement({ bank_account_id: accountId, date, type, category: category as any, amount, description, reference, partner_name: partnerName, reconciled: false })
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Nuevo Movimiento Bancario</h3><button onClick={onClose}><X size={20} /></button></div>
        <div className="space-y-3">
          <div><label className="text-sm font-medium block mb-1">Cuenta *</label><select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Fecha</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Tipo *</label>
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => setType('ingreso')} className={`py-2 rounded-lg text-sm font-medium ${type === 'ingreso' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Ingreso</button>
                <button onClick={() => setType('egreso')} className={`py-2 rounded-lg text-sm font-medium ${type === 'egreso' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>Egreso</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                {Object.entries(MOVEMENT_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium block mb-1">Monto *</label><input type="number" min={0} value={amount || ''} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div><label className="text-sm font-medium block mb-1">Descripción *</label><input value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">Referencia</label><input value={reference} onChange={e => setReference(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Contraparte</label><input value={partnerName} onChange={e => setPartnerName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={!accountId || amount <= 0 || !description} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-40"><Save size={14} /> Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ==================== CHEQUES DIFERIDOS ====================
function DeferredChecksTab({ type, accounts, onRefresh }: { type: 'received' | 'issued'; accounts: BankAccountDetail[]; onRefresh: () => void }) {
  const [showNew, setShowNew] = useState(false)
  const [selectedCheck, setSelectedCheck] = useState<DeferredCheck | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const checks = useMemo(() => {
    let result = accountingService.getDeferredChecks(type)
    if (filterStatus) result = result.filter(c => c.status === filterStatus)
    if (searchTerm) result = result.filter(c => c.check_number.includes(searchTerm) || c.partner_name.toLowerCase().includes(searchTerm.toLowerCase()))
    return result
  }, [type, filterStatus, searchTerm, refreshKey])

  const refresh = () => { setRefreshKey(r => r + 1); onRefresh() }

  const today = new Date().toISOString().split('T')[0]
  const isReceived = type === 'received'
  const title = isReceived ? 'Cheques Diferidos Recibidos' : 'Cheques Diferidos Emitidos'

  const totalPortfolio = checks.filter(c => isReceived ? ['en_cartera', 'depositado'].includes(c.status) : ['emitido', 'entregado'].includes(c.status)).reduce((s, c) => s + c.amount, 0)
  const totalCollected = checks.filter(c => c.status === 'cobrado').reduce((s, c) => s + c.amount, 0)
  const totalRejected = checks.filter(c => c.status === 'rechazado').reduce((s, c) => s + c.amount, 0)
  const overdueCount = checks.filter(c => c.payment_date < today && !['cobrado', 'rechazado', 'anulado', 'endosado'].includes(c.status)).length

  const handleStatusChange = (checkId: string, newStatus: DeferredCheckStatus) => {
    const notes = prompt('Observación (opcional):') || ''
    accountingService.updateDeferredCheckStatus(checkId, newStatus, notes)
    refresh()
  }

  const statusOptions = isReceived
    ? ['en_cartera', 'depositado', 'cobrado', 'rechazado', 'endosado', 'anulado']
    : ['emitido', 'entregado', 'cobrado', 'rechazado', 'anulado']

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-gray-400" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" /></div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Todos los estados</option>
            {statusOptions.map(s => <option key={s} value={s}>{CHECK_STATUS_LABELS[s as DeferredCheckStatus]}</option>)}
          </select>
        </div>
        <button onClick={() => setShowNew(true)} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Nuevo Cheque</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-xs text-gray-500">{isReceived ? 'En Cartera' : 'Pendientes'}</p><p className="text-lg font-bold text-blue-600">{fmtPYG(totalPortfolio)}</p></div>
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-xs text-gray-500">Cobrados</p><p className="text-lg font-bold text-green-600">{fmtPYG(totalCollected)}</p></div>
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-xs text-gray-500">Rechazados</p><p className="text-lg font-bold text-red-600">{fmtPYG(totalRejected)}</p></div>
        <div className="bg-white rounded-lg border p-3 text-center"><p className="text-xs text-gray-500">Vencidos</p><p className={`text-lg font-bold ${overdueCount > 0 ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>{overdueCount}</p></div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-3 py-2">N° Cheque</th>
            <th className="text-left px-3 py-2">Banco</th>
            <th className="text-left px-3 py-2">{isReceived ? 'Librador' : 'Beneficiario'}</th>
            <th className="text-center px-3 py-2">Emisión</th>
            <th className="text-center px-3 py-2">Vencimiento</th>
            <th className="text-center px-3 py-2">Estado</th>
            <th className="text-right px-3 py-2">Monto</th>
            <th className="text-center px-3 py-2">Acciones</th>
          </tr></thead>
          <tbody>
            {checks.map(chk => {
              const isOverdue = chk.payment_date < today && !['cobrado', 'rechazado', 'anulado', 'endosado'].includes(chk.status)
              const daysToPayment = Math.floor((new Date(chk.payment_date).getTime() - new Date(today).getTime()) / 86400000)
              return (
                <tr key={chk.id} className={`border-t hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                  <td className="px-3 py-2 font-mono font-medium text-blue-600 cursor-pointer" onClick={() => setSelectedCheck(chk)}>#{chk.check_number}</td>
                  <td className="px-3 py-2 text-xs">{chk.bank_name}</td>
                  <td className="px-3 py-2"><span className="text-sm">{chk.partner_name}</span>{chk.partner_tax_id && <span className="text-xs text-gray-400 ml-1">{chk.partner_tax_id}</span>}</td>
                  <td className="px-3 py-2 text-center text-xs">{new Date(chk.issue_date).toLocaleDateString('es-PY')}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-xs">{new Date(chk.payment_date).toLocaleDateString('es-PY')}</span>
                    {isOverdue && <span className="block text-[10px] text-red-600 font-bold">VENCIDO {Math.abs(daysToPayment)}d</span>}
                    {daysToPayment >= 0 && daysToPayment <= 3 && !isOverdue && <span className="block text-[10px] text-orange-600 font-bold">{daysToPayment === 0 ? 'HOY' : `${daysToPayment}d`}</span>}
                  </td>
                  <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CHECK_STATUS_COLORS[chk.status]}`}>{CHECK_STATUS_LABELS[chk.status]}</span></td>
                  <td className="px-3 py-2 text-right font-mono font-medium">{fmtMoney(chk.amount, chk.currency)}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => setSelectedCheck(chk)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Ver detalle"><Eye size={14} /></button>
                      {isReceived && chk.status === 'en_cartera' && (
                        <>
                          <button onClick={() => handleStatusChange(chk.id, 'depositado')} className="p-1 text-purple-500 hover:bg-purple-50 rounded" title="Depositar"><ArrowDownRight size={14} /></button>
                          <button onClick={() => handleStatusChange(chk.id, 'endosado')} className="p-1 text-amber-500 hover:bg-amber-50 rounded" title="Endosar"><Send size={14} /></button>
                        </>
                      )}
                      {isReceived && chk.status === 'depositado' && (
                        <>
                          <button onClick={() => handleStatusChange(chk.id, 'cobrado')} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Cobrado"><CheckCircle size={14} /></button>
                          <button onClick={() => handleStatusChange(chk.id, 'rechazado')} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Rechazado"><XCircle size={14} /></button>
                        </>
                      )}
                      {!isReceived && chk.status === 'emitido' && <button onClick={() => handleStatusChange(chk.id, 'entregado')} className="p-1 text-orange-500 hover:bg-orange-50 rounded" title="Entregado"><Send size={14} /></button>}
                      {!isReceived && chk.status === 'entregado' && <button onClick={() => handleStatusChange(chk.id, 'cobrado')} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Cobrado/Debitado"><CheckCircle size={14} /></button>}
                      {!['cobrado', 'rechazado', 'anulado', 'endosado'].includes(chk.status) && <button onClick={() => handleStatusChange(chk.id, 'anulado')} className="p-1 text-gray-400 hover:bg-gray-50 rounded" title="Anular"><Ban size={14} /></button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {checks.length === 0 && <p className="text-center py-12 text-gray-400">No hay cheques {isReceived ? 'recibidos' : 'emitidos'}</p>}
      </div>

      {showNew && <NewDeferredCheckModal type={type} accounts={accounts} onClose={() => setShowNew(false)} onSave={() => { refresh(); setShowNew(false) }} />}
      {selectedCheck && <CheckDetailModal check={selectedCheck} onClose={() => setSelectedCheck(null)} />}
    </div>
  )
}

function NewDeferredCheckModal({ type, accounts, onClose, onSave }: { type: 'received' | 'issued'; accounts: BankAccountDetail[]; onClose: () => void; onSave: () => void }) {
  const isReceived = type === 'received'
  const [checkNumber, setCheckNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountId, setAccountId] = useState(accounts.find(a => a.currency === 'PYG')?.id || accounts[0]?.id || '')
  const [depositAccountId, setDepositAccountId] = useState(accounts.find(a => a.currency === 'PYG')?.id || '')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentDate, setPaymentDate] = useState('')
  const [amount, setAmount] = useState(0)
  const [currency, setCurrency] = useState<'PYG' | 'USD'>('PYG')
  const [partnerName, setPartnerName] = useState('')
  const [partnerTaxId, setPartnerTaxId] = useState('')
  const [notes, setNotes] = useState('')
  const [destinationType, setDestinationType] = useState<CheckDestinationType | ''>('')
  const [destinationName, setDestinationName] = useState('')
  const [destinationDetail, setDestinationDetail] = useState('')
  const [relatedDocType, setRelatedDocType] = useState<string>('')
  const [relatedDocNumber, setRelatedDocNumber] = useState('')

  const handleSave = () => {
    if (!checkNumber || !bankName || !paymentDate || amount <= 0 || !partnerName) return
    accountingService.createDeferredCheck({
      check_type: type, check_number: checkNumber, bank_name: bankName,
      bank_account_id: accountId, deposit_account_id: isReceived ? depositAccountId : undefined,
      issue_date: issueDate, payment_date: paymentDate, amount, currency,
      partner_name: partnerName, partner_tax_id: partnerTaxId,
      status: isReceived ? 'en_cartera' : 'emitido', notes,
      destination_type: destinationType || undefined,
      destination_name: destinationName || undefined,
      destination_detail: destinationDetail || undefined,
      related_document_type: relatedDocType as any || undefined,
      related_document_number: relatedDocNumber || undefined,
    })
    onSave()
  }

  const commonBanks = ['Banco Itaú', 'Banco Continental', 'Banco Regional', 'Banco GNB', 'Banco Atlas', 'Banco Familiar', 'Sudameris', 'BBVA', 'Banco Nacional de Fomento', 'Visión Banco']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{isReceived ? 'Nuevo Cheque Recibido' : 'Nuevo Cheque Emitido'}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">N° Cheque *</label><input value={checkNumber} onChange={e => setCheckNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0001234567" /></div>
            <div><label className="text-sm font-medium block mb-1">Banco {isReceived ? 'Librador' : ''} *</label>
              <select value={bankName} onChange={e => setBankName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Seleccionar...</option>
                {commonBanks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1">{isReceived ? 'Librador (quien emite)' : 'Beneficiario'} *</label><input value={partnerName} onChange={e => setPartnerName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">RUC / CI</label><input value={partnerTaxId} onChange={e => setPartnerTaxId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium block mb-1">Fecha Emisión</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Fecha Cobro *</label><input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1">Moneda</label>
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => setCurrency('PYG')} className={`py-2 rounded-lg text-xs font-medium ${currency === 'PYG' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>PYG</button>
                <button onClick={() => setCurrency('USD')} className={`py-2 rounded-lg text-xs font-medium ${currency === 'USD' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>USD</button>
              </div>
            </div>
          </div>
          <div><label className="text-sm font-medium block mb-1">Monto *</label><input type="number" min={0} value={amount || ''} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg text-sm text-lg font-mono" /></div>
          {isReceived && (
            <div><label className="text-sm font-medium block mb-1">Cuenta para Depositar</label><select value={depositAccountId} onChange={e => setDepositAccountId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          )}
          {!isReceived && (
            <div><label className="text-sm font-medium block mb-1">Cuenta Origen</label><select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          )}
          {/* Destino / Uso */}
          <div className="border-t pt-3 mt-2">
            <p className="text-sm font-semibold text-indigo-700 mb-2 flex items-center gap-1"><ArrowRight size={14} />Destino / Uso del Cheque</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium block mb-1">Tipo Destino</label>
                <select value={destinationType} onChange={e => setDestinationType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Sin especificar</option>
                  {Object.entries(CHECK_DESTINATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium block mb-1">Destinatario</label><input value={destinationName} onChange={e => setDestinationName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nombre del destinatario" /></div>
            </div>
            {destinationType && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div><label className="text-sm font-medium block mb-1">Doc. Relacionado</label>
                  <div className="flex gap-1">
                    <select value={relatedDocType} onChange={e => setRelatedDocType(e.target.value)} className="px-2 py-2 border rounded-lg text-xs w-24">
                      <option value="">Tipo</option>
                      <option value="factura">Factura</option>
                      <option value="compra">Compra</option>
                      <option value="gasto">Gasto</option>
                      <option value="presupuesto">Presupuesto</option>
                      <option value="remision">Remisión</option>
                      <option value="otro">Otro</option>
                    </select>
                    <input value={relatedDocNumber} onChange={e => setRelatedDocNumber(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="N° Doc" />
                  </div>
                </div>
                <div><label className="text-sm font-medium block mb-1">Detalle</label><input value={destinationDetail} onChange={e => setDestinationDetail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Concepto / detalle" /></div>
              </div>
            )}
          </div>
          <div><label className="text-sm font-medium block mb-1">Observaciones</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={!checkNumber || !bankName || !paymentDate || amount <= 0 || !partnerName} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-40 flex items-center gap-1"><Save size={14} /> Guardar</button>
        </div>
      </div>
    </div>
  )
}

function CheckDetailModal({ check, onClose }: { check: DeferredCheck; onClose: () => void }) {
  const today = new Date().toISOString().split('T')[0]
  const daysToPayment = Math.floor((new Date(check.payment_date).getTime() - new Date(today).getTime()) / 86400000)
  const isOverdue = daysToPayment < 0 && !['cobrado', 'rechazado', 'anulado', 'endosado'].includes(check.status)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold">Cheque #{check.check_number}</h3>
            <p className="text-sm text-gray-500">{check.check_type === 'received' ? 'Recibido' : 'Emitido'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${CHECK_STATUS_COLORS[check.status]}`}>{CHECK_STATUS_LABELS[check.status]}</span>
            <button onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {isOverdue && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2 mb-4 animate-pulse"><AlertOctagon size={16} /> VENCIDO hace {Math.abs(daysToPayment)} días</div>}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 text-xs">Banco</p><p className="font-medium">{check.bank_name}</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 text-xs">{check.check_type === 'received' ? 'Librador' : 'Beneficiario'}</p><p className="font-medium">{check.partner_name}</p>{check.partner_tax_id && <p className="text-xs text-gray-400">{check.partner_tax_id}</p>}</div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 text-xs">Emisión</p><p className="font-medium">{new Date(check.issue_date).toLocaleDateString('es-PY')}</p></div>
            <div className={`p-3 rounded-lg ${isOverdue ? 'bg-red-50' : daysToPayment <= 3 ? 'bg-orange-50' : 'bg-gray-50'}`}><p className="text-gray-500 text-xs">Vencimiento</p><p className="font-medium">{new Date(check.payment_date).toLocaleDateString('es-PY')}</p>{daysToPayment > 0 && <p className="text-xs text-gray-500">{daysToPayment} días restantes</p>}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center"><p className="text-xs text-gray-500">Monto</p><p className="text-2xl font-bold text-blue-800">{fmtMoney(check.amount, check.currency)}</p></div>
          {check.notes && <div className="text-sm"><p className="text-gray-500 text-xs">Observaciones</p><p>{check.notes}</p></div>}
          {check.endorsed_to && <div className="text-sm"><p className="text-gray-500 text-xs">Endosado a</p><p className="font-medium">{check.endorsed_to}</p></div>}
          {check.rejection_reason && <div className="text-sm bg-red-50 p-3 rounded-lg"><p className="text-red-500 text-xs">Motivo de Rechazo</p><p className="text-red-700">{check.rejection_reason}</p></div>}

          <div>
            <p className="text-sm font-medium mb-2">Historial</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {check.status_history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CHECK_STATUS_COLORS[h.status]}`}>{CHECK_STATUS_LABELS[h.status]}</span>
                  <span className="text-gray-500">{new Date(h.date).toLocaleString('es-PY')}</span>
                  {h.notes && <span className="text-gray-600 italic">{h.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4"><button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cerrar</button></div>
      </div>
    </div>
  )
}

// ==================== ALERTAS ====================
function AlertsTab({ alerts, onRefresh }: { alerts: CheckAlert[]; onRefresh: () => void }) {
  const alertGroups = {
    overdue: alerts.filter(a => a.alert_type === 'overdue'),
    today: alerts.filter(a => a.alert_type === 'today'),
    '3days': alerts.filter(a => a.alert_type === '3days'),
    '7days': alerts.filter(a => a.alert_type === '7days'),
  }

  const handleAction = (checkId: string, status: DeferredCheckStatus) => {
    const notes = prompt('Observación:') || ''
    accountingService.updateDeferredCheckStatus(checkId, status, notes)
    onRefresh()
  }

  const renderAlertGroup = (title: string, icon: React.ReactNode, alertList: CheckAlert[], bgColor: string, borderColor: string) => {
    if (alertList.length === 0) return null
    return (
      <div className={`${bgColor} rounded-xl border ${borderColor} p-4`}>
        <div className="flex items-center gap-2 mb-3">{icon}<h3 className="font-bold">{title}</h3><span className="px-2 py-0.5 bg-white/50 rounded-full text-xs font-bold">{alertList.length}</span></div>
        <div className="space-y-2">
          {alertList.map(alert => (
            <div key={alert.check.id} className="bg-white rounded-lg p-3 border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center w-12"><p className="font-mono font-bold text-lg">{Math.abs(alert.days_remaining)}</p><p className="text-[10px] text-gray-500">{alert.days_remaining < 0 ? 'días atrás' : alert.days_remaining === 0 ? 'HOY' : 'días'}</p></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-blue-600">#{alert.check.check_number}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${alert.check.check_type === 'received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{alert.check.check_type === 'received' ? 'Recibido' : 'Emitido'}</span>
                  </div>
                  <p className="text-sm">{alert.check.partner_name} - {alert.check.bank_name}</p>
                  <p className="text-xs text-gray-500">Vence: {new Date(alert.check.payment_date).toLocaleDateString('es-PY')}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <p className="font-mono font-bold text-lg">{fmtMoney(alert.check.amount, alert.check.currency)}</p>
                <div className="flex flex-col gap-1">
                  {alert.check.check_type === 'received' && alert.check.status === 'en_cartera' && (
                    <button onClick={() => handleAction(alert.check.id, 'depositado')} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200">Depositar</button>
                  )}
                  {alert.check.check_type === 'received' && alert.check.status === 'depositado' && (
                    <button onClick={() => handleAction(alert.check.id, 'cobrado')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Marcar Cobrado</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Centro de Alertas - Cheques Diferidos</h3>
        <button onClick={onRefresh} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1"><RefreshCw size={14} /> Actualizar</button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-green-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Sin alertas pendientes</h3>
          <p className="text-sm text-gray-400">No hay cheques por vencer en los próximos 7 días</p>
        </div>
      ) : (
        <>
          {renderAlertGroup('VENCIDOS - Acción Inmediata', <AlertOctagon size={20} className="text-red-700" />, alertGroups.overdue, 'bg-red-50', 'border-red-300')}
          {renderAlertGroup('Vencen HOY', <AlertTriangle size={20} className="text-orange-700" />, alertGroups.today, 'bg-orange-50', 'border-orange-300')}
          {renderAlertGroup('Próximos 3 días', <Clock size={20} className="text-yellow-700" />, alertGroups['3days'], 'bg-yellow-50', 'border-yellow-300')}
          {renderAlertGroup('Próximos 7 días', <Calendar size={20} className="text-blue-700" />, alertGroups['7days'], 'bg-blue-50', 'border-blue-200')}
        </>
      )}
    </div>
  )
}

// ==================== TAB: CHEQUES VENCIDOS ====================

function ExpiredChecksTab({ onRefresh }: { onRefresh: () => void }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'received' | 'issued'>('all')
  const [filterManaged, setFilterManaged] = useState<'all' | 'managed' | 'unmanaged'>('all')
  const [selectedCheck, setSelectedCheck] = useState<DeferredCheck | null>(null)
  const [showManageModal, setShowManageModal] = useState(false)
  const [refreshLocal, setRefreshLocal] = useState(0)

  const expiredChecks = useMemo(() => accountingService.getExpiredChecks({
    type: filterType === 'all' ? undefined : filterType,
    managed: filterManaged === 'all' ? undefined : filterManaged === 'managed',
    search: search || undefined,
  }), [filterType, filterManaged, search, refreshLocal])

  const analytics = useMemo(() => accountingService.getExpiredCheckAnalytics(), [refreshLocal])

  const today = new Date().toISOString().split('T')[0]
  const getDaysOverdue = (paymentDate: string) => Math.floor((new Date(today).getTime() - new Date(paymentDate).getTime()) / 86400000)

  const getAgingColor = (days: number) => {
    if (days <= 7) return 'bg-yellow-100 text-yellow-800'
    if (days <= 30) return 'bg-orange-100 text-orange-800'
    if (days <= 60) return 'bg-red-100 text-red-700'
    return 'bg-red-200 text-red-900 font-bold'
  }

  const handleManage = (check: DeferredCheck) => {
    setSelectedCheck(check)
    setShowManageModal(true)
  }

  const localRefresh = () => { setRefreshLocal(r => r + 1); onRefresh() }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border-2 border-red-200 p-4">
          <div className="text-xs text-red-500 font-medium mb-1 flex items-center gap-1"><AlertOctagon size={12} />Total Vencidos</div>
          <div className="text-2xl font-bold text-red-700">{analytics.total_expired}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-500 mb-1">Monto PYG</div>
          <div className="text-xl font-bold text-gray-800">{fmtPYG(analytics.total_amount_pyg)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs text-gray-500 mb-1">Monto USD</div>
          <div className="text-xl font-bold text-gray-800">{analytics.total_amount_usd > 0 ? fmtUSD(analytics.total_amount_usd) : '-'}</div>
        </div>
        <div className="bg-white rounded-xl border-2 border-green-200 p-4">
          <div className="text-xs text-green-600 mb-1 flex items-center gap-1"><CheckCircle size={12} />Gestionados</div>
          <div className="text-2xl font-bold text-green-700">{analytics.managed_count}</div>
        </div>
        <div className="bg-white rounded-xl border-2 border-orange-200 p-4">
          <div className="text-xs text-orange-600 mb-1 flex items-center gap-1"><AlertTriangle size={12} />Sin Gestionar</div>
          <div className="text-2xl font-bold text-orange-700">{analytics.unmanaged_count}</div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-3 gap-4">
        {/* Aging */}
        <div className="bg-white rounded-xl border p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock size={14} />Antigüedad (Aging)</h4>
          <div className="space-y-2">
            {analytics.by_aging.filter(a => a.count > 0).map(a => (
              <div key={a.range} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{a.range}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, (a.count / Math.max(analytics.total_expired, 1)) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-mono font-medium w-16 text-right">{fmtPYG(a.amount)}</span>
                  <span className="text-[10px] text-gray-400 w-4">({a.count})</span>
                </div>
              </div>
            ))}
            {analytics.by_aging.every(a => a.count === 0) && <p className="text-xs text-gray-400 text-center py-2">Sin cheques vencidos</p>}
          </div>
        </div>

        {/* Por Destino */}
        <div className="bg-white rounded-xl border p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><ArrowRight size={14} />Por Destino/Uso</h4>
          <div className="space-y-2">
            {analytics.by_destination.map(d => (
              <div key={d.destination} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 truncate max-w-[120px]">{d.destination}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium">{fmtPYG(d.amount)}</span>
                  <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{d.count}</span>
                </div>
              </div>
            ))}
            {analytics.by_destination.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Sin datos</p>}
          </div>
        </div>

        {/* Por Banco */}
        <div className="bg-white rounded-xl border p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Landmark size={14} />Por Banco Emisor</h4>
          <div className="space-y-2">
            {analytics.by_bank.map(b => (
              <div key={b.bank} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 truncate max-w-[120px]">{b.bank}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium">{fmtPYG(b.amount)}</span>
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{b.count}</span>
                </div>
              </div>
            ))}
            {analytics.by_bank.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Sin datos</p>}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border p-4 flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por N° cheque, librador, banco, destino..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Todos los tipos</option>
          <option value="received">Recibidos</option>
          <option value="issued">Emitidos</option>
        </select>
        <select value={filterManaged} onChange={e => setFilterManaged(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Todos los estados</option>
          <option value="unmanaged">Sin gestionar</option>
          <option value="managed">Gestionados</option>
        </select>
        <button onClick={localRefresh} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1"><RefreshCw size={14} />Actualizar</button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-red-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">N° Cheque</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Librador / Beneficiario</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Banco</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Destino/Uso</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Vencimiento</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Días</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Monto</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Gestión</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {expiredChecks.map(chk => {
              const daysOverdue = getDaysOverdue(chk.payment_date)
              return (
                <tr key={chk.id} className={`hover:bg-gray-50 ${chk.expired_managed ? 'bg-green-50/30' : 'bg-red-50/20'}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => { setShowManageModal(false); setSelectedCheck(chk) }} className="font-mono text-blue-600 hover:underline font-medium">#{chk.check_number}</button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${chk.check_type === 'received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {chk.check_type === 'received' ? 'Recibido' : 'Emitido'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{chk.partner_name}</div>
                    {chk.partner_tax_id && <div className="text-[10px] text-gray-400">{chk.partner_tax_id}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{chk.bank_name}</td>
                  <td className="px-4 py-3">
                    {chk.destination_type ? (
                      <div>
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium">{CHECK_DESTINATION_LABELS[chk.destination_type]}</span>
                        {chk.destination_name && <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[150px]">{chk.destination_name}</div>}
                      </div>
                    ) : <span className="text-[10px] text-gray-400 italic">No especificado</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{new Date(chk.payment_date).toLocaleDateString('es-PY')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getAgingColor(daysOverdue)}`}>{daysOverdue}d</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{fmtMoney(chk.amount, chk.currency)}</td>
                  <td className="px-4 py-3 text-center">
                    {chk.expired_managed ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-[9px] text-green-600 mt-0.5">Gestionado</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <AlertTriangle size={16} className="text-orange-500" />
                        <span className="text-[9px] text-orange-600 mt-0.5">Pendiente</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setShowManageModal(false); setSelectedCheck(chk) }} className="p-1.5 hover:bg-blue-50 rounded" title="Ver detalle"><Eye size={14} className="text-blue-500" /></button>
                      {!chk.expired_managed && (
                        <button onClick={() => handleManage(chk)} className="p-1.5 hover:bg-green-50 rounded" title="Gestionar"><Check size={14} className="text-green-500" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {expiredChecks.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600">Sin cheques vencidos</h3>
            <p className="text-sm text-gray-400 mt-1">Todos los cheques están al día</p>
          </div>
        )}
      </div>

      {/* Por Librador/Beneficiario */}
      {analytics.by_partner.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Vencidos por Librador / Beneficiario</h4>
          <div className="grid grid-cols-3 gap-3">
            {analytics.by_partner.map(p => (
              <div key={p.partner} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-700 truncate max-w-[180px] font-medium">{p.partner}</span>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-red-700">{fmtPYG(p.amount)}</span>
                  <span className="text-[10px] text-gray-400 ml-1">({p.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {selectedCheck && !showManageModal && (
        <ExpiredCheckDetailModal check={selectedCheck} onClose={() => setSelectedCheck(null)} onManage={() => { setShowManageModal(true) }} />
      )}

      {/* Modal gestionar */}
      {selectedCheck && showManageModal && (
        <ManageExpiredCheckModal check={selectedCheck} onClose={() => { setShowManageModal(false); setSelectedCheck(null) }} onSaved={localRefresh} />
      )}
    </div>
  )
}

// ==================== MODAL: DETALLE CHEQUE VENCIDO ====================

function ExpiredCheckDetailModal({ check, onClose, onManage }: { check: DeferredCheck; onClose: () => void; onManage: () => void }) {
  const today = new Date().toISOString().split('T')[0]
  const daysOverdue = Math.floor((new Date(today).getTime() - new Date(check.payment_date).getTime()) / 86400000)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b bg-red-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-red-800 flex items-center gap-2"><AlertOctagon size={18} />Cheque Vencido #{check.check_number}</h3>
            <p className="text-xs text-red-600 mt-0.5">{daysOverdue} días de vencimiento</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-red-100 rounded"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div><span className="text-xs text-gray-500 block">Tipo</span><span className="font-medium">{check.check_type === 'received' ? 'Cheque Recibido' : 'Cheque Emitido'}</span></div>
              <div><span className="text-xs text-gray-500 block">Banco Emisor</span><span className="font-medium">{check.bank_name}</span></div>
              <div><span className="text-xs text-gray-500 block">{check.check_type === 'received' ? 'Librador' : 'Beneficiario'}</span><span className="font-medium">{check.partner_name}</span>{check.partner_tax_id && <span className="text-xs text-gray-400 ml-1">{check.partner_tax_id}</span>}</div>
              <div><span className="text-xs text-gray-500 block">Fecha Emisión</span><span>{new Date(check.issue_date).toLocaleDateString('es-PY')}</span></div>
              <div><span className="text-xs text-gray-500 block">Fecha Vencimiento</span><span className="text-red-700 font-bold">{new Date(check.payment_date).toLocaleDateString('es-PY')}</span></div>
            </div>
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <span className="text-xs text-red-500 block mb-1">Monto</span>
                <span className="text-2xl font-bold text-red-800">{fmtMoney(check.amount, check.currency)}</span>
                <div className="mt-2"><span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-bold">{daysOverdue} días vencido</span></div>
              </div>
              {check.expired_managed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-green-700 text-xs font-medium mb-1"><CheckCircle size={12} />Gestionado</div>
                  <p className="text-xs text-gray-700">{check.expired_managed_action}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Por: {check.expired_managed_by} · {check.expired_managed_date ? new Date(check.expired_managed_date).toLocaleDateString('es-PY') : ''}</p>
                </div>
              )}
            </div>
          </div>

          {/* Destino / Uso */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-1"><ArrowRight size={14} />Destino / Uso del Cheque</h4>
            {check.destination_type ? (
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-xs text-gray-500 block">Tipo de Destino</span><span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">{CHECK_DESTINATION_LABELS[check.destination_type]}</span></div>
                {check.destination_name && <div><span className="text-xs text-gray-500 block">Destinatario</span><span className="font-medium text-sm">{check.destination_name}</span></div>}
                {check.destination_detail && <div className="col-span-2"><span className="text-xs text-gray-500 block">Detalle</span><span className="text-sm">{check.destination_detail}</span></div>}
                {check.related_document_number && (
                  <div className="col-span-2"><span className="text-xs text-gray-500 block">Documento Relacionado</span>
                    <span className="text-sm font-mono bg-white px-2 py-0.5 rounded border">{check.related_document_type?.toUpperCase()} · {check.related_document_number}</span>
                  </div>
                )}
                {check.endorsed_to && <div><span className="text-xs text-gray-500 block">Endosado a</span><span className="font-medium text-sm">{check.endorsed_to}</span>{check.endorsed_to_tax_id && <span className="text-xs text-gray-400 ml-1">{check.endorsed_to_tax_id}</span>}</div>}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No se especificó destino para este cheque</p>
            )}
          </div>

          {check.notes && (
            <div><span className="text-xs text-gray-500 block mb-1">Notas</span><p className="text-sm bg-gray-50 p-3 rounded-lg">{check.notes}</p></div>
          )}

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Historial de Estados</h4>
            <div className="space-y-0">
              {check.status_history.map((h, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${i === check.status_history.length - 1 ? 'bg-red-500 border-red-600' : 'bg-white border-gray-300'}`} />
                    {i < check.status_history.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CHECK_STATUS_COLORS[h.status as DeferredCheckStatus] || 'bg-gray-100 text-gray-600'}`}>{CHECK_STATUS_LABELS[h.status as DeferredCheckStatus] || h.status}</span>
                      <span className="text-[10px] text-gray-400">{new Date(h.date).toLocaleString('es-PY')}</span>
                    </div>
                    {h.notes && <p className="text-xs text-gray-600 mt-0.5">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-between">
          {!check.expired_managed && <button onClick={onManage} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"><Check size={14} />Gestionar Vencimiento</button>}
          {check.expired_managed && <div />}
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ==================== MODAL: GESTIONAR CHEQUE VENCIDO ====================

function ManageExpiredCheckModal({ check, onClose, onSaved }: { check: DeferredCheck; onClose: () => void; onSaved: () => void }) {
  const [action, setAction] = useState('')
  const [customAction, setCustomAction] = useState('')

  const presetActions = [
    'Contacto realizado con el librador, acordaron nueva fecha de pago',
    'Se inició gestión de cobranza extrajudicial',
    'Cheque devuelto, se solicitó reposición',
    'Protesto del cheque en proceso',
    'Se descontó del saldo pendiente del cliente',
    'Se acordó plan de pago con el deudor',
    'Se endosó a tercero como parte de pago',
    'Cheque canjeado por transferencia bancaria',
    'Se aplicó multa/interés por mora al deudor',
  ]

  const handleSave = () => {
    const finalAction = action === 'custom' ? customAction : action
    if (!finalAction) { alert('Selecciona o describe la acción realizada'); return }
    try {
      accountingService.markExpiredCheckManaged(check.id, finalAction, 'Admin Sistema')
      onSaved()
      onClose()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-4 border-b bg-green-50">
          <h3 className="font-semibold text-green-800 flex items-center gap-2"><Check size={18} />Gestionar Cheque Vencido</h3>
          <p className="text-xs text-gray-500 mt-0.5">#{check.check_number} · {check.partner_name} · {fmtMoney(check.amount, check.currency)}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Acción Realizada *</label>
            <select value={action} onChange={e => setAction(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Seleccionar acción...</option>
              {presetActions.map(a => <option key={a} value={a}>{a}</option>)}
              <option value="custom">Otra acción (especificar)</option>
            </select>
          </div>
          {action === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-1">Descripción de la acción</label>
              <textarea value={customAction} onChange={e => setCustomAction(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Describe la acción tomada..." />
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <Shield size={12} className="inline mr-1" />
            Al marcar como gestionado, el cheque quedará registrado con la acción tomada, fecha y responsable en el historial de auditoría.
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Registrar Gestión</button>
        </div>
      </div>
    </div>
  )
}
