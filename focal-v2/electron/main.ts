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
		this.focusTracker = new FocusTracker();
		this.focusAI = new FocusAI();
		this.isDev = process.argv.includes("--dev");
		this.updateInterval = null;
		this.sessionActive = false;
		this.sessionStartTime = null;
		this.overlayUpdateInterval = null;
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
		if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
			return;
		}

		const { width } = screen.getPrimaryDisplay().workAreaSize;
		const overlayWidth = 360;
		const overlayHeight = 140;
		const x = Math.round((width - overlayWidth) / 2);
		const y = 20;

		this.overlayWindow = new BrowserWindow({
			width: overlayWidth,
			height: overlayHeight,
			x,
			y,
			frame: false,
			transparent: true,
			resizable: false,
			movable: true,
			alwaysOnTop: true,
			skipTaskbar: true,
			focusable: false,
			backgroundColor: "#00000000",
			show: false,
    webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: path.join(__dirname, "preload.mjs"),
			},
		});

		this.overlayWindow.setAlwaysOnTop(true, "screen-saver");
		if (this.overlayWindow.setVisibleOnAllWorkspaces) {
			this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
		}

  if (VITE_DEV_SERVER_URL) {
			this.overlayWindow.loadURL(VITE_DEV_SERVER_URL + "#/overlay");
		} else {
			this.overlayWindow.loadFile(path.join(RENDERER_DIST, "index.html"), {
				hash: "/overlay",
			});
		}

		this.overlayWindow.once("ready-to-show", () => {
			this.overlayWindow?.showInactive();
		});

		this.overlayWindow.on("closed", () => {
			this.overlayWindow = null;
		});
	}

	showOverlay(sessionStart: number) {
		this.createOverlayWindow();
		if (!this.overlayWindow) return;
		if (this.overlayWindow.isMinimized()) this.overlayWindow.restore();
		this.overlayWindow.showInactive();

		// Send start event with timestamp after load
		const sendStart = () => {
			try {
				this.overlayWindow?.webContents.send("session-started", { startTime: sessionStart });
			} catch (_) {}
		};

		if (this.overlayWindow.webContents.isLoading()) {
			this.overlayWindow.webContents.once("did-finish-load", sendStart);
  } else {
			sendStart();
		}

		// Start frequent overlay updates (every 2s) to reflect window/title/URL changes
		this.startOverlayUpdates();
	}

	hideOverlay() {
		if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
		try {
			this.overlayWindow.webContents.send("session-stopped");
		} catch (_) {}
		this.overlayWindow.hide();
		this.stopOverlayUpdates();
	}

	startOverlayUpdates() {
		this.stopOverlayUpdates();
		this.overlayUpdateInterval = setInterval(() => {
			try {
				if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
				const currentWindow = this.focusTracker.currentWindow;
				if (currentWindow && !currentWindow.isComplete) {
					const summary = currentWindow.getSummary();
					this.overlayWindow.webContents.send("focus-update", {
						windowTitle: summary.windowTitle,
						url: summary.url,
						keystrokeCount: summary.keystrokeCount,
						keystrokeRate: Math.round(summary.keystrokeRate * 10) / 10,
						mouseMovements: summary.mouseMovements,
						mouseMovementRate: Math.round(summary.mouseMovementRate * 10) / 10,
						timestamp: Date.now(),
					});
				}
			} catch (_) {}
		}, 2000);
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

			// Send focus updates every 10 seconds (as per spec)
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

						// Mirror to overlay
						if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
							this.overlayWindow.webContents.send("focus-update", {
								windowTitle: windowSummary.windowTitle,
								url: windowSummary.url,
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
			}, 10000); // Every 10 seconds
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

		// Overlay interaction: allow drag when requested
		ipcMain.on("overlay-set-ignore-mouse", (_e, ignore) => {
			if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
				try {
					this.overlayWindow.setIgnoreMouseEvents(!!ignore, { forward: !!ignore });
				} catch (_) {}
			}
		});

		// Handle opening debug page
		ipcMain.on("open-debug-page", () => {
			this.openDebugPage();
		});

		// Handle session control
		ipcMain.on("start-session", () => {
			console.log("Starting focus session...");
			if (!this.sessionActive) {
				this.sessionActive = true;
				this.sessionStartTime = Date.now();
				this.focusTracker.start();
				this.startTracking();
				this.showOverlay(this.sessionStartTime);
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

		// Handle debug data requests
		ipcMain.on("request-debug-data", () => {
			if (this.debugWindow && !this.debugWindow.isDestroyed()) {
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
								baseScore: focusData.baseScore,
								aiMultiplier: focusData.aiMultiplier,
								focusRatio: windowSummary.focusRatio,
								timestamp: Date.now(),
							};

							this.debugWindow?.webContents.send("focus-update", debugData);
						})
						.catch((error) => {
							console.error("Error calculating debug data:", error);
						});
				}
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
