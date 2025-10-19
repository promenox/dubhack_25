import type { Plot, Plant, PlantType } from '@core/index';
import { SEED_LIBRARY } from '@core/gardenGame';
import clsx from 'clsx';
import { useMemo } from 'react';
import { getPlantIconSrc } from '@ui/assets/plantIcons';

const getStageLabel = (plant: Plant) => {
  if (plant.progress >= 1) return 'Ready to Harvest';
  if (plant.progress >= 0.66) return 'Blooming';
  if (plant.progress >= 0.33) return 'Sprouting';
  return 'Seedling';
};

const getProgressPercent = (plant: Plant) =>
  Math.min(100, Math.round(plant.progress * 100));

const getPlotDisplayId = (plotId: string) => {
  const numeric = plotId.match(/\d+/);
  if (numeric) {
    return numeric[0];
  }
  const cleaned = plotId.replace(/plot[-_]?/i, '');
  return cleaned ? cleaned.toUpperCase() : plotId.toUpperCase();
};

interface GardenGridProps {
  plots: Plot[];
  onDropSeed: (plotId: string, seedType: PlantType) => void;
  onHarvest: (plotId: string) => void;
  shakePlotId?: string;
}

const GROWTH_COLORS: Record<string, string> = {
  Seedling: 'var(--plot-progress-seed)',
  Sprouting: 'var(--plot-progress-sprout)',
  Blooming: 'var(--plot-progress-bloom)',
  'Ready to Harvest': 'var(--plot-progress-harvest)'
};

export const GardenGrid = ({
  plots,
  onDropSeed,
  onHarvest,
  shakePlotId
}: GardenGridProps) => {
  const gridTemplate = useMemo(() => {
    const count = plots.length;
    if (count <= 4) return 'repeat(2, minmax(0, 1fr))';
    if (count <= 6) return 'repeat(3, minmax(0, 1fr))';
    return 'repeat(4, minmax(0, 1fr))';
  }, [plots.length]);

  return (
    <div className="garden-section">
      <div className="garden-grid" style={{ gridTemplateColumns: gridTemplate }}>
        {plots.map((plot) => {
          const plant = plot.plant;
          const stageLabel = plant ? getStageLabel(plant) : 'Empty Plot';
          const percent = plant ? getProgressPercent(plant) : 0;
          const progressColor = plant ? GROWTH_COLORS[stageLabel] : 'transparent';
          const definition = plant ? SEED_LIBRARY[plant.type] : undefined;
          const iconSrc = definition ? getPlantIconSrc(definition.icon) : undefined;

          const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
            event.preventDefault();
            const seedType = event.dataTransfer.getData('application/seed-type') as PlantType | '';
            if (!seedType) return;
            onDropSeed(plot.id, seedType);
          };

          const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          };

          return (
            <div
              key={plot.id}
              className={clsx('plot-card', {
                'plot-card--occupied': Boolean(plant),
                'plot-card--ready': plant && plant.progress >= 1,
                'plot-card--shake': shakePlotId === plot.id
              })}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <header className="plot-card__header">
                <span className="plot-card__title">{getPlotDisplayId(plot.id)}</span>
                {plant && <span className="plot-card__stage">{stageLabel}</span>}
              </header>

              <div className="plot-card__body">
                {plant ? (
                  <PlantVisual
                    plant={plant}
                    stageLabel={stageLabel}
                    iconSrc={iconSrc}
                    displayName={definition?.displayName}
                  />
                ) : (
                  <div className="plot-card__empty">
                    <span>Drag a seed here</span>
                  </div>
                )}
              </div>

              <footer className="plot-card__footer">
                {plant ? (
                  <>
                    <div className="plot-card__progress">
                      <div
                        className="plot-card__progress-bar"
                        style={{ width: `${percent}%`, backgroundColor: progressColor }}
                      />
                    </div>
                    <span className="plot-card__progress-text">{percent}%</span>
                    <button
                      className="plot-card__harvest"
                      type="button"
                      disabled={plant.progress < 1}
                      onClick={() => onHarvest(plot.id)}
                    >
                      Harvest
                    </button>
                  </>
                ) : null}
              </footer>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface PlantVisualProps {
  plant: Plant;
  stageLabel: string;
  iconSrc?: string;
  displayName?: string;
}

const PlantVisual = ({ plant, stageLabel, iconSrc, displayName }: PlantVisualProps) => {
  const scale = 0.7 + plant.progress * 0.35;
  const swayIntensity = plant.progress >= 1 ? 'plot-plant--harvest-ready' : 'plot-plant--growing';
  const clampedProgress = Math.min(Math.max(plant.progress, 0), 1);
  const revealTopInset = `${(1 - clampedProgress) * 100}%`;
  const clipPath = `inset(${revealTopInset} 0 0 0)`;
  const stageKey = stageLabel.replace(/\s+/g, '').toLowerCase();
  const isIllustrated = Boolean(iconSrc);

  return (
    <div
      className={clsx('plot-plant', swayIntensity, { 'plot-plant--illustrated': isIllustrated })}
      style={{ transform: `scale(${scale})` }}
    >
      <div
        className={clsx('plot-plant__reveal', { 'plot-plant__reveal--illustrated': isIllustrated })}
        style={{ clipPath }}
      >
        {iconSrc ? (
          <>
            <span className="plot-plant__glow" aria-hidden="true" />
            <img src={iconSrc} alt={displayName ?? stageLabel} className="plot-plant__image" />
          </>
        ) : (
          <>
            <div className={clsx('plot-plant__stem', `plot-plant__stem--${plant.type}`)} />
            <div className={clsx('plot-plant__bloom', `plot-plant__bloom--${stageKey}`)} />
          </>
        )}
      </div>
    </div>
  );
};
