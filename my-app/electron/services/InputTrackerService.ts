/**
 * InputTrackerService
 * 
 * Safely tracks input activity metrics without recording actual keystrokes or
 * mouse positions. Only aggregated statistics are collected:
 * - Keystrokes per minute (count only, no key content)
 * - Mouse movement distance (pixels per minute)
 * - Idle time detection
 * 
 * Privacy Note: NO raw keystroke data or mouse positions are stored. Only
 * aggregated counts and rates. This service operates on renderer-side events
 * when the app is focused, plus idle detection from Electron's powerMonitor.
 */

import { powerMonitor, BrowserWindow } from 'electron';
import type { InputTelemetry } from '../types/index.js';

export class InputTrackerService {
  private isRunning: boolean = false;
  private intervalHandle: NodeJS.Timeout | null = null;
  private aggregationIntervalSeconds: number = 60; // Aggregate every 60 seconds
  private onInputUpdateCallback?: (telemetry: InputTelemetry) => void;

  // Counters for current aggregation window
  private keystrokeCount: number = 0;
  private mouseMovementPixels: number = 0;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private lastActivityTime: number = Date.now();
  
  // IPC handler for renderer events
  private mainWindow: BrowserWindow | null = null;

  constructor(aggregationIntervalSeconds: number = 60) {
    this.aggregationIntervalSeconds = aggregationIntervalSeconds;
  }

  /**
   * Set the main window for IPC communication
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Register callback for input telemetry updates
   */
  onInputUpdate(callback: (telemetry: InputTelemetry) => void): void {
    this.onInputUpdateCallback = callback;
  }

  /**
   * Start tracking input telemetry
   */
  start(): void {
    if (this.isRunning) {
      console.log('[InputTracker] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[InputTracker] Started with interval: ${this.aggregationIntervalSeconds}s`);

    // Reset counters
    this.keystrokeCount = 0;
    this.mouseMovementPixels = 0;
    this.lastActivityTime = Date.now();

    // Start aggregation interval
    this.intervalHandle = setInterval(() => {
      this.aggregateAndEmit();
    }, this.aggregationIntervalSeconds * 1000);

    // Setup IPC listeners for renderer events
    this.setupIPCListeners();
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.isRunning = false;
    console.log('[InputTracker] Stopped');
  }

  /**
   * Setup IPC listeners to receive input events from renderer
   * Renderer will send aggregated events (not raw keystrokes)
   */
  private setupIPCListeners(): void {
    if (!this.mainWindow) {
      console.warn('[InputTracker] No main window set, cannot setup IPC');
      return;
    }

    // Note: These listeners are set up, but the actual IPC handlers
    // will be registered in main.ts. This service just tracks the data.
    console.log('[InputTracker] IPC listeners ready for renderer input events');
  }

  /**
   * Record a keystroke (called from IPC handler)
   * NO keystroke content is recorded, only the count
   */
  recordKeystroke(): void {
    if (!this.isRunning) return;
    
    this.keystrokeCount++;
    this.lastActivityTime = Date.now();
  }

  /**
   * Record mouse movement (called from IPC handler)
   * Only distance is recorded, not position
   */
  recordMouseMovement(deltaX: number, deltaY: number): void {
    if (!this.isRunning) return;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    this.mouseMovementPixels += distance;
    this.lastActivityTime = Date.now();
  }

  /**
   * Aggregate collected data and emit telemetry
   */
  private aggregateAndEmit(): void {
    const now = Date.now();
    const idleTimeSeconds = Math.floor((now - this.lastActivityTime) / 1000);

    // Calculate rates per minute
    const intervalMinutes = this.aggregationIntervalSeconds / 60;
    const keystrokesPerMinute = Math.round(this.keystrokeCount / intervalMinutes);
    const mouseMovementDistance = Math.round(this.mouseMovementPixels / intervalMinutes);

    const telemetry: InputTelemetry = {
      keystrokesPerMinute,
      mouseMovementDistance,
      idleTimeSeconds,
      timestamp: now,
    };

    console.log(`[InputTracker] Telemetry: ${keystrokesPerMinute} KPM, ${mouseMovementDistance} px/min movement, ${idleTimeSeconds}s idle`);

    if (this.onInputUpdateCallback) {
      this.onInputUpdateCallback(telemetry);
    }

    // Reset counters for next window
    this.keystrokeCount = 0;
    this.mouseMovementPixels = 0;
  }

  /**
   * Get idle time in seconds (using Electron's powerMonitor)
   * Note: powerMonitor.getSystemIdleTime() returns system-wide idle time
   */
  getIdleTimeSeconds(): number {
    try {
      return powerMonitor.getSystemIdleState(60); // Check if idle for 60 seconds
    } catch (error) {
      // Fallback to our own tracking
      return Math.floor((Date.now() - this.lastActivityTime) / 1000);
    }
  }

  /**
   * Manually trigger aggregation (useful for testing)
   */
  forceAggregate(): void {
    this.aggregateAndEmit();
  }

  /**
   * Get current status
   */
  getStatus(): { 
    isRunning: boolean; 
    interval: number;
    currentStats: {
      keystrokes: number;
      mouseMovement: number;
      idleTime: number;
    }
  } {
    return {
      isRunning: this.isRunning,
      interval: this.aggregationIntervalSeconds,
      currentStats: {
        keystrokes: this.keystrokeCount,
        mouseMovement: Math.round(this.mouseMovementPixels),
        idleTime: Math.floor((Date.now() - this.lastActivityTime) / 1000),
      },
    };
  }

  /**
   * Update aggregation interval
   */
  setAggregationInterval(seconds: number): void {
    this.aggregationIntervalSeconds = Math.max(10, seconds);
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
  }
}

/**
 * Input Tracker Client (for renderer process)
 * 
 * This code should be used in the renderer to capture input events
 * and send them to the main process via IPC. Add this to your renderer:
 * 
 * @example
 * ```typescript
 * // In renderer (React component or hook)
 * useEffect(() => {
 *   let lastMouseX = 0;
 *   let lastMouseY = 0;
 * 
 *   const handleKeyPress = () => {
 *     window.electron.send('input:keystroke');
 *   };
 * 
 *   const handleMouseMove = (e: MouseEvent) => {
 *     const deltaX = e.clientX - lastMouseX;
 *     const deltaY = e.clientY - lastMouseY;
 *     window.electron.send('input:mousemove', { deltaX, deltaY });
 *     lastMouseX = e.clientX;
 *     lastMouseY = e.clientY;
 *   };
 * 
 *   // Throttle mouse events
 *   const throttledMouseMove = throttle(handleMouseMove, 100);
 * 
 *   window.addEventListener('keydown', handleKeyPress);
 *   window.addEventListener('mousemove', throttledMouseMove);
 * 
 *   return () => {
 *     window.removeEventListener('keydown', handleKeyPress);
 *     window.removeEventListener('mousemove', throttledMouseMove);
 *   };
 * }, []);
 * ```
 */

