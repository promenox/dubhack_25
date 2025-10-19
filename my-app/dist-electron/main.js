import { ipcMain, app, powerMonitor, BrowserWindow, desktopCapturer } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
async function captureScreenToDataURL() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 }
      // Low resolution for faster processing
    });
    if (sources.length === 0) {
      throw new Error("No screen sources available");
    }
    const source = sources[0];
    const thumbnail = source.thumbnail;
    const imageBuffer = thumbnail.toPNG();
    console.log("📸 Screenshot captured:", {
      size: imageBuffer.length,
      sourceName: source.name,
      width: thumbnail.getSize().width,
      height: thumbnail.getSize().height
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
      contextIsolation: true
    },
    backgroundColor: "#1a1a1a",
    titleBarStyle: "default"
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
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
  console.log("Tracking stopped");
});
app.whenReady().then(() => {
  createWindow();
  powerMonitor.on("suspend", () => {
    win == null ? void 0 : win.webContents.send("system-suspend");
  });
  powerMonitor.on("resume", () => {
    win == null ? void 0 : win.webContents.send("system-resume");
  });
});
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
app.on("before-quit", async () => {
  console.log("🔄 App shutting down...");
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
