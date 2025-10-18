# Productivity Garden 🌱

A personal AI productivity tracker that helps you stay focused and motivated through beautiful visualizations and privacy-first telemetry.

## Features

### 📊 Real-Time Productivity Tracking

-   **Intelligent Scoring Algorithm**: Combines multiple signals (focus, activity, context) into a 0-100 productivity score
-   **OCR-Based Focus Detection**: Captures screen content periodically to detect focused work
-   **Window Tracking**: Monitors active applications to understand your context
-   **Safe Input Telemetry**: Tracks keyboard/mouse activity (counts only, no raw content)

### 🎯 Goal Management

-   Set daily, weekly, or custom productivity goals
-   Track progress with visual indicators
-   Get motivated by milestone achievements

### 🌸 Garden Overlay

-   Beautiful, translucent desktop overlay that grows with your productivity
-   Plants bloom and flourish as your score increases
-   Customizable size, opacity, and position

### 🔒 Privacy-First Design

-   **All data stored locally** - never transmitted to external servers
-   **No keystroke logging** - only aggregated counts
-   **No screenshots saved** - OCR runs in-memory only
-   **Configurable retention** - auto-delete old data
-   **Full transparency** - export or delete your data anytime

## Technology Stack

-   **Electron 30+** - Cross-platform desktop framework
-   **React 18** - UI framework with hooks and context
-   **TypeScript** - Type-safe development
-   **Vite** - Fast build tool and dev server
-   **Tesseract.js** - In-browser OCR for screen analysis
-   **active-win** - Cross-platform active window detection

## Installation

### Prerequisites

-   Node.js 18+ and npm/yarn
-   Windows, macOS, or Linux

### Development Setup

```bash
# Install dependencies
npm install

# Start development mode
npm run dev
```

The app will launch with hot-reload enabled for both main and renderer processes.

### Building for Production

```bash
# Build for current platform
npm run build

# Create distributable package (without installer)
npm run pack

# Create installer for current platform
npm run dist
```

Builds will be output to the `release/` directory:

-   **Windows**: `.exe` installer and portable `.exe`
-   **macOS**: `.dmg` and `.zip` packages
-   **Linux**: `.AppImage` and `.deb` packages

## Architecture

### Modular Service Design

```
electron/
├── main.ts                 # Main process orchestration
├── preload.ts             # Secure IPC bridge
├── types/                 # Shared TypeScript types
│   └── index.ts
└── services/              # Modular service architecture
    ├── ScreenCaptureService.ts    # OCR & screen capture
    ├── WindowTrackerService.ts    # Active window tracking
    ├── InputTrackerService.ts     # Safe input telemetry
    ├── ProductivityEngine.ts      # Scoring algorithm
    └── DataService.ts             # Local data persistence

src/
├── components/            # React UI components
│   ├── Dashboard.tsx      # Main productivity dashboard
│   ├── Goals.tsx          # Goal management
│   ├── Settings.tsx       # Privacy & telemetry controls
│   └── GardenOverlay.tsx  # Animated garden overlay
├── context/
│   └── ProductivityContext.tsx  # Global state management
├── hooks/
│   └── useInputTracking.ts      # Input tracking hook
└── types/
    └── electron.d.ts      # Type definitions for renderer
```

### Service Architecture

Each service is **isolated and modular**:

1. **ScreenCaptureService**:

    - Uses Electron's `desktopCapturer` for screenshots
    - Runs Tesseract.js OCR in a worker thread
    - Configurable capture intervals (default: 30s)
    - Only text results are retained (no images stored)

2. **WindowTrackerService**:

    - Polls active window using `active-win` package
    - Categorizes apps as productive/distraction/neutral
    - Configurable excluded apps for privacy

3. **InputTrackerService**:

    - Listens to renderer-side keyboard/mouse events
    - Aggregates to counts and rates (no raw content)
    - Detects idle time using Electron's powerMonitor

4. **ProductivityEngine**:

    - Rule-based scoring with configurable weights
    - Combines focus, activity, and context scores
    - Detects and records productivity events
    - **Pluggable for ML**: designed for easy ML model integration

5. **DataService**:
    - Persists settings, goals, and events as JSON
    - Automatic retention policy enforcement
    - Export and delete functionality

### IPC Architecture

The app uses a **secure, type-safe IPC API**:

-   **Preload script** exposes minimal API via `contextBridge`
-   **Type definitions** shared between main and renderer
-   **No direct Node.js access** from renderer (context isolation)

Example IPC call:

```typescript
// Renderer
const metrics = await window.electron.getCurrentMetrics();

// Main process handler
ipcMain.handle("metrics:get", () => productivityEngine.getCurrentMetrics());
```

## Privacy & Security

### What Data is Collected?

| Data Type         | What's Stored                                | Privacy Notes                                         |
| ----------------- | -------------------------------------------- | ----------------------------------------------------- |
| **Screen OCR**    | Extracted text from periodic screenshots     | Screenshots discarded immediately; only text retained |
| **Window Titles** | Active window title and application name     | No window content; only metadata                      |
| **Keystrokes**    | Count per minute (aggregate)                 | NO key content; only frequency                        |
| **Mouse**         | Movement distance per minute                 | NO positions; only distance                           |
| **Events**        | Productivity events (focus sessions, breaks) | Timestamped but no personal content                   |

### What is NOT Collected?

-   ❌ Raw keystroke content (passwords, messages, etc.)
-   ❌ Mouse cursor positions or click coordinates
-   ❌ Screenshot images (discarded after OCR)
-   ❌ Any data transmitted over the network
-   ❌ Personal identifiable information (PII)

### Data Storage

All data is stored locally in:

-   **Windows**: `%APPDATA%\productivity-garden\productivity-data\`
-   **macOS**: `~/Library/Application Support/productivity-garden/productivity-data/`
-   **Linux**: `~/.config/productivity-garden/productivity-data/`

Files:

-   `settings.json` - App settings
-   `goals.json` - User goals
-   `events.json` - Productivity events

### Disabling Telemetry

You can disable any tracking feature in **Settings**:

1. **Screen Capture & OCR** - Toggle off to disable screen analysis
2. **Window Tracking** - Toggle off to disable active window detection
3. **Input Tracking** - Toggle off to disable keyboard/mouse telemetry

Or disable all tracking:

```typescript
// In Settings component
await window.electron.updateSettings({
	telemetry: {
		screenCapture: false,
		windowTracking: false,
		inputTracking: false,
	},
});
```

### Deleting Your Data

In the Settings page, use the "Delete All Data" button to permanently remove all stored data. This action:

-   Deletes all JSON data files
-   Clears in-memory state
-   Resets to default settings
-   **Cannot be undone**

Or export your data first for backup:

```typescript
const dataJson = await window.electron.exportData();
// Save dataJson to a file
```

## Productivity Scoring Algorithm

The current implementation uses a **weighted rule-based system**:

```
Final Score = (Focus Score × 0.4) + (Activity Score × 0.3) + (Context Score × 0.3)
```

### Sub-Scores

1. **Focus Score (40% weight)**

    - Based on OCR confidence and focused content detection
    - Higher when meaningful text is detected
    - Decays if no recent OCR data

2. **Activity Score (30% weight)**

    - Based on keystrokes per minute and mouse movement
    - Optimal range: 40-80 KPM for focused work
    - Penalized for excessive idle time

3. **Context Score (30% weight)**
    - Based on active application category
    - Productive apps (IDEs, docs) → high score
    - Distraction apps (social media) → low score

### Extending with Machine Learning

The architecture is designed for easy ML integration:

```typescript
// Future: Replace rule-based scoring with ML model
class MLProductivityEngine extends ProductivityEngine {
	private model: TensorFlowModel;

	async loadModel(modelPath: string) {
		this.model = await tf.loadLayersModel(modelPath);
	}

	protected calculateScore(): number {
		const features = this.extractFeatures();
		const prediction = this.model.predict(features);
		return prediction.dataSync()[0] * 100;
	}
}
```

Train on historical data + user feedback to improve accuracy over time.

## Customization

### Adjust Scoring Weights

Modify weights in `ProductivityEngine`:

```typescript
productivityEngine.updateWeights({
	focus: 0.5, // Increase focus weight
	activity: 0.3,
	context: 0.2,
});
```

### Add Custom App Categories

Edit `WindowTrackerService` to customize app categorization:

```typescript
private readonly productiveApps = new Set([
  'your-custom-app',
  'another-productive-app',
]);
```

### Adjust OCR Interval

In Settings or programmatically:

```typescript
await window.electron.updateSettings({
	telemetry: { ocrInterval: 60 }, // 60 seconds
});
```

## Troubleshooting

### OCR Not Working

**Issue**: Screen capture or OCR fails silently

**Solutions**:

1. Check screen recording permissions (macOS/Linux)
2. Increase OCR interval if CPU usage is high
3. Check logs in DevTools console

### Window Tracking Not Detecting Apps

**Issue**: Active window shows as "Unknown"

**Solutions**:

1. Ensure `active-win` has necessary permissions
2. On macOS: grant Accessibility permissions
3. On Linux: check X11/Wayland compatibility

### High CPU/Memory Usage

**Issue**: App consuming excessive resources

**Solutions**:

1. Increase OCR interval (Settings → OCR Interval)
2. Disable screen capture if not needed
3. Reduce data retention period

### Build Errors

**Issue**: `npm run build` fails

**Solutions**:

```bash
# Clean and reinstall
rm -rf node_modules dist dist-electron release
npm install
npm run build
```

## Development

### Project Structure

-   `electron/` - Main process code (Node.js)
-   `src/` - Renderer process code (React)
-   `dist/` - Built renderer files
-   `dist-electron/` - Built main process files
-   `release/` - Packaged installers

### Adding a New Service

1. Create service in `electron/services/YourService.ts`
2. Export from `electron/services/index.ts`
3. Initialize in `electron/main.ts`
4. Add IPC handlers if needed
5. Update types in `electron/types/index.ts`

### Adding a New Component

1. Create component in `src/components/YourComponent.tsx`
2. Use inline styles (object-based)
3. Connect to context via `useProductivity()` hook
4. Add to navigation in `App.tsx`

## Contributing

This is a personal project scaffold, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure types are correct and no linting errors
5. Submit a pull request

## License

MIT License - feel free to use and modify for your own projects.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Roadmap

-   [ ] ML-based scoring model
-   [ ] Cloud sync (optional, encrypted)
-   [ ] Team productivity features
-   [ ] Pomodoro timer integration
-   [ ] Calendar integration (Google, Outlook)
-   [ ] Custom plant themes
-   [ ] Productivity insights & reports
-   [ ] Mobile companion app

---

**Built with ❤️ and TypeScript**

_Remember: This app is designed to help you, not surveil you. Your privacy is paramount._
