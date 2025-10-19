# 🔧 Fixing Database Connection Issues

## The Problem

You're seeing these errors:

```
❌ Failed to save dummy score: 9041984:error:10000438:SSL routines:OPENSSL_internal:TLSV1_ALERT_INTERNAL_ERROR
❌ Failed to restore FocusAI score: SSL routines:OPENSSL_internal:TLSV1_ALERT_INTERNAL_ERROR
```

**Root Cause**: The app is trying to connect to MongoDB with invalid test credentials (`test:test`), causing SSL/TLS authentication failures.

## The Solution

You have **2 options**:

### Option 1: Set Up MongoDB (Recommended for Production)

1. **Get your MongoDB credentials** (if you already have a MongoDB Atlas cluster)

    - Go to your MongoDB Atlas dashboard
    - Get your connection string with the correct password

2. **Create a `.env` file** in the `focal` directory:

    ```env
    # MongoDB Configuration
    MONGODB_URI=mongodb+srv://test:YOUR_ACTUAL_PASSWORD@focalai.t1ld1i3.mongodb.net/?retryWrites=true&w=majority&appName=FocalAI
    MONGODB_DB_NAME=focalai
    MONGODB_COLLECTION=user_scores
    ```

    Replace `YOUR_ACTUAL_PASSWORD` with your real MongoDB password.

3. **Restart the app**
    - The connection should now work
    - You should see: `✅ Successfully connected to MongoDB!`

### Option 2: Work Without Database (For Local Development)

The app now works fine **without** a database connection!

-   **Scores are saved locally** in your browser's localStorage
-   The app will show warnings but **won't crash**
-   You'll see: `⚠️ App will continue without database. Scores will be saved locally only.`

## What Changed

I've improved the error handling so that:

✅ **Faster timeouts**: 5 seconds instead of hanging forever  
✅ **Better error messages**: Clear indication of SSL/TLS issues  
✅ **Graceful degradation**: App works without database  
✅ **Retry logic**: Won't spam connection attempts  
✅ **Helpful guidance**: Console logs point you to setup instructions

## Verifying It Works

After setting up MongoDB credentials, restart the app and look for:

1. **On app start:**

    ```
    🔌 Attempting to connect to MongoDB...
    ✅ Successfully connected to MongoDB!
    ```

2. **When you harvest/buy something:**
    ```
    🔄 Attempting to sync score to database: 100
    📤 setScore called with score: 100
    📡 Invoking set-score IPC with score: 100
    📨 Main process received set-score IPC with score: 100
    ✅ Score set successfully for user ...
    ✅ Main process: setScore completed successfully
    📥 Received response from set-score: {success: true}
    ✅ Score set successfully
    ✅ Score synced successfully: 100
    ```

## Still Having Issues?

If you've set up the .env file but still see errors:

1. **Check your MongoDB password is correct**
2. **Make sure your IP is whitelisted in MongoDB Atlas** (Network Access settings)
3. **Verify the connection string format** matches the example above
4. **Check that the .env file is in the `focal` directory**, not the root

## Related Documentation

-   `MONGODB_SETUP.md` - Full MongoDB setup guide
-   `MONGODB_REFERENCE.md` - API reference
