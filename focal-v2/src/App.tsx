import { useEffect, useState } from "react";
import { Route, HashRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import Debug from "./components/Debug";
import Garden from "./components/Garden";
import Overlay from "./components/Overlay";
import authService from "./services/auth";

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check if user is already authenticated
		const checkAuth = async () => {
			try {
				await authService.getCurrentSession();
				setIsAuthenticated(true);
			} catch (error) {
				setIsAuthenticated(false);
			} finally {
				setLoading(false);
			}
		};

		checkAuth();
	}, []);

	const handleAuthSuccess = () => {
		setIsAuthenticated(true);
	};

	const handleSignOut = async () => {
		await authService.signOut();
		setIsAuthenticated(false);
	};

	// Show loading state
	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
					fontSize: "24px",
					color: "#667eea",
				}}
			>
				Loading...
			</div>
		);
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
				<Route path="/overlay" element={<Overlay />} />
				<Route path="/garden" element={<Garden />} />
				<Route path="/debug" element={<Debug />} />
			</Routes>
		</Router>
	);
}

export default App;
