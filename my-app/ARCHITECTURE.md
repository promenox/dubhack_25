# FocusAI Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIVITY                           │
│              (Keyboard, Mouse, Active Window)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN PROCESS                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  main.ts - Window Management & IPC Handlers              │  │
│  │  • getActiveWindow() - Returns app name & window title   │  │
│  │  • start/stopTracking() - Control monitoring             │  │
│  │  • System idle detection via powerMonitor                │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ IPC Bridge (preload.ts)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RENDERER PROCESS (React)                      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  ACTIVITY MONITOR (activityMonitor.ts)                 │   │
│  │  • Listens for keyboard/mouse events                   │   │
│  │  • Tracks keystroke count & idle time                  │   │
│  │  • Calls getActiveWindow() every 5 seconds             │   │
│  │  • Creates ActivitySnapshot                            │   │
│  └────────────────┬───────────────────────────────────────┘   │
│                   │ Every 5 seconds                            │
│                   ▼                                             │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  useFocusAI Hook (Orchestration)                       │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Snapshots Buffer (36 snapshots = 3 minutes)     │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                   │ Every 3 minutes                     │   │
│  │                   ▼                                      │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  SCORING ENGINE (scoringEngine.ts)               │  │   │
│  │  │  • Aggregate: switches, keystrokes, active time  │  │   │
│  │  │  • Calculate base score (0-100)                  │  │   │
│  │  │    - Keystroke activity: 35%                     │  │   │
│  │  │    - Focus consistency: 40%                      │  │   │
│  │  │    - Active time: 25%                            │  │   │
│  │  │  • Generate activity pattern                     │  │   │
│  │  └──────────────────┬───────────────────────────────┘  │   │
│  │                     │                                   │   │
│  │                     ▼                                   │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  AI CONTEXT SERVICE (aiContextService.ts)        │  │   │
│  │  │  • Build context: goal, app, pattern, score      │  │   │
│  │  │  • Call OpenAI API (if key exists)               │  │   │
│  │  │  • OR use rule-based fallback                    │  │   │
│  │  │  • Return multiplier (0.5x - 1.5x)               │  │   │
│  │  └──────────────────┬───────────────────────────────┘  │   │
│  │                     │                                   │   │
│  │                     ▼                                   │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Final Score = Base × Multiplier                 │  │   │
│  │  └──────────────────┬───────────────────────────────┘  │   │
│  │                     │                                   │   │
│  │        ┌────────────┼────────────┬──────────────┐      │   │
│  │        ▼            ▼            ▼              ▼      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │  Update  │ │  Update  │ │  Update  │ │  Storage │ │   │
│  │  │  Scores  │ │  Garden  │ │ Summary  │ │  Service │ │   │
│  │  │          │ │ (10 min) │ │ (30 min) │ │          │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│                             │                                  │
│                             ▼                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    REACT COMPONENTS                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐             │   │
│  │  │ GoalSetting.tsx │  │ Garden.tsx      │             │   │
│  │  │ • Goal input    │  │ • 7 stages      │             │   │
│  │  │ • Categories    │  │ • Progress bar  │             │   │
│  │  └─────────────────┘  └─────────────────┘             │   │
│  │  ┌─────────────────┐  ┌─────────────────┐             │   │
│  │  │ FocusScore.tsx  │  │ AISummary.tsx   │             │   │
│  │  │ • Instant score │  │ • Feedback      │             │   │
│  │  │ • Cumulative    │  │ • Suggestions   │             │   │
│  │  └─────────────────┘  └─────────────────┘             │   │
│  │  ┌─────────────────┐  ┌─────────────────┐             │   │
│  │  │ Settings.tsx    │  │ WelcomeOverlay  │             │   │
│  │  │ • API key       │  │ • Onboarding    │             │   │
│  │  └─────────────────┘  └─────────────────┘             │   │
│  └────────────────────────────────────────────────────────┘   │
│                             │                                  │
│                             ▼                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           STORAGE SERVICE (storageService.ts)          │   │
│  │  • Activity windows (last 24h)                         │   │
│  │  • User goals (persistent)                             │   │
│  │  • Garden state (persistent)                           │   │
│  │  • AI summaries (last 7 days)                          │   │
│  │  • Settings (API key)                                  │   │
│  │                                                         │   │
│  │  Storage: localStorage (browser)                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Timeline

```
Time: 0s
├─ User starts working
├─ ActivityMonitor captures first snapshot
└─ Snapshot stored in buffer

Time: 5s, 10s, 15s... (every 5 seconds)
├─ New snapshot captured
├─ Buffer grows (max 36 snapshots)
└─ Keystroke counter resets

Time: 180s (3 minutes)
├─ Process complete window
├─ ScoringEngine calculates base score
├─ AIContextService refines score
├─ FocusScore updates (instant + cumulative)
├─ Window saved to StorageService
└─ Buffer resets

Time: 600s (10 minutes)
├─ Check garden update
├─ Add growth points based on recent scores
├─ Update garden stage if threshold reached
└─ GardenState saved

Time: 1800s (30 minutes)
├─ Generate AI summary
├─ Aggregate last 10 windows
├─ Calculate average score & top activities
├─ AIContextService generates feedback
└─ AISummary component updates
```

## Component Hierarchy

```
App.tsx
├─ WelcomeOverlay.tsx (conditional)
│  └─ 5-slide onboarding
│
├─ Header
│  ├─ Logo
│  └─ Status Badge (tracking/paused)
│
├─ Main Grid
│  ├─ Left Column
│  │  ├─ GoalSetting.tsx
│  │  │  ├─ Goal display / edit form
│  │  │  └─ Category selector
│  │  │
│  │  └─ Garden.tsx
│  │     ├─ Plant visualization (emoji-based)
│  │     ├─ Stage name & progress
│  │     └─ Stats (total growth, last active)
│  │
│  └─ Right Column
│     ├─ FocusScore.tsx
│     │  ├─ Instantaneous score (with trend)
│     │  ├─ Cumulative score
│     │  └─ Circular progress indicators
│     │
│     └─ AISummary.tsx
│        ├─ Period & average score
│        ├─ Feedback paragraph
│        ├─ Top activities list
│        └─ Suggestions list
│
├─ Footer
│  └─ Credits
│
└─ Settings.tsx (floating button + modal)
   ├─ API key input
   ├─ About section
   └─ Info cards
```

## State Management Flow

```
useFocusAI Hook (Central State)
│
├─ appState: AppState
│  ├─ currentGoal: UserGoal | null
│  ├─ focusScore: FocusScore
│  │  ├─ instantaneous: number
│  │  ├─ cumulative: number
│  │  └─ trend: 'rising' | 'falling' | 'stable'
│  ├─ gardenState: GardenState
│  │  ├─ stage: GardenStage
│  │  ├─ progress: number (0-100)
│  │  ├─ totalGrowth: number
│  │  └─ lastWatered: timestamp
│  ├─ currentWindow: ActivityWindow | null
│  ├─ recentSummary: AISummary | null
│  └─ isTracking: boolean
│
├─ Actions
│  ├─ startTracking()
│  ├─ stopTracking()
│  ├─ saveGoal(goal)
│  └─ setApiKey(key)
│
└─ Internal Refs
   ├─ snapshotsRef: ActivitySnapshot[]
   ├─ windowStartRef: timestamp
   ├─ lastVisualUpdateRef: timestamp
   ├─ lastSummaryRef: timestamp
   └─ aiServiceRef: AIContextService
```

## Scoring Algorithm Detail

```
Base Score Calculation:

1. Keystroke Score (35% weight)
   ├─ rate = total_keystrokes / 200
   └─ score = min(100, rate × 100)

2. Focus Consistency Score (40% weight)
   ├─ penalty = min(1, switch_count / 10)
   └─ score = (1 - penalty) × 100

3. Active Time Score (25% weight)
   ├─ ratio = active_time / (active_time + idle_time)
   └─ score = ratio × 100

Base Score = (k_score × 0.35) + (f_score × 0.40) + (a_score × 0.25)

AI Refinement:
├─ Pattern detection (high_switching, deep_focus, etc.)
├─ App-based heuristics (productive vs distracting)
├─ Goal keyword matching
└─ AI multiplier (0.5x - 1.5x)

Final Score = Base Score × AI Multiplier (capped 0-100)
```

## Storage Schema

```
localStorage Keys:

1. focusai_windows
   └─ ActivityWindow[] (last 24 hours)
      ├─ startTime, endTime
      ├─ snapshots: ActivitySnapshot[]
      ├─ baseScore, aiMultiplier, finalScore
      └─ metrics: switchCount, totalKeystrokes, activeTime, idleTime

2. focusai_goals
   └─ UserGoal[]
      ├─ id, title, category
      ├─ active: boolean
      └─ createdAt

3. focusai_garden
   └─ GardenState
      ├─ stage: GardenStage
      ├─ progress: number
      ├─ totalGrowth: number
      └─ lastWatered: timestamp

4. focusai_summaries
   └─ AISummary[] (last 7 days)
      ├─ timestamp, periodMinutes
      ├─ averageScore, topActivities
      └─ feedback, suggestions

5. focusai_settings
   └─ { apiKey: string }

6. focusai_welcome_seen
   └─ 'true' (flag)
```

## API Integration

```
OpenAI API Calls:

1. Score Refinement (every 3 minutes)
   ├─ Model: gpt-4o-mini
   ├─ Temperature: 0.3
   ├─ Tokens: ~150 input, ~50 output
   └─ Response: { multiplier, reasoning, suggestion }

2. Summary Generation (every 30 minutes)
   ├─ Model: gpt-4o-mini
   ├─ Temperature: 0.7
   ├─ Tokens: ~200 input, ~150 output
   └─ Response: { feedback, suggestions[] }

Fallback Strategy:
├─ If no API key: Use rule-based scoring
├─ If API error: Use rule-based scoring
└─ If rate limit: Queue request or skip
```

## Performance Metrics

```
Resource Usage:

Memory:
├─ Snapshots: ~5KB × 36 = 180KB per window
├─ Windows (24h): ~180KB × 480 = 86MB (max)
├─ With pruning: ~10-20MB average
└─ Total: <50MB typical

CPU:
├─ Snapshot capture: <0.1% (5s intervals)
├─ Scoring calculation: <1% (brief spike)
└─ Average: <1% CPU

Network (with AI):
├─ Refinement: ~200 bytes per 3 min = 4KB/hour
├─ Summary: ~500 bytes per 30 min = 400 bytes/hour
└─ Total: <5KB/hour

Disk:
├─ localStorage: 5-10MB
└─ App binary: ~200-300MB (Electron + deps)
```

## Security Model

```
Electron Security:

main.ts (Privileged)
├─ Node.js access
├─ File system access
├─ System API access
└─ Window management

preload.ts (Bridge)
├─ contextBridge.exposeInMainWorld
├─ Limited IPC exposure
└─ Type-safe API

renderer (Sandboxed)
├─ No Node.js
├─ No file system
├─ Only IPC via electronAPI
└─ Web APIs only

Privacy:
├─ ✅ Local storage only
├─ ✅ No screenshots
├─ ✅ No keystroke content
├─ ⚠️ Window titles collected (may contain sensitive info)
└─ ⚠️ API key in plaintext (TODO: encrypt)
```

## File Size Summary

```
Source Code:
├─ Types: ~2KB
├─ Services: ~15KB
├─ Components: ~25KB
├─ Hooks: ~8KB
├─ Electron: ~3KB
└─ Total: ~53KB

Dependencies:
├─ React: ~130KB
├─ Electron: ~200MB
├─ TypeScript: Dev only
└─ Total runtime: ~200MB
```

---

**This architecture supports:**

-   ✅ Real-time activity tracking
-   ✅ Intelligent scoring with AI fallback
-   ✅ Beautiful, responsive UI
-   ✅ Modular, maintainable code
-   ✅ Privacy-first design
-   ✅ Scalable to new features
