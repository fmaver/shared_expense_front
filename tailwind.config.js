/** @type {import('tailwindcss').Config} */

/** Token de color HSL de `src/index.css`, con soporte de opacidad (`bg-brand/10`). */
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Manrope para todo, títulos y cifras incluidos: Instrument Serif salió con la piel
        // violeta. Los títulos van en 700 y las cifras protagonistas en 800, con -.025em.
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Superficies y tinta */
        ink:     token('ink'),
        paper:   token('paper'),
        surface: {
          DEFAULT: token('surface'),
          sunken:  token('surface-sunken'),
        },
        /* `sidebar` es el hero oscuro de la landing y la barra lateral: pasa a ser tinta. */
        sidebar: token('ink'),

        /* Bordes */
        line: {
          DEFAULT: token('line'),
          strong:  token('line-strong'),
          soft:    token('line-soft'),
        },

        /* Marca */
        brand: {
          DEFAULT:   token('brand'),
          ink:       token('brand-ink'),
          wash:      token('brand-wash'),
          'wash-line': token('brand-wash-line'),
          soft:      token('brand-soft'),
        },

        /* Estados */
        positive: {
          DEFAULT:  token('positive'),
          wash:     token('positive-wash'),
          'wash-line': token('positive-wash-line'),
          'on-dark': token('positive-on-dark'),
        },
        negative: {
          DEFAULT:  token('negative'),
          wash:     token('negative-wash'),
          'wash-line': token('negative-wash-line'),
          ink:      token('negative-ink'),
          'on-dark': token('negative-on-dark'),
        },

        /* Texto secundario — `muted` conserva la forma de shadcn (DEFAULT = fondo). */
        muted: {
          DEFAULT:     token('muted'),
          foreground:  token('muted-foreground'),
          2:           token('muted-2'),
          3:           token('muted-3'),
          'on-dark':   token('muted-on-dark'),
          'on-dark-2': token('muted-on-dark-2'),
        },

        /* Badges de excepción de la fila de gasto */
        tag: {
          credit:      token('tag-credit'),
          'credit-wash': token('tag-credit-wash'),
          usd:         token('tag-usd'),
          'usd-wash':    token('tag-usd-wash'),
          split:       token('tag-split'),
          'split-wash':  token('tag-split-wash'),
        },

        /* Avatares — color estable por id de miembro */
        avatar: {
          1: token('avatar-1'),
          2: token('avatar-2'),
          3: token('avatar-3'),
          4: token('avatar-4'),
          5: token('avatar-5'),
          6: token('avatar-6'),
        },

        /* Alias de shadcn */
        settle:      token('settle'),
        border:      token('border'),
        input:       token('input'),
        ring:        token('ring'),
        background:  token('background'),
        foreground:  token('foreground'),
        primary:     { DEFAULT: token('primary'),     foreground: token('primary-foreground') },
        secondary:   { DEFAULT: token('secondary'),   foreground: token('secondary-foreground') },
        destructive: { DEFAULT: token('destructive'), foreground: token('destructive-foreground') },
        accent:      { DEFAULT: token('accent'),      foreground: token('accent-foreground') },
        popover:     { DEFAULT: token('popover'),     foreground: token('popover-foreground') },
        card:        { DEFAULT: token('card'),        foreground: token('card-foreground') },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        /* Escala del diseño (§3), nombrada por rol. */
        chip:    '9px',
        pill:    '14px',
        card:    '18px',
        'card-lg': '20px',
        sheet:   '28px',
      },
      boxShadow: {
        card:  'var(--shadow-card)',
        panel: 'var(--shadow-panel)',
        sheet: 'var(--shadow-sheet)',
        fab:   'var(--shadow-fab)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
