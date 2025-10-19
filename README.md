# FocusAI - DubHacks 2025 Project 🎯🌱

## What We Built

**FocusAI** is an intelligent desktop productivity companion that helps you maintain focus through:

-   🔍 **Smart Activity Tracking** - Non-intrusive monitoring every 5 seconds
-   📊 **Hybrid Scoring System** - Rule-based + AI-powered context understanding
-   🌱 **Gamified Progress** - Grow a digital garden through consistent focus
-   🤖 **AI Insights** - Personalized summaries and suggestions every 30 minutes

## Quick Start

### Running the App

```bash
cd my-app
npm install
npm run dev
```

The app will launch and automatically start tracking your activity!

### First-Time Setup

1. **Welcome Tutorial** - Complete the 5-slide onboarding
2. **Set Your Goal** - Define what you're working on
3. **Optional: Add AI** - Enter OpenAI API key in settings for smarter insights
4. **Start Working!** - Minimize the app and focus on your task

## Project Structure

```
dubhack_25/
├── my-app/                    # Main Electron + React app
│   ├── src/
│   │   ├── components/        # React UI components
│   │   ├── services/          # Core business logic
│   │   ├── hooks/             # State management
│   │   └── types/             # TypeScript definitions
│   ├── electron/              # Electron main/preload
│   ├── README.md              # User documentation
│   ├── QUICKSTART.md          # Quick start guide
│   └── PROJECT_OVERVIEW.md    # Technical deep-dive
└── README.md                  # This file
```

## Key Features

### 1. Activity Tracking

-   Monitors active application and window titles
-   Counts keystrokes (not content!)
-   Detects idle time
-   No screenshots or intrusive data collection

### 2. Scoring System

**Base Score (0-100)** calculated from:

-   Keyboard activity (35%)
-   Focus consistency - fewer app switches (40%)
-   Active time vs idle time (25%)

**AI Multiplier (0.5x-1.5x)** refines the score by understanding:

-   Whether activity aligns with your goal
-   Context (e.g., YouTube tutorial = productive)
-   Patterns indicating distraction

### 3. Garden Visualization

Your focus garden grows through 7 stages:

1. 🟤 Soil
2. 🌰 Seed
3. 🌱 Sprout
4. 🌿 Seedling
5. 🪴 Growing
6. 🌻 Blooming
7. 🌺✨ Flourishing

**Growth Points:** Score 75+ = 7-10 points per window (100 points per stage)

### 4. AI-Powered Insights

Every 30 minutes you receive:

-   Overall focus feedback
-   Top 3 activities
-   Personalized suggestions

**Works without AI too!** Falls back to intelligent rule-based scoring.

## Tech Stack

-   **Frontend:** React 18 + TypeScript
-   **Desktop:** Electron 30
-   **Build:** Vite 5
-   **AI:** OpenAI GPT-4o-mini (optional)
-   **Styling:** Modular CSS-in-JS (inline styles)

## Documentation

-   **`my-app/README.md`** - Comprehensive user guide
-   **`my-app/QUICKSTART.md`** - Quick reference and tips
-   **`my-app/PROJECT_OVERVIEW.md`** - Technical architecture and design decisions

## How It Works

### The 3-Minute Window System

1. **Every 5 seconds:** Capture activity snapshot
2. **After 3 minutes:** Aggregate 36 snapshots
3. **Calculate:** Base score from metrics
4. **Refine:** AI multiplier for context
5. **Update:** Scores, garden, and UI
6. **Repeat!**

### Data Privacy

✅ All data stays on your device (localStorage)  
✅ No screenshots or keystroke content  
✅ Only metadata (app names, titles, counts)  
✅ Optional AI calls send anonymous summaries

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Production Build

```bash
cd my-app
npm run build
```

This creates a distributable Electron app in the `dist/` folder.

## Configuration

### Adding OpenAI API Key

1. Click ⚙️ settings button (bottom-right)
2. Enter your API key from [platform.openai.com](https://platform.openai.com/api-keys)
3. Save

**Cost Estimate:** ~10-20 API calls per hour = $0.01-0.02/hour with GPT-4o-mini

### Without API Key

FocusAI uses intelligent rule-based scoring:

-   App-based heuristics (productive vs distracting)
-   Pattern detection (deep focus, high switching, etc.)
-   Goal keyword matching

## Future Improvements

-   [ ] Cross-platform window detection (`active-win` package)
-   [ ] Pause/resume tracking
-   [ ] Export data (JSON/CSV)
-   [ ] Keyboard shortcuts
-   [ ] Weekly/monthly analytics
-   [ ] Custom scoring weights
-   [ ] Pomodoro timer integration

## Known Limitations

1. **Window Detection:** Uses Electron window info as placeholder. Production needs native window detection.
2. **API Key Storage:** Stored in localStorage (should be encrypted).
3. **Desktop Only:** Electron = no mobile support.

## Team & Credits

Built for **DubHacks 2025**

**Technologies:**

-   Electron (desktop framework)
-   React (UI library)
-   TypeScript (type safety)
-   Vite (build tool)
-   OpenAI (AI integration)

## License

Open source - built for the hackathon community!

---

## Getting Help

-   **Setup Issues?** Check `my-app/README.md` troubleshooting section
-   **Want to Contribute?** See `my-app/PROJECT_OVERVIEW.md` for architecture details
-   **Quick Tips?** Read `my-app/QUICKSTART.md`

## Screenshots

### Main Dashboard

-   Left: Goal Setting + Garden Visualization
-   Right: Focus Scores + AI Summary
-   Bottom Right: Settings Button

### Components

-   **Garden:** Beautiful gradient card with animated plant growth
-   **FocusScore:** Dual circular progress indicators
-   **AISummary:** Dark-themed feedback card
-   **GoalSetting:** Purple gradient with category icons
-   **Settings:** Modal overlay with API key input
-   **Welcome:** 5-slide onboarding experience

---

**Start focusing and watch your garden grow! 🌱**
