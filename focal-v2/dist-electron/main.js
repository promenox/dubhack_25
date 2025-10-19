var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import require$$0 from "fs";
import require$$1 from "path";
import require$$2 from "os";
import require$$3 from "crypto";
import { app, BrowserWindow, screen, ipcMain } from "electron";
import path$1 from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "child_process";
import { promisify } from "util";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var main = { exports: {} };
const version$1 = "16.6.1";
const require$$4 = {
  version: version$1
};
const fs = require$$0;
const path = require$$1;
const os = require$$2;
const crypto = require$$3;
const packageJson = require$$4;
const version = packageJson.version;
const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function parse(src) {
  const obj = {};
  let lines = src.toString();
  lines = lines.replace(/\r\n?/mg, "\n");
  let match;
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1];
    let value = match[2] || "";
    value = value.trim();
    const maybeQuote = value[0];
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, "\n");
      value = value.replace(/\\r/g, "\r");
    }
    obj[key] = value;
  }
  return obj;
}
function _parseVault(options) {
  options = options || {};
  const vaultPath = _vaultPath(options);
  options.path = vaultPath;
  const result = DotenvModule.configDotenv(options);
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
    err.code = "MISSING_DATA";
    throw err;
  }
  const keys = _dotenvKey(options).split(",");
  const length = keys.length;
  let decrypted;
  for (let i = 0; i < length; i++) {
    try {
      const key = keys[i].trim();
      const attrs = _instructions(result, key);
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
      break;
    } catch (error) {
      if (i + 1 >= length) {
        throw error;
      }
    }
  }
  return DotenvModule.parse(decrypted);
}
function _warn(message) {
  console.log(`[dotenv@${version}][WARN] ${message}`);
}
function _debug(message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`);
}
function _log(message) {
  console.log(`[dotenv@${version}] ${message}`);
}
function _dotenvKey(options) {
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY;
  }
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY;
  }
  return "";
}
function _instructions(result, dotenvKey) {
  let uri;
  try {
    uri = new URL(dotenvKey);
  } catch (error) {
    if (error.code === "ERR_INVALID_URL") {
      const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    throw error;
  }
  const key = uri.password;
  if (!key) {
    const err = new Error("INVALID_DOTENV_KEY: Missing key part");
    err.code = "INVALID_DOTENV_KEY";
    throw err;
  }
  const environment = uri.searchParams.get("environment");
  if (!environment) {
    const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
    err.code = "INVALID_DOTENV_KEY";
    throw err;
  }
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
  const ciphertext = result.parsed[environmentKey];
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
    err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
    throw err;
  }
  return { ciphertext, key };
}
function _vaultPath(options) {
  let possibleVaultPath = null;
  if (options && options.path && options.path.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
  }
  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath;
  }
  return null;
}
function _resolveHome(envPath) {
  return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}
function _configVault(options) {
  const debug = Boolean(options && options.debug);
  const quiet = options && "quiet" in options ? options.quiet : true;
  if (debug || !quiet) {
    _log("Loading env from encrypted .env.vault");
  }
  const parsed = DotenvModule._parseVault(options);
  let processEnv = process.env;
  if (options && options.processEnv != null) {
    processEnv = options.processEnv;
  }
  DotenvModule.populate(processEnv, parsed, options);
  return { parsed };
}
function configDotenv(options) {
  const dotenvPath = path.resolve(process.cwd(), ".env");
  let encoding = "utf8";
  const debug = Boolean(options && options.debug);
  const quiet = options && "quiet" in options ? options.quiet : true;
  if (options && options.encoding) {
    encoding = options.encoding;
  } else {
    if (debug) {
      _debug("No encoding is specified. UTF-8 is used by default");
    }
  }
  let optionPaths = [dotenvPath];
  if (options && options.path) {
    if (!Array.isArray(options.path)) {
      optionPaths = [_resolveHome(options.path)];
    } else {
      optionPaths = [];
      for (const filepath of options.path) {
        optionPaths.push(_resolveHome(filepath));
      }
    }
  }
  let lastError;
  const parsedAll = {};
  for (const path2 of optionPaths) {
    try {
      const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
      DotenvModule.populate(parsedAll, parsed, options);
    } catch (e) {
      if (debug) {
        _debug(`Failed to load ${path2} ${e.message}`);
      }
      lastError = e;
    }
  }
  let processEnv = process.env;
  if (options && options.processEnv != null) {
    processEnv = options.processEnv;
  }
  DotenvModule.populate(processEnv, parsedAll, options);
  if (debug || !quiet) {
    const keysCount = Object.keys(parsedAll).length;
    const shortPaths = [];
    for (const filePath of optionPaths) {
      try {
        const relative = path.relative(process.cwd(), filePath);
        shortPaths.push(relative);
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${filePath} ${e.message}`);
        }
        lastError = e;
      }
    }
    _log(`injecting env (${keysCount}) from ${shortPaths.join(",")}`);
  }
  if (lastError) {
    return { parsed: parsedAll, error: lastError };
  } else {
    return { parsed: parsedAll };
  }
}
function config(options) {
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options);
  }
  const vaultPath = _vaultPath(options);
  if (!vaultPath) {
    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
    return DotenvModule.configDotenv(options);
  }
  return DotenvModule._configVault(options);
}
function decrypt(encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), "hex");
  let ciphertext = Buffer.from(encrypted, "base64");
  const nonce = ciphertext.subarray(0, 12);
  const authTag = ciphertext.subarray(-16);
  ciphertext = ciphertext.subarray(12, -16);
  try {
    const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
    aesgcm.setAuthTag(authTag);
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
  } catch (error) {
    const isRange = error instanceof RangeError;
    const invalidKeyLength = error.message === "Invalid key length";
    const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
    if (isRange || invalidKeyLength) {
      const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    } else if (decryptionFailed) {
      const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
      err.code = "DECRYPTION_FAILED";
      throw err;
    } else {
      throw error;
    }
  }
}
function populate(processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug);
  const override = Boolean(options && options.override);
  if (typeof parsed !== "object") {
    const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    err.code = "OBJECT_REQUIRED";
    throw err;
  }
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key];
      }
      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`);
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`);
        }
      }
    } else {
      processEnv[key] = parsed[key];
    }
  }
}
const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
};
main.exports.configDotenv = DotenvModule.configDotenv;
main.exports._configVault = DotenvModule._configVault;
main.exports._parseVault = DotenvModule._parseVault;
main.exports.config = DotenvModule.config;
main.exports.decrypt = DotenvModule.decrypt;
main.exports.parse = DotenvModule.parse;
main.exports.populate = DotenvModule.populate;
main.exports = DotenvModule;
var mainExports = main.exports;
const dotenv = /* @__PURE__ */ getDefaultExportFromCjs(mainExports);
class FocusAI {
  constructor() {
    __publicField(this, "baseWeights");
    __publicField(this, "userPatterns");
    __publicField(this, "scoreHistory");
    __publicField(this, "cumulativeScore");
    __publicField(this, "maxPointsPerHour");
    __publicField(this, "maxPointsPerWindow");
    __publicField(this, "maxTotalPoints");
    console.log("🎯 FocusAI: Initializing with RULE-BASED analysis only");
    this.baseWeights = {
      keystrokeActivity: 0.25,
      focusConsistency: 0.3,
      activeTimeRatio: 0.25,
      switchingPattern: 0.2
    };
    this.userPatterns = {
      productiveApps: /* @__PURE__ */ new Set(["Visual Studio Code", "Terminal", "Chrome", "Slack", "Notion", "Cursor"]),
      distractingApps: /* @__PURE__ */ new Set(["Twitter", "Instagram", "Facebook", "TikTok"]),
      learningApps: /* @__PURE__ */ new Set(["YouTube", "Coursera", "Khan Academy"]),
      preferredSwitchingRate: 2.5,
      // switches per minute
      averageSessionLength: 25
      // minutes
    };
    this.scoreHistory = [];
    this.cumulativeScore = 0;
    this.maxPointsPerHour = 100;
    this.maxPointsPerWindow = 5;
    this.maxTotalPoints = 1e3;
  }
  async calculateHybridScore(activityWindow) {
    try {
      console.log("🎯 FocusAI: Using RULE-BASED analysis (AI disabled)");
      const baseScore = this.calculateBaseScore(activityWindow);
      console.log("📊 Base score calculated:", baseScore);
      const aiContext = this.getRuleBasedContext(activityWindow);
      console.log("🧠 Rule-based context:", aiContext);
      const finalScore = this.applyAIMultiplier(baseScore, aiContext);
      console.log("✨ Final score:", finalScore);
      this.updateCumulativeScore(finalScore);
      const result = {
        instantaneous: Math.round(finalScore * 100) / 100,
        // Round to 2 decimal places
        cumulative: Math.round(this.cumulativeScore * 100) / 100,
        baseScore: Math.round(baseScore * 100) / 100,
        aiMultiplier: aiContext.multiplier,
        aiInsight: aiContext.insight,
        context: aiContext.context,
        timestamp: Date.now()
      };
      console.log("📈 FocusAI result:", result);
      return result;
    } catch (error) {
      console.error("Error calculating hybrid score:", error);
      return this.getFallbackScore(activityWindow);
    }
  }
  calculateBaseScore(activityWindow) {
    let rawScore = 50;
    const keystrokeScore = this.analyzeKeystrokeActivity(activityWindow);
    rawScore += (keystrokeScore - 50) * this.baseWeights.keystrokeActivity;
    const focusScore = this.analyzeFocusConsistency(activityWindow);
    rawScore += (focusScore - 50) * this.baseWeights.focusConsistency;
    const activeTimeScore = this.analyzeActiveTime(activityWindow);
    rawScore += (activeTimeScore - 50) * this.baseWeights.activeTimeRatio;
    const switchingScore = this.analyzeSwitchingPattern(activityWindow);
    rawScore += (switchingScore - 50) * this.baseWeights.switchingPattern;
    rawScore = Math.max(0, Math.min(100, rawScore));
    const scaledScore = rawScore / 100 * this.maxPointsPerWindow;
    return scaledScore;
  }
  analyzeKeystrokeActivity(activityWindow) {
    const keystrokeRate = activityWindow.keystrokeRate || 0;
    if (keystrokeRate < 5) return 20;
    if (keystrokeRate <= 30) return 80;
    if (keystrokeRate <= 60) return 70;
    if (keystrokeRate <= 100) return 50;
    return 30;
  }
  analyzeFocusConsistency(activityWindow) {
    var _a;
    const pattern = ((_a = activityWindow.context) == null ? void 0 : _a.switchingPattern) || "stable";
    switch (pattern) {
      case "focused":
        return 90;
      case "stable":
        return 75;
      case "multitasking":
        return 60;
      case "distracted":
        return 25;
      default:
        return 50;
    }
  }
  analyzeActiveTime(activityWindow) {
    const focusRatio = activityWindow.focusRatio || 0;
    if (focusRatio > 0.9) return 95;
    if (focusRatio > 0.8) return 85;
    if (focusRatio > 0.6) return 70;
    if (focusRatio > 0.4) return 50;
    if (focusRatio > 0.2) return 30;
    return 10;
  }
  analyzeSwitchingPattern(activityWindow) {
    const switchRate = activityWindow.switchRate || 0;
    const userPreferred = this.userPatterns.preferredSwitchingRate;
    const deviation = Math.abs(switchRate - userPreferred);
    if (deviation < 0.5) return 90;
    if (deviation < 1) return 75;
    if (deviation < 2) return 60;
    if (deviation < 3) return 40;
    return 20;
  }
  getRuleBasedContext(activityWindow) {
    const app2 = activityWindow.activeApp || "";
    const title = activityWindow.windowTitle || "";
    let multiplier = 1;
    let insight = "Standard productivity tracking";
    let context = "Working";
    if (this.userPatterns.productiveApps.has(app2)) {
      multiplier = 1.1;
      insight = "Using productive application";
      context = "Focused work";
    } else if (this.userPatterns.distractingApps.has(app2)) {
      multiplier = 0.7;
      insight = "Using potentially distracting app";
      context = "Social media or entertainment";
    } else if (this.userPatterns.learningApps.has(app2)) {
      multiplier = 1;
      insight = "Educational content consumption";
      context = "Learning";
    }
    if (title) {
      const titleLower = title.toLowerCase();
      if (titleLower.includes("tutorial") || titleLower.includes("course")) {
        multiplier = 1.2;
        insight = "Learning from educational content";
        context = "Educational consumption";
      } else if (titleLower.includes("game") || titleLower.includes("entertainment")) {
        multiplier = 0.6;
        insight = "Entertainment activity";
        context = "Recreation";
      }
    }
    return {
      multiplier: Math.max(0.7, Math.min(1.3, multiplier)),
      insight,
      context,
      confidence: 0.6
    };
  }
  applyAIMultiplier(baseScore, aiContext) {
    const multiplier = aiContext.multiplier;
    const adjustedScore = baseScore * multiplier;
    const smoothingFactor = 0.3;
    const smoothedScore = baseScore + (adjustedScore - baseScore) * smoothingFactor;
    return Math.max(0, Math.min(this.maxPointsPerWindow, smoothedScore));
  }
  updateCumulativeScore(instantaneousScore) {
    this.scoreHistory.push(instantaneousScore);
    if (this.scoreHistory.length > 200) {
      this.scoreHistory.shift();
    }
    this.cumulativeScore = this.scoreHistory.reduce((sum, score) => sum + score, 0);
    this.cumulativeScore = Math.min(this.maxTotalPoints, this.cumulativeScore);
  }
  getFallbackScore(activityWindow) {
    const baseScore = this.calculateBaseScore(activityWindow);
    return {
      instantaneous: Math.round(baseScore * 100) / 100,
      // Round to 2 decimal places
      cumulative: Math.round(this.cumulativeScore * 100) / 100,
      baseScore: Math.round(baseScore * 100) / 100,
      aiMultiplier: 1,
      aiInsight: "Using rule-based analysis",
      context: "Standard productivity tracking",
      timestamp: Date.now()
    };
  }
  getGardenGrowthLevel() {
    if (this.cumulativeScore < 100) return "soil";
    if (this.cumulativeScore < 300) return "seed";
    if (this.cumulativeScore < 500) return "sprout";
    if (this.cumulativeScore < 750) return "plant";
    return "bloom";
  }
}
const execAsync = promisify(exec);
class ActivityWindow {
  constructor() {
    __publicField(this, "startTime");
    __publicField(this, "endTime");
    __publicField(this, "metadata");
    __publicField(this, "isComplete");
    this.startTime = Date.now();
    this.endTime = this.startTime + 3 * 60 * 1e3;
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
        switchingPattern: "stable"
      }
    };
    this.isComplete = false;
  }
  addActivity(appName, windowTitle, keystrokes = 0, url = "", mouseMovements = 0) {
    const now = Date.now();
    const activityKey = `${appName}|${url}`;
    const lastActivityKey = `${this.metadata.activeApp}|${this.metadata.url || ""}`;
    if (activityKey !== lastActivityKey) {
      this.metadata.appSwitches++;
      this.metadata.context.recentApps.push({
        app: appName,
        title: windowTitle,
        url,
        timestamp: now,
        duration: now - this.metadata.lastActivity
      });
      if (this.metadata.context.recentApps.length > 5) {
        this.metadata.context.recentApps.shift();
      }
    }
    this.metadata.activeApp = appName;
    this.metadata.windowTitle = windowTitle;
    this.metadata.url = url;
    this.metadata.keystrokeCount += keystrokes;
    this.metadata.mouseMovements += mouseMovements;
    this.metadata.lastActivity = now;
    const timeSinceLastActivity = now - this.metadata.lastActivity;
    if (timeSinceLastActivity > 3e4) {
      this.metadata.idleTime += 1e3;
    } else {
      this.metadata.activeTime += 1e3;
    }
    this.analyzeSwitchingPattern();
  }
  analyzeSwitchingPattern() {
    const recentApps = this.metadata.context.recentApps;
    if (recentApps.length < 3) {
      this.metadata.context.switchingPattern = "stable";
      return;
    }
    const switchRate = this.metadata.appSwitches / ((Date.now() - this.startTime) / 6e4);
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
    const durationMinutes = duration / 6e4;
    return {
      duration,
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
      timestamp: this.startTime
    };
  }
}
class FocusTracker {
  constructor() {
    __publicField(this, "currentWindow");
    __publicField(this, "completedWindows");
    __publicField(this, "isTracking");
    __publicField(this, "isRunning");
    __publicField(this, "updateInterval");
    __publicField(this, "demoMode");
    __publicField(this, "iohook");
    __publicField(this, "keystrokesSinceLastTick");
    __publicField(this, "mouseMovementsSinceLastTick");
    __publicField(this, "lastMouseX");
    __publicField(this, "lastMouseY");
    __publicField(this, "sessionStartTimestamp");
    __publicField(this, "demoApps");
    __publicField(this, "currentAppIndex");
    __publicField(this, "lastSwitchTime");
    __publicField(this, "lastActiveApp");
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
    this.demoApps = [
      { name: "Visual Studio Code", title: "focus-ai.js - VS Code", category: "productive", context: "coding" },
      { name: "Chrome", title: "GitHub - FocusAI Repository", category: "productive", context: "research" },
      { name: "Terminal", title: "Terminal - npm run dev", category: "productive", context: "development" },
      { name: "Slack", title: "#productivity-tools - Slack", category: "productive", context: "communication" },
      { name: "Notion", title: "FocusAI Project Plan - Notion", category: "productive", context: "planning" },
      { name: "Finder", title: "Documents", category: "neutral", context: "file-management" },
      { name: "YouTube", title: "React Tutorial - YouTube", category: "productive", context: "learning" },
      { name: "Twitter", title: "Home / X", category: "distracting", context: "social-media" },
      { name: "Spotify", title: "Focus Playlist - Spotify", category: "neutral", context: "background-music" }
    ];
    this.currentAppIndex = 0;
    this.lastSwitchTime = Date.now();
    this.lastActiveApp = null;
  }
  start() {
    if (this.isTracking) return;
    this.isTracking = true;
    this.isRunning = true;
    this.sessionStartTimestamp = Date.now();
    console.log("FocusAI tracking started");
    this.initKeyHook();
    this.startActivityMonitoring();
    this.startWindowManagement();
  }
  stop() {
    this.isTracking = false;
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.disposeKeyHook();
    if (this.currentWindow && !this.currentWindow.isComplete) {
      this.completedWindows.push(this.currentWindow.complete());
    }
    console.log("FocusAI tracking stopped");
  }
  startActivityMonitoring() {
    this.updateInterval = setInterval(() => {
      if (!this.isTracking) return;
      if (this.demoMode) {
        this.simulateActivity();
      } else {
        this.trackRealActivity();
      }
    }, 2e3);
  }
  simulateActivity() {
    const now = Date.now();
    if (now - this.lastSwitchTime > 3e4 + Math.random() * 9e4) {
      this.simulateAppSwitch();
      this.lastSwitchTime = now;
    }
    const currentApp = this.demoApps[this.currentAppIndex];
    const keystrokes = this.getKeystrokeRate(currentApp.category);
    this.currentWindow.addActivity(currentApp.name, currentApp.title, keystrokes);
  }
  simulateAppSwitch() {
    const random = Math.random();
    let nextIndex;
    if (random < 0.7) {
      nextIndex = Math.floor(Math.random() * 5);
    } else if (random < 0.9) {
      nextIndex = 5 + Math.floor(Math.random() * 2);
    } else {
      nextIndex = 7 + Math.floor(Math.random() * 2);
    }
    this.currentAppIndex = nextIndex;
    const app2 = this.demoApps[nextIndex];
    console.log(`Switched to: ${app2.name} (${app2.category}) - ${app2.context}`);
  }
  getKeystrokeRate(category) {
    const baseRates = {
      productive: 15 + Math.floor(Math.random() * 25),
      // 15-40 per interval
      neutral: 5 + Math.floor(Math.random() * 15),
      // 5-20 per interval
      distracting: 2 + Math.floor(Math.random() * 8)
      // 2-10 per interval
    };
    return baseRates[category] || 10;
  }
  async trackRealActivity() {
    try {
      let appName, windowTitle, url;
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
      if (appName && appName !== this.lastActiveApp) {
        console.log(`Real switch detected: ${appName} - ${windowTitle}${url ? ` (${url})` : ""}`);
        this.lastActiveApp = appName;
      }
      const keystrokes = this.consumeKeystrokes();
      const mouseMovements = this.consumeMouseMovements();
      this.currentWindow.addActivity(
        appName || "Unknown App",
        windowTitle || "Unknown Window",
        keystrokes,
        url,
        mouseMovements
      );
    } catch (error) {
      console.log("Real activity tracking failed, falling back to demo mode:", error.message);
      this.demoMode = true;
      this.simulateActivity();
    }
  }
  initKeyHook() {
    try {
      const { uIOhook } = require("uiohook-napi");
      this.iohook = uIOhook;
      this.keystrokesSinceLastTick = 0;
      this.mouseMovementsSinceLastTick = 0;
      uIOhook.on("keydown", () => {
        this.keystrokesSinceLastTick++;
        if (this.keystrokesSinceLastTick <= 3) {
          console.log(`Keypress detected: ${this.keystrokesSinceLastTick} total`);
        }
      });
      uIOhook.on("mousemove", (event) => {
        const dx = Math.abs(event.x - this.lastMouseX);
        const dy = Math.abs(event.y - this.lastMouseY);
        if (dx > 5 || dy > 5) {
          this.mouseMovementsSinceLastTick++;
          this.lastMouseX = event.x;
          this.lastMouseY = event.y;
        }
      });
      uIOhook.start();
      console.log("✓ Global key/mouse hook started successfully (uiohook-napi)");
      console.log("  Monitoring all keyboard and mouse activity...");
    } catch (e) {
      this.iohook = null;
      console.error("✗ Global key hook failed to start:", e);
      console.warn("  Falling back to demo mode");
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
    } catch (_) {
    }
  }
  consumeKeystrokes() {
    const count = this.keystrokesSinceLastTick;
    this.keystrokesSinceLastTick = 0;
    return count;
  }
  consumeMouseMovements() {
    const count = this.mouseMovementsSinceLastTick;
    this.mouseMovementsSinceLastTick = 0;
    return count;
  }
  getSessionDuration() {
    if (!this.sessionStartTimestamp) return 0;
    return Date.now() - this.sessionStartTimestamp;
  }
  async getActiveWindowInfoMacOS() {
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
      url: parts[2] || ""
    };
  }
  async getActiveWindowInfoWindows() {
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
        timeout: 5e3,
        windowsHide: true,
        maxBuffer: 1024 * 1024
      });
      const parts = String(stdout).trim().split("|");
      return {
        appName: parts[0] || "Unknown App",
        windowTitle: parts[1] || "Unknown Window",
        url: parts[2] || ""
      };
    } catch (error) {
      console.error("Windows PowerShell execution failed:", error);
      return { appName: "Unknown App", windowTitle: "Unknown Window", url: "" };
    }
  }
  async getActiveWindowInfoLinux() {
    try {
      const { stdout } = await execAsync("xdotool getactivewindow getwindowname");
      const windowTitle = String(stdout).trim();
      const { stdout: pid } = await execAsync("xdotool getactivewindow getwindowpid");
      const { stdout: processName } = await execAsync(`ps -p ${String(pid).trim()} -o comm=`);
      return {
        appName: String(processName).trim() || "Unknown App",
        windowTitle: windowTitle || "Unknown Window",
        url: ""
      };
    } catch (error) {
      console.error("Linux xdotool execution failed:", error);
      return { appName: "Unknown App", windowTitle: "Unknown Window", url: "" };
    }
  }
  startWindowManagement() {
    setInterval(() => {
      if (this.currentWindow.isExpired()) {
        this.completeCurrentWindow();
        this.startNewWindow();
      }
    }, 1e4);
  }
  completeCurrentWindow() {
    const summary = this.currentWindow.complete();
    this.completedWindows.push(summary);
    console.log("Completed 3-minute window:", {
      app: summary.activeApp,
      switches: summary.appSwitches,
      keystrokes: summary.keystrokeCount,
      focusRatio: Math.round(summary.focusRatio * 100) + "%",
      pattern: summary.context.switchingPattern
    });
  }
  startNewWindow() {
    this.currentWindow = new ActivityWindow();
    console.log("Started new 3-minute activity window");
  }
  getCurrentMetrics() {
    var _a;
    return {
      currentWindow: this.currentWindow.getSummary(),
      completedWindows: this.completedWindows.slice(-5),
      // Last 5 windows
      totalWindows: this.completedWindows.length,
      sessionDuration: Date.now() - (((_a = this.completedWindows[0]) == null ? void 0 : _a.timestamp) || Date.now())
    };
  }
  getRecentActivity() {
    return this.completedWindows.slice(-3);
  }
}
dotenv.config();
const __dirname = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
class MainApp {
  constructor() {
    __publicField(this, "mainWindow");
    __publicField(this, "debugWindow");
    __publicField(this, "overlayWindow");
    __publicField(this, "focusTracker");
    __publicField(this, "focusAI");
    __publicField(this, "isDev");
    __publicField(this, "updateInterval");
    __publicField(this, "sessionActive");
    __publicField(this, "sessionStartTime");
    __publicField(this, "overlayUpdateInterval");
    this.mainWindow = null;
    this.debugWindow = null;
    this.overlayWindow = null;
    this.focusTracker = new FocusTracker();
    this.focusAI = new FocusAI();
    this.isDev = process.argv.includes("--dev");
    this.updateInterval = null;
    this.sessionActive = false;
    this.sessionStartTime = null;
    this.overlayUpdateInterval = null;
  }
  createWindow() {
    console.log("Creating window...");
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1e3,
      minHeight: 700,
      frame: true,
      titleBarStyle: "hiddenInset",
      backgroundColor: "#0f0f0f",
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        preload: path$1.join(__dirname, "preload.mjs")
      }
    });
    console.log("Loading main window...");
    if (VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(VITE_DEV_SERVER_URL);
    } else {
      this.mainWindow.loadFile(path$1.join(RENDERER_DIST, "index.html"));
    }
    this.mainWindow.once("ready-to-show", () => {
      var _a;
      (_a = this.mainWindow) == null ? void 0 : _a.show();
    });
    if (this.isDev) {
      this.mainWindow.webContents.openDevTools();
    }
    console.log("Window created successfully");
  }
  createOverlayWindow() {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      return;
    }
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    const overlayWidth = 360;
    const overlayHeight = 140;
    const x = Math.round((width - overlayWidth) / 2);
    const y = 20;
    this.overlayWindow = new BrowserWindow({
      width: overlayWidth,
      height: overlayHeight,
      x,
      y,
      frame: false,
      transparent: true,
      resizable: false,
      movable: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      backgroundColor: "#00000000",
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        preload: path$1.join(__dirname, "preload.mjs")
      }
    });
    this.overlayWindow.setAlwaysOnTop(true, "screen-saver");
    if (this.overlayWindow.setVisibleOnAllWorkspaces) {
      this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }
    if (VITE_DEV_SERVER_URL) {
      this.overlayWindow.loadURL(VITE_DEV_SERVER_URL + "#/overlay");
    } else {
      this.overlayWindow.loadFile(path$1.join(RENDERER_DIST, "index.html"), {
        hash: "/overlay"
      });
    }
    this.overlayWindow.once("ready-to-show", () => {
      var _a;
      (_a = this.overlayWindow) == null ? void 0 : _a.showInactive();
    });
    this.overlayWindow.on("closed", () => {
      this.overlayWindow = null;
    });
  }
  showOverlay(sessionStart) {
    this.createOverlayWindow();
    if (!this.overlayWindow) return;
    if (this.overlayWindow.isMinimized()) this.overlayWindow.restore();
    this.overlayWindow.showInactive();
    const sendStart = () => {
      var _a;
      try {
        (_a = this.overlayWindow) == null ? void 0 : _a.webContents.send("session-started", { startTime: sessionStart });
      } catch (_) {
      }
    };
    if (this.overlayWindow.webContents.isLoading()) {
      this.overlayWindow.webContents.once("did-finish-load", sendStart);
    } else {
      sendStart();
    }
    this.startOverlayUpdates();
  }
  hideOverlay() {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
    try {
      this.overlayWindow.webContents.send("session-stopped");
    } catch (_) {
    }
    this.overlayWindow.hide();
    this.stopOverlayUpdates();
  }
  startOverlayUpdates() {
    this.stopOverlayUpdates();
    this.overlayUpdateInterval = setInterval(() => {
      try {
        if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
        const currentWindow = this.focusTracker.currentWindow;
        if (currentWindow && !currentWindow.isComplete) {
          const summary = currentWindow.getSummary();
          this.overlayWindow.webContents.send("focus-update", {
            windowTitle: summary.windowTitle,
            url: summary.url,
            keystrokeCount: summary.keystrokeCount,
            keystrokeRate: Math.round(summary.keystrokeRate * 10) / 10,
            mouseMovements: summary.mouseMovements,
            mouseMovementRate: Math.round(summary.mouseMovementRate * 10) / 10,
            timestamp: Date.now()
          });
        }
      } catch (_) {
      }
    }, 2e3);
  }
  stopOverlayUpdates() {
    if (this.overlayUpdateInterval) {
      clearInterval(this.overlayUpdateInterval);
      this.overlayUpdateInterval = null;
    }
  }
  startTracking() {
    var _a;
    this.focusTracker.start();
    (_a = this.mainWindow) == null ? void 0 : _a.webContents.once("did-finish-load", () => {
      console.log("FocusAI Dashboard loaded, starting focus tracking...");
      this.updateInterval = setInterval(async () => {
        try {
          const currentWindow = this.focusTracker.currentWindow;
          if (currentWindow && !currentWindow.isComplete) {
            const windowSummary = currentWindow.getSummary();
            const focusData = await this.focusAI.calculateHybridScore(windowSummary);
            const dashboardData = {
              instantaneous: focusData.instantaneous,
              cumulative: focusData.cumulative,
              aiInsight: focusData.aiInsight,
              context: focusData.context,
              activeApp: windowSummary.activeApp,
              windowTitle: windowSummary.windowTitle,
              url: windowSummary.url,
              switchRate: windowSummary.switchRate,
              keystrokeRate: windowSummary.keystrokeRate,
              timestamp: Date.now()
            };
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send("focus-update", dashboardData);
            }
            if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
              this.overlayWindow.webContents.send("focus-update", {
                windowTitle: windowSummary.windowTitle,
                url: windowSummary.url,
                timestamp: Date.now()
              });
            }
            if (this.debugWindow && !this.debugWindow.isDestroyed()) {
              this.debugWindow.webContents.send("focus-update", dashboardData);
            }
          }
        } catch (error) {
          console.error("Error sending focus update:", error);
        }
      }, 1e4);
    });
  }
  setupIPC() {
    ipcMain.handle("get-current-metrics", () => {
      return this.focusTracker.getCurrentMetrics();
    });
    ipcMain.handle("get-focus-score", async () => {
      const currentWindow = this.focusTracker.currentWindow;
      if (currentWindow) {
        return await this.focusAI.calculateHybridScore(currentWindow.getSummary());
      }
      return null;
    });
    ipcMain.handle("get-garden-level", () => {
      return this.focusAI.getGardenGrowthLevel();
    });
    ipcMain.on("overlay-set-ignore-mouse", (_e, ignore) => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        try {
          this.overlayWindow.setIgnoreMouseEvents(!!ignore, { forward: !!ignore });
        } catch (_) {
        }
      }
    });
    ipcMain.on("open-debug-page", () => {
      this.openDebugPage();
    });
    ipcMain.on("start-session", () => {
      console.log("Starting focus session...");
      if (!this.sessionActive) {
        this.sessionActive = true;
        this.sessionStartTime = Date.now();
        this.focusTracker.start();
        this.startTracking();
        this.showOverlay(this.sessionStartTime);
      }
    });
    ipcMain.on("stop-session", () => {
      console.log("Stopping focus session...");
      if (this.sessionActive) {
        this.sessionActive = false;
        this.sessionStartTime = null;
        this.focusTracker.stop();
        this.hideOverlay();
      }
    });
    ipcMain.on("request-debug-data", () => {
      if (this.debugWindow && !this.debugWindow.isDestroyed()) {
        const currentWindow = this.focusTracker.currentWindow;
        if (currentWindow && !currentWindow.isComplete) {
          const windowSummary = currentWindow.getSummary();
          this.focusAI.calculateHybridScore(windowSummary).then((focusData) => {
            var _a;
            const debugData = {
              instantaneous: focusData.instantaneous,
              cumulative: focusData.cumulative,
              aiInsight: focusData.aiInsight,
              context: focusData.context,
              activeApp: windowSummary.activeApp,
              windowTitle: windowSummary.windowTitle,
              url: windowSummary.url,
              switchRate: windowSummary.switchRate,
              keystrokeRate: windowSummary.keystrokeRate,
              baseScore: focusData.baseScore,
              aiMultiplier: focusData.aiMultiplier,
              focusRatio: windowSummary.focusRatio,
              timestamp: Date.now()
            };
            (_a = this.debugWindow) == null ? void 0 : _a.webContents.send("focus-update", debugData);
          }).catch((error) => {
            console.error("Error calculating debug data:", error);
          });
        }
      }
    });
  }
  openDebugPage() {
    this.debugWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      frame: true,
      titleBarStyle: "hiddenInset",
      backgroundColor: "#0a0a0a",
      show: false,
      parent: this.mainWindow || void 0,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        preload: path$1.join(__dirname, "preload.mjs")
      }
    });
    if (VITE_DEV_SERVER_URL) {
      this.debugWindow.loadURL(VITE_DEV_SERVER_URL + "#/debug");
    } else {
      this.debugWindow.loadFile(path$1.join(RENDERER_DIST, "index.html"), {
        hash: "/debug"
      });
    }
    this.debugWindow.once("ready-to-show", () => {
      var _a;
      (_a = this.debugWindow) == null ? void 0 : _a.show();
    });
    this.debugWindow.on("closed", () => {
      this.debugWindow = null;
    });
    if (this.isDev) {
      this.debugWindow.webContents.openDevTools();
    }
    this.debugWindow.webContents.once("did-finish-load", () => {
      console.log("Debug console loaded");
      const currentWindow = this.focusTracker.currentWindow;
      if (currentWindow) {
        const windowSummary = currentWindow.getSummary();
        this.focusAI.calculateHybridScore(windowSummary).then((focusData) => {
          var _a;
          const debugData = {
            instantaneous: focusData.instantaneous,
            cumulative: focusData.cumulative,
            aiInsight: focusData.aiInsight,
            context: focusData.context,
            activeApp: windowSummary.activeApp,
            windowTitle: windowSummary.windowTitle,
            url: windowSummary.url,
            switchRate: windowSummary.switchRate,
            keystrokeRate: windowSummary.keystrokeRate,
            baseScore: focusData.baseScore,
            aiMultiplier: focusData.aiMultiplier,
            timestamp: Date.now()
          };
          (_a = this.debugWindow) == null ? void 0 : _a.webContents.send("focus-update", debugData);
        });
      }
    });
  }
}
const mainApp = new MainApp();
app.whenReady().then(() => {
  mainApp.createWindow();
  mainApp.setupIPC();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainApp.createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => {
  mainApp.focusTracker.stop();
  if (mainApp.updateInterval) {
    clearInterval(mainApp.updateInterval);
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
