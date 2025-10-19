import type { GardenState } from "../../core";

type Listener<T> = (payload: T) => void;

const ensureGardenApi = () => {
  if (window.gardenApi) {
    return;
  }

  const ipc =
    (window.ipcRenderer as
      | {
          on: (channel: string, listener: (event: unknown, ...args: any[]) => void) => void;
          off: (channel: string, listener: (...args: any[]) => void) => void;
          send: (channel: string, ...args: any[]) => void;
          invoke: (channel: string, ...args: any[]) => Promise<any>;
        }
      | undefined) ??
    (window.require?.("electron")?.ipcRenderer as
      | {
          on: (channel: string, listener: (event: unknown, ...args: any[]) => void) => void;
          removeListener: (channel: string, listener: (...args: any[]) => void) => void;
          send: (channel: string, ...args: any[]) => void;
          invoke: (channel: string, ...args: any[]) => Promise<any>;
        }
      | undefined);

  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  if (!ipc) {
    console.warn("[GrowGarden] ipcRenderer not detected. Overlay sync is disabled.");
  }

  const subscribe = <T>(channel: string, listener: Listener<T>) => {
    if (!ipc) {
      return () => undefined;
    }

    const handler = (_event: unknown, payload: T) => {
      listener(payload);
    };

    ipc.on(channel, handler);
    if (!listeners.has(channel)) {
      listeners.set(channel, new Set());
    }
    listeners.get(channel)!.add(handler);

    return () => {
      if ("off" in ipc && typeof ipc.off === "function") {
        ipc.off(channel, handler);
      } else if ("removeListener" in ipc && typeof ipc.removeListener === "function") {
        ipc.removeListener(channel, handler);
      }
      listeners.get(channel)?.delete(handler);
    };
  };

  window.gardenApi = {
    getVersion: () => {
      try {
        return process.versions?.electron ?? "unknown";
      } catch {
        return "unknown";
      }
    },
    emitGardenState: (state: GardenState) => {
      ipc?.send("garden:state:update", state);
    },
    onGardenState: (listener: Listener<GardenState>) => {
      return subscribe("garden:state", listener);
    },
    requestGardenState: () => {
      ipc?.send("garden:state:request");
    },
    setOverlaySelection: async (plotId: string | null) => {
      try {
        const result = await ipc?.invoke("overlay:selection:set", plotId);
        return (result ?? null) as string | null;
      } catch (error) {
        console.error("overlay:selection:set failed", error);
        return plotId ?? null;
      }
    },
    getOverlaySelection: async () => {
      try {
        const result = await ipc?.invoke("overlay:selection:get");
        return (result ?? null) as string | null;
      } catch (error) {
        console.error("overlay:selection:get failed", error);
        return null;
      }
    },
    onOverlaySelection: (listener: Listener<string | null>) => {
      return subscribe("overlay:selection", listener);
    },
  };
};

ensureGardenApi();
