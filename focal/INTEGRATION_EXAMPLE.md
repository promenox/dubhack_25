# Integration Example: Real Score Saving

This document shows how to replace the dummy score (420) with actual productivity scores.

## Current Implementation

Currently, when tracking starts, a **dummy score of 420** is saved:

```typescript
// In electron/main.ts - start-session handler
await databaseService.saveScore(420);
```

## Option 1: Save Final Score When Session Ends

Save the cumulative score when the user stops tracking:

```typescript
// In electron/main.ts - modify stop-session handler
ipcMain.on("stop-session", async () => {
	console.log("Stopping focus session...");
	if (this.sessionActive) {
		this.sessionActive = false;
		this.sessionStartTime = null;

		// Save final cumulative score before stopping
		try {
			const finalScore = this.focusAI.cumulativeScore;
			console.log(`💾 Saving final score: ${finalScore}`);
			await databaseService.saveScore(Math.round(finalScore));
			console.log("✅ Final score saved successfully!");
		} catch (error: any) {
			console.error("❌ Failed to save final score:", error.message);
		}

		this.focusTracker.stop();
		this.hideOverlay();
	}
});
```

## Option 2: Periodic Score Updates

Save/update the score periodically during the session:

```typescript
// In electron/main.ts - add to startTracking() method
startTracking() {
  this.focusTracker.start();

  // Add periodic score saving
  const scoreUpdateInterval = setInterval(async () => {
    try {
      const currentScore = this.focusAI.cumulativeScore;
      await databaseService.saveScore(Math.round(currentScore));
      console.log(`💾 Score updated: ${currentScore}`);
    } catch (error: any) {
      console.error("❌ Failed to update score:", error.message);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  // Store interval ID for cleanup
  this.scoreUpdateInterval = scoreUpdateInterval;

  // ... rest of existing code
}

// Don't forget to clear the interval when stopping
stopTracking() {
  if (this.scoreUpdateInterval) {
    clearInterval(this.scoreUpdateInterval);
    this.scoreUpdateInterval = null;
  }
  // ... rest of existing code
}
```

## Option 3: Incremental Score Updates

Instead of overwriting, add incremental scores as they're earned:

```typescript
// In electron/main.ts - modify the update interval in startTracking()
let lastSavedScore = 0;

this.updateInterval = setInterval(async () => {
	try {
		const currentWindow = this.focusTracker.currentWindow;
		if (currentWindow && !currentWindow.isComplete) {
			const windowSummary = currentWindow.getSummary();
			const focusData = await this.focusAI.calculateHybridScore(windowSummary);

			// Calculate score difference since last save
			const scoreDifference = focusData.instantaneous;

			if (scoreDifference > 0) {
				// Update database with incremental score
				await databaseService.updateScore(Math.round(scoreDifference));
				console.log(`💾 Added ${scoreDifference} points to database`);
			}

			// ... rest of dashboard update code
		}
	} catch (error) {
		console.error("Error in score update:", error);
	}
}, 30000); // Every 30 seconds
```

## Option 4: Save Score on Significant Milestones

Save only when the user reaches certain milestones:

```typescript
// In electron/main.ts - add milestone tracking
private scoreMilestones = [100, 250, 500, 750, 1000];
private lastMilestoneReached = 0;

// In the update interval:
const currentScore = this.focusAI.cumulativeScore;

// Check if a new milestone was reached
for (const milestone of this.scoreMilestones) {
  if (currentScore >= milestone && this.lastMilestoneReached < milestone) {
    this.lastMilestoneReached = milestone;

    // Save milestone achievement
    try {
      await databaseService.saveScore(Math.round(currentScore));
      console.log(`🎉 Milestone reached: ${milestone} points!`);
      console.log(`💾 Score saved: ${currentScore}`);
    } catch (error: any) {
      console.error("❌ Failed to save milestone score:", error.message);
    }

    break;
  }
}
```

## Recommended Approach

For best user experience and data reliability, we recommend a **hybrid approach**:

1. **Initialize with 0 on session start** (to create user record if it doesn't exist)
2. **Periodic updates every 5 minutes** (to prevent data loss)
3. **Final save on session end** (to ensure final score is recorded)

```typescript
// In MainApp class
class MainApp {
  // ... existing properties
  scoreUpdateInterval: NodeJS.Timeout | null = null;

  // Modified start-session handler
  ipcMain.on("start-session", async () => {
    console.log("Starting focus session...");
    if (!this.sessionActive) {
      this.sessionActive = true;
      this.sessionStartTime = Date.now();
      this.focusTracker.start();
      this.startTracking();
      this.showOverlay(this.sessionStartTime);

      // Initialize score record (ensures user exists in database)
      try {
        await databaseService.saveScore(0);
        console.log("✅ Session initialized in database");
      } catch (error: any) {
        console.error("❌ Failed to initialize session:", error.message);
      }

      // Start periodic score updates
      this.startScoreUpdates();
    }
  });

  // Modified stop-session handler
  ipcMain.on("stop-session", async () => {
    console.log("Stopping focus session...");
    if (this.sessionActive) {
      // Stop score updates
      this.stopScoreUpdates();

      // Save final score
      try {
        const finalScore = Math.round(this.focusAI.cumulativeScore);
        await databaseService.saveScore(finalScore);
        console.log(`✅ Final score saved: ${finalScore}`);
      } catch (error: any) {
        console.error("❌ Failed to save final score:", error.message);
      }

      this.sessionActive = false;
      this.sessionStartTime = null;
      this.focusTracker.stop();
      this.hideOverlay();
    }
  });

  startScoreUpdates() {
    this.stopScoreUpdates(); // Clear any existing interval

    this.scoreUpdateInterval = setInterval(async () => {
      try {
        const currentScore = Math.round(this.focusAI.cumulativeScore);
        await databaseService.saveScore(currentScore);
        console.log(`💾 Score auto-saved: ${currentScore}`);
      } catch (error: any) {
        console.error("❌ Score auto-save failed:", error.message);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  stopScoreUpdates() {
    if (this.scoreUpdateInterval) {
      clearInterval(this.scoreUpdateInterval);
      this.scoreUpdateInterval = null;
    }
  }
}
```

## Testing Your Integration

After implementing your chosen approach:

1. **Start a focus session**
2. **Check console logs** for score save confirmations
3. **Query your DynamoDB table** to verify scores are being saved
4. **Stop the session** and verify final score is saved
5. **Start a new session** and verify the score loads correctly

## Environment Variables

Don't forget to set your API Gateway URL in `.env`:

```
API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
```
