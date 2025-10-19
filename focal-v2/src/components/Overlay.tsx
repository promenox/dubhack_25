import { useCallback, useEffect, useRef, useState } from "react";
import type { OverlayData, SessionData } from "../types/ipc";
import "./Overlay.css";

const Overlay = () => {
	const [time, setTime] = useState<string>("00:00:00");
	const [title, setTitle] = useState<string>("—");
	const [url, setUrl] = useState<string>("—");
	const [keystrokeRate, setKeystrokeRate] = useState<number>(0);
	const [keystrokeCount, setKeystrokeCount] = useState<number>(0);
	const [mouseRate, setMouseRate] = useState<number>(0);
	const [startTime, setStartTime] = useState<number | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const pad = (n: number) => (n < 10 ? "0" + n : "" + n);

	const render = useCallback(() => {
		if (startTime === null) return;
		const elapsed = Date.now() - startTime;
		const totalSeconds = Math.floor(elapsed / 1000);
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		setTime(`${pad(h)}:${pad(m)}:${pad(s)}`);
	}, [startTime]);

	const start = useCallback(
		(ts?: number) => {
			const timestamp = ts || Date.now();
			setStartTime(timestamp);

			// Clear any existing timer
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}

			// Start new timer
			timerRef.current = setInterval(render, 1000);

			// Initial render
			render();
		},
		[render]
	);

	const stop = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		setStartTime(null);
		setTime("00:00:00");
		setTitle("—");
		setUrl("—");
		setKeystrokeRate(0);
		setKeystrokeCount(0);
		setMouseRate(0);
	}, []);

	// Update timer display when startTime changes
	useEffect(() => {
		render();
	}, [render]);

	// Setup IPC listeners once
	useEffect(() => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		const handleSessionStarted = (_e: any, payload: SessionData) => {
			start(payload && payload.startTime);
		};

		const handleSessionStopped = () => {
			stop();
		};

		const handleFocusUpdate = (_e: any, data: OverlayData) => {
			if (data && typeof data.windowTitle === "string") {
				setTitle(data.windowTitle || "—");
			}
			if (data && typeof data.url === "string") {
				setUrl(data.url || "—");
			}
			if (data && typeof data.keystrokeRate === "number") {
				setKeystrokeRate(data.keystrokeRate);
			}
			if (data && typeof data.keystrokeCount === "number") {
				setKeystrokeCount(data.keystrokeCount);
			}
			if (data && typeof data.mouseMovementRate === "number") {
				setMouseRate(data.mouseMovementRate);
			}
		};

		ipcRenderer.on("session-started", handleSessionStarted);
		ipcRenderer.on("session-stopped", handleSessionStopped);
		ipcRenderer.on("focus-update", handleFocusUpdate);

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
			ipcRenderer.removeListener("session-started", handleSessionStarted);
			ipcRenderer.removeListener("session-stopped", handleSessionStopped);
			ipcRenderer.removeListener("focus-update", handleFocusUpdate);
		};
	}, [start, stop]);

	return (
		<div className="overlay-container">
			<div className="overlay-header">
				<div className="overlay-drag">Drag to move</div>
				<div className="overlay-time">{time}</div>
			</div>
			<div className="overlay-meta">
				<div>{title}</div>
				<div className="overlay-url">{url}</div>
			</div>
			<div className="overlay-metrics">
				<div className="overlay-metric">
					<div className="overlay-metric-label">Keys/min</div>
					<div className="overlay-metric-value">{keystrokeRate.toFixed(1)}</div>
				</div>
				<div className="overlay-metric">
					<div className="overlay-metric-label">Keys Total</div>
					<div className="overlay-metric-value">{keystrokeCount}</div>
				</div>
				<div className="overlay-metric">
					<div className="overlay-metric-label">Mouse/min</div>
					<div className="overlay-metric-value">{mouseRate.toFixed(1)}</div>
				</div>
			</div>
		</div>
	);
};

export default Overlay;
