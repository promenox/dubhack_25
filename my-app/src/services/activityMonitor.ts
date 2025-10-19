// Activity Monitor: Tracks user activity via Electron IPC

import { ActivitySnapshot } from "../types";

export class ActivityMonitor {
	private keystrokeCount: number = 0;
	private lastActivityTime: number = Date.now();
	private idleThreshold: number = 30000; // 30 seconds
	private isTracking: boolean = false;

	constructor() {
		// Listen for keyboard events if in browser
		if (typeof window !== "undefined") {
			this.setupKeyboardListener();
			this.setupMouseListener();
		}
	}

	/**
	 * Start tracking activity
	 */
	start(): void {
		this.isTracking = true;
		console.log("🟢 Activity monitoring started");
		console.log("📊 Tracking: keystrokes, mouse movement, mouse clicks, idle state");
		console.log("📸 Screenshot capture: OCR enabled (Tesseract.js)");
		console.log("🎯 All activity will be logged to console with detailed information");
	}

	/**
	 * Stop tracking activity
	 */
	stop(): void {
		this.isTracking = false;
		console.log("Activity monitoring stopped");
	}

	/**
	 * Get current activity snapshot with OCR
	 */
	async getSnapshot(): Promise<ActivitySnapshot> {
		const now = Date.now();
		const isIdle = now - this.lastActivityTime > this.idleThreshold;

		// Capture screen and perform OCR
		let screenText = "No OCR available";
		let ocrConfidence = 0;

		if (window.electronAPI) {
			try {
				// Get screenshot as data URL from main
				const { dataUrl } = await window.electronAPI.captureScreen();
				if (dataUrl) {
					// Run OCR in renderer using service (local tessdata supported via langPath default)
					const { runOCR } = await import("./ocrService");
					const res = await runOCR(dataUrl, "eng", undefined, "/tessdata");
					screenText = res.text;
					ocrConfidence = res.confidence;
					console.log("📝 OCR text:", screenText);
				}
			} catch (error) {
				console.error("❌ OCR capture failed:", error);
				screenText = "OCR failed";
			}
		}

		const snapshot: ActivitySnapshot = {
			timestamp: now,
			appName: "Screen OCR", // Using OCR instead of window detection
			windowTitle: screenText.substring(0, 100) + (screenText.length > 100 ? "..." : ""), // First 100 chars of OCR text
			keystrokeCount: this.keystrokeCount,
			isIdle,
			ocrText: screenText,
			ocrConfidence: ocrConfidence,
		};

		// Debug: Print snapshot metrics to console
		console.log("📸 Activity Snapshot with OCR:", {
			time: new Date(now).toLocaleTimeString(),
			keystrokes: this.keystrokeCount,
			idle: isIdle ? "YES" : "NO",
			timeSinceLastActivity: `${Math.round((now - this.lastActivityTime) / 1000)}s`,
			ocrTextLength: screenText.length,
			ocrConfidence: ocrConfidence,
			ocrPreview: screenText.substring(0, 200) + (screenText.length > 200 ? "..." : ""),
		});

		// Reset keystroke counter
		this.keystrokeCount = 0;

		return snapshot;
	}

	/**
	 * Setup keyboard event listener
	 */
	private setupKeyboardListener(): void {
		document.addEventListener("keydown", (event) => {
			if (!this.isTracking) return;
			this.keystrokeCount++;
			this.lastActivityTime = Date.now();
			console.log(`⌨️  Keystroke detected:`, {
				key: event.key,
				code: event.code,
				total: this.keystrokeCount,
				timestamp: new Date().toLocaleTimeString(),
			});
		});
	}

	/**
	 * Setup mouse event listener
	 */
	private setupMouseListener(): void {
		// Throttle mouse move logging (too frequent otherwise)
		let lastMouseLog = 0;
		document.addEventListener("mousemove", (event) => {
			if (!this.isTracking) return;
			this.lastActivityTime = Date.now();

			// Log mouse movement every 2 seconds max
			const now = Date.now();
			if (now - lastMouseLog > 2000) {
				console.log("🖱️  Mouse movement detected:", {
					x: event.clientX,
					y: event.clientY,
					timestamp: new Date().toLocaleTimeString(),
				});
				lastMouseLog = now;
			}
		});

		document.addEventListener("click", (event) => {
			if (!this.isTracking) return;
			this.lastActivityTime = Date.now();
			console.log("🖱️  Mouse click detected:", {
				button: event.button,
				x: event.clientX,
				y: event.clientY,
				timestamp: new Date().toLocaleTimeString(),
			});
		});

		document.addEventListener("mousedown", (event) => {
			if (!this.isTracking) return;
			this.lastActivityTime = Date.now();
			console.log("🖱️  Mouse down detected:", {
				button: event.button,
				x: event.clientX,
				y: event.clientY,
				timestamp: new Date().toLocaleTimeString(),
			});
		});

		document.addEventListener("mouseup", (event) => {
			if (!this.isTracking) return;
			this.lastActivityTime = Date.now();
			console.log("🖱️  Mouse up detected:", {
				button: event.button,
				x: event.clientX,
				y: event.clientY,
				timestamp: new Date().toLocaleTimeString(),
			});
		});
	}

	/**
	 * Check if user is currently idle
	 */
	isUserIdle(): boolean {
		return Date.now() - this.lastActivityTime > this.idleThreshold;
	}

	/**
	 * Test function to verify tracking is working
	 */
	testTracking(): void {
		console.log("🧪 Testing activity tracking...");
		console.log("Current tracking state:", this.isTracking);
		console.log("Keystroke count:", this.keystrokeCount);
		console.log("Last activity time:", new Date(this.lastActivityTime).toLocaleTimeString());
		console.log("Is user idle:", this.isUserIdle());
	}
}

// Singleton instance
export const activityMonitor = new ActivityMonitor();
