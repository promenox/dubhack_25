# 🔍 Debug Guide: Auth Token Flow

## What I Fixed

The issue was that `ipcRenderer` wasn't being properly accessed in the renderer process. Your Electron configuration has `contextIsolation: false` and `nodeIntegration: true`, which means the standard `contextBridge` approach doesn't work as expected.

### Changes Made:

1. **`src/utils/database.ts`** - Fixed IPC access with a helper function that tries multiple methods
2. **`src/components/Auth.tsx`** - Added detailed logging to track token extraction
3. **`electron/main.ts`** - Enhanced logging when token is received
4. **`electron/services/database.ts`** - Added logging when token is stored

## 🧪 How to Test

### Step 1: Restart Your App

```bash
# Kill the current process (Ctrl+C)
# Then restart
npm run dev
```

### Step 2: Open DevTools

When the app starts:

-   Press **F12** or **Ctrl+Shift+I** to open DevTools
-   Go to the **Console** tab

### Step 3: Sign In

Enter your credentials and sign in. You should now see these console logs **in order**:

#### In Renderer Console (DevTools):

```
✅ Sign in successful
📦 Response structure: ["AuthenticationResult", "ChallengeParameters"]
🔑 Found IdToken in response, sending to main process...
🔑 Sending auth token to main process...
🔑 Auth token sent to main process
🔑 Auth token sent to main process for database operations
```

#### In Main Process Console (Terminal/PowerShell):

```
🔑 Main process: Auth token received from renderer
🔑 Main process: Token length: 847
🔑 Database service: Token stored successfully
🔑 Database service: Token preview: eyJraWQiOiJ1VkpLTXE4WEtHZnQ...
✅ Main process: Token stored in database service
```

### Step 4: Start a Focus Session

Click "Start Session" in the Dashboard. You should see:

```
💾 Attempting to save dummy score of 420 to database...
✅ Dummy score of 420 saved successfully!
```

## 🐛 Troubleshooting

### If you see "⚠️ IPC not available - running in browser mode"

This means `ipcRenderer` couldn't be accessed. Try:

1. Make sure you're running in Electron (`npm run dev`), not in a browser
2. Check that the preload script is loading
3. Verify `nodeIntegration: true` in `electron/main.ts`

### If you see "⚠️ No IdToken found in response!"

This means Cognito didn't return a token. Check:

1. Your Cognito configuration
2. The user is confirmed (check email for verification code)
3. Your AWS credentials are correct

### If you see "❌ Failed to save dummy score: Authentication token not available"

This means the token wasn't stored. Check:

1. Did you see the "Token stored successfully" log?
2. Try adding a small delay before starting the session
3. Check if there's an error in the IPC handler

## 📊 Expected Complete Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Signs In                                        │
│    → Auth.tsx calls authService.signIn()                │
│    → Cognito returns tokens                             │
│    → ✅ Sign in successful                              │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ 2. Extract Token                                        │
│    → Check response.AuthenticationResult.IdToken        │
│    → 🔑 Found IdToken in response                       │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ 3. Send to Main Process                                 │
│    → getIpcRenderer() finds ipcRenderer                 │
│    → ipcRenderer.send("set-auth-token", token)          │
│    → 🔑 Auth token sent to main process                 │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ 4. Main Process Receives                                │
│    → IPC handler triggered                              │
│    → 🔑 Main process: Auth token received               │
│    → databaseService.setAuthToken(token)                │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ 5. Store in Database Service                            │
│    → this.authToken = token                             │
│    → 🔑 Database service: Token stored successfully     │
│    → ✅ Main process: Token stored in database service  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ 6. Start Focus Session                                  │
│    → User clicks "Start Session"                        │
│    → databaseService.saveScore(420)                     │
│    → Token is available!                                │
│    → ✅ Dummy score of 420 saved successfully!          │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Quick Verification Checklist

-   [ ] Restart the app with `npm run dev`
-   [ ] Open DevTools console (F12)
-   [ ] Sign in with valid credentials
-   [ ] See "✅ Sign in successful" in renderer console
-   [ ] See "🔑 Auth token sent to main process" in renderer console
-   [ ] See "🔑 Main process: Auth token received" in terminal
-   [ ] See "✅ Main process: Token stored" in terminal
-   [ ] Start a focus session
-   [ ] See "✅ Dummy score of 420 saved successfully!" in terminal

If all checkboxes pass, your auth token flow is working! 🎉

## 💡 Where to Look

**Renderer Logs** (F12 DevTools Console):

-   Sign in success/failure
-   Token extraction
-   IPC availability

**Main Process Logs** (Terminal/PowerShell):

-   Token received
-   Token stored
-   Database operations
-   Score saving

Both consoles show different parts of the system, so keep both open during testing!
