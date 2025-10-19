# Plant Growth Duration Configuration

## Overview

Plant growth durations are now **configurable** instead of hard-coded. This allows you to dynamically adjust how long each plant type takes to grow without modifying the core game code.

## Default Durations

The default growth durations (in seconds) are:

| Plant Type   | Duration | Time       |
| ------------ | -------- | ---------- |
| Seedling     | 60       | 1 minute   |
| Blossom      | 300      | 5 minutes  |
| Evergreen    | 600      | 10 minutes |
| Rose         | 1200     | 20 minutes |
| Lavender     | 1800     | 30 minutes |
| Beanstalk    | 3600     | 1 hour     |
| Six Sevenium | 420      | 7 minutes  |

## How to Configure Durations

### 1. Set Custom Durations

You can override specific plant durations using the `setGrowthConfig` function:

```typescript
import { setGrowthConfig } from "./core/index";

// Speed up seedling growth to 30 seconds
setGrowthConfig({
	durations: {
		seedling: 30,
	},
});

// Or configure multiple plants at once
setGrowthConfig({
	durations: {
		seedling: 30,
		blossom: 120,
		evergreen: 300,
	},
});
```

### 2. Get Current Configuration

```typescript
import { getGrowthConfig } from "./core/index";

const config = getGrowthConfig();
console.log(config.durations.seedling); // Current seedling duration in seconds
```

### 3. Reset to Defaults

```typescript
import { resetGrowthConfig } from "./core/index";

// Reset all durations back to default values
resetGrowthConfig();
```

## Integration with Multipliers

The growth multiplier system works **on top of** the configured durations:

```typescript
// Set custom duration
setGrowthConfig({
	durations: {
		seedling: 120, // 2 minutes base duration
	},
});

// Set growth multiplier to 2x
gameInstance.setGrowthMultiplier(2);

// Actual growth time = 120 / 2 = 60 seconds (1 minute)
```

## Example: Dynamic Difficulty Adjustment

```typescript
import { setGrowthConfig, GardenGame } from "./core/index";

// Easy mode - faster growth
function setEasyMode() {
	setGrowthConfig({
		durations: {
			seedling: 30,
			blossom: 150,
			evergreen: 300,
			rose: 600,
			lavender: 900,
			beanstalk: 1800,
			sixtyseven: 210,
		},
	});
}

// Hard mode - slower growth
function setHardMode() {
	setGrowthConfig({
		durations: {
			seedling: 120,
			blossom: 600,
			evergreen: 1200,
			rose: 2400,
			lavender: 3600,
			beanstalk: 7200,
			sixtyseven: 840,
		},
	});
}

// Normal mode - defaults
function setNormalMode() {
	resetGrowthConfig();
}
```

## Example: Focus-Based Duration Adjustment

```typescript
import { setGrowthConfig } from "./core/index";

// Adjust plant growth based on user's focus score
function adjustGrowthByFocusLevel(focusScore: number) {
	// Higher focus = faster base growth
	const speedMultiplier = 1 + focusScore / 100; // 1.0x to 2.0x

	setGrowthConfig({
		durations: {
			seedling: Math.floor(60 / speedMultiplier),
			blossom: Math.floor(300 / speedMultiplier),
			evergreen: Math.floor(600 / speedMultiplier),
			rose: Math.floor(1200 / speedMultiplier),
			lavender: Math.floor(1800 / speedMultiplier),
			beanstalk: Math.floor(3600 / speedMultiplier),
			sixtyseven: Math.floor(420 / speedMultiplier),
		},
	});
}
```

## API Reference

### `setGrowthConfig(config: Partial<GrowthConfig>): void`

Sets custom growth durations. Only specified plants will be updated; others keep their current values.

**Parameters:**

-   `config.durations`: Partial record of plant types to duration in seconds

### `getGrowthConfig(): GrowthConfig`

Returns the current growth configuration.

**Returns:**

-   `GrowthConfig` object with all plant durations

### `resetGrowthConfig(): void`

Resets all growth durations back to their default values.

### `getSeedLibrary(): Record<PlantType, SeedDefinition>`

Gets the current seed library with all plant definitions using current configured durations.

**Returns:**

-   Complete seed library with current growth durations

## Notes

-   Durations are in **seconds**
-   The multiplier system (`setGrowthMultiplier`) is applied **after** base durations
-   Configuration changes take effect immediately for new plants
-   Plants already growing use the duration they were planted with
-   Minimum effective duration is 1 second (enforced in the tick calculation)
