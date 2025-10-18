/**
 * ProductivityContext
 * 
 * React context for managing global productivity state.
 * Connects to Electron IPC and provides real-time updates.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { 
  ProductivityMetrics, 
  ProductivityEvent, 
  Goal, 
  AppSettings,
  WindowMetadata,
  InputTelemetry,
  OCRResult 
} from '../../electron/types';

interface ProductivityContextValue {
  // Current state
  metrics: ProductivityMetrics | null;
  events: ProductivityEvent[];
  goals: Goal[];
  settings: AppSettings | null;
  
  // Latest telemetry
  lastWindow: WindowMetadata | null;
  lastInput: InputTelemetry | null;
  lastOCR: OCRResult | null;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  refreshGoals: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  toggleOverlay: (enabled: boolean) => Promise<void>;
  exportData: () => Promise<string>;
  deleteData: () => Promise<void>;
}

const ProductivityContext = createContext<ProductivityContextValue | null>(null);

export const useProductivity = () => {
  const context = useContext(ProductivityContext);
  if (!context) {
    throw new Error('useProductivity must be used within ProductivityProvider');
  }
  return context;
};

interface Props {
  children: React.ReactNode;
}

export const ProductivityProvider: React.FC<Props> = ({ children }) => {
  // State
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
  const [events, setEvents] = useState<ProductivityEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [lastWindow, setLastWindow] = useState<WindowMetadata | null>(null);
  const [lastInput, setLastInput] = useState<InputTelemetry | null>(null);
  const [lastOCR, setLastOCR] = useState<OCRResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: load initial data
  useEffect(() => {
    const initialize = async () => {
      try {
        const [initialGoals, initialEvents, initialSettings] = await Promise.all([
          window.electron.getGoals(),
          window.electron.getEvents(20),
          window.electron.getSettings(),
        ]);
        
        setGoals(initialGoals);
        setEvents(initialEvents);
        setSettings(initialSettings);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Setup IPC listeners
  useEffect(() => {
    // Metrics updates
    const unsubMetrics = window.electron.onMetricsUpdate((data) => {
      setMetrics(data);
    });

    // Window updates
    const unsubWindow = window.electron.onWindowUpdate((data) => {
      setLastWindow(data);
    });

    // Input updates
    const unsubInput = window.electron.onInputUpdate((data) => {
      setLastInput(data);
    });

    // OCR updates
    const unsubOCR = window.electron.onOCRUpdate((data) => {
      setLastOCR(data);
    });

    return () => {
      unsubMetrics();
      unsubWindow();
      unsubInput();
      unsubOCR();
    };
  }, []);

  // Actions
  const refreshGoals = useCallback(async () => {
    const data = await window.electron.getGoals();
    setGoals(data);
  }, []);

  const refreshEvents = useCallback(async () => {
    const data = await window.electron.getEvents(20);
    setEvents(data);
  }, []);

  const refreshSettings = useCallback(async () => {
    const data = await window.electron.getSettings();
    setSettings(data);
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    await window.electron.addGoal(goal);
    await refreshGoals();
  }, [refreshGoals]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    await window.electron.updateGoal(id, updates);
    await refreshGoals();
  }, [refreshGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    await window.electron.deleteGoal(id);
    await refreshGoals();
  }, [refreshGoals]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    await window.electron.updateSettings(updates);
    await refreshSettings();
  }, [refreshSettings]);

  const toggleOverlay = useCallback(async (enabled: boolean) => {
    await window.electron.toggleOverlay(enabled);
    await refreshSettings();
  }, [refreshSettings]);

  const exportData = useCallback(async () => {
    return await window.electron.exportData();
  }, []);

  const deleteData = useCallback(async () => {
    await window.electron.deleteData();
    await refreshGoals();
    await refreshEvents();
    setMetrics(null);
  }, [refreshGoals, refreshEvents]);

  // Auto-refresh events periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshEvents();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [refreshEvents]);

  const value: ProductivityContextValue = {
    metrics,
    events,
    goals,
    settings,
    lastWindow,
    lastInput,
    lastOCR,
    isLoading,
    refreshGoals,
    refreshEvents,
    refreshSettings,
    addGoal,
    updateGoal,
    deleteGoal,
    updateSettings,
    toggleOverlay,
    exportData,
    deleteData,
  };

  return (
    <ProductivityContext.Provider value={value}>
      {children}
    </ProductivityContext.Provider>
  );
};

