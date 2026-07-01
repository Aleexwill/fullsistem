# Sitemap + Wireframes Textuales

## Mapa del Sitio

```
/                           → Home
├── /servicios              → Listado de servicios
│   ├── /servicios/[slug]   → Landing de servicio individual
│   └── /presupuesto        → Wizard de cotización
├── /tienda                 → Catálogo e-commerce
│   ├── /tienda/[categoria] → Categoría con filtros
│   ├── /producto/[slug]    → Ficha de producto
│   ├── /carrito            → Carrito de compras
│   ├── /checkout           → Proceso de pago
│   └── /gracias            → Confirmación de pedido
├── /portfolio              → Galería de proyectos
│   └── /portfolio/[slug]   → Ficha del proyecto
├── /blog                   → Artículos / tips
│   └── /blog/[slug]        → Post individual
├── /contacto               → Contacto + mapa
├── /cuenta                 → Dashboard cliente (opcional)
│   ├── /cuenta/pedidos     → Mis pedidos
│   └── /cuenta/perfil      → Mi perfil
└── /admin                  → Panel administración
    ├── /admin/pedidos
    ├── /admin/productos
    ├── /admin/leads
    └── /admin/reportes
```

---

## Wireframes Textuales por Página

### HOME (/)

```
┌─────────────────────────────────────────────────┐
│ [NAVBAR]                                         │
│ Logo | Servicios | Tienda | Portfolio | Contacto │
│                              🛒(n) | WhatsApp    │
├─────────────────────────────────────────────────┤
│ [HERO — Full width, imagen industrial de fondo]  │
│                                                   │
│ "Soluciones de mantenimiento, obras y metalúrgica"│
│ "Rápido, prolijo y con garantía"                  │
│                                                   │
│ [🔵 Pedir presupuesto]  [🟡 Comprar en ferretería]│
│                                                   │
├─────────────────────────────────────────────────┤
│ [BARRA DE CONFIANZA — 4 íconos inline]           │
│ ✓ Respuesta en el día | ✓ Técnicos verificados  │
│ ✓ Materiales de calidad | ✓ Garantía escrita     │
├─────────────────────────────────────────────────┤
│ [SERVICIOS DESTACADOS — Grid 3 cols]             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│ │ 🔧      │ │ 🏗️      │ │ ⚙️      │             │
│ │Mantenim.│ │Construc.│ │Metalúrg.│             │
│ │ breve.. │ │ breve.. │ │ breve.. │             │
│ │[Ver más]│ │[Ver más]│ │[Ver más]│             │
│ └─────────┘ └─────────┘ └─────────┘             │
├─────────────────────────────────────────────────┤
│ [PRODUCTOS DESTACADOS — Carrusel 4 items]        │
│ "Lo más vendido en nuestra ferretería"           │
│ ← [Card][Card][Card][Card] →                     │
│                    [Ver toda la tienda →]         │
├─────────────────────────────────────────────────┤
│ [PORTFOLIO PREVIEW — 2-3 proyectos destacados]   │
│ "Proyectos que hablan por nosotros"              │
│ ┌──────────────┐ ┌──────────────┐                │
│ │ Foto antes →  │ │ Foto antes → │                │
│ │ después       │ │ después      │                │
│ │ Título        │ │ Título       │                │
│ │ Categoría     │ │ Categoría    │                │
│ └──────────────┘ └──────────────┘                │
│                    [Ver portfolio →]              │
├─────────────────────────────────────────────────┤
│ [TESTIMONIOS — Carrusel]                         │
│ "Lo que dicen nuestros clientes"                 │
│ ← ⭐⭐⭐⭐⭐ "Excelente trabajo..." — Juan P. →   │
├─────────────────────────────────────────────────┤
│ [CTA FINAL — Fondo oscuro]                       │
│ "¿Necesitás una cotización?"                     │
│ [🔵 Contactar ahora]  [📱 WhatsApp]              │
├─────────────────────────────────────────────────┤
│ [FOOTER]                                         │
│ Logo | Links | Redes | Contacto | Mapa           │
│ © 2024 ServiPro. Todos los derechos reservados.  │
└─────────────────────────────────────────────────┘
```

### SERVICIOS (/servicios)

```
┌─────────────────────────────────────────┐
│ [NAVBAR]                                 │
├─────────────────────────────────────────┤
│ [BREADCRUMB] Home > Servicios            │
├─────────────────────────────────────────┤
│ [HERO CORTO]                             │
│ "Nuestros Servicios"                     │
│ "Mantenimiento, obras civiles y          │
│  metalúrgica para empresas y hogares"    │
├─────────────────────────────────────────┤
│ [FILTRO TABS]                            │
│ [Todos] [Mantenimiento] [Civil] [Metal.] │
├─────────────────────────────────────────┤
│ [GRID DE SERVICIOS]                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ Icono    │ │ Icono    │ │ Icono    │  │
│ │ Nombre   │ │ Nombre   │ │ Nombre   │  │
│ │ Desc.    │ │ Desc.    │ │ Desc.    │  │
│ │ [Cotizar]│ │ [Cotizar]│ │ [Cotizar]│  │
│ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────┤
│ [CTA] "¿No encontrás lo que buscás?"    │
│ [Contactar por WhatsApp]                 │
├─────────────────────────────────────────┤
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```

### SERVICIO INDIVIDUAL (/servicios/[slug])

```
┌─────────────────────────────────────────┐
│ [NAVBAR]                                 │
├─────────────────────────────────────────┤
│ [BREADCRUMB] Home > Servicios > Nombre   │
├─────────────────────────────────────────┤
│ [HERO SERVICIO — Imagen de fondo]        │
│ "Instalaciones Eléctricas"               │
│ "Servicio profesional con garantía"      │
│ [🔵 Pedir presupuesto] [📱 WhatsApp]     │
├─────────────────────────────────────────┤
│ [BARRA CONFIANZA] Resp. 24h | Garantía  │
├─────────────────────────────────────────┤
│ [CONTENIDO — 2 cols]                     │
│ ┌─────────────────┐ ┌────────────────┐  │
│ │ Descripción     │ │ SIDEBAR        │  │
│ │ detallada del   │ │ [Mini wizard]  │  │
│ │ servicio con    │ │ o              │  │
│ │ bullets de      │ │ [Form rápido]  │  │
│ │ qué incluye     │ │ Nombre         │  │
│ │                 │ │ Teléfono       │  │
│ │ Galería fotos   │ │ Tipo trabajo   │  │
│ │                 │ │ [Enviar]       │  │
│ └─────────────────┘ └────────────────┘  │
├─────────────────────────────────────────┤
│ [PROYECTOS RELACIONADOS]                 │
│ Antes/después de trabajos similares      │
├─────────────────────────────────────────┤
│ [TESTIMONIOS del servicio]               │
├─────────────────────────────────────────┤
│ [FAQ — Acordeón]                         │
│ ▸ ¿Cuánto demora el servicio?            │
│ ▸ ¿Tienen garantía?                      │
│ ▸ ¿Trabajan fines de semana?             │
├─────────────────────────────────────────┤
│ [CTA FINAL]                              │
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```

### TIENDA (/tienda)

```
┌─────────────────────────────────────────┐
│ [NAVBAR + BARRA BÚSQUEDA prominente]     │
├─────────────────────────────────────────┤
│ [BREADCRUMB] Home > Tienda               │
├─────────────────────────────────────────┤
│ [BANNER OFERTA — carrusel si hay]        │
├─────────────────────────────────────────┤
│ [CATEGORÍAS — Grid de cards visuales]    │
│ Herramientas | Electricidad | Plomería   │
│ Pinturas | Fijaciones | Seguridad        │
├─────────────────────────────────────────┤
│ [PRODUCTOS DESTACADOS / OFERTAS]         │
│ Grid 4 cols de ProductCards              │
├─────────────────────────────────────────┤
│ [MARCAS — Logo strip]                    │
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```

### CATEGORÍA (/tienda/[categoria])

```
┌─────────────────────────────────────────┐
│ [NAVBAR + BÚSQUEDA]                      │
├─────────────────────────────────────────┤
│ [BREADCRUMB] Home > Tienda > Categoría   │
├─────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────────────┐   │
│ │ FILTROS    │ │ [Ordenar: ▼]       │   │
│ │            │ │ Mostrando N result.│   │
│ │ Marca      │ │                    │   │
│ │ □ Bosch    │ │ ┌─────┐ ┌─────┐   │   │
│ │ □ DeWalt   │ │ │Prod │ │Prod │   │   │
│ │            │ │ │Card │ │Card │   │   │
│ │ Precio     │ │ └─────┘ └─────┘   │   │
│ │ [---|---]  │ │ ┌─────┐ ┌─────┐   │   │
│ │            │ │ │Prod │ │Prod │   │   │
│ │ Medida     │ │ │Card │ │Card │   │   │
│ │ □ 1/2"    │ │ └─────┘ └─────┘   │   │
│ │ □ 3/4"    │ │                    │   │
│ │            │ │ [Paginación]       │   │
│ └────────────┘ └────────────────────┘   │
├─────────────────────────────────────────┤
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```

### PRODUCTO (/producto/[slug])

```
┌─────────────────────────────────────────┐
│ [NAVBAR]                                 │
├─────────────────────────────────────────┤
│ [BREADCRUMB] Tienda > Cat > Producto     │
├─────────────────────────────────────────┤
│ ┌─────────────────┐ ┌────────────────┐  │
│ │ [GALERÍA]       │ │ Marca: Bosch   │  │
│ │                 │ │ NOMBRE PRODUCTO│  │
│ │ Foto principal  │ │ ⭐⭐⭐⭐☆ (12)   │  │
│ │                 │ │                │  │
│ │ [thumb][th][th] │ │ $12.500        │  │
│ │                 │ │ ~~$15.000~~ -17%│  │
│ │                 │ │                │  │
│ │                 │ │ Variante: [▼]  │  │
│ │                 │ │ Stock: ✓ 23 un.│  │
│ │                 │ │ Cantidad: [-]1[+]│ │
│ │                 │ │                │  │
│ │                 │ │ [🛒 AGREGAR]   │  │
│ │                 │ │ [📱 Consultar] │  │
│ │                 │ │                │  │
│ │                 │ │ 🚚 Envío: calc.│  │
│ │                 │ │ CP: [____][OK] │  │
│ │                 │ │ 🔄 Devolución  │  │
│ └─────────────────┘ └────────────────┘  │
├─────────────────────────────────────────┤
│ [TABS]                                   │
│ [Descripción] [Ficha técnica] [Reseñas] │
│                                          │
│ Contenido del tab activo...              │
├─────────────────────────────────────────┤
│ [PRODUCTOS RELACIONADOS — Carrusel]      │
│ "También te puede interesar"             │
├─────────────────────────────────────────┤
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```

### CARRITO (/carrito)

```
┌─────────────────────────────────────────┐
│ [NAVBAR]                                 │
├─────────────────────────────────────────┤
│ "Tu Carrito (3 productos)"              │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [img] Producto 1  |Cant: [-]2[+]|$X│ │
│ │       Variante    |      [Eliminar] │ │
│ ├─────────────────────────────────────┤ │
│ │ [img] Producto 2  |Cant: [-]1[+]|$X│ │
│ │       Variante    |      [Eliminar] │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────┐                    │
│ │ Subtotal:  $X    │                    │
│ │ Envío:     calc. │                    │
│ │ CP: [____][OK]   │                    │
│ │ ─────────────    │                    │
│ │ TOTAL:     $X    │                    │
│ │                  │                    │
│ │ [🔵 IR A PAGAR]  │                    │
│ │ [Seguir comprando]│                   │
│ └──────────────────┘                    │
├─────────────────────────────────────────┤
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```

### CHECKOUT (/checkout)

```
┌─────────────────────────────────────────┐
│ [NAVBAR SIMPLIFICADO — solo logo]        │
├─────────────────────────────────────────┤
│ [PROGRESS] ① Datos → ② Envío → ③ Pago  │
├─────────────────────────────────────────┤
│ ┌─────────────────┐ ┌────────────────┐  │
│ │ PASO ACTIVO     │ │ RESUMEN        │  │
│ │                 │ │                │  │
│ │ ① DATOS         │ │ Prod 1   $X    │  │
│ │ [Continuar      │ │ Prod 2   $X    │  │
│ │  sin cuenta]    │ │ ──────────     │  │
│ │ [Tengo cuenta]  │ │ Subtotal $X    │  │
│ │                 │ │ Envío    $X    │  │
│ │ Nombre*         │ │ ──────────     │  │
│ │ Email*          │ │ TOTAL    $X    │  │
│ │ Teléfono*       │ │                │  │
│ │ DNI/RUC         │ │ [Cupón: ___]   │  │
│ │                 │ │                │  │
│ │ Dirección*      │ │ 🔒 Pago seguro │  │
│ │ Ciudad*         │ │ Stripe         │  │
│ │ CP*             │ │                │  │
│ │                 │ │                │  │
│ │ [Continuar →]   │ │                │  │
│ └─────────────────┘ └────────────────┘  │
├─────────────────────────────────────────┤
│ [FOOTER MÍNIMO]                          │
└─────────────────────────────────────────┘
```

### GRACIAS (/gracias)

```
┌─────────────────────────────────────────┐
│ [NAVBAR]                                 │
├─────────────────────────────────────────┤
│           ✅                             │
│   "¡Gracias por tu compra!"             │
│   Pedido #12345                          │
│   Recibirás confirmación por email       │
│                                          │
│   [Resumen del pedido]                   │
│   [📱 Ver en WhatsApp]                   │
│                                          │
│   [Volver a la tienda]                   │
│   [Ver mis pedidos]                      │
├─────────────────────────────────────────┤
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```

### PORTFOLIO (/portfolio)

```
┌─────────────────────────────────────────┐
│ [NAVBAR]                                 │
├─────────────────────────────────────────┤
│ "Nuestros Proyectos"                     │
│ [Todos] [Civil] [Metalúrgica] [Manten.] │
├─────────────────────────────────────────┤
│ [GRID MASONRY — ProjectCards]            │
│ ┌────────┐ ┌──────────────┐             │
│ │ Foto   │ │ Foto grande  │             │
│ │ Título │ │ Título       │             │
│ │ Cat.   │ │ Cat.         │             │
│ └────────┘ └──────────────┘             │
│ ┌──────────────┐ ┌────────┐             │
│ │ Foto grande  │ │ Foto   │             │
│ │ Título       │ │ Título │             │
│ └──────────────┘ └────────┘             │
├─────────────────────────────────────────┤
│ [CTA] "¿Tenés un proyecto similar?"      │
│ [Contactar]                              │
├─────────────────────────────────────────┤
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```

### PROYECTO (/portfolio/[slug])

```
┌─────────────────────────────────────────┐
│ [NAVBAR]                                 │
├─────────────────────────────────────────┤
│ [BREADCRUMB] Portfolio > Proyecto        │
├─────────────────────────────────────────┤
│ [GALERÍA HERO — Slider fullwidth]        │
├─────────────────────────────────────────┤
│ [INFO — 2 cols]                          │
│ ┌─────────────────┐ ┌────────────────┐  │
│ │ Título          │ │ FICHA          │  │
│ │ Descripción     │ │ Cliente: X     │  │
│ │ completa del    │ │ Ubicación: X   │  │
│ │ proyecto        │ │ Duración: 3m   │  │
│ │                 │ │ Categoría: X   │  │
│ │                 │ │                │  │
│ │                 │ │ [Pedir similar]│  │
│ └─────────────────┘ └────────────────┘  │
├─────────────────────────────────────────┤
│ [ANTES / DESPUÉS — Slider comparativo]   │
├─────────────────────────────────────────┤
│ [TESTIMONIAL del cliente]                │
├─────────────────────────────────────────┤
│ [PROYECTOS RELACIONADOS]                 │
├─────────────────────────────────────────┤
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```

### CONTACTO (/contacto)

```
┌─────────────────────────────────────────┐
│ [NAVBAR]                                 │
├─────────────────────────────────────────┤
│ "Contacto"                               │
├─────────────────────────────────────────┤
│ ┌─────────────────┐ ┌────────────────┐  │
│ │ FORMULARIO      │ │ INFO           │  │
│ │ Nombre*         │ │ 📍 Dirección   │  │
│ │ Email*          │ │ 📞 Teléfono    │  │
│ │ Teléfono        │ │ ✉️ Email       │  │
│ │ Asunto [▼]      │ │ 🕐 Horarios    │  │
│ │ Mensaje*        │ │                │  │
│ │ [Enviar]        │ │ [Mapa Google]  │  │
│ └─────────────────┘ └────────────────┘  │
├─────────────────────────────────────────┤
│ [FOOTER]                                 │
└─────────────────────────────────────────┘
```
