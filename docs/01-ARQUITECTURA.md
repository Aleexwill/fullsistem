# Arquitectura del Sistema — ServiPro (Nombre de trabajo)

## 1. Visión General

Sitio web híbrido: **Servicios + E-commerce + Portfolio**.
Objetivo: generar leads cualificados para servicios y vender productos de ferretería online.

---

## 2. Stack Tecnológico (Justificación)

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR/SSG para SEO, App Router para layouts anidados, RSC para performance |
| Estilos | Tailwind CSS 3.4 | Utility-first, purge automático, tokens custom fáciles |
| Estado cliente | Zustand | Ligero, sin boilerplate, ideal para carrito |
| Backend | Next.js API Routes + Server Actions | Mismo deploy, sin servidor extra, serverless-ready |
| Base de datos | PostgreSQL + Prisma ORM | Relacional robusto, migraciones, tipado end-to-end |
| Auth | NextAuth.js v5 | OAuth + credentials, sesiones JWT, guest checkout sin auth |
| CMS | Sanity v3 (Studio embebido) | Real-time, GROQ potente, CDN imágenes, schema tipado |
| Pagos | Stripe (o MercadoPago para LATAM) | Webhooks confiables, checkout embebido, suscripciones futuras |
| Envíos | API del correo local + retiro en tienda | Cálculo por peso/volumen, tracking |
| Email | Resend + React Email | Templates tipados, transaccional confiable |
| WhatsApp | API de WhatsApp Business (o Twilio) | Confirmaciones, recuperación carrito |
| Analytics | GA4 + Meta Pixel + PostHog | Conversiones, heatmaps, funnels |
| Deploy | Vercel | Edge functions, ISR, preview deploys |
| Monitoreo | Sentry | Errores en tiempo real |

### Decisión E-commerce: Build vs Headless

**Recomendación: Build a medida** (opción A).

Razones:
- Control total del checkout y UX.
- Sin fees por transacción de Shopify.
- Integración nativa con el módulo de servicios/leads.
- Menor complejidad que mantener dos sistemas.
- El catálogo de ferretería es manejable (< 5,000 SKUs inicialmente).

---

## 3. Entidades del Dominio (Modelo de Datos)

### Módulo E-commerce
- **Product**: id, sku, name, slug, description, categoryId, brandId, basePrice, images[], specifications{}, isActive, createdAt
- **Variant**: id, productId, name, sku, price, compareAtPrice, stock, attributes{} (color, medida, etc.)
- **Category**: id, name, slug, parentId (jerárquica), image, description
- **Brand**: id, name, slug, logo
- **Cart**: id, sessionId, customerId?, items[], expiresAt
- **CartItem**: id, cartId, variantId, quantity, unitPrice
- **Order**: id, orderNumber, customerId?, status, subtotal, shipping, tax, total, shippingAddress{}, billingAddress{}, notes, createdAt
- **OrderItem**: id, orderId, variantId, productName, variantName, quantity, unitPrice
- **Payment**: id, orderId, provider, providerPaymentId, amount, status, metadata{}, createdAt
- **Shipment**: id, orderId, carrier, trackingNumber, status, estimatedDelivery, shippedAt, deliveredAt
- **Review**: id, productId, customerId, rating, title, body, isVerified, createdAt

### Módulo Servicios / Leads
- **Service**: id, name, slug, shortDescription, content (rich text), icon, image, category (mantenimiento|civil|metalurgica), faqs[], isActive
- **Lead**: id, serviceId?, name, email, phone, type (presupuesto|visita|urgencia), answers{} (wizard), status (nuevo|contactado|presupuestado|cerrado|perdido), assignedTo?, notes, createdAt
- **QuoteRequest**: id, leadId, items[], estimatedTotal, validUntil, status

### Módulo Portfolio
- **Project**: id, title, slug, category (civil|metalurgica|mantenimiento), description, client, location, duration, images[], beforeAfter[], testimonial?, completedAt

### Módulo Usuarios
- **Customer**: id, email, name, phone, addresses[], orders[], reviews[], isGuest, createdAt
- **AdminUser**: id, email, name, role (admin|operador), permissions[]

### Módulo CMS (Sanity)
- **Page**: título, slug, seo{}, blocks[]
- **BlogPost**: título, slug, author, excerpt, body, categories[], publishedAt
- **Testimonial**: nombre, empresa, texto, rating, image
- **FAQ**: pregunta, respuesta, serviceId?
- **Banner**: título, subtitle, cta, image, isActive

---

## 4. Flujos Principales

### 4.1 Flujo de Lead (Servicios)
```
Usuario → Landing de servicio → CTA "Pedir presupuesto"
→ Wizard (3-6 pasos) → Submit
→ [Backend] Crear Lead en BD
→ [Backend] Notificar admin (email + WhatsApp)
→ [Frontend] Pantalla "Gracias" + resumen por WhatsApp
→ [Admin] Gestionar lead → Presupuestar → Seguimiento
```

### 4.2 Flujo de Compra (Tienda)
```
Usuario → Tienda → Buscar/filtrar → Producto → Agregar al carrito
→ Carrito (revisar) → Checkout
→ Datos envío (guest o logueado) → Seleccionar envío
→ Pago (Stripe) → Confirmación
→ [Backend] Crear Order + Payment
→ [Backend] Email/WhatsApp confirmación
→ [Backend] Actualizar stock
→ [Admin] Preparar → Enviar → Tracking → Entregado
```

### 4.3 Flujo de Carrito Abandonado
```
CartItem sin checkout > 1h → Email recordatorio (#1)
CartItem sin checkout > 24h → WhatsApp (#2)
CartItem sin checkout > 72h → Email con descuento (#3)
CartItem > 7 días → Limpiar carrito
```

---

## 5. Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Admin** | Todo: productos, pedidos, leads, contenido, reportes, usuarios |
| **Operador** | Ver/gestionar pedidos, ver/gestionar leads, actualizar stock |
| **Cliente** | Ver sus pedidos, dejar reseñas, gestionar dirección |
| **Visitante** | Navegar, comprar (guest), pedir presupuesto |

---

## 6. Integraciones Externas

- **Stripe**: Pagos con tarjeta, webhook para confirmación
- **WhatsApp Business API**: Notificaciones automatizadas
- **Correo / Logística**: API para cotización y tracking
- **Sanity**: Contenido editorial
- **Resend**: Emails transaccionales
- **GA4 / Pixel**: Tracking de conversiones
- **Sentry**: Monitoreo de errores
- **Vercel**: Deploy + analytics

---

## 7. Seguridad

- HTTPS obligatorio
- CSRF tokens en formularios
- Rate limiting en API routes
- Sanitización de inputs (zod)
- Stripe webhooks verificados con firma
- Passwords hasheados (bcrypt) si se usa auth con credentials
- Headers de seguridad (CSP, HSTS, X-Frame-Options)
- Variables de entorno en Vercel (nunca en código)
