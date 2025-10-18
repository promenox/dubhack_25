# Quick Start Guide 🚀

Get up and running with Productivity Garden in 5 minutes!

## Installation

### Step 1: Install Dependencies

```bash
cd my-app
npm install
```

This will install:

-   Electron 30+
-   React 18
-   TypeScript
-   Tesseract.js (OCR)
-   active-win (window tracking)
-   All build tools

### Step 2: Start Development

```bash
npm run dev
```

The app will launch in development mode with:

-   Hot reload for both main and renderer processes
-   DevTools automatically opened
-   Full error reporting

### Step 3: Explore the App

1. **Dashboard** - View your real-time productivity score
2. **Goals** - Create your first productivity goal
3. **Settings** - Configure telemetry and privacy options
4. **Garden Overlay** - Enable the floating garden widget

## First-Time Setup

### Configure Telemetry (Recommended)

1. Open **Settings**
2. Review enabled tracking features:
    - ✅ **Screen Capture & OCR** - Detects focused content
    - ✅ **Window Tracking** - Identifies productive apps
    - ✅ **Input Tracking** - Measures activity levels
3. Adjust OCR interval (default: 30 seconds)

### Set Your First Goal

1. Navigate to **Goals**
2. Click **"+ Add Goal"**
3. Choose goal type:
    - **Daily Score** - Target productivity score for today
    - **Weekly Hours** - Total productive hours this week
    - **Focus Sessions** - Number of deep work sessions
4. Set target value and create

### Enable the Garden Overlay

1. Go to **Settings** → **Garden Overlay**
2. Toggle **"Show Overlay"** to ON
3. A floating garden will appear on your desktop
4. Plants grow as your productivity increases!

## Understanding Your Score

Your productivity score (0-100) combines:

-   **Focus Score (40%)** - Based on screen content analysis
-   **Activity Score (30%)** - Based on keyboard/mouse activity
-   **Context Score (30%)** - Based on active application

### Score Ranges

-   **80-100** 🌸 Excellent - Garden flourishes with flowers
-   **60-79** 🌱 Good - Plants growing steadily
-   **40-59** 🍃 Fair - Young sprouts emerging
-   **20-39** 🌾 Low - Seeds just planted
-   **0-19** 💧 Very Low - Needs attention

## Privacy & Permissions

### macOS

**Required Permissions:**

1. **Screen Recording** - For screen capture/OCR
2. **Accessibility** - For window tracking

Grant in: System Preferences → Security & Privacy → Privacy

### Windows

**May require:**

-   Administrator access for first run
-   Windows Defender exclusion if flagged

### Linux

**Dependencies:**

-   `xdotool` or `wmctrl` for window tracking (X11)
-   Screen recording permissions (Wayland)

```bash
# Ubuntu/Debian
sudo apt install xdotool wmctrl

# Arch
sudo pacman -S xdotool wmctrl
```

## Building for Production

### Create Installer

```bash
# Build for current platform
npm run build

# Create distributable
npm run dist
```

**Output:** `release/` directory contains installers

### Platform-Specific Builds

```bash
# Windows
npm run dist -- --win

# macOS
npm run dist -- --mac

# Linux
npm run dist -- --linux
```

## Tips for Best Experience

### 1. Optimize Performance

-   **Increase OCR interval** if CPU usage is high
-   **Disable unused features** in Settings
-   **Close overlay** when not needed

### 2. Maximize Accuracy

-   **Use productive apps** (IDEs, docs, terminals)
-   **Keep focused content visible** on screen
-   **Maintain steady activity** (not too fast/slow)

### 3. Privacy First

-   **Review excluded apps** - add personal/sensitive apps
-   **Export data regularly** - for backup
-   **Adjust retention** - default is 30 days

### 4. Goal Setting

Start with achievable goals:

-   **Daily Score:** 60-70 (not 100!)
-   **Focus Sessions:** 3-5 per day
-   **Weekly Hours:** 20-30 productive hours

## Troubleshooting

### App Won't Start

```bash
# Clear cache and rebuild
rm -rf node_modules dist dist-electron
npm install
npm run dev
```

### OCR Not Working

1. Check screen recording permissions
2. Verify Settings → Screen Capture is ON
3. Try manual capture: Settings → Capture Screen Now

### Low Score Despite Working

-   OCR interval might be too long
-   Working in excluded apps
-   Content not recognized as "focused"

### High CPU Usage

1. Increase OCR interval to 60+ seconds
2. Disable screen capture temporarily
3. Close other heavy applications

## Next Steps

-   📖 Read the full [README.md](./README.md)
-   🎨 Customize scoring weights
-   🤖 Explore ML integration options
-   🌐 Join the community (if available)

## Support

-   **Issues:** Open on GitHub
-   **Questions:** Check README.md
-   **Privacy:** All data stored locally, review Settings

---

**Welcome to Productivity Garden! 🌱**

_Start small, stay consistent, watch your garden grow._
