# Plan de Implementación por Fases

## Fase 1 — MVP (Semanas 1–6)

### Semana 1–2: Fundación
- [x] Setup repositorio + CI/CD (Vercel)
- [x] Configurar Next.js + Tailwind + TypeScript
- [x] Prisma schema + migraciones iniciales
- [x] Design system: tokens, componentes UI base
- [x] Layout: Navbar, Footer, WhatsApp button
- [x] Página Home (estática con CTA funcionales)
- [x] SEO base: meta tags, schema LocalBusiness, sitemap

### Semana 3: Servicios + Leads
- [x] Sanity schema para servicios
- [x] Página /servicios (listado con filtros)
- [x] Página /servicios/[slug] (landing individual)
- [x] Wizard de cotización (3–6 pasos)
- [x] API: crear lead en BD + enviar notificación email
- [x] Schema Service + FAQPage
- [x] Formulario de contacto (/contacto)

### Semana 4: E-commerce Core
- [x] Prisma models: Product, Variant, Category, Brand
- [x] Seed de productos de prueba
- [x] Página /tienda (catálogo con categorías)
- [x] Página /tienda/[categoria] (filtros + paginación)
- [x] Página /producto/[slug] (ficha completa)
- [x] Carrito: store Zustand + persistencia localStorage
- [x] Página /carrito

### Semana 5: Checkout + Pagos
- [x] Checkout: formulario de datos + envío
- [x] Integración Stripe (Payment Intent)
- [x] Webhook de Stripe para confirmar pago
- [x] Crear Order en BD al confirmar
- [x] Página /gracias
- [x] Email de confirmación (Resend + React Email)
- [x] Actualización de stock automática
- [x] Guest checkout funcional

### Semana 6: Portfolio + QA
- [x] Sanity schema para proyectos
- [x] Página /portfolio (grid con filtros)
- [x] Página /portfolio/[slug] (galería + ficha)
- [x] QA completo (ver checklist abajo)
- [x] Performance audit (Lighthouse > 90)
- [x] Deploy producción

---

## Fase 2 — Mejoras (Semanas 7–10)

### Semana 7–8: WhatsApp + Automatizaciones
- [ ] Integración WhatsApp Business API
- [ ] Botón WA: enviar resumen de presupuesto
- [ ] Botón WA: enviar resumen de pedido
- [ ] Emails automáticos: cambio estado pedido, envío
- [ ] Recuperación carrito abandonado (email 1h, WA 24h)

### Semana 9: Panel Admin
- [ ] Dashboard: ventas del día/semana/mes
- [ ] Gestión de pedidos (lista + detalle + cambiar estado)
- [ ] Gestión de leads (lista + detalle + cambiar estado)
- [ ] CRUD productos básico
- [ ] Reportes: productos top, conversiones, leads por servicio

### Semana 10: Envíos + Cuenta Cliente
- [ ] Integración API de correo para cálculo de envío
- [ ] Opción retiro en tienda
- [ ] Tracking de envío (mostrar al cliente)
- [ ] Cuenta cliente: ver pedidos, perfil, direcciones
- [ ] Reseñas de productos

---

## Fase 3 — Optimización (Semanas 11–14)

- [ ] Blog (Sanity + /blog + /blog/[slug])
- [ ] Búsqueda avanzada (Algolia o Typesense)
- [ ] A/B testing de CTAs y checkout
- [ ] PWA (manifest + service worker básico)
- [ ] Notificaciones push (opcional)
- [ ] Multi-idioma (si aplica)
- [ ] Integración con sistema contable
- [ ] Email marketing (newsletter con Resend)

---

## Checklist QA — MVP

### Checkout
- [ ] Agregar producto al carrito desde ficha
- [ ] Cambiar cantidad en carrito
- [ ] Eliminar producto del carrito
- [ ] Carrito persiste al refrescar página
- [ ] Guest checkout completo sin registro
- [ ] Checkout con cuenta (login/register)
- [ ] Validación de todos los campos
- [ ] Cálculo de envío correcto
- [ ] Pago con tarjeta (test Stripe)
- [ ] Pago declinado muestra error claro
- [ ] Order se crea en BD con estado correcto
- [ ] Stock se actualiza tras compra
- [ ] Página /gracias muestra resumen correcto
- [ ] Número de pedido único generado

### Emails
- [ ] Confirmación de pedido al cliente
- [ ] Notificación de nuevo pedido al admin
- [ ] Notificación de nuevo lead al admin
- [ ] Email de contacto recibido
- [ ] Templates se ven bien en Gmail/Outlook/mobile

### Tracking / Analytics
- [ ] GA4 recibe eventos: page_view, view_item, add_to_cart, begin_checkout, purchase
- [ ] Meta Pixel recibe eventos correspondientes
- [ ] Conversiones configuradas en GA4
- [ ] UTM parameters se preservan en el flujo

### Performance
- [ ] Lighthouse Performance > 90 (mobile)
- [ ] Lighthouse SEO > 95
- [ ] Lighthouse Accessibility > 90
- [ ] LCP < 2.5s en páginas principales
- [ ] CLS < 0.1
- [ ] Imágenes optimizadas (WebP, lazy load, sizes)
- [ ] Sin JS bloqueante innecesario

### SEO
- [ ] Todas las páginas tienen title + description únicos
- [ ] Schema LocalBusiness en home
- [ ] Schema Service en landings de servicio
- [ ] Schema Product en fichas de producto
- [ ] Schema FAQPage donde hay FAQs
- [ ] Sitemap.xml genera todas las URLs
- [ ] Robots.txt correcto
- [ ] Canonical URLs configuradas
- [ ] Open Graph tags en todas las páginas
- [ ] Imágenes tienen alt text

### Responsive / Mobile
- [ ] Todas las páginas se ven bien en 375px (iPhone SE)
- [ ] Todas las páginas se ven bien en 390px (iPhone 14)
- [ ] Todas las páginas se ven bien en 768px (iPad)
- [ ] Navbar mobile con menú hamburguesa funcional
- [ ] Filtros de tienda funcionan en mobile (drawer/modal)
- [ ] Checkout usable en mobile
- [ ] Botón WhatsApp visible y funcional en mobile
- [ ] Touch targets > 44px

### Seguridad
- [ ] HTTPS en producción
- [ ] Variables de entorno no expuestas en cliente
- [ ] Stripe webhook verifica firma
- [ ] Rate limiting en API de leads
- [ ] Inputs sanitizados (zod validation)
- [ ] Headers de seguridad configurados
