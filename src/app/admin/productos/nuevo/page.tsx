'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/admin/product-form';

export default function NuevoProductoPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/productos"
          className="mb-3 inline-flex items-center gap-1.5 font-body text-caption text-steel-500 transition-colors hover:text-arctic"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a productos
        </Link>
        <h1 className="font-display text-h1 uppercase text-arctic">Nuevo producto</h1>
        <p className="mt-1 font-body text-body-sm text-steel-300">
          Completa los campos para agregar un nuevo producto al catalogo.
        </p>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
