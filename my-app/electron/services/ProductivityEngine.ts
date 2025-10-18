/**
 * ProductivityEngine
 * 
 * Core engine that combines multiple telemetry signals to compute a
 * productivity score (0-100) and detailed metrics. Uses a pluggable
 * scoring algorithm that can be replaced with ML models in the future.
 * 
 * Current implementation uses a weighted rule-based scoring system:
 * - Focus score: Based on OCR text presence and quality
 * - Activity score: Based on keyboard/mouse input rates
 * - Context score: Based on active window categorization
 * 
 * Final score is a weighted combination of these sub-scores.
 */

import type { 
  OCRResult, 
  WindowMetadata, 
  InputTelemetry, 
  ProductivityMetrics,
  ProductivityEvent 
} from '../types/index.js';

interface ScoringWeights {
  focus: number;      // Weight for focus score (0-1)
  activity: number;   // Weight for activity score (0-1)
  context: number;    // Weight for context score (0-1)
}

interface EngineState {
  lastOCR: OCRResult | null;
  lastWindow: WindowMetadata | null;
  lastInput: InputTelemetry | null;
  currentScore: number;
  events: ProductivityEvent[];
}

export class ProductivityEngine {
  private state: EngineState = {
    lastOCR: null,
    lastWindow: null,
    lastInput: null,
    currentScore: 0,
    events: [],
  };

  private weights: ScoringWeights = {
    focus: 0.4,    // 40% weight on focus (OCR-based)
    activity: 0.3, // 30% weight on activity (input-based)
    context: 0.3,  // 30% weight on context (window-based)
  };

  private onMetricsUpdateCallback?: (metrics: ProductivityMetrics) => void;
  private scoreHistory: number[] = [];
  private readonly maxHistorySize = 100; // Keep last 100 scores

  constructor() {
    console.log('[ProductivityEngine] Initialized with weights:', this.weights);
  }

  /**
   * Register callback for metrics updates
   */
  onMetricsUpdate(callback: (metrics: ProductivityMetrics) => void): void {
    this.onMetricsUpdateCallback = callback;
  }

  /**
   * Update with new OCR result
   */
  updateOCR(ocr: OCRResult): void {
    this.state.lastOCR = ocr;
    this.recalculateMetrics();
  }

  /**
   * Update with new window metadata
   */
  updateWindow(window: WindowMetadata): void {
    this.state.lastWindow = window;
    this.recalculateMetrics();
  }

  /**
   * Update with new input telemetry
   */
  updateInput(input: InputTelemetry): void {
    this.state.lastInput = input;
    this.recalculateMetrics();
  }

  /**
   * Recalculate productivity metrics based on current state
   */
  private recalculateMetrics(): void {
    // Calculate sub-scores
    const focusScore = this.calculateFocusScore();
    const activityScore = this.calculateActivityScore();
    const contextScore = this.calculateContextScore();

    // Calculate weighted final score
    const score = Math.round(
      focusScore * this.weights.focus +
      activityScore * this.weights.activity +
      contextScore * this.weights.context
    );

    // Clamp to 0-100
    const clampedScore = Math.max(0, Math.min(100, score));

    // Update score history
    this.scoreHistory.push(clampedScore);
    if (this.scoreHistory.length > this.maxHistorySize) {
      this.scoreHistory.shift();
    }

    // Update state
    this.state.currentScore = clampedScore;

    // Generate signals
    const signals = {
      hasTextFocus: this.state.lastOCR?.hasFocusedContent ?? false,
      isProductive: clampedScore >= 60,
      isIdle: (this.state.lastInput?.idleTimeSeconds ?? 0) > 120, // 2 minutes idle
      activeApp: this.state.lastWindow?.owner.name ?? 'Unknown',
    };

    // Create metrics object
    const metrics: ProductivityMetrics = {
      score: clampedScore,
      focusScore,
      activityScore,
      contextScore,
      signals,
      timestamp: Date.now(),
    };

    console.log(`[ProductivityEngine] Score: ${clampedScore} (Focus: ${focusScore}, Activity: ${activityScore}, Context: ${contextScore})`);

    // Detect and record events
    this.detectEvents(metrics);

    // Emit metrics
    if (this.onMetricsUpdateCallback) {
      this.onMetricsUpdateCallback(metrics);
    }
  }

  /**
   * Calculate focus score based on OCR results
   * - Presence of focused content
   * - OCR confidence
   * - Recency of OCR data
   */
  private calculateFocusScore(): number {
    if (!this.state.lastOCR) return 0;

    const { confidence, hasFocusedContent, timestamp } = this.state.lastOCR;
    const age = Date.now() - timestamp;
    const maxAge = 120000; // 2 minutes

    // Base score from OCR confidence
    let score = confidence;

    // Boost if focused content detected
    if (hasFocusedContent) {
      score = Math.min(100, score + 20);
    }

    // Reduce score based on age of data
    const ageMultiplier = Math.max(0, 1 - age / maxAge);
    score *= ageMultiplier;

    return Math.round(score);
  }

  /**
   * Calculate activity score based on input telemetry
   * - Keystrokes per minute
   * - Mouse movement
   * - Idle time penalty
   */
  private calculateActivityScore(): number {
    if (!this.state.lastInput) return 0;

    const { keystrokesPerMinute, mouseMovementDistance, idleTimeSeconds } = this.state.lastInput;

    // Keystroke score (optimal: 40-80 KPM for focused work)
    const optimalKPM = 60;
    const kpmScore = Math.min(100, (keystrokesPerMinute / optimalKPM) * 100);

    // Mouse movement score (optimal: moderate movement)
    const optimalMovement = 1000; // pixels per minute
    const movementScore = Math.min(100, (mouseMovementDistance / optimalMovement) * 100);

    // Combined input score (favor keyboard over mouse for productivity)
    let score = kpmScore * 0.7 + movementScore * 0.3;

    // Idle penalty
    if (idleTimeSeconds > 60) {
      const idlePenalty = Math.min(100, (idleTimeSeconds / 300) * 100); // Full penalty at 5 minutes
      score *= (1 - idlePenalty / 100);
    }

    return Math.round(score);
  }

  /**
   * Calculate context score based on active window
   * - Productive apps: high score
   * - Distracting apps: low score
   * - Neutral apps: medium score
   */
  private calculateContextScore(): number {
    if (!this.state.lastWindow) return 50; // Neutral default

    const { category, timestamp } = this.state.lastWindow;
    const age = Date.now() - timestamp;
    const maxAge = 30000; // 30 seconds

    // Base score by category
    let score = 50; // Neutral
    if (category === 'productive') {
      score = 90;
    } else if (category === 'distraction') {
      score = 20;
    }

    // Reduce score based on age of data
    const ageMultiplier = Math.max(0.5, 1 - age / maxAge); // Min 50% even if stale
    score *= ageMultiplier;

    return Math.round(score);
  }

  /**
   * Detect and record productivity events
   * Events are triggered by significant score changes or patterns
   */
  private detectEvents(metrics: ProductivityMetrics): void {
    const { score, signals } = metrics;

    // Focus session detection: sustained high score
    if (score >= 70 && this.scoreHistory.length >= 5) {
      const recentScores = this.scoreHistory.slice(-5);
      const avgRecentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      
      if (avgRecentScore >= 65) {
        // Check if we already have a recent focus session event
        const lastEvent = this.state.events[this.state.events.length - 1];
        const shouldCreateEvent = !lastEvent || 
          lastEvent.type !== 'focus-session' ||
          Date.now() - lastEvent.timestamp > 300000; // 5 minutes

        if (shouldCreateEvent) {
          this.addEvent({
            type: 'focus-session',
            score,
            duration: 300, // 5 minutes
            description: `Focused work session on ${signals.activeApp}`,
          });
        }
      }
    }

    // Break detection: sustained idle
    if (signals.isIdle) {
      const lastEvent = this.state.events[this.state.events.length - 1];
      if (!lastEvent || lastEvent.type !== 'break') {
        this.addEvent({
          type: 'break',
          score,
          duration: this.state.lastInput?.idleTimeSeconds ?? 0,
          description: 'Taking a break',
        });
      }
    }

    // Distraction detection: low score with active input
    if (score < 40 && !signals.isIdle && signals.activeApp !== 'Unknown') {
      const lastEvent = this.state.events[this.state.events.length - 1];
      const shouldCreateEvent = !lastEvent || 
        lastEvent.type !== 'distraction' ||
        Date.now() - lastEvent.timestamp > 600000; // 10 minutes

      if (shouldCreateEvent) {
        this.addEvent({
          type: 'distraction',
          score,
          duration: 0,
          description: `Distraction detected in ${signals.activeApp}`,
        });
      }
    }

    // Milestone detection: score threshold crossed
    if (score >= 80 && (this.scoreHistory[this.scoreHistory.length - 2] ?? 0) < 80) {
      this.addEvent({
        type: 'milestone',
        score,
        duration: 0,
        description: 'High productivity achieved!',
      });
    }
  }

  /**
   * Add a productivity event
   */
  private addEvent(event: Omit<ProductivityEvent, 'id' | 'timestamp'>): void {
    const fullEvent: ProductivityEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.state.events.push(fullEvent);

    // Keep only recent events (last 100)
    if (this.state.events.length > 100) {
      this.state.events = this.state.events.slice(-100);
    }

    console.log(`[ProductivityEngine] Event: ${fullEvent.type} - ${fullEvent.description}`);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): ProductivityMetrics {
    return {
      score: this.state.currentScore,
      focusScore: this.calculateFocusScore(),
      activityScore: this.calculateActivityScore(),
      contextScore: this.calculateContextScore(),
      signals: {
        hasTextFocus: this.state.lastOCR?.hasFocusedContent ?? false,
        isProductive: this.state.currentScore >= 60,
        isIdle: (this.state.lastInput?.idleTimeSeconds ?? 0) > 120,
        activeApp: this.state.lastWindow?.owner.name ?? 'Unknown',
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Get recent events
   */
  getEvents(limit: number = 20): ProductivityEvent[] {
    return this.state.events.slice(-limit).reverse();
  }

  /**
   * Get score history
   */
  getScoreHistory(): number[] {
    return [...this.scoreHistory];
  }

  /**
   * Update scoring weights (allows customization or ML tuning)
   */
  updateWeights(weights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...weights };
    
    // Normalize weights to sum to 1.0
    const total = this.weights.focus + this.weights.activity + this.weights.context;
    this.weights.focus /= total;
    this.weights.activity /= total;
    this.weights.context /= total;

    console.log('[ProductivityEngine] Updated weights:', this.weights);
    this.recalculateMetrics();
  }

  /**
   * Get current weights
   */
  getWeights(): ScoringWeights {
    return { ...this.weights };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.state = {
      lastOCR: null,
      lastWindow: null,
      lastInput: null,
      currentScore: 0,
      events: [],
    };
    this.scoreHistory = [];
    console.log('[ProductivityEngine] Data cleared');
  }

  /**
   * Export state for persistence
   */
  exportState(): EngineState {
    return { ...this.state };
  }

  /**
   * Import state from persistence
   */
  importState(state: EngineState): void {
    this.state = state;
    this.recalculateMetrics();
  }
}

/**
 * FUTURE: ML Integration
 * 
 * To integrate a machine learning model:
 * 
 * 1. Create a new MLScoringEngine class that extends or replaces ProductivityEngine
 * 2. Train a model on historical telemetry data and user-labeled productivity scores
 * 3. Replace the rule-based calculate*Score() methods with model predictions
 * 4. Use a lightweight model (e.g., TensorFlow.js) that runs locally
 * 
 * @example
 * ```typescript
 * class MLProductivityEngine extends ProductivityEngine {
 *   private model: tf.LayersModel;
 * 
 *   async loadModel(modelPath: string) {
 *     this.model = await tf.loadLayersModel(modelPath);
 *   }
 * 
 *   protected calculateFocusScore(): number {
 *     if (!this.model || !this.state.lastOCR) return 0;
 *     const input = this.prepareOCRFeatures(this.state.lastOCR);
 *     const prediction = this.model.predict(input) as tf.Tensor;
 *     return prediction.dataSync()[0] * 100;
 *   }
 * }
 * ```
 */

