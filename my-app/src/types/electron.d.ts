/**
 * TypeScript declarations for Electron API in renderer
 * This ensures type safety when using window.electron
 */

import type { 
  OCRResult, 
  WindowMetadata, 
  InputTelemetry, 
  ProductivityMetrics,
  ProductivityEvent,
  Goal,
  AppSettings 
} from '../../electron/types';

export interface ElectronAPI {
  // Event listeners
  onWindowUpdate: (callback: (data: WindowMetadata) => void) => () => void;
  onInputUpdate: (callback: (data: InputTelemetry) => void) => () => void;
  onOCRUpdate: (callback: (data: OCRResult) => void) => () => void;
  onMetricsUpdate: (callback: (data: ProductivityMetrics) => void) => () => void;
  
  // Commands
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  captureScreen: () => Promise<OCRResult>;
  
  // Settings
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // Goals
  getGoals: () => Promise<Goal[]>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Events
  getEvents: (limit?: number) => Promise<ProductivityEvent[]>;
  
  // Overlay
  toggleOverlay: (enabled: boolean) => Promise<void>;
  
  // Privacy
  exportData: () => Promise<string>;
  deleteData: () => Promise<void>;
}

export interface InputTrackingAPI {
  recordKeystroke: () => void;
  recordMouseMove: (deltaX: number, deltaY: number) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    inputTracking: InputTrackingAPI;
  }
}

export {};

