# FocusAI 🎯

A smart desktop productivity app that tracks your focus and helps you grow your digital garden through consistent work.

## Features

### 🔍 **Activity Tracking**

-   Monitors active applications and window titles
-   Tracks keystroke activity and idle time
-   Non-intrusive metadata collection (no screenshots)
-   Updates every 5 seconds in the background

### 📊 **Hybrid Scoring System**

-   **Base Score**: Calculated from keyboard activity, focus consistency, and active time
-   **AI Refinement**: Optional AI multiplier that understands context (e.g., YouTube tutorials vs. distractions)
-   **Instantaneous Score**: Real-time focus level (updates every 3 minutes)
-   **Cumulative Score**: Long-term progress tracking with weighted decay

### 🌱 **Grow-a-Garden Visualization**

-   Digital plant that evolves with your productivity
-   7 growth stages: Soil → Seed → Sprout → Seedling → Growing → Blooming → Flourishing
-   Visual updates approximately every 10 minutes
-   Never completely resets (positive reinforcement)

### 🤖 **AI-Powered Insights**

-   Context-aware score adjustments
-   Personalized 30-minute summaries
-   Actionable suggestions based on your patterns
-   Works with or without OpenAI API key (falls back to rule-based scoring)

### 🎯 **Goal Setting**

-   Set daily focus goals
-   Track alignment between activity and intentions
-   Category-based organization (Work, Study, Creative, Other)

## Getting Started

### Prerequisites

-   Node.js 16+ and npm
-   Windows, macOS, or Linux

### Installation

1. Navigate to the app directory:

```bash
cd my-app
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The app will launch in Electron and begin tracking immediately.

### Building for Production

```bash
npm run build
```

This will create a distributable app in the `dist` folder.

## Configuration

### Adding an OpenAI API Key (Optional)

1. Click the ⚙️ settings button in the bottom-right
2. Enter your OpenAI API key (get one at [platform.openai.com](https://platform.openai.com/api-keys))
3. Click "Save API Key"

**Without an API key**, FocusAI uses intelligent rule-based scoring that still provides great insights.

## How It Works

### Activity Windows (3 minutes each)

Every 3 minutes, FocusAI:

1. Aggregates activity snapshots (app switches, keystrokes, idle time)
2. Calculates a **base score** (0-100) using weighted metrics
3. Sends context to AI for refinement (if API key is set)
4. Updates your instantaneous and cumulative scores

### Scoring Weights

-   **Keystroke Activity**: 35%
-   **Focus Consistency** (fewer app switches): 40%
-   **Active Time** (active vs. idle): 25%

### Garden Growth

Your garden grows based on productivity:

-   Score 75+ = 7-10 growth points
-   Score 50-74 = 5-7 growth points
-   Score < 50 = 0-5 growth points

Each stage requires 100 growth points to unlock.

### AI Context Refinement

The AI multiplier (0.5x - 1.5x) adjusts your base score by understanding:

-   Whether your activity aligns with your stated goal
-   If "low activity" is actually productive (e.g., watching a tutorial)
-   Patterns indicating distraction vs. healthy multitasking

## Privacy & Data

-   **All data stays on your device** (localStorage)
-   No screenshots or intrusive monitoring
-   Only metadata is collected (app names, window titles, keystroke counts)
-   API calls (if using OpenAI) only send anonymous activity summaries

## Architecture

```
my-app/
├── src/
│   ├── types/           # TypeScript interfaces
│   ├── services/        # Core logic (scoring, AI, storage, monitoring)
│   ├── components/      # React UI components (each with inline styles)
│   ├── hooks/           # useFocusAI orchestration hook
│   └── App.tsx          # Main application layout
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # IPC bridge
```

### Key Services

-   **ScoringEngine**: Calculates productivity scores from metrics
-   **AIContextService**: Refines scores using AI or rule-based fallback
-   **StorageService**: Manages localStorage persistence
-   **ActivityMonitor**: Tracks user activity in renderer process

### Component Structure

Each component contains its own inline styles for modularity:

-   `Garden.tsx` - Garden visualization with 7 growth stages
-   `FocusScore.tsx` - Dual score display (instantaneous + cumulative)
-   `AISummary.tsx` - 30-minute AI feedback
-   `GoalSetting.tsx` - Goal creation and editing
-   `Settings.tsx` - Configuration modal

## Tech Stack

-   **Framework**: Electron + React + TypeScript
-   **Build**: Vite
-   **Styling**: Inline React styles (modular, no external CSS frameworks)
-   **AI**: OpenAI GPT-4o-mini (optional)
-   **Storage**: Browser localStorage

## OCR (Tesseract.js)

This app includes a simple OCR card that lets you pick an image and extract text with progress feedback using `tesseract.js`.

### Install

Already included in `package.json`:

```bash
npm install tesseract.js
```

### Using pre-bundled CDN models (zero-setup)

By default, Tesseract.js can fetch traineddata files (language models) from a CDN when you specify a language like `eng`. This works out of the box but requires internet access.

### Using local traineddata (offline/self-hosted)

If you want offline OCR or consistent versions, download the language `.traineddata` files and place them under `public/tessdata`.

1. Create the directory:

```bash
mkdir -p public/tessdata
```

2. Download the languages you need from the official repository and save to `public/tessdata`:

-   English: `eng.traineddata`
-   Spanish: `spa.traineddata`
-   French: `fra.traineddata`
-   German: `deu.traineddata`
-   Italian: `ita.traineddata`

Sources:

-   Tesseract language data: [`https://github.com/tesseract-ocr/tessdata`](https://github.com/tesseract-ocr/tessdata)

3. The OCR component is configured with `languagesPath="/tessdata"`, so files under `public/tessdata` are served by Vite/Electron and used locally.

### Which traineddata should I choose?

-   Use the 3-letter ISO code matching the language you need (e.g., `eng`, `spa`).
-   The `tessdata` repo contains integerized LSTM models that are fast and suitable for most apps; they trade a little accuracy for speed compared to `tessdata_best` and are faster than `tessdata` legacy models. See repo notes.
-   Start with `eng.traineddata` for English-only OCR. Add others as needed.

Reference: [`https://github.com/tesseract-ocr/tessdata`](https://github.com/tesseract-ocr/tessdata)

## Future Enhancements

-   [ ] Integration with `active-win` for cross-platform window detection
-   [ ] Export/import data functionality
-   [ ] Weekly/monthly analytics dashboard
-   [ ] Custom scoring weight configuration
-   [ ] Pomodoro timer integration
-   [ ] Desktop notifications for focus breaks

## Development

### Running in Development Mode

```bash
npm run dev
```

This starts Vite dev server + Electron with hot-reload enabled.

### Project Scripts

-   `npm run dev` - Start development mode
-   `npm run build` - Build for production
-   `npm run lint` - Run ESLint

## Troubleshooting

### Activity tracking not working?

-   Make sure the app has accessibility permissions (macOS)
-   Check that Electron window has focus

### Scores not updating?

-   Wait for the first 3-minute window to complete
-   Check browser console for errors

### AI summaries not generating?

-   Verify your API key is correct in Settings
-   Check your OpenAI account has available credits
-   App falls back to rule-based scoring if AI fails

## License

Built for DubHacks 2025

## Credits

Created with ❤️ using modern web technologies.
