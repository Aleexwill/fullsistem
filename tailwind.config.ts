// ============================================================
// FULL SERVICE & CLEAN — TAILWIND CONFIG (IDENTIDAD CORPORATIVA)
// Servicio Profesional · Limpieza · Mantenimiento
// ============================================================
// Fuentes: Barlow Condensed (títulos) + IBM Plex Sans (cuerpo) + IBM Plex Mono (datos)

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ============ COLORES ============
      colors: {
        // Base — Escala carbón/acero
        carbon: {
          DEFAULT: '#0B1120',
          light: '#131B2E',
        },
        steel: {
          900: '#1A2640',
          700: '#2A3A5C',
          500: '#4A5E80',
          300: '#8094B4',
          100: '#C0CEDF',
        },
        cloud: '#E8EDF5',
        arctic: '#F4F7FB',

        // Acento primario — Azul logo
        blue: {
          DEFAULT: '#2D8FCC',
          bright: '#3CAAE0',
          deep: '#1E6FA0',
          muted: '#132A3D',
        },

        // Acento secundario — Naranja logo
        orange: {
          DEFAULT: '#E8862B',
          bright: '#F5993D',
          deep: '#D07420',
          muted: '#3D2A10',
        },

        // Mantenemos yellow como alias de orange para compatibilidad
        yellow: {
          DEFAULT: '#E8862B',
          bright: '#F5993D',
          muted: '#3D2A10',
        },

        // Semánticos
        success: {
          DEFAULT: '#2F855A',
          light: '#1A3D2A',
        },
        danger: {
          DEFAULT: '#C53030',
          light: '#3D1A1A',
        },
      },

      // ============ TIPOGRAFÍA ============
      fontFamily: {
        display: ['var(--font-display)', '"Barlow Condensed"', 'sans-serif'],
        body: ['var(--font-body)', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['var(--font-mono)', '"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        // Display — Barlow Condensed, uppercase, tracking tight
        'display-xl': ['4.5rem', { lineHeight: '0.95', fontWeight: '700', letterSpacing: '-0.03em' }],
        'display': ['3rem', { lineHeight: '0.95', fontWeight: '700', letterSpacing: '-0.02em' }],
        // Headings — Barlow Condensed
        'h1': ['2.25rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.015em' }],
        'h2': ['1.75rem', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h3': ['1.25rem', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.005em' }],
        'h4': ['1rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0' }],
        // Body — IBM Plex Sans
        'body-lg': ['1.0625rem', { lineHeight: '1.65', fontWeight: '400', letterSpacing: '0.01em' }],
        'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400', letterSpacing: '0.01em' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0.01em' }],
        // Utility — IBM Plex Sans / Mono
        'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.06em' }],
        'caption': ['0.6875rem', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.04em' }],
        'overline': ['0.625rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.12em' }],
        'data': ['0.8125rem', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.02em' }],
      },

      // ============ ESPACIADO ============
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '36': '9rem',
      },

      // ============ BORDES ============
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },

      // ============ SOMBRAS ============
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.16)',
        'elevated': '0 12px 32px rgba(0, 0, 0, 0.24)',
        'glow-blue': '0 0 20px rgba(45, 143, 204, 0.15)',
        'glow-orange': '0 0 20px rgba(232, 134, 43, 0.15)',
        'inner-subtle': 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
      },

      // ============ ANIMACIONES ============
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'slide-right': 'slide-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },

      // ============ CONTENEDORES ============
      maxWidth: {
        'content': '1100px',
        'narrow': '760px',
        'wide': '1320px',
      },

      // ============ BACKGROUND ============
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(26,38,64,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(26,38,64,0.08) 1px, transparent 1px)",
        'gradient-hero': 'linear-gradient(160deg, #0B1120 0%, #131B2E 40%, #0B1120 100%)',
      },
      backgroundSize: {
        'grid-60': '60px 60px',
      },
    },
  },
  plugins: [],
};

export default config;
