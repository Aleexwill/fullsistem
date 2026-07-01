import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import {
  biService,
  SalesReport,
  PurchasesReport,
  ExpensesReport,
  CashFlowReport,
  ProfitabilityReport,
  KPI,
  TrendData,
  ComparativeData,
  PERIOD_LABELS
} from '../services/bi'
import { ticketsService } from '../services/tickets'
import {
  getCorporateProfitability,
  profitabilityByClient,
  profitabilityByTechnician,
  formatProfit,
  formatMargin,
  getMarginColor,
} from '../services/costAnalysisService'
import {
  LayoutDashboard, TrendingUp, TrendingDown, Minus, BarChart3, 
  PieChart, LineChart, ArrowUpRight, ArrowDownRight, DollarSign,
  ShoppingCart, Wallet, Users, FileText, Percent, Target,
  Calendar, Filter, Download, RefreshCw, Loader2, XCircle,
  ChevronRight, Activity, Banknote, CreditCard, Building2,
  AlertCircle, CheckCircle, Clock, Zap
} from 'lucide-react'

type PeriodType = 'today' | 'week' | 'month' | 'quarter' | 'year'
type ViewType = 'dashboard' | 'sales' | 'purchases' | 'expenses' | 'cashflow' | 'profitability' | 'comparative'

export default function BI() {
  const { user } = useAuthStore()
  const [period, setPeriod] = useState<PeriodType>('month')
  const [activeView, setActiveView] = useState<ViewType>('dashboard')

  if (user?.user_type !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="mx-auto text-red-400 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-800">Acceso Restringido</h2>
          <p className="text-gray-600">Solo administradores pueden acceder al módulo de BI.</p>
        </div>
      </div>
    )
  }

  const views = [
    { id: 'dashboard' as ViewType, label: 'Dashboard General', icon: LayoutDashboard, color: 'indigo' },
    { id: 'sales' as ViewType, label: 'Análisis de Ventas', icon: TrendingUp, color: 'green' },
    { id: 'purchases' as ViewType, label: 'Análisis de Compras', icon: ShoppingCart, color: 'blue' },
    { id: 'expenses' as ViewType, label: 'Análisis de Gastos', icon: Wallet, color: 'red' },
    { id: 'cashflow' as ViewType, label: 'Flujo de Caja', icon: Activity, color: 'purple' },
    { id: 'profitability' as ViewType, label: 'Rentabilidad', icon: Target, color: 'emerald' },
    { id: 'comparative' as ViewType, label: 'Comparativo', icon: BarChart3, color: 'orange' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-white" size={24} />
            </div>
            Business Intelligence
          </h1>
          <p className="text-gray-600 mt-1">Análisis y reportes del sistema financiero</p>
        </div>
        
        {/* Selector de período */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key as PeriodType)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === key
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegación de vistas */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              activeView === view.id
                ? `bg-${view.color}-100 text-${view.color}-700 border-2 border-${view.color}-300`
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            <view.icon size={18} />
            {view.label}
          </button>
        ))}
      </div>

      {/* Contenido según vista */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {activeView === 'dashboard' && <DashboardView period={period} />}
        {activeView === 'sales' && <SalesView period={period} />}
        {activeView === 'purchases' && <PurchasesView period={period} />}
        {activeView === 'expenses' && <ExpensesView period={period} />}
        {activeView === 'cashflow' && <CashFlowView period={period} />}
        {activeView === 'profitability' && <ProfitabilityView period={period} />}
        {activeView === 'comparative' && <ComparativeView period={period} />}
      </div>
    </div>
  )
}

// ==================== DASHBOARD VIEW ====================

function DashboardView({ period }: { period: PeriodType }) {
  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ['bi-kpis', period],
    queryFn: () => biService.getKPIs(period)
  })

  const { data: trend, isLoading: loadingTrend } = useQuery({
    queryKey: ['bi-trend'],
    queryFn: () => biService.getSalesTrend(6)
  })

  const { data: profitability, isLoading: loadingProfit } = useQuery({
    queryKey: ['bi-profitability', period],
    queryFn: () => biService.getProfitabilityReport(period)
  })

  const formatValue = (kpi: KPI) => {
    if (kpi.format === 'currency') {
      const val = kpi.value
      if (val >= 1000000) return `₲ ${(val / 1000000).toFixed(1)}M`
      if (val >= 1000) return `₲ ${(val / 1000).toFixed(0)}K`
      return `₲ ${val.toLocaleString()}`
    }
    if (kpi.format === 'percent') return `${kpi.value.toFixed(1)}%`
    return kpi.value.toLocaleString()
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-500" />
    if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />
    return <Minus size={16} className="text-gray-400" />
  }

  const getKPIColor = (color: string) => {
    const colors: Record<string, string> = {
      green: 'from-green-500 to-emerald-600',
      blue: 'from-blue-500 to-indigo-600',
      indigo: 'from-indigo-500 to-purple-600',
      orange: 'from-orange-500 to-amber-600',
      red: 'from-red-500 to-rose-600',
      emerald: 'from-emerald-500 to-teal-600',
      purple: 'from-purple-500 to-violet-600',
      teal: 'from-teal-500 to-cyan-600'
    }
    return colors[color] || colors.indigo
  }

  if (loadingKPIs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis?.slice(0, 8).map(kpi => (
          <div key={kpi.id} className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br text-white shadow-lg" style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}>
            <div className={`absolute inset-0 bg-gradient-to-br ${getKPIColor(kpi.color)} opacity-100`} />
            <div className="relative z-10">
              <p className="text-sm text-white/80">{kpi.name}</p>
              <p className="text-2xl font-bold mt-1">{formatValue(kpi)}</p>
              <div className="flex items-center gap-1 mt-2 text-sm">
                {getTrendIcon(kpi.trend)}
                <span className={kpi.change_percent >= 0 ? 'text-green-200' : 'text-red-200'}>
                  {kpi.change_percent >= 0 ? '+' : ''}{kpi.change_percent.toFixed(1)}%
                </span>
                <span className="text-white/60 text-xs">vs anterior</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de tendencia */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LineChart size={20} className="text-indigo-600" />
            Tendencia de Ventas vs Compras (6 meses)
          </h3>
          {loadingTrend ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : (
            <div className="h-48">
              <SimpleBarChart data={trend!} />
            </div>
          )}
        </div>

        {/* Resumen de rentabilidad */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-emerald-600" />
            Resumen de Rentabilidad
          </h3>
          {loadingProfit ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : profitability && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Ingresos Brutos</span>
                <span className="font-bold text-green-700">₲ {profitability.gross_revenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-700">Costo de Ventas</span>
                <span className="font-bold text-orange-700">- ₲ {profitability.total_costs.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">Gastos Operativos</span>
                <span className="font-bold text-red-700">- ₲ {(profitability.operating_expenses + profitability.payroll_expenses).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white">
                <span className="font-semibold">Utilidad Neta</span>
                <span className="text-xl font-bold">₲ {profitability.net_profit.toLocaleString()}</span>
              </div>
              <div className="text-center text-sm text-gray-500">
                Margen de utilidad: <span className="font-semibold text-emerald-600">{profitability.profit_margin.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== SALES VIEW ====================

function SalesView({ period }: { period: PeriodType }) {
  const { data, isLoading } = useQuery({
    queryKey: ['bi-sales', period],
    queryFn: () => biService.getSalesReport(period)
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Ventas Totales" value={`₲ ${data.total_sales.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard title="Facturas Emitidas" value={data.total_invoices.toString()} icon={FileText} color="blue" />
        <StatCard title="Ticket Promedio" value={`₲ ${Math.round(data.avg_ticket).toLocaleString()}`} icon={CreditCard} color="indigo" />
        <StatCard title="Pendiente de Cobro" value={`₲ ${data.pending.toLocaleString()}`} icon={Clock} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contado vs Crédito */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Ventas por Tipo</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 font-medium">Contado</span>
                <span>₲ {data.cash_sales.toLocaleString()} ({data.total_sales > 0 ? ((data.cash_sales / data.total_sales) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.total_sales > 0 ? (data.cash_sales / data.total_sales) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-600 font-medium">Crédito</span>
                <span>₲ {data.credit_sales.toLocaleString()} ({data.total_sales > 0 ? ((data.credit_sales / data.total_sales) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.total_sales > 0 ? (data.credit_sales / data.total_sales) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Clientes */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Top 5 Clientes</h3>
          <div className="space-y-3">
            {data.top_clients.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Sin datos</p>
            ) : (
              data.top_clients.map((client, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-200 text-gray-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{idx + 1}</span>
                    <span className="font-medium text-gray-700 truncate max-w-[150px]">{client.name}</span>
                  </div>
                  <span className="font-semibold text-green-600">₲ {client.total.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ventas por día */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Ventas por Día</h3>
        <div className="h-48">
          <SimpleDailyChart data={data.by_day} color="#10B981" />
        </div>
      </div>
    </div>
  )
}

// ==================== PURCHASES VIEW ====================

function PurchasesView({ period }: { period: PeriodType }) {
  const { data, isLoading } = useQuery({
    queryKey: ['bi-purchases', period],
    queryFn: () => biService.getPurchasesReport(period)
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Compras Totales" value={`₲ ${data.total_purchases.toLocaleString()}`} icon={ShoppingCart} color="blue" />
        <StatCard title="Órdenes" value={data.total_orders.toString()} icon={FileText} color="indigo" />
        <StatCard title="Pagado" value={`₲ ${data.paid.toLocaleString()}`} icon={CheckCircle} color="green" />
        <StatCard title="Pendiente" value={`₲ ${data.pending.toLocaleString()}`} icon={Clock} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contado vs Crédito */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Compras por Tipo</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 font-medium">Contado</span>
                <span>₲ {data.cash_purchases.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.total_purchases > 0 ? (data.cash_purchases / data.total_purchases) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-600 font-medium">Crédito</span>
                <span>₲ {data.credit_purchases.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.total_purchases > 0 ? (data.credit_purchases / data.total_purchases) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Proveedores */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Top 5 Proveedores</h3>
          <div className="space-y-3">
            {data.top_suppliers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Sin datos</p>
            ) : (
              data.top_suppliers.map((supplier, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{idx + 1}</span>
                    <span className="font-medium text-gray-700 truncate max-w-[150px]">{supplier.name}</span>
                  </div>
                  <span className="font-semibold text-blue-600">₲ {supplier.total.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== EXPENSES VIEW ====================

function ExpensesView({ period }: { period: PeriodType }) {
  const { data, isLoading } = useQuery({
    queryKey: ['bi-expenses', period],
    queryFn: () => biService.getExpensesReport(period)
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
  }

  if (!data) return null

  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Gastos Totales" value={`₲ ${data.total_expenses.toLocaleString()}`} icon={Wallet} color="red" />
        <StatCard title="Promedio Diario" value={`₲ ${Math.round(data.avg_daily).toLocaleString()}`} icon={Calendar} color="orange" />
        <StatCard title="Categorías" value={data.by_category.length.toString()} icon={PieChart} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por categoría */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Gastos por Categoría</h3>
          <div className="space-y-3">
            {data.by_category.map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{cat.category}</span>
                  <span>₲ {cat.amount.toLocaleString()} ({cat.percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${cat.percentage}%`,
                      backgroundColor: colors[idx % colors.length]
                    }} 
                  />
                </div>
              </div>
            ))}
            {data.by_category.length === 0 && (
              <p className="text-gray-500 text-center py-4">Sin gastos registrados</p>
            )}
          </div>
        </div>

        {/* Gráfico de torta simulado */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Distribución de Gastos</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {data.by_category.slice(0, 6).map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span className="text-sm">{cat.category}: {cat.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== CASH FLOW VIEW ====================

function CashFlowView({ period }: { period: PeriodType }) {
  const { data, isLoading } = useQuery({
    queryKey: ['bi-cashflow', period],
    queryFn: () => biService.getCashFlowReport(period)
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight size={20} />
            <span className="text-green-100">Ingresos</span>
          </div>
          <p className="text-3xl font-bold">₲ {data.inflows.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={20} />
            <span className="text-red-100">Egresos</span>
          </div>
          <p className="text-3xl font-bold">₲ {data.outflows.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-5 text-white ${data.net_flow >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={20} />
            <span className="opacity-80">Flujo Neto</span>
          </div>
          <p className="text-3xl font-bold">{data.net_flow >= 0 ? '+' : ''}₲ {data.net_flow.toLocaleString()}</p>
        </div>
      </div>

      {/* Flujo por día */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Flujo de Caja Diario</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Fecha</th>
                <th className="text-right py-2 px-3 text-green-600">Ingresos</th>
                <th className="text-right py-2 px-3 text-red-600">Egresos</th>
                <th className="text-right py-2 px-3">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {data.by_day.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Sin movimientos</td></tr>
              ) : (
                data.by_day.map((day, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="py-2 px-3 text-right text-green-600">+₲ {day.inflow.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-red-600">-₲ {day.outflow.toLocaleString()}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${day.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ₲ {day.balance.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ==================== PROFITABILITY VIEW ====================

function ProfitabilityView({ period }: { period: PeriodType }) {
  const { data, isLoading } = useQuery({
    queryKey: ['bi-profitability', period],
    queryFn: () => biService.getProfitabilityReport(period)
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Estado de Resultados */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">Estado de Resultados</h3>
          <p className="text-sm text-gray-500">{data.period}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">Ingresos por Ventas</span>
            <span className="text-xl font-bold text-green-600">₲ {data.gross_revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">(-) Costo de Ventas</span>
            <span className="text-lg font-semibold text-red-600">₲ {data.total_costs.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded-lg">
            <span className="font-semibold text-blue-800">= Utilidad Bruta</span>
            <span className="text-xl font-bold text-blue-600">₲ {data.gross_profit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">(-) Gastos Operativos</span>
            <span className="text-lg font-semibold text-red-600">₲ {data.operating_expenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">(-) Gastos de Personal</span>
            <span className="text-lg font-semibold text-red-600">₲ {data.payroll_expenses.toLocaleString()}</span>
          </div>
          <div className={`flex justify-between items-center py-3 px-4 rounded-lg ${data.net_profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <span className={`font-bold text-lg ${data.net_profit >= 0 ? 'text-green-800' : 'text-red-800'}`}>= Utilidad Neta</span>
            <span className={`text-2xl font-bold ${data.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₲ {data.net_profit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-xl p-4">
          <h4 className="text-sm text-gray-500 mb-2">Margen de Utilidad</h4>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${data.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.profit_margin.toFixed(1)}%
            </span>
            {data.profit_margin >= 20 ? (
              <span className="text-green-500 flex items-center gap-1 text-sm"><CheckCircle size={16} /> Excelente</span>
            ) : data.profit_margin >= 10 ? (
              <span className="text-yellow-500 flex items-center gap-1 text-sm"><AlertCircle size={16} /> Moderado</span>
            ) : (
              <span className="text-red-500 flex items-center gap-1 text-sm"><AlertCircle size={16} /> Bajo</span>
            )}
          </div>
        </div>
        <div className="border rounded-xl p-4">
          <h4 className="text-sm text-gray-500 mb-2">Ratio de Gastos</h4>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${data.expense_ratio <= 30 ? 'text-green-600' : 'text-orange-600'}`}>
              {data.expense_ratio.toFixed(1)}%
            </span>
            <span className="text-gray-500 text-sm">de los ingresos</span>
          </div>
        </div>
      </div>

      {/* ====== NUEVO: RENTABILIDAD OPERATIVA POR TICKET ====== */}
      <OperationalProfitabilityPanel period={period} />
    </div>
  )
}

// ==================== PANEL DE RENTABILIDAD OPERATIVA ====================
// Analiza la utilidad real de cada trabajo/ticket basado en:
// ingresos facturados - (mano de obra + materiales + gastos + overhead)

function OperationalProfitabilityPanel({ period }: { period: PeriodType }) {
  const { data: ticketList, isLoading } = useQuery({
    queryKey: ['tickets-for-profitability'],
    queryFn: () => ticketsService.list().then(r => r.items),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
  }
  if (!ticketList || ticketList.length === 0) {
    return (
      <div className="border rounded-xl p-6 text-center text-gray-500">
        <Target className="mx-auto mb-2 opacity-40" size={32} />
        <p className="text-sm">Aún no hay tickets para analizar.</p>
      </div>
    )
  }

  // Filtrar por período
  const now = new Date()
  const from = new Date()
  if (period === 'today') from.setHours(0, 0, 0, 0)
  else if (period === 'week') from.setDate(now.getDate() - 7)
  else if (period === 'month') from.setMonth(now.getMonth() - 1)
  else if (period === 'quarter') from.setMonth(now.getMonth() - 3)
  else if (period === 'year') from.setFullYear(now.getFullYear() - 1)

  const corporate = getCorporateProfitability(ticketList, from.toISOString(), now.toISOString())
  const periodTickets = ticketList.filter(t => {
    const d = new Date(t.completed_at || t.updated_at || t.created_at)
    return d >= from && d <= now
  })
  const byClient = profitabilityByClient(periodTickets).slice(0, 8)
  const byTechnician = profitabilityByTechnician(periodTickets).slice(0, 8)

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-2 border-b pb-2">
        <Target className="text-emerald-600" size={20} />
        <h3 className="text-lg font-bold text-gray-900">Rentabilidad Operativa por Trabajo</h3>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Nuevo</span>
      </div>

      {/* KPIs de rentabilidad operativa */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-xs text-gray-500 mb-1">Trabajos Rentables</p>
          <p className="text-2xl font-bold text-emerald-700">{corporate.profitable_count}</p>
          <p className="text-xs text-gray-500">de {corporate.overall.count} tickets</p>
        </div>
        <div className="border rounded-xl p-4 bg-gradient-to-br from-red-50 to-white">
          <p className="text-xs text-gray-500 mb-1">Trabajos con Pérdida</p>
          <p className="text-2xl font-bold text-red-600">{corporate.unprofitable_count}</p>
          <p className="text-xs text-gray-500">margen negativo</p>
        </div>
        <div className="border rounded-xl p-4 bg-gradient-to-br from-amber-50 to-white">
          <p className="text-xs text-gray-500 mb-1">Sin Facturar</p>
          <p className="text-2xl font-bold text-amber-600">{corporate.uninvoiced_count}</p>
          <p className="text-xs text-gray-500">revisar emisión</p>
        </div>
        <div className="border rounded-xl p-4 bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-xs text-gray-500 mb-1">Margen Promedio</p>
          <p className={`text-2xl font-bold ${corporate.overall.avg_margin_percent >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
            {formatMargin(corporate.overall.avg_margin_percent)}
          </p>
          <p className="text-xs text-gray-500">Utilidad: {formatProfit(corporate.overall.total_profit)}</p>
        </div>
      </div>

      {/* Top rentables y pérdidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top rentables */}
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100">
            <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
              <TrendingUp size={16} /> Top Trabajos Rentables
            </h4>
          </div>
          <div className="divide-y">
            {corporate.top_profitable.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
            ) : corporate.top_profitable.map(b => (
              <div key={b.ticket_id} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{b.ticket_number}</p>
                  <p className="text-xs text-gray-500 truncate">{b.client_name || 'Sin cliente'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{formatProfit(b.profit)}</p>
                  <p className="text-xs text-emerald-700">{formatMargin(b.margin_percent)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pérdidas */}
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-red-50 px-4 py-2.5 border-b border-red-100">
            <h4 className="font-semibold text-red-800 flex items-center gap-2">
              <TrendingDown size={16} /> Trabajos con Pérdida
            </h4>
          </div>
          <div className="divide-y">
            {corporate.losses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin trabajos con pérdida</p>
            ) : corporate.losses.map(b => (
              <div key={b.ticket_id} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{b.ticket_number}</p>
                  <p className="text-xs text-gray-500 truncate">{b.client_name || 'Sin cliente'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{formatProfit(b.profit)}</p>
                  <p className="text-xs text-red-700">{formatMargin(b.margin_percent)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Por cliente */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users size={16} /> Rentabilidad por Cliente
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Cliente</th>
                <th className="text-right px-4 py-2 font-medium">Tickets</th>
                <th className="text-right px-4 py-2 font-medium">Ingresos</th>
                <th className="text-right px-4 py-2 font-medium">Costos</th>
                <th className="text-right px-4 py-2 font-medium">Utilidad</th>
                <th className="text-right px-4 py-2 font-medium">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {byClient.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-gray-400">Sin datos</td></tr>
              ) : byClient.map(c => {
                const color = getMarginColor(c.avg_margin_percent)
                const cls = color === 'emerald' ? 'text-emerald-700' : color === 'blue' ? 'text-blue-700' : color === 'amber' ? 'text-amber-700' : color === 'orange' ? 'text-orange-700' : 'text-red-700'
                return (
                  <tr key={c.client_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{c.client_name}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{c.count}</td>
                    <td className="px-4 py-2 text-right text-green-700">{formatProfit(c.total_revenue)}</td>
                    <td className="px-4 py-2 text-right text-red-600">{formatProfit(c.total_cost)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${cls}`}>{formatProfit(c.total_profit)}</td>
                    <td className={`px-4 py-2 text-right font-bold ${cls}`}>{formatMargin(c.avg_margin_percent)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Por técnico */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users size={16} /> Rentabilidad por Técnico
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Técnico</th>
                <th className="text-right px-4 py-2 font-medium">Tickets</th>
                <th className="text-right px-4 py-2 font-medium">Horas</th>
                <th className="text-right px-4 py-2 font-medium">Ingreso/Hs</th>
                <th className="text-right px-4 py-2 font-medium">Utilidad</th>
                <th className="text-right px-4 py-2 font-medium">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {byTechnician.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-gray-400">Sin datos</td></tr>
              ) : byTechnician.map(t => {
                const color = getMarginColor(t.avg_margin_percent)
                const cls = color === 'emerald' ? 'text-emerald-700' : color === 'blue' ? 'text-blue-700' : color === 'amber' ? 'text-amber-700' : color === 'orange' ? 'text-orange-700' : 'text-red-700'
                return (
                  <tr key={t.technician_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{t.technician_name}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{t.count}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{t.total_hours.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{formatProfit(t.avg_hourly_revenue)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${cls}`}>{formatProfit(t.total_profit)}</td>
                    <td className={`px-4 py-2 text-right font-bold ${cls}`}>{formatMargin(t.avg_margin_percent)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ==================== COMPARATIVE VIEW ====================

function ComparativeView({ period }: { period: PeriodType }) {
  const comparePeriod = period === 'today' ? 'month' : period === 'week' ? 'month' : period
  
  const { data, isLoading } = useQuery({
    queryKey: ['bi-comparative', comparePeriod],
    queryFn: () => biService.getComparativeAnalysis(comparePeriod as 'month' | 'quarter' | 'year')
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">Análisis Comparativo</h3>
          <p className="text-sm text-gray-500">Período actual vs período anterior</p>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Métrica</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Período Actual</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Período Anterior</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Variación</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">%</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{item.metric}</td>
                <td className="px-4 py-3 text-right">
                  {item.metric.includes('Facturas') || item.metric.includes('Órdenes') 
                    ? item.current.toLocaleString()
                    : `₲ ${item.current.toLocaleString()}`
                  }
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {item.metric.includes('Facturas') || item.metric.includes('Órdenes') 
                    ? item.previous.toLocaleString()
                    : `₲ ${item.previous.toLocaleString()}`
                  }
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change >= 0 ? '+' : ''}
                  {item.metric.includes('Facturas') || item.metric.includes('Órdenes') 
                    ? item.change.toLocaleString()
                    : `₲ ${item.change.toLocaleString()}`
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    item.change_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.change_percent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {item.change_percent >= 0 ? '+' : ''}{item.change_percent.toFixed(1)}%
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

// ==================== HELPER COMPONENTS ====================

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  )
}

function SimpleBarChart({ data }: { data: TrendData }) {
  if (!data || data.labels.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-400">Sin datos</div>
  }

  const maxValue = Math.max(...data.datasets.flatMap(d => d.data))

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end gap-2">
        {data.labels.map((label, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-1 items-end h-32">
              {data.datasets.map((dataset, dIdx) => (
                <div 
                  key={dIdx}
                  className="flex-1 rounded-t transition-all hover:opacity-80"
                  style={{ 
                    height: `${maxValue > 0 ? (dataset.data[idx] / maxValue) * 100 : 0}%`,
                    backgroundColor: dataset.color,
                    minHeight: dataset.data[idx] > 0 ? '4px' : '0'
                  }}
                  title={`${dataset.label}: ₲ ${dataset.data[idx].toLocaleString()}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 truncate w-full text-center">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-4 pt-2 border-t">
        {data.datasets.map((dataset, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: dataset.color }} />
            <span className="text-gray-600">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SimpleDailyChart({ data, color }: { data: { date: string; amount: number }[]; color: string }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-400">Sin datos</div>
  }

  const maxValue = Math.max(...data.map(d => d.amount))

  return (
    <div className="h-full flex items-end gap-1">
      {data.map((item, idx) => (
        <div 
          key={idx} 
          className="flex-1 rounded-t transition-all hover:opacity-80 cursor-pointer"
          style={{ 
            height: `${maxValue > 0 ? (item.amount / maxValue) * 100 : 0}%`,
            backgroundColor: color,
            minHeight: item.amount > 0 ? '4px' : '0'
          }}
          title={`${new Date(item.date).toLocaleDateString()}: ₲ ${item.amount.toLocaleString()}`}
        />
      ))}
    </div>
  )
}
