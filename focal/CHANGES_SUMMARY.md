# Summary of Changes - Global Keystroke Tracking

## What Was Changed

### 1. **focus-tracker.ts** (`focal/electron/focus-tracker.ts`)

-   Implemented global keystroke tracking using `uiohook-napi`
-   Added system-wide keyboard event listener that works even when app is minimized
-   Added global mouse movement tracking
-   Fallback to window-specific tracking if global hook fails to initialize
-   Better error handling and user-friendly console messages

### 2. **main.ts** (`focal/electron/main.ts`)

-   Updated window-specific keystroke tracking to only work as fallback when global hook is not active
-   This prevents double-counting keystrokes
-   Both main window and overlay window now check if global hook is active before counting keystrokes

### 3. **package.json** (`focal/package.json`)

-   Added `electron-rebuild` as a devDependency for rebuilding native modules
-   Added `rebuild` script: `npm run rebuild`
-   Added `postinstall` script to automatically rebuild native dependencies

### 4. **Documentation**

-   Created `KEYSTROKE_TRACKING_SETUP.md` with comprehensive setup instructions
-   Includes platform-specific setup guides (macOS, Windows, Linux)
-   Troubleshooting section for common issues
-   Privacy & security information

## How It Works

1. **On App Start**: The FocusTracker tries to initialize the global input hook using `uiohook-napi`
2. **Success**: If successful, keystrokes are tracked system-wide, even when the app is minimized
3. **Failure**: If the global hook fails (e.g., due to missing permissions), the app falls back to window-specific tracking
4. **Tracking**: Keystrokes are counted but NOT recorded (we only track the count, not what you type)
5. **Consumption**: Every 3 seconds, the keystroke count is consumed and added to the current activity window

## How to Test

### Before Testing

Make sure you've completed the setup:

```bash
cd focal
npm install  # Already done ✅
```

### Testing Steps

1. **Start the app**:

    ```bash
    npm run dev
    ```

2. **Check the console** for this message:

    ```
    ✅ Global keystroke tracking initialized successfully
    ```

    If you see this, great! If you see an error about permissions:

    - **macOS**: Follow the instructions in `KEYSTROKE_TRACKING_SETUP.md` to grant Accessibility Permissions
    - **Windows**: Check if antivirus is blocking the app

3. **Start a focus session** in the app

4. **Minimize the app** or switch to another application

5. **Type something** in another app (e.g., Notepad, browser, terminal)

6. **Switch back to the app** and check:

    - The keystroke counter should have increased
    - Console should show logs like: `✓ Global keypress detected: 10 total`

7. **Without global tracking**: If the global hook failed, you'll see:
    ```
    ✗ Global key hook failed to start
    ```
    In this case, keystrokes will only be tracked when the app is in focus (fallback mode).

## Important Notes

### macOS Users

-   You MUST grant Accessibility Permissions for global tracking to work
-   The app will try to open System Preferences automatically if permissions are missing
-   After granting permissions, restart the app

### Windows Users

-   Should work out of the box on most systems
-   Some antivirus software may block the global hook
-   If blocked, add the app to your antivirus whitelist

### Privacy

-   We only track keystroke COUNTS, not what you type
-   All data is stored locally
-   Nothing is sent to external servers except anonymized metadata for AI analysis

## What Changed vs What Stayed the Same

### Changed ✨

-   Keystroke tracking now works globally (system-wide)
-   Works even when app is minimized
-   More reliable tracking

### Stayed the Same ✅

-   Privacy: Still only tracking counts, not content
-   Local storage: All data still stored locally
-   UI/UX: No changes to the user interface
-   Performance: Minimal overhead (same as before)

## Need Help?

Refer to `KEYSTROKE_TRACKING_SETUP.md` for detailed setup instructions and troubleshooting.
