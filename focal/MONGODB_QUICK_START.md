# MongoDB Quick Start Guide

## Quick Setup (5 minutes)

### 1. Replace `<db_password>` in your code

Edit your `.env` file or update the default URI in `database.ts`:

```typescript
// Before
mongodb+srv://test:<db_password>@focalai.t1ld1i3.mongodb.net/...

// After (example)
mongodb+srv://test:MySecurePassword123@focalai.t1ld1i3.mongodb.net/...
```

### 2. Test the connection

The database service will automatically connect when you first use it:

```typescript
import { databaseService } from "./services/database";

// Set user token
databaseService.setAuthToken("user-token-123");

// This will trigger connection and save score
await databaseService.setScore(100);
console.log("✅ Connected to MongoDB!");
```

## Main Functions

### `setScore(score: number)` - NEW!

Set user's score to a specific value (overwrites existing):

```typescript
await databaseService.setScore(500);
```

### `getScore(): Promise<number>` - NEW!

Get user's current score:

```typescript
const score = await databaseService.getScore();
console.log(score); // Returns 0 if no score exists
```

### `updateScore(points: number)`

Add points to existing score:

```typescript
await databaseService.updateScore(50); // Adds 50 points
```

### `saveScore(score: number)` (Legacy)

Same as `setScore()` - kept for backward compatibility:

```typescript
await databaseService.saveScore(420);
```

### `fetchScore()` (Legacy)

Same as `getScore()` - kept for backward compatibility:

```typescript
const score = await databaseService.fetchScore();
```

## Common Use Cases

### Initialize New User

```typescript
databaseService.setAuthToken(userToken);
await databaseService.setScore(0); // Start at 0
```

### Award Points

```typescript
await databaseService.updateScore(10); // +10 points
```

### Display Score

```typescript
const score = await databaseService.getScore();
console.log(`You have ${score} points!`);
```

### Set Achievement Score

```typescript
await databaseService.setScore(1000); // Set to exact value
```

## Error Handling

All functions return Promises and may throw errors:

```typescript
try {
	await databaseService.setScore(100);
} catch (error) {
	console.error("Failed to save score:", error);
}
```

Common errors:

-   "Authentication token not available" - Call `setAuthToken()` first
-   "Failed to connect to MongoDB" - Check your connection string and password
-   Network errors - Check internet connection and MongoDB Atlas whitelist

## That's It!

You're ready to use MongoDB with FocalAI. For more details, see `MONGODB_SETUP.md`.
