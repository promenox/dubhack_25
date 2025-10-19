"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  captureScreen: () => electron.ipcRenderer.invoke("capture-screen"),
  onActivityUpdate: (callback) => {
    electron.ipcRenderer.on("activity-update", (_event, data) => callback(data));
  },
  startTracking: () => electron.ipcRenderer.send("start-tracking"),
  stopTracking: () => electron.ipcRenderer.send("stop-tracking")
});
