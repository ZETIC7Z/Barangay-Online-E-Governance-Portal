const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

/**
 * Barangay Matatag Smart E-Governance Desktop Application (Electron Wrapper)
 * Supports Windows, macOS, and Linux with official Barangay Matatag Seal icon.
 */
const PORTAL_URL = process.env.MATATAG_PORTAL_URL || 'http://localhost:5173';

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'Barangay Matatag Smart E-Governance Portal — Lamitan City, Basilan',
    icon: path.join(__dirname, '../public/logo.png'),
    backgroundColor: '#0B1120',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadURL(PORTAL_URL);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
