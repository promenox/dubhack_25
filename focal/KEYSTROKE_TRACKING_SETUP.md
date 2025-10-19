# Global Keystroke Tracking Setup Guide

This guide will help you set up global keystroke tracking for Focal, which allows the app to track your activity even when it's minimized or not in focus.

## What Changed

We've implemented global keystroke tracking using `uiohook-napi`, a cross-platform input hook library. This means Focal can now track your keystrokes and mouse movements system-wide, not just when the app is in focus.

## Setup Instructions

### 1. Install Dependencies

First, make sure all dependencies are installed:

```bash
cd focal
npm install
```

### 2. Rebuild Native Modules

The `uiohook-napi` library is a native Node.js addon that needs to be rebuilt for your specific Electron version:

```bash
npm run rebuild
```

This command rebuilds the native module to be compatible with Electron 30.

### 3. Platform-Specific Setup

#### macOS

On macOS, you need to grant **Accessibility Permissions** to the app:

1. Open **System Preferences** (or **System Settings** on macOS 13+)
2. Go to **Security & Privacy** → **Privacy** → **Accessibility**
3. Click the lock icon to make changes (you'll need to enter your password)
4. Click the **+** button to add the app
5. Navigate to your Focal app and add it to the list
6. Make sure the checkbox next to the app is **enabled**
7. Restart the app

**Alternative**: The app will automatically attempt to open this settings page when it detects permission issues.

#### Windows

On Windows, the app should work out of the box. However, some antivirus software may flag the keystroke tracking as suspicious. If you encounter issues:

1. Add the app to your antivirus whitelist
2. Run the app as Administrator (if necessary)

#### Linux

On Linux, make sure you have the required X11 libraries installed:

```bash
# Ubuntu/Debian
sudo apt-get install libx11-dev libxtst-dev libxkbcommon-dev

# Fedora/RHEL
sudo dnf install libX11-devel libXtst-devel libxkbcommon-devel

# Arch
sudo pacman -S libx11 libxtst libxkbcommon
```

Then rebuild the native module:

```bash
npm run rebuild
```

## How to Test

1. Start the app:

    ```bash
    npm run dev
    ```

2. Check the console logs for successful initialization:

    ```
    ✅ Global keystroke tracking initialized successfully
    ```

3. Minimize the app or switch to another application
4. Type something in another app
5. Switch back to Focal and check the keystroke counter - it should have increased even while the app was minimized

## Troubleshooting

### "Global key hook failed to start"

**On macOS:**

-   Ensure you've granted Accessibility Permissions (see step 3 above)
-   Restart the app after granting permissions
-   Try opening Terminal and granting it Accessibility Permissions first

**On Windows:**

-   Check if your antivirus is blocking the app
-   Try running as Administrator
-   Rebuild the native module: `npm run rebuild`

**On Linux:**

-   Ensure all required X11 libraries are installed
-   Check if your desktop environment has security restrictions
-   Rebuild the native module: `npm run rebuild`

### Keystrokes Only Tracked When App is in Focus

If keystrokes are only tracked when the app is in focus, it means the global hook failed to initialize. The app falls back to window-specific tracking in this case.

**Solutions:**

1. Check the console logs for error messages
2. Grant the necessary permissions (see Platform-Specific Setup above)
3. Rebuild the native module: `npm run rebuild`
4. Restart the app

### Build Errors with `uiohook-napi`

If you encounter build errors:

1. Make sure you have the proper build tools installed:

    - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
    - **Windows**: Visual Studio Build Tools or Visual Studio with C++ support
    - **Linux**: `build-essential` package

2. Clear the node_modules and rebuild:
    ```bash
    rm -rf node_modules package-lock.json
    npm install
    npm run rebuild
    ```

## Privacy & Security

-   **What data is tracked?** Only keystroke counts and mouse movement counts. We do NOT record what keys you press or what you type.
-   **Where is data stored?** All data is stored locally on your machine. Nothing is sent to external servers except for AI analysis (which only includes metadata like app names and window titles, not keystroke content).
-   **Can I disable it?** The tracking only runs when you start a focus session. Stop the session to stop tracking.

## Technical Details

-   The global hook is implemented in `focal/electron/focus-tracker.ts`
-   It uses `uiohook-napi` version 1.5.1
-   Fallback to window-specific tracking if global hook fails
-   Keystrokes are aggregated and consumed every 3 seconds for efficiency

## Support

If you continue to experience issues, please check the console logs and create an issue with:

1. Your operating system and version
2. The complete error message from the console
3. Steps you've already tried
