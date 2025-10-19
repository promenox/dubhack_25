import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FocusData } from "../types/ipc";
import "./Garden.css";

const Garden = () => {
	const navigate = useNavigate();
	const [plantEmoji, setPlantEmoji] = useState<string>("🌱");
	const [currentStage, setCurrentStage] = useState<string>("soil");
	const [instantaneousScore, setInstantaneousScore] = useState<number>(0);
	const [cumulativeScore, setCumulativeScore] = useState<number>(0);
	const [insightText, setInsightText] = useState<string>("Growing your focus garden...");
	const [contextBadge, setContextBadge] = useState<string>("Initializing");
	const [lastScore, setLastScore] = useState<number>(50);
	const progressCircleRef = useRef<SVGCircleElement>(null);
	const particlesRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Create particles
		if (particlesRef.current) {
			for (let i = 0; i < 8; i++) {
				const particle = document.createElement("div");
				particle.className = "garden-particle";
				particle.style.left = Math.random() * 100 + "%";
				particle.style.top = Math.random() * 100 + "%";
				particle.style.animationDelay = Math.random() * 3 + "s";
				particle.style.animationDuration = 2 + Math.random() * 2 + "s";
				particlesRef.current.appendChild(particle);
			}
		}
	}, []);

	const updateScore = (element: HTMLElement | null, newScore: number) => {
		if (!element) return;

		const currentScore = parseInt(element.textContent || "0") || 0;
		const change = newScore - currentScore;

		element.textContent = newScore.toString();

		// Add growth animation for significant changes
		if (Math.abs(change) > 5) {
			element.parentElement?.classList.add("garden-growth-animation");
			setTimeout(() => {
				element.parentElement?.classList.remove("garden-growth-animation");
			}, 500);
		}
	};

	const updatePlantStage = (cumulativeScore: number) => {
		let newStage: string;
		let emoji: string;

		if (cumulativeScore < 20) {
			newStage = "soil";
			emoji = "🪴";
		} else if (cumulativeScore < 40) {
			newStage = "seed";
			emoji = "🌱";
		} else if (cumulativeScore < 60) {
			newStage = "sprout";
			emoji = "🌿";
		} else if (cumulativeScore < 80) {
			newStage = "plant";
			emoji = "🌳";
		} else {
			newStage = "bloom";
			emoji = "🌸";
		}

		if (newStage !== currentStage) {
			setPlantEmoji(emoji);
			setCurrentStage(newStage);
		}
	};

	const updateProgressRing = (score: number) => {
		if (!progressCircleRef.current) return;

		const circumference = 2 * Math.PI * 100;
		const offset = circumference - (score / 100) * circumference;
		progressCircleRef.current.style.strokeDashoffset = offset.toString();
	};

	const showScoreChange = (change: number) => {
		if (Math.abs(change) < 2) return; // Only show significant changes

		const scoreChange = document.createElement("div");
		scoreChange.className = `garden-score-change ${change > 0 ? "garden-score-positive" : "garden-score-negative"}`;
		scoreChange.textContent = `${change > 0 ? "+" : ""}${change}`;

		// Position near the plant
		scoreChange.style.left = "50%";
		scoreChange.style.top = "50%";
		scoreChange.style.transform = "translateX(-50%)";

		const plantElement = document.querySelector(".garden-plant");
		if (plantElement && plantElement.parentElement) {
			plantElement.parentElement.appendChild(scoreChange);

			setTimeout(() => {
				scoreChange.remove();
			}, 2000);
		}
	};

	const updateGarden = (data: FocusData) => {
		const { instantaneous, cumulative, aiInsight, context } = data;

		// Update scores with animation
		const instantEl = document.getElementById("garden-instantaneous-score");
		const cumulativeEl = document.getElementById("garden-cumulative-score");

		updateScore(instantEl, instantaneous);
		updateScore(cumulativeEl, cumulative);

		setInstantaneousScore(instantaneous);
		setCumulativeScore(cumulative);

		// Update plant stage based on cumulative score
		updatePlantStage(cumulative);

		// Update progress ring
		updateProgressRing(cumulative);

		// Update AI insight
		setInsightText(aiInsight || "Growing your focus...");
		setContextBadge(context || "Working");

		// Show score change animation
		showScoreChange(instantaneous - lastScore);
		setLastScore(instantaneous);
	};

	useEffect(() => {
		const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
		if (!ipcRenderer) return;

		const handleFocusUpdate = (_event: any, data: FocusData) => {
			updateGarden(data);
		};

		ipcRenderer.on("focus-update", handleFocusUpdate);

		return () => {
			ipcRenderer.removeListener("focus-update", handleFocusUpdate);
		};
	}, [lastScore]);

	return (
		<div className="garden-main-container">
			<div className="garden-activity-indicator"></div>

			<div className="garden-particles" ref={particlesRef}></div>

			<div className="garden-header">
				<button className="garden-back-btn" onClick={() => navigate("/")}>
					← Back to Dashboard
				</button>
				<div className="garden-title">FocusAI Garden</div>
				<div className="garden-subtitle">Grow your productivity</div>
			</div>

			<div className="garden-stage">
				<svg className="garden-progress-ring">
					<circle className="garden-progress-ring-circle" cx="135" cy="135" r="100"></circle>
					<circle
						ref={progressCircleRef}
						className="garden-progress-ring-progress"
						cx="135"
						cy="135"
						r="100"
					></circle>
				</svg>
				<div className={`garden-plant ${currentStage}`}>{plantEmoji}</div>
			</div>

			<div className="garden-metrics-container">
				<div className="garden-metric-card">
					<div className="garden-metric-value garden-instantaneous-score" id="garden-instantaneous-score">
						{instantaneousScore.toFixed(0)}
					</div>
					<div className="garden-metric-label">Instantaneous</div>
				</div>
				<div className="garden-metric-card">
					<div className="garden-metric-value garden-cumulative-score" id="garden-cumulative-score">
						{cumulativeScore.toFixed(0)}
					</div>
					<div className="garden-metric-label">Cumulative</div>
				</div>
			</div>

			<div className="garden-ai-insight">
				<div className="garden-insight-text">{insightText}</div>
				<div className="garden-context-badge">{contextBadge}</div>
			</div>
		</div>
	);
};

export default Garden;
