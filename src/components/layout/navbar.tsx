'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  X,
  ShoppingCart,
  Phone,
  Search,
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/tienda', label: 'Tienda' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/contacto', label: 'Contacto' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-steel-900/40 bg-carbon/[0.92] backdrop-blur-xl">
      {/* Barra superior */}
      <div className="hidden border-b border-steel-900/30 sm:block">
        <div className="container-main flex items-center justify-between py-1.5">
          <p className="flex items-center gap-1.5 font-body text-[0.65rem] tracking-[0.04em] text-steel-500">
            <Phone className="h-3 w-3" />
            {siteConfig.phone} — {siteConfig.openingHours}
          </p>
          <p className="font-body text-[0.65rem] tracking-[0.04em] text-steel-500">
            Envios a todo el pais
          </p>
        </div>
      </div>

      {/* Navbar principal */}
      <nav className="container-main">
        <div className="flex h-[60px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Full Service & Clean"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <div className="flex flex-col">
              <span className="font-display text-[0.85rem] font-bold uppercase leading-none tracking-tight">
                <span className="text-blue-bright">Full Service</span>{' '}
                <span className="text-orange">&amp; Clean</span>
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-4 py-2 font-body text-[0.7rem] font-medium uppercase tracking-[0.05em] text-steel-500 transition-colors hover:text-arctic"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              className="rounded p-2 text-steel-500 transition-colors hover:text-arctic"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link
              href="/carrito"
              className="relative rounded p-2 text-steel-500 transition-colors hover:text-arctic"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange text-[9px] font-bold text-white">
                0
              </span>
            </Link>

            <Link
              href="/contacto?tipo=presupuesto"
              className="btn-primary ml-2 hidden text-[0.65rem] sm:inline-flex"
            >
              Presupuesto
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded p-2 text-steel-300 md:hidden"
              aria-label="Menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 md:hidden',
            isOpen ? 'max-h-80 pb-4' : 'max-h-0'
          )}
        >
          <div className="flex flex-col gap-1 border-t border-steel-900/40 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded px-3 py-2.5 font-body text-[0.75rem] font-medium uppercase tracking-[0.05em] text-steel-300 transition-colors hover:bg-steel-900 hover:text-arctic"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contacto?tipo=presupuesto"
              onClick={() => setIsOpen(false)}
              className="btn-primary mt-2 text-[0.65rem]"
            >
              Pedir presupuesto
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
