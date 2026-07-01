import Link from 'next/link';
import { Star } from 'lucide-react';
import { HeroSection } from '@/components/sections/hero-section';
import { TrustBar, ServicesSection, CtaSection } from '@/components/sections/services-section';
import { Isotipo } from '@/components/ui/isotipo';

/* ============================================================
   PRODUCTOS DESTACADOS
   ============================================================ */

function FeaturedProducts() {
  const products = [
    { id: 1, name: 'Taladro Percutor GSB 13RE 650W', price: 'Gs. 450.000', oldPrice: 'Gs. 540.000', brand: 'Bosch', rating: 4, reviews: 24, discount: '-15%' },
    { id: 2, name: 'Amoladora Angular DWE4120 900W', price: 'Gs. 380.000', oldPrice: null, brand: 'DeWalt', rating: 5, reviews: 18, discount: null },
    { id: 3, name: 'Set Pinturas Premium Interior 20L', price: 'Gs. 185.000', oldPrice: 'Gs. 220.000', brand: 'Sherwin', rating: 4, reviews: 12, discount: '-16%' },
    { id: 4, name: 'Kit Plomeria Profesional Completo', price: 'Gs. 290.000', oldPrice: null, brand: 'Truper', rating: 5, reviews: 8, discount: null },
  ];

  return (
    <section className="section border-t border-steel-900/40">
      <div className="container-main">
        <div className="mb-12">
          <span className="overline mb-2 block">E-commerce</span>
          <h2 className="font-display text-h1 uppercase text-arctic">
            Lo mas vendido
          </h2>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 font-body text-body text-steel-300">
            Herramientas y materiales de las mejores marcas, con envio a domicilio.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="card-interactive group overflow-hidden">
              {/* Image placeholder */}
              <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-steel-900 to-steel-700">
                <Isotipo size={64} color="#2D8FCC40" />
                {product.discount && (
                  <span className="badge-red absolute left-2 top-2">
                    {product.discount}
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <span className="font-body text-overline uppercase tracking-[0.08em] text-steel-500">
                  {product.brand}
                </span>
                <h3 className="mt-1 font-body text-body-sm font-semibold text-cloud leading-tight line-clamp-2">
                  {product.name}
                </h3>
                {/* Rating */}
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < product.rating
                          ? 'fill-yellow text-yellow'
                          : 'text-steel-700'
                      }`}
                    />
                  ))}
                  <span className="ml-1 font-body text-caption text-steel-500">
                    ({product.reviews})
                  </span>
                </div>
                {/* Price */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-[1.3rem] font-bold text-arctic">
                    {product.price}
                  </span>
                  {product.oldPrice && (
                    <span className="font-body text-body-sm text-steel-500 line-through">
                      {product.oldPrice}
                    </span>
                  )}
                </div>
                {/* CTA */}
                <button className="btn-primary mt-3 w-full text-[0.65rem]">
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/tienda" className="btn-secondary">
            Ver toda la tienda
            <span className="ml-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PORTFOLIO PREVIEW
   ============================================================ */

function PortfolioPreview() {
  const projects = [
    {
      id: 1,
      title: 'Remodelacion oficinas corporativas',
      category: 'Construccion civil',
      location: 'Asuncion',
      badge: 'blue' as const,
    },
    {
      id: 2,
      title: 'Estructura metalica nave industrial',
      category: 'Metalurgica',
      location: 'Luque',
      badge: 'green' as const,
    },
    {
      id: 3,
      title: 'Mantenimiento integral edificio',
      category: 'Mantenimiento',
      location: 'San Lorenzo',
      badge: 'yellow' as const,
    },
  ];

  const badgeClass = {
    blue: 'badge-blue',
    green: 'badge-green',
    yellow: 'badge-yellow',
  };

  return (
    <section className="section border-t border-steel-900/40">
      <div className="container-main">
        <div className="mb-12">
          <span className="overline mb-2 block">Proyectos</span>
          <h2 className="font-display text-h1 uppercase text-arctic">
            Proyectos que hablan por nosotros
          </h2>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 font-body text-body text-steel-300">
            Mira algunos de los trabajos que realizamos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="card-interactive group overflow-hidden">
              {/* Image placeholder */}
              <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-carbon to-steel-900">
                <Isotipo size={80} color="#2D8FCC15" />
                <div className="absolute inset-0 bg-blue/0 transition-colors group-hover:bg-blue/10" />
              </div>
              <div className="p-5">
                <span className={badgeClass[project.badge]}>
                  {project.category}
                </span>
                <h3 className="mt-3 font-display text-h3 text-arctic">
                  {project.title}
                </h3>
                <p className="mt-1 font-body text-body-sm text-steel-500">
                  {project.location}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/portfolio" className="btn-secondary">
            Ver portfolio completo
            <span className="ml-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */

function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      text: 'Excelente trabajo. Respondieron rapido, cumplieron los plazos y el resultado fue impecable. Totalmente recomendables.',
      author: 'Juan Perez',
      company: 'Empresa ABC',
      rating: 5,
    },
    {
      id: 2,
      text: 'Profesionales de primera. El equipo fue puntual, limpio y dejaron todo perfecto. Ya los contrate 3 veces.',
      author: 'Maria Gonzalez',
      company: 'Consultora XYZ',
      rating: 5,
    },
    {
      id: 3,
      text: 'Los mejores precios y la mejor calidad. La estructura metalica que hicieron supero nuestras expectativas.',
      author: 'Carlos Ruiz',
      company: 'Industrial DEF',
      rating: 5,
    },
  ];

  return (
    <section className="section border-t border-steel-900/40">
      <div className="container-main">
        <div className="mb-12 text-center">
          <span className="overline mb-2 block">Testimonios</span>
          <h2 className="font-display text-h1 uppercase text-arctic">
            Lo que dicen nuestros clientes
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="card p-6 text-center">
              {/* Stars */}
              <div className="mb-4 flex justify-center gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow text-yellow"
                  />
                ))}
              </div>
              <blockquote className="font-body text-body italic text-steel-300 leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>
              <div className="mt-4 border-t border-steel-900/40 pt-4">
                <cite className="font-body text-body-sm font-semibold not-italic text-arctic">
                  {testimonial.author}
                </cite>
                <p className="mt-0.5 font-body text-caption text-steel-500">
                  {testimonial.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HOME PAGE
   ============================================================ */

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <ServicesSection />
      <FeaturedProducts />
      <PortfolioPreview />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
