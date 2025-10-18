import type { Plot, Plant, PlantType } from '@core/index';
import clsx from 'clsx';
import { useMemo } from 'react';

const getStageLabel = (plant: Plant) => {
  if (plant.progress >= 1) return 'Ready to Harvest';
  if (plant.progress >= 0.66) return 'Blooming';
  if (plant.progress >= 0.33) return 'Sprouting';
  return 'Seedling';
};

const getProgressPercent = (plant: Plant) =>
  Math.min(100, Math.round(plant.progress * 100));

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
      <h2>Garden</h2>
      <div className="garden-grid" style={{ gridTemplateColumns: gridTemplate }}>
        {plots.map((plot) => {
          const plant = plot.plant;
          const stageLabel = plant ? getStageLabel(plant) : 'Empty Plot';
          const percent = plant ? getProgressPercent(plant) : 0;
          const progressColor = plant ? GROWTH_COLORS[stageLabel] : 'transparent';

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
                <span className="plot-card__title">{plot.id.toUpperCase()}</span>
                {plant && <span className="plot-card__stage">{stageLabel}</span>}
              </header>

              <div className="plot-card__body">
                {plant ? (
                  <PlantVisual plant={plant} stageLabel={stageLabel} />
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
                ) : (
                  <span className="plot-card__hint">Available</span>
                )}
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
}

const PlantVisual = ({ plant, stageLabel }: PlantVisualProps) => {
  const scale = 0.7 + plant.progress * 0.35;
  const swayIntensity = plant.progress >= 1 ? 'plot-plant--harvest-ready' : 'plot-plant--growing';

  return (
    <div className={clsx('plot-plant', swayIntensity)} style={{ transform: `scale(${scale})` }}>
      <div className={clsx('plot-plant__stem', `plot-plant__stem--${plant.type}`)} />
      <div className={clsx('plot-plant__bloom', `plot-plant__bloom--${stageLabel.replace(/\s+/g, '').toLowerCase()}`)} />
    </div>
  );
};
