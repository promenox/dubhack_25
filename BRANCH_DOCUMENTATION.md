# Garden Game Branch Documentation

**Branch:** `garden+auth+metadata-full-working`  
**Project:** Focal v2 - Garden Productivity Game  
**Type:** Electron Desktop Application  
**Framework:** React + TypeScript + Vite

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Systems](#core-systems)
4. [UI/UX Design](#uiux-design)
5. [Color Theme & Design System](#color-theme--design-system)
6. [Setup & Installation](#setup--installation)
7. [Running the Application](#running-the-application)
8. [Integration Guide](#integration-guide)
9. [File Structure](#file-structure)
10. [API Reference](#api-reference)

---

## Overview

This branch implements a **cozy garden-themed productivity companion** as an Electron desktop application. The app gamifies productivity by allowing users to plant virtual seeds, watch them grow based on productivity metrics, and harvest rewards. The application features:

- **Main Window**: Full garden management interface with plots, seed shop, and inventory
- **Overlay Window**: A floating, always-on-top mini-window displaying a selected plant
- **Productivity Multiplier**: Growth speed scales dynamically based on external productivity tracking
- **Persistent State**: All progress saved to localStorage
- **Offline Growth**: Plants continue growing even when the app is closed

---

## Architecture

### Technology Stack

```
Electron 30.0.1
├── React 18.2.0          (UI Layer)
├── TypeScript 5.2.2       (Type Safety)
├── Vite 5.1.6            (Build Tool & Dev Server)
└── Node APIs             (Main Process)
```

### Application Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  - Window Management (main.ts)                          │
│  - IPC Communication                                     │
│  - Overlay Window Coordination                          │
└─────────────────────────────────────────────────────────┘
                           ↕ IPC
┌─────────────────────────────────────────────────────────┐
│                  Preload Script (preload)                │
│  - Context Bridge API (gardenApi)                       │
│  - Secure IPC Wrapper                                   │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                   Renderer Processes                     │
│  ┌───────────────┐          ┌────────────────┐         │
│  │  Main Window  │          │ Overlay Window │         │
│  │  (App.tsx)    │  ←sync→  │ (OverlayApp)   │         │
│  └───────────────┘          └────────────────┘         │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                      Core Game Logic                     │
│  - GardenGame (gardenGame.ts)                           │
│  - State Management                                      │
│  - Growth Calculations                                   │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│            Storage Layer (localStorage)                  │
│  - Persistent Garden State                              │
│  - Inventory & Currency                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Core Systems

### 1. Garden Game Engine (`src/core/gardenGame.ts`)

The `GardenGame` class is the heart of the application, managing all game state and logic.

#### Key Features

- **Plant Growth System**: Time-based growth with progress tracking (0-1 scale)
- **Productivity Multiplier**: Scales growth speed dynamically (1x to 10x or higher)
- **Offline Growth**: Calculates elapsed time and applies growth when reopening
- **Economy System**: Currency management, seed purchasing, plot unlocking

#### Growth Algorithm

```typescript
effectiveDuration = baseDuration / growthMultiplier
progressIncrement = deltaTime / effectiveDuration
progress = min(1, progress + progressIncrement)
```

**Example:**

- Plant with 60s base duration
- At 1x multiplier: takes 60 seconds to grow
- At 10x multiplier: takes 6 seconds to grow
- At 0.5x multiplier: takes 120 seconds to grow

#### Plant Library

| Plant Type | Display Name | Duration | Harvest Reward | Seed Cost |
|-----------|--------------|----------|----------------|-----------|
| seedling | Morning Sprout | 60s | 5 coins | 2 coins |
| blossom | Blooming Lilac | 300s (5m) | 20 coins | 5 coins |
| evergreen | Evergreen Sapling | 600s (10m) | 50 coins | 10 coins |
| rose | Crimson Rose | 1200s (20m) | 70 coins | 30 coins |
| lavender | Moonlit Lavender | 1800s (30m) | 150 coins | 90 coins |
| beanstalk | Skyward Beanstalk | 3600s (60m) | 300 coins | 150 coins |
| sixtyseven | Six Sevenium | 420s (7m) | 67 coins | 42 coins |

### 2. State Management

#### Garden State Structure

```typescript
interface GardenState {
  plots: Plot[];              // Grid of plant plots
  inventory: Inventory;       // Seeds, currency, decorations
  lastUpdatedAt: number;      // Timestamp for offline growth
}

interface Plot {
  id: string;                 // e.g., "plot-1"
  plant: Plant | null;        // Currently planted item
}

interface Plant {
  id: string;                 // Unique plant instance ID
  type: PlantType;           // Seed type (seedling, blossom, etc.)
  plantedAt: number;         // Unix timestamp
  growthDuration: number;    // Base duration in seconds
  progress: number;          // 0.0 to 1.0
}

interface Inventory {
  currency: number;           // Coins for purchases
  seeds: Record<PlantType, number>;  // Seed counts by type
  decorations: string[];      // Future feature
}
```

#### Initial State

- **4 plots** unlocked by default
- **3 seedling seeds** + **1 blossom seed** to start
- **0 coins** (must harvest to earn)

### 3. Productivity Tracker Integration (`src/tracker/index.ts`)

The tracker module provides a simple interface for external productivity systems to control growth speed:

```typescript
// Get current multiplier
const multiplier = getProductivityMultiplier(); // Default: 1

// Set new multiplier
setProductivityMultiplier(5.0); // 5x growth speed
```

**Game Loop Integration:**

- Checks tracker every **1 second**
- Automatically applies multiplier changes
- No manual sync required

### 4. IPC Communication System

The application uses Electron's IPC to synchronize state between windows:

#### Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `garden:state:update` | Renderer → Main | Broadcast state changes |
| `garden:state` | Main → Renderer | Distribute state to all windows |
| `garden:state:request` | Renderer → Main | Request current state |
| `overlay:selection:set` | Renderer ↔ Main | Set selected plot for overlay |
| `overlay:selection:get` | Renderer ↔ Main | Get selected plot |
| `overlay:selection` | Main → Renderer | Broadcast selection changes |

### 5. Storage System (`src/storage/localStorageAdapter.ts`)

Simple localStorage-based persistence:

```typescript
// Storage Key
const STORAGE_KEY = 'garden-productivity-state';

// Automatic Save
// - After every plant action
// - After every purchase
// - After every harvest
// - After every tick (1s intervals)

// Automatic Load
// - On application startup
// - Falls back to initial state if corrupted
```

---

## UI/UX Design

### Window Configuration

#### Main Window

- **Dimensions**: 1400×820px (fixed, non-resizable)
- **Background**: `#0c1115` (deep dark blue-green)
- **Title Bar**: Hidden/custom (44px height)
- **Features**:
  - Garden grid (2-4 columns adaptive)
  - Inventory toolbar (docked bottom)
  - Seed shop (modal overlay)
  - Toast notifications

#### Overlay Window

- **Dimensions**: 280×320px (resizable, min 220×240px)
- **Background**: Fully transparent
- **Position**: Always on top, draggable
- **Features**:
  - Single plant display
  - Synchronized with main window selection
  - Minimalist floating design

### Layout Structure

```
┌────────────────────────────────────────────────────────┐
│  Title Bar (44px)                      [FOCAL - v1.0] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │            Garden Grid (Adaptive)                │ │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐            │ │
│  │  │Plot1│  │Plot2│  │Plot3│  │Plot4│            │ │
│  │  └─────┘  └─────┘  └─────┘  └─────┘            │ │
│  │  [Plant Visual + Progress Bar + Controls]       │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Inventory Toolbar (Fixed Bottom, 104px)              │
│  [💰 100] [Seed Icons...] [Shop Button] [Growth 5.0x]│
└────────────────────────────────────────────────────────┘
```

### Plant Growth Stages

Plants visually evolve through 4 stages based on progress:

| Stage | Progress | Label | Visual |
|-------|----------|-------|--------|
| 🌱 Seedling | 0% - 24% | Seedling | Small sprout |
| 🌿 Sprouting | 25% - 49% | Sprouting | Growing stem |
| 🌸 Blooming | 50% - 99% | Blooming | Developing bloom |
| ✨ Harvest | 100% | Ready to Harvest | Full plant + glow |

### Interactions

#### Planting Seeds

1. **Drag from Inventory**: Drag seed from toolbar onto empty plot
2. **Drop**: Seed is planted, growth begins immediately
3. **Feedback**: Plot updates, inventory count decreases

#### Harvesting

1. **Ready State**: Plant glows, progress bar at 100%
2. **Click Plot**: Instant harvest
3. **Reward**: Coins added to inventory, plot becomes empty

#### Overlay Selection

1. **Click "Show in Overlay"** button on any growing/ready plant
2. **Overlay Window** updates to show selected plant
3. **Toggle**: Click again to deselect

---

## Color Theme & Design System

### CSS Variables (`:root`)

```css
/* Core Palette - Dark Teal/Cyan Theme */
--bg-primary: #0c1115;           /* Main background (deep dark) */
--bg-surface: #141a1f;            /* Card backgrounds */
--bg-surface-alt: #1b2228;        /* Plot card backgrounds */
--bg-surface-soft: #1f272e;       /* Seed inventory items */

/* Borders */
--border-color: rgba(101, 232, 189, 0.18);   /* Primary borders */
--border-subtle: rgba(101, 232, 189, 0.08);  /* Subtle dividers */

/* Text */
--text-primary: #eef8f3;                      /* Main text (light cyan-white) */
--text-secondary: rgba(215, 237, 229, 0.72);  /* Dimmed text */

/* Accent - Teal/Cyan Glow */
--accent: #59dcb2;               /* Primary accent (teal) */
--accent-strong: #7ef5c9;        /* Bright highlights */
--accent-soft: rgba(89, 220, 178, 0.16);  /* Soft backgrounds */

/* Special */
--danger: #f87171;               /* Error states */

/* Progress Bar Colors */
--plot-progress-seed: #59dcb2;      /* Seedling stage */
--plot-progress-sprout: #72f0c4;    /* Sprouting stage */
--plot-progress-bloom: #3ec197;     /* Blooming stage */
--plot-progress-harvest: #9cf3ce;   /* Ready to harvest */
```

### Color Philosophy

**Primary Theme**: Dark, cozy garden at night with glowing teal plants

- **Background**: Deep blue-black (`#0c1115`) creates depth
- **Accent**: Luminous teal (`#59dcb2`, `#7ef5c9`) suggests bioluminescence
- **Surfaces**: Layered dark tones (`#141a1f`, `#1b2228`) for card depth
- **Glow Effects**: Heavy use of `box-shadow` with teal colors for "living" feel

### Typography

```css
font-family: 'Inter', 'Segoe UI', sans-serif;
font-size: 18px;                  /* Base size */
letter-spacing: 0.02em - 0.08em;  /* Airy, readable */
```

#### Text Hierarchy

- **H2 Titles**: 1.6rem, uppercase, spaced (section headers)
- **H3 Titles**: 1.2rem, uppercase (plot labels)
- **Body**: 1rem (18px base)
- **Small**: 0.8-0.9rem (metadata, stats)

### Button Styles

#### Primary Buttons

```css
background: var(--accent);        /* #59dcb2 teal */
color: #062a1f;                   /* Dark text on light button */
padding: 0.55rem 1.05rem;
border-radius: 0.65rem;
transition: transform 0.18s, box-shadow 0.18s;
```

**Hover Effect**: Lifts up with glowing shadow
**Active Effect**: Presses down slightly

#### Toggle/Ghost Buttons

```css
background: transparent;
border: 1px solid var(--border-color);
color: var(--accent-strong);
```

**Hover**: Fills with `--accent-soft` background

### Card Design

#### Plot Cards

```css
background: var(--bg-surface-alt);   /* #1b2228 */
border: 1px solid var(--border-subtle);
border-radius: 1.25rem;
padding: 1.25rem;
box-shadow: 0 12px 28px rgba(6, 12, 14, 0.32);
height: 280px;                       /* Fixed height */
```

**Ready State**:

```css
border-color: var(--accent-strong);
box-shadow: 0 0 28px rgba(126, 245, 201, 0.45);  /* Glowing */
```

### Animations

#### Plant Sway (Growing)

```css
@keyframes plantSway {
  0%, 100% { transform: rotate(-1deg); }
  50% { transform: rotate(1deg); }
}
/* Duration: 6s, infinite loop */
```

#### Plant Glow (Ready to Harvest)

```css
@keyframes plantGlow {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(126, 245, 201, 0.3)); }
  50% { filter: drop-shadow(0 0 28px rgba(126, 245, 201, 0.7)); }
}
/* Duration: 2.6s, infinite pulse */
```

#### Shake (Error Feedback)

```css
@keyframes plotCardShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
/* Duration: 0.45s, plays once on error */
```

### Icon System

#### Coin Icon

```css
background: radial-gradient(
  circle at 30% 30%,
  #fff6b2,          /* Light gold highlight */
  #facc15 55%,      /* Gold mid */
  #d9981f           /* Dark gold edge */
);
box-shadow: 0 2px 6px rgba(250, 204, 21, 0.25);
```

#### Clock Icon (CSS-only)

```css
/* Circle border + two pseudo-element hands */
border: 1.5px solid currentColor;
border-radius: 50%;
::before { /* Top hand */ }
::after { /* Bottom hand */ }
```

### Responsive Grid

```css
/* Plot grid adapts to count */
4 plots or less:  2 columns
5-6 plots:        3 columns
7+ plots:         4 columns
```

---

## Setup & Installation

### Prerequisites

- **Node.js**: 16.x or higher
- **npm**: 8.x or higher (comes with Node)
- **Git**: For cloning repository

### Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd dubhack_25

# 2. Checkout the branch
git checkout garden+auth+metadata-full-working

# 3. Install dependencies
npm install

# 4. Install Electron app dependencies
npm run postinstall
```

### Dependencies Overview

#### Production Dependencies

```json
{
  "amazon-cognito-identity-js": "^6.3.15",  // Auth (future feature)
  "axios": "^1.6.0",                         // HTTP client
  "clsx": "^2.1.1",                          // Conditional classnames
  "crypto-js": "^4.2.0",                     // Encryption utilities
  "dotenv": "^16.4.5",                       // Environment variables
  "react": "^18.2.0",                        // UI framework
  "react-dom": "^18.2.0",                    // React DOM renderer
  "react-router-dom": "^7.9.4",              // Routing (future)
  "uiohook-napi": "^1.5.4"                   // Global hotkeys (future)
}
```

#### Development Dependencies

```json
{
  "electron": "^30.0.1",                     // Desktop framework
  "electron-builder": "^24.13.3",            // Build tool
  "vite": "^5.1.6",                          // Build/dev server
  "@vitejs/plugin-react": "^4.2.1",         // React support
  "typescript": "^5.2.2"                     // Type checking
}
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

**What happens:**

1. Vite starts dev server at `http://localhost:5173`
2. TypeScript compiles main process to `dist-electron/main.js`
3. Electron launches with hot module reload (HMR)
4. Changes to React components auto-refresh
5. Changes to main process require app restart

**Dev Server Notes:**

- **Host**: Binds to `0.0.0.0` (accessible from WSL)
- **Port**: 5173 (strict, won't auto-increment)
- **HMR**: Uses WebSocket on `127.0.0.1:5173`

### Production Build

```bash
# Build application
npm run build

# Output locations:
# - dist/ui/          (bundled React app)
# - dist-electron/    (compiled main process)
# - dist/             (packaged Electron app)
```

**Build Process:**

1. TypeScript compilation (`tsc`)
2. Vite builds React app
3. Electron Builder packages for current platform

### Preview Production Build

```bash
# After npm run build
npm start
```

### Platform-Specific Builds

```bash
# Windows
npm run build  # Outputs .exe installer

# macOS
npm run build  # Outputs .dmg (requires macOS)

# Linux
npm run build  # Outputs .AppImage / .deb
```

---

## Integration Guide

### Integrating with Other Projects

This garden game is designed to be **modular and portable**. Here's how to integrate it into your own productivity application:

#### Option 1: As a Submodule

```bash
# In your project root
git submodule add <garden-repo-url> src/garden-game
git submodule update --init --recursive
```

#### Option 2: Copy Core Files

**Minimum Required Files:**

```
src/core/
  ├── gardenGame.ts      # Game engine
  ├── index.ts           # Type exports
src/tracker/
  ├── index.ts           # Multiplier interface
src/storage/
  ├── localStorageAdapter.ts  # Persistence
src/ui/
  ├── styles.css         # Complete design system
  ├── components/        # All React components
  ├── hooks/             # useGardenGame hook
```

### Controlling Growth Speed

#### Basic Usage

```typescript
import { setProductivityMultiplier } from './src/tracker/index';

// Speed up plants based on user activity
function onUserProductivity(activityLevel: number) {
  // activityLevel: 1-10 scale
  setProductivityMultiplier(activityLevel);
}

// Examples:
setProductivityMultiplier(1);    // Normal speed
setProductivityMultiplier(5);    // 5x faster
setProductivityMultiplier(0.5);  // Half speed (breaks)
```

#### Advanced Integration Patterns

**Time-Based Productivity:**

```typescript
let focusTimeMinutes = 0;
let breakTimeMinutes = 0;

setInterval(() => {
  const ratio = focusTimeMinutes / (focusTimeMinutes + breakTimeMinutes);
  const multiplier = 1 + (ratio * 9); // 1x to 10x
  setProductivityMultiplier(multiplier);
}, 60000); // Update every minute
```

**Task-Based Rewards:**

```typescript
let tasksCompleted = 0;

function onTaskComplete() {
  tasksCompleted++;
  const bonus = Math.min(10, 1 + (tasksCompleted * 0.5));
  setProductivityMultiplier(bonus);
  
  // Reset after 5 minutes
  setTimeout(() => {
    tasksCompleted = Math.max(0, tasksCompleted - 1);
  }, 300000);
}
```

**Pomodoro Integration:**

```typescript
let pomodorosToday = 0;

function onPomodoroComplete() {
  pomodorosToday++;
  const multiplier = 1 + (pomodorosToday * 0.25); // +0.25x per pomodoro
  setProductivityMultiplier(multiplier);
}

function onDayEnd() {
  pomodorosToday = 0;
  setProductivityMultiplier(1);
}
```

### Adapting the Color Theme

#### To Use Your Own Colors

1. **Edit CSS Variables** (`src/ui/styles.css`):

```css
:root {
  /* Replace these with your brand colors */
  --bg-primary: #YOUR_DARK_BG;
  --accent: #YOUR_ACCENT_COLOR;
  --accent-strong: #YOUR_BRIGHT_ACCENT;
  --text-primary: #YOUR_TEXT_COLOR;
}
```

2. **Common Theme Conversions:**

**Light Mode Conversion:**

```css
:root {
  color-scheme: light;
  --bg-primary: #f5f7fa;
  --bg-surface: #ffffff;
  --bg-surface-alt: #fafbfc;
  --text-primary: #1a1a1a;
  --text-secondary: rgba(26, 26, 26, 0.7);
  --accent: #0066cc;
  --accent-strong: #0052a3;
  --border-color: rgba(0, 102, 204, 0.2);
}
```

**Purple Theme:**

```css
:root {
  --bg-primary: #1a0f2e;
  --accent: #9d4edd;
  --accent-strong: #c77dff;
  --border-color: rgba(157, 78, 221, 0.18);
}
```

**Orange/Warm Theme:**

```css
:root {
  --bg-primary: #1a1410;
  --accent: #ff8c42;
  --accent-strong: #ffb347;
  --border-color: rgba(255, 140, 66, 0.18);
}
```

### Customizing Window Behavior

**Change Main Window Size** (`src/main/main.ts`):

```typescript
mainWindow = new BrowserWindow({
  width: 1600,    // Your width
  height: 900,    // Your height
  resizable: true, // Allow resizing
  // ...
});
```

**Disable Overlay Window:**
Comment out overlay creation in `src/main/main.ts`:

```typescript
// const overlayWindow = createOverlayWindow(); // Disabled
```

### Custom Storage Backend

Replace localStorage with your own database:

```typescript
// src/storage/customAdapter.ts
import { GardenStorage } from '@core/gardenGame';

export const createCustomAdapter = (): GardenStorage => ({
  async load() {
    // Load from your database
    const data = await fetch('/api/garden-state').then(r => r.json());
    return data;
  },
  async save(state) {
    // Save to your database
    await fetch('/api/garden-state', {
      method: 'POST',
      body: JSON.stringify(state)
    });
  }
});
```

Then use it in `src/ui/hooks/useGardenGame.ts`:

```typescript
import { createCustomAdapter } from '@storage/customAdapter';

const storage = createCustomAdapter(); // Instead of createLocalStorageAdapter()
```

---

## File Structure

```
dubhack_25/
├── focal/                      # Build output directory
│   └── dist-electron/          # Compiled Electron main process
│       ├── main.js             # Entry point for Electron
│       ├── preload.mjs         # Preload script
│       └── index-*.js          # Bundled assets
│
├── src/
│   ├── core/                   # Game engine (framework-agnostic)
│   │   ├── gardenGame.ts       # Main game class
│   │   └── index.ts            # Type definitions & exports
│   │
│   ├── main/                   # Electron main process
│   │   └── main.ts             # Window creation, IPC handlers
│   │
│   ├── preload/                # Context bridge
│   │   └── index.ts            # Exposes gardenApi to renderer
│   │
│   ├── storage/                # Persistence layer
│   │   ├── index.ts            # Storage interface
│   │   └── localStorageAdapter.ts  # localStorage implementation
│   │
│   ├── tracker/                # Productivity integration
│   │   ├── index.ts            # Multiplier API
│   │   └── randomMultiplierTest.ts  # Testing utilities
│   │
│   └── ui/                     # React application
│       ├── App.tsx             # Main window root component
│       ├── OverlayApp.tsx      # Overlay window root component
│       ├── main.tsx            # React entry point
│       ├── index.html          # HTML template
│       ├── styles.css          # Global styles (1202 lines)
│       ├── overlay.css         # Overlay-specific styles
│       ├── env.d.ts            # TypeScript declarations
│       │
│       ├── components/         # React components
│       │   ├── GardenGrid.tsx  # Plot grid layout
│       │   ├── PlantVisual.tsx # Plant rendering
│       │   ├── SeedShop.tsx    # Shop modal
│       │   ├── InventoryToolbar.tsx  # Bottom toolbar
│       │   └── DecorationsPanel.tsx  # Future feature
│       │
│       ├── hooks/              # Custom React hooks
│       │   └── useGardenGame.ts  # Main game state hook
│       │
│       └── assets/             # Static assets
│           ├── plantIcons.ts   # Icon path resolver
│           └── plants/         # SVG plant illustrations
│               ├── seedling.svg
│               ├── blossom.svg
│               ├── evergreen.svg
│               ├── rose.svg
│               ├── lavender.svg
│               ├── beanstalk.svg
│               └── sixtyseven.svg
│
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript configuration (root)
├── tsconfig.main.json          # TypeScript for main process
├── tsconfig.test.json          # TypeScript for tests
├── vite.config.ts              # Vite build configuration
│
├── README.md                   # Basic project info
├── garden_game_todo.md         # Development roadmap
├── HOW_TO_TEST_MULTIPLIER.md   # Testing guide
└── MULTIPLIER_DEBUG.md         # Debugging notes
```

---

## API Reference

### Core API (`src/core/gardenGame.ts`)

#### `GardenGame` Class

```typescript
class GardenGame {
  // Factory method
  static async create(storage: GardenStorage): Promise<GardenGame>
  
  // State subscription
  subscribe(listener: (state: GardenState) => void): () => void
  getGardenState(): GardenState
  
  // Multiplier control
  setGrowthMultiplier(multiplier: number): void
  getMultiplier(): number
  
  // Plant management
  async plantSeed(plotId: string, seedType: PlantType): Promise<void>
  async harvestCrop(plotId: string): Promise<void>
  
  // Economy
  async buySeed(seedType: PlantType): Promise<void>
  async unlockPlot(cost?: number): Promise<void>
  addCurrency(amount: number): void
  
  // Game loop
  async tick(deltaTimeSeconds: number, options?: TickOptions): Promise<void>
}
```

#### Usage Example

```typescript
import { GardenGame, createInitialGardenState } from '@core/index';
import { createLocalStorageAdapter } from '@storage/localStorageAdapter';

// Initialize
const storage = createLocalStorageAdapter();
const game = await GardenGame.create(storage);

// Subscribe to changes
const unsubscribe = game.subscribe((state) => {
  console.log('Garden updated:', state);
});

// Plant a seed
await game.plantSeed('plot-1', 'seedling');

// Set growth speed
game.setGrowthMultiplier(5.0); // 5x faster

// Game loop (every second)
setInterval(() => {
  game.tick(1); // Advance 1 second
}, 1000);

// Harvest when ready
await game.harvestCrop('plot-1'); // +5 coins
```

### Tracker API (`src/tracker/index.ts`)

```typescript
// Get current multiplier
function getProductivityMultiplier(): number

// Set new multiplier (affects all plants)
function setProductivityMultiplier(multiplier: number): void
```

### Preload API (`window.gardenApi`)

Available in renderer processes via context bridge:

```typescript
interface GardenApi {
  // Version info
  getVersion(): string
  
  // State synchronization
  emitGardenState(state: GardenState): void
  onGardenState(listener: (state: GardenState) => void): () => void
  requestGardenState(): void
  
  // Overlay control
  setOverlaySelection(plotId: string | null): Promise<string | null>
  getOverlaySelection(): Promise<string | null>
  onOverlaySelection(listener: (plotId: string | null) => void): () => void
}

// Access in renderer
window.gardenApi.getVersion(); // "30.0.1"
```

### React Hook API (`src/ui/hooks/useGardenGame.ts`)

```typescript
interface UseGardenGameReturn {
  state: GardenState | null;      // Current game state
  isReady: boolean;                // Engine initialized
  error: GameError | null;         // Last error
  dispatch: (action: GameAction) => Promise<void>;  // Action dispatcher
  seeds: Record<PlantType, SeedDefinition>;  // Seed library
  multiplier: number;              // Current growth speed
}

type GameAction =
  | { type: 'plant'; plotId: string; seedType: PlantType }
  | { type: 'harvest'; plotId: string }
  | { type: 'buySeed'; seedType: PlantType }
  | { type: 'unlockPlot' }
  | { type: 'setMultiplier'; value: number };

// Usage in components
const { state, dispatch, multiplier } = useGardenGame();

// Dispatch actions
dispatch({ type: 'plant', plotId: 'plot-1', seedType: 'blossom' });
dispatch({ type: 'harvest', plotId: 'plot-1' });
dispatch({ type: 'setMultiplier', value: 10 });
```

---

## Testing & Debugging

### Console Commands

Open DevTools (`F12`) in the running app:

```javascript
// Test multiplier changes
__testMultiplier(10)  // Set to 10x speed
__testMultiplier(1)   // Reset to normal
__testMultiplier(0.5) // Set to half speed

// Inspect game state
console.log(window.gardenApi.getVersion())
```

### Manual Testing Workflow

1. **Start with default state**: 4 plots, 3 seedling seeds
2. **Plant a seedling**: Drag from toolbar to plot (60s growth)
3. **Test multiplier**: `__testMultiplier(60)` → should finish in 1 second
4. **Harvest**: Click glowing plot when ready
5. **Verify currency**: Check coin counter increased by 5
6. **Buy more seeds**: Open shop, purchase with coins
7. **Test offline growth**: Close app, wait 1 minute, reopen (plants should have grown)

### Known Issues & Limitations

1. **WSL Dev Server**: May need manual IP configuration for Electron to reach Vite
2. **Overlay Window**: Windows-only feature (transparency issues on Linux)
3. **uiohook-napi**: Requires native rebuild (`npm run rebuild`) after Electron updates

---

## Credits & License

**Branch**: `garden+auth+metadata-full-working`  
**Built with**: React, TypeScript, Electron, Vite  
**Design Theme**: Cozy dark garden with bioluminescent cyan/teal accents  

---

## Quick Reference

### NPM Scripts

```bash
npm run dev        # Start development mode
npm run build      # Build production bundle
npm run lint       # Run ESLint
npm run preview    # Preview production build
npm run rebuild    # Rebuild native modules
npm run postinstall # Install Electron app deps
```

### Key Shortcuts

- `F12`: Open DevTools
- `Ctrl+R` / `Cmd+R`: Reload renderer
- `Ctrl+Q` / `Cmd+Q`: Quit app

### Important URLs

- Dev Server: `http://localhost:5173`
- Preview Server: `http://localhost:4173`

### Default Port Configuration

- Vite Dev: `:5173`
- Vite Preview: `:4173`
- HMR WebSocket: `:5173`

---

**Last Updated**: Based on branch state as of October 19, 2025  
**Documentation Version**: 1.0  
**Completeness**: Full implementation documentation
