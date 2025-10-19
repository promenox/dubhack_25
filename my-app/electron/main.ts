import { app, BrowserWindow, desktopCapturer, ipcMain, powerMonitor } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

let win: BrowserWindow | null;

// Activity tracking state
let trackingInterval: NodeJS.Timeout | null = null;

// Take screenshot and return as data URL for renderer OCR
async function captureScreenToDataURL(): Promise<{ dataUrl: string }> {
	try {
		// Get screen sources
		const sources = await desktopCapturer.getSources({
			types: ["screen"],
			thumbnailSize: { width: 1920, height: 1080 }, // Low resolution for faster processing
		});

		if (sources.length === 0) {
			throw new Error("No screen sources available");
		}

		// Use the first screen source
		const source = sources[0];
		const thumbnail = source.thumbnail;

		// Convert thumbnail to PNG buffer
		const imageBuffer = thumbnail.toPNG();

		console.log("📸 Screenshot captured:", {
			size: imageBuffer.length,
			sourceName: source.name,
			width: thumbnail.getSize().width,
			height: thumbnail.getSize().height,
		});

		const dataUrl = `data:image/png;base64,${imageBuffer.toString("base64")}`;
		return { dataUrl };
	} catch (error) {
		console.error("❌ Screenshot error:", error);
		return { dataUrl: "" };
	}
}

function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			nodeIntegration: false,
			contextIsolation: true,
		},
		backgroundColor: "#1a1a1a",
		titleBarStyle: "default",
	});

	// Test active push message to Renderer-process.
	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", new Date().toLocaleString());
	});

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	} else {
		win.loadFile(path.join(RENDERER_DIST, "index.html"));
	}
}

// IPC: return screenshot as data URL
ipcMain.handle("capture-screen", async () => {
	try {
		const { dataUrl } = await captureScreenToDataURL();
		return { dataUrl };
	} catch (error) {
		console.error("❌ Error in capture-screen:", error);
		return { dataUrl: "" };
	}
});

ipcMain.on("start-tracking", () => {
	console.log("Tracking started");
});

ipcMain.on("stop-tracking", () => {
	if (trackingInterval) {
		clearInterval(trackingInterval);
		trackingInterval = null;
	}
	console.log("Tracking stopped");
});

// Power monitor for idle detection
app.whenReady().then(() => {
	createWindow();

	// Monitor system idle state
	powerMonitor.on("suspend", () => {
		win?.webContents.send("system-suspend");
	});

	powerMonitor.on("resume", () => {
		win?.webContents.send("system-resume");
	});
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// App cleanup
app.on("before-quit", async () => {
	console.log("🔄 App shutting down...");
});
