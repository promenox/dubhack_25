import { useEffect, useState } from "react";
import { Route, HashRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import Debug from "./components/Debug";
import Garden from "./components/Garden";
import Goals from "./components/Goals";
import Leaderboard from "./components/Leaderboard";
import Overlay from "./components/Overlay";
import PlantOverlayWindow from "./components/PlantOverlayWindow";
import authService from "./services/auth";
import { initializeDatabaseAuth } from "./utils/database";

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		// Check for existing session on app startup
		const checkAuth = async () => {
			try {
				await authService.getCurrentSession();
				setIsAuthenticated(true);

				// Initialize database auth with existing token
				initializeDatabaseAuth();
				console.log("🔑 Database auth initialized with existing session");
			} catch (error) {
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, []);

	const handleAuthSuccess = () => {
		setIsAuthenticated(true);
	};

	const handleSignOut = async () => {
		try {
			await authService.signOut();
			setIsAuthenticated(false);
		} catch (error) {
			console.error("Sign out error:", error);
			// Still set to false even if there's an error
			setIsAuthenticated(false);
		}
	};

	// Loading screen while checking session
	if (isLoading) {
		return null;
	}

	// Show auth screen if not authenticated
	if (!isAuthenticated) {
		return <Auth onAuthSuccess={handleAuthSuccess} />;
	}

	// Show main app if authenticated
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Dashboard onSignOut={handleSignOut} />} />
				<Route path="/goals" element={<Goals />} />
				<Route path="/leaderboard" element={<Leaderboard />} />
				<Route path="/overlay" element={<Overlay />} />
				<Route path="/plant-overlay" element={<PlantOverlayWindow />} />
				<Route path="/garden" element={<Garden />} />
				<Route path="/debug" element={<Debug />} />
			</Routes>
		</Router>
	);
}

export default App;
