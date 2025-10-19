import { useEffect, useMemo, useState } from 'react';
import type { GardenState } from '@core/index';
import { SEED_LIBRARY } from '@core/gardenGame';
import { getPlantIconSrc } from '@ui/assets/plantIcons';
import { PlantVisual, getStageLabel } from '@ui/components/PlantVisual';
import '@ui/styles.css';
import '@ui/overlay.css';

const OverlayApp = () => {
  const [gardenState, setGardenState] = useState<GardenState | null>(null);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  useEffect(() => {
    const rootElement = document.documentElement;
    rootElement.classList.add('overlay-root');
    document.body.classList.add('overlay-body');

    return () => {
      rootElement.classList.remove('overlay-root');
      document.body.classList.remove('overlay-body');
    };
  }, []);

  useEffect(() => {
    const unsubscribeState = window.gardenApi.onGardenState((nextState) => {
      setGardenState(nextState);
    });

    const unsubscribeSelection = window.gardenApi.onOverlaySelection((plotId) => {
      setSelectedPlotId(plotId ?? null);
    });

    window.gardenApi.requestGardenState();

    // Fallback in case request fires before listeners attach
    window.gardenApi
      .getOverlaySelection()
      .then((plotId) => setSelectedPlotId(plotId ?? null))
      .catch((error) => console.error('Failed to fetch overlay selection', error));

    return () => {
      unsubscribeState();
      unsubscribeSelection();
    };
  }, []);

  const selection = useMemo(() => {
    if (!gardenState || !selectedPlotId) {
      return null;
    }
    const plot = gardenState.plots.find((entry) => entry.id === selectedPlotId);
    if (!plot || !plot.plant) {
      return null;
    }
    const definition = SEED_LIBRARY[plot.plant.type];
    const iconSrc = definition ? getPlantIconSrc(definition.icon) : undefined;

    return {
      plotId: plot.id,
      plant: plot.plant,
      definition,
      iconSrc,
      stageLabel: getStageLabel(plot.plant)
    };
  }, [gardenState, selectedPlotId]);

  return (
    <div className="overlay-window" role="presentation">
      {selection ? (
        <div className="overlay-window__plant-wrapper">
          <PlantVisual
            plant={selection.plant}
            stageLabel={selection.stageLabel}
            iconSrc={selection.iconSrc}
            displayName={selection.definition?.displayName}
            className="overlay-window__plant"
          />
        </div>
      ) : (
        <div className="overlay-window__empty">
          <span>
            Select a plant from your garden to mirror in the overlay.
          </span>
        </div>
      )}
    </div>
  );
};

export default OverlayApp;
