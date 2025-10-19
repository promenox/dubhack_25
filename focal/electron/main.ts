// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FocusAI } from "./focus-ai";
import { FocusTracker } from "./focus-tracker";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

class MainApp {
	mainWindow: BrowserWindow | null;
	debugWindow: BrowserWindow | null;
	overlayWindow: BrowserWindow | null;
	plantOverlayWindow: BrowserWindow | null;
	focusTracker: FocusTracker;
	focusAI: FocusAI;
	isDev: boolean;
	updateInterval: NodeJS.Timeout | null;
	sessionActive: boolean;
	sessionStartTime: number | null;
	overlayUpdateInterval: NodeJS.Timeout | null;

	constructor() {
		this.mainWindow = null;
		this.debugWindow = null;
		this.overlayWindow = null;
		this.plantOverlayWindow = null;
		this.focusTracker = new FocusTracker();

		// Initialize FocusAI with Bedrock API key
		// You can set this via environment variable or directly here
		const bedrockApiKey =
			process.env.BEDROCK_API_KEY ||
			"ABSKQmVkcm9ja0FQSUtleS1rczM5LWF0LTI3NDEwNjczMzMwNDpYZk1GSUFKZThJckt1TWxrT0RIUzAzVkVLR1VBZHJaZTJDbVYzcFQ0eDdjMHlUUUJsYnUvd1BmYituYz0=";
		this.focusAI = new FocusAI(bedrockApiKey);

		this.isDev = process.argv.includes("--dev");
		this.updateInterval = null;
		this.sessionActive = false;
		this.sessionStartTime = null;

		// Initialize keystroke tracking
		this.initializeKeystrokeTracking();
		this.overlayUpdateInterval = null;
	}

	initializeKeystrokeTracking() {
		console.log("🔑 Initializing keystroke tracking...");
		console.log("✅ Keystroke tracking will be set up when main window is ready");
	}

	createWindow() {
		console.log("Creating window...");

		this.mainWindow = new BrowserWindow({
			width: 1200,
			height: 800,
			minWidth: 1000,
			minHeight: 700,
			frame: true,
			titleBarStyle: "hiddenInset",
			backgroundColor: "#0f0f0f",
			show: false,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: path.join(__dirname, "preload.mjs"),
			},
		});

		console.log("Loading main window...");

		if (VITE_DEV_SERVER_URL) {
			this.mainWindow.loadURL(VITE_DEV_SERVER_URL);
		} else {
			this.mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
		}

		// Set up keyboard event tracking for the main window (fallback if global hook fails)
		this.mainWindow.webContents.on("before-input-event", (_event, input) => {
			if (input.type === "keyDown" && this.focusTracker) {
				// Only count if global hook is not active (fallback mode)
				if (!this.focusTracker.iohook) {
					this.focusTracker.keystrokesSinceLastTick++;
					// Log all keystrokes for debugging
					console.log(
						`✓ Keypress detected in main window (fallback mode): ${this.focusTracker.keystrokesSinceLastTick} total`
					);
				}
			}
		});

		// Show window when ready
		this.mainWindow.once("ready-to-show", () => {
			this.mainWindow?.show();
		});

		if (this.isDev) {
			this.mainWindow.webContents.openDevTools();
		}

		console.log("Window created successfully");
	}

	createOverlayWindow() {
		console.log("createOverlayWindow called");
		if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
			console.log("Overlay window already exists, returning");
			return;
		}

		const { width } = screen.getPrimaryDisplay().workAreaSize;
		console.log("Screen width:", width);
		const overlayWidth = 380;
		const overlayHeight = 160;
		const x = Math.round((width - overlayWidth) / 2);
		const y = 20;

		// Platform-specific overlay configuration
		const isMac = process.platform === "darwin";
		const isWindows = process.platform === "win32";

		const overlayConfig: any = {
			width: overlayWidth,
			height: overlayHeight,
			minWidth: 300,
			minHeight: 120,
			maxWidth: 600,
			maxHeight: 400,
			x,
			y,
			frame: false,
			transparent: true,
			resizable: true,
			movable: true,
			alwaysOnTop: true,
			skipTaskbar: true,
			focusable: false,
			backgroundColor: "#00000000",
			show: false,
			fullscreenable: false,
			maximizable: false,
			minimizable: false,
			closable: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: path.join(__dirname, "preload.mjs"),
			},
		};

		// macOS-specific settings
		if (isMac) {
			overlayConfig.titleBarStyle = "hidden";
			overlayConfig.vibrancy = "dark";
			overlayConfig.visualEffectState = "active";
		}

		// Windows-specific settings
		if (isWindows) {
			overlayConfig.autoHideMenuBar = true;
			overlayConfig.thickFrame = false;
		}

		this.overlayWindow = new BrowserWindow(overlayConfig);

		// Platform-specific window behavior
		if (isMac) {
			this.overlayWindow.setAlwaysOnTop(true, "screen-saver");
			this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
			// Enable click-through for macOS
			this.overlayWindow.setIgnoreMouseEvents(false);
			// macOS: Make overlay visible across all spaces and full-screen apps
			this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
		} else if (isWindows) {
			this.overlayWindow.setAlwaysOnTop(true, "screen-saver");
			// Windows-specific transparency handling
			this.overlayWindow.setIgnoreMouseEvents(false);
			// Windows: Set window level to stay above all windows
			try {
				// Use Windows-specific API if available
				this.overlayWindow.setAlwaysOnTop(true, "floating");
			} catch (_) {
				// Fallback
				this.overlayWindow.setAlwaysOnTop(true, "screen-saver");
			}
		}

		if (VITE_DEV_SERVER_URL) {
			this.overlayWindow.loadURL(VITE_DEV_SERVER_URL + "#/overlay");
		} else {
			this.overlayWindow.loadFile(path.join(RENDERER_DIST, "index.html"), {
				hash: "/overlay",
			});
		}

		this.overlayWindow.once("ready-to-show", () => {
			console.log("Overlay window ready to show");
			console.log("Overlay window bounds:", this.overlayWindow?.getBounds());
			this.overlayWindow?.showInactive();
		});

		this.overlayWindow.on("closed", () => {
			console.log("Overlay window closed");
			this.overlayWindow = null;
		});

		// Add drag functionality and keyboard tracking
		this.overlayWindow.webContents.on("before-input-event", (_event, input) => {
			if (input.type === "mouseDown") {
				this.overlayWindow?.setIgnoreMouseEvents(false);
			} else if (input.type === "keyDown" && this.focusTracker) {
				// Only count if global hook is not active (fallback mode)
				if (!this.focusTracker.iohook) {
					this.focusTracker.keystrokesSinceLastTick++;
					// Log all keystrokes for debugging
					console.log(
						`✓ Keypress detected in overlay window (fallback mode): ${this.focusTracker.keystrokesSinceLastTick} total`
					);
				}
			}
		});
	}

	showOverlay(sessionStart: number) {
		console.log("Creating overlay window...");
		this.createOverlayWindow();
		if (!this.overlayWindow) {
			console.log("ERROR: Overlay window was not created");
			return;
		}
		console.log("Overlay window created successfully");

		if (this.overlayWindow.isMinimized()) this.overlayWindow.restore();

		this.overlayWindow.showInactive();
		console.log("Overlay window shown");
		console.log("Final overlay window bounds:", this.overlayWindow.getBounds());

		// Send start event with timestamp after load
		const sendStart = () => {
			try {
				this.overlayWindow?.webContents.send("session-started", { startTime: sessionStart });
				console.log("Session start event sent to overlay");
			} catch (error) {
				console.error("Error sending session start event:", error);
			}
		};

		if (this.overlayWindow.webContents.isLoading()) {
			this.overlayWindow.webContents.once("did-finish-load", sendStart);
		} else {
			sendStart();
		}

		// Start frequent overlay updates (every 2s) to reflect window/title/URL changes
		this.startOverlayUpdates();
		console.log("Overlay updates started");
	}

	hideOverlay() {
		if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
		try {
			this.overlayWindow.webContents.send("session-stopped");
		} catch (_) {}
		this.overlayWindow.hide();
		this.stopOverlayUpdates();
	}

	createPlantOverlayWindow() {
		console.log("createPlantOverlayWindow called");
		if (this.plantOverlayWindow && !this.plantOverlayWindow.isDestroyed()) {
			console.log("Plant overlay window already exists, returning");
			return;
		}

		const { width } = screen.getPrimaryDisplay().workAreaSize;
		const overlayWidth = 250;
		const overlayHeight = 320;
		const x = Math.round(width - overlayWidth - 40); // Position on right side
		const y = 80;

		// Platform-specific overlay configuration
		const isMac = process.platform === "darwin";
		const isWindows = process.platform === "win32";

		const overlayConfig: any = {
			width: overlayWidth,
			height: overlayHeight,
			minWidth: 200,
			minHeight: 250,
			maxWidth: 500,
			maxHeight: 600,
			x,
			y,
			frame: false,
			transparent: true,
			resizable: true,
			movable: true,
			alwaysOnTop: true,
			skipTaskbar: true,
			focusable: false,
			backgroundColor: "#00000000",
			show: false,
			fullscreenable: false,
			maximizable: false,
			minimizable: false,
			closable: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: path.join(__dirname, "preload.mjs"),
			},
		};

		// macOS-specific settings
		if (isMac) {
			overlayConfig.titleBarStyle = "hidden";
			overlayConfig.vibrancy = "dark";
			overlayConfig.visualEffectState = "active";
		}

		// Windows-specific settings
		if (isWindows) {
			overlayConfig.autoHideMenuBar = true;
			overlayConfig.thickFrame = false;
		}

		this.plantOverlayWindow = new BrowserWindow(overlayConfig);

		// Platform-specific window behavior
		if (isMac) {
			this.plantOverlayWindow.setAlwaysOnTop(true, "screen-saver");
			this.plantOverlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
			this.plantOverlayWindow.setIgnoreMouseEvents(false);
		} else if (isWindows) {
			this.plantOverlayWindow.setAlwaysOnTop(true, "screen-saver");
			this.plantOverlayWindow.setIgnoreMouseEvents(false);
			try {
				this.plantOverlayWindow.setAlwaysOnTop(true, "floating");
			} catch (_) {
				this.plantOverlayWindow.setAlwaysOnTop(true, "screen-saver");
			}
		}

		if (VITE_DEV_SERVER_URL) {
			this.plantOverlayWindow.loadURL(VITE_DEV_SERVER_URL + "#/plant-overlay");
		} else {
			this.plantOverlayWindow.loadFile(path.join(RENDERER_DIST, "index.html"), {
				hash: "/plant-overlay",
			});
		}

		this.plantOverlayWindow.once("ready-to-show", () => {
			console.log("Plant overlay window ready to show");
			this.plantOverlayWindow?.showInactive();
		});

		this.plantOverlayWindow.on("closed", () => {
			console.log("Plant overlay window closed");
			this.plantOverlayWindow = null;
		});
	}

	showPlantOverlay() {
		console.log("Showing plant overlay window...");
		this.createPlantOverlayWindow();
	}

	hidePlantOverlay() {
		if (!this.plantOverlayWindow || this.plantOverlayWindow.isDestroyed()) return;
		this.plantOverlayWindow.hide();
	}

	closePlantOverlay() {
		if (!this.plantOverlayWindow || this.plantOverlayWindow.isDestroyed()) return;
		this.plantOverlayWindow.close();
		this.plantOverlayWindow = null;
	}

	startOverlayUpdates() {
		this.stopOverlayUpdates();
		this.overlayUpdateInterval = setInterval(async () => {
			try {
				if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
				const currentWindow = this.focusTracker.currentWindow;
				if (currentWindow && !currentWindow.isComplete) {
					const summary = currentWindow.getSummary();
					// Get current focus score for overlay
					const focusData = await this.focusAI.calculateHybridScore(summary);
					this.overlayWindow.webContents.send("focus-update", {
						windowTitle: summary.windowTitle,
						url: summary.url,
						keystrokeCount: summary.keystrokeCount,
						keystrokeRate: Math.round(summary.keystrokeRate * 10) / 10,
						mouseMovements: summary.mouseMovements,
						mouseMovementRate: Math.round(summary.mouseMovementRate * 10) / 10,
						instantaneous: focusData.instantaneous,
						cumulative: focusData.cumulative,
						aiInsight: focusData.aiInsight,
						context: focusData.context,
						timestamp: Date.now(),
					});
				}
			} catch (_) {}
		}, 5000); // Every 5 seconds for overlay updates
	}

	stopOverlayUpdates() {
		if (this.overlayUpdateInterval) {
			clearInterval(this.overlayUpdateInterval);
			this.overlayUpdateInterval = null;
		}
	}

	startTracking() {
		this.focusTracker.start();

		// Wait for window to be ready, then start sending updates
		this.mainWindow?.webContents.once("did-finish-load", () => {
			console.log("FocusAI Dashboard loaded, starting focus tracking...");

			// Send focus updates every 30 seconds (reduced frequency for event-driven system)
			this.updateInterval = setInterval(async () => {
				try {
					const currentWindow = this.focusTracker.currentWindow;
					if (currentWindow && !currentWindow.isComplete) {
						// Get the current window summary for scoring
						const windowSummary = currentWindow.getSummary();

						const focusData = await this.focusAI.calculateHybridScore(windowSummary);

						// Transform data for dashboard
						const dashboardData = {
							instantaneous: focusData.instantaneous,
							cumulative: focusData.cumulative,
							aiInsight: focusData.aiInsight,
							context: focusData.context,
							activeApp: windowSummary.activeApp,
							windowTitle: windowSummary.windowTitle,
							url: windowSummary.url,
							switchRate: windowSummary.switchRate,
							keystrokeRate: windowSummary.keystrokeRate,
							timestamp: Date.now(),
						};

						if (this.mainWindow && !this.mainWindow.isDestroyed()) {
							this.mainWindow.webContents.send("focus-update", dashboardData);
						}

						// Mirror to overlay with productivity scores
						if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
							this.overlayWindow.webContents.send("focus-update", {
								windowTitle: windowSummary.windowTitle,
								url: windowSummary.url,
								keystrokeCount: windowSummary.keystrokeCount,
								keystrokeRate: windowSummary.keystrokeRate,
								mouseMovements: windowSummary.mouseMovements,
								mouseMovementRate: windowSummary.mouseMovementRate,
								instantaneous: focusData.instantaneous,
								cumulative: focusData.cumulative,
								aiInsight: focusData.aiInsight,
								context: focusData.context,
								timestamp: Date.now(),
							});
						}

						// Also send to debug console if it exists
						if (this.debugWindow && !this.debugWindow.isDestroyed()) {
							this.debugWindow.webContents.send("focus-update", dashboardData);
						}
					}
				} catch (error) {
					console.error("Error sending focus update:", error);
				}
			}, 30000); // Every 30 seconds (reduced frequency for event-driven system)
		});
	}

	setupIPC() {
		ipcMain.handle("get-current-metrics", () => {
			return this.focusTracker.getCurrentMetrics();
		});

		ipcMain.handle("get-focus-score", async () => {
			const currentWindow = this.focusTracker.currentWindow;
			if (currentWindow) {
				return await this.focusAI.calculateHybridScore(currentWindow.getSummary());
			}
			return null;
		});

		ipcMain.handle("get-garden-level", () => {
			return this.focusAI.getGardenGrowthLevel();
		});

		// Handle overlay window movement
		ipcMain.on("overlay-move", (_e, { x, y }) => {
			if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
				try {
					this.overlayWindow.setPosition(Math.round(x), Math.round(y));
				} catch (_) {}
			}
		});

		// Handle opening debug page (now handled by navigation)
		// ipcMain.on("open-debug-page", () => {
		// 	this.openDebugPage();
		// });

		// Handle session control
		ipcMain.on("start-session", () => {
			console.log("Starting focus session...");
			if (!this.sessionActive) {
				this.sessionActive = true;
				this.sessionStartTime = Date.now();
				this.focusTracker.start();
				this.startTracking();
				this.showOverlay(this.sessionStartTime);
				console.log("Overlay should be created and shown");
			}
		});

		ipcMain.on("stop-session", () => {
			console.log("Stopping focus session...");
			if (this.sessionActive) {
				this.sessionActive = false;
				this.sessionStartTime = null;
				this.focusTracker.stop();
				this.hideOverlay();
			}
		});

		// Handle permission check requests
		ipcMain.on("check-permissions", () => {
			console.log("Permission check requested");
			if (this.focusTracker) {
				this.focusTracker.checkAccessibilityPermissions();
			}
		});

		// Handle immediate metadata extraction requests
		ipcMain.on("extract-metadata", async () => {
			console.log("Immediate metadata extraction requested");
			if (this.focusTracker && !this.focusTracker.demoMode) {
				await this.focusTracker.detectContextChanges();
			}
		});

		// Plant overlay IPC handlers
		ipcMain.on("show-plant-overlay", () => {
			console.log("Show plant overlay requested");
			this.showPlantOverlay();
		});

		ipcMain.on("hide-plant-overlay", () => {
			console.log("Hide plant overlay requested");
			this.hidePlantOverlay();
		});

		ipcMain.on("close-plant-overlay", () => {
			console.log("Close plant overlay requested");
			this.closePlantOverlay();
		});

		ipcMain.on("update-plant-overlay", (_e, data) => {
			if (this.plantOverlayWindow && !this.plantOverlayWindow.isDestroyed()) {
				this.plantOverlayWindow.webContents.send("plant-data-update", data);
			}
		});

		ipcMain.on("plant-overlay-move", (_e, { x, y }) => {
			if (this.plantOverlayWindow && !this.plantOverlayWindow.isDestroyed()) {
				try {
					this.plantOverlayWindow.setPosition(Math.round(x), Math.round(y));
				} catch (_) {}
			}
		});

		// Handle debug data requests
		ipcMain.on("request-debug-data", () => {
			const currentWindow = this.focusTracker.currentWindow;
			if (currentWindow && !currentWindow.isComplete) {
				const windowSummary = currentWindow.getSummary();
				this.focusAI
					.calculateHybridScore(windowSummary)
					.then((focusData) => {
						const debugData = {
							instantaneous: focusData.instantaneous,
							cumulative: focusData.cumulative,
							aiInsight: focusData.aiInsight,
							context: focusData.context,
							activeApp: windowSummary.activeApp,
							windowTitle: windowSummary.windowTitle,
							url: windowSummary.url,
							switchRate: windowSummary.switchRate,
							keystrokeRate: windowSummary.keystrokeRate,
							keystrokeCount: windowSummary.keystrokeCount,
							baseScore: focusData.baseScore,
							aiMultiplier: focusData.aiMultiplier,
							focusRatio: windowSummary.focusRatio,
							timestamp: Date.now(),
						};

						// Send to both debug window (if exists) and main window
						if (this.debugWindow && !this.debugWindow.isDestroyed()) {
							this.debugWindow.webContents.send("focus-update", debugData);
						}

						// Send to main window for debug console
						if (this.mainWindow && !this.mainWindow.isDestroyed()) {
							this.mainWindow.webContents.send("focus-update", debugData);
						}
					})
					.catch((error) => {
						console.error("Error calculating debug data:", error);
					});
			}
		});
	}

	openDebugPage() {
		this.debugWindow = new BrowserWindow({
			width: 1400,
			height: 900,
			minWidth: 1200,
			minHeight: 800,
			frame: true,
			titleBarStyle: "hiddenInset",
			backgroundColor: "#0a0a0a",
			show: false,
			parent: this.mainWindow || undefined,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: path.join(__dirname, "preload.mjs"),
			},
		});

		if (VITE_DEV_SERVER_URL) {
			this.debugWindow.loadURL(VITE_DEV_SERVER_URL + "#/debug");
		} else {
			this.debugWindow.loadFile(path.join(RENDERER_DIST, "index.html"), {
				hash: "/debug",
			});
		}

		this.debugWindow.once("ready-to-show", () => {
			this.debugWindow?.show();
		});

		// Clean up reference when debug window is closed
		this.debugWindow.on("closed", () => {
			this.debugWindow = null;
		});

		if (this.isDev) {
			this.debugWindow.webContents.openDevTools();
		}

		// Start sending debug data
		this.debugWindow.webContents.once("did-finish-load", () => {
			console.log("Debug console loaded");

			// Send initial data
			const currentWindow = this.focusTracker.currentWindow;
			if (currentWindow) {
				const windowSummary = currentWindow.getSummary();
				this.focusAI.calculateHybridScore(windowSummary).then((focusData) => {
					const debugData = {
						instantaneous: focusData.instantaneous,
						cumulative: focusData.cumulative,
						aiInsight: focusData.aiInsight,
						context: focusData.context,
						activeApp: windowSummary.activeApp,
						windowTitle: windowSummary.windowTitle,
						url: windowSummary.url,
						switchRate: windowSummary.switchRate,
						keystrokeRate: windowSummary.keystrokeRate,
						baseScore: focusData.baseScore,
						aiMultiplier: focusData.aiMultiplier,
						timestamp: Date.now(),
					};

					this.debugWindow?.webContents.send("focus-update", debugData);
				});
			}
		});
	}
}

const mainApp = new MainApp();

app.whenReady().then(() => {
	mainApp.createWindow();
	mainApp.setupIPC();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			mainApp.createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("before-quit", () => {
	mainApp.focusTracker.stop();
	if (mainApp.updateInterval) {
		clearInterval(mainApp.updateInterval);
	}
});
