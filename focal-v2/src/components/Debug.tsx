import { useEffect, useState } from "react";
import "./Debug.css";

interface DebugData {
	instantaneous: number;
	cumulative: number;
	aiInsight: string;
	context: string;
	activeApp: string | null;
	windowTitle: string | null;
	url: string | null;
	switchRate: number;
	keystrokeRate: number;
	baseScore?: number;
	aiMultiplier?: number;
	focusRatio?: number;
	timestamp: number;
}

const Debug = () => {
	const [debugData, setDebugData] = useState<DebugData | null>(null);
	const [updateCount, setUpdateCount] = useState<number>(0);
	const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

	useEffect(() => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		ipcRenderer.on("focus-update", (_event: any, data: DebugData) => {
			setDebugData(data);
			setUpdateCount((prev) => prev + 1);
		});

		return () => {
			ipcRenderer.removeAllListeners("focus-update");
		};
	}, []);

	useEffect(() => {
		if (!autoRefresh) return;

		const interval = setInterval(() => {
			const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
			if (!ipcRenderer) return;

			ipcRenderer.send("request-debug-data");
		}, 2000); // Request update every 2 seconds

		return () => clearInterval(interval);
	}, [autoRefresh]);

	const formatValue = (value: any): string => {
		if (value === null || value === undefined) return "null";
		if (typeof value === "number") return value.toFixed(2);
		if (typeof value === "string") return value;
		if (typeof value === "boolean") return value.toString();
		return JSON.stringify(value);
	};

	const getValueClass = (value: any): string => {
		if (typeof value === "number") return "debug-value number";
		if (typeof value === "string") return "debug-value string";
		if (typeof value === "boolean") return "debug-value boolean";
		return "debug-value";
	};

	return (
		<div className="debug-container">
			<div className="debug-sidebar">
				<div className="debug-header">
					<h1 className="debug-title">Debug Console</h1>
					<p className="debug-subtitle">Real-time FocusAI Metrics</p>
				</div>

				<div className="debug-section">
					<div className="debug-section-title">Status</div>
					<div className="debug-item">
						<span className="debug-label">Updates Received</span>
						<span className="debug-value number">{updateCount}</span>
					</div>
					<div className="debug-item">
						<span className="debug-label">Auto Refresh</span>
						<span className="debug-value boolean">{autoRefresh ? "On" : "Off"}</span>
					</div>
					<div className="debug-item">
						<span className="debug-label">Last Update</span>
						<span className="debug-value string">
							{debugData ? new Date(debugData.timestamp).toLocaleTimeString() : "--"}
						</span>
					</div>
				</div>

				<div className="debug-section">
					<div className="debug-section-title">Scores</div>
					<div className="debug-item">
						<span className="debug-label">Instantaneous</span>
						<span className="debug-value number">
							{debugData ? debugData.instantaneous.toFixed(2) : "--"}
						</span>
					</div>
					<div className="debug-item">
						<span className="debug-label">Cumulative</span>
						<span className="debug-value number">{debugData ? debugData.cumulative.toFixed(2) : "--"}</span>
					</div>
					{debugData?.baseScore !== undefined && (
						<div className="debug-item">
							<span className="debug-label">Base Score</span>
							<span className="debug-value number">{debugData.baseScore.toFixed(2)}</span>
						</div>
					)}
					{debugData?.aiMultiplier !== undefined && (
						<div className="debug-item">
							<span className="debug-label">AI Multiplier</span>
							<span className="debug-value number">{debugData.aiMultiplier.toFixed(2)}</span>
						</div>
					)}
				</div>

				<div className="debug-section">
					<div className="debug-section-title">Controls</div>
					<button className="debug-btn debug-btn-primary" onClick={() => setAutoRefresh(!autoRefresh)}>
						{autoRefresh ? "Pause" : "Resume"} Auto-Refresh
					</button>
					<button
						className="debug-btn debug-btn-secondary"
						onClick={() => {
							const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
							if (!ipcRenderer) return;
							ipcRenderer.send("request-debug-data");
						}}
					>
						Refresh Now
					</button>
				</div>
			</div>

			<div className="debug-main">
				<div className="debug-tabs">
					<div className="debug-tab active">Live Data</div>
					<div className="debug-tab">Activity Metrics</div>
					<div className="debug-tab">AI Context</div>
				</div>

				<div className="debug-content">
					{!debugData ? (
						<div className="debug-placeholder">
							<div className="debug-placeholder-icon">🔍</div>
							<div className="debug-placeholder-text">Waiting for debug data...</div>
							<div className="debug-placeholder-hint">Start a focus session to see live metrics</div>
						</div>
					) : (
						<div className="debug-data-grid">
							<div className="debug-card">
								<div className="debug-card-title">Current Activity</div>
								<div className="debug-card-content">
									<div className="debug-item">
										<span className="debug-label">Active App</span>
										<span className={getValueClass(debugData.activeApp)}>
											{formatValue(debugData.activeApp)}
										</span>
									</div>
									<div className="debug-item">
										<span className="debug-label">Window Title</span>
										<span className={getValueClass(debugData.windowTitle)}>
											{formatValue(debugData.windowTitle)}
										</span>
									</div>
									<div className="debug-item">
										<span className="debug-label">URL</span>
										<span className={getValueClass(debugData.url)}>
											{formatValue(debugData.url)}
										</span>
									</div>
								</div>
							</div>

							<div className="debug-card">
								<div className="debug-card-title">Activity Metrics</div>
								<div className="debug-card-content">
									<div className="debug-item">
										<span className="debug-label">Keystroke Rate</span>
										<span className={getValueClass(debugData.keystrokeRate)}>
											{formatValue(debugData.keystrokeRate)} / min
										</span>
									</div>
									<div className="debug-item">
										<span className="debug-label">Switch Rate</span>
										<span className={getValueClass(debugData.switchRate)}>
											{formatValue(debugData.switchRate)} / min
										</span>
									</div>
									{debugData.focusRatio !== undefined && (
										<div className="debug-item">
											<span className="debug-label">Focus Ratio</span>
											<span className={getValueClass(debugData.focusRatio)}>
												{(debugData.focusRatio * 100).toFixed(1)}%
											</span>
										</div>
									)}
								</div>
							</div>

							<div className="debug-card">
								<div className="debug-card-title">AI Analysis</div>
								<div className="debug-card-content">
									<div className="debug-item">
										<span className="debug-label">Context</span>
										<span className={getValueClass(debugData.context)}>
											{formatValue(debugData.context)}
										</span>
									</div>
									<div className="debug-item">
										<span className="debug-label">AI Insight</span>
										<span className={getValueClass(debugData.aiInsight)}>
											{formatValue(debugData.aiInsight)}
										</span>
									</div>
								</div>
							</div>

							<div className="debug-card">
								<div className="debug-card-title">Score Breakdown</div>
								<div className="debug-card-content">
									<div className="debug-item">
										<span className="debug-label">Instantaneous</span>
										<span className={getValueClass(debugData.instantaneous)}>
											{formatValue(debugData.instantaneous)}
										</span>
									</div>
									<div className="debug-item">
										<span className="debug-label">Cumulative</span>
										<span className={getValueClass(debugData.cumulative)}>
											{formatValue(debugData.cumulative)}
										</span>
									</div>
									{debugData.baseScore !== undefined && (
										<div className="debug-item">
											<span className="debug-label">Base Score</span>
											<span className={getValueClass(debugData.baseScore)}>
												{formatValue(debugData.baseScore)}
											</span>
										</div>
									)}
									{debugData.aiMultiplier !== undefined && (
										<div className="debug-item">
											<span className="debug-label">AI Multiplier</span>
											<span className={getValueClass(debugData.aiMultiplier)}>
												{formatValue(debugData.aiMultiplier)}x
											</span>
										</div>
									)}
								</div>
							</div>

							<div className="debug-card debug-card-full">
								<div className="debug-card-title">Raw Data (JSON)</div>
								<pre className="debug-json">{JSON.stringify(debugData, null, 2)}</pre>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Debug;
