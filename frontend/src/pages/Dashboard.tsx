import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ticketsService, Ticket } from '../services/tickets'
import { integrationService, SystemKPIs, SystemAlert } from '../services/integrationService'
import { getCorporateProfitability, formatProfit, formatMargin } from '../services/costAnalysisService'
import { equipmentService } from '../services/equipment'
import { useAuthStore } from '../stores/authStore'
import { 
  Ticket as TicketIcon, CheckCircle, Clock, AlertTriangle, Eye,
  DollarSign, Users, Package, Wrench, FileText,
  ArrowUpRight, ArrowDownRight, Building2,
  Target, Activity, Calendar, TrendingUp, TrendingDown,
  ClipboardList, MapPin, ExternalLink, AlertOctagon, Bell,
  BarChart2, Landmark, CreditCard, Shield, Cpu, Layers,
  ChevronRight, RefreshCw, Briefcase, Zap, Factory,
  ArrowRight, PieChart, Settings
} from 'lucide-react'

// ==================== COMPONENTES REUTILIZABLES ====================
function StatCard({ label, value, icon: Icon, color, trend, trendUp, link, subtitle }: { 
  label: string; value: string | number; icon: React.ElementType; color: string; trend?: string; trendUp?: boolean; link?: string; subtitle?: string
}) {
  const content = (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all ${link ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${color} flex-shrink-0`}>
          <Icon className="text-white" size={20} />
        </div>
      </div>
    </div>
  )
  return link ? <Link to={link}>{content}</Link> : content
}

function ModuleCard({ title, icon: Icon, color, items, link, emptyMessage = "Sin datos" }: { 
  title: string; icon: React.ElementType; color: string; items: { label: string; value: string | number; status?: string }[]; link: string; emptyMessage?: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color}`}><Icon size={14} className="text-white" /></div>
          <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
        </div>
        <Link to={link} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5">Ir <ChevronRight size={12} /></Link>
      </div>
      <div className="p-3">
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-500">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-gray-900">{item.value}</span>
                  {item.status && (
                    <span className={`w-2 h-2 rounded-full ${item.status === 'good' ? 'bg-green-500' : item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-gray-400 text-center py-3">{emptyMessage}</p>}
      </div>
    </div>
  )
}

function QuickAction({ label, icon: Icon, color, link }: { label: string; icon: React.ElementType; color: string; link: string }) {
  return (
    <Link to={link} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed ${color} hover:border-solid transition-all`}>
      <Icon size={20} className="mb-1" />
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  )
}

function AlertBanner({ alerts }: { alerts: SystemAlert[] }) {
  if (alerts.length === 0) return null
  const criticals = alerts.filter(a => a.type === 'critical')
  const warnings = alerts.filter(a => a.type === 'warning')

  return (
    <div className="space-y-2">
      {criticals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 animate-pulse">
          <div className="flex items-center gap-2 mb-2"><AlertOctagon size={16} className="text-red-600" /><span className="text-sm font-bold text-red-800">Alertas Críticas</span></div>
          <div className="flex flex-wrap gap-2">
            {criticals.map(a => (
              <Link key={a.id} to={a.link || '#'} className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-1.5 text-xs hover:bg-red-50 transition-colors">
                <span className="font-medium text-red-700">{a.module}:</span><span className="text-red-600">{a.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-amber-600" /><span className="text-sm font-bold text-amber-800">Advertencias ({warnings.length})</span></div>
          <div className="flex flex-wrap gap-2">
            {warnings.map(a => (
              <Link key={a.id} to={a.link || '#'} className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs hover:bg-amber-50 transition-colors">
                <span className="font-medium text-amber-700">{a.module}:</span><span className="text-amber-600">{a.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProcessFlowBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-24 text-right truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
        <div className={`h-4 rounded-full ${color} transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">{value}%</span>
      </div>
    </div>
  )
}

const fmtPYG = (v: number) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(v)
const fmtUSD = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

// ==================== DASHBOARD PRINCIPAL ====================
export default function Dashboard() {
  const { user } = useAuthStore()
  const isAdmin = user?.user_type === 'admin'
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['dashboard-tickets', user?.id, user?.user_type, refreshKey],
    queryFn: () => ticketsService.list({ per_page: '200', ...(user && { user_id: user.id, user_type: user.user_type }) }),
  })

  const tickets: Ticket[] = ticketsData?.items || []
  const kpis = useMemo(() => isAdmin ? integrationService.getSystemKPIs() : null, [refreshKey, tickets.length])
  const processFlow = useMemo(() => isAdmin ? integrationService.getProcessFlowMetrics() : null, [refreshKey])

  // Alertas de mantenimiento preventivo de equipos QR
  const { data: maintenanceAlerts = [] } = useQuery({
    queryKey: ['equipment-maintenance-alerts', refreshKey],
    queryFn: () => equipmentService.listMaintenanceAlerts(),
    enabled: isAdmin
  })
  // Rentabilidad operativa del mes (por tickets)
  const operationalProfitability = useMemo(() => {
    if (!isAdmin || tickets.length === 0) return null
    const from = new Date()
    from.setMonth(from.getMonth() - 1)
    return getCorporateProfitability(tickets, from.toISOString(), new Date().toISOString())
  }, [isAdmin, tickets, refreshKey])

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => ['received', 'assigned', 'in_progress'].includes(t.status)).length,
    completed: tickets.filter(t => t.status === 'completed').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  }

  // ==================== VISTA ADMIN ====================
  if (isAdmin && kpis) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRefreshKey(r => r + 1)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><RefreshCw size={16} /></button>
            <div className="flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg"><Activity size={14} /> Operativo</div>
          </div>
        </div>

        {/* Alertas */}
        <AlertBanner alerts={kpis.alerts} />

        {/* KPIs Tier 1: Finanzas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Saldo Bancario PYG" value={fmtPYG(kpis.finance.bankBalancePYG)} icon={Landmark} color="bg-blue-600" link="/administrative" subtitle={`USD ${fmtUSD(kpis.finance.bankBalanceUSD)}`} />
          <StatCard label="Ventas del Mes" value={fmtPYG(kpis.finance.monthSales)} icon={TrendingUp} color="bg-green-600" link="/administrative" trend={`${kpis.finance.totalInvoices} facturas`} trendUp={true} />
          <StatCard label="Gastos del Mes" value={fmtPYG(kpis.finance.monthExpenses)} icon={TrendingDown} color="bg-red-500" link="/administrative" />
          <StatCard label="Cheques en Cartera" value={fmtPYG(kpis.finance.checksReceivable)} icon={CreditCard} color="bg-purple-600" link="/administrative" subtitle={`A pagar: ${fmtPYG(kpis.finance.checksPayable)}`} />
          <StatCard label="Cobros Pendientes" value={kpis.finance.pendingCollections} icon={Clock} color="bg-amber-500" link="/administrative" trend={`${kpis.finance.paidInvoices} cobrados`} trendUp={kpis.finance.paidInvoices > kpis.finance.pendingCollections} />
          <StatCard label="Proyección 30d" value={fmtPYG(kpis.finance.projectedBalance30d)} icon={BarChart2} color={kpis.finance.projectedBalance30d >= 0 ? 'bg-indigo-600' : 'bg-red-700'} link="/administrative" />
        </div>

        {/* KPIs Tier 2: Operaciones */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Tickets Abiertos" value={kpis.tickets.open} icon={TicketIcon} color="bg-blue-500" link="/tickets" trend={kpis.tickets.urgent > 0 ? `${kpis.tickets.urgent} urgentes` : 'Sin urgentes'} trendUp={kpis.tickets.urgent === 0} />
          <StatCard label="Tickets Completados" value={kpis.tickets.completed} icon={CheckCircle} color="bg-green-500" link="/tickets" subtitle={`Res. prom: ${kpis.tickets.avgResolutionDays}d`} />
          <StatCard label="Empleados Activos" value={kpis.hr.activeEmployees} icon={Users} color="bg-purple-500" link="/employees" subtitle={`${kpis.hr.departments} departamentos`} />
          <StatCard label="Items en Stock" value={kpis.inventory.totalItems} icon={Package} color="bg-orange-500" link="/stock" trend={kpis.inventory.lowStock > 0 ? `${kpis.inventory.lowStock} bajo stock` : 'Stock OK'} trendUp={kpis.inventory.lowStock === 0} />
          <StatCard label="Leads CRM" value={kpis.commercial.totalLeads} icon={Target} color="bg-pink-500" link="/commercial" subtitle={`${kpis.commercial.activeOpportunities} oport. activas`} />
          <StatCard label="Activos CMMS" value={kpis.cmms.totalAssets} icon={Cpu} color="bg-yellow-600" link="/cmms" subtitle={`${kpis.cmms.activeWorkOrders} OTs activas`} />
        </div>

        {/* ======= RENTABILIDAD OPERATIVA ======= */}
        {operationalProfitability && (
          <div className="bg-gradient-to-br from-emerald-50 via-white to-indigo-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Target size={18} className="text-emerald-600" />
                  Rentabilidad Operativa (últimos 30 días)
                </h3>
                <p className="text-xs text-gray-500">Utilidad real por trabajo: ingresos facturados − costos directos − overhead</p>
              </div>
              <Link to="/bi" className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                Análisis detallado <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-emerald-100">
                <p className="text-xs text-gray-500">Ingresos</p>
                <p className="text-lg font-bold text-green-700">{formatProfit(operationalProfitability.overall.total_revenue)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-100">
                <p className="text-xs text-gray-500">Costos Totales</p>
                <p className="text-lg font-bold text-red-600">{formatProfit(operationalProfitability.overall.total_cost)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-indigo-100">
                <p className="text-xs text-gray-500">Utilidad</p>
                <p className={`text-lg font-bold ${operationalProfitability.overall.total_profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatProfit(operationalProfitability.overall.total_profit)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-xs text-gray-500">Margen Promedio</p>
                <p className={`text-lg font-bold ${operationalProfitability.overall.avg_margin_percent >= 15 ? 'text-emerald-700' : operationalProfitability.overall.avg_margin_percent >= 0 ? 'text-amber-700' : 'text-red-600'}`}>
                  {formatMargin(operationalProfitability.overall.avg_margin_percent)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
              <div className="bg-emerald-100/60 rounded p-2 text-center">
                <span className="font-bold text-emerald-800">{operationalProfitability.profitable_count}</span>
                <span className="text-emerald-700 ml-1">rentables</span>
              </div>
              <div className="bg-red-100/60 rounded p-2 text-center">
                <span className="font-bold text-red-800">{operationalProfitability.unprofitable_count}</span>
                <span className="text-red-700 ml-1">con pérdida</span>
              </div>
              <div className="bg-amber-100/60 rounded p-2 text-center">
                <span className="font-bold text-amber-800">{operationalProfitability.uninvoiced_count}</span>
                <span className="text-amber-700 ml-1">sin facturar</span>
              </div>
            </div>
          </div>
        )}

        {/* ======= ALERTAS DE MANTENIMIENTO PREVENTIVO ======= */}
        {maintenanceAlerts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertOctagon size={18} className="text-amber-600" />
                Mantenimientos Preventivos
                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                  {maintenanceAlerts.length}
                </span>
              </h3>
              <Link to="/equipment" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Ver todos <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {maintenanceAlerts.slice(0, 6).map(alert => (
                <Link
                  key={alert.equipment.id}
                  to="/equipment"
                  className={`flex items-center gap-2 p-2 rounded-lg border text-sm hover:shadow-sm transition ${
                    alert.status === 'overdue'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className={`p-1.5 rounded ${alert.status === 'overdue' ? 'bg-red-100' : 'bg-amber-100'}`}>
                    {alert.status === 'overdue' ? (
                      <AlertOctagon size={14} className="text-red-600" />
                    ) : (
                      <Calendar size={14} className="text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{alert.equipment.name}</p>
                    <p className="text-xs text-gray-500 truncate">{alert.equipment.client_name}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${alert.status === 'overdue' ? 'text-red-700' : 'text-amber-700'}`}>
                    {alert.status === 'overdue'
                      ? `${Math.abs(alert.daysUntilDue || 0)}d vencido`
                      : `en ${alert.daysUntilDue}d`}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Fila central: Módulos detallados + Flujo de proceso */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Operaciones */}
          <ModuleCard title="Operaciones / Tickets" icon={TicketIcon} color="bg-blue-500" link="/tickets" items={[
            { label: 'Nuevos hoy', value: kpis.tickets.todayNew },
            { label: 'En progreso', value: kpis.tickets.inProgress, status: kpis.tickets.inProgress > 10 ? 'warning' : 'good' },
            { label: 'Urgentes', value: kpis.tickets.urgent, status: kpis.tickets.urgent > 0 ? 'danger' : 'good' },
            { label: 'Total histórico', value: kpis.tickets.total },
          ]} />

          {/* Finanzas */}
          <ModuleCard title="ERP Financiero" icon={DollarSign} color="bg-green-500" link="/administrative" items={[
            { label: 'Facturas emitidas', value: kpis.finance.totalInvoices },
            { label: 'Presupuestos', value: `${kpis.finance.approvedBudgets}/${kpis.finance.totalBudgets}`, status: 'good' },
            { label: 'Compras pendientes', value: kpis.finance.pendingPurchases, status: kpis.finance.pendingPurchases > 5 ? 'warning' : 'good' },
            { label: 'Ventas totales', value: fmtPYG(kpis.finance.totalSales) },
          ]} />

          {/* Contabilidad */}
          <ModuleCard title="Contabilidad" icon={Landmark} color="bg-slate-600" link="/administrative" items={[
            { label: 'Plan de cuentas', value: kpis.accounting.totalAccounts },
            { label: 'Asientos borrador', value: kpis.accounting.pendingEntries, status: kpis.accounting.pendingEntries > 0 ? 'warning' : 'good' },
            { label: 'E-Facturas SIFEN', value: kpis.accounting.totalEInvoices },
            { label: 'Cheques diferidos', value: `${kpis.finance.checksReceivable > 0 ? 'R' : '-'} / ${kpis.finance.checksPayable > 0 ? 'E' : '-'}` },
          ]} />

          {/* Flujo de procesos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-indigo-500"><Zap size={14} className="text-white" /></div>
              <h3 className="font-semibold text-sm text-gray-800">Flujo de Procesos</h3>
            </div>
            {processFlow && (
              <div className="space-y-2">
                <ProcessFlowBar label="Lead → Oport." value={processFlow.lead_to_opportunity} color="bg-pink-400" />
                <ProcessFlowBar label="Oport. → Ticket" value={processFlow.opportunity_to_ticket} color="bg-blue-400" />
                <ProcessFlowBar label="Ticket → Presup." value={processFlow.ticket_to_budget} color="bg-amber-400" />
                <ProcessFlowBar label="Presup. → Fact." value={processFlow.budget_to_invoice} color="bg-green-400" />
                <ProcessFlowBar label="Fact. → Cobro" value={processFlow.invoice_to_collection} color="bg-emerald-500" />
              </div>
            )}
            <div className="mt-3 pt-2 border-t text-center">
              <Link to="/bi" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1"><PieChart size={12} /> Análisis BI completo</Link>
            </div>
          </div>
        </div>

        {/* Tercera fila: Módulos secundarios */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <ModuleCard title="RRHH" icon={Briefcase} color="bg-purple-500" link="/hrms" items={[
            { label: 'Vacantes abiertas', value: kpis.hr.openPositions },
            { label: 'Permisos pend.', value: kpis.hr.pendingLeaves, status: kpis.hr.pendingLeaves > 0 ? 'warning' : 'good' },
            { label: 'Capacitaciones', value: kpis.hr.trainingsActive },
          ]} />
          <ModuleCard title="CRM / Comercial" icon={Target} color="bg-pink-500" link="/commercial" items={[
            { label: 'Oport. ganadas', value: kpis.commercial.wonDeals },
            { label: 'Pipeline valor', value: fmtPYG(kpis.commercial.pipelineValue) },
            { label: 'Contactos', value: kpis.commercial.contacts },
          ]} />
          <ModuleCard title="CMMS" icon={Wrench} color="bg-yellow-600" link="/cmms" items={[
            { label: 'OT pendientes', value: kpis.cmms.pendingWorkOrders, status: kpis.cmms.overdueMaintenance > 0 ? 'danger' : 'good' },
            { label: 'OT activas', value: kpis.cmms.activeWorkOrders },
            { label: 'Vencidas', value: kpis.cmms.overdueMaintenance, status: kpis.cmms.overdueMaintenance > 0 ? 'danger' : 'good' },
          ]} />
          <ModuleCard title="PLM / Crédito" icon={Shield} color="bg-teal-500" link="/plm" items={[
            { label: 'Productos PLM', value: kpis.plm.totalProducts },
            { label: 'ECRs activos', value: kpis.plm.activeECRs },
            { label: 'Créd. pendientes', value: kpis.credit.pendingApplications },
          ]} />
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Acciones Rápidas</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            <QuickAction label="Nuevo Ticket" icon={TicketIcon} color="border-blue-300 text-blue-600 hover:bg-blue-50" link="/tickets" />
            <QuickAction label="Nueva Factura" icon={FileText} color="border-green-300 text-green-600 hover:bg-green-50" link="/administrative" />
            <QuickAction label="Nuevo Lead" icon={Target} color="border-pink-300 text-pink-600 hover:bg-pink-50" link="/commercial" />
            <QuickAction label="Nuevo Empleado" icon={Users} color="border-purple-300 text-purple-600 hover:bg-purple-50" link="/employees" />
            <QuickAction label="Inventario" icon={Package} color="border-indigo-300 text-indigo-600 hover:bg-indigo-50" link="/stock" />
            <QuickAction label="Orden Trabajo" icon={Wrench} color="border-yellow-300 text-yellow-600 hover:bg-yellow-50" link="/cmms" />
            <QuickAction label="Gestión Banco" icon={Landmark} color="border-slate-300 text-slate-600 hover:bg-slate-50" link="/administrative" />
            <QuickAction label="Reportes BI" icon={PieChart} color="border-cyan-300 text-cyan-600 hover:bg-cyan-50" link="/bi" />
          </div>
        </div>
        
        {/* Tickets Recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Tickets Recientes</h3>
            <Link to="/tickets" className="text-xs text-blue-600 hover:text-blue-800">Ver todos →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.slice(0, 8).map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs font-mono text-gray-500">#{ticket.ticket_number || ticket.id.slice(0, 8)}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{ticket.title}</td>
                    <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${
                      ticket.status === 'completed' ? 'bg-green-100 text-green-700' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{ticket.status === 'received' ? 'Recibido' : ticket.status === 'assigned' ? 'Asignado' :
                      ticket.status === 'in_progress' ? 'En Progreso' : ticket.status === 'completed' ? 'Completado' : ticket.status}</span></td>
                    <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${
                      ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' : ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                    }`}>{ticket.priority === 'low' ? 'Baja' : ticket.priority === 'medium' ? 'Media' : ticket.priority === 'high' ? 'Alta' : 'Urgente'}</span></td>
                    <td className="px-4 py-2 text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString('es-PY')}</td>
                    <td className="px-4 py-2 text-center"><Link to={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800 text-xs flex items-center justify-center gap-1"><Eye size={12} /> Ver</Link></td>
                  </tr>
                ))}
                {tickets.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No hay tickets recientes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
  
  // ==================== VISTA CLIENTE ====================
  if (user?.user_type === 'client') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user.full_name || 'Cliente'}</h1>
          <p className="text-gray-500 mt-1">Portal de Cliente - Estado de tus solicitudes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Mis Tickets" value={ticketStats.total} icon={TicketIcon} color="bg-blue-500" link="/tickets" />
          <StatCard label="En Progreso" value={tickets.filter(t => t.status === 'in_progress').length} icon={Clock} color="bg-yellow-500" link="/tickets" />
          <StatCard label="Completados" value={ticketStats.completed} icon={CheckCircle} color="bg-green-500" link="/tickets" />
          <StatCard label="Pendientes" value={tickets.filter(t => ['received', 'assigned'].includes(t.status)).length} icon={AlertTriangle} color="bg-orange-500" link="/tickets" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Mis Solicitudes</h3>
            <Link to="/tickets" className="text-sm text-blue-600 hover:text-blue-800">Ver todas →</Link>
          </div>
          <div className="p-6">
            {tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.slice(0, 5).map(ticket => (
                  <Link key={ticket.id} to={`/tickets/${ticket.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{ticket.description?.slice(0, 100)}...</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${ticket.status === 'completed' ? 'bg-green-100 text-green-700' : ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                        {ticket.status === 'received' ? 'Recibido' : ticket.status === 'assigned' ? 'Asignado' : ticket.status === 'in_progress' ? 'En Progreso' : ticket.status === 'completed' ? 'Completado' : ticket.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={12} />{new Date(ticket.created_at).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-600' : ticket.priority === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                        {ticket.priority === 'low' ? 'Baja' : ticket.priority === 'medium' ? 'Media' : ticket.priority === 'high' ? 'Alta' : 'Urgente'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TicketIcon className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">No tienes solicitudes activas</p>
                <Link to="/tickets" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Crear nueva solicitud →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // ==================== VISTA TÉCNICO ====================
  if (user?.user_type === 'technician') {
    const assignedTickets = tickets.filter(t => t.assigned_technicians?.some((at: any) => at.id === user.id || at.user_id === user.id) || (t as any).assigned_technician_id === user.id)
    const activeTickets = assignedTickets.filter(t => t.status === 'in_progress')
    const pendingTickets = assignedTickets.filter(t => ['received', 'assigned'].includes(t.status))
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Técnico</h1>
          <p className="text-gray-500 mt-1">Hola {user.full_name || 'Técnico'} - Tus asignaciones del día</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Asignados" value={assignedTickets.length} icon={TicketIcon} color="bg-blue-500" link="/tickets" />
          <StatCard label="En Trabajo" value={activeTickets.length} icon={Clock} color="bg-yellow-500" link="/tickets" />
          <StatCard label="Pendientes" value={pendingTickets.length} icon={AlertTriangle} color="bg-orange-500" link="/tickets" />
          <StatCard label="Completados" value={assignedTickets.filter(t => t.status === 'completed').length} icon={CheckCircle} color="bg-green-500" link="/tickets" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/attendance" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-green-300 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 rounded-xl"><Clock className="text-green-600" size={24} /></div>
              <div><h3 className="font-semibold text-gray-900">Marcar Asistencia</h3><p className="text-sm text-gray-500">Registra tu entrada/salida</p></div>
            </div>
          </Link>
          <Link to="/equipment" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-blue-300 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-xl"><ClipboardList className="text-blue-600" size={24} /></div>
              <div><h3 className="font-semibold text-gray-900">Escanear Equipo</h3><p className="text-sm text-gray-500">Consultar historial de equipos</p></div>
            </div>
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Mis Tickets Asignados</h3>
            <Link to="/tickets" className="text-sm text-blue-600 hover:text-blue-800">Ver todos →</Link>
          </div>
          <div className="p-6">
            {assignedTickets.length > 0 ? (
              <div className="space-y-3">
                {assignedTickets.slice(0, 5).map(ticket => (
                  <Link key={ticket.id} to={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${ticket.priority === 'urgent' ? 'bg-red-500' : ticket.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                        <p className="text-sm text-gray-500">{ticket.description?.slice(0, 50)}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {ticket.status === 'assigned' ? 'Por iniciar' : 'En progreso'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8"><CheckCircle className="mx-auto text-green-300 mb-3" size={48} /><p className="text-gray-500">No tienes tickets asignados</p></div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // ==================== VISTA PROVEEDOR ====================
  if (user?.user_type === 'supplier') {
    const supplierTickets = tickets.filter(t => (t as any).assigned_supplier_id === user.id)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal de Proveedor</h1>
          <p className="text-gray-500 mt-1">Hola {user.full_name || 'Proveedor'} - Trabajos asignados</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Trabajos Asignados" value={supplierTickets.length} icon={TicketIcon} color="bg-blue-500" link="/tickets" />
          <StatCard label="En Progreso" value={supplierTickets.filter(t => t.status === 'in_progress').length} icon={Clock} color="bg-yellow-500" link="/tickets" />
          <StatCard label="Completados" value={supplierTickets.filter(t => t.status === 'completed').length} icon={CheckCircle} color="bg-green-500" link="/tickets" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Mis Trabajos</h3>
            <Link to="/tickets" className="text-sm text-blue-600 hover:text-blue-800">Ver todos →</Link>
          </div>
          <div className="p-6">
            {supplierTickets.length > 0 ? (
              <div className="space-y-3">
                {supplierTickets.map(ticket => (
                  <Link key={ticket.id} to={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all">
                    <div><h4 className="font-medium text-gray-900">{ticket.title}</h4><p className="text-sm text-gray-500">{ticket.description?.slice(0, 60)}</p></div>
                    <span className={`text-xs px-2 py-1 rounded-full ${ticket.status === 'completed' ? 'bg-green-100 text-green-700' : ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {ticket.status === 'in_progress' ? 'En Progreso' : ticket.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8"><TicketIcon className="mx-auto text-gray-300 mb-3" size={48} /><p className="text-gray-500">No tienes trabajos asignados</p></div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    </div>
  )
}
