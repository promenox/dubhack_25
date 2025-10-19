# MongoDB Database Service - Usage Examples

## Overview

The MongoDB database service provides these key functions:

### New Functions

-   `setScore(score: number)` - Set user's score to a specific value
-   `getScore(): Promise<number>` - Get user's current score

### Legacy Functions (still supported)

-   `saveScore(score: number)` - Alias for `setScore()`
-   `fetchScore(): Promise<number>` - Alias for `getScore()`
-   `updateScore(additionalScore: number)` - Add points to existing score

## Complete Example

```typescript
import { databaseService } from "./electron/services/database";

async function demonstrateDatabaseUsage() {
	try {
		// Step 1: Set authentication token (required before any operation)
		const userToken = "user-auth-token-12345";
		databaseService.setAuthToken(userToken);
		console.log("✅ Auth token set");

		// Step 2: Set initial score
		await databaseService.setScore(100);
		console.log("✅ Score set to 100");

		// Step 3: Get current score
		let score = await databaseService.getScore();
		console.log(`📊 Current score: ${score}`); // Output: 100

		// Step 4: Update score by adding points
		await databaseService.updateScore(50);
		console.log("✅ Added 50 points");

		// Step 5: Check new score
		score = await databaseService.getScore();
		console.log(`📊 New score: ${score}`); // Output: 150

		// Step 6: Set score to a specific value
		await databaseService.setScore(500);
		console.log("✅ Score set to 500");

		// Step 7: Verify final score
		score = await databaseService.getScore();
		console.log(`📊 Final score: ${score}`); // Output: 500
	} catch (error) {
		console.error("❌ Error:", error);
	}
}

// Run the example
demonstrateDatabaseUsage();
```

## Integration with Existing Code

The database service is already integrated in `electron/main.ts`. Here's how it's currently used:

### Example from main.ts

```typescript
// Set auth token when user logs in
ipcMain.handle("auth:set-token", async (_, token: string) => {
	databaseService.setAuthToken(token);

	// Optionally fetch existing score
	try {
		const score = await databaseService.fetchScore();
		console.log(`User's score: ${score}`);
	} catch (error) {
		console.error("Failed to fetch score:", error);
	}
});

// Save score
ipcMain.handle("database:save-score", async (_, score: number) => {
	await databaseService.saveScore(score);
});

// Update score (add points)
ipcMain.handle("database:update-score", async (_, score: number) => {
	await databaseService.updateScore(score);
});
```

## Real-World Use Cases

### 1. Game Progress System

```typescript
// Player completes a level
async function completeLevel(pointsEarned: number) {
	await databaseService.updateScore(pointsEarned);
	const totalScore = await databaseService.getScore();
	console.log(`Level complete! Total score: ${totalScore}`);
}
```

### 2. Achievement System

```typescript
// Unlock achievement
async function unlockAchievement(achievementPoints: number) {
	await databaseService.updateScore(achievementPoints);
	console.log(`Achievement unlocked! +${achievementPoints} points`);
}
```

### 3. Daily Reset

```typescript
// Reset score at the start of each day
async function dailyReset() {
	await databaseService.setScore(0);
	console.log("Daily score reset to 0");
}
```

### 4. Leaderboard Display

```typescript
// Get user's score for leaderboard
async function getLeaderboardScore(): Promise<number> {
	const score = await databaseService.getScore();
	return score;
}
```

### 5. Focus Time Tracking

```typescript
// Track productivity score
async function trackFocusSession(durationMinutes: number) {
	const points = Math.floor(durationMinutes * 10); // 10 points per minute
	await databaseService.updateScore(points);

	const totalScore = await databaseService.getScore();
	console.log(`Focus session complete! +${points} points (Total: ${totalScore})`);
}
```

## Error Handling Best Practices

```typescript
async function safeScoreUpdate(points: number) {
	try {
		await databaseService.updateScore(points);
		console.log("✅ Score updated successfully");
	} catch (error) {
		if (error.message.includes("Authentication token not available")) {
			console.error("❌ User not authenticated. Please log in.");
			// Redirect to login
		} else if (error.message.includes("Failed to connect")) {
			console.error("❌ Database connection failed. Check internet connection.");
			// Show offline mode
		} else {
			console.error("❌ Unexpected error:", error);
			// Log to error tracking service
		}
	}
}
```

## Testing Your Setup

### Quick Test

Run this in your Electron main process:

```typescript
import { databaseService } from "./services/database";

// Test connection and basic operations
async function testDatabase() {
	console.log("🧪 Testing MongoDB connection...");

	databaseService.setAuthToken("test-user-" + Date.now());

	// Test setScore
	await databaseService.setScore(42);
	console.log("✅ setScore working");

	// Test getScore
	const score = await databaseService.getScore();
	console.log(`✅ getScore working: ${score}`);

	// Test updateScore
	await databaseService.updateScore(8);
	const newScore = await databaseService.getScore();
	console.log(`✅ updateScore working: ${newScore}`);

	console.log("🎉 All tests passed!");
}

testDatabase().catch(console.error);
```

## Migration Guide

If you're upgrading from the old database service:

### Before (Old Code)

```typescript
// These still work!
await databaseService.saveScore(100);
const score = await databaseService.fetchScore();
```

### After (New Code - Recommended)

```typescript
// Use the new, more descriptive names
await databaseService.setScore(100);
const score = await databaseService.getScore();
```

**Both work!** The old function names are kept for backward compatibility.

## Performance Tips

1. **Batch operations**: If updating multiple times, consider batching:

    ```typescript
    // Instead of multiple updates
    await databaseService.updateScore(10);
    await databaseService.updateScore(20);
    await databaseService.updateScore(30);

    // Do this
    await databaseService.updateScore(60);
    ```

2. **Cache scores locally**: Don't fetch on every render:

    ```typescript
    let cachedScore = await databaseService.getScore();
    // Use cachedScore for display
    // Only fetch again when you know it changed
    ```

3. **Handle offline mode**: Store operations locally when offline:
    ```typescript
    try {
    	await databaseService.updateScore(points);
    } catch (error) {
    	// Store in local queue for later sync
    	localStorage.setItem("pendingPoints", points.toString());
    }
    ```

## Next Steps

1. Replace `<db_password>` in your MongoDB URI
2. Test the connection with the quick test above
3. Integrate into your application logic
4. Monitor MongoDB Atlas dashboard for activity

For detailed setup instructions, see `MONGODB_SETUP.md`.
