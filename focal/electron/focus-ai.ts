import type { WindowSummary } from "./focus-tracker";
import { ContextAnalyzer } from "./services/contextAnalyzer";
import type { ProductivityAnalysis, ScreenContext } from "./services/types";

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
	baseRatePerMinute: number;
	contextMultipliers: {
		productive: number;
		neutral: number;
		distracted: number;
		idle: number;
	};
	contextAnalyzer: ContextAnalyzer | null;

	constructor(bedrockApiKey?: string) {
		console.log("🎯 FocusAI: Initializing with LINEAR SCORING ENGINE");

		// Initialize context analyzer if API key is provided
		if (bedrockApiKey) {
			try {
				this.contextAnalyzer = new ContextAnalyzer({
					apiKey: bedrockApiKey,
					region: "us-west-2",
					model: "anthropic.claude-3-sonnet-20240229-v1:0",
				});
				console.log("🧠 Context Analyzer enabled with AWS Bedrock");
			} catch (error: any) {
				console.warn("⚠️ Context Analyzer initialization failed:", error.message);
				this.contextAnalyzer = null;
			}
		} else {
			console.log("ℹ️ Context Analyzer disabled (no API key provided)");
			this.contextAnalyzer = null;
		}

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

		// Linear scoring engine: 1.67 points per focused minute
		// 1000 points = 10 hours of peak performance (600 minutes × 1.67 = 1000 points)
		this.baseRatePerMinute = 1.67; // Base rate for focused work
		this.maxTotalPoints = 1000; // 10 hours of peak performance

		// Context multipliers
		this.contextMultipliers = {
			productive: 1.0, // +1.0 for productive activities
			neutral: 0.5, // +0.5 for neutral activities (reduced from 0.7)
			distracted: 0.1, // +0.1 for distracting activities (reduced penalty)
			idle: 0.0, // 0.0 for idle time
		};
	}

	async calculateHybridScore(activityWindow: WindowSummary): Promise<FocusScore> {
		try {
			console.log("🎯 FocusAI: Using LINEAR SCORING ENGINE");

			// Step 1: Calculate base productivity score
			const baseScore = this.calculateBaseScore(activityWindow);
			console.log("📊 Base score calculated:", baseScore);

			// Step 2: Get AI-powered context analysis or fallback to rule-based
			const aiContext = await this.getAIContext(activityWindow);
			console.log("🧠 Context analysis:", aiContext);

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

	async getAIContext(activityWindow: WindowSummary): Promise<AIContext> {
		// Try to use AI-powered context analysis if available
		if (this.contextAnalyzer && this.contextAnalyzer.isReady()) {
			try {
				// Convert activity window to screen context format
				const currentScreen: ScreenContext = {
					activeApp: activityWindow.activeApp,
					windowTitle: activityWindow.windowTitle,
					url: activityWindow.url,
					timestamp: activityWindow.timestamp,
				};

				// Get recent screens from context
				const recentScreens: ScreenContext[] = activityWindow.context.recentApps.map((app) => ({
					activeApp: app.app,
					windowTitle: app.title,
					url: app.url,
					timestamp: app.timestamp,
				}));

				// Call the context analyzer
				const analysis: ProductivityAnalysis = await this.contextAnalyzer.analyzeContext(
					currentScreen,
					recentScreens
				);

				// Convert ProductivityAnalysis to AIContext
				return {
					multiplier: analysis.weightMultiplier,
					insight: analysis.insight,
					context: `${analysis.contextRelation} - ${analysis.productivityLevel}`,
					confidence: 0.9, // High confidence when using AI
				};
			} catch (error: any) {
				console.warn("⚠️ AI context analysis failed, falling back to rules:", error.message);
				return this.getRuleBasedContext(activityWindow);
			}
		}

		// Fallback to rule-based context
		return this.getRuleBasedContext(activityWindow);
	}

	calculateBaseScore(activityWindow: WindowSummary): number {
		// Only calculate points for completed activity windows (3-5 minute batches)
		// This prevents accumulating points every few seconds
		// Note: WindowSummary doesn't have isComplete, so we check duration instead
		if (activityWindow.duration < 60000) {
			return 0; // No points for windows less than 1 minute
		}

		// Linear scoring engine: 1.67 points per focused minute
		const windowDurationMinutes = activityWindow.duration / 60000; // Convert ms to minutes

		// Apply focus ratio (how much time was actually focused vs idle)
		const focusRatio = activityWindow.focusRatio || 0;
		const focusedMinutes = windowDurationMinutes * focusRatio;

		// Base score is points for focused time
		const baseScore = this.baseRatePerMinute * focusedMinutes;

		// Adjust based on engagement level (keystrokes and mouse activity)
		const engagementLevel = this.calculateEngagementLevel(activityWindow);
		const engagementMultiplier = Math.max(0.3, Math.min(1.5, engagementLevel));

		// Final base score with engagement adjustment
		const adjustedBaseScore = baseScore * engagementMultiplier;

		return Math.max(0, adjustedBaseScore);
	}

	calculateEngagementLevel(activityWindow: WindowSummary): number {
		// Calculate engagement level based on keystrokes and mouse movements
		const keystrokeRate = activityWindow.keystrokeRate || 0;
		const mouseRate = activityWindow.mouseMovementRate || 0;

		// Optimal engagement: 20-40 keystrokes per minute, moderate mouse movement
		const keystrokeEngagement = Math.min(1.0, keystrokeRate / 30); // Normalize to 30 keystrokes/min
		const mouseEngagement = Math.min(1.0, mouseRate / 100); // Normalize to 100 mouse movements/min

		// Combine with weights: keystrokes are more important for productivity
		const engagementLevel = keystrokeEngagement * 0.7 + mouseEngagement * 0.3;

		return Math.max(0.3, engagementLevel); // Minimum 30% engagement even when idle
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
		const focusRatio = activityWindow.focusRatio || 0;

		// Determine context category and apply appropriate multiplier
		let contextCategory: keyof typeof this.contextMultipliers = "neutral";
		let multiplier = this.contextMultipliers.neutral;
		let insight = "Standard productivity tracking";
		let context = "Working";

		// Check if user is idle
		if (focusRatio < 0.1) {
			contextCategory = "idle";
			multiplier = this.contextMultipliers.idle;
			insight = "User appears to be idle";
			context = "Idle";
		}
		// App-based analysis for active periods
		else if (this.userPatterns.productiveApps.has(app)) {
			contextCategory = "productive";
			multiplier = this.contextMultipliers.productive;
			insight = "Using productive application";
			context = "Focused work";
		} else if (this.userPatterns.distractingApps.has(app)) {
			contextCategory = "distracted";
			multiplier = this.contextMultipliers.distracted;
			insight = "Using potentially distracting app";
			context = "Social media or entertainment";
		} else if (this.userPatterns.learningApps.has(app)) {
			// Learning apps can be productive or neutral depending on context
			const titleLower = title.toLowerCase();
			if (
				titleLower.includes("tutorial") ||
				titleLower.includes("course") ||
				titleLower.includes("educational")
			) {
				contextCategory = "productive";
				multiplier = this.contextMultipliers.productive;
				insight = "Learning from educational content";
				context = "Educational consumption";
			} else {
				contextCategory = "neutral";
				multiplier = this.contextMultipliers.neutral;
				insight = "Educational content consumption";
				context = "Learning";
			}
		}

		// Title-based analysis for additional context
		if (title && contextCategory !== "idle") {
			const titleLower = title.toLowerCase();
			if (
				titleLower.includes("game") ||
				titleLower.includes("entertainment") ||
				(titleLower.includes("youtube") && !titleLower.includes("tutorial"))
			) {
				contextCategory = "distracted";
				multiplier = this.contextMultipliers.distracted;
				insight = "Entertainment activity";
				context = "Recreation";
			}
		}

		return {
			multiplier: multiplier,
			insight: insight,
			context: context,
			confidence: 0.6,
		};
	}

	applyAIMultiplier(baseScore: number, aiContext: AIContext): number {
		// Apply context multiplier to base score
		const multiplier = aiContext.multiplier;
		const adjustedScore = baseScore * multiplier;

		// Apply smoothing for human-like, gradual score changes
		// This prevents jarring jumps in productivity scores
		const smoothingFactor = 0.4; // 40% of the change applied immediately
		const smoothedScore = baseScore + (adjustedScore - baseScore) * smoothingFactor;

		// Ensure score doesn't go negative (except for distracting activities)
		const finalScore = Math.max(0, smoothedScore);

		return finalScore;
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
