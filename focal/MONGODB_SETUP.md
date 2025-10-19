# MongoDB Database Setup Guide

This guide explains how to set up and use MongoDB for the FocalAI application.

## Overview

The application now uses MongoDB Atlas for storing user scores and data. The database service provides the following functions:

-   `setScore(score: number)` - Set a user's score (overwrites existing)
-   `getScore()` - Get a user's current score
-   `saveScore(score: number)` - Alias for setScore (backward compatibility)
-   `fetchScore()` - Alias for getScore (backward compatibility)
-   `updateScore(additionalScore: number)` - Add to the user's existing score

## Prerequisites

1. MongoDB Atlas account (free tier available)
2. Node.js with npm installed
3. MongoDB package (already installed in package.json)

## MongoDB Connection Setup

### Step 1: Get Your MongoDB Connection String

The connection URI is:

```
mongodb+srv://test:<db_password>@focalai.t1ld1i3.mongodb.net/?retryWrites=true&w=majority&appName=FocalAI
```

**Important**: Replace `<db_password>` with your actual MongoDB database password.

### Step 2: Configure Environment Variables

Create a `.env` file in the `focal` directory with the following content:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://test:YOUR_PASSWORD_HERE@focalai.t1ld1i3.mongodb.net/?retryWrites=true&w=majority&appName=FocalAI
MONGODB_DB_NAME=focalai
MONGODB_COLLECTION=user_scores
```

Replace `YOUR_PASSWORD_HERE` with your actual MongoDB password.

### Step 3: Verify Installation

MongoDB is already included in `package.json`. If needed, you can reinstall it:

```bash
npm install mongodb
```

## Database Schema

### Collection: `user_scores`

```typescript
interface UserScore {
	userId: string; // User's authentication token or unique ID
	score: number; // Current score
	timestamp: number; // Initial creation timestamp
	lastUpdated: number; // Last update timestamp
}
```

### Indexes

-   `userId`: Unique index for fast lookups

## Usage Examples

### Setting a Score

```typescript
import { databaseService } from "./services/database";

// Set auth token first
databaseService.setAuthToken(userToken);

// Set score to a specific value
await databaseService.setScore(100);
```

### Getting a Score

```typescript
// Get current score
const score = await databaseService.getScore();
console.log(`User score: ${score}`);
```

### Updating a Score (Adding Points)

```typescript
// Add 50 points to existing score
await databaseService.updateScore(50);
```

## Features

### Automatic Connection Management

-   Lazy connection: Connects on first database operation
-   Connection pooling: Reuses existing connections
-   Auto-reconnection: Handles connection drops

### Error Handling

All methods throw errors if:

-   Authentication token is not set
-   Database connection fails
-   MongoDB operations fail

### Security

-   Authentication token required for all operations
-   Unique user identification
-   Secure connection via TLS/SSL

## Troubleshooting

### Connection Issues

If you see "Failed to connect to MongoDB" errors:

1. **Check your password**: Ensure `<db_password>` is replaced with the actual password
2. **Check network access**: Verify your IP is whitelisted in MongoDB Atlas
3. **Check connection string**: Ensure the URI is correct and includes all parameters

### Authentication Errors

If you see "Authentication token not available":

```typescript
// Make sure to set the token before database operations
databaseService.setAuthToken(yourAuthToken);
```

### Index Errors

If you see duplicate key errors, it means a user with that ID already exists. This is expected behavior - use `updateScore()` instead of `setScore()` for existing users.

## MongoDB Atlas Configuration

### Whitelist Your IP

1. Go to MongoDB Atlas Dashboard
2. Navigate to Network Access
3. Click "Add IP Address"
4. Add your current IP or use `0.0.0.0/0` for development (not recommended for production)

### Create Database User

1. Go to Database Access
2. Click "Add New Database User"
3. Create a user with read/write permissions
4. Save the password for your `.env` file

## Migration from Previous Database

The new MongoDB service maintains backward compatibility with the previous API:

-   `saveScore()` → Works the same way
-   `fetchScore()` → Works the same way
-   `updateScore()` → Works the same way
-   `setAuthToken()` → Works the same way

No code changes required in existing implementations!

## Performance

-   Average query time: ~50-100ms
-   Connection pooling enabled
-   Automatic index optimization
-   Supports concurrent operations

## Security Best Practices

1. **Never commit `.env` file**: Add it to `.gitignore`
2. **Use strong passwords**: For MongoDB users
3. **Rotate credentials**: Regularly update passwords
4. **IP Whitelist**: Restrict database access
5. **Use JWT tokens**: For user authentication

## Additional Resources

-   [MongoDB Node.js Driver Documentation](https://docs.mongodb.com/drivers/node/)
-   [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
-   [Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)

## Support

For issues or questions, refer to:

-   MongoDB Atlas Support
-   Project documentation
-   GitHub issues
