# AWS Bedrock Troubleshooting Guide

## Common Error: `NGHTTP2_PROTOCOL_ERROR`

If you're seeing this error repeatedly:

```
❌ Bedrock invocation failed: Stream closed with error code NGHTTP2_PROTOCOL_ERROR
```

This indicates a connection/authentication issue with AWS Bedrock, **not** a streaming issue.

## Root Causes

### 1. Invalid AWS Credentials ⚠️ MOST COMMON

The API key format must be valid AWS credentials:

**Correct Format:**

```
Base64(<AWS_ACCESS_KEY_ID>:<AWS_SECRET_ACCESS_KEY>)
```

**AWS Access Key ID format:**

-   Starts with `AKIA` (long-term) or `ASIA` (temporary/session)
-   Exactly 20 characters
-   Example: `AKIAIOSFODNN7EXAMPLE`

**AWS Secret Access Key format:**

-   40 characters
-   Mixed case alphanumeric with special characters
-   Example: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

**Current Issue:**
Your provided key decodes to:

```
BedrockAPIKey-ks39-at-274106733304:XfMFIAJe8IrKuMlkODHS03VEKGUAdrZe2CmV3pT4x7c0yTQBlbu/wPf/+nc=
```

This is **NOT** a valid AWS credential format. The key ID should start with `AKIA` or `ASIA`, not `BedrockAPIKey`.

### 2. Missing IAM Permissions

Even with valid credentials, your IAM user/role needs these permissions:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": ["bedrock:InvokeModel"],
			"Resource": ["arn:aws:bedrock:*::foundation-model/anthropic.claude-3-*"]
		}
	]
}
```

### 3. Wrong Region

Bedrock is not available in all regions. Supported regions:

-   `us-east-1` (Virginia)
-   `us-west-2` (Oregon) ← Default in our code
-   `eu-west-1` (Ireland)
-   `ap-southeast-1` (Singapore)
-   `ap-northeast-1` (Tokyo)

### 4. Model Not Available

Claude 3 models must be enabled in your AWS account:

1. Go to AWS Console → Bedrock → Model access
2. Request access to Claude 3 models
3. Wait for approval (usually instant)

## How to Get Valid AWS Credentials

### Option 1: Create IAM User (Recommended for Development)

1. **AWS Console** → IAM → Users → Create User
2. **Attach policy**: Create a custom policy with Bedrock permissions (see above)
3. **Create access key** → Security credentials → Create access key
4. **Copy credentials**: You'll get `Access Key ID` and `Secret Access Key`

### Option 2: Use AWS CLI

If you have AWS CLI configured:

```bash
aws configure
# Enter your credentials

# Then get them for encoding
aws configure get aws_access_key_id
aws configure get aws_secret_access_key
```

### Option 3: Use IAM Role (Production)

For production, use IAM roles instead of hardcoded credentials.

## How to Encode Credentials

Once you have valid AWS credentials:

### Using Node.js:

```javascript
const accessKeyId = "AKIAIOSFODNN7EXAMPLE"; // Your real key
const secretAccessKey = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"; // Your real secret

const combined = `${accessKeyId}:${secretAccessKey}`;
const encoded = Buffer.from(combined).toString("base64");
console.log(encoded);
```

### Using Command Line:

```bash
# Linux/Mac
echo -n "AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" | base64

# Windows PowerShell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"))
```

### Using Online Tool (⚠️ Not Recommended for Real Credentials):

Visit: https://www.base64encode.org/

## Update Your Configuration

Once you have a valid base64-encoded credential:

### Method 1: Environment Variable

```env
BEDROCK_API_KEY=QUtJQUlPU0ZPRE5ON0VYQU1QTEU6d0phbHJYVXRuRkVNSS9LN01ERU5HL2JQeFJmaUNZRVhBTVBMRUtFWQ==
```

### Method 2: Update main.ts

```typescript
const bedrockApiKey = "QUtJQUlPU0ZPRE5ON0VYQU1QTEU6d0phbHJYVXRuRkVNSS9LN01ERU5HL2JQeFJmaUNZRVhBTVBMRUtFWQ==";
this.focusAI = new FocusAI(bedrockApiKey);
```

## Testing Your Credentials

Test if credentials work:

```bash
aws bedrock list-foundation-models --region us-west-2
```

If this works, your credentials are valid for Bedrock.

## Alternative: Disable AI Analysis

If you can't get valid credentials, the system works fine with rule-based analysis:

```typescript
// In main.ts, pass undefined or empty string
this.focusAI = new FocusAI(undefined);
// or
this.focusAI = new FocusAI("");
```

The system will automatically fall back to rule-based analysis.

## Still Having Issues?

Check the console logs for:

```
✅ AWS Bedrock client initialized successfully
   Region: us-west-2
   Model: anthropic.claude-3-sonnet-20240229-v1:0
```

If you see this but still get `NGHTTP2_PROTOCOL_ERROR`, it's likely:

1. IAM permissions issue
2. Model not enabled in your account
3. Region doesn't support Bedrock

## Verify Your Setup

Run this test in your code:

```typescript
import { BedrockRuntimeClient, ListFoundationModelsCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
	region: "us-west-2",
	credentials: {
		accessKeyId: "YOUR_KEY_ID",
		secretAccessKey: "YOUR_SECRET_KEY",
	},
});

const command = new ListFoundationModelsCommand({});
const response = await client.send(command);
console.log(response);
```

If this works, your credentials are valid!

## Summary Checklist

-   [ ] AWS credentials are in the correct format (AKIA... / ASIA...)
-   [ ] Credentials are properly base64 encoded
-   [ ] IAM user/role has `bedrock:InvokeModel` permission
-   [ ] Claude 3 models are enabled in AWS Bedrock console
-   [ ] Using a supported region (us-west-2, us-east-1, etc.)
-   [ ] Network allows HTTPS connections to AWS
-   [ ] Credentials are not expired (if using temporary credentials)

---

**Note:** The system is designed to work WITHOUT AI if credentials fail. You'll just use rule-based analysis instead, which is perfectly functional for basic productivity tracking.
