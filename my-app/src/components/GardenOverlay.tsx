/**
 * GardenOverlay Component
 *
 * Translucent, always-on-top overlay that displays a growing garden
 * based on productivity score. Plants grow and thrive when score is high.
 */

import React, { useMemo } from "react";
import { useProductivity } from "../context/ProductivityContext";

const styles = {
	container: {
		width: "100%",
		height: "100%",
		background: "linear-gradient(to bottom, rgba(135, 206, 235, 0.2), rgba(34, 139, 34, 0.3))",
		backdropFilter: "blur(10px)",
		borderRadius: "12px",
		overflow: "hidden" as const,
		display: "flex",
		flexDirection: "column" as const,
		position: "relative" as const,
	},
	scoreDisplay: {
		padding: "1rem",
		textAlign: "center" as const,
		background: "rgba(0, 0, 0, 0.5)",
		backdropFilter: "blur(5px)",
	},
	scoreValue: {
		fontSize: "2rem",
		fontWeight: "bold" as const,
		color: "#fff",
		textShadow: "0 2px 4px rgba(0,0,0,0.5)",
	},
	scoreLabel: {
		fontSize: "0.75rem",
		color: "rgba(255,255,255,0.8)",
		marginTop: "0.25rem",
	},
	garden: {
		flex: 1,
		position: "relative" as const,
		padding: "1rem",
		display: "flex",
		alignItems: "flex-end",
		justifyContent: "space-around",
		background: "linear-gradient(to bottom, transparent, rgba(101, 67, 33, 0.3))",
	},
	ground: {
		position: "absolute" as const,
		bottom: 0,
		left: 0,
		right: 0,
		height: "30px",
		background: "linear-gradient(to bottom, rgba(139, 90, 43, 0.5), rgba(101, 67, 33, 0.7))",
		borderTop: "2px solid rgba(101, 67, 33, 0.8)",
	},
	plant: {
		position: "relative" as const,
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		zIndex: 1,
	},
	stem: {
		width: "4px",
		background: "linear-gradient(to bottom, #2d5016, #4a7c2c)",
		borderRadius: "2px",
		position: "relative" as const,
		transformOrigin: "bottom center",
	},
	leaf: {
		position: "absolute" as const,
		width: "12px",
		height: "8px",
		background: "#4ade80",
		borderRadius: "50% 0",
		transformOrigin: "bottom left",
	},
	flower: {
		position: "absolute" as const,
		top: "-12px",
		width: "20px",
		height: "20px",
		borderRadius: "50%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	flowerCenter: {
		width: "6px",
		height: "6px",
		borderRadius: "50%",
		backgroundColor: "#fbbf24",
	},
	statusText: {
		textAlign: "center" as const,
		padding: "0.5rem",
		fontSize: "0.75rem",
		color: "rgba(255,255,255,0.9)",
		background: "rgba(0,0,0,0.3)",
		backdropFilter: "blur(5px)",
	},
};

interface PlantProps {
	height: number;
	hasFlower: boolean;
	color: string;
	animationDelay: number;
}

const Plant: React.FC<PlantProps> = ({ height, hasFlower, color, animationDelay }) => {
	const stemStyle: React.CSSProperties = {
		...styles.stem,
		height: `${height}px`,
		animation: `growUp 2s ease-out ${animationDelay}s forwards`,
	};

	const leafPositions = useMemo(() => {
		const positions = [];
		const numLeaves = Math.floor(height / 20);
		for (let i = 0; i < numLeaves; i++) {
			positions.push({
				bottom: `${(i + 1) * (height / (numLeaves + 1))}px`,
				left: i % 2 === 0 ? "-6px" : "4px",
				rotation: i % 2 === 0 ? -45 : 45,
			});
		}
		return positions;
	}, [height]);

	return (
		<div style={styles.plant}>
			<div style={stemStyle}>
				{leafPositions.map((pos, i) => (
					<div
						key={i}
						style={{
							...styles.leaf,
							bottom: pos.bottom,
							left: pos.left,
							transform: `rotate(${pos.rotation}deg)`,
							animation: `fadeIn 0.5s ease-out ${animationDelay + 0.5 + i * 0.2}s forwards`,
							opacity: 0,
						}}
					/>
				))}
				{hasFlower && (
					<div
						style={{
							...styles.flower,
							backgroundColor: color,
							animation: `bloom 1s ease-out ${
								animationDelay + 1.5
							}s forwards, sway 3s ease-in-out infinite`,
							opacity: 0,
						}}
					>
						<div style={styles.flowerCenter} />
					</div>
				)}
			</div>
		</div>
	);
};

const getPlantConfig = (score: number) => {
	if (score >= 80) {
		return {
			numPlants: 5,
			maxHeight: 100,
			hasFlowers: true,
			colors: ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"],
			message: "Your garden is thriving! 🌸",
		};
	} else if (score >= 60) {
		return {
			numPlants: 4,
			maxHeight: 70,
			hasFlowers: true,
			colors: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899"],
			message: "Great progress! Keep growing 🌱",
		};
	} else if (score >= 40) {
		return {
			numPlants: 3,
			maxHeight: 50,
			hasFlowers: false,
			colors: ["#10b981", "#3b82f6", "#f59e0b"],
			message: "Your garden is growing 🌿",
		};
	} else if (score >= 20) {
		return {
			numPlants: 2,
			maxHeight: 30,
			hasFlowers: false,
			colors: ["#10b981", "#3b82f6"],
			message: "Keep watering your garden 💧",
		};
	} else {
		return {
			numPlants: 1,
			maxHeight: 20,
			hasFlowers: false,
			colors: ["#10b981"],
			message: "Time to plant some seeds 🌱",
		};
	}
};

const getScoreColor = (score: number): string => {
	if (score >= 80) return "#4ade80";
	if (score >= 60) return "#fbbf24";
	if (score >= 40) return "#fb923c";
	return "#f87171";
};

export const GardenOverlay: React.FC = () => {
	const { metrics } = useProductivity();

	const score = metrics?.score ?? 0;
	const config = getPlantConfig(score);
	const scoreColor = getScoreColor(score);

	return (
		<>
			{/* Keyframe animations injected as style tag */}
			<style>
				{`
          @keyframes growUp {
            from {
              height: 0;
              opacity: 0;
            }
            to {
              height: ${config.maxHeight}px;
              opacity: 1;
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0) rotate(0deg);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes bloom {
            from {
              opacity: 0;
              transform: scale(0) rotate(0deg);
            }
            to {
              opacity: 1;
              transform: scale(1) rotate(360deg);
            }
          }
          
          @keyframes sway {
            0%, 100% {
              transform: rotate(-5deg);
            }
            50% {
              transform: rotate(5deg);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
        `}
			</style>

			<div style={styles.container}>
				{/* Score Display */}
				<div style={styles.scoreDisplay}>
					<div
						style={{
							...styles.scoreValue,
							color: scoreColor,
							animation: "pulse 2s ease-in-out infinite",
						}}
					>
						{score}
					</div>
					<div style={styles.scoreLabel}>Productivity Score</div>
				</div>

				{/* Garden */}
				<div style={styles.garden}>
					<div style={styles.ground} />
					{Array.from({ length: config.numPlants }).map((_, i) => {
						const heightVariation = 0.7 + Math.random() * 0.6; // 70-130% of max
						const plantHeight = config.maxHeight * heightVariation;

						return (
							<Plant
								key={i}
								height={plantHeight}
								hasFlower={config.hasFlowers}
								color={config.colors[i % config.colors.length]}
								animationDelay={i * 0.3}
							/>
						);
					})}
				</div>

				{/* Status Message */}
				<div style={styles.statusText}>{config.message}</div>
			</div>
		</>
	);
};
