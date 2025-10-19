# AI-Powered Productivity Scoring System

## 🤖 Bedrock LLM Integration

The system uses **AWS Bedrock Claude Haiku** to analyze user activity and generate intelligent productivity scores.

### **📊 AI Prompt Structure**

The LLM receives comprehensive metadata and analyzes it using **3 weighted criteria**:

#### **1. APPLICATION CONTEXT (40% weight)**
- **Development tools** (VS Code, Terminal, Cursor) → **High productivity (1.8-2.0)**
- **Communication tools** (Slack, Teams) → **Medium productivity (1.0-1.3)**
- **Browsers** → **Context-dependent** (educational vs entertainment)
- **Games/Entertainment** → **Low productivity (0.1-0.5)**

#### **2. CONTENT ANALYSIS (30% weight)**
- **Window title keywords** (project names, technical terms) → **High productivity**
- **Educational content** (tutorials, documentation) → **Medium-High productivity**
- **Social media, news, entertainment** → **Low productivity**

#### **3. BEHAVIORAL PATTERNS (30% weight)**
- **Low switching rate** (focused work) → **High productivity**
- **High focus ratio** (active time) → **High productivity**
- **Extended duration** in productive apps → **High productivity**

### **🎯 Score Ranges**
- **1.8-2.0**: Exceptional productivity (deep focused work)
- **1.4-1.7**: High productivity (meaningful work)
- **1.0-1.3**: Moderate productivity (mixed activities)
- **0.6-0.9**: Low productivity (some value, mostly neutral)
- **0.1-0.5**: Very low productivity (distracting activities)

### **🧠 AI Response Format**
```json
{
  "multiplier": 1.6,
  "insight": "User is engaged in focused development work using Cursor IDE. The low app switching rate and extended session duration indicate deep concentration on coding tasks.",
  "context": "productive",
  "confidence": 0.9,
  "reasoning": {
    "app_score": 1.8,
    "content_score": 1.5,
    "behavior_score": 1.4
  }
}
```

### **⚙️ Confidence-Based Scoring**
- **High confidence (0.8-1.0)**: Full multiplier applied
- **Medium confidence (0.5-0.7)**: Reduced multiplier impact
- **Low confidence (0.0-0.4)**: Conservative scoring

### **🔄 Fallback System**
- **Rule-based analysis** when AI unavailable
- **Graceful degradation** with quota management
- **5-minute retry** after quota exceeded

### **📈 Score Application**
```typescript
// Confidence-adjusted multiplier
const confidenceAdjustedMultiplier = 1.0 + (multiplier - 1.0) * confidence;

// Smooth score changes (40% immediate application)
const smoothedScore = baseScore + (adjustedScore - baseScore) * 0.4;
```

## **🔧 Setup Requirements**

### **AWS Credentials Needed:**
```bash
export BEDROCK_API_KEY="AKIA..."  # AWS Access Key ID
export AWS_SECRET_ACCESS_KEY="..." # AWS Secret Access Key
```

### **Current Status:**
- ✅ **AI Prompt**: Sophisticated multi-criteria analysis
- ✅ **Confidence Scoring**: Adjusts based on AI certainty
- ✅ **Fallback System**: Rule-based when AI unavailable
- ⚠️ **Authentication**: Needs valid AWS credentials

The system is **fully implemented** and ready to use with proper AWS Bedrock credentials! 🚀
