import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
	captureScreen: () => ipcRenderer.invoke("capture-screen"),
	onActivityUpdate: (callback: (data: any) => void) => {
		ipcRenderer.on("activity-update", (_event, data) => callback(data));
	},
	startTracking: () => ipcRenderer.send("start-tracking"),
	stopTracking: () => ipcRenderer.send("stop-tracking"),
});

// Add type definitions
declare global {
	interface Window {
		electronAPI: {
			captureScreen: () => Promise<{ dataUrl: string }>;
			onActivityUpdate: (callback: (data: any) => void) => void;
			startTracking: () => void;
			stopTracking: () => void;
		};
	}
}
