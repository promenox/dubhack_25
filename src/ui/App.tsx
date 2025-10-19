import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GardenGrid } from '@ui/components/GardenGrid';
import { SeedShop } from '@ui/components/SeedShop';
import { InventoryToolbar } from '@ui/components/InventoryToolbar';
import { useGardenGame } from '@ui/hooks/useGardenGame';
import '@ui/styles.css';

const App = () => {
  const { state, isReady, error: gameError, dispatch, seeds, multiplier } =
    useGardenGame();
  const [isSeedShopOpen, setIsSeedShopOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);
  const [shakePlotId, setShakePlotId] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastDismissRef = useRef<number | null>(null);

  const version = useMemo(() => {
    try {
      return window.gardenApi.getVersion();
    } catch {
      return 'n/a';
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

  useEffect(() => {
    if (!gameError) {
      return;
    }

    showToast(gameError.message);

    let shakeTimer: number | undefined;
    if (gameError.plotId && /occupied/i.test(gameError.message)) {
      setShakePlotId(gameError.plotId);
      shakeTimer = window.setTimeout(() => setShakePlotId(null), 600);
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
          className={`app__toast ${toast.visible ? 'app__toast--visible' : 'app__toast--hiding'}`}
          role="button"
          aria-live="assertive"
          tabIndex={0}
          onClick={dismissToast}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
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
              onDropSeed={(plotId, seedType) =>
                dispatch({ type: 'plant', plotId, seedType })
              }
              onHarvest={(plotId) => dispatch({ type: 'harvest', plotId })}
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
              onBuySeed={(seedType) => dispatch({ type: 'buySeed', seedType })}
              onClose={() => setIsSeedShopOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
