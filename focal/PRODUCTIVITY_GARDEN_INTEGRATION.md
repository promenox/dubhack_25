# Productivity → Garden Growth Integration

## Overview
The garden growth system is now directly connected to your productivity score. As you work more productively, your plants grow faster!

## How It Works

### 1. Productivity Score Calculation
- **FocusAI** (`electron/focus-ai.ts`) tracks your activity and calculates:
  - **Instantaneous Score**: Current productivity level (0-100)
  - **Cumulative Score**: Total productivity points earned (0-1000)
- The cumulative score represents your total productivity over time
- Maximum score: 1000 points (≈ 10 hours of peak performance)

### 2. Score → Growth Multiplier Conversion
The cumulative score is converted to a growth multiplier using this formula:

```
multiplier = 0.5 + (score / 1000) × 2.5
```

**Examples:**
- **0 points** → 0.5x speed (slow growth)
- **200 points** → 1.0x speed (normal growth)
- **500 points** → 1.75x speed (faster growth)
- **1000 points** → 3.0x speed (maximum growth!)

### 3. Real-time Updates
- Every 30 seconds, the system broadcasts focus updates
- The Garden component listens for these updates
- Growth multiplier is automatically adjusted based on your current score
- Plants grow faster as you become more productive!

## Implementation Details

### Garden Component (`src/components/Garden.tsx`)
- Listens to `focus-update` events from Electron
- Extracts `cumulative` score from focus data
- Converts score to multiplier and dispatches to game engine
- Fetches initial score on mount for immediate feedback

### Garden Game Engine (`src/core/gardenGame.ts`)
- `setGrowthMultiplier(multiplier)`: Updates the growth speed
- `tick(deltaTime)`: Applies multiplier to plant growth
- Formula: `effectiveDuration = growthDuration / multiplier`

### UI Display (`src/components/garden/InventoryToolbar.tsx`)
- Shows current growth speed (e.g., "1.50x")
- Updates in real-time as productivity changes
- Tooltip explains it's based on productivity score

## User Experience

### Positive Feedback Loop
1. **Start working** → Productivity score increases
2. **Score increases** → Growth multiplier increases
3. **Multiplier increases** → Plants grow faster
4. **Faster growth** → More harvests and rewards
5. **More rewards** → Motivation to stay productive!

### Growth Speed Examples
- **Deep work (coding)**: 2.5x-3.0x growth speed
- **Learning (tutorials)**: 1.5x-2.0x growth speed  
- **Maintenance tasks**: 1.0x-1.5x growth speed
- **Idle/Distracted**: 0.5x-0.8x growth speed

## Benefits

### For Users
- **Visual feedback**: See productivity impact in real-time
- **Gamification**: More productive = faster garden growth
- **Motivation**: Incentive to maintain focus and productivity

### Technical
- **Non-intrusive**: Updates happen automatically in background
- **Efficient**: Only updates when score changes significantly (>0.01)
- **Responsive**: Initial score fetched on garden load
- **Scalable**: Easy to adjust multiplier formula if needed

## Future Enhancements

### Potential Improvements
1. **Streak bonuses**: Extra multiplier for consecutive productive days
2. **Time-based boosts**: Multiplier increases during "power hours"
3. **Achievement system**: Unlock higher max multipliers
4. **Visual effects**: Sparkles/glow when growth speed is high
5. **Plant preferences**: Some plants grow better with certain activity types

### Customization Options
- User-adjustable multiplier curve
- Custom score → multiplier mappings
- Per-plant growth modifiers
- Activity-specific multipliers (e.g., coding vs learning)

## Testing

### Manual Testing Steps
1. Start a focus session
2. Open the garden
3. Plant some seeds
4. Observe the "Growth Speed" in the toolbar
5. Switch between productive and non-productive activities
6. Watch the multiplier adjust in real-time
7. Notice plants grow faster with higher productivity

### Expected Behavior
- ✅ Multiplier updates within 30 seconds of score changes
- ✅ Growth speed visible in inventory toolbar
- ✅ Plants grow faster with higher multiplier
- ✅ Initial multiplier set on garden load
- ✅ Console logs show multiplier changes

## Code References

### Key Files
- `focal/src/components/Garden.tsx` - Focus update listener & multiplier logic
- `focal/src/core/gardenGame.ts` - Growth multiplier application
- `focal/src/hooks/useGardenGame.ts` - Game state management
- `focal/electron/focus-ai.ts` - Productivity score calculation
- `focal/electron/main.ts` - IPC communication

### Key Functions
- `calculateHybridScore()` - Calculates productivity scores
- `setGrowthMultiplier(multiplier)` - Updates growth speed
- `tick(deltaTime)` - Applies growth with multiplier
- `handleFocusUpdate()` - Processes score updates

## Troubleshooting

### Multiplier Not Updating
1. Check if focus tracking is active
2. Verify focus-update events are being sent (check console)
3. Ensure Garden component is mounted
4. Check multiplier calculation logic

### Growth Too Fast/Slow
- Adjust multiplier formula in `Garden.tsx`
- Current formula: `0.5 + (score / 1000) × 2.5`
- Increase/decrease the coefficient (2.5) to adjust sensitivity

### Console Logging
Enable detailed logs:
```typescript
console.log(`[Garden] Score: ${score}, Multiplier: ${multiplier}`);
```

## Conclusion
The productivity-garden integration creates a powerful feedback loop that motivates users to stay focused while providing immediate, visual rewards for their productive work. The system is flexible, efficient, and can be easily customized for different user needs.

