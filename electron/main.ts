import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';

// ── Env flags ───────────────────────────────────────────────
const isDev = !app.isPackaged;

// ── Window reference ────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;

// ── Window factory ──────────────────────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Inventario | La Gruta',
    icon: path.join(__dirname, '../public/favicon.ico'),
    autoHideMenuBar: true,

    // Touch-friendly: frameless in production
    frame: isDev,
    fullscreen: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,    // Security: renderer can't access Node
      nodeIntegration: false,    // Security: no require() in renderer
      sandbox: false,            // Allow preload to use Node APIs
      spellcheck: false,         // No spellcheck on bar monitors
    },
  });

  // ── Load the app ────────────────────────────────────────
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // ── Cleanup ─────────────────────────────────────────────
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ───────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  // Toggle kiosk mode: Ctrl+Shift+K
  globalShortcut.register('CommandOrControl+Shift+K', () => {
    if (!mainWindow) return;
    const isKiosk = mainWindow.isKiosk();
    mainWindow.setKiosk(!isKiosk);
  });

  // macOS: re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ── IPC Handlers ────────────────────────────────────────────
// These are ready for your backend developer to implement.
// Pattern: ipcMain.handle('channel', async (event, ...args) => { ... })

// Example channels your backend dev will implement:
// ipcMain.handle('db:query', async (_event, params) => { })
// ipcMain.handle('db:insert', async (_event, params) => { })
// ipcMain.handle('db:update', async (_event, params) => { })
// ipcMain.handle('db:delete', async (_event, params) => { })

// App info channel (working example)
ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  name: app.getName(),
  isPackaged: app.isPackaged,
  platform: process.platform,
  dataPath: app.getPath('userData'),
}));
