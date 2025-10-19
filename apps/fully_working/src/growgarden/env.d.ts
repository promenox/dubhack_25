import type { GardenState } from "../../core";

interface GrowGardenApi {
  getVersion(): string;
  emitGardenState(state: GardenState): void;
  onGardenState(listener: (state: GardenState) => void): () => void;
  requestGardenState(): void;
  setOverlaySelection(plotId: string | null): Promise<string | null>;
  getOverlaySelection(): Promise<string | null>;
  onOverlaySelection(listener: (plotId: string | null) => void): () => void;
}

declare global {
  interface Window {
    gardenApi: GrowGardenApi;
    ipcRenderer?: import("electron").IpcRenderer;
    require?: any;
  }
}

export {};
