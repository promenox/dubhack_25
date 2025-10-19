class ActivityTracker {
  constructor() {
    this.isTracking = false;
    this.metrics = {
      keystrokes: 0,
      windowSwitches: 0,
      activeApps: new Map(),
      currentApp: null,
      sessionStart: Date.now(),
      lastActivity: Date.now(),
      idleTime: 0,
      totalActiveTime: 0
    };
    
    this.lastActiveWindow = null;
    this.activityInterval = null;
    this.idleThreshold = 30000; // 30 seconds
    
    // Demo apps for simulation
    this.demoApps = [
      { name: 'Visual Studio Code', title: 'index.js - focal', category: 'productive' },
      { name: 'Chrome', title: 'GitHub - Google Chrome', category: 'productive' },
      { name: 'Terminal', title: 'Terminal', category: 'productive' },
      { name: 'Slack', title: '#general - Slack', category: 'productive' },
      { name: 'Finder', title: 'Documents', category: 'neutral' },
      { name: 'YouTube', title: 'Productivity Tips - YouTube', category: 'distracting' },
      { name: 'Twitter', title: 'Home / X', category: 'distracting' },
      { name: 'Safari', title: 'Apple Developer', category: 'productive' }
    ];
    
    this.currentAppIndex = 0;
  }

  start() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.metrics.sessionStart = Date.now();
    
    // Start simulated activity tracking
    this.simulateActivity();
    
    console.log('Activity tracking started (demo mode)');
  }

  stop() {
    this.isTracking = false;
    
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
    }
    
    console.log('Activity tracking stopped');
  }

  simulateActivity() {
    // Simulate realistic app switching and activity
    this.activityInterval = setInterval(() => {
      if (!this.isTracking) return;
      
      // Simulate app switching every 10-30 seconds
      if (Math.random() < 0.3) { // 30% chance to switch apps
        this.simulateAppSwitch();
      }
      
      // Simulate keystroke activity
      this.simulateKeystrokes();
      
      // Update idle/active time
      this.updateIdleTime();
      
    }, 2000); // Update every 2 seconds
  }

  simulateAppSwitch() {
    // Pick a random app (with some bias toward productive apps)
    const random = Math.random();
    let appIndex;
    
    if (random < 0.6) {
      // 60% chance of productive app
      appIndex = Math.floor(Math.random() * 4); // First 4 are productive
    } else if (random < 0.8) {
      // 20% chance of neutral app
      appIndex = 4; // Finder
    } else {
      // 20% chance of distracting app
      appIndex = 5 + Math.floor(Math.random() * 3); // Last 3 are distracting
    }
    
    const app = this.demoApps[appIndex];
    
    // Check if we actually switched apps
    if (this.lastActiveWindow !== app.name) {
      this.metrics.windowSwitches++;
      this.lastActiveWindow = app.name;
      this.metrics.lastActivity = Date.now();
      
      console.log(`Switched to: ${app.name} (${app.category})`);
    }
    
    // Update current app
    this.metrics.currentApp = {
      name: app.name,
      title: app.title,
      bundleId: null
    };
    
    // Track app usage
    if (!this.metrics.activeApps.has(app.name)) {
      this.metrics.activeApps.set(app.name, {
        name: app.name,
        totalTime: 0,
        sessions: 0,
        lastUsed: Date.now(),
        category: app.category
      });
    }
    
    const appData = this.metrics.activeApps.get(app.name);
    appData.lastUsed = Date.now();
    appData.sessions++;
  }

  simulateKeystrokes() {
    // Simulate realistic typing patterns based on current app
    const currentApp = this.metrics.currentApp;
    let keystrokeRate = 10; // Base rate
    
    if (currentApp) {
      const appData = this.metrics.activeApps.get(currentApp.name);
      if (appData) {
        switch (appData.category) {
          case 'productive':
            keystrokeRate = 15 + Math.floor(Math.random() * 20); // 15-35 per interval
            break;
          case 'neutral':
            keystrokeRate = 5 + Math.floor(Math.random() * 10); // 5-15 per interval
            break;
          case 'distracting':
            keystrokeRate = 2 + Math.floor(Math.random() * 8); // 2-10 per interval
            break;
        }
      }
    }
    
    this.metrics.keystrokes += keystrokeRate;
    this.metrics.lastActivity = Date.now();
  }

  updateIdleTime() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.metrics.lastActivity;
    
    if (timeSinceLastActivity > this.idleThreshold) {
      this.metrics.idleTime += 2000; // Add 2 seconds of idle time
    } else {
      this.metrics.totalActiveTime += 2000; // Add 2 seconds of active time
    }
  }

  getMetrics() {
    const sessionDuration = Date.now() - this.metrics.sessionStart;
    const activeAppsArray = Array.from(this.metrics.activeApps.values());
    
    return {
      ...this.metrics,
      sessionDuration,
      activeApps: activeAppsArray,
      productivityRatio: this.metrics.totalActiveTime / (this.metrics.totalActiveTime + this.metrics.idleTime) || 0,
      windowSwitchRate: this.metrics.windowSwitches / (sessionDuration / 60000) || 0, // switches per minute
      keystrokeRate: this.metrics.keystrokes / (sessionDuration / 60000) || 0 // keystrokes per minute
    };
  }

  resetMetrics() {
    this.metrics = {
      keystrokes: 0,
      windowSwitches: 0,
      activeApps: new Map(),
      currentApp: null,
      sessionStart: Date.now(),
      lastActivity: Date.now(),
      idleTime: 0,
      totalActiveTime: 0
    };
  }
}

module.exports = ActivityTracker;
