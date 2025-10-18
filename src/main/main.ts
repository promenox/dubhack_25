import path from 'path';
import http from 'http';
import https from 'https';
import { app, BrowserWindow, shell } from 'electron';

const isDev = process.env.NODE_ENV === 'development';
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

async function waitForServer(url: string, timeoutMs = 15000, intervalMs = 300) {
  const endBy = Date.now() + timeoutMs;
  const target = new URL(url);
  const client = target.protocol === 'https:' ? https : http;
  let lastErr: any;
  while (Date.now() < endBy) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = client.get({
          hostname: target.hostname,
          port: target.port,
          path: target.pathname,
          timeout: 2000
        }, (res) => {
          // Any HTTP response means server is up
          res.resume();
          resolve();
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy(new Error('timeout'));
        });
      });
      return; // success
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  throw new Error(`Dev server not reachable at ${url}. Last error: ${lastErr}`);
}

const createMainWindow = async () => {
  // Mitigate cache permission warnings on Windows/OneDrive during development
  if (!app.isPackaged && process.platform === 'win32') {
    try {
      const tmp = process.env.TEMP || process.env.TMP || 'C:/Windows/Temp';
      app.setPath('userData', path.join(tmp, 'dubhack_25-userData'));
      // Optional: reduce GPU disk cache usage that hits permission issues
      app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
    } catch (e) {
      // Non-fatal; continue
    }
  }
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 820,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#0c1115',
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    titleBarOverlay:
      process.platform === 'win32'
        ? {
          color: '#0c1115',
          symbolColor: '#f4f6fb',
          height: 44
        }
        : undefined,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // In development (not packaged), always use the dev server
  if (!app.isPackaged) {
    const candidates = [
      devServerUrl,
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://172.20.29.140:5173', // WSL network IP
      'http://10.255.255.254:5173' // WSL network IP
    ].filter(Boolean) as string[];

    let resolvedUrl: string | null = null;
    for (const candidate of candidates) {
      try {
        console.log(`Attempting to connect to dev server at ${candidate}...`);
        await waitForServer(candidate);
        resolvedUrl = candidate;
        console.log(`Successfully connected to dev server at ${candidate}`);
        break;
      } catch (e) {
        // Try next candidate
        console.warn(`Dev server not reachable at ${candidate}. Trying next...`);
      }
    }
    if (!resolvedUrl) {
      console.error('Could not connect to any dev server candidate. Please ensure Vite dev server is running.');
      throw new Error('Dev server not reachable. Run npm run dev:renderer first.');
    }
    await mainWindow.loadURL(resolvedUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load from built files
    const filePath = path.join(__dirname, '../ui/index.html');
    await mainWindow.loadFile(filePath);
  }
};

app.whenReady().then(() => {
  createMainWindow().catch((error) => {
    console.error('Failed to create main window', error);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow().catch((error) => {
        console.error('Failed to recreate main window', error);
      });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
