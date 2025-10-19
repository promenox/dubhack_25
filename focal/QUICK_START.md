# Quick Start - Global Keystroke Tracking

## ✅ What's Done

Your app now has **global keystroke tracking** that works even when the app is minimized! 🎉

## 🚀 Next Steps

### 1. Test It Right Now

```bash
cd focal
npm run dev
```

Then:

1. Check the console for: `✅ Global keystroke tracking initialized successfully`
2. Start a focus session
3. Minimize the app
4. Type in another application
5. Return to the app - keystroke count should have increased!

### 2. If You See Permission Errors (macOS Only)

The console will show instructions to grant Accessibility Permissions. Follow them, then restart the app.

### 3. If You See Build Errors

Run:

```bash
npm run rebuild
```

## 📝 What Changed

-   ✅ Implemented global keystroke tracking using `uiohook-napi`
-   ✅ Works system-wide, even when app is minimized
-   ✅ Automatic fallback if global tracking fails
-   ✅ No double-counting of keystrokes
-   ✅ Native module automatically rebuilt for Electron 30

## 📚 Documentation

-   `CHANGES_SUMMARY.md` - Detailed list of all changes
-   `KEYSTROKE_TRACKING_SETUP.md` - Comprehensive setup guide with troubleshooting

## 🔒 Privacy

We only track keystroke **counts**, not what you type. Your data stays on your machine.

---

**That's it!** Your keystroke tracking should now work globally. 🚀
