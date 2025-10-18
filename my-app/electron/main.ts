/**
 * Main Process
 * 
 * Electron main process that orchestrates all services, manages windows,
 * and handles IPC communication with the renderer process.
 */

import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  ScreenCaptureService,
  WindowTrackerService,
  InputTrackerService,
  ProductivityEngine,
  DataService,
} from './services/index.js';
import { IPC_CHANNELS } from './types/index.js';
import type { AppSettings } from './types/index.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment setup
process.env.APP_ROOT = path.join(__dirname, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL 
  ? path.join(process.env.APP_ROOT, 'public') 
  : RENDERER_DIST;

// ============================================================================
// Global State
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;

// Services
let screenCaptureService: ScreenCaptureService;
let windowTrackerService: WindowTrackerService;
let inputTrackerService: InputTrackerService;
let productivityEngine: ProductivityEngine;
let dataService: DataService;

let isTrackingActive = false;

// ============================================================================
// Window Management
// ============================================================================

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    backgroundColor: '#121212',
  });

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Cleanup on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('[Main] Main window created');
}

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Position in bottom-right corner
  const overlayWidth = 300;
  const overlayHeight = 400;
  const x = width - overlayWidth - 20;
  const y = height - overlayHeight - 20;

  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Make overlay click-through by default (user can interact via main window)
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  // Load overlay route
  if (VITE_DEV_SERVER_URL) {
    overlayWindow.loadURL(`${VITE_DEV_SERVER_URL}#overlay`);
  } else {
    overlayWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      hash: 'overlay',
    });
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  console.log('[Main] Overlay window created');
}

// ============================================================================
// Service Initialization
// ============================================================================

async function initializeServices() {
  console.log('[Main] Initializing services...');

  // Initialize data service first (loads settings)
  dataService = new DataService();
  await dataService.initialize();
  const settings = dataService.getSettings();

  // Initialize productivity engine
  productivityEngine = new ProductivityEngine();

  // Setup engine callbacks
  productivityEngine.onMetricsUpdate((metrics) => {
    // Send metrics to renderer
    mainWindow?.webContents.send(IPC_CHANNELS.METRICS_UPDATE, metrics);
    overlayWindow?.webContents.send(IPC_CHANNELS.METRICS_UPDATE, metrics);
  });

  // Initialize telemetry services
  screenCaptureService = new ScreenCaptureService(settings.telemetry.ocrInterval);
  await screenCaptureService.initialize();

  screenCaptureService.onOCRResult((result) => {
    mainWindow?.webContents.send(IPC_CHANNELS.OCR_UPDATE, result);
    productivityEngine.updateOCR(result);
  });

  windowTrackerService = new WindowTrackerService();
  windowTrackerService.setExcludedApps(settings.privacy.excludedApps);
  
  windowTrackerService.onWindowUpdate((metadata) => {
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_UPDATE, metadata);
    productivityEngine.updateWindow(metadata);
  });

  inputTrackerService = new InputTrackerService();
  if (mainWindow) {
    inputTrackerService.setMainWindow(mainWindow);
  }

  inputTrackerService.onInputUpdate((telemetry) => {
    mainWindow?.webContents.send(IPC_CHANNELS.INPUT_UPDATE, telemetry);
    productivityEngine.updateInput(telemetry);
  });

  console.log('[Main] Services initialized');
}

async function startTracking() {
  if (isTrackingActive) return;

  const settings = dataService.getSettings();

  if (settings.telemetry.screenCapture) {
    await screenCaptureService.start();
  }

  if (settings.telemetry.windowTracking) {
    windowTrackerService.start();
  }

  if (settings.telemetry.inputTracking) {
    inputTrackerService.start();
  }

  isTrackingActive = true;
  console.log('[Main] Tracking started');
}

function stopTracking() {
  if (!isTrackingActive) return;

  screenCaptureService.stop();
  windowTrackerService.stop();
  inputTrackerService.stop();

  isTrackingActive = false;
  console.log('[Main] Tracking stopped');
}

// ============================================================================
// IPC Handlers
// ============================================================================

function setupIPCHandlers() {
  // Tracking controls
  ipcMain.handle(IPC_CHANNELS.START_TRACKING, async () => {
    await startTracking();
  });

  ipcMain.handle(IPC_CHANNELS.STOP_TRACKING, () => {
    stopTracking();
  });

  ipcMain.handle(IPC_CHANNELS.CAPTURE_SCREEN, async () => {
    return await screenCaptureService.captureScreen();
  });

  // Settings
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
    return dataService.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_SETTINGS, async (_, settings: Partial<AppSettings>) => {
    await dataService.updateSettings(settings);
    
    // Apply settings to services
    const newSettings = dataService.getSettings();
    
    if (newSettings.telemetry.ocrInterval) {
      screenCaptureService.setCaptureInterval(newSettings.telemetry.ocrInterval);
    }
    
    if (newSettings.privacy.excludedApps) {
      windowTrackerService.setExcludedApps(newSettings.privacy.excludedApps);
    }
  });

  // Goals
  ipcMain.handle(IPC_CHANNELS.GET_GOALS, () => {
    return dataService.getGoals();
  });

  ipcMain.handle(IPC_CHANNELS.ADD_GOAL, async (_, goal) => {
    return await dataService.addGoal(goal);
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_GOAL, async (_, id: string, updates) => {
    await dataService.updateGoal(id, updates);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_GOAL, async (_, id: string) => {
    await dataService.deleteGoal(id);
  });

  // Events
  ipcMain.handle(IPC_CHANNELS.GET_EVENTS, (_, limit?: number) => {
    return productivityEngine.getEvents(limit);
  });

  // Overlay
  ipcMain.handle(IPC_CHANNELS.TOGGLE_OVERLAY, async (_, enabled: boolean) => {
    if (enabled && !overlayWindow) {
      createOverlayWindow();
    } else if (!enabled && overlayWindow) {
      overlayWindow.close();
      overlayWindow = null;
    }
    
    await dataService.updateSettings({
      overlay: { ...dataService.getSettings().overlay, enabled },
    });
  });

  // Privacy/Data
  ipcMain.handle(IPC_CHANNELS.EXPORT_DATA, async () => {
    return await dataService.exportData();
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_DATA, async () => {
    stopTracking();
    await dataService.deleteAllData();
    productivityEngine.clear();
  });

  // Input tracking (from renderer)
  ipcMain.on('input:keystroke', () => {
    inputTrackerService.recordKeystroke();
  });

  ipcMain.on('input:mousemove', (_, data: { deltaX: number; deltaY: number }) => {
    inputTrackerService.recordMouseMovement(data.deltaX, data.deltaY);
  });

  console.log('[Main] IPC handlers registered');
}

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(async () => {
  // Initialize services
  await initializeServices();

  // Setup IPC
  setupIPCHandlers();

  // Create windows
  createMainWindow();

  // Create overlay if enabled
  const settings = dataService.getSettings();
  if (settings.overlay.enabled) {
    createOverlayWindow();
  }

  // Auto-start tracking
  await startTracking();

  console.log('[Main] App ready');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', async () => {
  console.log('[Main] App shutting down...');
  
  // Stop tracking
  stopTracking();

  // Cleanup services
  await screenCaptureService.destroy();
  windowTrackerService.destroy();
  inputTrackerService.destroy();
  await dataService.shutdown();

  console.log('[Main] Cleanup complete');
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled rejection:', reason);
});
