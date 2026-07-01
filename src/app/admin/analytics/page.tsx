'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Eye, TrendingUp, Clock, Globe, ArrowUp, RefreshCw, Monitor } from 'lucide-react';

interface Analytics {
  totalViews: number; todayViews: number; weekViews: number; maxDailyViews: number;
  topPages: { path: string; count: number; pct: number }[];
  dailyViews: { date: string; count: number }[];
  hourly: number[];
  topReferrers: { referrer: string; count: number }[];
}

const PAGE_NAMES: Record<string, string> = {
  '/': 'Inicio', '/servicios': 'Servicios', '/tienda': 'Tienda',
  '/portfolio': 'Portfolio', '/contacto': 'Contacto', '/admin': 'Admin',
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    fetch('/api/analytics').then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  if (loading || !data) return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-6 font-display text-h1 uppercase text-arctic">Analytics</h1>
      <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse p-5"><div className="h-4 w-20 rounded bg-steel-900" /><div className="mt-3 h-8 w-16 rounded bg-steel-900" /></div>)}</div>
    </div>
  );

  const maxHourly = Math.max(...data.hourly, 1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-display text-h1 uppercase text-arctic">Analytics</h1><p className="mt-1 font-body text-body-sm text-steel-300">Estadisticas de visitas del sitio</p></div>
        <button onClick={refresh} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Actualizar</button>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Total visitas', value: data.totalViews.toLocaleString(), icon: Eye, color: 'text-blue-bright', bg: 'bg-blue-muted' },
          { label: 'Hoy', value: data.todayViews.toLocaleString(), icon: TrendingUp, color: 'text-[#48BB78]', bg: 'bg-success-light' },
          { label: 'Ultimos 7 dias', value: data.weekViews.toLocaleString(), icon: BarChart3, color: 'text-yellow-bright', bg: 'bg-yellow-muted' },
        ].map((kpi) => { const Icon = kpi.icon; return (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-center gap-2"><div className={`flex h-8 w-8 items-center justify-center rounded-md ${kpi.bg}`}><Icon className={`h-4 w-4 ${kpi.color}`} /></div><span className="font-body text-caption uppercase tracking-[0.06em] text-steel-500">{kpi.label}</span></div>
            <p className="mt-3 font-display text-[2rem] text-arctic">{kpi.value}</p>
          </div>
        ); })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily chart */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-h3 text-arctic"><BarChart3 className="h-5 w-5 text-blue-bright" /> Visitas diarias (7 dias)</h2>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {data.dailyViews.map((d) => {
              const h = data.maxDailyViews > 0 ? (d.count / data.maxDailyViews) * 100 : 0;
              const dayName = DAY_NAMES[new Date(d.date + 'T12:00:00').getDay()];
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-mono text-[0.55rem] text-arctic">{d.count}</span>
                  <div className="w-full rounded-t bg-blue transition-all hover:bg-blue-bright" style={{ height: `${Math.max(h, 4)}%` }} />
                  <span className="font-body text-[0.55rem] text-steel-700">{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly chart */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-h3 text-arctic"><Clock className="h-5 w-5 text-yellow-bright" /> Distribucion horaria (hoy)</h2>
          <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
            {data.hourly.map((count, h) => {
              const pct = maxHourly > 0 ? (count / maxHourly) * 100 : 0;
              return (
                <div key={h} className="flex flex-1 flex-col items-center gap-1">
                  {count > 0 && <span className="font-mono text-[0.45rem] text-steel-500">{count}</span>}
                  <div className="w-full rounded-t bg-yellow-muted transition-all hover:bg-yellow" style={{ height: `${Math.max(pct, 2)}%` }} />
                  {h % 4 === 0 && <span className="font-mono text-[0.45rem] text-steel-700">{h}h</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Top pages */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-h3 text-arctic"><Monitor className="h-5 w-5 text-blue-bright" /> Paginas mas visitadas</h2>
          {data.topPages.length === 0 ? (
            <p className="py-6 text-center font-body text-body-sm text-steel-500">Sin datos aun</p>
          ) : (
            <div className="space-y-3">
              {data.topPages.map((p) => (
                <div key={p.path}>
                  <div className="mb-1 flex items-center justify-between font-body text-body-sm">
                    <span className="text-arctic">{PAGE_NAMES[p.path] || p.path}</span>
                    <span className="font-mono text-caption text-steel-500">{p.count} ({p.pct}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-steel-900">
                    <div className="h-full rounded-full bg-blue transition-all" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referrers */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-h3 text-arctic"><Globe className="h-5 w-5 text-[#48BB78]" /> Fuentes de trafico</h2>
          {data.topReferrers.length === 0 ? (
            <p className="py-6 text-center font-body text-body-sm text-steel-500">Sin datos aun</p>
          ) : (
            <div className="space-y-2">
              {data.topReferrers.map((r) => (
                <div key={r.referrer} className="flex items-center justify-between rounded-md bg-carbon p-3">
                  <span className="truncate font-body text-body-sm text-steel-300">{r.referrer}</span>
                  <span className="font-mono text-body-sm font-medium text-arctic">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
