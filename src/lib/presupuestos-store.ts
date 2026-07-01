import fs from 'fs';
import path from 'path';

export type PresupuestoStatus = 'nuevo' | 'en_revision' | 'cotizado' | 'aprobado' | 'en_ejecucion' | 'completado' | 'rechazado';
export type ServiceType = 'mantenimiento' | 'civil' | 'metalurgica' | 'otro';

export interface PresupuestoNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface Presupuesto {
  id: string;
  code: string;
  status: PresupuestoStatus;
  serviceType: ServiceType;
  serviceTitle: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
  };
  description: string;
  details: string;
  estimatedValue: number | null;
  finalValue: number | null;
  estimatedDuration: string;
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  source: string;
  notes: PresupuestoNote[];
  attachments: string[];
  assignedTo: string;
  scheduledDate: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'presupuestos.json');
function ensure() { const d = path.dirname(DATA_FILE); if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8'); }
function save(data: Presupuesto[]) { ensure(); fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8'); }

export function getAllPresupuestos(): Presupuesto[] { ensure(); return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
export function getPresupuestoById(id: string): Presupuesto | null { return getAllPresupuestos().find((p) => p.id === id) || null; }

export function createPresupuesto(data: Omit<Presupuesto, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Presupuesto {
  const all = getAllPresupuestos();
  const seq = all.length + 1;
  const p: Presupuesto = {
    ...data,
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
    code: `PRES-${String(seq).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(p);
  save(all);
  return p;
}

export function updatePresupuesto(id: string, data: Partial<Presupuesto>): Presupuesto | null {
  const all = getAllPresupuestos();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data, id: all[idx].id, code: all[idx].code, createdAt: all[idx].createdAt, updatedAt: new Date().toISOString() };
  save(all);
  return all[idx];
}

export function addNoteToPresupuesto(id: string, text: string): Presupuesto | null {
  const all = getAllPresupuestos();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx].notes.push({ id: Date.now().toString(36), text, createdAt: new Date().toISOString() });
  all[idx].updatedAt = new Date().toISOString();
  save(all);
  return all[idx];
}

export function deletePresupuesto(id: string): boolean {
  const all = getAllPresupuestos();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  all.splice(idx, 1);
  save(all);
  return true;
}

export function getPresupuestoStats() {
  const all = getAllPresupuestos();
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let totalEstimated = 0, totalFinal = 0, completedCount = 0, approvedCount = 0;

  all.forEach((p) => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byType[p.serviceType] = (byType[p.serviceType] || 0) + 1;
    byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    if (p.estimatedValue) totalEstimated += p.estimatedValue;
    if (p.finalValue) totalFinal += p.finalValue;
    if (p.status === 'completado') completedCount++;
    if (p.status === 'aprobado' || p.status === 'en_ejecucion' || p.status === 'completado') approvedCount++;
  });

  const nuevos = all.filter((p) => p.status === 'nuevo').length;
  const enEjecucion = all.filter((p) => p.status === 'en_ejecucion').length;
  const conversionRate = all.length > 0 ? Math.round((approvedCount / all.length) * 100) : 0;

  return { total: all.length, nuevos, enEjecucion, completedCount, approvedCount, conversionRate, totalEstimated, totalFinal, byStatus, byType, byPriority };
}
