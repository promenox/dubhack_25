# Development Guide 🛠️

Comprehensive guide for developing and extending Productivity Garden.

## Project Architecture

### Technology Stack

```
┌─────────────────────────────────────────────┐
│           Electron Application              │
├─────────────────┬───────────────────────────┤
│  Main Process   │    Renderer Process       │
│  (Node.js)      │    (React + TypeScript)   │
├─────────────────┼───────────────────────────┤
│ • Services      │ • Components              │
│ • IPC Handlers  │ • Context/State           │
│ • Native APIs   │ • Hooks                   │
└─────────────────┴───────────────────────────┘
```

### Directory Structure

```
my-app/
├── electron/                    # Main process code
│   ├── main.ts                 # Entry point, window management
│   ├── preload.ts              # Secure IPC bridge
│   ├── types/                  # Shared TypeScript types
│   │   └── index.ts
│   └── services/               # Modular services
│       ├── ScreenCaptureService.ts
│       ├── WindowTrackerService.ts
│       ├── InputTrackerService.ts
│       ├── ProductivityEngine.ts
│       ├── DataService.ts
│       └── index.ts
│
├── src/                        # Renderer process code
│   ├── components/             # React components
│   │   ├── Dashboard.tsx
│   │   ├── Goals.tsx
│   │   ├── Settings.tsx
│   │   └── GardenOverlay.tsx
│   ├── context/               # React context
│   │   └── ProductivityContext.tsx
│   ├── hooks/                 # Custom hooks
│   │   └── useInputTracking.ts
│   ├── types/                 # Renderer types
│   │   └── electron.d.ts
│   ├── App.tsx                # Root component
│   ├── main.tsx               # React entry point
│   └── index.css              # Global styles
│
├── dist/                       # Built renderer (Vite output)
├── dist-electron/             # Built main process
├── release/                   # Packaged installers
├── public/                    # Static assets
├── package.json               # Dependencies & scripts
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config
└── electron-builder.json5    # Builder config
```

## Development Workflow

### Setup Development Environment

```bash
# Clone and setup
git clone <your-repo>
cd my-app
npm install

# Start development server
npm run dev
```

### Development Mode Features

-   **Hot Module Replacement (HMR)**: Changes to React components reload instantly
-   **Main Process Reload**: Changes to main.ts trigger app restart
-   **DevTools**: Automatically opened for debugging
-   **Source Maps**: Full TypeScript debugging support

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Format code (if using Prettier)
npx prettier --write "src/**/*.{ts,tsx}"
```

## Service Architecture

### Creating a New Service

1. **Define the service class:**

```typescript
// electron/services/MyNewService.ts
export class MyNewService {
	private isRunning: boolean = false;
	private callback?: (data: MyData) => void;

	constructor() {
		console.log("[MyNewService] Initialized");
	}

	// Register callback for updates
	onUpdate(callback: (data: MyData) => void): void {
		this.callback = callback;
	}

	// Start the service
	start(): void {
		if (this.isRunning) return;
		this.isRunning = true;
		// Start logic...
	}

	// Stop the service
	stop(): void {
		if (!this.isRunning) return;
		this.isRunning = false;
		// Cleanup...
	}

	// Destroy/cleanup
	destroy(): void {
		this.stop();
		// Final cleanup...
	}
}
```

2. **Export from index:**

```typescript
// electron/services/index.ts
export { MyNewService } from "./MyNewService.js";
```

3. **Initialize in main.ts:**

```typescript
// electron/main.ts
import { MyNewService } from "./services/index.js";

let myNewService: MyNewService;

async function initializeServices() {
	myNewService = new MyNewService();

	myNewService.onUpdate((data) => {
		mainWindow?.webContents.send("my-new:update", data);
	});

	myNewService.start();
}
```

4. **Add IPC handlers (if needed):**

```typescript
// electron/main.ts
ipcMain.handle("my-new:action", async () => {
	return await myNewService.doSomething();
});
```

5. **Update types:**

```typescript
// electron/types/index.ts
export const IPC_CHANNELS = {
	// ...existing
	MY_NEW_UPDATE: "my-new:update",
	MY_NEW_ACTION: "my-new:action",
} as const;

export interface MyData {
	// Define your data structure
}
```

6. **Expose in preload:**

```typescript
// electron/preload.ts
const electronAPI: ElectronAPI = {
	// ...existing
	onMyNewUpdate: (callback) => {
		const listener = (_: any, data: any) => callback(data);
		ipcRenderer.on("my-new:update", listener);
		return () => ipcRenderer.removeListener("my-new:update", listener);
	},

	doMyNewAction: () => {
		return ipcRenderer.invoke("my-new:action");
	},
};
```

## React Component Development

### Component Guidelines

1. **Use functional components with hooks**
2. **Define styles inline as objects**
3. **Connect to context via `useProductivity()`**
4. **Type all props and state**

### Component Template

```typescript
import React, { useState } from "react";
import { useProductivity } from "../context/ProductivityContext";

const styles = {
	container: {
		padding: "2rem",
		backgroundColor: "#1e1e1e",
		borderRadius: "8px",
	},
	title: {
		fontSize: "1.5rem",
		fontWeight: "bold" as const,
		color: "#fff",
	},
};

interface MyComponentProps {
	title: string;
	onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
	const { metrics } = useProductivity();
	const [localState, setLocalState] = useState(0);

	return (
		<div style={styles.container}>
			<h2 style={styles.title}>{title}</h2>
			{/* Component content */}
		</div>
	);
};
```

### Adding to Navigation

```typescript
// src/App.tsx
const renderContent = () => {
	switch (currentView) {
		case "my-new-view":
			return <MyComponent />;
		// ...
	}
};

// Add nav item
<div style={styles.navItem} onClick={() => setCurrentView("my-new-view")}>
	<span>My New View</span>
</div>;
```

## IPC Communication Patterns

### Sending from Main → Renderer

```typescript
// Main process
mainWindow?.webContents.send("channel-name", data);

// Renderer (via preload)
window.electron.onChannelName((data) => {
	console.log("Received:", data);
});
```

### Invoking from Renderer → Main

```typescript
// Renderer
const result = await window.electron.doSomething(arg);

// Main process
ipcMain.handle("channel:do-something", async (_, arg) => {
	return await doSomething(arg);
});
```

## Testing

### Manual Testing Checklist

-   [ ] Dashboard displays metrics correctly
-   [ ] Goals can be created/edited/deleted
-   [ ] Settings persist across restarts
-   [ ] Overlay appears and updates
-   [ ] OCR captures and processes text
-   [ ] Window tracking identifies apps
-   [ ] Input tracking counts events
-   [ ] Data export works
-   [ ] Data deletion works

### Testing Services in Isolation

```typescript
// Test script: test-service.ts
import { ScreenCaptureService } from "./electron/services/ScreenCaptureService";

async function test() {
	const service = new ScreenCaptureService(10);
	await service.initialize();

	service.onOCRResult((result) => {
		console.log("OCR Result:", result);
	});

	await service.start();

	setTimeout(() => {
		service.stop();
		service.destroy();
	}, 60000);
}

test();
```

Run with:

```bash
npx tsx test-service.ts
```

## Debugging

### Main Process Debugging

Add breakpoints in VSCode:

```json
// .vscode/launch.json
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "Debug Main Process",
			"type": "node",
			"request": "launch",
			"cwd": "${workspaceFolder}/my-app",
			"runtimeExecutable": "${workspaceFolder}/my-app/node_modules/.bin/electron",
			"args": ["."],
			"outputCapture": "std"
		}
	]
}
```

### Renderer Process Debugging

-   DevTools automatically open in development
-   Use React DevTools browser extension
-   Console.log statements appear in DevTools console

### Common Issues

**Issue: Module not found**

```bash
# Check file extensions in imports
# Use .js extensions in imports (TypeScript compiles to .js)
import { Service } from './Service.js'; // Not .ts
```

**Issue: IPC not working**

```
1. Check channel names match exactly
2. Verify preload script is registered
3. Check contextIsolation is enabled
4. Ensure types match between main/renderer
```

**Issue: Build fails**

```bash
# Clean and rebuild
rm -rf dist dist-electron node_modules
npm install
npm run build
```

## Performance Optimization

### Reducing CPU Usage

1. **Increase intervals:**

```typescript
screenCaptureService.setCaptureInterval(60); // 60s instead of 30s
windowTrackerService.setPollInterval(10); // 10s instead of 5s
```

2. **Disable unused features:**

```typescript
await window.electron.updateSettings({
	telemetry: {
		screenCapture: false, // Disable if not needed
	},
});
```

3. **Optimize OCR:**

```typescript
// Use smaller capture size
const thumbnail = source.thumbnail.resize({ width: 1280, height: 720 });
```

### Memory Management

-   Services properly cleanup on destroy()
-   Event listeners removed on unmount
-   Large data structures cleared periodically
-   Retention policy limits stored events

## Extending the Scoring Algorithm

### Current Rule-Based System

```typescript
// ProductivityEngine.ts
final_score = focus_score * 0.4 + activity_score * 0.3 + context_score * 0.3;
```

### Adding Custom Rules

```typescript
// Custom scoring logic
class CustomProductivityEngine extends ProductivityEngine {
	protected calculateActivityScore(): number {
		const base = super.calculateActivityScore();

		// Add your custom logic
		if (this.isInFlowState()) {
			return Math.min(100, base * 1.2); // 20% boost
		}

		return base;
	}

	private isInFlowState(): boolean {
		// Define flow state detection logic
		return this.state.lastInput!.keystrokesPerMinute > 60 && this.state.lastInput!.idleTimeSeconds < 30;
	}
}
```

### Integrating ML Models

```typescript
import * as tf from "@tensorflow/tfjs-node";

class MLProductivityEngine extends ProductivityEngine {
	private model?: tf.LayersModel;

	async loadModel(path: string) {
		this.model = await tf.loadLayersModel(`file://${path}`);
	}

	protected calculateScore(): number {
		if (!this.model) return super.calculateScore();

		// Prepare features
		const features = tf.tensor2d([
			[
				this.state.lastOCR?.confidence ?? 0,
				this.state.lastInput?.keystrokesPerMinute ?? 0,
				this.state.lastWindow?.category === "productive" ? 1 : 0,
				// ... more features
			],
		]);

		// Predict
		const prediction = this.model.predict(features) as tf.Tensor;
		const score = prediction.dataSync()[0] * 100;

		features.dispose();
		prediction.dispose();

		return score;
	}
}
```

## Building & Distribution

### Development Build

```bash
npm run build
```

Outputs:

-   `dist/` - Renderer bundle
-   `dist-electron/` - Main process bundle

### Create Installers

```bash
# Current platform
npm run dist

# Specific platform
npm run dist -- --mac
npm run dist -- --win
npm run dist -- --linux
```

### Code Signing (macOS)

```json
// package.json
"build": {
  "mac": {
    "identity": "Developer ID Application: Your Name",
    "hardenedRuntime": true,
    "entitlements": "entitlements.mac.plist"
  }
}
```

### Auto-Updates (Future)

```typescript
// electron/main.ts
import { autoUpdater } from "electron-updater";

autoUpdater.checkForUpdatesAndNotify();
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## Resources

-   [Electron Documentation](https://www.electronjs.org/docs)
-   [React Documentation](https://react.dev)
-   [TypeScript Handbook](https://www.typescriptlang.org/docs/)
-   [Vite Documentation](https://vitejs.dev)
-   [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)

---

Happy coding! 🚀
