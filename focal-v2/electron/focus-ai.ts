import type { WindowSummary } from "./focus-tracker";

interface BaseWeights {
	keystrokeActivity: number;
	focusConsistency: number;
	activeTimeRatio: number;
	switchingPattern: number;
}

interface UserPatterns {
	productiveApps: Set<string>;
	distractingApps: Set<string>;
	learningApps: Set<string>;
	preferredSwitchingRate: number;
	averageSessionLength: number;
}

interface AIContext {
	multiplier: number;
	insight: string;
	context: string;
	confidence: number;
}

interface FocusScore {
	instantaneous: number;
	cumulative: number;
	baseScore: number;
	aiMultiplier: number;
	aiInsight: string;
	context: string;
	timestamp: number;
}

export class FocusAI {
	baseWeights: BaseWeights;
	userPatterns: UserPatterns;
	scoreHistory: number[];
	cumulativeScore: number;
	maxPointsPerHour: number;
	maxPointsPerWindow: number;
	maxTotalPoints: number;

	constructor() {
		console.log("🎯 FocusAI: Initializing with RULE-BASED analysis only");

		// Scoring weights for base calculation
		this.baseWeights = {
			keystrokeActivity: 0.25,
			focusConsistency: 0.3,
			activeTimeRatio: 0.25,
			switchingPattern: 0.2,
		};

		// User learning data
		this.userPatterns = {
			productiveApps: new Set(["Visual Studio Code", "Terminal", "Chrome", "Slack", "Notion", "Cursor"]),
			distractingApps: new Set(["Twitter", "Instagram", "Facebook", "TikTok"]),
			learningApps: new Set(["YouTube", "Coursera", "Khan Academy"]),
			preferredSwitchingRate: 2.5, // switches per minute
			averageSessionLength: 25, // minutes
		};

		// Score history for cumulative tracking
		this.scoreHistory = [];
		this.cumulativeScore = 0; // Starting score

		// New scaling system: 1000 points for 10 hours of peak performance
		this.maxPointsPerHour = 100; // Peak performance = 100 points/hour
		this.maxPointsPerWindow = 5; // 3-minute window at peak = 5 points (100/20 windows)
		this.maxTotalPoints = 1000; // 10 hours × 100 points/hour
	}

	async calculateHybridScore(activityWindow: WindowSummary): Promise<FocusScore> {
		try {
			console.log("🎯 FocusAI: Using RULE-BASED analysis (AI disabled)");

			// Step 1: Calculate base productivity score
			const baseScore = this.calculateBaseScore(activityWindow);
			console.log("📊 Base score calculated:", baseScore);

			// Step 2: Use rule-based context analysis (skip AI for now)
			const aiContext = this.getRuleBasedContext(activityWindow);
			console.log("🧠 Rule-based context:", aiContext);

			// Step 3: Apply multiplier to base score
			const finalScore = this.applyAIMultiplier(baseScore, aiContext);
			console.log("✨ Final score:", finalScore);

			// Step 4: Update cumulative metrics
			this.updateCumulativeScore(finalScore);

			const result: FocusScore = {
				instantaneous: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
				cumulative: Math.round(this.cumulativeScore * 100) / 100,
				baseScore: Math.round(baseScore * 100) / 100,
				aiMultiplier: aiContext.multiplier,
				aiInsight: aiContext.insight,
				context: aiContext.context,
				timestamp: Date.now(),
			};

			console.log("📈 FocusAI result:", result);
			return result;
		} catch (error) {
			console.error("Error calculating hybrid score:", error);
			return this.getFallbackScore(activityWindow);
		}
	}

	calculateBaseScore(activityWindow: WindowSummary): number {
		// Calculate raw productivity score (0-100 scale)
		let rawScore = 50; // Start with neutral score

		// Keystroke activity (25% weight)
		const keystrokeScore = this.analyzeKeystrokeActivity(activityWindow);
		rawScore += (keystrokeScore - 50) * this.baseWeights.keystrokeActivity;

		// Focus consistency (30% weight)
		const focusScore = this.analyzeFocusConsistency(activityWindow);
		rawScore += (focusScore - 50) * this.baseWeights.focusConsistency;

		// Active time ratio (25% weight)
		const activeTimeScore = this.analyzeActiveTime(activityWindow);
		rawScore += (activeTimeScore - 50) * this.baseWeights.activeTimeRatio;

		// Switching pattern (20% weight)
		const switchingScore = this.analyzeSwitchingPattern(activityWindow);
		rawScore += (switchingScore - 50) * this.baseWeights.switchingPattern;

		// Clamp to 0-100 range
		rawScore = Math.max(0, Math.min(100, rawScore));

		// Convert to new scaling system: 0-100% becomes 0-5 points per window
		const scaledScore = (rawScore / 100) * this.maxPointsPerWindow;

		return scaledScore;
	}

	analyzeKeystrokeActivity(activityWindow: WindowSummary): number {
		const keystrokeRate = activityWindow.keystrokeRate || 0;

		// Optimal keystroke rate depends on app type
		if (keystrokeRate < 5) return 20; // Very low activity
		if (keystrokeRate <= 30) return 80; // Good typing activity
		if (keystrokeRate <= 60) return 70; // High activity
		if (keystrokeRate <= 100) return 50; // Very high activity
		return 30; // Excessive activity
	}

	analyzeFocusConsistency(activityWindow: WindowSummary): number {
		const pattern = activityWindow.context?.switchingPattern || "stable";

		switch (pattern) {
			case "focused":
				return 90;
			case "stable":
				return 75;
			case "multitasking":
				return 60;
			case "distracted":
				return 25;
			default:
				return 50;
		}
	}

	analyzeActiveTime(activityWindow: WindowSummary): number {
		const focusRatio = activityWindow.focusRatio || 0;

		if (focusRatio > 0.9) return 95; // Excellent focus
		if (focusRatio > 0.8) return 85; // Good focus
		if (focusRatio > 0.6) return 70; // Moderate focus
		if (focusRatio > 0.4) return 50; // Low focus
		if (focusRatio > 0.2) return 30; // Very low focus
		return 10; // Minimal focus
	}

	analyzeSwitchingPattern(activityWindow: WindowSummary): number {
		const switchRate = activityWindow.switchRate || 0;
		const userPreferred = this.userPatterns.preferredSwitchingRate;

		// Score based on deviation from user's preferred pattern
		const deviation = Math.abs(switchRate - userPreferred);

		if (deviation < 0.5) return 90; // Very close to preferred
		if (deviation < 1.0) return 75; // Close to preferred
		if (deviation < 2.0) return 60; // Moderate deviation
		if (deviation < 3.0) return 40; // High deviation
		return 20; // Very high deviation
	}

	getRuleBasedContext(activityWindow: WindowSummary): AIContext {
		const app = activityWindow.activeApp || "";
		const title = activityWindow.windowTitle || "";

		// Rule-based context analysis
		let multiplier = 1.0;
		let insight = "Standard productivity tracking";
		let context = "Working";

		// App-based analysis
		if (this.userPatterns.productiveApps.has(app)) {
			multiplier = 1.1;
			insight = "Using productive application";
			context = "Focused work";
		} else if (this.userPatterns.distractingApps.has(app)) {
			multiplier = 0.7;
			insight = "Using potentially distracting app";
			context = "Social media or entertainment";
		} else if (this.userPatterns.learningApps.has(app)) {
			multiplier = 1.0;
			insight = "Educational content consumption";
			context = "Learning";
		}

		// Title-based analysis
		if (title) {
			const titleLower = title.toLowerCase();
			if (titleLower.includes("tutorial") || titleLower.includes("course")) {
				multiplier = 1.2;
				insight = "Learning from educational content";
				context = "Educational consumption";
			} else if (titleLower.includes("game") || titleLower.includes("entertainment")) {
				multiplier = 0.6;
				insight = "Entertainment activity";
				context = "Recreation";
			}
		}

		return {
			multiplier: Math.max(0.7, Math.min(1.3, multiplier)),
			insight: insight,
			context: context,
			confidence: 0.6,
		};
	}

	applyAIMultiplier(baseScore: number, aiContext: AIContext): number {
		// Apply AI multiplier with smoothing to avoid extreme changes
		const multiplier = aiContext.multiplier;
		const adjustedScore = baseScore * multiplier;

		// Smooth the adjustment to prevent jarring changes
		const smoothingFactor = 0.3;
		const smoothedScore = baseScore + (adjustedScore - baseScore) * smoothingFactor;

		// Ensure score doesn't exceed maximum points per window
		return Math.max(0, Math.min(this.maxPointsPerWindow, smoothedScore));
	}

	updateCumulativeScore(instantaneousScore: number) {
		this.scoreHistory.push(instantaneousScore);

		// Keep only last 200 scores (10 hours of data: 200 windows × 3 minutes)
		if (this.scoreHistory.length > 200) {
			this.scoreHistory.shift();
		}

		// Calculate total cumulative score (sum of all points earned)
		this.cumulativeScore = this.scoreHistory.reduce((sum, score) => sum + score, 0);

		// Ensure cumulative score doesn't exceed maximum
		this.cumulativeScore = Math.min(this.maxTotalPoints, this.cumulativeScore);
	}

	getFallbackScore(activityWindow: WindowSummary): FocusScore {
		const baseScore = this.calculateBaseScore(activityWindow);
		return {
			instantaneous: Math.round(baseScore * 100) / 100, // Round to 2 decimal places
			cumulative: Math.round(this.cumulativeScore * 100) / 100,
			baseScore: Math.round(baseScore * 100) / 100,
			aiMultiplier: 1.0,
			aiInsight: "Using rule-based analysis",
			context: "Standard productivity tracking",
			timestamp: Date.now(),
		};
	}

	getGardenGrowthLevel(): string {
		// Map cumulative score to garden growth stages (0-1000 scale)
		if (this.cumulativeScore < 100) return "soil"; // 0-100 points
		if (this.cumulativeScore < 300) return "seed"; // 100-300 points
		if (this.cumulativeScore < 500) return "sprout"; // 300-500 points
		if (this.cumulativeScore < 750) return "plant"; // 500-750 points
		return "bloom"; // 750-1000 points
	}
}

export type { AIContext, FocusScore };
