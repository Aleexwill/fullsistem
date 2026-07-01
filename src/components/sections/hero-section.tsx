import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingCart } from 'lucide-react';

function StatBlock({ number, label, suffix = '' }: { number: string; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-[3rem] font-bold leading-none text-arctic">
        {number}
        {suffix && <span className="text-[0.6em] text-blue">{suffix}</span>}
      </div>
      <div className="mt-1.5 font-body text-overline font-medium uppercase tracking-[0.08em] text-steel-500">
        {label}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-hero">
      {/* Grid pattern background */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#2D8FCC" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Accent lines */}
      <div
        className="absolute right-[15%] top-0 h-full w-px"
        style={{ background: 'linear-gradient(180deg, transparent, #2D8FCC20, transparent)' }}
      />
      <div
        className="absolute bottom-[20%] left-0 h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, #E8862B10, transparent)' }}
      />

      {/* Floating logo */}
      <div className="absolute right-[8%] top-[15%] hidden opacity-[0.06] lg:block">
        <Image src="/logo.png" alt="" width={350} height={350} className="object-contain" />
      </div>

      <div className="container-main relative z-10 w-full">
        <div className="max-w-[720px] py-20 md:py-28">
          {/* Status badge */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(47,133,90,0.6)]" />
            <span className="overline text-steel-300">
              Atencion inmediata disponible
            </span>
          </div>

          {/* Main heading */}
          <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-bold uppercase leading-[0.95] tracking-tight text-arctic">
            SERVICIO
            <br />
            <span className="text-blue">COMPLETO</span> Y
            <br />
            <span className="text-orange">LIMPIEZA</span> TOTAL
          </h1>

          {/* Subtitle */}
          <p className="mt-8 max-w-[520px] font-body text-body-lg text-steel-300 leading-[1.7]">
            Mantenimiento, limpieza profesional, obras civiles y metalurgica.
            Presupuesto claro, seguimiento del trabajo y garantia.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contacto?tipo=presupuesto" className="btn-primary px-8 py-4 text-[0.8rem]">
              Pedir presupuesto
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center gap-2 rounded border-[1.5px] border-steel-700 bg-transparent px-8 py-4 font-body text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-steel-100 transition-all hover:border-steel-500 hover:bg-steel-900/50"
            >
              <ShoppingCart className="h-4 w-4" />
              Tienda online
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap gap-12 border-t border-steel-900/60 pt-8">
            <StatBlock number="150" suffix="+" label="Clientes activos" />
            <StatBlock number="24h" label="Respuesta" />
            <StatBlock number="100" suffix="%" label="Garantia" />
            <StatBlock number="10" suffix="+" label="Anos experiencia" />
          </div>
        </div>
      </div>
    </section>
  );
}
