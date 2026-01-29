/**
 * @fileoverview Electron Main Process
 *
 * Entry point for the Electron desktop application. Creates the main
 * browser window and handles application lifecycle events. Supports
 * both development (Vite dev server) and production (built files) modes.
 *
 * @module main/main
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

/**
 * Vite dev server URL, set during development.
 * Undefined in production builds.
 */
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

/**
 * Creates the main application window.
 *
 * Window configuration:
 * - Default size: 1200x800
 * - Minimum size: 800x600
 * - Context isolation enabled (security best practice)
 * - Node integration disabled (security best practice)
 *
 * In development: Loads from Vite dev server and opens DevTools.
 * In production: Loads from built HTML file.
 */
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Security: Isolate renderer from Node.js context
      contextIsolation: true,
      // Security: Don't expose Node.js APIs to renderer
      nodeIntegration: false,
    },
  });

  if (devServerUrl) {
    // Development: Load from Vite dev server with hot reload
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// App ready - create the main window
app.whenReady().then(() => {
  createWindow();

  // macOS: Re-create window when dock icon is clicked and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS where apps stay in dock)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler: Returns the app version from package.json
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});
