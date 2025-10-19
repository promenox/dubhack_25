import { exec } from "child_process";
import { promisify } from "util";
import { shell } from "electron";

const execAsync = promisify(exec);

interface ActivityMetadata {
	activeApp: string | null;
	windowTitle: string | null;
	url: string | null;
	keystrokeCount: number;
	mouseMovements: number;
	idleTime: number;
	activeTime: number;
	appSwitches: number;
	lastActivity: number;
	context: {
		goal: string | null;
		recentApps: Array<{
			app: string;
			title: string;
			url: string;
			timestamp: number;
			duration: number;
		}>;
		switchingPattern: string;
	};
}

interface WindowSummary {
	duration: number;
	activeApp: string | null;
	windowTitle: string | null;
	url: string | null;
	keystrokeCount: number;
	keystrokeRate: number;
	mouseMovements: number;
	mouseMovementRate: number;
	appSwitches: number;
	switchRate: number;
	focusRatio: number;
	idleRatio: number;
	context: ActivityMetadata["context"];
	timestamp: number;
}

class ActivityWindow {
	startTime: number;
	endTime: number;
	metadata: ActivityMetadata;
	isComplete: boolean;
	batchInterval: number; // 3-5 minute batching intervals

	constructor() {
		this.startTime = Date.now();
		// Randomize batch interval between 3-5 minutes for natural variation
		this.batchInterval = (3 + Math.random() * 2) * 60 * 1000; // 3-5 minutes
		this.endTime = this.startTime + this.batchInterval;
		this.metadata = {
			activeApp: null,
			windowTitle: null,
			url: null,
			keystrokeCount: 0,
			mouseMovements: 0,
			idleTime: 0,
			activeTime: 0,
			appSwitches: 0,
			lastActivity: Date.now(),
			context: {
				goal: null,
				recentApps: [],
				switchingPattern: "stable",
			},
		};
		this.isComplete = false;
	}

	addActivity(appName: string, windowTitle: string, keystrokes = 0, url = "", mouseMovements = 0) {
		const now = Date.now();

		// Track app switching (including tab changes for browsers)
		const activityKey = `${appName}|${url}`;
		const lastActivityKey = `${this.metadata.activeApp}|${this.metadata.url || ""}`;

		if (activityKey !== lastActivityKey) {
			this.metadata.appSwitches++;
			this.metadata.context.recentApps.push({
				app: appName,
				title: windowTitle,
				url: url,
				timestamp: now,
				duration: now - this.metadata.lastActivity,
			});

			// Keep only last 5 apps for context
			if (this.metadata.context.recentApps.length > 5) {
				this.metadata.context.recentApps.shift();
			}
		}

		// Update current app info
		this.metadata.activeApp = appName;
		this.metadata.windowTitle = windowTitle;
		this.metadata.url = url;
		this.metadata.keystrokeCount += keystrokes;
		this.metadata.mouseMovements += mouseMovements;
		this.metadata.lastActivity = now;

		// Update idle/active time
		const timeSinceLastActivity = now - this.metadata.lastActivity;
		if (timeSinceLastActivity > 30000) {
			// 30 seconds idle threshold
			this.metadata.idleTime += 1000;
		} else {
			this.metadata.activeTime += 1000;
		}

		// Analyze switching pattern
		this.analyzeSwitchingPattern();
	}

	analyzeSwitchingPattern() {
		const recentApps = this.metadata.context.recentApps;
		if (recentApps.length < 3) {
			this.metadata.context.switchingPattern = "stable";
			return;
		}

		const switchRate = this.metadata.appSwitches / ((Date.now() - this.startTime) / 60000);

		if (switchRate < 1) {
			this.metadata.context.switchingPattern = "focused";
		} else if (switchRate < 3) {
			this.metadata.context.switchingPattern = "stable";
		} else if (switchRate < 6) {
			this.metadata.context.switchingPattern = "multitasking";
		} else {
			this.metadata.context.switchingPattern = "distracted";
		}
	}

	isExpired(): boolean {
		return Date.now() >= this.endTime;
	}

	complete(): WindowSummary {
		this.isComplete = true;
		this.endTime = Date.now();
		return this.getSummary();
	}

	getSummary(): WindowSummary {
		const duration = this.endTime - this.startTime;
		const totalTime = this.metadata.activeTime + this.metadata.idleTime;
		const durationMinutes = duration / 60000;

		return {
			duration: duration,
			activeApp: this.metadata.activeApp,
			windowTitle: this.metadata.windowTitle,
			url: this.metadata.url,
			keystrokeCount: this.metadata.keystrokeCount,
			keystrokeRate: this.metadata.keystrokeCount / durationMinutes,
			mouseMovements: this.metadata.mouseMovements,
			mouseMovementRate: this.metadata.mouseMovements / durationMinutes,
			appSwitches: this.metadata.appSwitches,
			switchRate: this.metadata.appSwitches / durationMinutes,
			focusRatio: this.metadata.activeTime / totalTime,
			idleRatio: this.metadata.idleTime / totalTime,
			context: this.metadata.context,
			timestamp: this.startTime,
		};
	}
}

interface DemoApp {
	name: string;
	title: string;
	category: string;
	context: string;
}

export class FocusTracker {
	currentWindow: ActivityWindow;
	completedWindows: WindowSummary[];
	isTracking: boolean;
	isRunning: boolean;
	updateInterval: NodeJS.Timeout | null;
	demoMode: boolean;
	iohook: any;
	keystrokesSinceLastTick: number;
	mouseMovementsSinceLastTick: number;
	lastMouseX: number;
	lastMouseY: number;
	sessionStartTimestamp: number | null;
	demoApps: DemoApp[];
	currentAppIndex: number;
	lastSwitchTime: number;
	lastActiveApp: string | null;
	lastWindowTitle: string | null;
	lastUrl: string | null;

	constructor() {
		this.currentWindow = new ActivityWindow();
		this.completedWindows = [];
		this.isTracking = false;
		this.isRunning = false;
		this.updateInterval = null;
		this.demoMode = false;
		this.iohook = null;
		this.keystrokesSinceLastTick = 0;
		this.mouseMovementsSinceLastTick = 0;
		this.lastMouseX = 0;
		this.lastMouseY = 0;
		this.sessionStartTimestamp = null;

		// Demo apps for simulation
		this.demoApps = [
			{ name: "Visual Studio Code", title: "focus-ai.js - VS Code", category: "productive", context: "coding" },
			{ name: "Chrome", title: "GitHub - FocusAI Repository", category: "productive", context: "research" },
			{ name: "Terminal", title: "Terminal - npm run dev", category: "productive", context: "development" },
			{ name: "Slack", title: "#productivity-tools - Slack", category: "productive", context: "communication" },
			{ name: "Notion", title: "FocusAI Project Plan - Notion", category: "productive", context: "planning" },
			{ name: "Finder", title: "Documents", category: "neutral", context: "file-management" },
			{ name: "YouTube", title: "React Tutorial - YouTube", category: "productive", context: "learning" },
			{ name: "Twitter", title: "Home / X", category: "distracting", context: "social-media" },
			{ name: "Spotify", title: "Focus Playlist - Spotify", category: "neutral", context: "background-music" },
		];

		this.currentAppIndex = 0;
		this.lastSwitchTime = Date.now();
		this.lastActiveApp = null;
		this.lastWindowTitle = null;
		this.lastUrl = null;
	}

	start() {
		if (this.isTracking) return;

		this.isTracking = true;
		this.isRunning = true;
		this.sessionStartTimestamp = Date.now();
		console.log("FocusAI tracking started");

		// Initialize global key hook if available
		this.initKeyHook().catch(console.error);

		// Start activity monitoring
		this.startActivityMonitoring();

		// Start window management
		this.startWindowManagement();
	}

	stop() {
		this.isTracking = false;
		this.isRunning = false;

		if (this.updateInterval) {
			clearInterval(this.updateInterval);
		}

		this.disposeKeyHook();

		// Complete current window
		if (this.currentWindow && !this.currentWindow.isComplete) {
			this.completedWindows.push(this.currentWindow.complete());
		}

		console.log("FocusAI tracking stopped");
	}

	startActivityMonitoring() {
		// Event-driven tracking: only collect metadata on context changes
		// Engagement data (keystrokes/mouse) collected continuously at low frequency
		this.updateInterval = setInterval(() => {
			if (!this.isTracking) return;

			if (this.demoMode) {
				this.simulateActivity();
			} else {
				this.trackEngagementOnly();
				// Check for context changes every 3 seconds
				this.detectContextChanges();
			}
		}, 3000); // Low frequency engagement monitoring every 3 seconds
	}

	async detectContextChanges() {
		// Check for context changes (app, window, URL) and trigger event-driven metadata extraction
		try {
			let appName: string, windowTitle: string, url: string;

			if (process.platform === "darwin") {
				const result = await this.getActiveWindowInfoMacOS();
				appName = result.appName;
				windowTitle = result.windowTitle;
				url = result.url;
			} else if (process.platform === "win32") {
				const result = await this.getActiveWindowInfoWindows();
				appName = result.appName;
				windowTitle = result.windowTitle;
				url = result.url;
			} else {
				const result = await this.getActiveWindowInfoLinux();
				appName = result.appName;
				windowTitle = result.windowTitle;
				url = result.url;
			}

			// Check for any changes (app, window title, or URL)
			const hasAppChanged = appName && appName !== this.lastActiveApp;
			const hasWindowChanged = windowTitle && windowTitle !== this.lastWindowTitle;
			const hasUrlChanged = url && url !== this.lastUrl;

			if (hasAppChanged || hasWindowChanged || hasUrlChanged) {
				console.log(`🔄 Context change detected:`);
				if (hasAppChanged) console.log(`  App: ${this.lastActiveApp} → ${appName}`);
				if (hasWindowChanged) console.log(`  Window: ${this.lastWindowTitle} → ${windowTitle}`);
				if (hasUrlChanged) console.log(`  URL: ${this.lastUrl} → ${url}`);
				
				// Update tracking variables
				this.lastActiveApp = appName;
				this.lastWindowTitle = windowTitle;
				this.lastUrl = url;

				// Record the context change as activity
				const keystrokes = this.consumeKeystrokes();
				const mouseMovements = this.consumeMouseMovements();

				this.currentWindow.addActivity(
					appName || "Unknown App",
					windowTitle || "Unknown Window",
					keystrokes,
					url,
					mouseMovements
				);

				// Trigger immediate AI analysis for context change
				this.triggerContextAnalysis();
			}
		} catch (error: any) {
			// Log the error but don't fall back to demo mode immediately
			console.log("Context detection failed:", error.message);
			// Only fall back to demo mode after multiple consecutive failures
			// For now, let's not fall back to demo mode automatically
			// this.demoMode = true;
		}
	}

	simulateActivity() {
		// Simulate realistic activity patterns
		const now = Date.now();

		// Switch apps every 30-120 seconds
		if (now - this.lastSwitchTime > 30000 + Math.random() * 90000) {
			this.simulateAppSwitch();
			this.lastSwitchTime = now;
		}

		// Add keystroke activity based on current app
		const currentApp = this.demoApps[this.currentAppIndex];
		const keystrokes = this.getKeystrokeRate(currentApp.category);

		this.currentWindow.addActivity(currentApp.name, currentApp.title, keystrokes);
	}

	simulateAppSwitch() {
		// Pick next app with realistic patterns
		const random = Math.random();
		let nextIndex;

		if (random < 0.7) {
			// 70% chance of productive app
			nextIndex = Math.floor(Math.random() * 5);
		} else if (random < 0.9) {
			// 20% chance of neutral app
			nextIndex = 5 + Math.floor(Math.random() * 2);
		} else {
			// 10% chance of distracting app
			nextIndex = 7 + Math.floor(Math.random() * 2);
		}

		this.currentAppIndex = nextIndex;
		const app = this.demoApps[nextIndex];

		console.log(`Switched to: ${app.name} (${app.category}) - ${app.context}`);
	}

	getKeystrokeRate(category: string): number {
		const baseRates: Record<string, number> = {
			productive: 15 + Math.floor(Math.random() * 25), // 15-40 per interval
			neutral: 5 + Math.floor(Math.random() * 15), // 5-20 per interval
			distracting: 2 + Math.floor(Math.random() * 8), // 2-10 per interval
		};

		return baseRates[category] || 10;
	}

	async trackEngagementOnly() {
		// Only track engagement metrics (keystrokes, mouse movements) continuously
		// Context metadata is collected only on actual changes
		const keystrokes = this.consumeKeystrokes();
		const mouseMovements = this.consumeMouseMovements();

		// Debug logging for keystroke tracking
		if (keystrokes > 0) {
			console.log(`🔑 Consumed ${keystrokes} keystrokes from tracking`);
		}

		// Update engagement data in current window
		if (keystrokes > 0 || mouseMovements > 0) {
			this.currentWindow.addActivity(
				this.lastActiveApp || "Unknown App",
				this.lastWindowTitle || "Unknown Window",
				keystrokes,
				this.lastUrl || "",
				mouseMovements
			);
		}
	}


	triggerContextAnalysis() {
		// Trigger AI reasoning for context analysis when context changes
		console.log("🧠 Triggering AI context analysis for new context");
		// This will be handled by the FocusAI system when it processes the new context
	}

	async initKeyHook() {
		try {
			console.log("Attempting to initialize keystroke tracking...");
			console.log("Current context:", typeof process, process.platform);
			
			// Check if we're in the main process
			if (!process || process.type === 'renderer') {
				throw new Error("Not running in main process");
			}

			// Use Electron's built-in keyboard event tracking instead of uiohook-napi
			// This avoids ESM compatibility issues
			console.log("Using Electron's built-in keyboard event tracking");
			this.keystrokesSinceLastTick = 0;
			this.mouseMovementsSinceLastTick = 0;
			
			// We'll set up the actual event listeners in the main process
			// when the main window is created and ready
			console.log("✓ Keyboard tracking initialized (will be connected to window events)");
			console.log("  Note: This tracks keystrokes in the main window only");
			console.log("  Note: macOS may require accessibility permissions for keystroke tracking");
		} catch (e) {
			this.iohook = null;
			console.error("✗ Global key hook failed to start:", e);
			console.warn("  Falling back to demo mode");
			console.warn("  To enable keystroke tracking:");
			console.warn("  1. Grant accessibility permissions to the app in System Preferences");
			console.warn("  2. Restart the application");
			
			// Check if this is a permission issue and provide guidance
			this.checkAccessibilityPermissions();
		}
	}

	async checkAccessibilityPermissions() {
		try {
			if (process.platform === 'darwin') {
				console.log("🔍 Checking macOS accessibility permissions...");
				
				// Try to open System Preferences to accessibility settings
				const { exec } = require('child_process');
				exec('open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"', (error: any) => {
					if (error) {
						console.log("💡 To enable keystroke tracking:");
						console.log("   1. Open System Preferences > Security & Privacy > Privacy > Accessibility");
						console.log("   2. Add this app to the list and enable it");
						console.log("   3. Restart the application");
					} else {
						console.log("💡 System Preferences opened - please grant accessibility permissions to this app");
					}
				});
			}
		} catch (e) {
			console.log("💡 Manual steps to enable keystroke tracking:");
			console.log("   1. Open System Preferences > Security & Privacy > Privacy > Accessibility");
			console.log("   2. Add this app to the list and enable it");
			console.log("   3. Restart the application");
		}
	}

	disposeKeyHook() {
		try {
			if (this.iohook) {
				this.iohook.removeAllListeners("keydown");
				this.iohook.removeAllListeners("mousemove");
				this.iohook.stop();
				this.iohook = null;
				console.log("Global key hook stopped");
			}
		} catch (_) {}
	}

	consumeKeystrokes(): number {
		const count = this.keystrokesSinceLastTick;
		this.keystrokesSinceLastTick = 0;
		return count;
	}

	consumeMouseMovements(): number {
		const count = this.mouseMovementsSinceLastTick;
		this.mouseMovementsSinceLastTick = 0;
		return count;
	}

	getSessionDuration(): number {
		if (!this.sessionStartTimestamp) return 0;
		return Date.now() - this.sessionStartTimestamp;
	}

	async getActiveWindowInfoMacOS(): Promise<{ appName: string; windowTitle: string; url: string }> {
		const script = `
      tell application "System Events"
        set frontApp to first application process whose frontmost is true
        set appName to name of frontApp
        try
          if appName is "Google Chrome" then
            tell application "Google Chrome"
              set activeTab to active tab of front window
              set tabTitle to title of activeTab
              set tabURL to URL of activeTab
              return appName & "|" & tabTitle & "|" & tabURL
            end tell
          else if appName is "Safari" then
            tell application "Safari"
              set tabTitle to name of current tab of front window
              set tabURL to URL of current tab of front window
              return appName & "|" & tabTitle & "|" & tabURL
            end tell
          else
            set windowTitle to name of first window of frontApp
            return appName & "|" & windowTitle & "|"
          end if
        on error
          try
            set windowTitle to name of first window of frontApp
            return appName & "|" & windowTitle & "|"
          on error
            return appName & "|Unknown Window|"
          end try
        end try
      end tell
    `;

		const { stdout } = await execAsync(`osascript -e '${script}'`);
		const parts = String(stdout).trim().split("|");
		return {
			appName: parts[0],
			windowTitle: parts[1],
			url: parts[2] || "",
		};
	}

	async getActiveWindowInfoWindows(): Promise<{ appName: string; windowTitle: string; url: string }> {
		const script = `
Add-Type -TypeDefinition @"
 using System;
 using System.Runtime.InteropServices;
 using System.Text;
 public class Win32 {
   [DllImport("user32.dll")]
   public static extern IntPtr GetForegroundWindow();
   [DllImport("user32.dll")]
   public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
   [DllImport("user32.dll")]
   public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
 }
"@
Add-Type -AssemblyName UIAutomationClient
$hwnd = [Win32]::GetForegroundWindow()
$processId = 0
[Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId)
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
$windowTitle = New-Object System.Text.StringBuilder 256
[Win32]::GetWindowText($hwnd, $windowTitle, 256)
$appName = if ($process) { $process.ProcessName } else { "Unknown" }
$title = $windowTitle.ToString()
$url = ""

# Try to get URL for common browsers via UI Automation
try {
  if ($appName -match "^(chrome|msedge|brave|opera|firefox)$") {
    $ae = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
    $editCond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)
    $edits = $ae.FindAll([System.Windows.Automation.TreeScope]::Subtree, $editCond)
    foreach ($e in $edits) {
      $n = $e.Current.Name
      if ($n -match "Address and search bar|Search or enter address|Search with Google|Address and search|Address and search box") {
        try {
          $vp = $e.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
          if ($vp -and $vp.Current.Value) {
            $url = $vp.Current.Value
            break
          }
        } catch {}
      }
    }
  }
} catch {}

Write-Output "$appName|$title|$url"
    `;

		try {
			const encoded = Buffer.from(script, "utf16le").toString("base64");
			const command = `powershell -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;
			const { stdout } = await execAsync(command, {
				timeout: 5000,
				windowsHide: true,
				maxBuffer: 1024 * 1024,
			} as any);
			const parts = String(stdout).trim().split("|");
			return {
				appName: parts[0] || "Unknown App",
				windowTitle: parts[1] || "Unknown Window",
				url: parts[2] || "",
			};
		} catch (error) {
			console.error("Windows PowerShell execution failed:", error);
			return { appName: "Unknown App", windowTitle: "Unknown Window", url: "" };
		}
	}

	async getActiveWindowInfoLinux(): Promise<{ appName: string; windowTitle: string; url: string }> {
		try {
			// Try to use xdotool if available
			const { stdout } = await execAsync("xdotool getactivewindow getwindowname");
			const windowTitle = String(stdout).trim();
			const { stdout: pid } = await execAsync("xdotool getactivewindow getwindowpid");
			const { stdout: processName } = await execAsync(`ps -p ${String(pid).trim()} -o comm=`);

			return {
				appName: String(processName).trim() || "Unknown App",
				windowTitle: windowTitle || "Unknown Window",
				url: "",
			};
		} catch (error) {
			console.error("Linux xdotool execution failed:", error);
			return { appName: "Unknown App", windowTitle: "Unknown Window", url: "" };
		}
	}

	startWindowManagement() {
		// Check for window completion every 10 seconds
		setInterval(() => {
			if (this.currentWindow.isExpired()) {
				this.completeCurrentWindow();
				this.startNewWindow();
			}
		}, 10000);
	}

	completeCurrentWindow() {
		const summary = this.currentWindow.complete();
		this.completedWindows.push(summary);

		console.log("Completed 3-minute window:", {
			app: summary.activeApp,
			switches: summary.appSwitches,
			keystrokes: summary.keystrokeCount,
			focusRatio: Math.round(summary.focusRatio * 100) + "%",
			pattern: summary.context.switchingPattern,
		});
	}

	startNewWindow() {
		this.currentWindow = new ActivityWindow();
		console.log("Started new 3-minute activity window");
	}

	getCurrentMetrics() {
		return {
			currentWindow: this.currentWindow.getSummary(),
			completedWindows: this.completedWindows.slice(-5), // Last 5 windows
			totalWindows: this.completedWindows.length,
			sessionDuration: Date.now() - (this.completedWindows[0]?.timestamp || Date.now()),
		};
	}

	getRecentActivity() {
		return this.completedWindows.slice(-3); // Last 3 windows for AI analysis
	}
}

export type { WindowSummary };

