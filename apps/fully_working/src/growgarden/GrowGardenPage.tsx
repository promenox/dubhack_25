import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Plant } from "../../core";
import { GardenGrid } from "./components/GardenGrid";
import { SeedShop } from "./components/SeedShop";
import { InventoryToolbar } from "./components/InventoryToolbar";
import { useGardenGame } from "./hooks/useGardenGame";
import "./gardenApiBridge";
import "./styles.css";

const GrowGardenPage = () => {
  const { state, isReady, error: gameError, dispatch, seeds, multiplier } = useGardenGame();
  const [isSeedShopOpen, setIsSeedShopOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);
  const [shakePlotId, setShakePlotId] = useState<string | null>(null);
  const [overlayPlotId, setOverlayPlotId] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastDismissRef = useRef<number | null>(null);

  // Expose test helpers to window for debugging
  useEffect(() => {
    if (isReady) {
      (window as any).__testMultiplier = (value: number) => {
        console.log(`[Debug] Setting multiplier to ${value}`);
        dispatch({ type: "setMultiplier", value });
      };
      console.log("[Debug] Test helper available: __testMultiplier(n)");
    }
  }, [isReady, dispatch]);

  useEffect(() => {
    let isMounted = true;

    window.gardenApi
      .getOverlaySelection()
      .then((initialSelection) => {
        if (isMounted) {
          setOverlayPlotId(initialSelection ?? null);
        }
      })
      .catch((error) => {
        console.error("Failed to read overlay selection", error);
      });

    const unsubscribe = window.gardenApi.onOverlaySelection((nextSelection) => {
      setOverlayPlotId(nextSelection ?? null);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const version = useMemo(() => {
    try {
      return window.gardenApi.getVersion();
    } catch {
      return "n/a";
    }
  }, []);

  // Must be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      if (toastDismissRef.current) {
        window.clearTimeout(toastDismissRef.current);
        toastDismissRef.current = null;
      }
    };
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast((current) => {
      if (!current || !current.visible) {
        return current;
      }
      return { ...current, visible: false };
    });
  }, []);

  const showToast = useCallback(
    (message: string) => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      if (toastDismissRef.current) {
        window.clearTimeout(toastDismissRef.current);
        toastDismissRef.current = null;
      }

      setToast({ message, visible: true });
      toastTimerRef.current = window.setTimeout(() => {
        hideToast();
      }, 3000);
    },
    [hideToast]
  );

  const handleSelectOverlayPlot = useCallback(
    (plotId: string, _plant: Plant) => {
      const nextSelection = overlayPlotId === plotId ? null : plotId;
      setOverlayPlotId(nextSelection);
      window.gardenApi
        .setOverlaySelection(nextSelection)
        .catch((error) => console.error("Failed to update overlay selection", error));
    },
    [overlayPlotId]
  );

  useEffect(() => {
    if (!gameError) {
      return;
    }

    showToast(gameError.message);

    let shakeTimer: number | undefined;
    if (gameError.plotId && /occupied/i.test(gameError.message)) {
      setShakePlotId(gameError.plotId);
      shakeTimer = window.setTimeout(() => {
        setShakePlotId(null);
      }, 500);
    }

    return () => {
      if (shakeTimer) {
        window.clearTimeout(shakeTimer);
      }
    };
  }, [gameError, showToast]);

  useEffect(() => {
    if (!toast || toast.visible) {
      return;
    }

    toastDismissRef.current = window.setTimeout(() => {
      setToast(null);
      toastDismissRef.current = null;
    }, 220);

    return () => {
      if (toastDismissRef.current) {
        window.clearTimeout(toastDismissRef.current);
        toastDismissRef.current = null;
      }
    };
  }, [toast]);

  const dismissToast = useCallback(() => {
    hideToast();
  }, [hideToast]);

  useEffect(() => {
    if (!state || !overlayPlotId) {
      return;
    }
    const selectedPlot = state.plots.find((plot) => plot.id === overlayPlotId);
    if (selectedPlot && selectedPlot.plant) {
      return;
    }
    setOverlayPlotId(null);
    window.gardenApi
      .setOverlaySelection(null)
      .catch((error) => console.error("Failed to reset overlay selection", error));
  }, [state, overlayPlotId]);

  // Now we can conditionally return
  if (!isReady || !state) {
    return (
      <main className="app app--loading">
        <div className="loading-card">
          <h1>Preparing Your Garden...</h1>
          <p>Loading soil, seeds, and sunshine.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="app__titlebar">
        <span className="app__titlebar-tagline">Grow Your Productivity Garden</span>
        <span className="app__titlebar-version">Electron {version}</span>
      </header>

      {toast && (
        <div
          className={`app__toast ${toast.visible ? "app__toast--visible" : "app__toast--hiding"}`}
          role="button"
          aria-live="assertive"
          tabIndex={0}
          onClick={dismissToast}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              dismissToast();
            }
          }}
        >
          {toast.message}
        </div>
      )}

      <main className="app">
        <div className="app__body">
          <div className="app__main">
            <GardenGrid
              plots={state.plots}
              shakePlotId={shakePlotId ?? undefined}
              selectedOverlayPlotId={overlayPlotId ?? undefined}
              onSelectOverlayPlot={handleSelectOverlayPlot}
              onDropSeed={(plotId, seedType) =>
                dispatch({ type: "plant", plotId, seedType })
              }
              onHarvest={(plotId) => dispatch({ type: "harvest", plotId })}
            />
          </div>
        </div>
      </main>

      <InventoryToolbar
        state={state}
        seeds={seeds}
        multiplier={multiplier}
        isSeedShopOpen={isSeedShopOpen}
        onToggleSeedShop={() => setIsSeedShopOpen((prev) => !prev)}
      />

      {isSeedShopOpen && (
        <div className="app-overlay" role="dialog" aria-modal="true">
          <div
            className="app-overlay__backdrop"
            onClick={() => setIsSeedShopOpen(false)}
            role="presentation"
            aria-hidden="true"
          />
          <div className="app-overlay__panel">
            <SeedShop
              seeds={seeds}
              inventory={state.inventory}
              onBuySeed={(seedType) => dispatch({ type: "buySeed", seedType })}
              onClose={() => setIsSeedShopOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowGardenPage;
