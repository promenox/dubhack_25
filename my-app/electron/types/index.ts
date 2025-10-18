/**
 * Type definitions for the Productivity Garden application
 * Shared between main process and renderer process
 */

// ============================================================================
// Telemetry & Metrics Types
// ============================================================================

/**
 * OCR result from screen capture analysis
 */
export interface OCRResult {
  text: string;
  confidence: number;
  timestamp: number;
  hasFocusedContent: boolean; // Indicates meaningful text detected
}

/**
 * Active window metadata
 */
export interface WindowMetadata {
  title: string;
  owner: {
    name: string;
    processId: number;
  };
  category?: 'productive' | 'distraction' | 'neutral';
  timestamp: number;
}

/**
 * Safe input telemetry (no raw keystrokes)
 */
export interface InputTelemetry {
  keystrokesPerMinute: number;
  mouseMovementDistance: number; // pixels per minute
  idleTimeSeconds: number;
  timestamp: number;
}

/**
 * Combined productivity metrics
 */
export interface ProductivityMetrics {
  score: number; // 0-100
  focusScore: number; // 0-100
  activityScore: number; // 0-100
  contextScore: number; // 0-100 (based on active window)
  signals: {
    hasTextFocus: boolean;
    isProductive: boolean;
    isIdle: boolean;
    activeApp: string;
  };
  timestamp: number;
}

/**
 * Historical productivity event
 */
export interface ProductivityEvent {
  id: string;
  type: 'focus-session' | 'break' | 'distraction' | 'milestone';
  score: number;
  duration: number; // seconds
  description: string;
  timestamp: number;
}

/**
 * User goal definition
 */
export interface Goal {
  id: string;
  title: string;
  target: number; // target score or hours
  current: number;
  type: 'daily-score' | 'weekly-hours' | 'focus-sessions';
  createdAt: number;
  deadline?: number;
}

/**
 * Application settings
 */
export interface AppSettings {
  telemetry: {
    screenCapture: boolean;
    windowTracking: boolean;
    inputTracking: boolean;
    ocrInterval: number; // seconds
  };
  overlay: {
    enabled: boolean;
    opacity: number;
    size: 'small' | 'medium' | 'large';
  };
  privacy: {
    storageRetentionDays: number;
    excludedApps: string[];
  };
}

// ============================================================================
// IPC Channel Names
// ============================================================================

export const IPC_CHANNELS = {
  // Telemetry channels
  WINDOW_UPDATE: 'window:update',
  INPUT_UPDATE: 'input:update',
  OCR_UPDATE: 'ocr:update',
  METRICS_UPDATE: 'metrics:update',
  
  // Command channels
  START_TRACKING: 'tracking:start',
  STOP_TRACKING: 'tracking:stop',
  CAPTURE_SCREEN: 'screen:capture',
  
  // Settings channels
  GET_SETTINGS: 'settings:get',
  UPDATE_SETTINGS: 'settings:update',
  
  // Goals channels
  GET_GOALS: 'goals:get',
  ADD_GOAL: 'goals:add',
  UPDATE_GOAL: 'goals:update',
  DELETE_GOAL: 'goals:delete',
  
  // Events channels
  GET_EVENTS: 'events:get',
  
  // Overlay channels
  TOGGLE_OVERLAY: 'overlay:toggle',
  
  // Privacy/Data channels
  EXPORT_DATA: 'data:export',
  DELETE_DATA: 'data:delete',
} as const;

// ============================================================================
// IPC API Type Definition
// ============================================================================

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

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

