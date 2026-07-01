import Link from 'next/link';
import Image from 'next/image';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
} from 'lucide-react';
import { siteConfig } from '@/config/site';

const footerLinks = {
  servicios: [
    { label: 'Mantenimiento general', href: '/servicios' },
    { label: 'Limpieza profesional', href: '/servicios' },
    { label: 'Construccion civil', href: '/servicios' },
    { label: 'Pedir presupuesto', href: '/contacto?tipo=presupuesto' },
  ],
  tienda: [
    { label: 'Herramientas', href: '/tienda' },
    { label: 'Electricidad', href: '/tienda' },
    { label: 'Plomeria', href: '/tienda' },
    { label: 'Productos de limpieza', href: '/tienda' },
  ],
  empresa: [
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contacto', href: '/contacto' },
    { label: 'Terminos y condiciones', href: '/terminos' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-steel-900/30 bg-[#080D18]">
      {/* Links */}
      <div className="container-main py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Full Service & Clean"
                width={36}
                height={36}
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="font-display text-[0.8rem] font-bold uppercase leading-none tracking-tight">
                  <span className="text-blue-bright">Full Service</span>{' '}
                  <span className="text-orange">&amp; Clean</span>
                </span>
              </div>
            </Link>
            <p className="mb-4 font-body text-body-sm text-steel-500 leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="flex gap-3">
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-2 text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-2 text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-2 text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="label mb-3 text-steel-300">
              Servicios
            </h3>
            <ul className="space-y-2">
              {footerLinks.servicios.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-body-sm text-steel-500 transition-colors hover:text-arctic"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="label mb-3 text-steel-300">
              Tienda
            </h3>
            <ul className="space-y-2">
              {footerLinks.tienda.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-body-sm text-steel-500 transition-colors hover:text-arctic"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="label mb-3 text-steel-300">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 font-body text-body-sm text-steel-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {siteConfig.address.street}, {siteConfig.address.city}
                </span>
              </li>
              <li className="flex items-center gap-2 font-body text-body-sm text-steel-500">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${siteConfig.phone}`} className="hover:text-arctic">
                  {siteConfig.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 font-body text-body-sm text-steel-500">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${siteConfig.email}`} className="hover:text-arctic">
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-center gap-2 font-body text-body-sm text-steel-500">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{siteConfig.openingHours}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-steel-900/30">
        <div className="container-main flex flex-col items-center justify-between gap-2 py-4 sm:flex-row">
          <p className="font-mono text-caption text-steel-700">
            &copy; {new Date().getFullYear()} {siteConfig.name}. Todos los
            derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link
              href="/terminos"
              className="font-body text-caption text-steel-700 hover:text-steel-300"
            >
              Terminos
            </Link>
            <Link
              href="/privacidad"
              className="font-body text-caption text-steel-700 hover:text-steel-300"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
