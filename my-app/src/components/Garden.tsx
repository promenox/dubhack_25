import { useEffect, useState } from "react";
import { GardenStage, GardenState } from "../types";

interface GardenProps {
	gardenState: GardenState;
}

const Garden: React.FC<GardenProps> = ({ gardenState }) => {
	const [animate, setAnimate] = useState(false);

	useEffect(() => {
		setAnimate(true);
		const timer = setTimeout(() => setAnimate(false), 600);
		return () => clearTimeout(timer);
	}, [gardenState.stage]);

	return (
		<div style={styles.container}>
			<div style={styles.header}>
				<h2 style={styles.title}>Your Focus Garden</h2>
				<div style={styles.stageInfo}>
					<span style={styles.stageName}>{getStageName(gardenState.stage)}</span>
					<span style={styles.progress}>{gardenState.progress}% to next stage</span>
				</div>
			</div>

			<div style={styles.gardenArea}>
				<div style={{ ...styles.plant, ...(animate ? styles.plantAnimate : {}) }}>
					{renderPlant(gardenState.stage)}
				</div>

				<div style={styles.ground} />

				<div style={styles.statsContainer}>
					<div style={styles.stat}>
						<span style={styles.statLabel}>Total Growth</span>
						<span style={styles.statValue}>{gardenState.totalGrowth}</span>
					</div>
					<div style={styles.stat}>
						<span style={styles.statLabel}>Last Active</span>
						<span style={styles.statValue}>{formatLastActive(gardenState.lastWatered)}</span>
					</div>
				</div>
			</div>

			<div style={styles.progressBar}>
				<div
					style={{
						...styles.progressFill,
						width: `${gardenState.progress}%`,
					}}
				/>
			</div>
		</div>
	);
};

function renderPlant(stage: GardenStage) {
	switch (stage) {
		case "soil":
			return (
				<div style={styles.soil}>
					<div style={styles.soilPile}>🟤</div>
				</div>
			);

		case "seed":
			return (
				<div style={styles.seed}>
					<span style={styles.seedEmoji}>🌰</span>
				</div>
			);

		case "sprout":
			return (
				<div style={styles.sprout}>
					<span style={styles.sproutEmoji}>🌱</span>
				</div>
			);

		case "seedling":
			return (
				<div style={styles.seedling}>
					<span style={styles.seedlingEmoji}>🌿</span>
				</div>
			);

		case "growing":
			return (
				<div style={styles.growing}>
					<span style={styles.growingEmoji}>🪴</span>
				</div>
			);

		case "blooming":
			return (
				<div style={styles.blooming}>
					<span style={styles.bloomingEmoji}>🌻</span>
				</div>
			);

		case "flourishing":
			return (
				<div style={styles.flourishing}>
					<span style={styles.flourishingEmoji}>🌺</span>
					<span style={styles.sparkle}>✨</span>
				</div>
			);
	}
}

function getStageName(stage: GardenStage): string {
	const names: Record<GardenStage, string> = {
		soil: "Fresh Soil",
		seed: "Planted Seed",
		sprout: "Sprouting",
		seedling: "Young Seedling",
		growing: "Growing Strong",
		blooming: "In Bloom",
		flourishing: "Flourishing Garden",
	};
	return names[stage];
}

function formatLastActive(timestamp: number): string {
	const diff = Date.now() - timestamp;
	const minutes = Math.floor(diff / 60000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

const styles: Record<string, React.CSSProperties> = {
	container: {
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		borderRadius: "20px",
		padding: "24px",
		boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
		color: "white",
		minHeight: "400px",
	},
	header: {
		marginBottom: "24px",
	},
	title: {
		fontSize: "24px",
		fontWeight: "bold",
		margin: "0 0 12px 0",
	},
	stageInfo: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
	},
	stageName: {
		fontSize: "18px",
		fontWeight: "500",
	},
	progress: {
		fontSize: "14px",
		opacity: 0.9,
	},
	gardenArea: {
		position: "relative",
		minHeight: "220px",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "flex-end",
		marginBottom: "20px",
	},
	plant: {
		fontSize: "80px",
		marginBottom: "10px",
		transition: "all 0.6s ease-in-out",
	},
	plantAnimate: {
		transform: "scale(1.1) translateY(-10px)",
	},
	ground: {
		width: "100%",
		height: "4px",
		background: "rgba(255,255,255,0.3)",
		borderRadius: "2px",
	},
	statsContainer: {
		display: "flex",
		gap: "24px",
		marginTop: "20px",
	},
	stat: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
	},
	statLabel: {
		fontSize: "12px",
		opacity: 0.8,
		marginBottom: "4px",
	},
	statValue: {
		fontSize: "16px",
		fontWeight: "bold",
	},
	progressBar: {
		width: "100%",
		height: "8px",
		background: "rgba(255,255,255,0.2)",
		borderRadius: "4px",
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		background: "rgba(255,255,255,0.9)",
		borderRadius: "4px",
		transition: "width 0.5s ease-out",
	},
	// Plant styles
	soil: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	soilPile: {
		fontSize: "60px",
	},
	seed: {
		display: "flex",
		justifyContent: "center",
	},
	seedEmoji: {
		fontSize: "50px",
	},
	sprout: {
		display: "flex",
		justifyContent: "center",
	},
	sproutEmoji: {
		fontSize: "70px",
	},
	seedling: {
		display: "flex",
		justifyContent: "center",
	},
	seedlingEmoji: {
		fontSize: "80px",
	},
	growing: {
		display: "flex",
		justifyContent: "center",
	},
	growingEmoji: {
		fontSize: "90px",
	},
	blooming: {
		display: "flex",
		justifyContent: "center",
	},
	bloomingEmoji: {
		fontSize: "100px",
	},
	flourishing: {
		display: "flex",
		justifyContent: "center",
		position: "relative",
	},
	flourishingEmoji: {
		fontSize: "110px",
	},
	sparkle: {
		position: "absolute",
		top: "-10px",
		right: "-10px",
		fontSize: "30px",
		animation: "sparkle 1.5s infinite",
	},
};

export default Garden;
