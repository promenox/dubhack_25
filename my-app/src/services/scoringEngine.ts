// Scoring Engine: Calculates base productivity scores from activity data

import { ActivitySnapshot, ActivityWindow } from "../types";

export class ScoringEngine {
	// Weights for different metrics
	private static readonly WEIGHTS = {
		keystrokeActivity: 0.35,
		focusConsistency: 0.4,
		activeTime: 0.25,
	};

	// Thresholds
	private static readonly IDLE_THRESHOLD_MS = 60000; // 1 minute
	private static readonly HIGH_KEYSTROKE_RATE = 200; // per 3 minutes
	private static readonly HIGH_SWITCH_PENALTY = 10; // switches per 3 minutes

	/**
	 * Calculate base score for a 3-minute activity window
	 * Returns a score from 0-100
	 */
	static calculateBaseScore(window: ActivityWindow): number {
		const keystrokeScore = this.calculateKeystrokeScore(window);
		const focusScore = this.calculateFocusConsistencyScore(window);
		const activeScore = this.calculateActiveTimeScore(window);

		const baseScore =
			keystrokeScore * this.WEIGHTS.keystrokeActivity +
			focusScore * this.WEIGHTS.focusConsistency +
			activeScore * this.WEIGHTS.activeTime;

		return Math.round(Math.min(100, Math.max(0, baseScore)));
	}

	/**
	 * Keystroke activity score (0-100)
	 * More keystrokes = higher engagement
	 */
	private static calculateKeystrokeScore(window: ActivityWindow): number {
		const rate = window.totalKeystrokes / this.HIGH_KEYSTROKE_RATE;
		return Math.min(100, rate * 100);
	}

	/**
	 * Focus consistency score (0-100)
	 * Fewer app switches = better focus
	 */
	private static calculateFocusConsistencyScore(window: ActivityWindow): number {
		if (window.switchCount === 0) return 100;

		// Penalize excessive switching
		const penalty = Math.min(1, window.switchCount / this.HIGH_SWITCH_PENALTY);
		return Math.round((1 - penalty) * 100);
	}

	/**
	 * Active time score (0-100)
	 * Higher active/idle ratio = better engagement
	 */
	private static calculateActiveTimeScore(window: ActivityWindow): number {
		const totalTime = window.activeTime + window.idleTime;
		if (totalTime === 0) return 0;

		const activeRatio = window.activeTime / totalTime;
		return Math.round(activeRatio * 100);
	}

	/**
	 * Aggregate metrics from snapshots
	 */
	static aggregateWindow(snapshots: ActivitySnapshot[]): {
		switchCount: number;
		totalKeystrokes: number;
		activeTime: number;
		idleTime: number;
	} {
		let switchCount = 0;
		let totalKeystrokes = 0;
		let activeTime = 0;
		let idleTime = 0;
		let lastApp = "";

		for (let i = 0; i < snapshots.length; i++) {
			const snapshot = snapshots[i];
			totalKeystrokes += snapshot.keystrokeCount;

			// Count app switches
			if (snapshot.appName !== lastApp && lastApp !== "") {
				switchCount++;
			}
			lastApp = snapshot.appName;

			// Calculate time between snapshots (approximation)
			if (i < snapshots.length - 1) {
				const timeDiff = snapshots[i + 1].timestamp - snapshot.timestamp;
				if (snapshot.isIdle) {
					idleTime += timeDiff;
				} else {
					activeTime += timeDiff;
				}
			}
		}

		return { switchCount, totalKeystrokes, activeTime, idleTime };
	}

	/**
	 * Generate a summary pattern for AI context
	 */
	static generatePattern(window: ActivityWindow): string {
		const apps = new Set(window.snapshots.map((s) => s.appName));
		const avgKeystrokes = Math.round(window.totalKeystrokes / window.snapshots.length);

		if (window.switchCount > 8) {
			return "high_switching";
		} else if (apps.size === 1 && avgKeystrokes > 10) {
			return "deep_focus";
		} else if (window.idleTime > window.activeTime) {
			return "mostly_idle";
		} else if (avgKeystrokes < 2) {
			return "passive_viewing";
		}

		return "normal_activity";
	}
}
