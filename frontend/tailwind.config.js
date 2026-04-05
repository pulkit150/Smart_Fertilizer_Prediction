// tailwind.config.js
// ─────────────────────────────────────────────────────────────────────────────
// Tailwind is a utility-first CSS framework. Instead of writing CSS files,
// you write class names directly in JSX: className="bg-green-600 text-white px-4"
//
// The `content` array tells Tailwind which files to scan for class names.
// It uses this to PURGE unused CSS in production — so only the classes you
// actually use are included in the final bundle (keeps file size tiny).
//
// If you add a new file location (e.g. src/layouts/), add it here too.
// ─────────────────────────────────────────────────────────────────────────────

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // scan all JS/JSX files in src/
  ],
  theme: {
    extend: {
      // You can add custom colors, fonts, spacing here
      // e.g. colors: { brand: { DEFAULT: '#15803d' } }
    },
  },
  plugins: [],
};
