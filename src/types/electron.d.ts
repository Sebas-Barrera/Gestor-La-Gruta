/** Global type for the Electron API exposed via preload */
interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
