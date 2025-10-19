# Database Integration Setup

This document explains how to set up and use the database integration for saving and retrieving user scores.

## Overview

The app automatically saves a dummy score of **420** to the database when a focus tracking session starts. This integration uses AWS Cognito for authentication and AWS API Gateway + Lambda for database operations.

## Setup Instructions

### 1. Set Your API Gateway URL

Update the API Gateway URL in `electron/services/database.ts`:

```typescript
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "https://your_actual_api_gateway_url";
```

Or set it as an environment variable in your `.env` file:

```
API_GATEWAY_URL=https://your_actual_api_gateway_url
```

### 2. Lambda Functions Required

You'll need to create the following Lambda functions behind your API Gateway:

#### Save Score (POST /save_score)

```python
import json
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('user_scores')  # Replace with your table name

def lambda_handler(event, context):
    # Get user_id from Cognito authorizer
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    # Parse request body
    body = json.loads(event['body'])
    score = body.get('score', 0)
    timestamp = body.get('timestamp', int(datetime.now().timestamp() * 1000))

    # Save to DynamoDB
    try:
        table.put_item(
            Item={
                'user_id': user_id,
                'score': score,
                'timestamp': timestamp,
                'updated_at': int(datetime.now().timestamp() * 1000)
            }
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
            },
            "body": json.dumps({
                "message": "Score saved successfully",
                "score": score
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
```

#### Get Score (GET /get_score)

```python
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('user_scores')  # Replace with your table name

def lambda_handler(event, context):
    # Get user_id from Cognito authorizer
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    # Fetch from DynamoDB
    try:
        response = table.get_item(Key={"user_id": user_id})
        item = response.get("Item", {"score": 0})

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
            },
            "body": json.dumps({
                "score": item.get("score", 0),
                "timestamp": item.get("timestamp", 0)
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
```

#### Update Score (PUT /update_score)

```python
import json
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('user_scores')  # Replace with your table name

def lambda_handler(event, context):
    # Get user_id from Cognito authorizer
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    # Parse request body
    body = json.loads(event['body'])
    additional_score = body.get('score', 0)

    # Update in DynamoDB (add to existing score)
    try:
        response = table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='ADD score :val SET updated_at = :time',
            ExpressionAttributeValues={
                ':val': additional_score,
                ':time': int(datetime.now().timestamp() * 1000)
            },
            ReturnValues='UPDATED_NEW'
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
            },
            "body": json.dumps({
                "message": "Score updated successfully",
                "new_score": response['Attributes']['score']
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
```

### 3. DynamoDB Table Structure

Create a DynamoDB table with the following structure:

-   **Table Name**: `user_scores` (or your preferred name)
-   **Primary Key**: `user_id` (String)
-   **Attributes**:
    -   `user_id` (String) - Cognito user UUID (sub claim)
    -   `score` (Number) - User's score
    -   `timestamp` (Number) - When the score was first saved
    -   `updated_at` (Number) - Last update timestamp

### 4. API Gateway Configuration

1. Create an API Gateway REST API
2. Configure Cognito Authorizer:
    - Authorizer Type: Cognito
    - User Pool: Your Cognito User Pool
    - Token Source: `Authorization` header
3. Create endpoints:
    - `POST /save_score` → Lambda function
    - `GET /get_score` → Lambda function
    - `PUT /update_score` → Lambda function
4. Enable CORS on all endpoints
5. Deploy the API and get the invoke URL

## How It Works

### Authentication Flow

1. User signs in through the Auth component
2. Upon successful sign-in, the ID token is automatically sent to the main process
3. The main process stores the token for database operations

### Automatic Score Saving

When a user starts a focus tracking session:

1. `start-session` IPC event is triggered
2. Focus tracker starts monitoring
3. **Dummy score of 420 is automatically saved to the database**
4. Success/failure is logged to console

### Manual Database Operations

You can also manually interact with the database from the renderer process:

```typescript
import { fetchScore, updateScore } from "./utils/database";

// Fetch current score
const score = await fetchScore();
console.log("Current score:", score);

// Update score (add to existing)
const success = await updateScore(50);
console.log("Score updated:", success);
```

## Testing

1. **Sign in to the app**
2. **Start a focus tracking session** from the Dashboard
3. **Check the console logs** for:
    ```
    💾 Attempting to save dummy score of 420 to database...
    ✅ Dummy score of 420 saved successfully!
    ```
4. **Check your DynamoDB table** to verify the score was saved

## Troubleshooting

### "Authentication token not available"

-   Make sure you're signed in before starting a session
-   Check that the Auth component is sending the token correctly
-   Verify the token is stored in localStorage

### "Failed to save score"

-   Verify your API Gateway URL is correct
-   Check that the Lambda functions are deployed
-   Ensure CORS is enabled on your API Gateway
-   Check Lambda function logs in CloudWatch
-   Verify the Cognito authorizer is configured correctly

### "Network Error"

-   Check your internet connection
-   Verify the API Gateway endpoint is accessible
-   Check for firewall/proxy issues

## Next Steps

Once this integration is working with the dummy score of 420, you can:

1. **Replace the dummy score** with actual productivity scores from `focusAI.cumulativeScore`
2. **Add periodic saving** to save scores throughout the session
3. **Implement score history** tracking
4. **Add leaderboards** or other social features
5. **Sync garden progress** to the cloud

## API Response Examples

### Save Score Success

```json
{
	"message": "Score saved successfully",
	"score": 420
}
```

### Get Score Success

```json
{
	"score": 420,
	"timestamp": 1697234567890
}
```

### Update Score Success

```json
{
	"message": "Score updated successfully",
	"new_score": 470
}
```
