# SERVIPRO — Identidad Corporativa Integral
## Sistema Visual + Brand Guide + UI Kit
### Posicionamiento: Empresa técnica integral · Perfil corporativo · Accesible

---

## 1. POSICIONAMIENTO

### Lo que DEBE transmitir:
- **Capacidad operativa** → Escala, equipamiento, personal
- **Orden** → Procesos, documentación, cumplimiento
- **Ingeniería** → Planificación técnica, cálculo, precisión
- **Control** → Supervisión, seguimiento, reportes
- **Profesionalismo** → Comunicación clara, plazos, presupuestos detallados
- **Respaldo técnico** → Certificaciones, materiales de primera, garantía

### Lo que NO debe parecer:
- ❌ Ferretería de barrio
- ❌ Empresa improvisada o informal
- ❌ Diseño genérico de template
- ❌ Estética "tech startup" (demasiado ligera)
- ❌ Corporativo frío inaccesible (debe ser cálido para hogares)

### Público dual:
- **Empresas**: gerentes de mantenimiento, directores de obra, facility managers
- **Hogares**: propietarios que valoran profesionalismo y garantía

---

## 2. ISOTIPO

### Concepto: Hexágono Estructural
Tres capas hexagonales concéntricas que representan:
- Capa exterior: alcance y capacidad operativa
- Capa media: estructura y metodología
- Núcleo sólido: solidez y confiabilidad

### Por qué NO una herramienta literal:
- Un martillo o llave = ferretería pequeña
- Una casa = solo residencial
- Un engranaje solo = solo metalúrgica
- El hexágono abstracto = ingeniería + estabilidad + versatilidad

### Variaciones permitidas:
- Sobre fondo oscuro: azul técnico (#2B6CB0)
- Sobre fondo claro: carbón (#0B1120)
- Monocromático sobre color: blanco (#F4F7FB)
- Tamaño mínimo: 20px (digital), 8mm (impreso)

### Zona de protección:
Espacio libre mínimo alrededor del isotipo = 50% del ancho del isotipo

---

## 3. LOGOTIPO

### Construcción:
`[Isotipo] + SERVI[PRO] + Tagline`

- "SERVI" en arctic (#F4F7FB sobre oscuro) o carbon (#0B1120 sobre claro)
- "PRO" en azul técnico (#2B6CB0) — siempre
- Tagline: "Ingeniería · Construcción · Servicios"
  - IBM Plex Sans, 400, 0.55rem, tracking 0.18em, uppercase
  - Color: steel-300 sobre oscuro, steel-500 sobre claro

### Versiones:
1. **Horizontal completa** (principal): isotipo + nombre + tagline
2. **Horizontal compacta**: isotipo + nombre (sin tagline)
3. **Isotipo solo**: para favicons, avatares, espacios reducidos
4. **Vertical**: isotipo arriba, nombre abajo (uso limitado)

---

## 4. PALETA DE COLORES

### 4.1 Base — Escala Carbón / Acero

| Token | Hex | Nombre | Uso |
|-------|-----|--------|-----|
| `carbon` | #0B1120 | Carbon Prime | Fondo principal, máximo peso |
| `carbon-light` | #131B2E | Carbon Elevated | Cards elevadas, fondos secundarios |
| `steel-900` | #1A2640 | Steel 900 | Superficies terciarias, inputs |
| `steel-700` | #2A3A5C | Steel 700 | Bordes activos, divisores, separadores |
| `steel-500` | #4A5E80 | Steel 500 | Texto terciario, iconos inactivos, timestamps |
| `steel-300` | #8094B4 | Steel 300 | Texto secundario, labels, descripciones |
| `steel-100` | #C0CEDF | Steel 100 | Texto de apoyo, bordes modo claro |
| `cloud` | #E8EDF5 | Cloud | Fondo modo claro, bordes suaves |
| `arctic` | #F4F7FB | Arctic | Fondo puro modo claro, texto sobre oscuro |

### 4.2 Acento Primario — Azul Técnico

| Token | Hex | Nombre | Uso |
|-------|-----|--------|-----|
| `blue` | #2B6CB0 | Technical Blue | CTA primario, links, acciones principales |
| `blue-bright` | #3B82F6 | Signal Blue | Hover, focus, estados activos, indicadores |
| `blue-deep` | #1E4D7B | Blueprint | Pressed, fondos de badge activo |
| `blue-muted` | #1A3A5C | Blue Muted | Fondo tonal azul (badges, alertas info) |

### 4.3 Acento Secundario — Amarillo Seguridad (USO MÍNIMO)

| Token | Hex | Nombre | Uso |
|-------|-----|--------|-----|
| `yellow` | #D69E2E | Safety Yellow | CTA urgencia, alertas, warnings |
| `yellow-bright` | #ECC94B | Alert Gold | Hover de urgencia, highlights |
| `yellow-muted` | #3D3000 | Yellow Muted | Fondo de badge warning |

### 4.4 Semánticos

| Token | Hex | Uso |
|-------|-----|-----|
| `success` | #2F855A | Confirmaciones, stock disponible, pagado |
| `success-light` | #1A3D2A | Fondo de alerta éxito |
| `danger` | #C53030 | Errores, sin stock, cancelado |
| `danger-light` | #3D1A1A | Fondo de alerta error |

### 4.5 Reglas de proporción
- **70%** base carbón/acero (fondos, texto)
- **20%** arctic/cloud (contenido, cards modo claro)
- **8%** azul técnico (acciones, acentos)
- **2%** amarillo seguridad (solo urgencias/warnings)

---

## 5. TIPOGRAFÍA

### 5.1 Fuentes

**Barlow Condensed** — Títulos y display
- Condensada, geométrica, peso visual alto
- Transmite industria, estructura, fuerza
- Pesos: 600 (semibold), 700 (bold)
- Uso: títulos, CTAs, precios, stats

**IBM Plex Sans** — Cuerpo e interfaz
- Técnica, legible, neutral-profesional
- Herencia ingenieril de IBM → refuerza el posicionamiento
- Pesos: 300, 400, 500, 600, 700
- Uso: párrafos, labels, botones, navegación

**IBM Plex Mono** — Datos técnicos
- Monoespaciada, limpia
- Pesos: 400, 500
- Uso: SKUs, códigos, precios en tablas, specs, timestamps

### 5.2 Escala

| Token | Fuente | Tamaño | Peso | Tracking | Transform |
|-------|--------|--------|------|----------|-----------|
| Display XL | Barlow Condensed | 4.5rem | 700 | -0.03em | UPPERCASE |
| Display | Barlow Condensed | 3rem | 700 | -0.02em | UPPERCASE |
| H1 | Barlow Condensed | 2.25rem | 700 | -0.015em | uppercase |
| H2 | Barlow Condensed | 1.75rem | 600 | -0.01em | — |
| H3 | Barlow Condensed | 1.25rem | 600 | -0.005em | — |
| H4 | Barlow Condensed | 1rem | 600 | 0 | — |
| Body LG | IBM Plex Sans | 1.0625rem | 400 | 0.01em | — |
| Body | IBM Plex Sans | 0.9375rem | 400 | 0.01em | — |
| Body SM | IBM Plex Sans | 0.8125rem | 400 | 0.01em | — |
| Label | IBM Plex Sans | 0.75rem | 500 | 0.06em | UPPERCASE |
| Caption | IBM Plex Sans | 0.6875rem | 400 | 0.04em | — |
| Overline | IBM Plex Sans | 0.625rem | 500 | 0.12em | UPPERCASE |
| Data | IBM Plex Mono | 0.8125rem | 400 | 0.02em | — |

---

## 6. TONO DE COMUNICACIÓN

### Copy Hero:
- **Título**: "SOLUCIONES DE MANTENIMIENTO, OBRAS Y METALÚRGICA"
- **Subtítulo**: "Rápido, prolijo y con garantía"
- **Bajada**: "Presupuesto claro y seguimiento del trabajo. Atendemos empresas y hogares."

### CTAs principales:
- "Pedir presupuesto" (azul, primario)
- "Comprar en la ferretería" (outline, secundario)
- "Emergencia — Llamar ahora" (amarillo, solo urgencias)
- "Consultar por WhatsApp" (verde WA)

### Bloques de respaldo:
- "150+ clientes activos" (stat)
- "Respuesta en 24h" (stat)
- "100% trabajos con garantía" (stat)
- "Técnicos verificados y certificados" (trust)
- "Materiales de primera calidad" (trust)
- "Presupuesto detallado sin compromiso" (trust)

### Reglas de tono:
- NUNCA: "somos los mejores", "precios imbatibles", "¡no te lo pierdas!"
- SIEMPRE: datos concretos, promesas verificables, lenguaje profesional pero cercano
- Tuteo argentino ("necesitás", "consultá") para cercanía
- Términos técnicos cuando corresponde, pero siempre explicados

---

## 7. ESPACIADO

| Token | Valor | Uso |
|-------|-------|-----|
| space-1 | 4px | Micro gaps internos |
| space-2 | 8px | Entre elementos inline |
| space-3 | 12px | Padding de badges, small gaps |
| space-4 | 16px | Padding de inputs, gap grid tight |
| space-6 | 24px | Padding de cards, gap grid standard |
| space-8 | 32px | Separación entre bloques |
| space-10 | 40px | Secciones menores |
| space-12 | 48px | Heading + content gap |
| space-16 | 64px | Secciones del home |
| space-20 | 80px | Section padding principal |

---

## 8. COMPONENTES UI

### Botones
- **Primario**: bg-blue, text-arctic, hover bg-blue-bright, radius-default
- **Secundario**: border-2 border-blue, text-blue, hover bg-blue text-arctic
- **Urgencia**: bg-yellow, text-carbon, hover bg-yellow-bright (USO LIMITADO)
- **Ghost**: text-steel-300, hover bg-steel-900
- **Destructivo**: bg-danger, text-arctic, hover bg-red-600
- Todos: IBM Plex Sans 500-600, 0.75rem, tracking 0.06em, UPPERCASE

### Cards
- bg-carbon-light, border steel-900/60%, radius-md, shadow-card
- Hover: border-blue/30%, shadow-card-hover, translateY(-3px)

### Inputs
- bg-steel-900, border steel-700, radius-default, padding 12px 16px
- Focus: border-blue, ring blue/20%
- Error: border-danger, ring danger/20%

### Badges
- Pill (radius-full), IBM Plex Sans 600, 0.65rem, uppercase
- Blue: bg-blue-muted, text-blue-bright
- Yellow: bg-yellow-muted, text-yellow-bright
- Green: bg-success-light, text-#48BB78
- Red: bg-danger-light, text-#FC8181

### Alertas
- Left border 3px, radius-default
- Info: bg-blue-muted, border-blue
- Éxito: bg-success-light, border-success
- Warning: bg-yellow-muted, border-yellow
- Error: bg-danger-light, border-danger

---

## 9. IMPLEMENTACIÓN

### Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Next.js font config:
```typescript
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import localFont from 'next/font/local';

// Barlow Condensed via next/font/google
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});
```

### Tailwind config:
→ Ver archivo `tailwind.config.corporate.ts` adjunto.

### CSS base recomendado:
```css
:root {
  --color-carbon: #0B1120;
  --color-blue: #2B6CB0;
  --color-yellow: #D69E2E;
  --color-arctic: #F4F7FB;
}

body {
  font-family: var(--font-body), 'IBM Plex Sans', sans-serif;
  color: var(--color-arctic);
  background: var(--color-carbon);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display), 'Barlow Condensed', sans-serif;
}
```
