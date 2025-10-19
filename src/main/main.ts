import path from 'path';
import http from 'http';
import https from 'https';
import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  shell
} from 'electron';
import type { GardenState } from '@core/index';

const isDev = process.env.NODE_ENV === 'development';
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let resolvedDevUrl: string | null = null;
const rendererIndexPath = path.join(__dirname, '../ui/index.html');

let latestGardenState: GardenState | null = null;
let overlaySelection: string | null = null;

const getPreloadPath = () => path.join(__dirname, '../preload/index.js');

const OVERLAY_DIMENSIONS = {
  width: 280,
  height: 320,
  minWidth: 220,
  minHeight: 240
};

async function waitForServer(url: string, timeoutMs = 15000, intervalMs = 300) {
  const endBy = Date.now() + timeoutMs;
  const target = new URL(url);
  const client = target.protocol === 'https:' ? https : http;
  let lastErr: unknown;

  while (Date.now() < endBy) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = client.get(
          {
            hostname: target.hostname,
            port: target.port,
            path: target.pathname,
            timeout: 2000
          },
          (res) => {
            res.resume();
            resolve();
          }
        );
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy(new Error('timeout'));
        });
      });
      return;
    } catch (error) {
      lastErr = error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`Dev server not reachable at ${url}. Last error: ${lastErr}`);
}

const broadcastGardenState = () => {
  if (!latestGardenState) {
    return;
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('garden:state', latestGardenState);
  }
};

const broadcastOverlaySelection = () => {
  const payload = overlaySelection ?? null;
  [mainWindow, overlayWindow].forEach((windowInstance) => {
    if (windowInstance && !windowInstance.isDestroyed()) {
      windowInstance.webContents.send('overlay:selection', payload);
    }
  });
};

const createMainWindow = async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  if (!app.isPackaged && process.platform === 'win32') {
    try {
      const tmp = process.env.TEMP || process.env.TMP || 'C:/Windows/Temp';
      app.setPath('userData', path.join(tmp, 'dubhack_25-userData'));
      app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
    } catch (error) {
      console.warn('Failed to adjust development paths', error);
    }
  }

  mainWindow = new BrowserWindow({
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
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (!app.isPackaged) {
    const candidates = [
      devServerUrl,
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://172.20.29.140:5173',
      'http://10.255.255.254:5173'
    ].filter(Boolean) as string[];

    let resolvedUrl: string | null = null;
    for (const candidate of candidates) {
      try {
        console.log(`Attempting to connect to dev server at ${candidate}...`);
        await waitForServer(candidate);
        resolvedUrl = candidate;
        console.log(`Successfully connected to dev server at ${candidate}`);
        break;
      } catch (error) {
        console.warn(`Dev server not reachable at ${candidate}. Trying next...`);
      }
    }

    if (!resolvedUrl) {
      throw new Error('Dev server not reachable. Run npm run dev:renderer first.');
    }

    resolvedDevUrl = resolvedUrl;
    await mainWindow.loadURL(resolvedUrl);
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    resolvedDevUrl = null;
    await mainWindow.loadFile(rendererIndexPath);
  }

  return mainWindow;
};

const createOverlayWindow = async () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return overlayWindow;
  }

  const { workArea } = screen.getPrimaryDisplay();
  const overlayWidth = OVERLAY_DIMENSIONS.width;
  const overlayHeight = OVERLAY_DIMENSIONS.height;
  const overlayX = Math.round(workArea.x + workArea.width - overlayWidth - 32);
  const overlayY = Math.round(workArea.y + 32);

  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    minWidth: OVERLAY_DIMENSIONS.minWidth,
    minHeight: OVERLAY_DIMENSIONS.minHeight,
    x: overlayX,
    y: overlayY,
    frame: false,
    transparent: true,
    resizable: true,
    movable: true,
    skipTaskbar: true,
    fullscreenable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  overlayWindow.setMenu(null);
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');

  overlayWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (!app.isPackaged) {
    if (!resolvedDevUrl) {
      const fallbackUrl = devServerUrl ?? 'http://127.0.0.1:5173';
      await waitForServer(fallbackUrl);
      resolvedDevUrl = fallbackUrl;
    }
    await overlayWindow.loadURL(`${resolvedDevUrl}#/overlay`);
  } else {
    await overlayWindow.loadFile(rendererIndexPath, { hash: '/overlay' });
  }

  overlayWindow.webContents.once('did-finish-load', () => {
    if (latestGardenState) {
      overlayWindow?.webContents.send('garden:state', latestGardenState);
    }
    overlayWindow?.webContents.send('overlay:selection', overlaySelection ?? null);
  });

  return overlayWindow;
};

const registerIpcHandlers = () => {
  ipcMain.on('garden:state:update', (_event, state: GardenState) => {
    latestGardenState = state;
    broadcastGardenState();
  });

  ipcMain.on('garden:state:request', (event) => {
    if (latestGardenState) {
      event.sender.send('garden:state', latestGardenState);
    }
    event.sender.send('overlay:selection', overlaySelection ?? null);
  });

  ipcMain.handle('overlay:selection:set', async (_event, plotId: string | null) => {
    overlaySelection = plotId ?? null;
    broadcastOverlaySelection();
    return overlaySelection;
  });

  ipcMain.handle('overlay:selection:get', async () => overlaySelection ?? null);
};

registerIpcHandlers();

app.whenReady().then(async () => {
  try {
    await createMainWindow();
    await createOverlayWindow();
  } catch (error) {
    console.error('Failed to initialize windows', error);
  }

  app.on('activate', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      await createMainWindow();
    }
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      await createOverlayWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
