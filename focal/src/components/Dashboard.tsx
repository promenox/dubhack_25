import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

const Dashboard: React.FC<DashboardProps> = ({ onSignOut }) => {
	const navigate = useNavigate();
	const [instantaneousScore, setInstantaneousScore] = useState<number>(0);
	const [cumulativeScore, setCumulativeScore] = useState<number>(0);
	const [instantaneousContext, setInstantaneousContext] = useState<string>("Calculating...");
	const [cumulativeContext, setCumulativeContext] = useState<string>("Building momentum...");
	const [activityHistory, setActivityHistory] = useState<Activity[]>([]);
	const [insights, setInsights] = useState<Array<{ text: string; timestamp: number }>>([]);
	const [sessionActive, setSessionActive] = useState<boolean>(false);
	const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
	const [sessionDuration, setSessionDuration] = useState<string>("00:00:00");

	const updateScoreCircle = (circleId: string, score: number) => {
		const circle = document.getElementById(circleId);
		if (!circle) return;

		const percentage = Math.min(score, 100);
		const circumference = 2 * Math.PI * 45; // radius = 45
		const offset = circumference - (percentage / 100) * circumference;

		circle.style.strokeDasharray = `${circumference} ${circumference}`;
		circle.style.strokeDashoffset = offset.toString();
	};

	const handleFocusUpdate = useCallback(
		(_e: any, data: any) => {
			// Update instantaneous score
			setInstantaneousScore(data.instantaneous || 0);
			setInstantaneousContext(data.context || "Analyzing...");
			updateScoreCircle("instantaneousCircle", data.instantaneous || 0);

			// Update cumulative score
			setCumulativeScore(data.cumulative);
			setCumulativeContext("Session average");
			updateScoreCircle("cumulativeCircle", data.cumulative);

			// Update activity feed
			const activity: Activity = {
				app: data.activeApp || "Unknown",
				context: data.context,
				url: data.url || "",
				timestamp: new Date(),
				type: "focus",
			};

			setActivityHistory((prev) => {
				const newHistory = [activity, ...prev.slice(0, 9)];
				return newHistory;
			});

			// Update insights
			setInsights((prev) => {
				const newInsights = [
					{
						text: `Focus score: ${(data.instantaneous || 0).toFixed(1)} - ${data.context || "Analyzing activity"}`,
						timestamp: Date.now(),
					},
					...prev,
				];
				return newInsights.slice(0, 5);
			});
		},
		[]
	);

	useEffect(() => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		ipcRenderer.on("focus-update", handleFocusUpdate);

		return () => {
			ipcRenderer.removeListener("focus-update", handleFocusUpdate);
		};
	}, [handleFocusUpdate]);

	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;

		if (sessionActive && sessionStartTime) {
			interval = setInterval(() => {
				const now = Date.now();
				const elapsed = now - sessionStartTime;
				const totalSeconds = Math.floor(elapsed / 1000);
				const hours = Math.floor(totalSeconds / 3600);
				const minutes = Math.floor((totalSeconds % 3600) / 60);
				const seconds = totalSeconds % 60;

				setSessionDuration(
					`${hours.toString().padStart(2, "0")}:${minutes
						.toString()
						.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
				);
			}, 1000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [sessionActive, sessionStartTime]);

	const startSession = () => {
		setSessionActive(true);
		setSessionStartTime(Date.now());
		setSessionDuration("00:00:00");
		
		// Send IPC event to main process to start session and show overlay
		if (window.ipcRenderer) {
			window.ipcRenderer.send("start-session");
		}
	};

	const stopSession = () => {
		setSessionActive(false);
		setSessionStartTime(null);
		setSessionDuration("00:00:00");
		
		// Send IPC event to main process to stop session
		if (window.ipcRenderer) {
			window.ipcRenderer.send("stop-session");
		}
	};

	const openDebugPage = () => {
		navigate("/debug");
	};

	const getActivityIcon = (type: string) => {
		const icons: Record<string, string> = {
			focus: "🎯",
			productive: "💻",
			distracted: "📱",
			learning: "📚",
			other: "⚡",
		};
		return icons[type] || "⚡";
	};

	const getActivityGradient = (type: string) => {
		const gradients: Record<string, string> = {
			focus: "var(--primary-gradient)",
			productive: "var(--success-gradient)",
			distracted: "var(--danger-gradient)",
			learning: "var(--warning-gradient)",
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
			{/* Sidebar */}
			<div className="sidebar">
				<div className="logo">
					<div className="logo-icon">🧠</div>
					<div className="logo-text">FocusAI</div>
				</div>

				<nav className="nav">
					<div className="nav-section">
						<div className="nav-title">Main</div>
						<div className="nav-item active">
							<div className="nav-icon">📊</div>
							<div className="nav-label">Dashboard</div>
						</div>
						<div className="nav-item" onClick={() => navigate("/garden")}>
							<div className="nav-icon">🌱</div>
							<div className="nav-label">Garden</div>
						</div>
						<div className="nav-item">
							<div className="nav-icon">📈</div>
							<div className="nav-label">Analytics</div>
						</div>
						<div className="nav-item">
							<div className="nav-icon">🏆</div>
							<div className="nav-label">Leaderboard</div>
						</div>
					</div>

					<div className="nav-section">
						<div className="nav-title">Tools</div>
						<div className="nav-item" onClick={() => navigate("/debug")}>
							<div className="nav-icon">🔧</div>
							<div className="nav-label">Debug Console</div>
						</div>
						<div className="nav-item">
							<div className="nav-icon">⚙️</div>
							<div className="nav-label">Settings</div>
						</div>
						<div className="nav-item">
							<div className="nav-icon">📋</div>
							<div className="nav-label">Reports</div>
						</div>
					</div>

					<div className="nav-section">
						<div className="nav-title">Insights</div>
						<div className="nav-item">
							<div className="nav-icon">🎯</div>
							<div className="nav-label">Goals</div>
						</div>
						<div className="nav-item">
							<div className="nav-icon">📊</div>
							<div className="nav-label">Statistics</div>
						</div>
						<div className="nav-item">
							<div className="nav-icon">🔍</div>
							<div className="nav-label">Insights</div>
						</div>
					</div>
				</nav>
			</div>

			{/* Main Content */}
			<div className="main-content">
				<div className="dashboard-header">
					<div>
						<h1 className="dashboard-title">Productivity Dashboard</h1>
						<p className="dashboard-subtitle">Track your focus and grow your digital garden</p>
					</div>
					{onSignOut && (
						<button onClick={onSignOut}>
							Sign Out
						</button>
					)}
				</div>

				{/* Main Dashboard Sections */}
				<div className="dashboard-sections">
					{/* Focus Metrics Section */}
					<div className="section">
						<div className="section-header">
							<h2 className="section-title">Focus Metrics</h2>
							<div className="section-subtitle">Real-time productivity tracking</div>
						</div>
						<div className="metrics-grid">
							<div className="metric-card primary">
								<div className="metric-header">
									<div className="metric-icon">⚡</div>
									<div className="metric-label">Current Focus</div>
								</div>
								<div className="metric-value">{instantaneousScore.toFixed(0)}</div>
								<div className="metric-description">{instantaneousContext}</div>
							</div>
							<div className="metric-card secondary">
								<div className="metric-header">
									<div className="metric-icon">📈</div>
									<div className="metric-label">Session Total</div>
								</div>
								<div className="metric-value">{cumulativeScore.toFixed(0)}</div>
								<div className="metric-description">{cumulativeContext}</div>
							</div>
							<div className="metric-card accent">
								<div className="metric-header">
									<div className="metric-icon">⏱️</div>
									<div className="metric-label">Session Time</div>
								</div>
								<div className="metric-value">{sessionDuration}</div>
								<div className="metric-description">{sessionActive ? "Active" : "Inactive"}</div>
							</div>
						</div>
					</div>

					{/* Activity & Insights Section */}
					<div className="section">
						<div className="section-header">
							<h2 className="section-title">Activity & Insights</h2>
							<div className="section-subtitle">Recent activity and AI-powered insights</div>
						</div>
						<div className="insights-grid">
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
						</div>
					</div>

					{/* Session Control Section */}
					<div className="section">
						<div className="section-header">
							<h2 className="section-title">Session Control</h2>
							<div className="section-subtitle">Manage your focus sessions</div>
						</div>
						<div className="control-panel">
							<div className="control-card">
								<div className="control-header">
									<div className="control-icon">🎯</div>
									<div className="control-title">Focus Session</div>
								</div>
								<div className="control-content">
									{!sessionActive ? (
										<button className="control-button primary" onClick={startSession}>
											Start Focus Session
										</button>
									) : (
										<>
											<div className="session-info">
												<div className="session-stat">
													<span className="stat-label">Duration:</span>
													<span className="stat-value">{sessionDuration}</span>
												</div>
												<div className="session-stat">
													<span className="stat-label">Status:</span>
													<span className="stat-value active">Active</span>
												</div>
											</div>
											<button className="control-button danger" onClick={stopSession}>
												Stop Session
											</button>
										</>
									)}
								</div>
							</div>
							<div className="control-card">
								<div className="control-header">
									<div className="control-icon">🔧</div>
									<div className="control-title">Tools</div>
								</div>
								<div className="control-content">
									<button className="control-button secondary" onClick={openDebugPage}>
										Debug Console
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;