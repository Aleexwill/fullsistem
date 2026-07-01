'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Wrench, DollarSign, CheckCircle2, Clock, FileText, RefreshCw,
  ArrowLeft, Calculator, HardHat, Factory, AlertTriangle, BarChart3, Users, Star,
} from 'lucide-react';

interface PresupuestoStats {
  total: number; nuevos: number; enEjecucion: number; completedCount: number;
  approvedCount: number; conversionRate: number; totalEstimated: number; totalFinal: number;
  byStatus: Record<string, number>; byType: Record<string, number>; byPriority: Record<string, number>;
}

const formatGs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-muted', icon: FileText },
  en_revision: { label: 'En revision', color: 'bg-yellow-muted', icon: Clock },
  cotizado: { label: 'Cotizado', color: 'bg-yellow', icon: Calculator },
  aprobado: { label: 'Aprobado', color: 'bg-[#48BB78]', icon: CheckCircle2 },
  en_ejecucion: { label: 'En ejecucion', color: 'bg-blue', icon: Wrench },
  completado: { label: 'Completado', color: 'bg-success-light', icon: CheckCircle2 },
  rechazado: { label: 'Rechazado', color: 'bg-danger-light', icon: AlertTriangle },
};

const TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  mantenimiento: { label: 'Mantenimiento', icon: Wrench, color: 'bg-blue-muted' },
  civil: { label: 'Construccion civil', icon: HardHat, color: 'bg-yellow-muted' },
  metalurgica: { label: 'Metalurgica', icon: Factory, color: 'bg-success-light' },
  otro: { label: 'Otro', icon: FileText, color: 'bg-steel-700' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'bg-steel-700' },
  media: { label: 'Media', color: 'bg-yellow-muted' },
  alta: { label: 'Alta', color: 'bg-danger-light' },
  urgente: { label: 'Urgente', color: 'bg-[#FC8181]' },
};

export default function ReporteServiciosPage() {
  const [stats, setStats] = useState<PresupuestoStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/presupuestos/stats').then((r) => r.json()).then((d) => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-6 font-display text-h1 uppercase text-arctic">Reporte Servicios</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card animate-pulse p-5"><div className="h-4 w-20 rounded bg-steel-900" /><div className="mt-3 h-8 w-28 rounded bg-steel-900" /></div>)}</div>
      </div>
    );
  }

  const margin = stats && stats.totalFinal > 0 && stats.totalEstimated > 0
    ? Math.round(((stats.totalFinal - stats.totalEstimated) / stats.totalEstimated) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-h1 uppercase text-arctic">
              <Wrench className="mr-2 inline h-6 w-6 text-yellow-bright" />Reporte Servicios
            </h1>
            <p className="mt-1 font-body text-body-sm text-steel-300">Metricas exclusivas de presupuestos y servicios</p>
          </div>
        </div>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Actualizar</button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total presupuestos', value: (stats?.total || 0).toString(), icon: Calculator, color: 'text-blue-bright', bg: 'bg-blue-muted', sub: `${stats?.nuevos || 0} nuevos` },
          { label: 'Estimado total', value: formatGs(stats?.totalEstimated || 0), icon: DollarSign, color: 'text-yellow-bright', bg: 'bg-yellow-muted', sub: 'valor cotizado' },
          { label: 'Facturado', value: formatGs(stats?.totalFinal || 0), icon: CheckCircle2, color: 'text-[#48BB78]', bg: 'bg-success-light', sub: `${stats?.completedCount || 0} completados` },
          { label: 'Tasa aprobacion', value: `${stats?.conversionRate || 0}%`, icon: TrendingUp, color: 'text-[#48BB78]', bg: 'bg-success-light', sub: `${stats?.approvedCount || 0} aprobados` },
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
        {/* Status breakdown */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-h3 text-arctic"><Calculator className="h-5 w-5 text-yellow-bright" /> Por estado</h2>
            <Link href="/admin/presupuestos" className="font-body text-caption text-blue-bright hover:underline">Gestionar</Link>
          </div>
          {stats && Object.keys(stats.byStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byStatus).map(([status, count]) => {
                const cfg = STATUS_MAP[status] || { label: status, color: 'bg-steel-700', icon: FileText };
                const Icon = cfg.icon;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
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
          ) : <p className="py-8 text-center font-body text-body-sm text-steel-500">Sin presupuestos aun</p>}
        </div>

        {/* Type breakdown */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-h3 text-arctic"><Wrench className="h-5 w-5 text-blue-bright" /> Por tipo de servicio</h2>
          {stats && Object.keys(stats.byType).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.byType).sort(([, a], [, b]) => b - a).map(([type, count]) => {
                const cfg = TYPE_MAP[type] || TYPE_MAP.otro;
                const Icon = cfg.icon;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={type} className="flex items-center justify-between rounded-md bg-carbon p-3">
                    <span className="flex items-center gap-2 font-body text-body-sm text-steel-300"><div className={`flex h-7 w-7 items-center justify-center rounded ${cfg.color}`}><Icon className="h-3.5 w-3.5 text-arctic" /></div>{cfg.label}</span>
                    <div className="flex items-center gap-2"><span className="font-mono text-body-sm font-medium text-arctic">{count}</span><span className="font-mono text-caption text-steel-700">{pct}%</span></div>
                  </div>
                );
              })}
            </div>
          ) : <p className="py-8 text-center font-body text-body-sm text-steel-500">Sin datos aun</p>}
        </div>

        {/* Priority breakdown */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-h3 text-arctic"><AlertTriangle className="h-5 w-5 text-[#FC8181]" /> Por prioridad</h2>
          {stats && Object.keys(stats.byPriority).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.byPriority).map(([priority, count]) => {
                const cfg = PRIORITY_MAP[priority] || { label: priority, color: 'bg-steel-700' };
                return (
                  <div key={priority} className="flex items-center justify-between rounded-md bg-carbon p-3">
                    <span className="flex items-center gap-2 font-body text-body-sm text-steel-300"><div className={`h-3 w-3 rounded-full ${cfg.color}`} />{cfg.label}</span>
                    <div className="flex items-center gap-2"><span className="font-mono text-body-sm font-medium text-arctic">{count}</span><span className="font-mono text-caption text-steel-700">{stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%</span></div>
                  </div>
                );
              })}
            </div>
          ) : <p className="py-8 text-center font-body text-body-sm text-steel-500">Sin datos aun</p>}
        </div>

        {/* Financial summary */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-h3 text-arctic"><BarChart3 className="h-5 w-5 text-[#48BB78]" /> Resumen financiero</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-yellow-bright/20 bg-yellow-bright/5 p-4 text-center">
                <p className="font-body text-caption text-steel-500">Estimado</p>
                <p className="mt-1 font-display text-h2 text-yellow-bright">{formatGs(stats?.totalEstimated || 0)}</p>
              </div>
              <div className="rounded-lg border border-[#48BB78]/20 bg-[#48BB78]/5 p-4 text-center">
                <p className="font-body text-caption text-steel-500">Facturado</p>
                <p className="mt-1 font-display text-h2 text-[#48BB78]">{formatGs(stats?.totalFinal || 0)}</p>
              </div>
            </div>
            <div className="rounded-lg bg-carbon p-4">
              <div className="flex items-center justify-between">
                <p className="font-body text-body-sm text-steel-300">En ejecucion</p>
                <p className="font-display text-h3 text-arctic">{stats?.enEjecucion || 0}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-body text-body-sm text-steel-300">Completados</p>
                <p className="font-display text-h3 text-[#48BB78]">{stats?.completedCount || 0}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-body text-body-sm text-steel-300">Margen estimado vs. final</p>
                <p className={`font-display text-h3 ${margin >= 0 ? 'text-[#48BB78]' : 'text-[#FC8181]'}`}>{margin > 0 ? '+' : ''}{margin}%</p>
              </div>
            </div>
            <div className="rounded-lg border border-blue-bright/20 bg-blue-bright/5 p-4 text-center">
              <p className="font-body text-caption text-steel-500">Tasa de aprobacion</p>
              <p className="mt-1 font-display text-h1 text-blue-bright">{stats?.conversionRate || 0}%</p>
              <p className="mt-0.5 font-body text-caption text-steel-700">{stats?.approvedCount || 0} de {stats?.total || 0} presupuestos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
