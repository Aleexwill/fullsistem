import fs from 'fs';
import path from 'path';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  year: string;
  client: string;
  image: string;
  gallery: string[];
  badge: 'blue' | 'green' | 'yellow' | 'neutral';
  size: 'small' | 'large';
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'portfolio.json');
function ensure() { const d = path.dirname(DATA_FILE); if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8'); }
function save(data: Project[]) { ensure(); fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8'); }

export function getAllProjects(): Project[] { ensure(); return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
export function getProjectById(id: string): Project | null { return getAllProjects().find((p) => p.id === id) || null; }

export function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
  const all = getAllProjects();
  const project: Project = { ...data, id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  all.push(project);
  save(all);
  return project;
}

export function updateProject(id: string, data: Partial<Project>): Project | null {
  const all = getAllProjects(); const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data, id: all[idx].id, createdAt: all[idx].createdAt, updatedAt: new Date().toISOString() };
  save(all); return all[idx];
}

export function deleteProject(id: string): boolean {
  const all = getAllProjects(); const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return false; all.splice(idx, 1); save(all); return true;
}
