import { useEffect, useState } from "react";
import { getPlantIconSrc } from "../assets/plantIcons";
import { getSeedLibrary } from "../core/gardenGame";
import type { Plant, PlantType } from "../core/index";
import { PlantVisual, getStageLabel } from "./garden/PlantVisual";
import "./PlantOverlayWindow.css";

interface PlantData {
	plantId: string;
	plotId: string;
	plantType: PlantType;
	progress: number;
	plantedAt: number;
	growthDuration: number;
}

const PlantOverlayWindow = () => {
	const [plantData, setPlantData] = useState<PlantData | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		const handlePlantData = (_event: any, data: PlantData | null) => {
			setPlantData(data);
		};

		ipcRenderer.on("plant-data-update", handlePlantData);

		return () => {
			ipcRenderer.removeListener("plant-data-update", handlePlantData);
		};
	}, []);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button !== 0) return; // Only left mouse button

		setIsDragging(true);
		const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
		setDragOffset({
			x: e.clientX - bounds.left,
			y: e.clientY - bounds.top,
		});

		// Disable text selection during drag
		e.preventDefault();
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!isDragging) return;

		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (ipcRenderer) {
			// Use Electron's window positioning
			const newX = e.screenX - dragOffset.x;
			const newY = e.screenY - dragOffset.y;

			ipcRenderer.send("plant-overlay-move", { x: newX, y: newY });
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	useEffect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, dragOffset]);

	const plant: Plant | null = plantData
		? {
				id: plantData.plantId,
				type: plantData.plantType,
				plantedAt: plantData.plantedAt,
				growthDuration: plantData.growthDuration,
				progress: plantData.progress,
		  }
		: null;

	const seedLibrary = getSeedLibrary();
	const definition = plant ? seedLibrary[plant.type] : undefined;
	const iconSrc = definition ? getPlantIconSrc(definition.icon) : undefined;
	const stageLabel = plant ? getStageLabel(plant) : "";

	return (
		<div className="plant-overlay-root">
			<div
				className={`plant-overlay-container ${isDragging ? "dragging" : ""}`}
				onMouseDown={handleMouseDown}
				style={{ cursor: isDragging ? "grabbing" : "grab" }}
			>
				{plant ? (
					<div className="plant-overlay-content">
						<div className="plant-overlay-header">
							<h3 className="plant-overlay-title">{definition?.displayName}</h3>
							<span className="plant-overlay-stage">{stageLabel}</span>
						</div>

						<div className="plant-overlay-plant-display">
							<PlantVisual
								plant={plant}
								stageLabel={stageLabel}
								iconSrc={iconSrc}
								displayName={definition?.displayName}
								className="plant-overlay-plant"
							/>
						</div>

						<div className="plant-overlay-progress">
							<div className="plant-overlay-progress-bar">
								<div
									className="plant-overlay-progress-fill"
									style={{ width: `${Math.round(plant.progress * 100)}%` }}
								/>
							</div>
							<span className="plant-overlay-progress-text">
								{Math.round(plant.progress * 100)}% Complete
							</span>
						</div>
					</div>
				) : (
					<div className="plant-overlay-empty">
						<span className="plant-overlay-empty-icon">🌿</span>
						<p>Select a plant from your garden to see it grow here</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default PlantOverlayWindow;
