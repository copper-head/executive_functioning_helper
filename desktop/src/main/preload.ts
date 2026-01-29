/**
 * @fileoverview Electron Preload Script
 *
 * Runs in an isolated context before the renderer process loads.
 * Exposes a limited, safe API to the renderer via contextBridge.
 * This is the secure way to provide Electron/Node.js functionality
 * to the web-based renderer process.
 *
 * @module main/preload
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose a controlled API to the renderer process.
 *
 * The contextBridge safely exposes APIs to the renderer
 * without giving it full access to Node.js or Electron APIs.
 * Only explicitly exposed methods are available.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Gets the application version from package.json.
   * Calls the main process via IPC.
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  /** The current platform (darwin, win32, linux) */
  platform: process.platform,
});

/**
 * Type augmentation to make window.electronAPI available
 * in TypeScript with proper typing.
 */
declare global {
  interface Window {
    electronAPI: {
      /** Returns the app version string */
      getAppVersion: () => Promise<string>;
      /** The current OS platform */
      platform: NodeJS.Platform;
    };
  }
}
