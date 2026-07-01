'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Star,
  ShoppingCart,
  ChevronRight,
  Truck,
  ShieldCheck,
  CreditCard,
  Package,
} from 'lucide-react';
import { Isotipo } from '@/components/ui/isotipo';

/* ============================================================
   TYPES
   ============================================================ */

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  shortDescription: string;
}

/* ============================================================
   STATIC DATA
   ============================================================ */

const categorias = [
  { id: 'herramientas', name: 'Herramientas', icon: '🔧', color: 'from-blue-deep to-blue' },
  { id: 'electricidad', name: 'Electricidad', icon: '⚡', color: 'from-yellow-muted to-yellow' },
  { id: 'plomeria', name: 'Plomeria', icon: '🔩', color: 'from-blue-muted to-blue' },
  { id: 'pinturas', name: 'Pinturas', icon: '🎨', color: 'from-success-light to-success' },
  { id: 'fijaciones', name: 'Fijaciones', icon: '🔨', color: 'from-steel-900 to-steel-700' },
  { id: 'seguridad', name: 'Seguridad', icon: '🛡️', color: 'from-danger-light to-danger' },
];

function formatGs(n: number) {
  return 'Gs. ' + n.toLocaleString('es-PY');
}

/* ============================================================
   PAGE
   ============================================================ */

export default function TiendaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products from API
  useEffect(() => {
    fetch('/api/productos?active=true')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-steel-900/40">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-steel-500">
          <Link href="/" className="hover:text-arctic">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-arctic">Tienda</span>
        </div>
      </div>

      {/* Hero + Search */}
      <section className="border-b border-steel-900/40 bg-gradient-hero py-12">
        <div className="container-main">
          <span className="overline mb-2 block">Ferreteria online</span>
          <h1 className="font-display text-h1 uppercase text-arctic">Nuestra Tienda</h1>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 max-w-lg font-body text-body text-steel-300">
            Todo lo que necesitas para tu obra o reparacion, con envio a domicilio.
          </p>

          {/* Search bar */}
          <div className="relative mt-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
            <input
              type="text"
              placeholder="Buscar productos, marcas, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-11 pr-4"
            />
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="section-sm border-b border-steel-900/40">
        <div className="container-main">
          <h2 className="mb-6 font-display text-h3 text-arctic">Categorias</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categorias.map((cat) => (
              <Link
                key={cat.id}
                href={`/tienda/${cat.id}`}
                className="card-interactive group overflow-hidden"
              >
                <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${cat.color}`}>
                  <span className="text-3xl transition-transform group-hover:scale-110">{cat.icon}</span>
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-display text-h4 text-arctic">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-steel-900/40 bg-carbon-light py-4">
        <div className="container-main flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { icon: Truck, text: 'Envio a todo el pais' },
            { icon: ShieldCheck, text: 'Garantia oficial' },
            { icon: CreditCard, text: 'Pago seguro' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-blue" />
              <span className="font-body text-body-sm text-steel-300">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="section">
        <div className="container-main">
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="font-body text-body-sm text-steel-500">
              {sorted.length} producto{sorted.length !== 1 ? 's' : ''}
              {searchTerm && ` para "${searchTerm}"`}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input max-w-[200px] py-2 text-body-sm"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="rating">Mejor valorados</option>
              </select>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card animate-pulse overflow-hidden">
                  <div className="h-44 bg-steel-900" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-16 rounded bg-steel-800" />
                    <div className="h-4 w-full rounded bg-steel-800" />
                    <div className="h-4 w-2/3 rounded bg-steel-800" />
                    <div className="h-8 w-24 rounded bg-steel-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-steel-700" />
              <h3 className="mt-4 font-display text-h3 text-arctic">
                {searchTerm ? 'Sin resultados' : 'Catalogo vacio'}
              </h3>
              <p className="mt-2 font-body text-body-sm text-steel-500">
                {searchTerm
                  ? `No se encontraron productos para "${searchTerm}".`
                  : 'Aun no hay productos en el catalogo. El administrador debe cargar productos desde el panel de admin.'}
              </p>
              {!searchTerm && (
                <Link href="/admin/productos/nuevo" className="btn-primary mt-6 inline-flex">
                  Ir al panel de admin
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {sorted.map((product) => {
                const discount =
                  product.compareAtPrice && product.compareAtPrice > product.price
                    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
                    : 0;

                return (
                  <div key={product.id} className="card-interactive group overflow-hidden">
                    {/* Image */}
                    <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-steel-900 to-steel-700">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Isotipo size={56} color="#2D8FCC20" />
                      )}
                      <div className="absolute left-2 top-2 flex gap-1">
                        {discount > 0 && <span className="badge-red">-{discount}%</span>}
                        {product.isFeatured && <span className="badge-blue">Destacado</span>}
                      </div>
                      {product.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-carbon/70">
                          <span className="badge-neutral">Sin stock</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <span className="font-body text-overline uppercase tracking-[0.08em] text-steel-500">
                        {product.brand}
                      </span>
                      <h3 className="mt-1 min-h-[2.5rem] font-body text-body-sm font-semibold leading-tight text-cloud line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Rating */}
                      {product.reviewCount > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(product.rating)
                                  ? 'fill-yellow text-yellow'
                                  : 'text-steel-700'
                              }`}
                            />
                          ))}
                          <span className="ml-1 font-body text-caption text-steel-500">
                            ({product.reviewCount})
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-display text-[1.2rem] font-bold text-arctic">
                          {formatGs(product.price)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="font-body text-caption text-steel-500 line-through">
                            {formatGs(product.compareAtPrice)}
                          </span>
                        )}
                      </div>

                      {/* SKU */}
                      <span className="mt-1 block font-mono text-[0.55rem] text-steel-700">
                        {product.sku}
                      </span>

                      {/* CTA */}
                      <button
                        className="btn-primary mt-3 w-full text-[0.6rem]"
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {product.stock > 0 ? 'Agregar' : 'Sin stock'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Marcas */}
      {brands.length > 0 && (
        <section className="border-t border-steel-900/40 py-12">
          <div className="container-main">
            <h2 className="mb-6 text-center font-display text-h3 text-arctic">
              Marcas que trabajamos
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {brands.map((marca) => (
                <div
                  key={marca}
                  className="rounded-md border border-steel-900/60 bg-carbon-light px-6 py-3 font-display text-h4 text-steel-500 transition-colors hover:border-blue/30 hover:text-arctic"
                >
                  {marca}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
