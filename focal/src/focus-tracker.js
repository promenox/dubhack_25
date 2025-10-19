class ActivityWindow {
  constructor() {
    this.startTime = Date.now();
    this.endTime = this.startTime + (3 * 60 * 1000); // 3 minutes
    this.metadata = {
      activeApp: null,
      windowTitle: null,
      url: null,
      keystrokeCount: 0,
      idleTime: 0,
      activeTime: 0,
      appSwitches: 0,
      lastActivity: Date.now(),
      context: {
        goal: null,
        recentApps: [],
        switchingPattern: 'stable'
      }
    };
    this.isComplete = false;
  }

  addActivity(appName, windowTitle, keystrokes = 0, url = '') {
    const now = Date.now();
    
    // Track app switching (including tab changes for browsers)
    const activityKey = `${appName}|${url}`;
    const lastActivityKey = `${this.metadata.activeApp}|${this.metadata.url || ''}`;
    
    if (activityKey !== lastActivityKey) {
      this.metadata.appSwitches++;
      this.metadata.context.recentApps.push({
        app: appName,
        title: windowTitle,
        url: url,
        timestamp: now,
        duration: now - this.metadata.lastActivity
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
    this.metadata.lastActivity = now;
    
    // Update idle/active time
    const timeSinceLastActivity = now - this.metadata.lastActivity;
    if (timeSinceLastActivity > 30000) { // 30 seconds idle threshold
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
      this.metadata.context.switchingPattern = 'stable';
      return;
    }
    
    const uniqueApps = new Set(recentApps.map(app => app.app));
    const switchRate = this.metadata.appSwitches / ((Date.now() - this.startTime) / 60000);
    
    if (switchRate < 1) {
      this.metadata.context.switchingPattern = 'focused';
    } else if (switchRate < 3) {
      this.metadata.context.switchingPattern = 'stable';
    } else if (switchRate < 6) {
      this.metadata.context.switchingPattern = 'multitasking';
    } else {
      this.metadata.context.switchingPattern = 'distracted';
    }
  }

  isExpired() {
    return Date.now() >= this.endTime;
  }

  complete() {
    this.isComplete = true;
    this.endTime = Date.now();
    return this.getSummary();
  }

  getSummary() {
    const duration = this.endTime - this.startTime;
    const totalTime = this.metadata.activeTime + this.metadata.idleTime;
    
    return {
      duration: duration,
      activeApp: this.metadata.activeApp,
      windowTitle: this.metadata.windowTitle,
      url: this.metadata.url,
      keystrokeCount: this.metadata.keystrokeCount,
      keystrokeRate: this.metadata.keystrokeCount / (duration / 60000),
      appSwitches: this.metadata.appSwitches,
      switchRate: this.metadata.appSwitches / (duration / 60000),
      focusRatio: this.metadata.activeTime / totalTime,
      idleRatio: this.metadata.idleTime / totalTime,
      context: this.metadata.context,
      timestamp: this.startTime
    };
  }
}

class FocusTracker {
  constructor() {
    this.currentWindow = new ActivityWindow();
    this.completedWindows = [];
    this.isTracking = false;
    this.isRunning = false;
    this.updateInterval = null;
    this.demoMode = false;
    
    // Demo apps for simulation
    this.demoApps = [
      { name: 'Visual Studio Code', title: 'focus-ai.js - VS Code', category: 'productive', context: 'coding' },
      { name: 'Chrome', title: 'GitHub - FocusAI Repository', category: 'productive', context: 'research' },
      { name: 'Terminal', title: 'Terminal - npm run dev', category: 'productive', context: 'development' },
      { name: 'Slack', title: '#productivity-tools - Slack', category: 'productive', context: 'communication' },
      { name: 'Notion', title: 'FocusAI Project Plan - Notion', category: 'productive', context: 'planning' },
      { name: 'Finder', title: 'Documents', category: 'neutral', context: 'file-management' },
      { name: 'YouTube', title: 'React Tutorial - YouTube', category: 'productive', context: 'learning' },
      { name: 'Twitter', title: 'Home / X', category: 'distracting', context: 'social-media' },
      { name: 'Spotify', title: 'Focus Playlist - Spotify', category: 'neutral', context: 'background-music' }
    ];
    
    this.currentAppIndex = 0;
    this.lastSwitchTime = Date.now();
    this.lastActiveApp = null;
  }

  start() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.isRunning = true;
    console.log('FocusAI tracking started');
    
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
    
    // Complete current window
    if (this.currentWindow && !this.currentWindow.isComplete) {
      this.completedWindows.push(this.currentWindow.complete());
    }
    
    console.log('FocusAI tracking stopped');
  }

  startActivityMonitoring() {
    this.updateInterval = setInterval(() => {
      if (!this.isTracking) return;
      
      if (this.demoMode) {
        this.simulateActivity();
      } else {
        this.trackRealActivity();
      }
    }, 2000); // Update every 2 seconds
  }

  simulateActivity() {
    // Simulate realistic activity patterns
    const now = Date.now();
    
    // Switch apps every 30-120 seconds
    if (now - this.lastSwitchTime > (30000 + Math.random() * 90000)) {
      this.simulateAppSwitch();
      this.lastSwitchTime = now;
    }
    
    // Add keystroke activity based on current app
    const currentApp = this.demoApps[this.currentAppIndex];
    const keystrokes = this.getKeystrokeRate(currentApp.category);
    
    this.currentWindow.addActivity(
      currentApp.name,
      currentApp.title,
      keystrokes
    );
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

  getKeystrokeRate(category) {
    const baseRates = {
      'productive': 15 + Math.floor(Math.random() * 25), // 15-40 per interval
      'neutral': 5 + Math.floor(Math.random() * 15),     // 5-20 per interval
      'distracting': 2 + Math.floor(Math.random() * 8)   // 2-10 per interval
    };
    
    return baseRates[category] || 10;
  }

  async trackRealActivity() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      let appName, windowTitle, url;
      
      if (process.platform === 'darwin') {
        // macOS: Use AppleScript
        const result = await this.getActiveWindowInfoMacOS(execAsync);
        appName = result.appName;
        windowTitle = result.windowTitle;
        url = result.url;
      } else if (process.platform === 'win32') {
        // Windows: Use PowerShell
        const result = await this.getActiveWindowInfoWindows(execAsync);
        appName = result.appName;
        windowTitle = result.windowTitle;
        url = result.url;
      } else {
        // Linux/Other: Fallback to basic detection
        const result = await this.getActiveWindowInfoLinux(execAsync);
        appName = result.appName;
        windowTitle = result.windowTitle;
        url = result.url;
      }
      
      if (appName && appName !== this.lastActiveApp) {
        console.log(`Real switch detected: ${appName} - ${windowTitle}${url ? ` (${url})` : ''}`);
        this.lastActiveApp = appName;
      }
      
      // Add realistic keystroke activity based on app type and content
      const keystrokes = this.getRealKeystrokeRate(appName, url);
      
      this.currentWindow.addActivity(
        appName || 'Unknown App',
        windowTitle || 'Unknown Window',
        keystrokes,
        url
      );
      
    } catch (error) {
      console.log('Real activity tracking failed, falling back to demo mode:', error.message);
      this.demoMode = true;
      this.simulateActivity();
    }
  }

  async getActiveWindowInfoMacOS(execAsync) {
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
    const parts = stdout.trim().split('|');
    return {
      appName: parts[0],
      windowTitle: parts[1],
      url: parts[2] || ''
    };
  }

  async getActiveWindowInfoWindows(execAsync) {
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
      $hwnd = [Win32]::GetForegroundWindow()
      $processId = 0
      [Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId)
      $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
      $windowTitle = New-Object System.Text.StringBuilder 256
      [Win32]::GetWindowText($hwnd, $windowTitle, 256)
      $appName = if ($process) { $process.ProcessName } else { "Unknown" }
      $title = $windowTitle.ToString()
      Write-Output "$appName|$title|"
    `;
    
    try {
      const { stdout } = await execAsync(`powershell -Command "${script}"`);
      const parts = stdout.trim().split('|');
      return {
        appName: parts[0] || 'Unknown App',
        windowTitle: parts[1] || 'Unknown Window',
        url: parts[2] || ''
      };
    } catch (error) {
      console.error('Windows PowerShell execution failed:', error);
      return { appName: 'Unknown App', windowTitle: 'Unknown Window', url: '' };
    }
  }

  async getActiveWindowInfoLinux(execAsync) {
    try {
      // Try to use xdotool if available
      const { stdout } = await execAsync('xdotool getactivewindow getwindowname');
      const windowTitle = stdout.trim();
      const { stdout: pid } = await execAsync('xdotool getactivewindow getwindowpid');
      const { stdout: processName } = await execAsync(`ps -p ${pid.trim()} -o comm=`);
      
      return {
        appName: processName.trim() || 'Unknown App',
        windowTitle: windowTitle || 'Unknown Window',
        url: ''
      };
    } catch (error) {
      console.error('Linux xdotool execution failed:', error);
      return { appName: 'Unknown App', windowTitle: 'Unknown Window', url: '' };
    }
  }

  getRealKeystrokeRate(appName, url = '') {
    // Estimate keystroke rate based on app type and URL content
    const appLower = (appName || '').toLowerCase();
    const urlLower = url.toLowerCase();
    
    if (appLower.includes('code') || appLower.includes('terminal') || appLower.includes('editor') || 
        appLower.includes('cursor') || appLower.includes('vscode') || appLower.includes('notepad++')) {
      return 20 + Math.floor(Math.random() * 30); // 20-50 for coding
    } else if (appLower.includes('chrome') || appLower.includes('safari') || appLower.includes('firefox') || 
               appLower.includes('edge') || appLower.includes('browser')) {
      // Analyze URL to determine activity level
      if (urlLower.includes('github.com') || urlLower.includes('stackoverflow.com') || urlLower.includes('docs.')) {
        return 15 + Math.floor(Math.random() * 20); // 15-35 for development/research
      } else if (urlLower.includes('youtube.com') || urlLower.includes('netflix.com') || urlLower.includes('twitch.tv')) {
        return 2 + Math.floor(Math.random() * 8); // 2-10 for video consumption
      } else if (urlLower.includes('twitter.com') || urlLower.includes('instagram.com') || urlLower.includes('facebook.com')) {
        return 3 + Math.floor(Math.random() * 12); // 3-15 for social media
      } else if (urlLower.includes('gmail.com') || urlLower.includes('outlook.com') || urlLower.includes('slack.com')) {
        return 10 + Math.floor(Math.random() * 20); // 10-30 for communication
      } else if (urlLower.includes('notion.so') || urlLower.includes('docs.google.com') || urlLower.includes('airtable.com')) {
        return 20 + Math.floor(Math.random() * 25); // 20-45 for productivity tools
      } else if (urlLower.includes('reddit.com') || urlLower.includes('hackernews') || urlLower.includes('news.')) {
        return 5 + Math.floor(Math.random() * 10); // 5-15 for news/forums
      } else {
        return 8 + Math.floor(Math.random() * 17); // 8-25 default browsing
      }
    } else if (appLower.includes('slack') || appLower.includes('discord') || appLower.includes('teams')) {
      return 15 + Math.floor(Math.random() * 25); // 15-40 for communication
    } else if (appLower.includes('notion') || appLower.includes('obsidian') || appLower.includes('bear')) {
      return 25 + Math.floor(Math.random() * 35); // 25-60 for writing
    } else if (appLower.includes('youtube') || appLower.includes('netflix') || appLower.includes('spotify')) {
      return 2 + Math.floor(Math.random() * 8); // 2-10 for media
    } else if (appLower.includes('twitter') || appLower.includes('instagram') || appLower.includes('facebook')) {
      return 3 + Math.floor(Math.random() * 12); // 3-15 for social media
    } else {
      return 8 + Math.floor(Math.random() * 17); // 8-25 default
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
    
    console.log('Completed 3-minute window:', {
      app: summary.activeApp,
      switches: summary.appSwitches,
      keystrokes: summary.keystrokeCount,
      focusRatio: Math.round(summary.focusRatio * 100) + '%',
      pattern: summary.context.switchingPattern
    });
  }

  startNewWindow() {
    this.currentWindow = new ActivityWindow();
    console.log('Started new 3-minute activity window');
  }

  getCurrentMetrics() {
    return {
      currentWindow: this.currentWindow.getSummary(),
      completedWindows: this.completedWindows.slice(-5), // Last 5 windows
      totalWindows: this.completedWindows.length,
      sessionDuration: Date.now() - (this.completedWindows[0]?.timestamp || Date.now())
    };
  }

  getRecentActivity() {
    return this.completedWindows.slice(-3); // Last 3 windows for AI analysis
  }
}

module.exports = FocusTracker;
