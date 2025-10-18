/**
 * Main App Component
 *
 * Root component with navigation and layout.
 */

import React, { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { GardenOverlay } from "./components/GardenOverlay";
import { Goals } from "./components/Goals";
import { Settings } from "./components/Settings";
import { ProductivityProvider } from "./context/ProductivityContext";
import { useInputTracking } from "./hooks/useInputTracking";

const styles = {
	app: {
		display: "flex",
		height: "100vh",
		backgroundColor: "#121212",
		color: "#fff",
		fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
	},
	sidebar: {
		width: "250px",
		backgroundColor: "#1e1e1e",
		borderRight: "1px solid #333",
		display: "flex",
		flexDirection: "column" as const,
		padding: "1.5rem 0",
	},
	logo: {
		padding: "0 1.5rem",
		marginBottom: "2rem",
	},
	logoTitle: {
		fontSize: "1.5rem",
		fontWeight: "bold" as const,
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		backgroundClip: "text",
	},
	logoSubtitle: {
		fontSize: "0.75rem",
		color: "#999",
		marginTop: "0.25rem",
	},
	nav: {
		flex: 1,
	},
	navItem: {
		padding: "0.75rem 1.5rem",
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		gap: "0.75rem",
		fontSize: "1rem",
		color: "#999",
		transition: "all 0.2s",
		borderLeft: "3px solid transparent",
	},
	navItemActive: {
		backgroundColor: "#2a2a2a",
		color: "#fff",
		borderLeftColor: "#3b82f6",
	},
	navIcon: {
		fontSize: "1.25rem",
	},
	main: {
		flex: 1,
		overflow: "auto" as const,
		height: "100vh",
	},
	footer: {
		padding: "1rem 1.5rem",
		borderTop: "1px solid #333",
		fontSize: "0.75rem",
		color: "#666",
	},
};

type View = "dashboard" | "goals" | "settings" | "overlay";

const AppContent: React.FC = () => {
	const [currentView, setCurrentView] = useState<View>("dashboard");
	const [isOverlay, setIsOverlay] = useState(false);

	// Enable input tracking
	useInputTracking(true);

	// Check if we're in overlay mode (via hash)
	useEffect(() => {
		if (window.location.hash === "#overlay") {
			setIsOverlay(true);
		}
	}, []);

	// Render overlay mode
	if (isOverlay) {
		return <GardenOverlay />;
	}

	// Render main app
	const renderContent = () => {
		switch (currentView) {
			case "dashboard":
				return <Dashboard />;
			case "goals":
				return <Goals />;
			case "settings":
				return <Settings />;
			default:
				return <Dashboard />;
		}
	};

	return (
		<div style={styles.app}>
			{/* Sidebar */}
			<aside style={styles.sidebar}>
				<div style={styles.logo}>
					<div style={styles.logoTitle}>Productivity Garden</div>
					<div style={styles.logoSubtitle}>Grow with every task</div>
				</div>

				<nav style={styles.nav}>
					<div
						style={{
							...styles.navItem,
							...(currentView === "dashboard" ? styles.navItemActive : {}),
						}}
						onClick={() => setCurrentView("dashboard")}
						onMouseEnter={(e) => {
							if (currentView !== "dashboard") {
								e.currentTarget.style.backgroundColor = "#2a2a2a";
							}
						}}
						onMouseLeave={(e) => {
							if (currentView !== "dashboard") {
								e.currentTarget.style.backgroundColor = "transparent";
							}
						}}
					>
						<span style={styles.navIcon}>📊</span>
						<span>Dashboard</span>
					</div>

					<div
						style={{
							...styles.navItem,
							...(currentView === "goals" ? styles.navItemActive : {}),
						}}
						onClick={() => setCurrentView("goals")}
						onMouseEnter={(e) => {
							if (currentView !== "goals") {
								e.currentTarget.style.backgroundColor = "#2a2a2a";
							}
						}}
						onMouseLeave={(e) => {
							if (currentView !== "goals") {
								e.currentTarget.style.backgroundColor = "transparent";
							}
						}}
					>
						<span style={styles.navIcon}>🎯</span>
						<span>Goals</span>
					</div>

					<div
						style={{
							...styles.navItem,
							...(currentView === "settings" ? styles.navItemActive : {}),
						}}
						onClick={() => setCurrentView("settings")}
						onMouseEnter={(e) => {
							if (currentView !== "settings") {
								e.currentTarget.style.backgroundColor = "#2a2a2a";
							}
						}}
						onMouseLeave={(e) => {
							if (currentView !== "settings") {
								e.currentTarget.style.backgroundColor = "transparent";
							}
						}}
					>
						<span style={styles.navIcon}>⚙️</span>
						<span>Settings</span>
					</div>
				</nav>

				<div style={styles.footer}>
					<div>v1.0.0</div>
					<div style={{ marginTop: "0.25rem" }}>Privacy-first productivity</div>
				</div>
			</aside>

			{/* Main Content */}
			<main style={styles.main}>{renderContent()}</main>
		</div>
	);
};

const App: React.FC = () => {
	return (
		<ProductivityProvider>
			<AppContent />
		</ProductivityProvider>
	);
};

export default App;
