import type { ScoreResponse, UpdateScoreResponse } from "../types/ipc";

export interface LeaderboardResponse {
	success: boolean;
	scores?: Array<{ userId: string; score: number; username?: string }>;
	error?: string;
}

export interface SaveUserProfileResponse {
	success: boolean;
	error?: string;
}

// Local fallback for leaderboard when IPC/database isn't available
const MOCK_LEADERBOARD_KEY = "leaderboardMock";

function readMockLeaderboard(): Array<{ userId: string; score: number; username?: string }> | null {
	try {
		const raw = localStorage.getItem(MOCK_LEADERBOARD_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return null;
		return parsed as Array<{ userId: string; score: number; username?: string }>;
	} catch {
		return null;
	}
}

function seedMockLeaderboard(): Array<{ userId: string; score: number; username?: string }> {
	const seed = [
		{ userId: "11111111-aaaa-bbbb-cccc-000000000001", score: 1240, username: "Ada" },
		{ userId: "11111111-aaaa-bbbb-cccc-000000000002", score: 1180, username: "Linus" },
		{ userId: "11111111-aaaa-bbbb-cccc-000000000003", score: 990, username: "Grace" },
		{ userId: "11111111-aaaa-bbbb-cccc-000000000004", score: 860, username: "Alan" },
		{ userId: "11111111-aaaa-bbbb-cccc-000000000005", score: 820, username: "Katherine" },
		{ userId: "11111111-aaaa-bbbb-cccc-000000000006", score: 780, username: "Edsger" },
		{ userId: "11111111-aaaa-bbbb-cccc-000000000007", score: 720, username: "Margaret" },
		{ userId: "11111111-aaaa-bbbb-cccc-000000000008", score: 680, username: "Barbara" },
		{ userId: "11111111-aaaa-bbbb-cccc-000000000009", score: 640, username: "Donald" },
		{ userId: "11111111-aaaa-bbbb-cccc-000000000010", score: 600, username: "Tim" },
	];

	localStorage.setItem(MOCK_LEADERBOARD_KEY, JSON.stringify(seed));
	return seed;
}

function getOrInitMockLeaderboard(): Array<{ userId: string; score: number; username?: string }> {
	const existing = readMockLeaderboard();
	if (existing && existing.length > 0) return existing;
	return seedMockLeaderboard();
}

// Try to get ipcRenderer from window or electron
function getIpcRenderer() {
	// Try window.ipcRenderer first (from preload script)
	if (typeof window !== "undefined" && (window as any).ipcRenderer) {
		return (window as any).ipcRenderer;
	}

	// Return null if not available
	return null;
}

/**
 * Send auth token to main process for database operations
 * Call this after successful authentication
 */
export function setAuthToken(token: string): void {
	const ipcRenderer = getIpcRenderer();

	if (ipcRenderer) {
		console.log("🔑 Sending auth token to main process...");
		ipcRenderer.send("set-auth-token", token);
		console.log("🔑 Auth token sent to main process");
	} else {
		console.warn("⚠️ IPC not available - running in browser mode");
		console.warn("⚠️ Database operations will not work");
	}
}

/**
 * Fetch current score from database
 */
export async function fetchScore(): Promise<number | null> {
	try {
		const ipcRenderer = getIpcRenderer();

		if (!ipcRenderer) {
			console.warn("⚠️ IPC not available - running in browser mode");
			return null;
		}

		const response: ScoreResponse = await ipcRenderer.invoke("fetch-score");

		if (response.success && response.score !== undefined) {
			console.log("✅ Score fetched:", response.score);
			return response.score;
		} else {
			console.error("❌ Failed to fetch score:", response.error);
			return null;
		}
	} catch (error) {
		console.error("❌ Error fetching score:", error);
		return null;
	}
}

/**
 * Update score in database (add to existing score)
 */
export async function updateScore(score: number): Promise<boolean> {
	try {
		const ipcRenderer = getIpcRenderer();

		if (!ipcRenderer) {
			console.warn("⚠️ IPC not available - running in browser mode");
			return false;
		}

		const response: UpdateScoreResponse = await ipcRenderer.invoke("update-score", score);

		if (response.success) {
			console.log("✅ Score updated successfully");
			return true;
		} else {
			console.error("❌ Failed to update score:", response.error);
			return false;
		}
	} catch (error) {
		console.error("❌ Error updating score:", error);
		return false;
	}
}

/**
 * Set score in database (overwrite existing score)
 */
export async function setScore(score: number): Promise<boolean> {
	try {
		console.log(`📤 setScore called with score: ${score}`);
		const ipcRenderer = getIpcRenderer();

		if (!ipcRenderer) {
			console.warn("⚠️ IPC not available - running in browser mode");
			return false;
		}

		console.log(`📡 Invoking set-score IPC with score: ${score}`);
		const response: UpdateScoreResponse = await ipcRenderer.invoke("set-score", score);
		console.log(`📥 Received response from set-score:`, response);

		if (response.success) {
			console.log("✅ Score set successfully");
			return true;
		} else {
			console.error("❌ Failed to set score:", response.error);
			return false;
		}
	} catch (error) {
		console.error("❌ Error setting score:", error);
		return false;
	}
}

/**
 * Fetch all users' scores for leaderboard
 */
export async function fetchAllScores(): Promise<Array<{ userId: string; score: number; username?: string }> | null> {
	try {
		const ipcRenderer = getIpcRenderer();

		if (!ipcRenderer) {
			console.warn("⚠️ IPC not available - running in browser mode (mock leaderboard)");
			const mock = getOrInitMockLeaderboard();
			// Ensure sorted desc by score
			return [...mock].sort((a, b) => b.score - a.score);
		}

		const response: LeaderboardResponse = await ipcRenderer.invoke("fetch-all-scores");

		if (response.success && Array.isArray(response.scores)) {
			return response.scores;
		} else {
			console.error("❌ Failed to fetch leaderboard:", response.error);
			return null;
		}
	} catch (error) {
		console.error("❌ Error fetching leaderboard:", error);
		return null;
	}
}

/**
 * Save user profile (username/email) keyed by userId in database
 */
export async function saveUserProfile(userId: string, username: string, email: string): Promise<boolean> {
	try {
		const ipcRenderer = getIpcRenderer();

		if (!ipcRenderer) {
			console.warn("⚠️ IPC not available - running in browser mode");
			return false;
		}

		const response: SaveUserProfileResponse = await ipcRenderer.invoke("save-user-profile", {
			userId,
			username,
			email,
		});

		if (response.success) {
			console.log("✅ User profile saved successfully");
			return true;
		} else {
			console.error("❌ Failed to save user profile:", response.error);
			return false;
		}
	} catch (error) {
		console.error("❌ Error saving user profile:", error);
		return false;
	}
}

/**
 * Helper function to get ID token from stored Cognito tokens
 */
export function getIdTokenFromStorage(): string | null {
	try {
		const tokensStr = localStorage.getItem("cognitoTokens");
		if (!tokensStr) {
			console.warn("⚠️ No Cognito tokens found in localStorage");
			return null;
		}

		const tokens = JSON.parse(tokensStr);
		return tokens.idToken || null;
	} catch (error) {
		console.error("❌ Error reading tokens from localStorage:", error);
		return null;
	}
}

/**
 * Initialize database service with auth token from localStorage
 * Call this on app startup after authentication
 */
export function initializeDatabaseAuth(): boolean {
	const token = getIdTokenFromStorage();

	if (token) {
		setAuthToken(token);
		return true;
	} else {
		console.warn("⚠️ No auth token available to initialize database");
		return false;
	}
}
