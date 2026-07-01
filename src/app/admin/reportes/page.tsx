'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Package, ShoppingCart, Users, DollarSign, CheckCircle2, Clock,
  BarChart3, RefreshCw, ArrowRight, Star, Calculator, Wrench, Eye, FileText,
} from 'lucide-react';

interface ProductStats { total: number; active: number; totalStock: number; totalValue: number; outOfStock: number; featured: number; }
interface OrderStats { total: number; totalRevenue: number; paidRevenue: number; byStatus: Record<string, number>; }
interface PresupuestoStats { total: number; nuevos: number; enEjecucion: number; completedCount: number; conversionRate: number; totalEstimated: number; totalFinal: number; }
interface LeadStats { total: number; newLeads: number; converted: number; conversionRate: number; totalEstimated: number; }
interface AnalyticsData { totalViews: number; todayViews: number; weekViews: number; }

const formatGs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');

export default function AdminReportesPage() {
  const [products, setProducts] = useState<ProductStats | null>(null);
  const [orders, setOrders] = useState<OrderStats | null>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoStats | null>(null);
  const [leads, setLeads] = useState<LeadStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/productos/stats').then((r) => r.json()).catch(() => null),
      fetch('/api/pedidos/stats').then((r) => r.json()).catch(() => null),
      fetch('/api/presupuestos/stats').then((r) => r.json()).catch(() => null),
      fetch('/api/leads/stats').then((r) => r.json()).catch(() => null),
      fetch('/api/analytics').then((r) => r.json()).catch(() => null),
    ]).then(([p, o, pr, l, a]) => { setProducts(p); setOrders(o); setPresupuestos(pr); setLeads(l); setAnalytics(a); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-6 font-display text-h1 uppercase text-arctic">Reporte General</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card animate-pulse p-5"><div className="h-4 w-20 rounded bg-steel-900" /><div className="mt-3 h-8 w-28 rounded bg-steel-900" /></div>)}</div>
      </div>
    );
  }

  const ecomRevenue = orders?.totalRevenue || 0;
  const servRevenue = presupuestos?.totalFinal || 0;
  const totalRevenue = ecomRevenue + servRevenue;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Reporte General</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Vision consolidada del negocio — E-Commerce + Servicios</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Actualizar</button>
      </div>

      {/* Global financial */}
      <div className="mb-6 rounded-xl border border-steel-900/40 bg-carbon-light p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-h2 text-arctic"><DollarSign className="h-6 w-6 text-[#48BB78]" /> Resumen financiero consolidado</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-carbon p-5 text-center">
            <p className="font-body text-caption uppercase text-steel-500">Facturacion total</p>
            <p className="mt-2 font-display text-h1 text-arctic">{formatGs(totalRevenue)}</p>
            <p className="mt-1 font-body text-caption text-steel-700">E-Commerce + Servicios</p>
          </div>
          <div className="rounded-lg border border-blue-bright/20 bg-blue-bright/5 p-5 text-center">
            <p className="font-body text-caption uppercase text-steel-500">E-Commerce</p>
            <p className="mt-2 font-display text-h2 text-blue-bright">{formatGs(ecomRevenue)}</p>
            <p className="mt-1 font-body text-caption text-steel-700">{orders?.total || 0} pedidos | Cobrado: {formatGs(orders?.paidRevenue || 0)}</p>
          </div>
          <div className="rounded-lg border border-yellow-bright/20 bg-yellow-bright/5 p-5 text-center">
            <p className="font-body text-caption uppercase text-steel-500">Servicios</p>
            <p className="mt-2 font-display text-h2 text-yellow-bright">{formatGs(servRevenue)}</p>
            <p className="mt-1 font-body text-caption text-steel-700">{presupuestos?.total || 0} presupuestos | Estimado: {formatGs(presupuestos?.totalEstimated || 0)}</p>
          </div>
        </div>
        {/* Revenue split bar */}
        {totalRevenue > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between font-body text-caption text-steel-500">
              <span>Distribucion de ingresos</span>
              <span>{totalRevenue > 0 ? `E-com: ${Math.round((ecomRevenue / totalRevenue) * 100)}% | Serv: ${Math.round((servRevenue / totalRevenue) * 100)}%` : ''}</span>
            </div>
            <div className="flex h-4 overflow-hidden rounded-full">
              <div className="bg-blue-bright transition-all" style={{ width: `${totalRevenue > 0 ? (ecomRevenue / totalRevenue) * 100 : 50}%` }} />
              <div className="bg-yellow-bright transition-all" style={{ width: `${totalRevenue > 0 ? (servRevenue / totalRevenue) * 100 : 50}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[0.6rem] text-steel-700">
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-bright" /> E-Commerce</span>
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-yellow-bright" /> Servicios</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick comparison cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: 'Visitas totales', value: (analytics?.totalViews || 0).toString(), icon: Eye, color: 'text-blue-bright', bg: 'bg-blue-muted' },
          { label: 'Leads total', value: (leads?.total || 0).toString(), icon: Users, color: 'text-blue-bright', bg: 'bg-blue-muted' },
          { label: 'Conv. leads', value: `${leads?.conversionRate || 0}%`, icon: TrendingUp, color: 'text-[#48BB78]', bg: 'bg-success-light' },
          { label: 'Productos', value: (products?.total || 0).toString(), icon: Package, color: 'text-blue-bright', bg: 'bg-blue-muted' },
          { label: 'Valor inv.', value: formatGs(products?.totalValue || 0), icon: BarChart3, color: 'text-yellow-bright', bg: 'bg-yellow-muted' },
        ].map((kpi) => { const Icon = kpi.icon; return (
          <div key={kpi.label} className="card p-4">
            <div className="flex items-center gap-1.5"><div className={`flex h-7 w-7 items-center justify-center rounded-md ${kpi.bg}`}><Icon className={`h-3.5 w-3.5 ${kpi.color}`} /></div><span className="font-body text-[0.6rem] uppercase tracking-[0.06em] text-steel-500">{kpi.label}</span></div>
            <p className="mt-2 font-display text-h3 text-arctic">{kpi.value}</p>
          </div>
        ); })}
      </div>

      {/* Detailed report links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/admin/reportes/ecommerce" className="card-interactive group overflow-hidden p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-muted"><ShoppingCart className="h-6 w-6 text-blue-bright" /></div>
            <div>
              <h3 className="font-display text-h3 text-arctic group-hover:text-blue-bright">Reporte E-Commerce</h3>
              <p className="font-body text-caption text-steel-500">Ventas, pedidos, inventario y pagos</p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5 text-steel-700 transition-transform group-hover:translate-x-1 group-hover:text-blue-bright" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded bg-carbon p-2 text-center"><p className="font-mono text-[0.6rem] text-steel-500">Pedidos</p><p className="font-display text-h4 text-arctic">{orders?.total || 0}</p></div>
            <div className="rounded bg-carbon p-2 text-center"><p className="font-mono text-[0.6rem] text-steel-500">Ingresos</p><p className="font-display text-h4 text-arctic">{formatGs(ecomRevenue)}</p></div>
            <div className="rounded bg-carbon p-2 text-center"><p className="font-mono text-[0.6rem] text-steel-500">Productos</p><p className="font-display text-h4 text-arctic">{products?.total || 0}</p></div>
          </div>
        </Link>

        <Link href="/admin/reportes/servicios" className="card-interactive group overflow-hidden p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-muted"><Wrench className="h-6 w-6 text-yellow-bright" /></div>
            <div>
              <h3 className="font-display text-h3 text-arctic group-hover:text-yellow-bright">Reporte Servicios</h3>
              <p className="font-body text-caption text-steel-500">Presupuestos, ejecucion y facturacion</p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5 text-steel-700 transition-transform group-hover:translate-x-1 group-hover:text-yellow-bright" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded bg-carbon p-2 text-center"><p className="font-mono text-[0.6rem] text-steel-500">Presupuestos</p><p className="font-display text-h4 text-arctic">{presupuestos?.total || 0}</p></div>
            <div className="rounded bg-carbon p-2 text-center"><p className="font-mono text-[0.6rem] text-steel-500">Facturado</p><p className="font-display text-h4 text-arctic">{formatGs(servRevenue)}</p></div>
            <div className="rounded bg-carbon p-2 text-center"><p className="font-mono text-[0.6rem] text-steel-500">Aprobacion</p><p className="font-display text-h4 text-arctic">{presupuestos?.conversionRate || 0}%</p></div>
          </div>
        </Link>
      </div>
    </div>
  );
}
