import type { ScoreResponse, UpdateScoreResponse } from "../types/ipc";

// Try to get ipcRenderer from window or electron
function getIpcRenderer() {
	// Try window.ipcRenderer first (from preload script)
	if (typeof window !== "undefined" && (window as any).ipcRenderer) {
		return (window as any).ipcRenderer;
	}

	// Try direct electron import (when nodeIntegration: true, contextIsolation: false)
	try {
		const { ipcRenderer } = require("electron");
		return ipcRenderer;
	} catch (e) {
		return null;
	}
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
