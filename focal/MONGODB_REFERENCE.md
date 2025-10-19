# MongoDB Database Service - Quick Reference

## Setup (One Time)

### 1. Replace Password

In `electron/services/database.ts` or `.env` file:

```
mongodb+srv://test:YOUR_ACTUAL_PASSWORD@focalai.t1ld1i3.mongodb.net/...
```

### 2. Whitelist IP

MongoDB Atlas → Network Access → Add IP Address

## Functions Reference

### Core Functions

#### `setScore(score: number): Promise<void>`

Set user's score to an exact value (overwrites existing).

```typescript
await databaseService.setScore(100);
```

#### `getScore(): Promise<number>`

Get user's current score (returns 0 if no score exists).

```typescript
const score = await databaseService.getScore(); // Returns: number
```

#### `updateScore(additionalScore: number): Promise<void>`

Add points to existing score (increments).

```typescript
await databaseService.updateScore(50); // Adds 50 to current score
```

#### `setAuthToken(token: string): void`

**Required before any database operation!**

```typescript
databaseService.setAuthToken(userToken);
```

### Legacy Functions (Backward Compatible)

#### `saveScore(score: number): Promise<void>`

Alias for `setScore()`.

```typescript
await databaseService.saveScore(100);
```

#### `fetchScore(): Promise<number>`

Alias for `getScore()`.

```typescript
const score = await databaseService.fetchScore();
```

## Usage Pattern

```typescript
// 1. Set token (once per user session)
databaseService.setAuthToken(userToken);

// 2. Use database functions
await databaseService.setScore(0); // Initialize
const score = await databaseService.getScore(); // Read
await databaseService.updateScore(10); // Add points
```

## Common Patterns

### Initialize New User

```typescript
databaseService.setAuthToken(newUserToken);
await databaseService.setScore(0);
```

### Award Points

```typescript
await databaseService.updateScore(pointsEarned);
```

### Display Score

```typescript
const currentScore = await databaseService.getScore();
console.log(`Score: ${currentScore}`);
```

### Reset Score

```typescript
await databaseService.setScore(0);
```

### Set Achievement

```typescript
await databaseService.setScore(1000); // Set to exact value
```

## Error Handling

```typescript
try {
	await databaseService.setScore(100);
} catch (error) {
	console.error("Database error:", error.message);
	// Handle error
}
```

### Common Errors

| Error                                | Cause              | Solution                      |
| ------------------------------------ | ------------------ | ----------------------------- |
| "Authentication token not available" | No token set       | Call `setAuthToken()` first   |
| "Failed to connect to MongoDB"       | Connection issue   | Check password and internet   |
| Network errors                       | IP not whitelisted | Whitelist IP in MongoDB Atlas |

## Data Structure

```typescript
{
	userId: string; // From auth token
	score: number; // Current score
	timestamp: number; // Created (ms)
	lastUpdated: number; // Modified (ms)
}
```

## Environment Variables (Optional)

Create `.env` in `focal/` directory:

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=focalai
MONGODB_COLLECTION=user_scores
```

## Connection Details

-   **Database**: `focalai`
-   **Collection**: `user_scores`
-   **Index**: `userId` (unique)
-   **Auto-connect**: Yes (on first operation)
-   **Connection pooling**: Yes
-   **Auto-reconnect**: Yes

## Performance

-   Query time: ~50-100ms
-   Concurrent operations: Supported
-   Connection reuse: Automatic
-   Index optimization: Automatic

## Testing

```typescript
// Quick test
databaseService.setAuthToken("test-" + Date.now());
await databaseService.setScore(100);
const score = await databaseService.getScore();
console.log(score === 100 ? "✅ Works!" : "❌ Failed");
```

## Comparison: Old vs New

| Old (Still Works) | New (Recommended) |
| ----------------- | ----------------- |
| `saveScore(100)`  | `setScore(100)`   |
| `fetchScore()`    | `getScore()`      |
| `updateScore(50)` | `updateScore(50)` |
| `setAuthToken(t)` | `setAuthToken(t)` |

## Files

-   **Implementation**: `electron/services/database.ts`
-   **Setup Guide**: `MONGODB_SETUP.md`
-   **Examples**: `MONGODB_USAGE_EXAMPLE.md`
-   **Migration**: `MONGODB_MIGRATION_SUMMARY.md`

## Quick Checklist

-   [ ] Replace `<db_password>` with actual password
-   [ ] Whitelist IP in MongoDB Atlas
-   [ ] Test connection: Run app and check console
-   [ ] Set auth token before operations
-   [ ] Handle errors appropriately

## Support

1. Check console logs for error messages
2. Verify MongoDB Atlas dashboard shows connections
3. Check `MONGODB_SETUP.md` for troubleshooting
4. Test with simple operations first

---

**Ready to use!** Just replace the password and start coding.
