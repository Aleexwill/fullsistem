# Plan de SEO Técnico, Performance y Analítica

## 1. SEO Técnico

### 1.1 Schema Markup (JSON-LD)

#### LocalBusiness (Global — en layout)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "ServiPro",
  "description": "Servicios de mantenimiento, construcción civil, metalúrgica y ferretería",
  "url": "https://servipro.com",
  "telephone": "+54-XXX-XXXX",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "...",
    "addressLocality": "...",
    "addressRegion": "...",
    "postalCode": "...",
    "addressCountry": "AR"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": "", "longitude": "" },
  "openingHours": "Mo-Fr 08:00-18:00, Sa 08:00-13:00",
  "priceRange": "$$",
  "image": "https://servipro.com/og-image.jpg",
  "sameAs": ["facebook", "instagram", "linkedin"]
}
```

#### Service (en cada landing de servicio)
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Instalaciones Eléctricas",
  "provider": { "@type": "LocalBusiness", "name": "ServiPro" },
  "areaServed": { "@type": "City", "name": "..." },
  "description": "...",
  "offers": { "@type": "Offer", "priceCurrency": "ARS" }
}
```

#### Product (en fichas de producto)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Taladro Bosch GSB 13RE",
  "sku": "BOSCH-GSB13RE",
  "brand": { "@type": "Brand", "name": "Bosch" },
  "offers": {
    "@type": "Offer",
    "price": "45000",
    "priceCurrency": "ARS",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.5", "reviewCount": "12" }
}
```

#### FAQPage (en landings de servicio)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Cuánto cuesta...?",
      "acceptedAnswer": { "@type": "Answer", "text": "..." }
    }
  ]
}
```

#### BreadcrumbList (en todas las páginas)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "/" },
    { "@type": "ListItem", "position": 2, "name": "Servicios", "item": "/servicios" }
  ]
}
```

### 1.2 Meta Tags (por página)

Cada página debe tener:
- `<title>` único, < 60 chars, con keyword + marca
- `<meta name="description">` único, < 155 chars, con CTA
- `<link rel="canonical">` URL canónica
- Open Graph: og:title, og:description, og:image, og:type
- Twitter Card: summary_large_image

### 1.3 URLs y Estructura

- URLs limpias, en español: `/servicios/instalaciones-electricas`
- Sin trailing slashes (configurar en next.config)
- Redirects 301 para URLs antiguas
- Sitemap XML dinámico (`/sitemap.xml`)
- Robots.txt configurado

### 1.4 SEO Local

- Google Business Profile: verificar, completar, vincular
- NAP consistente (Name, Address, Phone) en todo el sitio
- Páginas por zona de servicio (futuro): `/servicios/electricista-en-[ciudad]`
- Reviews en Google Business

---

## 2. Performance (Core Web Vitals)

### 2.1 Objetivos

| Métrica | Objetivo | Cómo |
|---------|----------|------|
| LCP | < 2.5s | Imágenes optimizadas, SSR, preload hero |
| FID/INP | < 200ms | Code splitting, lazy loading, web workers |
| CLS | < 0.1 | Dimensiones explícitas en imágenes/ads, font-display: swap |

### 2.2 Estrategias

**Imágenes**
- next/image con CDN de Vercel (o Cloudinary)
- WebP/AVIF automático
- Lazy loading nativo
- Blur placeholder
- Sizes responsive

**JavaScript**
- Dynamic imports para componentes pesados (carrusel, mapa, editor)
- Tree shaking de dependencias
- Bundle analyzer en CI
- Eliminar dependencias innecesarias

**CSS**
- Tailwind con purge (automático en producción)
- Critical CSS inline (Next.js lo hace automáticamente)
- Sin CSS-in-JS bloqueante

**Fonts**
- next/font para autoalojar (sin peticiones a Google Fonts)
- font-display: swap
- Preload de font principal

**Caching**
- ISR para páginas de producto (revalidar cada 60s)
- SSG para servicios y portfolio
- SWR para datos del carrito
- Cache-Control headers en API routes

### 2.3 Monitoreo

- Vercel Analytics (Speed Insights)
- Lighthouse CI en GitHub Actions
- Web Vitals API → enviar a GA4

---

## 3. Analítica

### 3.1 Google Analytics 4

**Eventos custom:**

| Evento | Trigger | Parámetros |
|--------|---------|------------|
| `generate_lead` | Submit wizard/formulario | service, type |
| `view_item` | Ver producto | item_id, item_name, price |
| `add_to_cart` | Agregar al carrito | item_id, quantity, value |
| `begin_checkout` | Iniciar checkout | value, items_count |
| `purchase` | Pago exitoso | transaction_id, value, items |
| `whatsapp_click` | Click botón WA | page, context |
| `cta_click` | Click CTA | cta_name, page |
| `search` | Buscar en tienda | search_term |
| `filter_apply` | Aplicar filtro | filter_type, filter_value |

**Conversiones:**
- `generate_lead` → Conversión primaria servicios
- `purchase` → Conversión primaria tienda

### 3.2 Meta Pixel

Eventos estándar:
- PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead, Search

### 3.3 PostHog (opcional)

- Session recordings
- Heatmaps
- Funnels: Landing → CTA → Wizard → Submit
- Feature flags para A/B tests

---

## 4. Implementación de Tracking

```typescript
// lib/analytics.ts
export const trackEvent = (name: string, params?: Record<string, any>) => {
  // GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params);
  }
  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', name, params);
  }
};
```
