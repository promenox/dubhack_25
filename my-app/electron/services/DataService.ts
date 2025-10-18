/**
 * DataService
 * 
 * Handles local data persistence for settings, goals, and productivity history.
 * All data is stored locally in JSON files in the user's app data directory.
 * 
 * Privacy Note: Data is stored locally and never transmitted. Users can
 * export, view, or delete their data at any time.
 */

import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { AppSettings, Goal, ProductivityEvent } from '../types/index.js';

const DEFAULT_SETTINGS: AppSettings = {
  telemetry: {
    screenCapture: true,
    windowTracking: true,
    inputTracking: true,
    ocrInterval: 30,
  },
  overlay: {
    enabled: true,
    opacity: 0.8,
    size: 'medium',
  },
  privacy: {
    storageRetentionDays: 30,
    excludedApps: [],
  },
};

export class DataService {
  private dataDir: string;
  private settingsFile: string;
  private goalsFile: string;
  private eventsFile: string;

  private settings: AppSettings = DEFAULT_SETTINGS;
  private goals: Goal[] = [];
  private events: ProductivityEvent[] = [];

  constructor() {
    // Use Electron's app data directory
    this.dataDir = path.join(app.getPath('userData'), 'productivity-data');
    this.settingsFile = path.join(this.dataDir, 'settings.json');
    this.goalsFile = path.join(this.dataDir, 'goals.json');
    this.eventsFile = path.join(this.dataDir, 'events.json');
  }

  /**
   * Initialize data service (create directories, load data)
   */
  async initialize(): Promise<void> {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log(`[DataService] Data directory: ${this.dataDir}`);

      // Load existing data
      await this.loadSettings();
      await this.loadGoals();
      await this.loadEvents();

      console.log('[DataService] Initialized successfully');
    } catch (error) {
      console.error('[DataService] Error during initialization:', error);
    }
  }

  // ============================================================================
  // Settings Management
  // ============================================================================

  async loadSettings(): Promise<AppSettings> {
    try {
      const data = await fs.readFile(this.settingsFile, 'utf-8');
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      console.log('[DataService] Settings loaded');
    } catch (error) {
      // File doesn't exist or is invalid, use defaults
      console.log('[DataService] Using default settings');
      this.settings = DEFAULT_SETTINGS;
      await this.saveSettings();
    }
    return this.settings;
  }

  async saveSettings(): Promise<void> {
    try {
      await fs.writeFile(
        this.settingsFile,
        JSON.stringify(this.settings, null, 2),
        'utf-8'
      );
      console.log('[DataService] Settings saved');
    } catch (error) {
      console.error('[DataService] Error saving settings:', error);
    }
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    this.settings = {
      ...this.settings,
      ...updates,
      telemetry: { ...this.settings.telemetry, ...updates.telemetry },
      overlay: { ...this.settings.overlay, ...updates.overlay },
      privacy: { ...this.settings.privacy, ...updates.privacy },
    };
    await this.saveSettings();
  }

  // ============================================================================
  // Goals Management
  // ============================================================================

  async loadGoals(): Promise<Goal[]> {
    try {
      const data = await fs.readFile(this.goalsFile, 'utf-8');
      this.goals = JSON.parse(data);
      console.log(`[DataService] Loaded ${this.goals.length} goals`);
    } catch (error) {
      // File doesn't exist, start with empty goals
      this.goals = [];
    }
    return this.goals;
  }

  async saveGoals(): Promise<void> {
    try {
      await fs.writeFile(
        this.goalsFile,
        JSON.stringify(this.goals, null, 2),
        'utf-8'
      );
      console.log('[DataService] Goals saved');
    } catch (error) {
      console.error('[DataService] Error saving goals:', error);
    }
  }

  getGoals(): Goal[] {
    return [...this.goals];
  }

  async addGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    this.goals.push(newGoal);
    await this.saveGoals();
    return newGoal;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    const index = this.goals.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error(`Goal not found: ${id}`);
    }
    this.goals[index] = { ...this.goals[index], ...updates };
    await this.saveGoals();
  }

  async deleteGoal(id: string): Promise<void> {
    this.goals = this.goals.filter(g => g.id !== id);
    await this.saveGoals();
  }

  // ============================================================================
  // Events Management
  // ============================================================================

  async loadEvents(): Promise<ProductivityEvent[]> {
    try {
      const data = await fs.readFile(this.eventsFile, 'utf-8');
      this.events = JSON.parse(data);
      console.log(`[DataService] Loaded ${this.events.length} events`);
      
      // Apply retention policy
      await this.applyRetentionPolicy();
    } catch (error) {
      // File doesn't exist, start with empty events
      this.events = [];
    }
    return this.events;
  }

  async saveEvents(): Promise<void> {
    try {
      await fs.writeFile(
        this.eventsFile,
        JSON.stringify(this.events, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('[DataService] Error saving events:', error);
    }
  }

  getEvents(limit?: number): ProductivityEvent[] {
    const sorted = [...this.events].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async addEvent(event: ProductivityEvent): Promise<void> {
    this.events.push(event);
    
    // Save periodically (every 10 events)
    if (this.events.length % 10 === 0) {
      await this.saveEvents();
    }
  }

  /**
   * Apply retention policy: delete events older than configured days
   */
  async applyRetentionPolicy(): Promise<void> {
    const retentionMs = this.settings.privacy.storageRetentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;
    
    const originalLength = this.events.length;
    this.events = this.events.filter(e => e.timestamp > cutoffTime);
    
    if (this.events.length < originalLength) {
      console.log(`[DataService] Removed ${originalLength - this.events.length} old events (retention policy)`);
      await this.saveEvents();
    }
  }

  // ============================================================================
  // Data Export & Privacy
  // ============================================================================

  /**
   * Export all data as JSON string
   */
  async exportData(): Promise<string> {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.settings,
      goals: this.goals,
      events: this.events,
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Delete all user data (for privacy/reset)
   */
  async deleteAllData(): Promise<void> {
    try {
      // Reset in-memory data
      this.settings = DEFAULT_SETTINGS;
      this.goals = [];
      this.events = [];

      // Delete files
      await Promise.all([
        fs.unlink(this.settingsFile).catch(() => {}),
        fs.unlink(this.goalsFile).catch(() => {}),
        fs.unlink(this.eventsFile).catch(() => {}),
      ]);

      // Recreate with defaults
      await this.saveSettings();
      await this.saveGoals();
      await this.saveEvents();

      console.log('[DataService] All data deleted');
    } catch (error) {
      console.error('[DataService] Error deleting data:', error);
      throw error;
    }
  }

  /**
   * Get data directory path (for user reference)
   */
  getDataDirectory(): string {
    return this.dataDir;
  }

  /**
   * Shutdown: save all pending data
   */
  async shutdown(): Promise<void> {
    await Promise.all([
      this.saveSettings(),
      this.saveGoals(),
      this.saveEvents(),
    ]);
    console.log('[DataService] Shutdown complete');
  }
}

