const OpenAI = require('openai');

class ProductivityAnalyzer {
  constructor() {
    // Initialize OpenAI client (you'll need to set OPENAI_API_KEY environment variable)
    const apiKey = process.env.OPENAI_API_KEY;
    this.hasValidAPIKey = apiKey && apiKey !== 'your-api-key-here' && apiKey.length > 10;
    
    if (this.hasValidAPIKey) {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
    } else {
      console.log('No valid OpenAI API key found. Using rule-based analysis only.');
    }
    
    this.productivityCategories = {
      'productive': ['Visual Studio Code', 'Terminal', 'Chrome', 'Safari', 'Slack', 'Notion', 'Obsidian'],
      'neutral': ['Finder', 'System Preferences', 'Activity Monitor'],
      'distracting': ['YouTube', 'Twitter', 'Instagram', 'Facebook', 'TikTok', 'Games', 'X']
    };
    
    this.scoreWeights = {
      appFocus: 0.3,
      windowSwitching: 0.2,
      keystrokeActivity: 0.2,
      idleTime: 0.2,
      sessionDuration: 0.1
    };
  }

  async calculateScore(metrics) {
    try {
      // Calculate base score using rules
      const baseScore = this.calculateBaseScore(metrics);
      
      // Get LLM analysis for context and adjustment
      const llmAnalysis = await this.getLLMAnalysis(metrics);
      
      // Combine base score with LLM insights
      const finalScore = this.combineScores(baseScore, llmAnalysis);
      
      return {
        score: Math.round(finalScore),
        baseScore: Math.round(baseScore),
        analysis: llmAnalysis,
        metrics: this.formatMetricsForDisplay(metrics),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating productivity score:', error);
      return this.getFallbackScore(metrics);
    }
  }

  calculateBaseScore(metrics) {
    let score = 50; // Start with neutral score
    
    // App focus analysis (30% weight)
    const appFocusScore = this.analyzeAppFocus(metrics);
    score += (appFocusScore - 50) * this.scoreWeights.appFocus;
    
    // Window switching analysis (20% weight)
    const switchingScore = this.analyzeWindowSwitching(metrics);
    score += (switchingScore - 50) * this.scoreWeights.windowSwitching;
    
    // Keystroke activity analysis (20% weight)
    const keystrokeScore = this.analyzeKeystrokeActivity(metrics);
    score += (keystrokeScore - 50) * this.scoreWeights.keystrokeActivity;
    
    // Idle time analysis (20% weight)
    const idleScore = this.analyzeIdleTime(metrics);
    score += (idleScore - 50) * this.scoreWeights.idleTime;
    
    // Session duration analysis (10% weight)
    const sessionScore = this.analyzeSessionDuration(metrics);
    score += (sessionScore - 50) * this.scoreWeights.sessionDuration;
    
    return Math.max(0, Math.min(100, score));
  }

  analyzeAppFocus(metrics) {
    if (!metrics.currentApp) return 50;
    
    const appName = metrics.currentApp.name.toLowerCase();
    
    for (const [category, apps] of Object.entries(this.productivityCategories)) {
      if (apps.some(app => appName.includes(app.toLowerCase()))) {
        switch (category) {
          case 'productive': return 80;
          case 'neutral': return 50;
          case 'distracting': return 20;
        }
      }
    }
    
    return 50; // Unknown app
  }

  analyzeWindowSwitching(metrics) {
    const switchRate = metrics.windowSwitchRate || 0;
    
    // Optimal switching rate is around 2-5 switches per minute
    if (switchRate < 1) return 30; // Too little switching
    if (switchRate <= 5) return 80; // Good switching rate
    if (switchRate <= 10) return 60; // Moderate switching
    return 20; // Too much switching
  }

  analyzeKeystrokeActivity(metrics) {
    const keystrokeRate = metrics.keystrokeRate || 0;
    
    // Optimal keystroke rate depends on activity type
    if (keystrokeRate < 10) return 30; // Very low activity
    if (keystrokeRate <= 50) return 80; // Good typing activity
    if (keystrokeRate <= 100) return 70; // High activity
    return 40; // Potentially excessive
  }

  analyzeIdleTime(metrics) {
    const productivityRatio = metrics.productivityRatio || 0;
    
    if (productivityRatio > 0.8) return 90; // Very productive
    if (productivityRatio > 0.6) return 75; // Good productivity
    if (productivityRatio > 0.4) return 50; // Moderate productivity
    if (productivityRatio > 0.2) return 30; // Low productivity
    return 10; // Very low productivity
  }

  analyzeSessionDuration(metrics) {
    const sessionMinutes = (metrics.sessionDuration || 0) / 60000;
    
    if (sessionMinutes < 5) return 20; // Very short session
    if (sessionMinutes < 30) return 60; // Short session
    if (sessionMinutes < 120) return 80; // Good session length
    if (sessionMinutes < 240) return 70; // Long session
    return 40; // Very long session (potential burnout)
  }

  async getLLMAnalysis(metrics) {
    if (!this.hasValidAPIKey) {
      return {
        insight: "Using rule-based analysis. Set OPENAI_API_KEY for AI insights.",
        confidence: 0.5
      };
    }
    
    try {
      const prompt = this.buildAnalysisPrompt(metrics);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a productivity analyst. Analyze user activity data and provide insights about their productivity patterns. Be concise and actionable."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });
      
      return {
        insight: response.choices[0].message.content,
        confidence: 0.8
      };
    } catch (error) {
      console.error('LLM analysis failed:', error);
      return {
        insight: "Unable to analyze activity patterns at this time.",
        confidence: 0.3
      };
    }
  }

  buildAnalysisPrompt(metrics) {
    return `
    Analyze this user's productivity data:
    
    Current App: ${metrics.currentApp?.name || 'Unknown'}
    Session Duration: ${Math.round((metrics.sessionDuration || 0) / 60000)} minutes
    Window Switches: ${metrics.windowSwitches} (${metrics.windowSwitchRate?.toFixed(1)} per minute)
    Keystrokes: ${metrics.keystrokes} (${metrics.keystrokeRate?.toFixed(1)} per minute)
    Productivity Ratio: ${(metrics.productivityRatio * 100)?.toFixed(1)}%
    Idle Time: ${Math.round((metrics.idleTime || 0) / 60000)} minutes
    
    Provide a brief insight about their productivity pattern and one actionable suggestion.
    `;
  }

  combineScores(baseScore, llmAnalysis) {
    // Simple combination - in production, you might want more sophisticated logic
    const llmAdjustment = (llmAnalysis.confidence - 0.5) * 10; // ±5 point adjustment
    return Math.max(0, Math.min(100, baseScore + llmAdjustment));
  }

  formatMetricsForDisplay(metrics) {
    return {
      currentApp: metrics.currentApp?.name || 'Unknown',
      sessionTime: Math.round((metrics.sessionDuration || 0) / 60000),
      windowSwitches: metrics.windowSwitches,
      keystrokes: metrics.keystrokes,
      productivityRatio: Math.round((metrics.productivityRatio || 0) * 100),
      idleTime: Math.round((metrics.idleTime || 0) / 60000)
    };
  }

  getFallbackScore(metrics) {
    const baseScore = this.calculateBaseScore(metrics);
    return {
      score: Math.round(baseScore),
      baseScore: Math.round(baseScore),
      analysis: {
        insight: "Using rule-based analysis. LLM analysis unavailable.",
        confidence: 0.5
      },
      metrics: this.formatMetricsForDisplay(metrics),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ProductivityAnalyzer;
