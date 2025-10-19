# Live Score Sync - Quick Reference

## ✅ What Was Done

Your score now **automatically uploads to MongoDB** whenever it changes!

## 🎯 When Score Syncs

| Action          | Score Change | Auto-Sync |
| --------------- | ------------ | --------- |
| 🌱 Harvest crop | +Points      | ✅ Yes    |
| 🌾 Buy seed     | -Cost        | ✅ Yes    |
| 🏡 Unlock plot  | -50          | ✅ Yes    |
| 🎮 Game loads   | Current      | ✅ Yes    |

## 🚀 How to Use

**Nothing! It's automatic.**

Just play the game normally. Your score syncs in the background automatically.

## 📊 Check If It's Working

### 1. Open DevTools (F12)

Look for these messages in the console:

```
✅ Score set successfully
✅ Score set successfully for user abc123...: 150
```

### 2. Check MongoDB Atlas

1. Go to your MongoDB Atlas dashboard
2. Navigate to: Collections → `focalai` → `user_scores`
3. Watch the `score` and `lastUpdated` fields change in real-time!

## 🔧 Files Modified

-   ✅ `src/utils/database.ts` - Added `setScore()` function
-   ✅ `electron/main.ts` - Added IPC handler
-   ✅ `src/core/gardenGame.ts` - Added auto-sync logic

## 📖 Detailed Documentation

-   **Full Guide**: `LIVE_SCORE_SYNC.md`
-   **Implementation**: `LIVE_SCORE_IMPLEMENTATION_SUMMARY.md`
-   **Setup**: `MONGODB_SETUP.md`

## ⚡ Quick Test

1. Start the app: `npm run dev`
2. Open DevTools (F12)
3. Harvest a crop or buy a seed
4. Look for: `✅ Score set successfully`
5. Check MongoDB Atlas dashboard

## 🎉 That's It!

Your score now syncs live to MongoDB automatically. No manual saving needed!

---

**Status:** ✅ Complete and Ready to Use
