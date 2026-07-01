'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package, DollarSign, AlertTriangle, Star, TrendingUp, Plus, ArrowRight, Layers, Tag,
  ShoppingCart, Calculator, Users, Wrench, CheckCircle2, Clock, FileText, Eye,
} from 'lucide-react';

interface ProductStats { total: number; active: number; totalStock: number; totalValue: number; outOfStock: number; featured: number; categoriesCount: number; brandsCount: number; }
interface OrderStats { total: number; byStatus: Record<string, number>; totalRevenue: number; paidRevenue: number; }
interface PresupuestoStats { total: number; nuevos: number; enEjecucion: number; completedCount: number; approvedCount: number; conversionRate: number; totalEstimated: number; totalFinal: number; }
interface LeadStats { total: number; newLeads: number; converted: number; conversionRate: number; totalEstimated: number; }
interface AnalyticsData { totalViews: number; todayViews: number; weekViews: number; }

const formatGs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');

export default function AdminDashboard() {
  const [products, setProducts] = useState<ProductStats | null>(null);
  const [orders, setOrders] = useState<OrderStats | null>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoStats | null>(null);
  const [leads, setLeads] = useState<LeadStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/productos/stats').then((r) => r.json()).catch(() => null),
      fetch('/api/pedidos/stats').then((r) => r.json()).catch(() => null),
      fetch('/api/presupuestos/stats').then((r) => r.json()).catch(() => null),
      fetch('/api/leads/stats').then((r) => r.json()).catch(() => null),
      fetch('/api/analytics').then((r) => r.json()).catch(() => null),
    ]).then(([p, o, pr, l, a]) => {
      setProducts(p); setOrders(o); setPresupuestos(pr); setLeads(l); setAnalytics(a); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-6 font-display text-h1 uppercase text-arctic">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card animate-pulse p-5"><div className="h-4 w-20 rounded bg-steel-900" /><div className="mt-3 h-8 w-28 rounded bg-steel-900" /></div>)}</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Dashboard</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Panel de administracion de Full Service & Clean</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/productos/nuevo" className="btn-primary"><Plus className="h-4 w-4" /> Producto</Link>
          <Link href="/admin/presupuestos" className="btn-secondary"><Calculator className="h-4 w-4" /> Presupuesto</Link>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: 'Visitas hoy', value: (analytics?.todayViews || 0).toString(), icon: Eye, color: 'text-blue-bright', bg: 'bg-blue-muted' },
          { label: 'Leads', value: (leads?.total || 0).toString(), icon: Users, color: 'text-blue-bright', bg: 'bg-blue-muted' },
          { label: 'Pedidos tienda', value: (orders?.total || 0).toString(), icon: ShoppingCart, color: 'text-[#48BB78]', bg: 'bg-success-light' },
          { label: 'Presupuestos', value: (presupuestos?.total || 0).toString(), icon: Calculator, color: 'text-yellow-bright', bg: 'bg-yellow-muted' },
          { label: 'Productos', value: (products?.total || 0).toString(), icon: Package, color: 'text-blue-bright', bg: 'bg-blue-muted' },
        ].map((kpi) => { const Icon = kpi.icon; return (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-center gap-2"><div className={`flex h-8 w-8 items-center justify-center rounded-md ${kpi.bg}`}><Icon className={`h-4 w-4 ${kpi.color}`} /></div><span className="font-body text-caption uppercase tracking-[0.06em] text-steel-500">{kpi.label}</span></div>
            <p className="mt-3 font-display text-h2 text-arctic">{kpi.value}</p>
          </div>
        ); })}
      </div>

      {/* Two columns: E-Commerce & Servicios */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* === E-COMMERCE SECTION === */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-steel-900/40 pb-2">
            <ShoppingCart className="h-5 w-5 text-blue-bright" />
            <h2 className="font-display text-h2 uppercase text-arctic">E-Commerce</h2>
          </div>

          {/* E-commerce KPIs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Ingresos', value: formatGs(orders?.totalRevenue || 0), icon: DollarSign, color: 'text-[#48BB78]', bg: 'bg-success-light' },
              { label: 'Cobrado', value: formatGs(orders?.paidRevenue || 0), icon: CheckCircle2, color: 'text-[#48BB78]', bg: 'bg-success-light' },
              { label: 'Valor inventario', value: formatGs(products?.totalValue || 0), icon: Package, color: 'text-yellow-bright', bg: 'bg-yellow-muted' },
              { label: 'Sin stock', value: (products?.outOfStock || 0).toString(), icon: AlertTriangle, color: products?.outOfStock ? 'text-[#FC8181]' : 'text-steel-500', bg: 'bg-danger-light' },
            ].map((k) => { const Icon = k.icon; return (
              <div key={k.label} className="rounded-lg border border-steel-900/30 bg-carbon p-3">
                <div className="flex items-center gap-1.5"><Icon className={`h-3.5 w-3.5 ${k.color}`} /><span className="font-body text-caption text-steel-500">{k.label}</span></div>
                <p className="mt-1 font-display text-h3 text-arctic">{k.value}</p>
              </div>
            ); })}
          </div>

          {/* Order status */}
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-h4 text-arctic">Pedidos por estado</h3>
              <Link href="/admin/pedidos" className="font-body text-caption text-blue-bright hover:underline">Ver todos</Link>
            </div>
            {orders && Object.keys(orders.byStatus).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(orders.byStatus).map(([s, c]) => {
                  const labels: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
                  const colors: Record<string, string> = { pending: 'bg-yellow-muted', confirmed: 'bg-blue-muted', processing: 'bg-blue', shipped: 'bg-success-light', delivered: 'bg-[#48BB78]', cancelled: 'bg-danger-light' };
                  const pct = orders.total > 0 ? Math.round((c / orders.total) * 100) : 0;
                  return (<div key={s}><div className="mb-0.5 flex items-center justify-between font-body text-caption"><span className="text-steel-300">{labels[s] || s}</span><span className="font-mono text-steel-500">{c} ({pct}%)</span></div><div className="h-1.5 rounded-full bg-steel-900"><div className={`h-full rounded-full ${colors[s] || 'bg-steel-700'} transition-all`} style={{ width: `${pct}%` }} /></div></div>);
                })}
              </div>
            ) : <p className="py-4 text-center font-body text-caption text-steel-500">Sin pedidos aun</p>}
          </div>

          {/* Quick actions ecommerce */}
          <div className="flex gap-2">
            <Link href="/admin/productos/nuevo" className="card-interactive flex flex-1 items-center gap-3 p-3"><Plus className="h-4 w-4 text-blue-bright" /><span className="font-body text-body-sm text-arctic">Nuevo producto</span><ArrowRight className="ml-auto h-3 w-3 text-steel-700" /></Link>
            <Link href="/admin/reportes/ecommerce" className="card-interactive flex flex-1 items-center gap-3 p-3"><TrendingUp className="h-4 w-4 text-[#48BB78]" /><span className="font-body text-body-sm text-arctic">Reporte E-com</span><ArrowRight className="ml-auto h-3 w-3 text-steel-700" /></Link>
          </div>
        </div>

        {/* === SERVICIOS SECTION === */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-steel-900/40 pb-2">
            <Wrench className="h-5 w-5 text-yellow-bright" />
            <h2 className="font-display text-h2 uppercase text-arctic">Servicios</h2>
          </div>

          {/* Servicios KPIs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Estimado total', value: formatGs(presupuestos?.totalEstimated || 0), icon: DollarSign, color: 'text-yellow-bright', bg: 'bg-yellow-muted' },
              { label: 'Facturado', value: formatGs(presupuestos?.totalFinal || 0), icon: CheckCircle2, color: 'text-[#48BB78]', bg: 'bg-success-light' },
              { label: 'Nuevos', value: (presupuestos?.nuevos || 0).toString(), icon: FileText, color: 'text-blue-bright', bg: 'bg-blue-muted' },
              { label: 'Tasa aprobacion', value: `${presupuestos?.conversionRate || 0}%`, icon: TrendingUp, color: 'text-[#48BB78]', bg: 'bg-success-light' },
            ].map((k) => { const Icon = k.icon; return (
              <div key={k.label} className="rounded-lg border border-steel-900/30 bg-carbon p-3">
                <div className="flex items-center gap-1.5"><Icon className={`h-3.5 w-3.5 ${k.color}`} /><span className="font-body text-caption text-steel-500">{k.label}</span></div>
                <p className="mt-1 font-display text-h3 text-arctic">{k.value}</p>
              </div>
            ); })}
          </div>

          {/* Presupuesto status */}
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-h4 text-arctic">Presupuestos por estado</h3>
              <Link href="/admin/presupuestos" className="font-body text-caption text-blue-bright hover:underline">Ver todos</Link>
            </div>
            {presupuestos && presupuestos.total > 0 ? (
              <div className="space-y-2">
                {Object.entries(presupuestos.byStatus || {}).map(([s, c]) => {
                  const labels: Record<string, string> = { nuevo: 'Nuevo', en_revision: 'En revision', cotizado: 'Cotizado', aprobado: 'Aprobado', en_ejecucion: 'En ejecucion', completado: 'Completado', rechazado: 'Rechazado' };
                  const colors: Record<string, string> = { nuevo: 'bg-blue-muted', en_revision: 'bg-yellow-muted', cotizado: 'bg-yellow', aprobado: 'bg-[#48BB78]', en_ejecucion: 'bg-blue', completado: 'bg-success-light', rechazado: 'bg-danger-light' };
                  const pct = presupuestos.total > 0 ? Math.round((c / presupuestos.total) * 100) : 0;
                  return (<div key={s}><div className="mb-0.5 flex items-center justify-between font-body text-caption"><span className="text-steel-300">{labels[s] || s}</span><span className="font-mono text-steel-500">{c} ({pct}%)</span></div><div className="h-1.5 rounded-full bg-steel-900"><div className={`h-full rounded-full ${colors[s] || 'bg-steel-700'} transition-all`} style={{ width: `${pct}%` }} /></div></div>);
                })}
              </div>
            ) : <p className="py-4 text-center font-body text-caption text-steel-500">Sin presupuestos aun</p>}
          </div>

          {/* Quick actions servicios */}
          <div className="flex gap-2">
            <Link href="/admin/presupuestos" className="card-interactive flex flex-1 items-center gap-3 p-3"><Calculator className="h-4 w-4 text-yellow-bright" /><span className="font-body text-body-sm text-arctic">Nuevo presupuesto</span><ArrowRight className="ml-auto h-3 w-3 text-steel-700" /></Link>
            <Link href="/admin/reportes/servicios" className="card-interactive flex flex-1 items-center gap-3 p-3"><Wrench className="h-4 w-4 text-yellow-bright" /><span className="font-body text-body-sm text-arctic">Reporte Serv.</span><ArrowRight className="ml-auto h-3 w-3 text-steel-700" /></Link>
          </div>
        </div>
      </div>

      {/* Bottom row: Marketing summary */}
      <div className="mt-8">
        <div className="flex items-center gap-2 border-b border-steel-900/40 pb-2">
          <Users className="h-5 w-5 text-blue-bright" />
          <h2 className="font-display text-h2 uppercase text-arctic">Marketing</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link href="/admin/leads" className="card-interactive flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-muted text-blue-bright"><Users className="h-6 w-6" /></div>
            <div className="flex-1"><h3 className="font-display text-h4 text-arctic">Leads</h3><p className="font-body text-caption text-steel-500">{leads?.total || 0} total — {leads?.newLeads || 0} nuevos</p></div>
            <ArrowRight className="h-4 w-4 text-steel-500" />
          </Link>
          <Link href="/admin/analytics" className="card-interactive flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-muted text-yellow-bright"><Eye className="h-6 w-6" /></div>
            <div className="flex-1"><h3 className="font-display text-h4 text-arctic">Analytics</h3><p className="font-body text-caption text-steel-500">{analytics?.totalViews || 0} visitas — {analytics?.todayViews || 0} hoy</p></div>
            <ArrowRight className="h-4 w-4 text-steel-500" />
          </Link>
          <Link href="/" className="card-interactive flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-light text-[#48BB78]"><Eye className="h-6 w-6" /></div>
            <div className="flex-1"><h3 className="font-display text-h4 text-arctic">Ver sitio</h3><p className="font-body text-caption text-steel-500">Visitar la pagina publica</p></div>
            <ArrowRight className="h-4 w-4 text-steel-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}
