import { useEffect, useRef, useState } from "react";
import type { OverlayData, SessionData } from "../types/ipc";
import "./Overlay.css";

const Overlay = () => {
	console.log("🪟 Overlay component mounted");

	const [time, setTime] = useState<string>("00:00:00");
	const [title, setTitle] = useState<string>("—");
	const [url, setUrl] = useState<string>("—");
	const [keystrokeRate, setKeystrokeRate] = useState<number>(0);
	const [keystrokeCount, setKeystrokeCount] = useState<number>(0);
	const [mouseRate, setMouseRate] = useState<number>(0);
	const [instantaneous, setInstantaneous] = useState<number>(0);
	const [cumulative, setCumulative] = useState<number>(0);
	const [aiInsight, setAiInsight] = useState<string>("—");
	const [context, setContext] = useState<string>("—");
	const [startTime, setStartTime] = useState<number | null>(null);
	const startTimeRef = useRef<number | null>(null);
	const timerRef = useRef<number | null>(null);
	const [isDragging, setIsDragging] = useState<boolean>(false);
	const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const overlayRef = useRef<HTMLDivElement>(null);

	const pad = (n: number) => (n < 10 ? "0" + n : "" + n);

	const render = () => {
		const ts = startTimeRef.current;
		if (ts === null) return;
		const elapsed = Date.now() - ts;
		const totalSeconds = Math.floor(elapsed / 1000);
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		setTime(`${pad(h)}:${pad(m)}:${pad(s)}`);
	};

	const start = (ts?: number) => {
		console.log("🚀 Overlay: Starting session with timestamp:", ts);
		const timestamp = ts || Date.now();
		setStartTime(timestamp);
		startTimeRef.current = timestamp;
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		// Use window.setInterval ID as number for refs compatibility
		timerRef.current = window.setInterval(render, 1000);
		// Render immediately so the timer shows without waiting 1s
		render();
		console.log("✅ Overlay: Session started, timer set");
	};

	const stop = () => {
		console.log("🛑 Overlay: Stopping session");
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		setStartTime(null);
		startTimeRef.current = null;
		setTime("00:00:00");
		setTitle("—");
		setUrl("—");
		setKeystrokeRate(0);
		setKeystrokeCount(0);
		setMouseRate(0);
		setInstantaneous(0);
		setCumulative(0);
		setAiInsight("—");
		setContext("—");
		console.log("✅ Overlay: Session stopped, state reset");
	};

	useEffect(() => {
		render();
	}, [startTime]);

	// Platform detection
	const isMac = navigator.platform.toLowerCase().includes("mac");
	const isWindows = navigator.platform.toLowerCase().includes("win");

	// Drag functionality
	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button !== 0) return; // Only left mouse button

		setIsDragging(true);
		const rect = overlayRef.current?.getBoundingClientRect();
		if (rect) {
			setDragOffset({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
		}

		// Disable text selection during drag
		e.preventDefault();
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!isDragging) return;

		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (ipcRenderer) {
			// Use Electron's window positioning
			const newX = e.screenX - dragOffset.x;
			const newY = e.screenY - dragOffset.y;

			ipcRenderer.send("overlay-move", { x: newX, y: newY });
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	useEffect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, dragOffset]);

	useEffect(() => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) {
			console.error("❌ Overlay: IPC Renderer not available");
			return;
		}

		console.log("✅ Overlay: Setting up IPC listeners");

		const handleSessionStarted = (_e: any, payload: SessionData) => {
			console.log("🎯 Overlay: Session started event received", payload);
			start(payload && payload.startTime);
		};

		const handleSessionStopped = () => {
			console.log("🛑 Overlay: Session stopped event received");
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
			if (data && typeof data.instantaneous === "number") {
				setInstantaneous(data.instantaneous);
			}
			if (data && typeof data.cumulative === "number") {
				setCumulative(data.cumulative);
			}
			if (data && typeof data.aiInsight === "string") {
				setAiInsight(data.aiInsight || "—");
			}
			if (data && typeof data.context === "string") {
				setContext(data.context || "—");
			}
		};

		ipcRenderer.on("session-started", handleSessionStarted);
		ipcRenderer.on("session-stopped", handleSessionStopped);
		ipcRenderer.on("focus-update", handleFocusUpdate);

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
			ipcRenderer.removeListener("session-started", handleSessionStarted);
			ipcRenderer.removeListener("session-stopped", handleSessionStopped);
			ipcRenderer.removeListener("focus-update", handleFocusUpdate);
		};
	}, []);

	// Resize handles
	const [isResizing, setIsResizing] = useState<boolean>(false);
	const resizeEdgeRef = useRef<null | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw">(null);
	const resizeStartRef = useRef<{
		mouseX: number;
		mouseY: number;
		bounds: { x: number; y: number; width: number; height: number };
	} | null>(null);

	const beginResize = async (edge: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw", e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;
		try {
			const bounds = await ipcRenderer.invoke("overlay-get-bounds");
			if (!bounds) return;
			resizeEdgeRef.current = edge;
			resizeStartRef.current = { mouseX: e.screenX, mouseY: e.screenY, bounds };
			setIsResizing(true);
		} catch (_err) {
			// best-effort
		}
	};

	useEffect(() => {
		if (!isResizing) return;
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		const onMove = (ev: MouseEvent) => {
			const edge = resizeEdgeRef.current;
			const start = resizeStartRef.current;
			if (!edge || !start) return;
			const dx = ev.screenX - start.mouseX;
			const dy = ev.screenY - start.mouseY;
			let { x, y, width, height } = start.bounds;

			if (edge.includes("e")) {
				width = start.bounds.width + dx;
			}
			if (edge.includes("s")) {
				height = start.bounds.height + dy;
			}
			if (edge.includes("w")) {
				width = start.bounds.width - dx;
				x = start.bounds.x + dx;
			}
			if (edge.includes("n")) {
				height = start.bounds.height - dy;
				y = start.bounds.y + dy;
			}
			ipcRenderer.send("overlay-resize-to", { x, y, width, height });
		};

		const onUp = () => {
			setIsResizing(false);
			resizeEdgeRef.current = null;
			resizeStartRef.current = null;
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseup", onUp);
		};

		document.addEventListener("mousemove", onMove);
		document.addEventListener("mouseup", onUp);
		return () => {
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseup", onUp);
		};
	}, [isResizing]);

	return (
		<div
			ref={overlayRef}
			className={`overlay-container ${
				isMac ? "overlay-mac" : isWindows ? "overlay-windows" : "overlay-default"
			} ${isDragging ? "overlay-dragging" : ""}`}
			onMouseDown={handleMouseDown}
			style={{ cursor: isDragging ? "grabbing" : "grab" }}
		>
			{/* Resize handles */}
			<div className="overlay-resize-handle handle-n" onMouseDown={(e) => beginResize("n", e)} />
			<div className="overlay-resize-handle handle-s" onMouseDown={(e) => beginResize("s", e)} />
			<div className="overlay-resize-handle handle-e" onMouseDown={(e) => beginResize("e", e)} />
			<div className="overlay-resize-handle handle-w" onMouseDown={(e) => beginResize("w", e)} />
			<div className="overlay-resize-handle handle-ne" onMouseDown={(e) => beginResize("ne", e)} />
			<div className="overlay-resize-handle handle-nw" onMouseDown={(e) => beginResize("nw", e)} />
			<div className="overlay-resize-handle handle-se" onMouseDown={(e) => beginResize("se", e)} />
			<div className="overlay-resize-handle handle-sw" onMouseDown={(e) => beginResize("sw", e)} />
			<div className="overlay-header">
				<div className="overlay-time">{time}</div>
			</div>
			<div className="overlay-meta">
				<div className="overlay-title">{title}</div>
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
			<div className="overlay-productivity">
				<div className="overlay-score">
					<div className="overlay-score-label">Focus Score</div>
					<div className="overlay-score-value">{instantaneous.toFixed(1)}</div>
				</div>
				<div className="overlay-score">
					<div className="overlay-score-label">Total Score</div>
					<div className="overlay-score-value">{cumulative.toFixed(0)}</div>
				</div>
			</div>
			<div className="overlay-context">
				<div className="overlay-insight">{aiInsight}</div>
				<div className="overlay-context-label">{context}</div>
			</div>
			<div className="overlay-platform-indicator">{isMac ? "🍎" : isWindows ? "🪟" : "💻"}</div>
		</div>
	);
};

export default Overlay;
