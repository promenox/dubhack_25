import clsx from "clsx";
import { useMemo } from "react";
import { getPlantIconSrc } from "../../assets/plantIcons";
import { getSeedLibrary } from "../../core/gardenGame";
import type { Plant, PlantType, Plot } from "../../core/index";
import { PlantVisual, getStageLabel } from "./PlantVisual";

const getProgressPercent = (plant: Plant) => Math.min(100, Math.round(plant.progress * 100));

const getPlotDisplayId = (plotId: string) => {
	const numeric = plotId.match(/\d+/);
	if (numeric) {
		return numeric[0];
	}
	const cleaned = plotId.replace(/plot[-_]?/i, "");
	return cleaned ? cleaned.toUpperCase() : plotId.toUpperCase();
};

interface GardenGridProps {
	plots: Plot[];
	onDropSeed: (plotId: string, seedType: PlantType) => void;
	onHarvest: (plotId: string) => void;
	shakePlotId?: string;
	selectedOverlayPlotId?: string | null;
	onSelectOverlayPlot?: (plotId: string, plant: Plant) => void;
}

const GROWTH_COLORS: Record<string, string> = {
	Seedling: "var(--plot-progress-seed)",
	Sprouting: "var(--plot-progress-sprout)",
	Blooming: "var(--plot-progress-bloom)",
	"Ready to Harvest": "var(--plot-progress-harvest)",
};

export const GardenGrid = ({
	plots,
	onDropSeed,
	onHarvest,
	shakePlotId,
	selectedOverlayPlotId,
	onSelectOverlayPlot,
}: GardenGridProps) => {
	const gridTemplate = useMemo(() => {
		const count = plots.length;
		if (count <= 4) return "repeat(2, minmax(0, 1fr))";
		if (count <= 6) return "repeat(3, minmax(0, 1fr))";
		return "repeat(4, minmax(0, 1fr))";
	}, [plots.length]);

	const seedLibrary = getSeedLibrary();

	return (
		<div className="garden-section">
			<div className="garden-grid" style={{ gridTemplateColumns: gridTemplate }}>
				{plots.map((plot) => {
					const plant = plot.plant;
					const stageLabel = plant ? getStageLabel(plant) : "Empty Plot";
					const percent = plant ? getProgressPercent(plant) : 0;
					const progressColor = plant ? GROWTH_COLORS[stageLabel] : "transparent";
					const definition = plant ? seedLibrary[plant.type] : undefined;
					const iconSrc = definition ? getPlantIconSrc(definition.icon) : undefined;
					const isSelectedForOverlay = Boolean(plant && selectedOverlayPlotId === plot.id);

					const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
						event.preventDefault();
						const seedType = event.dataTransfer.getData("application/seed-type") as PlantType | "";
						if (!seedType) return;
						onDropSeed(plot.id, seedType);
					};

					const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
						event.preventDefault();
						event.dataTransfer.dropEffect = "copy";
					};

					return (
						<div
							key={plot.id}
							className={clsx("plot-card", {
								"plot-card--occupied": Boolean(plant),
								"plot-card--ready": plant && plant.progress >= 1,
								"plot-card--shake": shakePlotId === plot.id,
								"plot-card--overlay-selected": isSelectedForOverlay,
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
										{onSelectOverlayPlot ? (
											<button
												type="button"
												className={clsx("plot-card__overlay-button", {
													"plot-card__overlay-button--active": isSelectedForOverlay,
												})}
												onClick={() => onSelectOverlayPlot(plot.id, plant)}
												aria-pressed={isSelectedForOverlay}
											>
												{isSelectedForOverlay ? "Overlay Active" : "Show in Overlay"}
											</button>
										) : null}
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
