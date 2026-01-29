/**
 * @fileoverview Tailwind CSS Configuration
 *
 * Configures Tailwind CSS for the renderer process.
 * Scans all React component files for class names to generate
 * the minimal CSS bundle needed.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  // Files to scan for Tailwind class usage
  // Only scans renderer (React) files, not main process
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],

  theme: {
    extend: {
      // Custom theme extensions would go here
      // Currently using Tailwind defaults
    },
  },

  // Tailwind plugins (forms, typography, etc.) would go here
  plugins: [],
};
