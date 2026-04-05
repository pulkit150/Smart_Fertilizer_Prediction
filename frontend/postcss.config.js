// postcss.config.js
// ─────────────────────────────────────────────────────────────────────────────
// PostCSS is a CSS processor that Vite uses behind the scenes.
// These two plugins are required for Tailwind to work:
//
//   tailwindcss  → converts Tailwind class directives (@tailwind base, etc.)
//                  into actual CSS rules
//
//   autoprefixer → automatically adds vendor prefixes to CSS properties
//                  e.g. adds -webkit-transform when you write transform
//                  so your app works in older browsers
// ─────────────────────────────────────────────────────────────────────────────

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
