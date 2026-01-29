/**
 * @fileoverview Vite Build Configuration
 *
 * Configures Vite for building the Electron + React application.
 * Handles both the renderer process (React app) and main process
 * (Electron main + preload scripts).
 *
 * Build outputs:
 * - dist/renderer: React app (HTML, JS, CSS, assets)
 * - dist/main: Electron main process (main.js, preload.js)
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  // Root directory for the Vite project (renderer process)
  root: path.resolve(__dirname, 'src/renderer'),

  plugins: [
    // React plugin for JSX and Fast Refresh
    react(),

    // Electron plugin: Builds main process files
    electron([
      {
        // Main process entry point
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              // Don't bundle electron - it's provided at runtime
              external: ['electron'],
            },
          },
        },
      },
      {
        // Preload script entry point
        entry: 'src/main/preload.ts',
        onstart(options) {
          // Reload the renderer when preload changes
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),

    // Enables Node.js/Electron APIs in renderer if needed
    renderer(),
  ],

  resolve: {
    alias: {
      // Path alias: @ -> src/renderer for cleaner imports
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },

  build: {
    // Output directory for renderer build
    outDir: path.resolve(__dirname, 'dist/renderer'),
    // Clean output directory before build
    emptyOutDir: true,
  },
});
