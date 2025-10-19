# 🚀 Database Integration - Quick Start

## What You Need to Do

### Step 1: Create `.env` file

```bash
# In the focal/ directory, create .env:
API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
```

### Step 2: Set Up AWS (One Time)

1. **Create DynamoDB Table**

    - Table name: `user_scores`
    - Primary key: `user_id` (String)

2. **Create API Gateway**

    - REST API with Cognito Authorizer
    - Three endpoints (see DATABASE_SETUP.md for Lambda code):
        - POST `/save_score`
        - GET `/get_score`
        - PUT `/update_score`

3. **Deploy & Test**
    - Deploy API Gateway
    - Copy invoke URL to `.env`

### Step 3: Test It!

```bash
# Run the app
npm run dev

# Sign in → Start Session → Check console for:
✅ Dummy score of 420 saved successfully!
```

## That's It!

The app will now save a score of **420** every time you start a focus session.

## What Happens Automatically

✅ Auth token sent to main process on sign-in  
✅ Token initialized on app startup  
✅ Score saved when session starts  
✅ All errors logged to console

## Change Dummy Score to Real Score

In `electron/main.ts`, line 538:

```typescript
// Change this:
await databaseService.saveScore(420);

// To this:
const score = Math.round(this.focusAI.cumulativeScore);
await databaseService.saveScore(score);
```

## Files You Need to Know

-   `DATABASE_SETUP.md` - Full AWS setup with Lambda code
-   `DATABASE_README.md` - Complete guide
-   `INTEGRATION_EXAMPLE.md` - Real score examples

## Quick Test Console Commands

```javascript
// In Electron DevTools Console:

// Fetch score
await window.ipcRenderer.invoke("fetch-score");

// Update score
await window.ipcRenderer.invoke("update-score", 100);
```

## Troubleshooting

| Problem                              | Solution                         |
| ------------------------------------ | -------------------------------- |
| "Authentication token not available" | Sign in first                    |
| "Failed to save score"               | Check API_GATEWAY_URL in .env    |
| No logs appear                       | Open DevTools console            |
| Network error                        | Check internet & API Gateway URL |

## Environment Variables Needed

```env
API_GATEWAY_URL=https://xxx.execute-api.region.amazonaws.com/prod
```

---

**Need more help?** See `DATABASE_README.md` for the complete guide!
