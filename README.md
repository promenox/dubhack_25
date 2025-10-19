# Garden Productivity Game

Electron-based desktop productivity companion with a cozy garden theme. Built with TypeScript and React to support a modular game engine, customizable UI, and future productivity hooks.

---

## 🔌 API for Contributors: Productivity Tracker Integration

**If you're integrating a productivity tracker with this garden game, here's what you need to know:**

### How to Control Plant Growth Speed

The garden game exposes a simple interface to control how fast plants grow based on user productivity.

#### Function to Call

```typescript
import { setProductivityMultiplier } from '@tracker/index';

// Set the growth speed multiplier (1 = normal, 10 = 10x faster)
setProductivityMultiplier(value: number);
```

#### Location

- **File:** `src/tracker/index.ts`
- **Import alias:** `@tracker/index`

#### Parameters

- `value` (number): The growth multiplier
  - `1` = normal speed (baseline)
  - `5` = 5x faster growth
  - `10` = 10x faster growth
  - Can be any positive number (decimals like `2.5` work too)

#### Effect

When you call `setProductivityMultiplier(N)`:

- All growing plants will grow **N times faster**
- A 60-second plant at 1x takes 60 seconds
- Same plant at 10x takes only 6 seconds
- The game UI will show "GROWTH N.0x" in the toolbar

#### Example Usage

```typescript
// Based on user's productivity level (1-10 scale)
function onProductivityChange(productivityScore: number) {
  setProductivityMultiplier(productivityScore);
  
  // productivityScore could be calculated from:
  // - Active work sessions
  // - Focus time tracking
  // - Task completion rate
  // - Pomodoro sessions completed
  // - etc.
}

// Example: Reward user with faster growth after completing a task
onTaskComplete(() => {
  setProductivityMultiplier(8); // Boost to 8x speed!
});

// Example: Slow growth during break time
onBreakStart(() => {
  setProductivityMultiplier(0.5); // Half speed during breaks
});
```

#### Testing Your Integration

Use the browser console in the running Electron app:

```javascript
// Open DevTools (F12), then run:
__testMultiplier(10)  // Sets multiplier to 10x
__testMultiplier(1)   // Resets to normal speed
```

#### Architecture Note

The game checks for multiplier changes every second. Your productivity tracker can update the value at any frequency, and the game will pick up changes within 1 second.

---

## Development

- `npm install` - install dependencies
- `npm run dev` - start Vite, compile the Electron main process, and launch the app with live reload

## Build

- `npm run build` - compile the main process and bundle the renderer for production
- `npm start` - run the packaged build locally (after `npm run build`)

## Project Structure

```
src/
  core/      # Game data models and logic
  main/      # Electron main process
  preload/   # Context bridge exposed to renderer
  storage/   # Persistence helpers
  tracker/   # Productivity multiplier stubs
  ui/        # React renderer (garden visualization + UI)
```

Legacy greetings from the team:

- Hello World from Michael!
- Hello from Smayan
- Hello from Benny
