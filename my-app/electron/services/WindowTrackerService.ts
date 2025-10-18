/**
 * WindowTrackerService
 * 
 * Tracks active window metadata (title, application name) to understand
 * user context and categorize activities as productive, distracting, or neutral.
 * 
 * Uses active-win package for cross-platform window detection.
 * 
 * Privacy Note: Only window titles and app names are tracked. No window
 * content is captured. Users can configure excluded apps in settings.
 */

import activeWin from 'active-win';
import type { WindowMetadata } from '../types/index.js';

export class WindowTrackerService {
  private isRunning: boolean = false;
  private intervalHandle: NodeJS.Timeout | null = null;
  private pollIntervalSeconds: number = 5; // Check every 5 seconds
  private onWindowUpdateCallback?: (metadata: WindowMetadata) => void;
  private lastWindowTitle: string = '';
  private excludedApps: Set<string> = new Set();

  // Productivity categorization rules
  private readonly productiveApps = new Set([
    'code', 'vscode', 'visual studio', 'intellij', 'pycharm', 'sublime',
    'atom', 'vim', 'emacs', 'eclipse', 'xcode', 'android studio',
    'word', 'excel', 'powerpoint', 'docs', 'sheets', 'slides',
    'notion', 'obsidian', 'roam', 'evernote', 'onenote',
    'figma', 'sketch', 'photoshop', 'illustrator', 'blender',
    'terminal', 'iterm', 'powershell', 'cmd', 'bash',
  ]);

  private readonly distractionApps = new Set([
    'youtube', 'netflix', 'twitch', 'tiktok', 'instagram',
    'facebook', 'twitter', 'reddit', 'discord', 'messenger',
    'spotify', 'apple music', 'steam', 'epic games',
  ]);

  constructor(pollIntervalSeconds: number = 5) {
    this.pollIntervalSeconds = pollIntervalSeconds;
  }

  /**
   * Register callback for window updates
   */
  onWindowUpdate(callback: (metadata: WindowMetadata) => void): void {
    this.onWindowUpdateCallback = callback;
  }

  /**
   * Set excluded applications (for privacy)
   */
  setExcludedApps(apps: string[]): void {
    this.excludedApps = new Set(apps.map(app => app.toLowerCase()));
    console.log(`[WindowTracker] Excluded apps:`, Array.from(this.excludedApps));
  }

  /**
   * Start tracking active window
   */
  start(): void {
    if (this.isRunning) {
      console.log('[WindowTracker] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[WindowTracker] Started with interval: ${this.pollIntervalSeconds}s`);

    // Track immediately, then start interval
    this.trackActiveWindow();

    this.intervalHandle = setInterval(() => {
      this.trackActiveWindow();
    }, this.pollIntervalSeconds * 1000);
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
    console.log('[WindowTracker] Stopped');
  }

  /**
   * Track the currently active window
   */
  private async trackActiveWindow(): Promise<void> {
    try {
      const window = await activeWin();

      if (!window) {
        console.log('[WindowTracker] No active window detected');
        return;
      }

      // Check if app is excluded
      const appName = window.owner.name.toLowerCase();
      if (this.excludedApps.has(appName)) {
        console.log(`[WindowTracker] Skipping excluded app: ${appName}`);
        return;
      }

      // Only emit update if window title changed (reduce noise)
      if (window.title !== this.lastWindowTitle) {
        this.lastWindowTitle = window.title;

        const metadata: WindowMetadata = {
          title: window.title,
          owner: {
            name: window.owner.name,
            processId: window.owner.processId,
          },
          category: this.categorizeWindow(window.owner.name, window.title),
          timestamp: Date.now(),
        };

        console.log(`[WindowTracker] Active window: ${metadata.owner.name} - ${metadata.title.substring(0, 50)}... [${metadata.category}]`);

        if (this.onWindowUpdateCallback) {
          this.onWindowUpdateCallback(metadata);
        }
      }
    } catch (error) {
      // active-win may fail on some platforms or permission issues
      console.error('[WindowTracker] Error tracking window:', error);
    }
  }

  /**
   * Categorize window as productive, distraction, or neutral
   * Uses heuristics based on app name and window title
   */
  private categorizeWindow(appName: string, title: string): 'productive' | 'distraction' | 'neutral' {
    const appLower = appName.toLowerCase();
    const titleLower = title.toLowerCase();

    // Check productive apps
    for (const productiveApp of this.productiveApps) {
      if (appLower.includes(productiveApp)) {
        return 'productive';
      }
    }

    // Check distraction apps
    for (const distractionApp of this.distractionApps) {
      if (appLower.includes(distractionApp) || titleLower.includes(distractionApp)) {
        return 'distraction';
      }
    }

    // Browser-specific categorization (check title for domain)
    if (appLower.includes('chrome') || appLower.includes('firefox') || 
        appLower.includes('safari') || appLower.includes('edge')) {
      
      // Check for productive domains
      const productiveDomains = ['github', 'stackoverflow', 'docs', 'developer', 'learn', 'tutorial'];
      const hasProductiveDomain = productiveDomains.some(domain => titleLower.includes(domain));
      if (hasProductiveDomain) return 'productive';

      // Check for distraction domains
      const distractionDomains = ['youtube', 'netflix', 'facebook', 'twitter', 'reddit', 'instagram'];
      const hasDistractionDomain = distractionDomains.some(domain => titleLower.includes(domain));
      if (hasDistractionDomain) return 'distraction';
    }

    return 'neutral';
  }

  /**
   * Manually get current active window (for on-demand queries)
   */
  async getCurrentWindow(): Promise<WindowMetadata | null> {
    try {
      const window = await activeWin();
      
      if (!window) return null;

      return {
        title: window.title,
        owner: {
          name: window.owner.name,
          processId: window.owner.processId,
        },
        category: this.categorizeWindow(window.owner.name, window.title),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[WindowTracker] Error getting current window:', error);
      return null;
    }
  }

  /**
   * Update polling interval
   */
  setPollInterval(seconds: number): void {
    this.pollIntervalSeconds = Math.max(1, seconds);
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current status
   */
  getStatus(): { isRunning: boolean; interval: number } {
    return {
      isRunning: this.isRunning,
      interval: this.pollIntervalSeconds,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
  }
}

