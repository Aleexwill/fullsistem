import fs from 'fs';
import path from 'path';

export interface SiteSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    logo: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    city: string;
    whatsapp: string;
    mapUrl: string;
  };
  social: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    tiktok: string;
  };
  business: {
    openingHours: {
      weekdays: string;
      saturday: string;
      sunday: string;
    };
    currency: string;
    taxRate: number;
    shippingBase: number;
    freeShippingThreshold: number;
  };
  notifications: {
    emailOnNewOrder: boolean;
    emailOnNewLead: boolean;
    whatsappOnNewOrder: boolean;
    adminEmail: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    googleAnalyticsId: string;
    metaPixelId: string;
  };
}

const DATA_FILE = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    siteName: 'Full Service & Clean',
    siteDescription: 'Mantenimiento, Limpieza y Servicios Profesionales',
    siteUrl: 'http://localhost:3000',
    logo: '',
  },
  contact: {
    phone: '+595 971 528 800',
    email: 'info@fullserviceandclean.com.py',
    address: 'Av. Principal 1234',
    city: 'Asuncion, Paraguay',
    whatsapp: '+595971528800',
    mapUrl: '',
  },
  social: {
    facebook: 'https://facebook.com/fullserviceandclean',
    instagram: 'https://instagram.com/fullserviceandclean',
    linkedin: '',
    youtube: '',
    tiktok: '',
  },
  business: {
    openingHours: {
      weekdays: 'Lunes a Viernes: 07:00 - 18:00',
      saturday: 'Sabados: 07:00 - 12:00',
      sunday: 'Domingos: Cerrado',
    },
    currency: 'PYG',
    taxRate: 10,
    shippingBase: 25000,
    freeShippingThreshold: 500000,
  },
  notifications: {
    emailOnNewOrder: true,
    emailOnNewLead: true,
    whatsappOnNewOrder: false,
    adminEmail: 'admin@fullserviceandclean.com.py',
  },
  seo: {
    metaTitle: 'Full Service & Clean — Mantenimiento, Limpieza y Servicios',
    metaDescription: 'Soluciones integrales en mantenimiento, limpieza y servicios profesionales en Paraguay.',
    ogImage: '',
    googleAnalyticsId: '',
    metaPixelId: '',
  },
};

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
  }
}

export function getSettings(): SiteSettings {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const saved = JSON.parse(raw);
  // Merge with defaults to handle new fields
  return deepMerge(DEFAULT_SETTINGS, saved);
}

export function updateSettings(data: Partial<SiteSettings>): SiteSettings {
  const current = getSettings();
  const updated = deepMerge(current, data);
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}
