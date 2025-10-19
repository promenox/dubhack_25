// Core type definitions for FocusAI

export interface ActivitySnapshot {
	timestamp: number;
	appName: string; // Simplified - always "FocusAI"
	windowTitle: string; // Simplified - always "FocusAI App"
	keystrokeCount: number;
	isIdle: boolean;
	ocrText?: string;
	ocrConfidence?: number;
}

export interface ActivityWindow {
	startTime: number;
	endTime: number;
	snapshots: ActivitySnapshot[];
	baseScore: number;
	aiMultiplier: number;
	finalScore: number;
	switchCount: number;
	totalKeystrokes: number;
	activeTime: number;
	idleTime: number;
}

export interface FocusScore {
	instantaneous: number; // Current 3-minute window score
	cumulative: number; // Overall progress score
	trend: "rising" | "falling" | "stable";
}

export interface UserGoal {
	id: string;
	title: string;
	category: "work" | "study" | "creative" | "other";
	active: boolean;
	createdAt: number;
}

export interface AIContextRequest {
	goal: string;
	appName: string; // Simplified - always "FocusAI"
	windowTitle: string; // Simplified - always "FocusAI App"
	switchCount: number;
	baseScore: number;
	recentPattern: string;
}

export interface AIContextResponse {
	multiplier: number; // 0.5 to 1.5
	reasoning: string;
	suggestion: string;
}

export interface AISummary {
	timestamp: number;
	periodMinutes: number;
	averageScore: number;
	topActivities: string[];
	feedback: string;
	suggestions: string[];
}

export type GardenStage = "soil" | "seed" | "sprout" | "seedling" | "growing" | "blooming" | "flourishing";

export interface GardenState {
	stage: GardenStage;
	progress: number; // 0-100 within current stage
	totalGrowth: number; // Cumulative growth points
	lastWatered: number; // timestamp
}

export interface AppState {
	currentGoal: UserGoal | null;
	focusScore: FocusScore;
	gardenState: GardenState;
	currentWindow: ActivityWindow | null;
	recentSummary: AISummary | null;
	isTracking: boolean;
	latestOcrText?: string;
	latestOcrConfidence?: number;
}
