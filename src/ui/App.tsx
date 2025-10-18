import { useEffect, useMemo, useState } from 'react';
import { GardenGrid } from '@ui/components/GardenGrid';
import { SeedShop } from '@ui/components/SeedShop';
import { InventoryToolbar } from '@ui/components/InventoryToolbar';
import { useGardenGame } from '@ui/hooks/useGardenGame';
import '@ui/styles.css';

const App = () => {
  const { state, isReady, error: gameError, dispatch, seeds, multiplier } =
    useGardenGame();
  const [isSeedShopOpen, setIsSeedShopOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shakePlotId, setShakePlotId] = useState<string | null>(null);

  const version = useMemo(() => {
    try {
      return window.gardenApi.getVersion();
    } catch {
      return 'n/a';
    }
  }, []);

  // Must be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    if (!gameError) {
      return;
    }

    setToastMessage(gameError.message);
    const toastTimer = window.setTimeout(() => setToastMessage(null), 3000);

    let shakeTimer: number | undefined;
    if (gameError.plotId && /occupied/i.test(gameError.message)) {
      setShakePlotId(gameError.plotId);
      shakeTimer = window.setTimeout(() => setShakePlotId(null), 600);
    }

    return () => {
      window.clearTimeout(toastTimer);
      if (shakeTimer) {
        window.clearTimeout(shakeTimer);
      }
    };
  }, [gameError]);

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
        <span className="app__titlebar-tagline">Plant tasks, harvest motivation.</span>
        <span className="app__titlebar-version">Electron {version}</span>
      </header>

      {toastMessage && (
        <div className="app__toast" role="status" aria-live="assertive">
          {toastMessage}
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
