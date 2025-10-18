# Setup Checklist ✓

Use this checklist to verify your Productivity Garden installation and configuration.

## Installation Verification

### Step 1: Dependencies

```bash
cd my-app
npm install
```

**Verify:**

-   [ ] No error messages during install
-   [ ] `node_modules/` directory created
-   [ ] `tesseract.js` and `active-win` installed

### Step 2: Development Build

```bash
npm run dev
```

**Verify:**

-   [ ] Vite dev server starts
-   [ ] Electron window opens
-   [ ] No console errors (check DevTools)
-   [ ] App displays with sidebar navigation

### Step 3: UI Components

**Dashboard:**

-   [ ] Score circle displays (may show 0 initially)
-   [ ] Metrics cards visible (Focus, Activity, Context)
-   [ ] Recent Activity section appears

**Goals:**

-   [ ] "Add Goal" button works
-   [ ] Can create a new goal
-   [ ] Goal appears in list
-   [ ] Can delete goal

**Settings:**

-   [ ] All toggles work
-   [ ] OCR interval input accepts numbers
-   [ ] Settings persist after app restart

**Garden Overlay:**

-   [ ] Toggle "Show Overlay" creates overlay window
-   [ ] Overlay appears in corner of screen
-   [ ] Plants visible (may be small initially)

## Service Verification

### Screen Capture & OCR

**Check:**

-   [ ] No permission errors in console
-   [ ] Settings shows "Screen Capture" enabled
-   [ ] OCR updates appear in console logs

**macOS/Linux:**

-   [ ] Screen recording permission granted
-   [ ] No access denied errors

**Windows:**

-   [ ] No UAC prompts after first run
-   [ ] Screenshot capture works

### Window Tracking

**Check:**

-   [ ] Active window updates in Dashboard signals
-   [ ] App name displayed correctly
-   [ ] Category detection works (productive/neutral/distraction)

**Platform-Specific:**

-   [ ] **macOS**: Accessibility permission granted
-   [ ] **Linux**: `xdotool` or `wmctrl` installed
-   [ ] **Windows**: Works without extra permissions

### Input Tracking

**Check:**

-   [ ] Keyboard events counted (not content)
-   [ ] Mouse movement tracked (distance only)
-   [ ] Idle detection works

**Test:**

1. Type in any window → KPM should increase
2. Move mouse → Movement distance should increase
3. Stop interacting → Idle time should increase

### Productivity Engine

**Check:**

-   [ ] Score updates periodically
-   [ ] Score changes with activity
-   [ ] Events appear in Recent Activity
-   [ ] Score reflects productivity accurately

**Test:**

1. Work in productive app → Score should increase
2. Idle for 2+ minutes → Score should decrease
3. Switch to distraction app → Score should decrease

## Data Persistence

### Settings

**Test:**

1. Change a setting (e.g., OCR interval)
2. Close and restart app
3. [ ] Setting persists

### Goals

**Test:**

1. Create a goal
2. Close and restart app
3. [ ] Goal still exists

### Events

**Test:**

1. Generate some events (work for 5+ minutes)
2. Close and restart app
3. [ ] Events appear in Recent Activity

## Privacy Features

### Data Export

**Test:**

1. Go to Settings → Data Management
2. Click "Export Data"
3. [ ] JSON file downloads
4. [ ] File contains settings, goals, events

### Data Deletion

**Test:**

1. Go to Settings → Data Management
2. Click "Delete All Data"
3. Confirm deletion
4. [ ] All data cleared
5. [ ] App resets to defaults

### Excluded Apps

**Test:**

1. Settings → Privacy → Excluded Apps
2. Add your browser to excluded list
3. [ ] Browser window not tracked
4. [ ] Console shows "Skipping excluded app"

## Production Build

### Build Test

```bash
npm run build
```

**Verify:**

-   [ ] No TypeScript errors
-   [ ] `dist/` directory created
-   [ ] `dist-electron/` directory created
-   [ ] Build completes successfully

### Packaging Test

```bash
npm run pack
```

**Verify:**

-   [ ] Packaging completes
-   [ ] `release/` directory created
-   [ ] Unpacked app folder exists
-   [ ] Can run packaged app

### Distribution Test

```bash
npm run dist
```

**Verify:**

-   [ ] Installer created in `release/`
-   [ ] **Windows**: `.exe` installer exists
-   [ ] **macOS**: `.dmg` or `.zip` exists
-   [ ] **Linux**: `.AppImage` or `.deb` exists

## Platform-Specific Checks

### macOS

**Permissions:**

-   [ ] Screen Recording (System Preferences → Security & Privacy)
-   [ ] Accessibility (for window tracking)
-   [ ] App runs on first launch without crashes

**Code Signing (Optional):**

-   [ ] Developer ID set in package.json
-   [ ] Notarization configured (for distribution)

### Windows

**Permissions:**

-   [ ] No antivirus false positives
-   [ ] App starts without admin prompt
-   [ ] Screen capture works

**Installer:**

-   [ ] NSIS installer runs
-   [ ] Desktop shortcut created
-   [ ] Start menu entry created

### Linux

**Dependencies:**

```bash
# Ubuntu/Debian
sudo apt install xdotool wmctrl

# Arch
sudo pacman -S xdotool wmctrl
```

**Verify:**

-   [ ] Dependencies installed
-   [ ] Window tracking works
-   [ ] AppImage is executable

## Common Issues & Solutions

### ❌ "Cannot find module 'active-win'"

**Solution:**

```bash
npm install active-win@latest
```

### ❌ "Screen capture failed"

**macOS:**

-   Grant Screen Recording permission
-   Restart app

**Linux:**

-   Check Wayland vs X11
-   Install required tools

### ❌ "OCR not working"

**Solution:**

1. Check Settings → Screen Capture is ON
2. Verify no permission errors
3. Increase OCR interval if CPU usage high
4. Check console for tesseract errors

### ❌ "High CPU usage"

**Solution:**

1. Increase OCR interval to 60+ seconds
2. Disable screen capture if not needed
3. Close other heavy applications

### ❌ "Build fails"

**Solution:**

```bash
rm -rf node_modules dist dist-electron
npm install
npm run build
```

### ❌ "TypeScript errors"

**Solution:**

```bash
npx tsc --noEmit
# Fix errors shown
```

## Performance Benchmarks

### Expected Resource Usage

**Idle (no tracking):**

-   CPU: < 1%
-   Memory: 100-150 MB

**Active (all tracking):**

-   CPU: 2-5%
-   Memory: 150-250 MB

**During OCR:**

-   CPU: 10-30% (brief spike)
-   Memory: 200-300 MB

**If higher:**

-   Increase OCR interval
-   Disable unused features
-   Check for memory leaks

## Final Verification

### Complete Workflow Test

1. [ ] Start app
2. [ ] Create a productivity goal
3. [ ] Enable all telemetry
4. [ ] Work for 10 minutes in productive app
5. [ ] Check score increases
6. [ ] Check events appear
7. [ ] Enable garden overlay
8. [ ] See plants grow
9. [ ] Export data successfully
10. [ ] Settings persist across restarts

### Documentation Review

-   [ ] README.md read and understood
-   [ ] QUICKSTART.md followed
-   [ ] Privacy policy understood
-   [ ] Know how to disable telemetry
-   [ ] Know where data is stored

## Ready for Use? ✅

If all checkboxes are checked, you're ready to start tracking your productivity!

### Next Steps

1. **Customize**: Adjust settings to your preferences
2. **Set Goals**: Create realistic productivity goals
3. **Monitor**: Track your score over time
4. **Iterate**: Adjust based on what works for you

### Support

If any checks failed:

-   Review error messages
-   Check platform-specific requirements
-   Consult DEVELOPMENT.md for debugging
-   Open an issue on GitHub

---

**Happy productive gardening! 🌱**
