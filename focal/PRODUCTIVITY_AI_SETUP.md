# Productivity Intelligence with AWS Bedrock

This document explains how to use the new AI-powered productivity intelligence system that evaluates focus context using AWS Bedrock.

## Overview

The productivity intelligence model analyzes your screen activity in real-time to determine:

1. **Context Relation**: How related your current task is to previous tasks (focused, research, maintenance, distracted, idle)
2. **Productivity Level**: Whether the activity is productive, neutral, distracting, or idle
3. **Weight Multiplier**: A score multiplier (0.1-2.0) based on the analysis
4. **Insight**: A concise explanation of the scoring decision

## Architecture

The system is built with modular components:

```
focal/electron/services/
├── types.ts              # TypeScript interfaces for all services
├── bedrockClient.ts      # AWS Bedrock API client
├── contextAnalyzer.ts    # AI-powered context analysis service
├── config.ts             # Configuration utilities
└── index.ts              # Central exports
```

## Setup

### 1. Environment Variables (Recommended)

Create a `.env` file in the `focal` directory:

```env
# AWS Bedrock Configuration
BEDROCK_API_KEY=ABSKQmVkcm9ja0FQSUtleS1rczM5LWF0LTI3NDEwNjczMzMwNDpYZk1GSUFKZThJckt1TWxrT0RIUzAzVkVLR1VBZHJaZTJDbVYzcFQ0eDdjMHlUUUJsYnUvd1BmYituYz0=
BEDROCK_REGION=us-west-2
BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
```

### 2. Direct Configuration

Alternatively, the API key is hardcoded in `main.ts` as a fallback:

```typescript
const bedrockApiKey =
	process.env.BEDROCK_API_KEY ||
	"ABSKQmVkcm9ja0FQSUtleS1rczM5LWF0LTI3NDEwNjczMzMwNDpYZk1GSUFKZThJckt1TWxrT0RIUzAzVkVLR1VBZHJaZTJDbVYzcFQ0eDdjMHlUUUJsYnUvd1BmYituYz0=";
this.focusAI = new FocusAI(bedrockApiKey);
```

## How It Works

### 1. Screen Context Tracking

The system tracks:

-   Active application name
-   Window title
-   URL (for browsers)
-   Recent screen history (last 3 screens)

### 2. AI Analysis

When context changes are detected, the system:

1. Formats the current and recent screens into a prompt
2. Sends the prompt to AWS Bedrock (Claude 3 Sonnet)
3. Receives a JSON response with productivity analysis
4. Applies the multiplier to the base focus score

### 3. Fallback Mechanism

If AI is unavailable or fails:

-   Falls back to rule-based analysis
-   Uses predefined categories (productive/distracting apps)
-   Ensures the system continues working without interruption

## Response Format

The AI returns JSON in this format:

```json
{
	"contextRelation": "focused",
	"productivityLevel": "productive",
	"weightMultiplier": 1.8,
	"insight": "Deep work on development task with consistent focus"
}
```

### Context Relations

-   **focused**: Deep work on a single related task
-   **research**: Researching or learning related to current work
-   **maintenance**: Routine tasks (email, file management, etc.)
-   **distracted**: Unrelated or entertainment content
-   **idle**: No significant activity

### Productivity Levels

-   **productive**: Active, beneficial work
-   **neutral**: Routine tasks, not directly productive
-   **distracting**: Entertainment or off-task activities
-   **idle**: No activity detected

### Weight Multipliers

-   **1.5-2.0**: Deep or highly related work
-   **1.2-1.5**: Educational or research tasks
-   **0.9-1.1**: Routine admin tasks
-   **0.2-0.7**: Unrelated or entertainment
-   **0.0-0.3**: Idle time

## Example Analysis

**Scenario**: VS Code → GitHub → Stack Overflow → VS Code

**AI Analysis**:

```json
{
	"contextRelation": "focused",
	"productivityLevel": "productive",
	"weightMultiplier": 1.7,
	"insight": "Focused development workflow with relevant research"
}
```

**Scenario**: VS Code → YouTube → Twitter

**AI Analysis**:

```json
{
	"contextRelation": "distracted",
	"productivityLevel": "distracting",
	"weightMultiplier": 0.4,
	"insight": "Context switch to entertainment from work"
}
```

## Model Options

You can choose different Claude models for different use cases:

```typescript
import { MODEL_RECOMMENDATIONS } from "./services/config";

// Fast and efficient (recommended for frequent updates)
model: MODEL_RECOMMENDATIONS.FAST;

// Balanced performance and quality (default)
model: MODEL_RECOMMENDATIONS.BALANCED;

// Best quality, slower (for detailed analysis)
model: MODEL_RECOMMENDATIONS.ACCURATE;
```

## Integration with FocusAI

The Context Analyzer is automatically integrated with the existing FocusAI scoring system:

1. **Base Score**: Calculated from engagement metrics (keystrokes, mouse, focus time)
2. **AI Multiplier**: Applied based on context analysis
3. **Final Score**: Base score × AI multiplier
4. **Cumulative Score**: Tracked over time for garden growth

## Testing

The system includes comprehensive error handling:

-   Network failures → falls back to rule-based analysis
-   Invalid API key → logs warning, uses fallback
-   Parse errors → retries with fallback
-   All errors are logged for debugging

## Logging

The system provides detailed logging:

```
✅ AWS Bedrock client initialized successfully
🧠 Context Analyzer enabled with AWS Bedrock
🧠 AI Context Analysis: { contextRelation: 'focused', ... }
⚠️ AI context analysis failed, falling back to rules
```

## Performance

-   **AI Analysis**: ~1-2 seconds per context change
-   **Fallback Analysis**: <10ms
-   **Batch Updates**: Context analyzed only on actual changes (not continuously)
-   **Rate Limiting**: Built-in throttling to avoid excessive API calls

## Security

-   API key is base64 encoded
-   Stored in environment variables (recommended)
-   Never exposed to renderer process
-   All communication uses AWS SDK's built-in security

## Troubleshooting

### AI not working

1. Check `BEDROCK_API_KEY` is set correctly
2. Verify API key format (base64 encoded)
3. Check network connectivity
4. Review console logs for error messages

### Fallback mode always active

-   This is normal if API key is invalid or Bedrock is unreachable
-   System continues working with rule-based analysis

### Inconsistent scores

-   AI provides context-aware scoring (more nuanced than rules)
-   Scores adapt to your actual workflow patterns
-   This is expected behavior for intelligent analysis

## Future Enhancements

Potential improvements:

-   User-specific learning patterns
-   Time-of-day adjustments
-   Project-specific context awareness
-   Long-term productivity trends
-   Custom productivity categories
