import fs from 'fs';
import path from 'path';

export interface SiteContent {
  hero: {
    badge: string;
    title: string;
    highlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: { value: string; label: string }[];
  };
  about: {
    title: string;
    description: string;
    image: string;
    values: { title: string; description: string }[];
  };
  testimonials: {
    id: string;
    name: string;
    role: string;
    company: string;
    text: string;
    rating: number;
    avatar: string;
    isActive: boolean;
  }[];
  banners: {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    link: string;
    position: string;
    isActive: boolean;
  }[];
  branding: {
    logo: string;
    logoWhite: string;
    favicon: string;
    ogImage: string;
    primaryColor: string;
    accentColor: string;
  };
  footer: {
    description: string;
    copyright: string;
  };
}

const DATA_FILE = path.join(process.cwd(), 'data', 'content.json');

const DEFAULT_CONTENT: SiteContent = {
  hero: {
    badge: 'Soluciones integrales',
    title: 'Ingenieria',
    highlight: 'Construccion & Servicios',
    subtitle: 'Brindamos soluciones profesionales en construccion civil, metalurgica, mantenimiento industrial y ferreteria especializada.',
    ctaPrimary: 'Solicitar presupuesto',
    ctaSecondary: 'Ver servicios',
    stats: [
      { value: '+150', label: 'Proyectos' },
      { value: '+12', label: 'Anos' },
      { value: '98%', label: 'Satisfaccion' },
    ],
  },
  about: {
    title: 'Sobre Full Service & Clean',
    description: 'Somos una empresa paraguaya dedicada a brindar soluciones integrales en mantenimiento, limpieza y servicios profesionales.',
    image: '',
    values: [
      { title: 'Calidad', description: 'Materiales de primera y mano de obra certificada' },
      { title: 'Compromiso', description: 'Cumplimos plazos y presupuestos acordados' },
      { title: 'Experiencia', description: 'Mas de 12 anos en el mercado paraguayo' },
    ],
  },
  testimonials: [],
  banners: [],
  branding: {
    logo: '',
    logoWhite: '',
    favicon: '',
    ogImage: '',
    primaryColor: '#2D8FCC',
    accentColor: '#D69E2E',
  },
  footer: {
    description: 'Soluciones integrales en mantenimiento, limpieza y servicios profesionales.',
    copyright: '© 2026 Full Service & Clean. Todos los derechos reservados.',
  },
};

function ensure() {
  const d = path.dirname(DATA_FILE);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf-8');
}

function deepMerge(target: any, source: any): any {
  const out = { ...target };
  for (const k of Object.keys(source)) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      out[k] = deepMerge(target[k] || {}, source[k]);
    } else if (source[k] !== undefined) { out[k] = source[k]; }
  }
  return out;
}

export function getContent(): SiteContent {
  ensure();
  return deepMerge(DEFAULT_CONTENT, JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')));
}

export function updateContent(data: Partial<SiteContent>): SiteContent {
  const current = getContent();
  const updated = deepMerge(current, data);
  // Handle arrays explicitly
  if (data.testimonials !== undefined) updated.testimonials = data.testimonials;
  if (data.banners !== undefined) updated.banners = data.banners;
  if (data.hero?.stats !== undefined) updated.hero.stats = data.hero.stats;
  if (data.about?.values !== undefined) updated.about.values = data.about.values;
  ensure();
  fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
