import fs from 'fs';
import path from 'path';

export interface PageView {
  path: string;
  timestamp: string;
  referrer: string;
  userAgent: string;
}

export interface AnalyticsData {
  totalViews: number;
  todayViews: number;
  pageViews: PageView[];
}

const DATA_FILE = path.join(process.cwd(), 'data', 'analytics.json');
function ensure() {
  const d = path.dirname(DATA_FILE);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ views: [] }, null, 2), 'utf-8');
}

function readViews(): PageView[] {
  ensure();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  return data.views || [];
}

function saveViews(views: PageView[]) {
  ensure();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ views }, null, 2), 'utf-8');
}

export function trackPageView(pathName: string, referrer: string = '', userAgent: string = ''): void {
  const views = readViews();
  views.push({ path: pathName, timestamp: new Date().toISOString(), referrer, userAgent });
  // Keep last 10000 views to avoid file growing too large
  if (views.length > 10000) views.splice(0, views.length - 10000);
  saveViews(views);
}

export function getAnalytics() {
  const views = readViews();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayViews = views.filter((v) => v.timestamp.startsWith(todayStr)).length;
  const weekViews = views.filter((v) => new Date(v.timestamp) >= weekAgo).length;

  // Page popularity
  const pageCounts: Record<string, number> = {};
  views.forEach((v) => { pageCounts[v.path] = (pageCounts[v.path] || 0) + 1; });
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count, pct: views.length > 0 ? Math.round((count / views.length) * 100) : 0 }));

  // Daily views for last 7 days
  const dailyViews: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const count = views.filter((v) => v.timestamp.startsWith(dateStr)).length;
    dailyViews.push({ date: dateStr, count });
  }

  // Hourly distribution today
  const hourly: number[] = new Array(24).fill(0);
  views.filter((v) => v.timestamp.startsWith(todayStr)).forEach((v) => {
    const h = new Date(v.timestamp).getHours();
    hourly[h]++;
  });

  // Referrer stats
  const refCounts: Record<string, number> = {};
  views.forEach((v) => {
    const ref = v.referrer || 'Directo';
    refCounts[ref] = (refCounts[ref] || 0) + 1;
  });
  const topReferrers = Object.entries(refCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([referrer, count]) => ({ referrer, count }));

  return {
    totalViews: views.length,
    todayViews,
    weekViews,
    topPages,
    dailyViews,
    hourly,
    topReferrers,
    maxDailyViews: Math.max(...dailyViews.map((d) => d.count), 1),
  };
}
