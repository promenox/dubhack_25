# How to Test the Growth Multiplier

## ⚠️ IMPORTANT: Two Different Ways to Test

There are **TWO SEPARATE** ways to test the multiplier, and they work differently:

---

## 🎮 METHOD 1: Test in the Running App (RECOMMENDED)

This tests the multiplier **inside your actual Electron app** while it's running.

### Step-by-Step

1. **Make sure your app is running**

   ```bash
   npm run dev
   ```

   You should see the Electron window open with your garden game.

2. **Plant some seeds**
   - Plant at least one seed in your garden
   - You need growing plants to see the multiplier effect!

3. **Open the Developer Tools**
   - In the Electron window, press: **F12** (or Ctrl+Shift+I)
   - Or right-click anywhere and select "Inspect Element"
   - A panel should open showing the Console tab

4. **Run this command in the Console**

   ```javascript
   __testMultiplier(10)
   ```

   Press Enter.

5. **What you should see:**
   - Console output:

     ```
     [Debug] Setting multiplier to 10
     [Dispatch] Set multiplier to 10
     ```

   - The **"GROWTH X.Xx"** display in your toolbar should change from "1.0x" to "10.0x"
   - Your plants should start growing **10 times faster**!

6. **Try different values:**

   ```javascript
   __testMultiplier(5)   // 5x speed
   __testMultiplier(20)  // 20x speed  
   __testMultiplier(1)   // back to normal
   ```

### 📊 How to Verify It's Working

**Before (1x speed):**

- A 60-second plant takes 60 seconds to complete
- Progress bar fills at ~1.67% per second

**After (10x speed):**

- Same plant now takes only 6 seconds to complete
- Progress bar fills at ~16.7% per second (much faster!)

---

## 🧪 METHOD 2: Run the Test Script (Isolated Test)

This runs **outside** your app in a separate Node.js process.

### Step-by-Step

1. **Run the test from terminal:**

   ```bash
   npx ts-node --project tsconfig.test.json src/tracker/randomMultiplierTest.ts
   ```

2. **What you should see:**

   ```
   [Tracker Test] Testing tracker module...
   [Tracker Test] Before: 1
   [Tracker Test] Set to: 7
   [Tracker Test] After: 7
   [Tracker Test] ✓ SUCCESS: Multiplier updated correctly
   ```

3. **⚠️ IMPORTANT:** This test does **NOT** affect your running app!
   - It only tests the tracker module in isolation
   - It runs in a different process with different memory
   - Your Electron app won't see these changes

---

## ❓ Why Doesn't the Test Script Affect My App?

```
┌─────────────────────┐          ┌─────────────────────┐
│   Test Script       │          │   Electron App      │
│   (Node Process)    │    ✗     │   (Renderer)        │
│                     │  No      │                     │
│  tracker: 7         │  Link    │  tracker: 1         │
│  (separate memory)  │          │  (separate memory)  │
└─────────────────────┘          └─────────────────────┘
```

They're completely separate processes with their own copies of the code.

---

## 🎯 TL;DR - Quick Test

1. ✅ App running? (`npm run dev`)
2. ✅ Plant a seed
3. ✅ Press F12 to open DevTools
4. ✅ Type in console: `__testMultiplier(10)`
5. ✅ Watch the GROWTH display change to "10.0x"
6. ✅ Watch your plant grow super fast!

---

## 🐛 Troubleshooting

### "I don't see __testMultiplier"

- Make sure the app fully loaded (not stuck on "Preparing Your Garden...")
- Check the console for: `[Debug] Test helper available: __testMultiplier(n)`
- Try refreshing the Electron window (Ctrl+R or Cmd+R)

### "The number changed but plants aren't growing faster"

- Make sure you have **planted seeds** (not just bought seeds)
- Check the Console for any errors
- Look for log messages like `[Tick] Multiplier: 10.0x`

### "Nothing happens when I run the test script"

- That's expected! The test script doesn't affect the live app
- Use METHOD 1 (browser console) instead

---

## 📝 Next Steps

If you want the test script to affect the live app, you need to:

- Add IPC communication between processes, OR
- Use shared storage (localStorage/file), OR  
- Just use the browser console method (simpler!)
