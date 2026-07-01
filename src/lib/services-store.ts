import fs from 'fs';
import path from 'path';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
  image: string;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'services.json');
function ensure() { const d = path.dirname(DATA_FILE); if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8'); }
function save(data: Service[]) { ensure(); fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8'); }

export function getAllServices(): Service[] { ensure(); return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
export function getServiceById(id: string): Service | null { return getAllServices().find((s) => s.id === id) || null; }

export function createService(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Service {
  const all = getAllServices();
  const svc: Service = { ...data, id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  all.push(svc);
  save(all); return svc;
}

export function updateService(id: string, data: Partial<Service>): Service | null {
  const all = getAllServices(); const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data, id: all[idx].id, createdAt: all[idx].createdAt, updatedAt: new Date().toISOString() };
  save(all); return all[idx];
}

export function deleteService(id: string): boolean {
  const all = getAllServices(); const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return false; all.splice(idx, 1); save(all); return true;
}
