/// <reference types="vite/client" />

import type { GardenApi } from '@preload/index';

declare global {
  interface Window {
    gardenApi: GardenApi;
  }
}

export {};
