# Growth Multiplier Investigation & Fixes

## Problems Found

### 1. **UI Not Reactive** ❌

The `multiplier` value returned from `useGardenGame` was calculated only once:

```typescript
multiplier: gameRef.current?.getMultiplier() ?? 1  // Static value!
```

This meant the UI never updated when the multiplier changed.

### 2. **Test Script vs Live App** ❌

Running `randomMultiplierTest.ts` updates the tracker module in a **separate Node.js process**.
The live app (Electron renderer) runs in a **different process** with its own copy of the tracker module.

- Changes in the test don't affect the running app
- They have separate memory spaces

## Fixes Applied

### 1. Made Multiplier Reactive ✅

- Added `const [multiplier, setMultiplier] = useState(1)` to track state
- Update it when game loop detects changes
- Update it when dispatch sets a new value
- Now the UI will re-render when multiplier changes

### 2. Added Debug Logging ✅

- Game loop logs when multiplier changes
- Dispatch logs when setMultiplier is called
- Tick occasionally logs current multiplier (10% of ticks to avoid spam)

### 3. Created Browser Test Helper ✅

Open the browser console (F12) and run:

```javascript
__testMultiplier(10)  // Sets multiplier to 10x
__testMultiplier(5)   // Sets multiplier to 5x
__testMultiplier(1)   // Resets to 1x
```

## How to Test

### Option 1: Browser Console (Recommended)

1. Run your app: `npm run dev`
2. Plant some seeds
3. Open DevTools console (F12)
4. Run: `__testMultiplier(10)`
5. Watch your plants grow 10x faster!
6. Check the "GROWTH" display in the toolbar - should show "10.0x"

### Option 2: Verify Growth Speed

With multiplier = 1:

- A 60-second plant takes 60 seconds to grow
- Progress increases by ~1.67% per second

With multiplier = 10:

- The same plant takes 6 seconds to grow
- Progress increases by ~16.7% per second

## How It Works

### Game Loop (Every Second)

```typescript
1. Read tracker multiplier: getProductivityMultiplier()
2. Compare to current game multiplier
3. If different, update game and UI state
4. Call tick(1) to advance plant growth
```

### Tick Function

```typescript
effectiveDuration = plant.growthDuration / multiplier
increment = deltaTime / effectiveDuration
progress += increment

Example with 60s plant:
- multiplier=1:  increment = 1/60 = 0.0167 (1.67% per second)
- multiplier=10: increment = 1/6  = 0.1667 (16.7% per second)
```

## Why randomMultiplierTest Doesn't Affect Live App

The test runs in **Node.js** (separate process):

```
┌─────────────────┐        ┌──────────────────┐
│   Node Process  │        │  Electron Renderer│
│                 │        │                   │
│  tracker module │   ✗    │   tracker module  │
│  (test changes  │ No IPC │   (app reads)     │
│   this copy)    │ bridge │                   │
└─────────────────┘        └───────────────────┘
```

To make cross-process control work, you'd need:

- IPC bridge from main to renderer
- Or shared storage (file/DB) both processes read
- Or expose API endpoint

## Console Output You Should See

When you run `__testMultiplier(10)`:

```
[Debug] Setting multiplier to 10
[Dispatch] Set multiplier to 10
[Game Loop] Updating multiplier from 1 to 10  (if tracker was also 10)
[Tick] Multiplier: 10.0x
```

## Files Modified

1. ✅ `src/ui/hooks/useGardenGame.ts`
   - Made multiplier reactive with useState
   - Added logging to game loop
   - Added logging to dispatch

2. ✅ `src/core/gardenGame.ts`
   - Added debug logging to tick (10% sample rate)

3. ✅ `src/ui/App.tsx`
   - Exposed `__testMultiplier()` helper to window

4. ✅ `tsconfig.test.json` (new)
   - Test-specific config for running randomMultiplierTest.ts

5. ✅ `src/tracker/randomMultiplierTest.ts`
   - Simplified to use direct imports

## Next Steps

If you want the tracker module to control the app from outside:

1. Move tracker state to localStorage
2. Have both test and app read/write from localStorage
3. Or use IPC to send multiplier changes from main → renderer
