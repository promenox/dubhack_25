# FocusAI - Technical Project Overview

## 🎯 Project Summary

FocusAI is an Electron-based desktop application that tracks user productivity through non-intrusive activity monitoring and provides real-time feedback through a gamified "grow-a-garden" interface. The system uses a hybrid scoring approach combining rule-based metrics with optional AI-powered context understanding.

## 🏗️ Architecture

### High-Level Flow

```
User Activity
    ↓
Activity Monitor (every 5s)
    ↓
Activity Snapshots
    ↓
3-Minute Windows
    ↓
Scoring Engine → Base Score (0-100)
    ↓
AI Context Service → Multiplier (0.5x-1.5x)
    ↓
Final Score → Updates UI Components
    ↓
Storage Service → localStorage persistence
```

### Technology Stack

**Frontend:**

-   React 18.2.0 (UI framework)
-   TypeScript 5.2.2 (type safety)
-   Inline CSS-in-JS (modular styling)

**Backend/Desktop:**

-   Electron 30.0.1 (desktop app framework)
-   Node.js IPC (inter-process communication)

**Build Tools:**

-   Vite 5.1.6 (fast dev server + bundler)
-   vite-plugin-electron (Electron integration)
-   electron-builder (production packaging)

**AI Integration:**

-   OpenAI GPT-4o-mini (optional, for context refinement)
-   Fallback to rule-based scoring

## 📁 Project Structure

```
my-app/
├── electron/
│   ├── main.ts                 # Electron main process
│   └── preload.ts              # IPC bridge (secure context isolation)
│
├── src/
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces & types
│   │
│   ├── services/
│   │   ├── activityMonitor.ts  # Track user activity (keyboard, mouse, idle)
│   │   ├── scoringEngine.ts    # Calculate base productivity score
│   │   ├── aiContextService.ts # AI refinement + fallback logic
│   │   └── storageService.ts   # localStorage wrapper with data management
│   │
│   ├── components/
│   │   ├── Garden.tsx          # Plant visualization (7 growth stages)
│   │   ├── FocusScore.tsx      # Dual score display (instant + cumulative)
│   │   ├── AISummary.tsx       # 30-min AI feedback component
│   │   ├── GoalSetting.tsx     # Goal creation & editing interface
│   │   ├── Settings.tsx        # Configuration modal (API key, etc.)
│   │   └── WelcomeOverlay.tsx  # First-time user onboarding
│   │
│   ├── hooks/
│   │   └── useFocusAI.ts       # Main orchestration hook (state management)
│   │
│   ├── App.tsx                 # Main app layout
│   ├── App.css                 # Global styles & animations
│   ├── index.css               # Base CSS resets
│   └── main.tsx                # React entry point
│
├── dist-electron/              # Compiled Electron files (generated)
├── public/                     # Static assets
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── README.md                   # User documentation
├── QUICKSTART.md               # Quick start guide
└── PROJECT_OVERVIEW.md         # This file
```

## 🔧 Core Systems

### 1. Activity Monitoring System

**File:** `src/services/activityMonitor.ts`

**Purpose:** Tracks user activity in the renderer process

**Key Features:**

-   Keyboard event listener (counts keystrokes)
-   Mouse movement/click listener (updates last activity time)
-   Idle detection (30-second threshold)
-   Snapshot generation every 5 seconds

**Data Collected:**

```typescript
interface ActivitySnapshot {
	timestamp: number;
	appName: string; // From Electron IPC
	windowTitle: string; // From Electron IPC
	keystrokeCount: number; // Cumulative since last snapshot
	isIdle: boolean; // Based on activity threshold
}
```

**Privacy:** Only metadata is collected—no actual keystroke content or screenshots.

### 2. Scoring Engine

**File:** `src/services/scoringEngine.ts`

**Purpose:** Calculate base productivity score from activity metrics

**Scoring Algorithm:**

```
Base Score (0-100) =
  (Keystroke Score × 0.35) +
  (Focus Consistency Score × 0.40) +
  (Active Time Score × 0.25)
```

**Components:**

1. **Keystroke Score**: Higher activity = higher engagement
    - Threshold: 200 keystrokes per 3 minutes = 100%
2. **Focus Consistency Score**: Fewer app switches = better focus
    - Penalty increases with switch count
    - Threshold: 10+ switches = major penalty
3. **Active Time Score**: Active vs. idle ratio
    - Direct proportional calculation

**Pattern Detection:**

-   `high_switching`: >8 app switches
-   `deep_focus`: Single app + high keystrokes
-   `mostly_idle`: Idle time > active time
-   `passive_viewing`: Low keystrokes
-   `normal_activity`: Default

### 3. AI Context Service

**File:** `src/services/aiContextService.ts`

**Purpose:** Refine base score using AI or rule-based context

**AI Multiplier Range:** 0.5x (distracted) to 1.5x (highly productive)

**AI Prompt Strategy:**

```
Input:
- User's stated goal
- Current app name + window title
- Base score
- App switch count
- Activity pattern

Output:
{
  "multiplier": 1.2,
  "reasoning": "Activity aligns with goal...",
  "suggestion": "Keep focusing on..."
}
```

**Fallback Logic (No API Key):**

-   Pattern-based adjustments
-   App whitelist/blacklist heuristics
-   Goal keyword matching

**AI Summary Generation:**
Every 30 minutes, generates:

-   Overall feedback (2-3 sentences)
-   Top 3 activities
-   2-3 actionable suggestions

### 4. Storage Service

**File:** `src/services/storageService.ts`

**Purpose:** Manage data persistence using localStorage

**Stored Data:**

-   Activity windows (last 24 hours)
-   User goals (all time)
-   Garden state (current)
-   AI summaries (last 7 days)
-   Settings (API key)

**Data Lifecycle:**

-   Windows: Auto-prune after 24 hours
-   Summaries: Auto-prune after 7 days
-   Goals: Persist indefinitely
-   Garden: Never reset (progressive growth)

### 5. Main Orchestration Hook

**File:** `src/hooks/useFocusAI.ts`

**Purpose:** Central state management and timing orchestration

**Intervals:**

```typescript
SNAPSHOT_INTERVAL = 5000ms      // Capture activity snapshot
WINDOW_DURATION = 180000ms      // Process 3-minute window
VISUAL_UPDATE = 600000ms        // Update garden (~10 min)
SUMMARY_INTERVAL = 1800000ms    // Generate AI summary (30 min)
```

**State Management:**

```typescript
interface AppState {
	currentGoal: UserGoal | null;
	focusScore: FocusScore; // Instant + cumulative
	gardenState: GardenState; // Stage + progress
	currentWindow: ActivityWindow | null;
	recentSummary: AISummary | null;
	isTracking: boolean;
}
```

**Window Processing Flow:**

1. Collect 36 snapshots (5s × 36 = 3 minutes)
2. Aggregate metrics (switches, keystrokes, active/idle time)
3. Calculate base score
4. Request AI refinement
5. Compute final score (base × multiplier)
6. Update focus scores (instant + cumulative)
7. Update garden if 10 minutes elapsed
8. Generate summary if 30 minutes elapsed
9. Save to storage
10. Reset for next window

## 🎨 Component Architecture

### Garden Component

**File:** `src/components/Garden.tsx`

**7 Growth Stages:**

1. 🟤 Soil (0-99 growth points)
2. 🌰 Seed (100-199)
3. 🌱 Sprout (200-299)
4. 🌿 Seedling (300-399)
5. 🪴 Growing (400-499)
6. 🌻 Blooming (500-599)
7. 🌺✨ Flourishing (600+)

**Growth Calculation:**

```typescript
growthPoints = Math.max(0, Math.round(finalScore / 10));
// Score 75 = 7-8 growth points per window
// Score 50 = 5 growth points per window
// Score 25 = 2-3 growth points per window
```

**Visual Features:**

-   Smooth transitions between stages
-   Progress bar (0-100% within current stage)
-   Animation on stage change
-   Last active timestamp

### FocusScore Component

**File:** `src/components/FocusScore.tsx`

**Dual Score Display:**

1. **Instantaneous Score:**

    - Current 3-minute window
    - Updates every 3 minutes
    - Shows trend: 📈 rising / 📉 falling / ➡️ stable
    - Circular progress indicator

2. **Cumulative Score:**
    - Weighted average of recent windows
    - Exponential decay (0.95^n)
    - More stable, less reactive
    - Represents overall session quality

**Color Coding:**

-   Green (75-100): Excellent focus
-   Yellow (50-74): Good focus
-   Red (0-49): Low focus

### AISummary Component

**File:** `src/components/AISummary.tsx`

**States:**

1. Empty: First 30 minutes
2. Generating: Loading spinner
3. Display: Full summary with feedback

**Displayed Data:**

-   Period duration (30 minutes)
-   Average score (color-coded)
-   Top 3 activities
-   AI feedback paragraph
-   2-3 actionable suggestions

### GoalSetting Component

**File:** `src/components/GoalSetting.tsx`

**Features:**

-   Goal title input
-   Category selection (Work, Study, Creative, Other)
-   Edit mode toggle
-   Active goal display with icon
-   Empty state prompt

### Settings Component

**File:** `src/components/Settings.tsx`

**Configuration:**

-   OpenAI API key input (password field)
-   About section
-   System info (update intervals)
-   Floating button (bottom-right)
-   Modal overlay

### WelcomeOverlay Component

**File:** `src/components/WelcomeOverlay.tsx`

**5-Slide Onboarding:**

1. Welcome + overview
2. How scoring works
3. AI enhancement features
4. Garden growth system
5. Ready to begin

**Features:**

-   Skip button
-   Previous/Next navigation
-   Progress dots
-   Auto-dismiss on completion
-   localStorage flag (`focusai_welcome_seen`)

## 🔐 Security & Privacy

### Data Privacy

-   ✅ All data stored locally (localStorage)
-   ✅ No external servers (except optional OpenAI API)
-   ✅ No screenshots or keystroke content
-   ✅ Only metadata collected (app names, window titles)
-   ✅ Clear data lifecycle management

### Electron Security

-   ✅ Context isolation enabled
-   ✅ Node integration disabled in renderer
-   ✅ IPC through preload script only
-   ✅ Sandboxed renderer process

### API Key Security

-   ⚠️ Stored in localStorage (plaintext)
-   🔄 TODO: Encrypt API key with electron-store

## 📊 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    User Activity                         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Activity Monitor (Renderer Process)                     │
│  • Keyboard events                                       │
│  • Mouse events                                          │
│  • Idle detection                                        │
│  • getActiveWindow() via IPC                            │
└────────────────────┬─────────────────────────────────────┘
                     │ Every 5 seconds
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Activity Snapshot                                       │
│  {timestamp, appName, windowTitle, keystrokes, isIdle}   │
└────────────────────┬─────────────────────────────────────┘
                     │ 36 snapshots
                     ▼
┌──────────────────────────────────────────────────────────┐
│  3-Minute Activity Window                                │
│  • Aggregate metrics                                     │
│  • Count app switches                                    │
│  • Sum keystrokes                                        │
│  • Calculate active/idle time                            │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Scoring Engine                                          │
│  Base Score = f(keystrokes, switches, active_time)       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  AI Context Service                                      │
│  Multiplier = AI({goal, app, pattern, base_score})      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Final Score = base_score × multiplier                   │
└────────────────────┬─────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │ Focus  │  │ Garden │  │ Storage  │
    │ Score  │  │ State  │  │ Service  │
    └────────┘  └────────┘  └──────────┘
         │           │           │
         └───────────┼───────────┘
                     ▼
              ┌─────────────┐
              │   React UI  │
              └─────────────┘
```

## 🚀 Development Workflow

### Local Development

```bash
cd my-app
npm install
npm run dev
```

### Building for Production

```bash
npm run build
# Output: dist/ (Electron executable)
```

### Project Scripts

-   `npm run dev` - Vite dev server + Electron
-   `npm run build` - TypeScript compile + Vite build + Electron builder
-   `npm run lint` - ESLint check

## 🔮 Future Enhancements

### High Priority

-   [ ] Cross-platform window detection (`active-win` package)
-   [ ] Pause/resume tracking controls
-   [ ] Export data (JSON/CSV)
-   [ ] Keyboard shortcuts

### Medium Priority

-   [ ] Weekly/monthly analytics
-   [ ] Custom scoring weights
-   [ ] Desktop notifications
-   [ ] Pomodoro timer integration
-   [ ] Multiple goal presets

### Low Priority

-   [ ] Cloud sync (optional)
-   [ ] Team/collaborative features
-   [ ] Plugin system
-   [ ] Dark/light theme toggle

## 🐛 Known Limitations

1. **Window Detection:** Currently uses placeholder data. Production needs `active-win` or similar.
2. **API Key Storage:** Stored in plaintext localStorage. Should use encrypted storage.
3. **Offline AI:** No local LLM support yet. Falls back to rules.
4. **Mobile:** Electron = desktop only. Would need separate React Native app.
5. **Accessibility:** Basic keyboard navigation needs improvement.

## 📈 Performance Considerations

**Memory Usage:**

-   Snapshots: ~36 objects every 3 minutes
-   Windows: Pruned after 24 hours
-   Summaries: Pruned after 7 days
-   Expected: <50MB memory footprint

**CPU Usage:**

-   Activity polling: Minimal (5-second interval)
-   Scoring: O(n) where n = snapshot count (max 36)
-   AI calls: Network-bound, async
-   Expected: <1% CPU average

**Network Usage:**

-   AI refinement: ~500 tokens every 3 minutes (with API key)
-   AI summary: ~1000 tokens every 30 minutes
-   Expected: ~10-20 API calls/hour

## 🎓 Learning Resources

For understanding the codebase:

1. Start with `README.md` (user guide)
2. Read `QUICKSTART.md` (feature walkthrough)
3. Review `src/types/index.ts` (data structures)
4. Explore `src/hooks/useFocusAI.ts` (orchestration)
5. Deep dive into services (scoring, AI, storage)

## 🤝 Contributing

To add new features:

1. Add types to `src/types/index.ts`
2. Implement service logic in `src/services/`
3. Create React component in `src/components/`
4. Integrate in `useFocusAI` hook or `App.tsx`
5. Style inline with component (modular CSS-in-JS)

## 📝 Code Style

-   **TypeScript**: Strict mode enabled
-   **React**: Functional components + hooks
-   **Styling**: Inline CSS-in-JS (React.CSSProperties)
-   **Naming**: camelCase for variables, PascalCase for components
-   **Comments**: JSDoc for public functions

## 📜 License

Built for DubHacks 2025. Open source (unlicensed).

---

**Last Updated:** October 2025  
**Version:** 1.0.0  
**Author:** FocusAI Team
