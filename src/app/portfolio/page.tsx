'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  MapPin,
  Calendar,
  ArrowRight,
  MessageCircle,
  Eye,
} from 'lucide-react';
import { Isotipo } from '@/components/ui/isotipo';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';

/* ============================================================
   DATA
   ============================================================ */

type ProjectCategory = 'todos' | 'civil' | 'metalurgica' | 'mantenimiento';

const categories: { id: ProjectCategory; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'civil', label: 'Construccion civil' },
  { id: 'metalurgica', label: 'Metalurgica' },
  { id: 'mantenimiento', label: 'Mantenimiento' },
];

// Hardcoded fallback projects (used when API has no data yet)
const defaultProjects = [
  { id: '1', title: 'Remodelacion completa oficinas corporativas', description: 'Remodelacion integral de 800m2 de oficinas. Incluyo demolicion parcial, nueva distribucion, instalacion electrica, pintura y acabados.', category: 'civil', location: 'Asuncion, Paraguay', duration: '3 meses', year: '2025', client: 'Empresa multinacional', badge: 'blue', size: 'large', image: '' },
  { id: '2', title: 'Nave industrial 1200m2', description: 'Diseno, fabricacion y montaje de estructura metalica para nave industrial. Incluyo cubierta, cerramientos laterales y portones.', category: 'metalurgica', location: 'Luque, Paraguay', duration: '4 meses', year: '2025', client: 'Industria alimenticia', badge: 'green', size: 'large', image: '' },
  { id: '3', title: 'Mantenimiento preventivo edificio comercial', description: 'Contrato anual de mantenimiento preventivo para edificio de 12 pisos.', category: 'mantenimiento', location: 'San Lorenzo, Paraguay', duration: '12 meses', year: '2024-2025', client: 'Administracion de edificio', badge: 'yellow', size: 'normal', image: '' },
  { id: '4', title: 'Portones automaticos residenciales', description: 'Fabricacion e instalacion de portones corredizos automaticos para conjunto residencial de 24 unidades.', category: 'metalurgica', location: 'Lambare, Paraguay', duration: '2 meses', year: '2025', client: 'Constructora residencial', badge: 'green', size: 'normal', image: '' },
  { id: '5', title: 'Construccion vivienda minimalista', description: 'Construccion llave en mano de vivienda unifamiliar de 180m2.', category: 'civil', location: 'Fernando de la Mora', duration: '6 meses', year: '2024', client: 'Propietario particular', badge: 'blue', size: 'large', image: '' },
  { id: '6', title: 'Instalacion electrica completa fabrica', description: 'Instalacion de tablero principal, sub-tableros, cableado industrial, iluminacion LED.', category: 'mantenimiento', location: 'Capiatá, Paraguay', duration: '1 mes', year: '2025', client: 'Fabrica textil', badge: 'yellow', size: 'normal', image: '' },
];

const badgeClass = {
  blue: 'badge-blue',
  green: 'badge-green',
  yellow: 'badge-yellow',
};

const categoryLabel: Record<ProjectCategory, string> = {
  todos: 'Todos',
  civil: 'Construccion civil',
  metalurgica: 'Metalurgica',
  mantenimiento: 'Mantenimiento',
};

/* ============================================================
   PAGE
   ============================================================ */

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('todos');
  const [projects, setProjects] = useState(defaultProjects);

  useEffect(() => {
    fetch('/api/portfolio?active=true')
      .then((r) => r.json())
      .then((d) => { if (d.projects && d.projects.length > 0) setProjects(d.projects); })
      .catch(() => {});
  }, []);

  const filtered = activeCategory === 'todos'
    ? projects
    : projects.filter((p) => p.category === activeCategory);

  const whatsappUrl = formatWhatsAppUrl(
    siteConfig.whatsapp,
    'Hola, vi su portfolio y me gustaria consultar sobre un proyecto similar.'
  );

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-steel-900/40">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-steel-500">
          <Link href="/" className="hover:text-arctic">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-arctic">Portfolio</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-steel-900/40 bg-gradient-hero py-16 md:py-20">
        <div className="absolute inset-0 bg-grid opacity-[0.03]" />
        <div className="container-main relative">
          <span className="overline mb-2 block">Nuestro trabajo</span>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold uppercase leading-[0.95] text-arctic">
            Portfolio de Proyectos
          </h1>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-6 max-w-lg font-body text-body-lg text-steel-300">
            Mira los trabajos que realizamos. Cada proyecto refleja nuestro
            compromiso con la calidad y el profesionalismo.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[60px] z-40 border-b border-steel-900/40 bg-carbon/95 backdrop-blur-lg">
        <div className="container-main flex gap-1 overflow-x-auto py-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap rounded px-5 py-2.5 font-body text-[0.75rem] font-medium uppercase tracking-[0.04em] transition-all ${
                activeCategory === cat.id
                  ? 'bg-steel-900 text-arctic'
                  : 'text-steel-500 hover:text-arctic'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Projects Grid */}
      <section className="section">
        <div className="container-main">
          <div className="mb-6 font-body text-body-sm text-steel-500">
            {filtered.length} proyecto{filtered.length !== 1 ? 's' : ''}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <div
                key={project.id}
                className={`card-interactive group overflow-hidden ${
                  project.size === 'large' ? 'md:col-span-1 lg:row-span-1' : ''
                }`}
              >
                {/* Image */}
                <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-carbon to-steel-900">
                  <Isotipo size={80} color="#2D8FCC10" />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-blue/0 opacity-0 transition-all group-hover:bg-blue/20 group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-arctic/10 backdrop-blur">
                      <Eye className="h-5 w-5 text-arctic" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <span className={badgeClass[project.badge]}>
                    {categoryLabel[project.category]}
                  </span>

                  <h3 className="mt-3 font-display text-h3 text-arctic leading-tight">
                    {project.title}
                  </h3>

                  <p className="mt-2 font-body text-body-sm text-steel-300 leading-relaxed line-clamp-2">
                    {project.description}
                  </p>

                  {/* Meta */}
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-steel-900/40 pt-4">
                    <div className="flex items-center gap-1.5 font-body text-caption text-steel-500">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </div>
                    <div className="flex items-center gap-1.5 font-body text-caption text-steel-500">
                      <Calendar className="h-3 w-3" />
                      {project.duration} · {project.year}
                    </div>
                  </div>

                  {/* Client */}
                  <p className="mt-2 font-body text-caption text-steel-500">
                    Cliente: <span className="text-steel-300">{project.client}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-steel-900/40 py-16">
        <div className="container-main text-center">
          <h2 className="font-display text-h2 text-arctic">
            Tenes un proyecto similar?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-body text-steel-300">
            Contanos que necesitas y te preparamos un presupuesto personalizado.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/presupuesto" className="btn-primary">
              Pedir presupuesto
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
