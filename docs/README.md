# ServiPro — Servicios + E-commerce + Portfolio

Sitio web híbrido para empresa de servicios generales (mantenimiento, construcción civil, metalúrgica) con ferretería e-commerce integrada.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Server Actions
- **Base de datos**: PostgreSQL + Prisma ORM
- **CMS**: Sanity v3 (contenido editorial)
- **Pagos**: Stripe
- **Email**: Resend + React Email
- **Auth**: NextAuth.js v5
- **Estado**: Zustand (carrito)
- **Deploy**: Vercel

## Estructura del proyecto

```
proyecto/
├── docs/                          # Documentación del proyecto
│   ├── 01-ARQUITECTURA.md         # Arquitectura técnica
│   ├── 02-SITEMAP-WIREFRAMES.md   # Sitemap + wireframes textuales
│   ├── 03-SEO-PERFORMANCE.md      # Plan SEO + performance
│   ├── 04-PLAN-IMPLEMENTACION.md  # Fases + checklist QA
│   └── 05-BRAND-GUIDE-UIKIT.md   # Identidad visual + UI kit
├── prisma/
│   └── schema.prisma              # Modelo de datos completo
├── src/
│   ├── app/                       # App Router (páginas)
│   │   ├── layout.tsx             # Layout raíz
│   │   ├── page.tsx               # Home
│   │   ├── (services)/            # Grupo: servicios
│   │   ├── (shop)/                # Grupo: tienda
│   │   ├── (portfolio)/           # Grupo: portfolio
│   │   ├── contacto/              # Contacto
│   │   ├── blog/                  # Blog
│   │   └── api/                   # API routes
│   ├── components/
│   │   ├── ui/                    # Componentes base (Button, Input, etc.)
│   │   ├── sections/              # Secciones del sitio (Hero, etc.)
│   │   ├── layout/                # Navbar, Footer, WhatsApp
│   │   ├── shop/                  # Componentes de tienda
│   │   ├── portfolio/             # Componentes de portfolio
│   │   └── forms/                 # Formularios (wizard, checkout)
│   ├── hooks/                     # Custom hooks (useCart, etc.)
│   ├── lib/                       # Utilidades y configuración
│   ├── types/                     # TypeScript types
│   ├── config/                    # Configuración del sitio
│   └── styles/                    # CSS global
├── tailwind.config.ts             # Tokens de diseño
├── next.config.ts                 # Config de Next.js
├── package.json                   # Dependencias
├── tsconfig.json                  # TypeScript config
└── .env.example                   # Variables de entorno
```

## Setup rápido

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd servipro
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Completar los valores en .env.local

# 3. Configurar base de datos
npx prisma db push
npx prisma db seed    # (opcional: datos de prueba)

# 4. Iniciar desarrollo
npm run dev
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Linter |
| `npm run db:push` | Sincronizar schema con BD |
| `npm run db:migrate` | Crear migración |
| `npm run db:seed` | Seed de datos de prueba |
| `npm run db:studio` | Prisma Studio (GUI) |

## Documentación

Consultar la carpeta `/docs` para documentación detallada:
- Arquitectura y modelo de datos
- Wireframes de cada página
- Plan de SEO y performance
- Plan de implementación por fases
- Brand guide y UI kit
