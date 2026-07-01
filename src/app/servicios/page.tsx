'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Wrench,
  HardHat,
  Factory,
  Zap,
  Droplets,
  Paintbrush,
  ShieldCheck,
  Thermometer,
  ArrowRight,
  MessageCircle,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { Isotipo } from '@/components/ui/isotipo';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';

/* ============================================================
   DATA
   ============================================================ */

type ServiceCategory = 'todos' | 'mantenimiento' | 'civil' | 'metalurgica';

const categories: { id: ServiceCategory; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'mantenimiento', label: 'Mantenimiento' },
  { id: 'civil', label: 'Construccion civil' },
  { id: 'metalurgica', label: 'Metalurgica' },
];

const ICON_MAP: Record<string, any> = { Zap, Droplets, Paintbrush, Wrench, HardHat, Factory, ShieldCheck, Thermometer };
const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  mantenimiento: { bg: 'bg-blue-muted', color: 'text-blue-bright' },
  civil: { bg: 'bg-yellow-muted', color: 'text-yellow-bright' },
  metalurgica: { bg: 'bg-success-light', color: 'text-[#48BB78]' },
};

const defaultServices = [
  { id: '1', icon: Zap, title: 'Instalaciones electricas', description: 'Instalacion, mantenimiento y reparacion de sistemas electricos.', category: 'mantenimiento' as ServiceCategory, features: ['Tableros electricos', 'Iluminacion LED', 'Puesta a tierra', 'Mantenimiento preventivo'], iconBg: 'bg-blue-muted', iconColor: 'text-blue-bright' },
  { id: '2', icon: Droplets, title: 'Plomeria e hidraulica', description: 'Reparacion de canerias, instalacion de sanitarios, bombas de agua.', category: 'mantenimiento' as ServiceCategory, features: ['Reparacion de perdidas', 'Instalacion sanitaria', 'Bombas de agua'], iconBg: 'bg-blue-muted', iconColor: 'text-blue-bright' },
  { id: '3', icon: Paintbrush, title: 'Pintura y acabados', description: 'Pintura interior y exterior, impermeabilizacion y revestimientos.', category: 'mantenimiento' as ServiceCategory, features: ['Pintura interior/exterior', 'Impermeabilizacion', 'Texturizados'], iconBg: 'bg-blue-muted', iconColor: 'text-blue-bright' },
  { id: '4', icon: HardHat, title: 'Obras nuevas', description: 'Construccion de viviendas, locales comerciales y naves industriales.', category: 'civil' as ServiceCategory, features: ['Viviendas', 'Locales comerciales', 'Galpones'], iconBg: 'bg-yellow-muted', iconColor: 'text-yellow-bright' },
  { id: '5', icon: Factory, title: 'Estructuras metalicas', description: 'Diseno, fabricacion y montaje de estructuras metalicas.', category: 'metalurgica' as ServiceCategory, features: ['Naves industriales', 'Galpones', 'Entrepisos'], iconBg: 'bg-success-light', iconColor: 'text-[#48BB78]' },
  { id: '6', icon: Factory, title: 'Herreria y soldadura', description: 'Portones, rejas, escaleras, barandas y trabajos a medida.', category: 'metalurgica' as ServiceCategory, features: ['Portones automaticos', 'Rejas de seguridad', 'Escaleras'], iconBg: 'bg-success-light', iconColor: 'text-[#48BB78]' },
];

/* ============================================================
   PAGE
   ============================================================ */

export default function ServiciosPage() {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('todos');
  const [services, setServices] = useState(defaultServices);

  useEffect(() => {
    fetch('/api/servicios-cms?active=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.services && d.services.length > 0) {
          setServices(d.services.map((s: any) => ({
            ...s,
            icon: ICON_MAP[s.icon] || Wrench,
            iconBg: CAT_STYLE[s.category]?.bg || 'bg-blue-muted',
            iconColor: CAT_STYLE[s.category]?.color || 'text-blue-bright',
          })));
        }
      })
      .catch(() => {});
  }, []);

  const filtered = activeCategory === 'todos'
    ? services
    : services.filter((s) => s.category === activeCategory);

  const whatsappUrl = formatWhatsAppUrl(
    siteConfig.whatsapp,
    'Hola, quiero consultar sobre sus servicios.'
  );

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-steel-900/40">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-steel-500">
          <Link href="/" className="hover:text-arctic">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-arctic">Servicios</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-steel-900/40 bg-gradient-hero py-16 md:py-20">
        <div className="absolute inset-0 bg-grid opacity-[0.03]" />
        <div className="container-main relative">
          <span className="overline mb-2 block">Lo que hacemos</span>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold uppercase leading-[0.95] text-arctic">
            Nuestros Servicios
          </h1>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-6 max-w-lg font-body text-body-lg text-steel-300">
            Mantenimiento, obras civiles y metalurgica para empresas y hogares.
            Presupuesto detallado sin compromiso.
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

      {/* Services Grid */}
      <section className="section">
        <div className="container-main">
          <div className="mb-6 font-body text-body-sm text-steel-500">
            Mostrando {filtered.length} servicio{filtered.length !== 1 ? 's' : ''}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.id} className="card-interactive group p-6">
                  {/* Header */}
                  <div className="mb-4 flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${service.iconBg} ${service.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-h4 text-arctic transition-colors group-hover:text-blue-bright">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mb-4 font-body text-body-sm text-steel-300 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="mb-5 space-y-1.5">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 font-body text-caption text-steel-500">
                        <span className="h-1 w-1 rounded-full bg-blue" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="flex gap-2">
                    <Link
                      href={`/contacto?tipo=presupuesto&servicio=${encodeURIComponent(service.title)}&categoria=${encodeURIComponent(service.category)}`}
                      className="btn-primary flex-1 text-[0.6rem]"
                    >
                      Cotizar
                    </Link>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost px-3 text-[#25D366] hover:bg-[#25D366]/10"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-steel-900/40 py-16">
        <div className="container-main text-center">
          <h2 className="font-display text-h2 text-arctic">
            No encontras lo que buscas?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-body text-steel-300">
            Contactanos y te ayudamos a encontrar la solucion ideal para tu proyecto.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              <MessageCircle className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
            <Link href="/contacto" className="btn-secondary">
              <Phone className="h-4 w-4" />
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
