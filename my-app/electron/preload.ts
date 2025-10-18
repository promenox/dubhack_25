/**
 * Preload Script
 * 
 * Secure bridge between main process and renderer process.
 * Exposes a minimal, type-safe IPC API to the renderer via contextBridge.
 * 
 * Security: Uses contextIsolation and exposes only necessary APIs.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './types/index.js';
import type { ElectronAPI } from './types/index.js';

/**
 * Create a type-safe IPC API for the renderer
 */
const electronAPI: ElectronAPI = {
  // ============================================================================
  // Event Listeners
  // ============================================================================

  onWindowUpdate: (callback) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.WINDOW_UPDATE, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_UPDATE, listener);
  },

  onInputUpdate: (callback) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.INPUT_UPDATE, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.INPUT_UPDATE, listener);
  },

  onOCRUpdate: (callback) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.OCR_UPDATE, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.OCR_UPDATE, listener);
  },

  onMetricsUpdate: (callback) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.METRICS_UPDATE, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.METRICS_UPDATE, listener);
  },

  // ============================================================================
  // Commands
  // ============================================================================

  startTracking: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.START_TRACKING);
  },

  stopTracking: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.STOP_TRACKING);
  },

  captureScreen: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_SCREEN);
  },

  // ============================================================================
  // Settings
  // ============================================================================

  getSettings: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS);
  },

  updateSettings: (settings) => {
    return ipcRenderer.invoke(IPC_CHANNELS.UPDATE_SETTINGS, settings);
  },

  // ============================================================================
  // Goals
  // ============================================================================

  getGoals: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_GOALS);
  },

  addGoal: (goal) => {
    return ipcRenderer.invoke(IPC_CHANNELS.ADD_GOAL, goal);
  },

  updateGoal: (id, updates) => {
    return ipcRenderer.invoke(IPC_CHANNELS.UPDATE_GOAL, id, updates);
  },

  deleteGoal: (id) => {
    return ipcRenderer.invoke(IPC_CHANNELS.DELETE_GOAL, id);
  },

  // ============================================================================
  // Events
  // ============================================================================

  getEvents: (limit) => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_EVENTS, limit);
  },

  // ============================================================================
  // Overlay
  // ============================================================================

  toggleOverlay: (enabled) => {
    return ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_OVERLAY, enabled);
  },

  // ============================================================================
  // Privacy
  // ============================================================================

  exportData: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.EXPORT_DATA);
  },

  deleteData: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.DELETE_DATA);
  },
};

/**
 * Expose the API to the renderer process
 * This creates window.electron in the renderer
 */
contextBridge.exposeInMainWorld('electron', electronAPI);

/**
 * Additional helper to send input events from renderer
 * (for InputTrackerService)
 */
contextBridge.exposeInMainWorld('inputTracking', {
  recordKeystroke: () => {
    ipcRenderer.send('input:keystroke');
  },
  recordMouseMove: (deltaX: number, deltaY: number) => {
    ipcRenderer.send('input:mousemove', { deltaX, deltaY });
  },
});

// Log when preload script is loaded
console.log('[Preload] Script loaded, API exposed to renderer');
