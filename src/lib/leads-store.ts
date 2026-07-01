import fs from 'fs';
import path from 'path';

export type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'quoted' | 'negotiation' | 'converted' | 'lost';
export type LeadSource = 'contact_form' | 'whatsapp' | 'phone' | 'referral' | 'walk_in' | 'social_media' | 'website' | 'other';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityType = 'note' | 'status_change' | 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'system';

export interface Activity {
  id: string;
  type: ActivityType;
  text: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface LeadTask {
  id: string;
  text: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    position: string;
    avatar: string;
  };
  subject: string;
  message: string;
  serviceInterest: string;
  estimatedValue: number | null;
  tags: string[];
  activities: Activity[];
  tasks: LeadTask[];
  notes: { id: string; text: string; createdAt: string }[];
  assignedTo: string;
  lastContactedAt: string;
  nextFollowUp: string;
  lostReason: string;
  leadType: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'leads.json');

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

function save(leads: Lead[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

function migrateOldLead(l: any): Lead {
  return {
    ...l,
    customer: {
      name: l.customer?.name || '',
      email: l.customer?.email || '',
      phone: l.customer?.phone || '',
      company: l.customer?.company || '',
      position: l.customer?.position || '',
      avatar: l.customer?.avatar || '',
    },
    tags: l.tags || [],
    activities: l.activities || [],
    tasks: l.tasks || [],
    notes: l.notes || [],
    lastContactedAt: l.lastContactedAt || '',
    nextFollowUp: l.nextFollowUp || '',
    lostReason: l.lostReason || '',
    leadType: l.leadType || 'general',
  };
}

export function getAllLeads(): Lead[] {
  ensureDataFile();
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  return raw.map(migrateOldLead);
}

export function getLeadById(id: string): Lead | null {
  return getAllLeads().find((l) => l.id === id) || null;
}

export function createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
  const leads = getAllLeads();
  const lead: Lead = {
    ...data,
    customer: {
      name: data.customer?.name || '',
      email: data.customer?.email || '',
      phone: data.customer?.phone || '',
      company: data.customer?.company || '',
      position: data.customer?.position || '',
      avatar: data.customer?.avatar || '',
    },
    tags: data.tags || [],
    activities: [
      { id: Date.now().toString(36), type: 'system', text: 'Lead creado', createdAt: new Date().toISOString() },
      ...(data.activities || []),
    ],
    tasks: data.tasks || [],
    notes: data.notes || [],
    lastContactedAt: data.lastContactedAt || '',
    nextFollowUp: data.nextFollowUp || '',
    lostReason: data.lostReason || '',
    leadType: data.leadType || 'general',
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  leads.push(lead);
  save(leads);
  return lead;
}

export function updateLead(id: string, data: Partial<Lead>): Lead | null {
  const leads = getAllLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  const old = leads[idx];
  if (data.status && data.status !== old.status) {
    const act: Activity = {
      id: Date.now().toString(36) + 'sc',
      type: 'status_change',
      text: `Estado cambiado de "${old.status}" a "${data.status}"`,
      metadata: { from: old.status, to: data.status },
      createdAt: new Date().toISOString(),
    };
    old.activities = [...(old.activities || []), act];
  }

  leads[idx] = { ...old, ...data, id: old.id, createdAt: old.createdAt, activities: old.activities, updatedAt: new Date().toISOString() };
  save(leads);
  return leads[idx];
}

export function addActivityToLead(id: string, type: ActivityType, text: string, metadata?: Record<string, string>): Lead | null {
  const leads = getAllLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const act: Activity = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5), type, text, metadata, createdAt: new Date().toISOString() };
  leads[idx].activities = [...(leads[idx].activities || []), act];
  if (type === 'call' || type === 'email' || type === 'whatsapp' || type === 'meeting') {
    leads[idx].lastContactedAt = new Date().toISOString();
  }
  leads[idx].updatedAt = new Date().toISOString();
  save(leads);
  return leads[idx];
}

export function addNoteToLead(id: string, text: string): Lead | null {
  const leads = getAllLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const note = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), text, createdAt: new Date().toISOString() };
  leads[idx].notes.push(note);
  const act: Activity = { id: note.id + 'a', type: 'note', text: `Nota: ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`, createdAt: new Date().toISOString() };
  leads[idx].activities = [...(leads[idx].activities || []), act];
  leads[idx].updatedAt = new Date().toISOString();
  save(leads);
  return leads[idx];
}

export function addTaskToLead(id: string, text: string, dueDate: string): Lead | null {
  const leads = getAllLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const task: LeadTask = { id: Date.now().toString(36), text, dueDate, completed: false, createdAt: new Date().toISOString() };
  leads[idx].tasks = [...(leads[idx].tasks || []), task];
  const act: Activity = { id: task.id + 'ta', type: 'task', text: `Tarea creada: ${text}`, createdAt: new Date().toISOString() };
  leads[idx].activities = [...(leads[idx].activities || []), act];
  leads[idx].updatedAt = new Date().toISOString();
  save(leads);
  return leads[idx];
}

export function toggleTask(id: string, taskId: string): Lead | null {
  const leads = getAllLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const tIdx = (leads[idx].tasks || []).findIndex((t) => t.id === taskId);
  if (tIdx === -1) return null;
  leads[idx].tasks[tIdx].completed = !leads[idx].tasks[tIdx].completed;
  leads[idx].updatedAt = new Date().toISOString();
  save(leads);
  return leads[idx];
}

export function deleteLead(id: string): boolean {
  const leads = getAllLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  leads.splice(idx, 1);
  save(leads);
  return true;
}

export function getLeadStats() {
  const leads = getAllLeads();
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const valueByStatus: Record<string, number> = {};
  let totalEstimated = 0;

  leads.forEach((l) => {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    bySource[l.source] = (bySource[l.source] || 0) + 1;
    byPriority[l.priority] = (byPriority[l.priority] || 0) + 1;
    if (l.estimatedValue) {
      totalEstimated += l.estimatedValue;
      valueByStatus[l.status] = (valueByStatus[l.status] || 0) + l.estimatedValue;
    }
  });

  const newLeads = leads.filter((l) => l.status === 'new').length;
  const converted = leads.filter((l) => l.status === 'converted').length;
  const lost = leads.filter((l) => l.status === 'lost').length;
  const conversionRate = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

  return { total: leads.length, newLeads, converted, lost, conversionRate, totalEstimated, byStatus, bySource, byPriority, valueByStatus };
}
