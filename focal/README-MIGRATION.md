# Focal v2 - React Migration

This is the React version of the Focal productivity tracker app.

## Changes from v1

### Architecture

-   **Frontend**: Migrated from plain HTML/JS to React with TypeScript
-   **Backend**: Converted Electron main process and trackers to TypeScript
-   **Routing**: Using React Router for navigation between views
-   **Build**: Using Vite for fast development and builds

### Components Structure

```
src/
├── components/
│   ├── Dashboard.tsx    - Main dashboard view
│   ├── Overlay.tsx      - Floating session overlay
│   ├── Garden.tsx       - Garden visualization view
│   └── Debug.tsx        - Debug console for development
├── types/
│   └── ipc.ts          - TypeScript definitions for IPC
├── App.tsx             - Main app with routing
└── main.tsx            - React entry point

electron/
├── main.ts             - Electron main process
├── focus-tracker.ts    - Activity tracking logic
└── focus-ai.ts         - Focus scoring algorithm
```

## Development

### Setup

```bash
npm install
```

### Run Development Mode

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file in the project root (optional):

```
OPENAI_API_KEY=your-api-key-here
```

Note: The app works without an API key using rule-based analysis.

## Features

All features from v1 are preserved:

-   Real-time activity tracking
-   Focus scoring with AI insights
-   Garden visualization that grows with productivity
-   Session management with overlay
-   Debug console for development
-   Cross-platform support (Windows, macOS, Linux)

## Key Differences

1. **React Components**: All HTML views are now React components with proper state management
2. **TypeScript**: Full type safety across the codebase
3. **Routing**: Using hash-based routing for Electron compatibility
4. **Hot Reload**: Vite provides instant hot module replacement during development
5. **Modern Build**: Optimized production builds with Vite

## IPC Communication

The app uses Electron IPC for communication between main and renderer processes:

-   `start-session`: Start tracking
-   `stop-session`: Stop tracking
-   `focus-update`: Receive real-time focus data
-   `open-debug-page`: Open debug window
-   `request-debug-data`: Request debug information

## Navigation

The app supports multiple views accessible via hash routes:

-   `/` - Main dashboard
-   `/overlay` - Floating overlay window
-   `/garden` - Garden visualization
-   `/debug` - Debug console
