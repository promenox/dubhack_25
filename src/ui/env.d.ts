/// <reference types="vite/client" />

import type { GardenApi } from '@preload/index';

declare module '*.svg' {
  const src: string;
  export default src;
}

declare global {
  interface Window {
    gardenApi: GardenApi;
  }
}

export {};
