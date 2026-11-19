/**
 * E-QC System PT Merah Putih — design tokens
 * Source: Figma file "E-QC System PT Merah Putih", page "Design System"
 *   - colors: Color styles (Brand, Gray, Error, Success), copied 1:1 from the style swatches
 *   - type:   Text styles + Figma MCP get_variable_defs (weights confirmed)
 *
 * Tailwind v4: loaded from src/index.css via `@config "../tailwind.config.js";`
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FCE8E9',
          100: '#F4B8BA',
          200: '#EF9699',
          300: '#E8666B',
          400: '#E4484E',
          500: '#DD1A22',
          600: '#C9181F',
          700: '#9D1218',
          800: '#7A0E13',
          900: '#5D0B0E',
        },
        gray: {
          25: '#FCFCFD',
          50: '#F9FAFB',
          100: '#F2F4F7',
          200: '#E4E7EC',
          300: '#D0D5DD',
          400: '#98A2B3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1D2939',
          900: '#101828',
        },
        error: {
          25: '#FFFBFA',
          50: '#FEF3F2',
          100: '#FEE4E2',
          200: '#FECDCA',
          300: '#FDA29B',
          400: '#F97066',
          500: '#F04438',
          600: '#D92D20',
          700: '#B42318',
          800: '#912018',
          900: '#7A271A',
        },
        success: {
          25: '#F6FEF9',
          50: '#ECFDF3',
          100: '#D1FADF',
          200: '#A6F4C5',
          300: '#6CE9A6',
          400: '#32D583',
          500: '#12B76A',
          600: '#039855',
          700: '#027A48',
          800: '#05603A',
          900: '#054F31',
        },
        ink: '#161616', // Text/black text
        // Input focus state — Figma pakai Brand/300 + primary-100 dari kit Untitled UI (ungu).
        // Ganti 2 nilai ini (+ shadow focus-primary) untuk pindah ke merah, mis. #E8666B / #FCE8E9.
        focus: {
          border: '#D6BBFB',
          ring: '#F4EBFF',
        },
        // Checkbox checked — juga dari kit Untitled UI (Brand/50 + Brand/600, ungu)
        checkbox: {
          bg: '#F9F5FF',
          border: '#7F56D9',
        },
        // semantic aliases
        primary: {
          DEFAULT: '#DD1A22', // brand-500
          hover: '#C9181F',   // brand-600
          active: '#9D1218',  // brand-700
          soft: '#FCE8E9',    // brand-50
        },
      },

      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        display: ['Roboto', 'sans-serif'],
      },

      // [fontSize, { lineHeight, letterSpacing, fontWeight }]
      fontSize: {
        // h1–h4: from the spec table only (not published as Figma text styles)
        h1: ['96px', { lineHeight: '116.7%', letterSpacing: '-1.5px', fontWeight: '300' }],
        h2: ['60px', { lineHeight: '120%', letterSpacing: '-0.5px', fontWeight: '300' }],
        h3: ['48px', { lineHeight: '116.7%', letterSpacing: '0px', fontWeight: '400' }],
        h4: ['34px', { lineHeight: '123.5%', letterSpacing: '0.25px', fontWeight: '400' }],
        // Heading/*
        h5: ['24px', { lineHeight: '32px', letterSpacing: '0px', fontWeight: '600' }],
        h6: ['20px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '600' }],
        // Text/*
        'subtitle-1': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'subtitle-2': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'body-1': ['16px', { lineHeight: '150%', fontWeight: '400' }],
        'body-2': ['14px', { lineHeight: '143%', letterSpacing: '0.25px', fontWeight: '400' }],
        // Component/*  (buttons are All Caps in Figma → pair with `uppercase`)
        'btn-lg': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'btn-md': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'btn-sm': ['13px', { lineHeight: '16px', fontWeight: '600' }],
        'table-head': ['12px', { lineHeight: '18px', fontWeight: '500' }],
        'table-cell': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        badge: ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'input-label': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        avatar: ['20px', { lineHeight: '20px', fontWeight: '400' }],
        // From the legacy "Roboto/*" style set — no newer equivalent exists
        caption: ['12px', { lineHeight: '150%', letterSpacing: '0.4px', fontWeight: '400' }],
        overline: ['10px', { lineHeight: '130%', letterSpacing: '1.5px', fontWeight: '400' }],
        'helper-text': ['12px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '400' }],
        'input-text': ['14px', { lineHeight: '20px', letterSpacing: '0.25px', fontWeight: '400' }],
        tooltip: ['10px', { lineHeight: '14px', letterSpacing: '0.4px', fontWeight: '400' }],
        'alert-title': ['16px', { lineHeight: '150%', letterSpacing: '0.15px', fontWeight: '500' }],
      },

      // Effect styles (Shadow/*)
      boxShadow: {
        xs: '0 1px 2px 0 #1018280D',
        lg: '0 4px 6px -2px #10182808, 0 12px 16px -4px #10182814',
        'focus-gray': '0 0 0 4px #F2F4F7, 0 1px 2px 0 #1018280D',
        'focus-error': '0 0 0 4px #FEE4E2, 0 1px 2px 0 #1018280D',
        // ⚠ Figma value is purple (#F4EBFF, Untitled UI leftover). Kept as-is; switch to brand-50 #FCE8E9 once fixed in Figma.
        'focus-primary': '0 0 0 4px #F4EBFF, 0 1px 2px 0 #1018280D',
      },
    },
  },
  plugins: [],
};
