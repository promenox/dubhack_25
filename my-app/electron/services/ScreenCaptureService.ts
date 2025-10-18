/**
 * ScreenCaptureService
 * 
 * Handles periodic screen capture and OCR analysis using Electron's desktopCapturer
 * and tesseract.js. Captures frames at configurable intervals and extracts text
 * to determine user focus and content engagement.
 * 
 * Privacy Note: Screen captures are processed in-memory and not stored to disk.
 * Only OCR text results are retained for productivity analysis.
 */

import { desktopCapturer } from 'electron';
import Tesseract from 'tesseract.js';
import type { OCRResult } from '../types/index.js';

export class ScreenCaptureService {
  private isRunning: boolean = false;
  private intervalHandle: NodeJS.Timeout | null = null;
  private captureIntervalSeconds: number = 30; // Default: capture every 30 seconds
  private worker: Tesseract.Worker | null = null;
  private onOCRResultCallback?: (result: OCRResult) => void;

  constructor(captureIntervalSeconds: number = 30) {
    this.captureIntervalSeconds = captureIntervalSeconds;
  }

  /**
   * Initialize the OCR worker
   * This is done separately from start() to allow async initialization
   */
  async initialize(): Promise<void> {
    console.log('[ScreenCapture] Initializing Tesseract worker...');
    this.worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    console.log('[ScreenCapture] Tesseract worker ready');
  }

  /**
   * Register callback for OCR results
   */
  onOCRResult(callback: (result: OCRResult) => void): void {
    this.onOCRResultCallback = callback;
  }

  /**
   * Start periodic screen capture and OCR
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[ScreenCapture] Already running');
      return;
    }

    if (!this.worker) {
      await this.initialize();
    }

    this.isRunning = true;
    console.log(`[ScreenCapture] Started with interval: ${this.captureIntervalSeconds}s`);

    // Capture immediately, then start interval
    this.captureAndAnalyze();

    this.intervalHandle = setInterval(() => {
      this.captureAndAnalyze();
    }, this.captureIntervalSeconds * 1000);
  }

  /**
   * Stop screen capture
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.isRunning = false;
    console.log('[ScreenCapture] Stopped');
  }

  /**
   * Capture screen and run OCR analysis
   */
  private async captureAndAnalyze(): Promise<void> {
    try {
      const result = await this.captureScreen();
      if (this.onOCRResultCallback) {
        this.onOCRResultCallback(result);
      }
    } catch (error) {
      console.error('[ScreenCapture] Error during capture/analysis:', error);
    }
  }

  /**
   * Capture a single screen frame and perform OCR
   * Public method to allow manual captures
   */
  async captureScreen(): Promise<OCRResult> {
    const timestamp = Date.now();

    try {
      // Get available desktop sources
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }, // Capture at reasonable resolution
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      // Use the primary screen (first source)
      const primaryScreen = sources[0];
      const thumbnail = primaryScreen.thumbnail;

      // Convert to data URL for Tesseract
      const dataUrl = thumbnail.toDataURL();

      // Perform OCR using the worker
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      console.log('[ScreenCapture] Running OCR on captured frame...');
      const { data } = await this.worker.recognize(dataUrl);

      // Analyze the OCR result
      const text = data.text.trim();
      const confidence = data.confidence;
      const hasFocusedContent = this.analyzeFocusContent(text, confidence);

      const result: OCRResult = {
        text,
        confidence,
        timestamp,
        hasFocusedContent,
      };

      console.log(`[ScreenCapture] OCR complete. Confidence: ${confidence.toFixed(2)}%, Focused: ${hasFocusedContent}`);
      return result;
    } catch (error) {
      console.error('[ScreenCapture] Error capturing screen:', error);
      
      // Return empty result on error
      return {
        text: '',
        confidence: 0,
        timestamp,
        hasFocusedContent: false,
      };
    }
  }

  /**
   * Analyze OCR text to determine if user is focused on meaningful content
   * Heuristics:
   * - Text length > 50 characters
   * - Confidence > 60%
   * - Contains common focused work patterns (code, documents, etc.)
   */
  private analyzeFocusContent(text: string, confidence: number): boolean {
    // Minimum confidence threshold
    if (confidence < 60) return false;

    // Minimum text length
    if (text.length < 50) return false;

    // Check for focused work patterns
    const focusPatterns = [
      /\b(function|class|const|let|var|import|export)\b/i, // Code
      /\b(chapter|section|paragraph|document)\b/i, // Documents
      /\b(project|task|deadline|meeting)\b/i, // Work-related
      /[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/g, // Multiple words (reading/writing)
    ];

    const hasWorkPattern = focusPatterns.some(pattern => pattern.test(text));
    
    // Check word density (focused content has more words)
    const words = text.split(/\s+/).filter(w => w.length > 2);
    const wordDensity = words.length / Math.max(1, text.length / 100);

    return hasWorkPattern && wordDensity > 5;
  }

  /**
   * Update capture interval (seconds)
   */
  setCaptureInterval(seconds: number): void {
    this.captureIntervalSeconds = Math.max(10, seconds); // Minimum 10 seconds
    
    if (this.isRunning) {
      // Restart with new interval
      this.stop();
      this.start();
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.stop();
    
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('[ScreenCapture] Worker terminated');
    }
  }

  /**
   * Get current status
   */
  getStatus(): { isRunning: boolean; interval: number } {
    return {
      isRunning: this.isRunning,
      interval: this.captureIntervalSeconds,
    };
  }
}

