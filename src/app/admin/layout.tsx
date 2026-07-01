'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  FolderOpen,
  Wrench,
  PenSquare,
  BarChart3,
  Eye,
  ClipboardList,
  TrendingUp,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: any; exact?: boolean }[];
}

const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'E-Commerce',
    items: [
      { href: '/admin/productos', label: 'Productos', icon: Package },
      { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
      { href: '/admin/reportes/ecommerce', label: 'Reporte E-com', icon: TrendingUp },
    ],
  },
  {
    label: 'Servicios',
    items: [
      { href: '/admin/servicios', label: 'Servicios', icon: Wrench },
      { href: '/admin/presupuestos', label: 'Presupuestos', icon: Calculator },
      { href: '/admin/reportes/servicios', label: 'Reporte Serv.', icon: ClipboardList },
    ],
  },
  {
    label: 'Sitio Web',
    items: [
      { href: '/admin/contenido', label: 'Contenido', icon: PenSquare },
      { href: '/admin/portfolio', label: 'Portfolio', icon: FolderOpen },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/leads', label: 'Leads', icon: Users },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/reportes', label: 'Reporte General', icon: FileText, exact: true },
      { href: '/admin/config', label: 'Configuracion', icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-carbon">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-steel-900/40 bg-carbon-light">
        {/* Logo */}
        <div className="flex h-[60px] items-center gap-2.5 border-b border-steel-900/40 px-4">
          <Image
            src="/logo.png"
            alt="Full Service & Clean"
            width={32}
            height={32}
            className="object-contain"
          />
          <div className="flex flex-col">
            <span className="font-display text-[0.7rem] font-bold uppercase leading-none tracking-tight">
              <span className="text-blue-bright">Full Service</span>{' '}
              <span className="text-orange">&amp; Clean</span>
            </span>
          </div>
          <span className="badge-blue ml-auto text-[0.5rem]">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.label && (
                <p className="mb-1.5 px-3 font-body text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-steel-700">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 font-body text-body-sm transition-all',
                        active
                          ? 'bg-blue-muted text-blue-bright font-medium'
                          : 'text-steel-300 hover:bg-steel-900 hover:text-arctic'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                      {active && <ChevronRight className="ml-auto h-3 w-3" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-steel-900/40 p-3">
          <div className="mb-2 rounded-md bg-steel-900/50 px-3 py-2">
            <p className="font-body text-caption font-medium text-arctic">Administrador</p>
            <p className="font-body text-[0.6rem] text-steel-500">admin@fullserviceandclean.com.py</p>
          </div>
          <div className="flex gap-1">
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 font-body text-caption text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver sitio
            </Link>
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 font-body text-caption text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </Link>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-[240px] flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
