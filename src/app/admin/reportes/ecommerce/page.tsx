'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle, Star, CheckCircle2,
  Clock, BarChart3, RefreshCw, ArrowLeft, Truck, XCircle, Layers, Tag,
} from 'lucide-react';

interface ProductStats {
  total: number; active: number; totalStock: number; totalValue: number;
  outOfStock: number; featured: number; categoriesCount: number; brandsCount: number;
}
interface OrderStats {
  total: number; byStatus: Record<string, number>; byPayment: Record<string, number>;
  totalRevenue: number; paidRevenue: number;
}

const formatGs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');

const ORDER_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-muted', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-muted', icon: CheckCircle2 },
  processing: { label: 'En proceso', color: 'bg-blue', icon: Package },
  shipped: { label: 'Enviado', color: 'bg-success-light', icon: Truck },
  delivered: { label: 'Entregado', color: 'bg-[#48BB78]', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-danger-light', icon: XCircle },
};

export default function ReporteEcommercePage() {
  const [products, setProducts] = useState<ProductStats | null>(null);
  const [orders, setOrders] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/productos/stats').then((r) => r.json()),
      fetch('/api/pedidos/stats').then((r) => r.json()),
    ]).then(([p, o]) => { setProducts(p); setOrders(o); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-6 font-display text-h1 uppercase text-arctic">Reporte E-Commerce</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card animate-pulse p-5"><div className="h-4 w-20 rounded bg-steel-900" /><div className="mt-3 h-8 w-28 rounded bg-steel-900" /></div>)}</div>
      </div>
    );
  }

  const pendingRevenue = (orders?.totalRevenue || 0) - (orders?.paidRevenue || 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-h1 uppercase text-arctic">
              <ShoppingCart className="mr-2 inline h-6 w-6 text-blue-bright" />Reporte E-Commerce
            </h1>
            <p className="mt-1 font-body text-body-sm text-steel-300">Metricas exclusivas de la tienda online y productos</p>
          </div>
        </div>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Actualizar</button>
      </div>

      {/* Financial KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Facturacion total', value: formatGs(orders?.totalRevenue || 0), icon: DollarSign, color: 'text-[#48BB78]', bg: 'bg-success-light', sub: `${orders?.total || 0} pedidos` },
          { label: 'Cobrado', value: formatGs(orders?.paidRevenue || 0), icon: CheckCircle2, color: 'text-[#48BB78]', bg: 'bg-success-light', sub: `${orders?.byPayment?.paid || 0} pagos` },
          { label: 'Pendiente cobro', value: formatGs(pendingRevenue), icon: Clock, color: 'text-yellow-bright', bg: 'bg-yellow-muted', sub: `${orders?.byPayment?.pending || 0} pendientes` },
          { label: 'Valor inventario', value: formatGs(products?.totalValue || 0), icon: Package, color: 'text-blue-bright', bg: 'bg-blue-muted', sub: `${products?.totalStock?.toLocaleString() || 0} unidades` },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card p-5">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${kpi.bg}`}><Icon className={`h-4 w-4 ${kpi.color}`} /></div>
                <span className="font-body text-caption uppercase tracking-[0.06em] text-steel-500">{kpi.label}</span>
              </div>
              <p className="mt-3 font-display text-h2 text-arctic">{kpi.value}</p>
              <p className="mt-0.5 font-body text-caption text-steel-700">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Orders by Status */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-h3 text-arctic"><ShoppingCart className="h-5 w-5 text-blue-bright" /> Pedidos por estado</h2>
            <Link href="/admin/pedidos" className="font-body text-caption text-blue-bright hover:underline">Gestionar</Link>
          </div>
          {orders && Object.keys(orders.byStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(orders.byStatus).map(([status, count]) => {
                const cfg = ORDER_STATUS[status] || { label: status, color: 'bg-steel-700', icon: Package };
                const Icon = cfg.icon;
                const pct = orders.total > 0 ? Math.round((count / orders.total) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between font-body text-body-sm">
                      <span className="flex items-center gap-1.5 text-steel-300"><Icon className="h-3.5 w-3.5" />{cfg.label}</span>
                      <span className="font-mono text-caption text-arctic">{count} <span className="text-steel-700">({pct}%)</span></span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-steel-900">
                      <div className={`h-full rounded-full ${cfg.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="py-8 text-center font-body text-body-sm text-steel-500">Sin pedidos registrados</p>}
        </div>

        {/* Payment breakdown */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-h3 text-arctic"><DollarSign className="h-5 w-5 text-[#48BB78]" /> Estado de pagos</h2>
          {orders && Object.keys(orders.byPayment || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(orders.byPayment).map(([status, count]) => {
                const labels: Record<string, { label: string; color: string }> = { pending: { label: 'Pendiente', color: 'bg-yellow-muted' }, paid: { label: 'Pagado', color: 'bg-[#48BB78]' }, partial: { label: 'Parcial', color: 'bg-blue-muted' }, refunded: { label: 'Reembolsado', color: 'bg-danger-light' } };
                const cfg = labels[status] || { label: status, color: 'bg-steel-700' };
                const pct = orders.total > 0 ? Math.round((count / orders.total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center justify-between rounded-md bg-carbon p-3">
                    <div className="flex items-center gap-2"><div className={`h-3 w-3 rounded-full ${cfg.color}`} /><span className="font-body text-body-sm text-steel-300">{cfg.label}</span></div>
                    <div className="flex items-center gap-2"><span className="font-mono text-body-sm font-medium text-arctic">{count}</span><span className="font-mono text-caption text-steel-700">{pct}%</span></div>
                  </div>
                );
              })}
            </div>
          ) : <p className="py-8 text-center font-body text-body-sm text-steel-500">Sin datos de pago</p>}
        </div>

        {/* Product Inventory */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-h3 text-arctic"><Package className="h-5 w-5 text-blue-bright" /> Inventario</h2>
            <Link href="/admin/productos" className="font-body text-caption text-blue-bright hover:underline">Gestionar</Link>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Total productos', value: (products?.total || 0).toString(), icon: Package, color: 'text-blue-bright' },
              { label: 'Activos', value: (products?.active || 0).toString(), icon: CheckCircle2, color: 'text-[#48BB78]' },
              { label: 'Stock total', value: (products?.totalStock || 0).toLocaleString() + ' u.', icon: Layers, color: 'text-blue-bright' },
              { label: 'Sin stock', value: (products?.outOfStock || 0).toString(), icon: AlertTriangle, color: (products?.outOfStock || 0) > 0 ? 'text-[#FC8181]' : 'text-steel-500' },
              { label: 'Destacados', value: (products?.featured || 0).toString(), icon: Star, color: 'text-yellow-bright' },
              { label: 'Categorias', value: (products?.categoriesCount || 0).toString(), icon: Layers, color: 'text-steel-300' },
              { label: 'Marcas', value: (products?.brandsCount || 0).toString(), icon: Tag, color: 'text-steel-300' },
            ].map((item) => { const Icon = item.icon; return (
              <div key={item.label} className="flex items-center justify-between rounded-md bg-carbon p-3">
                <span className="flex items-center gap-2 font-body text-body-sm text-steel-300"><Icon className={`h-3.5 w-3.5 ${item.color}`} />{item.label}</span>
                <span className="font-mono text-body-sm font-medium text-arctic">{item.value}</span>
              </div>
            ); })}
          </div>
        </div>

        {/* Financial summary card */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-h3 text-arctic"><BarChart3 className="h-5 w-5 text-yellow-bright" /> Resumen financiero</h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-carbon p-4">
              <p className="font-body text-caption uppercase text-steel-500">Facturacion total</p>
              <p className="mt-1 font-display text-h1 text-arctic">{formatGs(orders?.totalRevenue || 0)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#48BB78]/20 bg-[#48BB78]/5 p-3 text-center">
                <p className="font-body text-caption text-steel-500">Cobrado</p>
                <p className="mt-1 font-display text-h3 text-[#48BB78]">{formatGs(orders?.paidRevenue || 0)}</p>
              </div>
              <div className="rounded-lg border border-yellow-bright/20 bg-yellow-bright/5 p-3 text-center">
                <p className="font-body text-caption text-steel-500">Pendiente</p>
                <p className="mt-1 font-display text-h3 text-yellow-bright">{formatGs(pendingRevenue)}</p>
              </div>
            </div>
            <div className="rounded-lg bg-carbon p-4">
              <p className="font-body text-caption uppercase text-steel-500">Valor total inventario</p>
              <p className="mt-1 font-display text-h2 text-arctic">{formatGs(products?.totalValue || 0)}</p>
              <p className="mt-0.5 font-body text-caption text-steel-700">{products?.totalStock?.toLocaleString() || 0} unidades en {products?.categoriesCount || 0} categorias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
