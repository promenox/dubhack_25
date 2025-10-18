import { contextBridge } from 'electron';

type GardenApi = {
  getVersion(): string;
};

const api: GardenApi = {
  getVersion: () => process.versions.electron
};

contextBridge.exposeInMainWorld('gardenApi', api);

export type { GardenApi };
