/*
  Standalone test runner for the tracker multiplier.
  Run with: npx ts-node --project tsconfig.test.json src/tracker/randomMultiplierTest.ts
*/

// Direct import now that we have proper ts-node config
import {
  getProductivityMultiplier,
  setProductivityMultiplier,
} from './index';

function main() {
  try {
    console.log('[Tracker Test] Testing tracker module...');

    const before = getProductivityMultiplier();
    console.log(`[Tracker Test] Before: ${before}`);

    const random = Math.floor(Math.random() * 10) + 1;
    setProductivityMultiplier(random);
    console.log(`[Tracker Test] Set to: ${random}`);

    const after = getProductivityMultiplier();
    console.log(`[Tracker Test] After: ${after}`);

    if (after === random) {
      console.log('[Tracker Test] ✓ SUCCESS: Multiplier updated correctly');
      // Exit successfully without requiring @types/node
      (globalThis as any).process?.exit(0);
    } else {
      throw new Error(`Expected ${random}, got ${after}`);
    }
  } catch (err) {
    console.error('[Tracker Test] Error:', err);
    // Exit with error code without requiring @types/node
    (globalThis as any).process?.exit(1);
  }
}

main();
