import { contextBridge, ipcRenderer } from 'electron';
import type { GardenState } from '@core/index';

type GardenApi = {
  getVersion(): string;
  /**
   * Emit the latest garden state to the main process so other windows (overlay)
   * can remain in sync.
   */
  emitGardenState(state: GardenState): void;
  /**
   * Subscribe to garden state updates coming from the main process.
   */
  onGardenState(listener: (state: GardenState) => void): () => void;
  /**
   * Request the current garden state from the main process. Useful when a window
   * loads and needs the initial snapshot.
   */
  requestGardenState(): void;
  /**
   * Persist the selected plot id that should be mirrored in the overlay window.
   */
  setOverlaySelection(plotId: string | null): Promise<string | null>;
  /**
   * Retrieve the currently selected overlay plot id.
   */
  getOverlaySelection(): Promise<string | null>;
  /**
   * Subscribe to overlay selection changes, allowing renderers to stay in sync.
   */
  onOverlaySelection(listener: (plotId: string | null) => void): () => void;
};

const api: GardenApi = {
  getVersion: () => process.versions.electron,
  emitGardenState: (state) => {
    ipcRenderer.send('garden:state:update', state);
  },
  onGardenState: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: GardenState) => {
      listener(payload);
    };
    ipcRenderer.on('garden:state', handler);
    return () => {
      ipcRenderer.removeListener('garden:state', handler);
    };
  },
  requestGardenState: () => {
    ipcRenderer.send('garden:state:request');
  },
  setOverlaySelection: async (plotId) => {
    return ipcRenderer.invoke('overlay:selection:set', plotId);
  },
  getOverlaySelection: () => {
    return ipcRenderer.invoke('overlay:selection:get');
  },
  onOverlaySelection: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: string | null) => {
      listener(payload ?? null);
    };
    ipcRenderer.on('overlay:selection', handler);
    return () => {
      ipcRenderer.removeListener('overlay:selection', handler);
    };
  }
};

contextBridge.exposeInMainWorld('gardenApi', api);

export type { GardenApi };
