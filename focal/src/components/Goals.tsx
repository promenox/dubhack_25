import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const STORAGE_KEY = "focal.user.goal";

const Goals: React.FC = () => {
	const navigate = useNavigate();
	const [goal, setGoal] = useState<string>("");
	const [saving, setSaving] = useState<boolean>(false);
	const [savedAt, setSavedAt] = useState<number | null>(null);

	useEffect(() => {
		try {
			const existing = localStorage.getItem(STORAGE_KEY);
			if (existing) setGoal(existing);
		} catch (_err) {
			// ignore
		}
	}, []);

	const saveGoal = async () => {
		setSaving(true);
		try {
			localStorage.setItem(STORAGE_KEY, goal);
			const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
			if (ipcRenderer) {
				await ipcRenderer.invoke("set-user-goal", goal);
			}
			setSavedAt(Date.now());
		} catch (_err) {
			// ignore
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="app-container">
			<div className="sidebar">
				<div className="logo">
					<div className="logo-icon">
						<img src="/focal-ai-icon.png" alt="FocalAI" className="logo-img" />
					</div>
				</div>

				<nav className="nav">
					<div className="nav-section">
						<div className="nav-title">Main</div>
						<div className="nav-item" onClick={() => navigate("/")}>
							<div className="nav-icon">📊</div>
							<div className="nav-label">Dashboard</div>
						</div>
						<div className="nav-item" onClick={() => navigate("/garden")}>
							<div className="nav-icon">🌱</div>
							<div className="nav-label">Garden</div>
						</div>
						<div className="nav-item active">
							<div className="nav-icon">🎯</div>
							<div className="nav-label">Goals</div>
						</div>
						<div className="nav-item" onClick={() => navigate("/leaderboard")}>
							<div className="nav-icon">🏆</div>
							<div className="nav-label">Leaderboard</div>
						</div>
					</div>
				</nav>
			</div>

			<div className="main-content">
				<h1 className="session-title">Your Focus Goal</h1>
				<div className="cards-grid">
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Set a goal for this session or day</h3>
							<div className="card-icon">🎯</div>
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
							<textarea
								value={goal}
								onChange={(e) => setGoal(e.target.value)}
								placeholder="e.g., Finish the backend API, write unit tests for auth, and prepare demo slides."
								style={{
									minHeight: 140,
									resize: "vertical",
									background: "var(--bg-secondary)",
									color: "#fff",
									border: "1px solid var(--glass-border)",
									borderRadius: "12px",
									padding: "12px 14px",
									fontFamily: "var(--font-primary)",
									fontSize: 14,
								}}
							/>
							<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
								<button className="btn btn-success" onClick={saveGoal} disabled={saving}>
									{saving ? "Saving..." : "Save Goal"}
								</button>
								{savedAt && (
									<span style={{ color: "var(--accent)" }}>
										Saved {new Date(savedAt).toLocaleTimeString()}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Goals;
