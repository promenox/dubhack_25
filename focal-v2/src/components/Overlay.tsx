import { useEffect, useState } from "react";
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
	const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

	const pad = (n: number) => (n < 10 ? "0" + n : "" + n);

	const render = () => {
		if (startTime === null) return;
		const elapsed = Date.now() - startTime;
		const totalSeconds = Math.floor(elapsed / 1000);
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		setTime(`${pad(h)}:${pad(m)}:${pad(s)}`);
	};

	const start = (ts?: number) => {
		const timestamp = ts || Date.now();
		setStartTime(timestamp);

		if (timer) clearInterval(timer);
		const newTimer = setInterval(render, 1000);
		setTimer(newTimer);
	};

	const stop = () => {
		if (timer) clearInterval(timer);
		setTimer(null);
		setStartTime(null);
		setTime("00:00:00");
		setTitle("—");
		setUrl("—");
		setKeystrokeRate(0);
		setKeystrokeCount(0);
		setMouseRate(0);
	};

	useEffect(() => {
		render();
	}, [startTime]);

	useEffect(() => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		ipcRenderer.on("session-started", (_e: any, payload: SessionData) => {
			start(payload && payload.startTime);
		});

		ipcRenderer.on("session-stopped", () => {
			stop();
		});

		ipcRenderer.on("focus-update", (_e: any, data: OverlayData) => {
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
		});

		return () => {
			if (timer) clearInterval(timer);
			ipcRenderer.removeAllListeners("session-started");
			ipcRenderer.removeAllListeners("session-stopped");
			ipcRenderer.removeAllListeners("focus-update");
		};
	}, [timer]);

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
