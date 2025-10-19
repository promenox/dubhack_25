// Storage Service: Manages data persistence

import { ActivityWindow, AISummary, GardenState, UserGoal } from "../types";

export class StorageService {
	private static readonly STORAGE_KEYS = {
		WINDOWS: "focusai_windows",
		GOALS: "focusai_goals",
		GARDEN: "focusai_garden",
		SUMMARIES: "focusai_summaries",
		SETTINGS: "focusai_settings",
	};

	/**
	 * Save activity window
	 */
	static saveWindow(window: ActivityWindow): void {
		const windows = this.getWindows();
		windows.push(window);

		// Keep only last 24 hours of windows
		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
		const filtered = windows.filter((w) => w.endTime > oneDayAgo);

		localStorage.setItem(this.STORAGE_KEYS.WINDOWS, JSON.stringify(filtered));
	}

	/**
	 * Get recent activity windows
	 */
	static getWindows(limit?: number): ActivityWindow[] {
		const data = localStorage.getItem(this.STORAGE_KEYS.WINDOWS);
		if (!data) return [];

		const windows = JSON.parse(data) as ActivityWindow[];
		return limit ? windows.slice(-limit) : windows;
	}

	/**
	 * Save user goal
	 */
	static saveGoal(goal: UserGoal): void {
		const goals = this.getGoals();
		const index = goals.findIndex((g) => g.id === goal.id);

		if (index >= 0) {
			goals[index] = goal;
		} else {
			goals.push(goal);
		}

		localStorage.setItem(this.STORAGE_KEYS.GOALS, JSON.stringify(goals));
	}

	/**
	 * Get all goals
	 */
	static getGoals(): UserGoal[] {
		const data = localStorage.getItem(this.STORAGE_KEYS.GOALS);
		return data ? JSON.parse(data) : [];
	}

	/**
	 * Get active goal
	 */
	static getActiveGoal(): UserGoal | null {
		const goals = this.getGoals();
		return goals.find((g) => g.active) || null;
	}

	/**
	 * Save garden state
	 */
	static saveGarden(state: GardenState): void {
		localStorage.setItem(this.STORAGE_KEYS.GARDEN, JSON.stringify(state));
	}

	/**
	 * Get garden state
	 */
	static getGarden(): GardenState {
		const data = localStorage.getItem(this.STORAGE_KEYS.GARDEN);
		if (data) return JSON.parse(data);

		// Default garden state
		return {
			stage: "soil",
			progress: 0,
			totalGrowth: 0,
			lastWatered: Date.now(),
		};
	}

	/**
	 * Save AI summary
	 */
	static saveSummary(summary: AISummary): void {
		const summaries = this.getSummaries();
		summaries.push(summary);

		// Keep only last 7 days
		const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
		const filtered = summaries.filter((s) => s.timestamp > weekAgo);

		localStorage.setItem(this.STORAGE_KEYS.SUMMARIES, JSON.stringify(filtered));
	}

	/**
	 * Get recent summaries
	 */
	static getSummaries(limit?: number): AISummary[] {
		const data = localStorage.getItem(this.STORAGE_KEYS.SUMMARIES);
		if (!data) return [];

		const summaries = JSON.parse(data) as AISummary[];
		return limit ? summaries.slice(-limit) : summaries;
	}

	/**
	 * Get/Set API key
	 */
	static getApiKey(): string | null {
		const settings = this.getSettings();
		return settings.apiKey || null;
	}

	static setApiKey(key: string): void {
		const settings = this.getSettings();
		settings.apiKey = key;
		localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
	}

	private static getSettings(): any {
		const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
		return data ? JSON.parse(data) : {};
	}

	/**
	 * Clear all data (for testing/reset)
	 */
	static clearAll(): void {
		Object.values(this.STORAGE_KEYS).forEach((key) => {
			localStorage.removeItem(key);
		});
	}
}
