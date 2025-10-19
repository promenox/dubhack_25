# AI Integration Setup

## Overview

The FocusAI system now supports **real AI-powered context analysis** using OpenAI's GPT models. This provides much more intelligent and nuanced productivity scoring compared to the previous rule-based system.

## Features

### 🤖 AI-Powered Analysis
- **Contextual Understanding**: AI analyzes app names, window titles, URLs, and user behavior patterns
- **Dynamic Scoring**: Real-time productivity multipliers based on actual content analysis
- **Intelligent Insights**: AI provides meaningful explanations for scoring decisions
- **Fallback Support**: Automatically falls back to rule-based analysis if AI is unavailable

### 📊 Enhanced Scoring
- **Granular Multipliers**: AI provides multipliers from 0.1 to 2.0 for precise scoring
- **Context Categories**: productive, neutral, distracted, idle with AI reasoning
- **Confidence Scoring**: AI provides confidence levels for its assessments
- **Real-time Analysis**: AI analysis happens every few seconds for responsive scoring

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Set Environment Variable

**Option A: Environment Variable (Recommended)**
```bash
export OPENAI_API_KEY="sk-your-api-key-here"
npm run dev
```

**Option B: Create .env file**
```bash
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
npm run dev
```

### 3. Verify AI Integration

When you run the app, you should see:
```
🤖 OpenAI initialized successfully - AI analysis enabled
🎯 FocusAI: Using LINEAR SCORING ENGINE + AI
🤖 AI context: { multiplier: 1.8, insight: "Focused coding work", ... }
```

If AI is not available, you'll see:
```
⚠️  OpenAI API key not found - using rule-based analysis only
🎯 FocusAI: Using LINEAR SCORING ENGINE (rule-based)
```

## AI Analysis Examples

### High Productivity (2.0x multiplier)
- **App**: Visual Studio Code
- **Title**: "focus-ai.ts - focal/src/electron"
- **AI Insight**: "Active coding session with high engagement"
- **Context**: "productive"

### Moderate Productivity (1.2x multiplier)
- **App**: Chrome
- **Title**: "React Documentation - Mozilla Developer Network"
- **AI Insight**: "Learning and research activity"
- **Context**: "productive"

### Distracting Activity (0.3x multiplier)
- **App**: Chrome
- **Title**: "Funny Cat Videos - YouTube"
- **AI Insight**: "Entertainment content with low productivity value"
- **Context**: "distracted"

### Neutral Activity (1.0x multiplier)
- **App**: Finder
- **Title**: "Documents"
- **AI Insight**: "File management and organization"
- **Context**: "neutral"

## Technical Details

### AI Model
- **Model**: GPT-3.5-turbo (fast and cost-effective)
- **Temperature**: 0.3 (consistent, focused responses)
- **Max Tokens**: 200 (concise responses)
- **Cost**: ~$0.001-0.002 per analysis (very low cost)

### Fallback Behavior
- If AI API fails → Falls back to rule-based analysis
- If no API key → Uses rule-based analysis
- If rate limited → Temporarily uses rule-based analysis
- All fallbacks are seamless and logged

### Performance
- AI analysis takes ~200-500ms per request
- Cached for 30 seconds to reduce API calls
- Non-blocking: app continues working during AI analysis
- Automatic retry on temporary failures

## Troubleshooting

### "AI analysis failed, falling back to rules"
- Check your API key is correct
- Verify you have OpenAI credits
- Check internet connection
- Review console logs for specific error

### "OpenAI API key not found"
- Set the OPENAI_API_KEY environment variable
- Restart the application after setting the key
- Ensure the key starts with `sk-`

### High API Costs
- AI analysis is optimized for low cost
- Each analysis costs ~$0.001-0.002
- Consider using rule-based mode if costs are a concern
- Monitor usage in OpenAI dashboard

## Benefits Over Rule-Based System

| Feature | Rule-Based | AI-Powered |
|---------|------------|------------|
| Context Understanding | Basic app names | Deep content analysis |
| Scoring Accuracy | Fixed categories | Dynamic, nuanced scoring |
| Insight Quality | Generic messages | Meaningful explanations |
| Adaptability | Static rules | Learns from context |
| Edge Cases | Poor handling | Intelligent analysis |

The AI integration transforms FocusAI from a simple rule-based tracker into an intelligent productivity companion that truly understands your work patterns and provides meaningful insights.
