import { useCallback, useEffect, useRef, useState } from "react";
import { activityMonitor } from "../services/activityMonitor";
import { AIContextService } from "../services/aiContextService";
import { ScoringEngine } from "../services/scoringEngine";
import { StorageService } from "../services/storageService";
import { ActivitySnapshot, ActivityWindow, AISummary, AppState, FocusScore, GardenStage, UserGoal } from "../types";

const SNAPSHOT_INTERVAL = 5000; // 5 seconds
const WINDOW_DURATION = 180000; // 3 minutes
const VISUAL_UPDATE_INTERVAL = 600000; // 10 minutes
const SUMMARY_INTERVAL = 1800000; // 30 minutes

export function useFocusAI() {
	const [appState, setAppState] = useState<AppState>({
		currentGoal: StorageService.getActiveGoal(),
		focusScore: {
			instantaneous: 0,
			cumulative: 0,
			trend: "stable",
		},
		gardenState: StorageService.getGarden(),
		currentWindow: null,
		recentSummary: StorageService.getSummaries(1)[0] || null,
		isTracking: false,
		latestOcrText: "",
		latestOcrConfidence: 0,
	});

	const snapshotsRef = useRef<ActivitySnapshot[]>([]);
	const windowStartRef = useRef<number>(Date.now());
	const lastVisualUpdateRef = useRef<number>(Date.now());
	const lastSummaryRef = useRef<number>(Date.now());
	const aiServiceRef = useRef<AIContextService>(new AIContextService(StorageService.getApiKey() || undefined));
	const previousInstantaneousRef = useRef<number>(0);

	// Start tracking
	const startTracking = useCallback(() => {
		activityMonitor.start();
		setAppState((prev) => ({ ...prev, isTracking: true }));
		windowStartRef.current = Date.now();
		snapshotsRef.current = [];
	}, []);

	// Stop tracking
	const stopTracking = useCallback(() => {
		activityMonitor.stop();
		setAppState((prev) => ({ ...prev, isTracking: false }));
	}, []);

	// Save goal
	const saveGoal = useCallback((goal: UserGoal) => {
		// Deactivate all other goals
		const goals = StorageService.getGoals();
		goals.forEach((g) => {
			if (g.id !== goal.id) {
				g.active = false;
				StorageService.saveGoal(g);
			}
		});

		StorageService.saveGoal(goal);
		setAppState((prev) => ({ ...prev, currentGoal: goal }));
	}, []);

	// Set API key
	const setApiKey = useCallback((key: string) => {
		StorageService.setApiKey(key);
		aiServiceRef.current.setApiKey(key);
	}, []);

	// Process activity snapshot
	const processSnapshot = useCallback(async () => {
		if (!appState.isTracking) return;

		const snapshot = await activityMonitor.getSnapshot();
		snapshotsRef.current.push(snapshot);

		// Update latest OCR preview in app state for UI
		setAppState((prev) => ({
			...prev,
			latestOcrText: snapshot.ocrText || "",
			latestOcrConfidence: snapshot.ocrConfidence || 0,
		}));

		// Check if window is complete (3 minutes)
		const now = Date.now();
		const windowDuration = now - windowStartRef.current;

		if (windowDuration >= WINDOW_DURATION) {
			await processWindow();
		}
	}, [appState.isTracking]);

	// Process complete 3-minute window
	const processWindow = useCallback(async () => {
		if (snapshotsRef.current.length === 0) return;

		const now = Date.now();
		const metrics = ScoringEngine.aggregateWindow(snapshotsRef.current);

		const window: ActivityWindow = {
			startTime: windowStartRef.current,
			endTime: now,
			snapshots: snapshotsRef.current,
			baseScore: 0,
			aiMultiplier: 1.0,
			finalScore: 0,
			...metrics,
		};

		console.log("🔄 Processing 3-minute window:");
		console.log("  📊 Aggregated Metrics:", {
			totalSnapshots: snapshotsRef.current.length,
			appSwitches: metrics.switchCount,
			totalKeystrokes: metrics.totalKeystrokes,
			activeTime: `${Math.round(metrics.activeTime / 1000)}s`,
			idleTime: `${Math.round(metrics.idleTime / 1000)}s`,
		});

		// Calculate base score
		window.baseScore = ScoringEngine.calculateBaseScore(window);
		console.log("  🎯 Base Score:", window.baseScore);

		// Get AI refinement
		try {
			const pattern = ScoringEngine.generatePattern(window);
			const aiResponse = await aiServiceRef.current.refineScore({
				goal: appState.currentGoal?.title || "",
				appName: window.snapshots[window.snapshots.length - 1]?.appName || "",
				windowTitle: window.snapshots[window.snapshots.length - 1]?.windowTitle || "",
				switchCount: window.switchCount,
				baseScore: window.baseScore,
				recentPattern: pattern,
			});

			window.aiMultiplier = aiResponse.multiplier;
		} catch (error) {
			console.error("AI refinement error:", error);
			window.aiMultiplier = 1.0;
		}

		// Calculate final score
		window.finalScore = Math.round(window.baseScore * window.aiMultiplier);

		console.log("  🤖 AI Multiplier:", window.aiMultiplier);
		console.log("  ✨ Final Score:", window.finalScore);
		console.log("─────────────────────────────────────");

		// Save window
		StorageService.saveWindow(window);

		// Update focus scores
		updateFocusScores(window);

		// Update garden if needed
		if (now - lastVisualUpdateRef.current >= VISUAL_UPDATE_INTERVAL) {
			updateGarden(window.finalScore);
			lastVisualUpdateRef.current = now;
		}

		// Generate AI summary if needed
		if (now - lastSummaryRef.current >= SUMMARY_INTERVAL) {
			await generateAISummary();
			lastSummaryRef.current = now;
		}

		// Reset for next window
		snapshotsRef.current = [];
		windowStartRef.current = now;
	}, [appState.currentGoal]);

	// Update focus scores
	const updateFocusScores = useCallback((window: ActivityWindow) => {
		const recentWindows = StorageService.getWindows(10);

		// Instantaneous score is just the latest window
		const instantaneous = window.finalScore;

		// Cumulative is weighted average with decay
		let cumulative = 0;
		if (recentWindows.length > 0) {
			const weights = recentWindows.map((_, i) => Math.pow(0.95, recentWindows.length - i - 1));
			const weightSum = weights.reduce((a, b) => a + b, 0);

			cumulative = recentWindows.reduce((acc, w, i) => acc + w.finalScore * weights[i], 0) / weightSum;
		} else {
			cumulative = instantaneous;
		}

		// Determine trend
		let trend: "rising" | "falling" | "stable" = "stable";
		const diff = instantaneous - previousInstantaneousRef.current;
		if (Math.abs(diff) > 5) {
			trend = diff > 0 ? "rising" : "falling";
		}
		previousInstantaneousRef.current = instantaneous;

		const newScore: FocusScore = {
			instantaneous,
			cumulative,
			trend,
		};

		setAppState((prev) => ({
			...prev,
			focusScore: newScore,
			currentWindow: window,
		}));
	}, []);

	// Update garden state
	const updateGarden = useCallback((score: number) => {
		const garden = StorageService.getGarden();

		// Add growth based on score
		const growthPoints = Math.max(0, Math.round(score / 10));
		garden.totalGrowth += growthPoints;
		garden.lastWatered = Date.now();

		// Update stage and progress
		const stages: GardenStage[] = ["soil", "seed", "sprout", "seedling", "growing", "blooming", "flourishing"];
		const growthPerStage = 100; // Growth points needed per stage

		const stageIndex = Math.min(Math.floor(garden.totalGrowth / growthPerStage), stages.length - 1);

		garden.stage = stages[stageIndex];
		garden.progress = garden.totalGrowth % growthPerStage;

		StorageService.saveGarden(garden);
		setAppState((prev) => ({ ...prev, gardenState: garden }));
	}, []);

	// Generate AI summary
	const generateAISummary = useCallback(async () => {
		const recentWindows = StorageService.getWindows(10); // Last 30 minutes
		if (recentWindows.length === 0) return;

		const averageScore = recentWindows.reduce((acc, w) => acc + w.finalScore, 0) / recentWindows.length;

		// Get top activities
		const appCounts: Record<string, number> = {};
		recentWindows.forEach((w) => {
			w.snapshots.forEach((s) => {
				appCounts[s.appName] = (appCounts[s.appName] || 0) + 1;
			});
		});

		const topActivities = Object.entries(appCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3)
			.map(([app]) => app);

		try {
			const aiResult = await aiServiceRef.current.generateSummary(recentWindows, averageScore, topActivities);

			const summary: AISummary = {
				timestamp: Date.now(),
				periodMinutes: 30,
				averageScore,
				topActivities,
				feedback: aiResult.feedback,
				suggestions: aiResult.suggestions,
			};

			StorageService.saveSummary(summary);
			setAppState((prev) => ({ ...prev, recentSummary: summary }));
		} catch (error) {
			console.error("Error generating AI summary:", error);
		}
	}, []);

	// Set up intervals
	useEffect(() => {
		if (!appState.isTracking) return;

		const snapshotInterval = setInterval(processSnapshot, SNAPSHOT_INTERVAL);

		return () => {
			clearInterval(snapshotInterval);
		};
	}, [appState.isTracking, processSnapshot]);

	// Auto-start tracking on mount
	useEffect(() => {
		startTracking();

		// Load API key if exists
		const apiKey = StorageService.getApiKey();
		if (apiKey) {
			aiServiceRef.current.setApiKey(apiKey);
		}

		return () => {
			stopTracking();
		};
	}, [startTracking, stopTracking]);

	return {
		appState,
		startTracking,
		stopTracking,
		saveGoal,
		setApiKey,
	};
}
