import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FocusData } from "../types/ipc";
import "./Dashboard.css";

interface Activity {
	app: string;
	context: string;
	url: string;
	timestamp: Date;
	type: string;
}

interface DashboardProps {
	onSignOut?: () => void;
}

const Dashboard = ({ onSignOut }: DashboardProps) => {
	const navigate = useNavigate();
	const [instantaneousScore, setInstantaneousScore] = useState<number>(0);
	const [cumulativeScore, setCumulativeScore] = useState<number>(0);
	const [instantaneousContext, setInstantaneousContext] = useState<string>("Calculating...");
	const [cumulativeContext, setCumulativeContext] = useState<string>("Building momentum...");
	const [gardenPlant, setGardenPlant] = useState<string>("🌱");
	const [gardenName, setGardenName] = useState<string>("Seedling");
	const [activityHistory, setActivityHistory] = useState<Activity[]>([]);
	const [insights, setInsights] = useState<Array<{ text: string; timestamp: number }>>([]);
	const [sessionActive, setSessionActive] = useState<boolean>(false);
	const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
	const [sessionDuration, setSessionDuration] = useState<string>("00:00:00");

	const gardenLevels = ["🌱", "🌿", "🌳", "🌸", "🌺", "🌻", "🌷", "🌹"];
	const gardenNames = [
		"Seedling",
		"Sprout",
		"Sapling",
		"Budding",
		"Blooming",
		"Flowering",
		"Thriving",
		"Masterpiece",
	];

	const updateScoreCircle = (circleId: string, score: number) => {
		const circle = document.getElementById(circleId);
		if (!circle) return;

		const percentage = Math.min(score, 100);
		const degrees = (percentage / 100) * 360;

		circle.style.background = `conic-gradient(
      var(--success-gradient) ${degrees}deg,
      var(--glass-border) ${degrees}deg
    )`;
	};

	const updateDashboard = useCallback(
		(data: FocusData) => {
			console.log("Dashboard update:", data);

			// Update instantaneous score
			setInstantaneousScore(data.instantaneous);
			setInstantaneousContext(data.context || "Calculating...");
			updateScoreCircle("instantaneousCircle", data.instantaneous);

			// Update cumulative score
			setCumulativeScore(data.cumulative);
			setCumulativeContext("Session average");
			updateScoreCircle("cumulativeCircle", data.cumulative);

			// Update garden
			const level = Math.min(Math.floor(data.cumulative / 12.5), 7);
			setGardenPlant(gardenLevels[level]);
			setGardenName(gardenNames[level]);

			// Update activity feed
			const activity: Activity = {
				app: data.activeApp || "Unknown",
				context: data.context,
				url: data.url || "",
				timestamp: new Date(data.timestamp),
				type: getActivityType(data.activeApp || "", data.url || ""),
			};

			setActivityHistory((prev) => {
				const newHistory = [activity, ...prev];
				return newHistory.slice(0, 10);
			});

			// Update AI insights
			setInsights((prev) => {
				const newInsights = [
					{
						text: data.aiInsight || "Analyzing your productivity patterns...",
						timestamp: data.timestamp,
					},
					...prev,
				];
				return newInsights.slice(0, 5);
			});
		},
		[gardenLevels, gardenNames]
	);

	useEffect(() => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		const handleFocusUpdate = (_event: any, data: FocusData) => {
			updateDashboard(data);
		};

		ipcRenderer.on("focus-update", handleFocusUpdate);

		return () => {
			ipcRenderer.removeListener("focus-update", handleFocusUpdate);
		};
	}, [updateDashboard]);

	useEffect(() => {
		if (!sessionActive || !sessionStartTime) return;

		const timer = setInterval(() => {
			const duration = Date.now() - sessionStartTime;
			const hours = Math.floor(duration / 3600000);
			const minutes = Math.floor((duration % 3600000) / 60000);
			const seconds = Math.floor((duration % 60000) / 1000);

			const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
				.toString()
				.padStart(2, "0")}`;
			setSessionDuration(timeString);
		}, 1000);

		return () => clearInterval(timer);
	}, [sessionActive, sessionStartTime]);

	const startSession = () => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		setSessionActive(true);
		setSessionStartTime(Date.now());
		ipcRenderer.send("start-session");
		console.log("Focus session started");
	};

	const stopSession = () => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		setSessionActive(false);
		setSessionStartTime(null);
		ipcRenderer.send("stop-session");
		console.log("Focus session stopped");
	};

	const openDebugPage = () => {
		navigate("/debug");
	};

	const getActivityType = (app: string, url: string) => {
		const appLower = app.toLowerCase();
		const urlLower = url.toLowerCase();

		if (appLower.includes("cursor") || appLower.includes("code") || appLower.includes("vs code")) {
			return "coding";
		} else if (appLower.includes("chrome") || appLower.includes("safari")) {
			if (
				urlLower.includes("github.com") ||
				urlLower.includes("stackoverflow.com") ||
				urlLower.includes("docs.")
			) {
				return "coding";
			} else if (
				urlLower.includes("youtube.com") ||
				urlLower.includes("netflix.com") ||
				urlLower.includes("twitch.tv")
			) {
				return "media";
			} else if (urlLower.includes("gmail.com") || urlLower.includes("outlook.com")) {
				return "communication";
			} else if (urlLower.includes("chatgpt.com") || urlLower.includes("claude.ai")) {
				return "ai-tools";
			}
			return "browsing";
		} else if (appLower.includes("notion") || appLower.includes("obsidian")) {
			return "productivity";
		} else if (appLower.includes("discord") || appLower.includes("slack")) {
			return "communication";
		} else if (appLower.includes("spotify") || appLower.includes("music")) {
			return "media";
		}
		return "other";
	};

	const getActivityIcon = (type: string) => {
		const icons: Record<string, string> = {
			coding: "💻",
			media: "🎵",
			communication: "💬",
			"ai-tools": "🤖",
			browsing: "🌐",
			productivity: "📝",
			other: "⚙️",
		};
		return icons[type] || "⚙️";
	};

	const getActivityGradient = (type: string) => {
		const gradients: Record<string, string> = {
			coding: "var(--success-gradient)",
			media: "var(--secondary-gradient)",
			communication: "var(--warning-gradient)",
			"ai-tools": "var(--primary-gradient)",
			browsing: "var(--glass-border)",
			productivity: "var(--success-gradient)",
			other: "var(--glass-border)",
		};
		return gradients[type] || "var(--glass-border)";
	};

	const getDomainFromUrl = (url: string) => {
		try {
			const domain = new URL(url).hostname;
			return domain.replace("www.", "");
		} catch (e) {
			return url;
		}
	};

	const formatTime = (timestamp: Date) => {
		const now = new Date();
		const diff = now.getTime() - timestamp.getTime();
		const minutes = Math.floor(diff / 60000);

		if (minutes < 1) return "Just now";
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return timestamp.toLocaleDateString();
	};

	return (
		<div className="app-container">
			{/* Premium Sidebar */}
			<div className="sidebar">
				<div className="logo">
					<div className="logo-icon"></div>
					<div className="logo-text">FocusAI</div>
				</div>

				<div className="nav-section">
					<div className="nav-title">Dashboard</div>
					<div className="nav-item active">
						<div className="nav-icon">📊</div>
						<div className="nav-label">Overview</div>
					</div>
					<div className="nav-item" onClick={() => navigate("/garden")}>
						<div className="nav-icon">🌱</div>
						<div className="nav-label">Garden</div>
					</div>
					<div className="nav-item">
						<div className="nav-icon">📈</div>
						<div className="nav-label">Analytics</div>
					</div>
				</div>

				<div className="nav-section">
					<div className="nav-title">Tools</div>
					<div className="nav-item">
						<div className="nav-icon">⚙️</div>
						<div className="nav-label">Settings</div>
					</div>
					<div className="nav-item">
						<div className="nav-icon">🎯</div>
						<div className="nav-label">Goals</div>
					</div>
					<div className="nav-item">
						<div className="nav-icon">💡</div>
						<div className="nav-label">Insights</div>
					</div>
					<div className="nav-item" onClick={openDebugPage}>
						<div className="nav-icon">🔧</div>
						<div className="nav-label">Debug Console</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="main-content">
				<div className="dashboard-header">
					<div>
						<h1 className="dashboard-title">Productivity Dashboard</h1>
						<p className="dashboard-subtitle">Track your focus and grow your digital garden</p>
					</div>
					{onSignOut && (
						<button
							className="btn btn-secondary"
							onClick={onSignOut}
							style={{
								padding: "10px 20px",
								fontSize: "14px",
								minWidth: "120px",
							}}
						>
							Sign Out
						</button>
					)}
				</div>

				{/* Premium Cards Grid */}
				<div className="cards-grid">
					{/* Instantaneous Score Card */}
					<div className="card score-card">
						<div className="card-header">
							<h3 className="card-title">Instantaneous Focus</h3>
							<div className="card-icon">⚡</div>
						</div>
						<div className="score-display">
							<div className="score-circle" id="instantaneousCircle">
								<div className="score-value">{instantaneousScore.toFixed(0)}</div>
							</div>
							<div>
								<div className="score-label">Current Score</div>
								<div className="score-label">{instantaneousContext}</div>
							</div>
						</div>
					</div>

					{/* Cumulative Score Card */}
					<div className="card score-card">
						<div className="card-header">
							<h3 className="card-title">Cumulative Progress</h3>
							<div className="card-icon">📈</div>
						</div>
						<div className="score-display">
							<div className="score-circle" id="cumulativeCircle">
								<div className="score-value">{cumulativeScore.toFixed(0)}</div>
							</div>
							<div>
								<div className="score-label">Session Average</div>
								<div className="score-label">{cumulativeContext}</div>
							</div>
						</div>
					</div>

					{/* Focus Garden Card */}
					<div className="card garden-card">
						<div className="card-header">
							<h3 className="card-title">Focus Garden</h3>
							<div className="card-icon">🌱</div>
						</div>
						<div className="garden-container">
							<div className="garden-plant">{gardenPlant}</div>
							<div className="garden-level">{gardenName}</div>
						</div>
					</div>

					{/* Activity Feed Card */}
					<div className="card activity-card">
						<div className="card-header">
							<h3 className="card-title">Recent Activity</h3>
							<div className="card-icon">🔄</div>
						</div>
						<div className="activity-feed">
							{activityHistory.length === 0 ? (
								<div className="activity-item">
									<div className="activity-icon" style={{ background: "var(--success-gradient)" }}>
										💻
									</div>
									<div className="activity-content">
										<div className="activity-text">Starting FocusAI session</div>
										<div className="activity-time">Just now</div>
									</div>
								</div>
							) : (
								activityHistory.map((activity, index) => (
									<div key={index} className="activity-item">
										<div
											className="activity-icon"
											style={{ background: getActivityGradient(activity.type) }}
										>
											{getActivityIcon(activity.type)}
										</div>
										<div className="activity-content">
											<div className="activity-text">
												{activity.context || `Using ${activity.app}`}
												{activity.url && ` - ${getDomainFromUrl(activity.url)}`}
											</div>
											<div className="activity-time">{formatTime(activity.timestamp)}</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* AI Insights Card */}
					<div className="card insights-card">
						<div className="card-header">
							<h3 className="card-title">AI Insights</h3>
							<div className="card-icon">🤖</div>
						</div>
						<div>
							{insights.length === 0 ? (
								<div className="insight-item">
									<div className="insight-text">
										Welcome to FocusAI! I'm analyzing your productivity patterns...
									</div>
									<div className="insight-timestamp">Initializing</div>
								</div>
							) : (
								insights.map((insight, index) => (
									<div key={index} className="insight-item">
										<div className="insight-text">{insight.text}</div>
										<div className="insight-timestamp">
											{new Date(insight.timestamp).toLocaleTimeString()}
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Session Control Card */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Session Control</h3>
							<div className="card-icon">🎯</div>
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "12px",
								position: "relative",
								zIndex: 1,
							}}
						>
							{!sessionActive ? (
								<button className="btn btn-primary" onClick={startSession}>
									Start Focus Session
								</button>
							) : (
								<>
									<div>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												marginBottom: "8px",
											}}
										>
											<span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
												Session Duration:
											</span>
											<span
												style={{
													fontFamily: "'JetBrains Mono', monospace",
													fontWeight: 600,
													color: "var(--text-primary)",
												}}
											>
												{sessionDuration}
											</span>
										</div>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
											}}
										>
											<span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
												Status:
											</span>
											<span style={{ color: "#43e97b", fontWeight: 600 }}>Active</span>
										</div>
									</div>
									<button className="btn btn-danger" onClick={stopSession}>
										Stop Session
									</button>
								</>
							)}
							<button className="btn btn-secondary" onClick={openDebugPage}>
								Debug Console
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
