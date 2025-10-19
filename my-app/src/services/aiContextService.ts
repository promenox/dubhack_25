// AI Context Service: Refines scores using AI reasoning

import { AIContextRequest, AIContextResponse } from "../types";

export class AIContextService {
	private static readonly API_ENDPOINT = "https://api.openai.com/v1/chat/completions";
	private apiKey: string | null = null;

	constructor(apiKey?: string) {
		this.apiKey = apiKey || null;
	}

	setApiKey(key: string) {
		this.apiKey = key;
	}

	/**
	 * Get AI-refined multiplier for the base score
	 * Returns a multiplier between 0.5 and 1.5
	 */
	async refineScore(request: AIContextRequest): Promise<AIContextResponse> {
		// If no API key, use rule-based fallback
		if (!this.apiKey) {
			return this.fallbackRefinement(request);
		}

		try {
			const prompt = this.buildPrompt(request);

			const response = await fetch(this.API_ENDPOINT, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model: "gpt-4o-mini",
					messages: [
						{
							role: "system",
							content:
								"You are a productivity analysis AI. Analyze user activity and return a JSON object with: multiplier (0.5-1.5), reasoning (brief explanation), and suggestion (one actionable tip).",
						},
						{
							role: "user",
							content: prompt,
						},
					],
					temperature: 0.3,
					max_tokens: 200,
				}),
			});

			if (!response.ok) {
				console.error("AI API error:", response.statusText);
				return this.fallbackRefinement(request);
			}

			const data = await response.json();
			const content = data.choices[0].message.content;

			// Parse JSON response
			const parsed = JSON.parse(content);

			return {
				multiplier: Math.min(1.5, Math.max(0.5, parsed.multiplier)),
				reasoning: parsed.reasoning || "",
				suggestion: parsed.suggestion || "",
			};
		} catch (error) {
			console.error("AI refinement error:", error);
			return this.fallbackRefinement(request);
		}
	}

	/**
	 * Build prompt for AI context analysis
	 */
	private buildPrompt(request: AIContextRequest): string {
		return `
User Goal: ${request.goal || "None set"}
Current App: ${request.appName}
Window: ${request.windowTitle}
Base Score: ${request.baseScore}/100
App Switches: ${request.switchCount}
Pattern: ${request.recentPattern}

Analyze if this activity aligns with productivity. Consider:
- Is the app/content relevant to the goal?
- Is the pattern healthy or distracted?
- Should the score be adjusted up (1.0-1.5x) or down (0.5-1.0x)?

Return JSON only: {"multiplier": 1.0, "reasoning": "...", "suggestion": "..."}
    `.trim();
	}

	/**
	 * Rule-based fallback when AI is unavailable
	 */
	private fallbackRefinement(request: AIContextRequest): AIContextResponse {
		let multiplier = 1.0;
		let reasoning = "Using rule-based analysis.";
		let suggestion = "Keep focusing on your current task.";

		// Pattern-based adjustments
		if (request.recentPattern === "high_switching") {
			multiplier = 0.7;
			reasoning = "High app switching detected, reducing score.";
			suggestion = "Try to focus on one task at a time.";
		} else if (request.recentPattern === "deep_focus") {
			multiplier = 1.3;
			reasoning = "Deep focus detected, boosting score.";
			suggestion = "Great focus! Keep up the momentum.";
		} else if (request.recentPattern === "mostly_idle") {
			multiplier = 0.6;
			reasoning = "Mostly idle during this period.";
			suggestion = "Take a break or re-engage with your task.";
		}

		// App-based context (simple heuristics)
		const productiveApps = ["vscode", "visual studio", "intellij", "notion", "obsidian", "chrome", "firefox"];
		const distractingApps = ["discord", "steam", "spotify", "netflix"];

		const appLower = request.appName.toLowerCase();

		if (productiveApps.some((app) => appLower.includes(app))) {
			multiplier *= 1.1;
		} else if (distractingApps.some((app) => appLower.includes(app))) {
			multiplier *= 0.8;
			suggestion = "Consider focusing on work-related apps.";
		}

		// Check if activity matches goal
		if (request.goal && request.windowTitle) {
			const goalWords = request.goal.toLowerCase().split(" ");
			const titleLower = request.windowTitle.toLowerCase();

			if (goalWords.some((word) => word.length > 3 && titleLower.includes(word))) {
				multiplier *= 1.2;
				reasoning += " Activity aligns with your goal.";
			}
		}

		return {
			multiplier: Math.min(1.5, Math.max(0.5, multiplier)),
			reasoning,
			suggestion,
		};
	}

	/**
	 * Generate 30-minute summary with AI
	 */
	async generateSummary(
		windows: any[],
		averageScore: number,
		topActivities: string[]
	): Promise<{ feedback: string; suggestions: string[] }> {
		if (!this.apiKey) {
			return this.fallbackSummary(averageScore, topActivities);
		}

		try {
			const prompt = `
Generate a brief productivity summary:

Average Focus Score: ${averageScore}/100
Top Activities: ${topActivities.join(", ")}
Number of Windows: ${windows.length}

Provide:
1. Brief feedback (2-3 sentences)
2. 2-3 actionable suggestions

Return JSON: {"feedback": "...", "suggestions": ["...", "..."]}
      `.trim();

			const response = await fetch(this.API_ENDPOINT, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model: "gpt-4o-mini",
					messages: [
						{ role: "system", content: "You are a productivity coach. Be encouraging but honest." },
						{ role: "user", content: prompt },
					],
					temperature: 0.7,
					max_tokens: 250,
				}),
			});

			if (!response.ok) {
				return this.fallbackSummary(averageScore, topActivities);
			}

			const data = await response.json();
			const parsed = JSON.parse(data.choices[0].message.content);

			return {
				feedback: parsed.feedback || "",
				suggestions: parsed.suggestions || [],
			};
		} catch (error) {
			console.error("AI summary error:", error);
			return this.fallbackSummary(averageScore, topActivities);
		}
	}

	private fallbackSummary(
		averageScore: number,
		topActivities: string[]
	): {
		feedback: string;
		suggestions: string[];
	} {
		let feedback = "";
		const suggestions: string[] = [];

		if (averageScore >= 75) {
			feedback = "Excellent focus this period! You maintained strong engagement and minimal distractions.";
			suggestions.push("Keep up the great momentum.");
			suggestions.push("Consider taking a short break to recharge.");
		} else if (averageScore >= 50) {
			feedback = "Good work this period. You stayed mostly focused with some minor distractions.";
			suggestions.push("Try to reduce app switching for deeper focus.");
			suggestions.push("Set clear mini-goals for the next period.");
		} else {
			feedback = "Focus was scattered this period. Multiple distractions or idle time detected.";
			suggestions.push("Close distracting apps and notifications.");
			suggestions.push("Try the Pomodoro technique: 25 min focus, 5 min break.");
		}

		return { feedback, suggestions };
	}
}
