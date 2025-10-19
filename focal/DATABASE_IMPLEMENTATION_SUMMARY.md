# Database Integration - Implementation Summary

## What Was Implemented

A complete database integration system that automatically saves a **dummy score of 420** to your DynamoDB database when a focus tracking session starts.

## Files Created/Modified

### New Files Created:

1. **`electron/services/database.ts`**

    - Database service with methods for saving, fetching, and updating scores
    - Handles authentication token management
    - Provides error handling and logging

2. **`src/utils/database.ts`**

    - Renderer-process utilities for database operations
    - Functions to send auth tokens to main process
    - Helper to initialize database auth from localStorage

3. **`DATABASE_SETUP.md`**

    - Complete setup instructions
    - Lambda function examples
    - DynamoDB table structure
    - Troubleshooting guide

4. **`INTEGRATION_EXAMPLE.md`**

    - Examples of how to replace dummy score with real scores
    - Multiple integration strategies
    - Recommended hybrid approach

5. **`DATABASE_IMPLEMENTATION_SUMMARY.md`** (this file)
    - Overview of what was implemented

### Modified Files:

1. **`electron/main.ts`**

    - Added database service import
    - Modified `start-session` handler to save dummy score of 420
    - Added IPC handlers for:
        - `set-auth-token` - Receives auth token from renderer
        - `fetch-score` - Fetches score from database
        - `update-score` - Updates score in database

2. **`src/components/Auth.tsx`**

    - Automatically sends ID token to main process after successful sign-in
    - Token is extracted from Cognito response

3. **`src/App.tsx`**

    - Initializes database auth on app startup if session exists
    - Ensures token is available before any database operations

4. **`src/types/ipc.ts`**
    - Added `ScoreResponse` interface
    - Added `UpdateScoreResponse` interface

## How It Works

### Flow Diagram

```
1. User Signs In
   ↓
2. Auth.tsx extracts ID token from Cognito response
   ↓
3. setAuthToken() sends token to main process via IPC
   ↓
4. Main process stores token in databaseService
   ↓
5. User Starts Focus Session
   ↓
6. start-session IPC handler triggered
   ↓
7. databaseService.saveScore(420) called
   ↓
8. POST request sent to API Gateway with Bearer token
   ↓
9. API Gateway validates token with Cognito Authorizer
   ↓
10. Lambda function saves score to DynamoDB
    ↓
11. Success/error logged to console
```

### Authentication Flow

```typescript
// On Sign-In (Auth.tsx):
const response = await authService.signIn(username, password);
setAuthToken(response.AuthenticationResult.IdToken);

// On App Startup (App.tsx):
await authService.getCurrentSession();
initializeDatabaseAuth(); // Gets token from localStorage

// In Main Process (main.ts):
ipcMain.on("set-auth-token", (_, token) => {
	databaseService.setAuthToken(token);
});
```

### Score Saving Flow

```typescript
// When tracking starts (main.ts):
ipcMain.on("start-session", async () => {
	// ... start tracking logic

	try {
		await databaseService.saveScore(420);
		console.log("✅ Dummy score of 420 saved successfully!");
	} catch (error) {
		console.error("❌ Failed to save dummy score:", error.message);
	}
});
```

## API Methods Available

### In Renderer Process

```typescript
import { setAuthToken, fetchScore, updateScore, initializeDatabaseAuth } from "./utils/database";

// Initialize on app startup (done automatically in App.tsx)
initializeDatabaseAuth();

// Fetch current score
const score = await fetchScore();

// Update score (add to existing)
await updateScore(50);

// Manually set auth token
setAuthToken("your-jwt-token");
```

### In Main Process

```typescript
import { databaseService } from "./services/database";

// Set auth token
databaseService.setAuthToken(token);

// Save score (overwrite)
await databaseService.saveScore(420);

// Fetch score
const score = await databaseService.fetchScore();

// Update score (add to existing)
await databaseService.updateScore(50);
```

## Required AWS Infrastructure

### 1. DynamoDB Table

```yaml
Table Name: user_scores
Primary Key: user_id (String)
Attributes:
    - user_id: String (Cognito sub)
    - score: Number
    - timestamp: Number
    - updated_at: Number
```

### 2. API Gateway Endpoints

```
POST   /save_score   - Save/overwrite user score
GET    /get_score    - Fetch current user score
PUT    /update_score - Add to existing score
```

### 3. Cognito Authorizer

-   Validates JWT tokens from Authorization header
-   Extracts user_id from token claims (sub)
-   Passes user_id to Lambda in requestContext

### 4. Lambda Functions

Three Lambda functions to handle the API endpoints (see DATABASE_SETUP.md for full code)

## Configuration Required

### 1. Set API Gateway URL

In `electron/services/database.ts`:

```typescript
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "https://your_api_gateway_url";
```

Or in `.env` file:

```
API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
```

### 2. Deploy Lambda Functions

Deploy the three Lambda functions provided in DATABASE_SETUP.md

### 3. Configure API Gateway

-   Set up Cognito authorizer
-   Enable CORS
-   Deploy API

## Testing

### Quick Test

1. **Start the app** and sign in
2. **Check console** for: `🔑 Auth token sent to main process`
3. **Start a focus session** from Dashboard
4. **Check console** for:
    ```
    💾 Attempting to save dummy score of 420 to database...
    ✅ Dummy score of 420 saved successfully!
    ```
5. **Check DynamoDB** to verify score was saved

### Manual Test from Console

Open Electron DevTools Console:

```javascript
// Test fetching score
const score = await window.ipcRenderer.invoke("fetch-score");
console.log("Score:", score);

// Test updating score
const result = await window.ipcRenderer.invoke("update-score", 100);
console.log("Update result:", result);
```

## Console Log Messages

### Success Messages

-   `🔑 Auth token sent to main process` - Token successfully sent
-   `🔑 Database auth initialized with existing session` - Auth initialized on startup
-   `💾 Attempting to save dummy score of 420 to database...` - Save attempt started
-   `✅ Dummy score of 420 saved successfully!` - Score saved to database
-   `✅ Score fetched successfully: 420` - Score retrieved from database

### Error Messages

-   `❌ Failed to save dummy score: [error]` - Score save failed
-   `❌ Failed to fetch score: [error]` - Score fetch failed
-   `⚠️ No Cognito tokens found in localStorage` - User not authenticated
-   `⚠️ IPC not available - running in browser mode` - Not in Electron environment

## Next Steps

1. **Set up AWS infrastructure** (DynamoDB, API Gateway, Lambda, Cognito Authorizer)
2. **Update API_GATEWAY_URL** in database.ts
3. **Test the integration** with dummy score of 420
4. **Replace dummy score** with real productivity scores (see INTEGRATION_EXAMPLE.md)
5. **Implement additional features**:
    - Score history tracking
    - Leaderboards
    - Achievement system
    - Cloud sync for garden progress

## Security Notes

-   ✅ JWT tokens used for authentication
-   ✅ Cognito authorizer validates all requests
-   ✅ User ID extracted from secure token claims
-   ✅ No credentials stored in code
-   ✅ CORS properly configured
-   ⚠️ Remember to use HTTPS for API Gateway
-   ⚠️ Don't commit API Gateway URLs to public repos
-   ⚠️ Keep Lambda IAM roles restricted to minimum permissions

## Troubleshooting

See **DATABASE_SETUP.md** for detailed troubleshooting steps.

Common issues:

-   Token not available: Make sure user is signed in first
-   API Gateway errors: Check CORS and Cognito authorizer configuration
-   Lambda errors: Check CloudWatch logs for detailed error messages
-   Network errors: Verify API Gateway URL is correct and accessible

## Support

For issues or questions:

1. Check console logs for specific error messages
2. Review DATABASE_SETUP.md troubleshooting section
3. Check CloudWatch logs for Lambda function errors
4. Verify DynamoDB table exists and has correct schema
5. Test API Gateway endpoints directly with tools like Postman
