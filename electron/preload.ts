import { contextBridge, ipcRenderer } from 'electron';

// ── Type-safe IPC channels ──────────────────────────────────
// Add new channels here as the backend grows.
// This is the ONLY bridge between your React app and Node.js.

type InvokeChannel =
  | 'app:info'
  // Future DB channels (for your backend developer):
  // | 'db:query'
  // | 'db:insert'
  // | 'db:update'
  // | 'db:delete'
  ;

type OnChannel =
  | 'app:update-available'
  // Future event channels:
  // | 'db:change'
  ;

const electronAPI = {
  /** Send a request to main process and get a response */
  invoke: (channel: InvokeChannel, ...args: unknown[]) =>
    ipcRenderer.invoke(channel, ...args),

  /** Listen for events from main process */
  on: (channel: OnChannel, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

// Expose to renderer as window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// ── TypeScript types for the renderer ───────────────────────
// Your React app can use: window.electronAPI.invoke('app:info')
export type ElectronAPI = typeof electronAPI;
