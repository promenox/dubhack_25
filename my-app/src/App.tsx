import { useEffect, useState } from "react";
import "./App.css";
import AISummary from "./components/AISummary";
import FocusScore from "./components/FocusScore";
import Garden from "./components/Garden";
import GoalSetting from "./components/GoalSetting";
import OCRPreview from "./components/OCRPreview";
import Settings from "./components/Settings";
import WelcomeOverlay from "./components/WelcomeOverlay";
import { useFocusAI } from "./hooks/useFocusAI";

function App() {
	const { appState, saveGoal, setApiKey } = useFocusAI();
	const [showWelcome, setShowWelcome] = useState(false);

	useEffect(() => {
		// Check if this is the first time user opens the app
		const hasSeenWelcome = localStorage.getItem("focusai_welcome_seen");
		if (!hasSeenWelcome) {
			setShowWelcome(true);
		}
	}, []);

	const handleDismissWelcome = () => {
		localStorage.setItem("focusai_welcome_seen", "true");
		setShowWelcome(false);
	};

	return (
		<div style={styles.app}>
			{showWelcome && <WelcomeOverlay onDismiss={handleDismissWelcome} />}

			<header style={styles.header}>
				<div style={styles.headerContent}>
					<h1 style={styles.logo}>
						<span style={styles.logoIcon}>🎯</span>
						FocusAI
					</h1>
					<div style={styles.statusBadge}>
						<div
							style={{
								...styles.statusDot,
								background: appState.isTracking ? "#10b981" : "#ef4444",
							}}
						/>
						<span style={styles.statusText}>{appState.isTracking ? "Tracking" : "Paused"}</span>
					</div>
				</div>
			</header>

			<main style={styles.main}>
				<div style={styles.grid}>
					{/* Left Column */}
					<div style={styles.leftColumn}>
						<GoalSetting currentGoal={appState.currentGoal} onSaveGoal={saveGoal} />

						<Garden gardenState={appState.gardenState} />
					</div>

					{/* Right Column */}
					<div style={styles.rightColumn}>
						<FocusScore score={appState.focusScore} />

						<AISummary summary={appState.recentSummary} />

						{/* Live OCR from screenshots */}
						<OCRPreview
							text={appState.latestOcrText || ""}
							confidence={appState.latestOcrConfidence || 0}
						/>
					</div>
				</div>
			</main>

			<Settings onSaveApiKey={setApiKey} />

			<footer style={styles.footer}>
				<p style={styles.footerText}>Built for DubHacks 2025 • Data stays on your device</p>
			</footer>
		</div>
	);
}

const styles: Record<string, React.CSSProperties> = {
	app: {
		minHeight: "100vh",
		background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
		color: "white",
		display: "flex",
		flexDirection: "column",
	},
	header: {
		borderBottom: "1px solid rgba(255,255,255,0.1)",
		padding: "20px 0",
		background: "rgba(0,0,0,0.2)",
		backdropFilter: "blur(10px)",
	},
	headerContent: {
		maxWidth: "1400px",
		margin: "0 auto",
		padding: "0 24px",
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
	},
	logo: {
		fontSize: "28px",
		fontWeight: "bold",
		margin: 0,
		display: "flex",
		alignItems: "center",
		gap: "12px",
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		backgroundClip: "text",
	},
	logoIcon: {
		fontSize: "32px",
		filter: "none",
		WebkitTextFillColor: "initial",
	},
	statusBadge: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		padding: "8px 16px",
		background: "rgba(255,255,255,0.05)",
		borderRadius: "20px",
		border: "1px solid rgba(255,255,255,0.1)",
	},
	statusDot: {
		width: "8px",
		height: "8px",
		borderRadius: "50%",
		animation: "pulse 2s infinite",
	},
	statusText: {
		fontSize: "14px",
		fontWeight: "600",
	},
	main: {
		flex: 1,
		maxWidth: "1400px",
		margin: "0 auto",
		padding: "40px 24px",
		width: "100%",
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
		gap: "24px",
		alignItems: "start",
	},
	leftColumn: {
		display: "flex",
		flexDirection: "column",
		gap: "24px",
	},
	rightColumn: {
		display: "flex",
		flexDirection: "column",
		gap: "24px",
	},
	footer: {
		borderTop: "1px solid rgba(255,255,255,0.1)",
		padding: "20px 24px",
		textAlign: "center",
	},
	footerText: {
		fontSize: "13px",
		opacity: 0.6,
		margin: 0,
	},
};

export default App;
