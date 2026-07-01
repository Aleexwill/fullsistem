import Link from 'next/link';
import {
  Wrench,
  HardHat,
  Factory,
  Clock,
  Shield,
  Users,
  FileText,
  ArrowRight,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';

/* ============================================================
   TRUST BAR
   ============================================================ */

const trustItems = [
  {
    icon: Clock,
    title: 'Respuesta en 24h',
    description: 'Respondemos tu consulta en menos de 24 horas',
  },
  {
    icon: Users,
    title: 'Tecnicos verificados',
    description: 'Personal capacitado y con experiencia comprobada',
  },
  {
    icon: Wrench,
    title: 'Materiales de primera',
    description: 'Trabajamos con las mejores marcas del mercado',
  },
  {
    icon: FileText,
    title: 'Garantia por escrito',
    description: 'Todos nuestros trabajos tienen garantia documentada',
  },
];

export function TrustBar() {
  return (
    <section className="section-sm border-b border-steel-900/40">
      <div className="container-main">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-muted text-blue-bright">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-body text-body-sm font-semibold text-arctic">
                  {item.title}
                </h3>
                <p className="mt-1 hidden font-body text-caption text-steel-500 sm:block">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SERVICES SECTION
   ============================================================ */

const services = [
  {
    icon: Wrench,
    title: 'Mantenimiento general',
    description:
      'Reparaciones, instalaciones y mantenimiento preventivo para tu empresa o hogar. Electricidad, plomeria, pintura y mas.',
    href: '/servicios/mantenimiento',
    iconBg: 'bg-blue-muted',
    iconColor: 'text-blue-bright',
    count: '12 servicios',
  },
  {
    icon: HardHat,
    title: 'Construccion civil',
    description:
      'Obras nuevas, ampliaciones, refacciones y terminaciones con calidad profesional. Presupuesto detallado sin compromiso.',
    href: '/servicios/construccion-civil',
    iconBg: 'bg-yellow-muted',
    iconColor: 'text-yellow-bright',
    count: '8 servicios',
  },
  {
    icon: Factory,
    title: 'Metalurgica',
    description:
      'Estructuras metalicas, herreria, soldadura y trabajos a medida. Portones, rejas, escaleras y mas.',
    href: '/servicios/metalurgica',
    iconBg: 'bg-success-light',
    iconColor: 'text-[#48BB78]',
    count: '6 servicios',
  },
];

export function ServicesSection() {
  return (
    <section className="section">
      <div className="container-main">
        <div className="mb-12">
          <span className="overline mb-2 block">Nuestros servicios</span>
          <h2 className="font-display text-h1 uppercase text-arctic">
            Servicios profesionales
          </h2>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 max-w-lg font-body text-body text-steel-300">
            Cubrimos todas las necesidades de mantenimiento, construccion y metalurgica
            para empresas y hogares.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.title}
                href={service.href}
                className="card-interactive group p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${service.iconBg} ${service.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-h4 text-arctic transition-colors group-hover:text-blue-bright">
                      {service.title}
                    </h3>
                    <span className="font-body text-caption text-steel-500">
                      {service.count}
                    </span>
                  </div>
                </div>
                <p className="font-body text-body-sm text-steel-300 leading-relaxed">
                  {service.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 font-body text-label font-semibold uppercase tracking-[0.06em] text-blue">
                  Ver mas
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA SECTION
   ============================================================ */

export function CtaSection() {
  const whatsappUrl = formatWhatsAppUrl(
    siteConfig.whatsapp,
    'Hola, me gustaria pedir un presupuesto.'
  );

  return (
    <section className="relative overflow-hidden border-t border-steel-900/40 py-16 md:py-20">
      {/* Background accents */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 50%, #2D8FCC 0%, transparent 50%), radial-gradient(circle at 75% 50%, #D69E2E 0%, transparent 50%)',
          }}
        />
      </div>

      <div className="container-main relative text-center">
        <span className="overline mb-3 block">Contacto</span>
        <h2 className="font-display text-h1 uppercase text-arctic text-balance">
          Necesitas una cotizacion?
        </h2>
        <div className="mx-auto mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-yellow" />
        <p className="mx-auto mt-6 max-w-xl font-body text-body-lg text-steel-300">
          Contanos tu proyecto y te respondemos en menos de 24 horas con un
          presupuesto detallado y sin compromiso.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link href="/contacto" className="btn-primary px-8 py-4 text-[0.8rem]">
            <Phone className="h-4 w-4" />
            Contactar ahora
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp px-8 py-4 text-[0.8rem]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
