# Focal Productivity Tracker

A real-time productivity tracking app built with Electron that monitors your activity and displays an AI-powered productivity score.

## Features

- **Real-time Activity Monitoring**: Tracks active applications, keystrokes, and window switches
- **Cross-Platform Support**: Works on Windows, macOS, and Linux
- **AI-Powered Analysis**: Uses OpenAI's GPT to analyze productivity patterns and provide insights
- **Modern UI**: Clean, dark-themed dashboard with real-time metrics
- **Live Metrics**: Displays session time, focus percentage, and activity rates
- **Smart Scoring**: Combines rule-based analysis with LLM insights for accurate productivity scoring
- **1000-Point Scale**: Maximum score of 1000 points for 10 hours of peak performance

## Prerequisites

- Node.js (v16 or higher)
- Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- OpenAI API key (optional - falls back to rule-based analysis)

## Installation

1. **Clone and install dependencies**:
   ```bash
   cd focal
   npm install
   ```

2. **Set up OpenAI API key** (optional):
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env and add your OpenAI API key
   OPENAI_API_KEY=your-openai-api-key-here
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

## Platform-Specific Notes

### Windows
- Uses PowerShell to detect active windows and applications
- No additional permissions required
- Works with all major browsers (Chrome, Edge, Firefox)

### macOS
- Uses AppleScript to detect active windows and applications
- May require accessibility permissions for full functionality
- Supports Chrome and Safari tab detection

### Linux
- Uses xdotool for window detection (install with `sudo apt install xdotool`)
- Falls back gracefully if xdotool is not available
- Works with most desktop environments (GNOME, KDE, XFCE)

3. **Grant necessary permissions**:
   The app will request permissions for:
   - Screen Recording (to monitor active windows)
   - Accessibility (to track keystrokes)
   - Automation (to interact with system events)

## Usage

1. **Start the app**:
   ```bash
   npm start
   ```

2. **Development mode** (with DevTools):
   ```bash
   npm run dev
   ```

3. **Build for distribution**:
   ```bash
   npm run build
   ```

## How It Works

### Activity Tracking
- Monitors active applications and window titles
- Tracks window switching frequency
- Estimates keystroke activity
- Calculates idle vs. active time

### Productivity Analysis
- **Rule-based scoring**: Analyzes app categories, switching patterns, and activity levels
- **LLM enhancement**: Uses GPT to provide contextual insights and suggestions
- **Real-time updates**: Refreshes score every 5 seconds

### Scoring Factors
- **App Focus (30%)**: Categorizes applications as productive, neutral, or distracting
- **Window Switching (20%)**: Optimal rate is 2-5 switches per minute
- **Keystroke Activity (20%)**: Measures typing intensity
- **Idle Time (20%)**: Tracks focus vs. distraction time
- **Session Duration (10%)**: Considers session length for burnout detection

## App Categories

### Productive Apps
- Visual Studio Code, Terminal, Chrome, Safari, Slack, Notion, Obsidian

### Neutral Apps
- Finder, System Preferences, Activity Monitor

### Distracting Apps
- YouTube, Twitter, Instagram, Facebook, TikTok, Games

## Customization

You can modify the productivity categories and scoring weights in `src/productivity-analyzer.js`:

```javascript
this.productivityCategories = {
  'productive': ['Your App', 'Another App'],
  'neutral': ['System App'],
  'distracting': ['Social Media', 'Games']
};
```

## Privacy & Security

- All data is processed locally
- Only activity metadata is sent to OpenAI (no personal content)
- No data is stored or transmitted to third parties
- App runs with minimal system permissions

## Troubleshooting

### Permission Issues
If the app can't track activity:
1. Go to System Preferences > Security & Privacy > Privacy
2. Enable Screen Recording and Accessibility permissions for the app
3. Restart the app

### API Key Issues
If LLM analysis isn't working:
1. Verify your OpenAI API key is correct
2. Check your API usage limits
3. The app will fall back to rule-based analysis if LLM fails

### Performance
- The app is designed to be lightweight
- If you experience high CPU usage, try reducing the update frequency in `src/main.js`

## Development

### Project Structure
```
src/
├── main.js                 # Electron main process
├── activity-tracker.js     # System activity monitoring
├── productivity-analyzer.js # AI analysis and scoring
└── renderer/
    └── index.html          # UI and frontend logic
```

### Adding New Metrics
To track additional metrics:
1. Add tracking logic to `activity-tracker.js`
2. Update the scoring algorithm in `productivity-analyzer.js`
3. Display the metric in the UI (`src/renderer/index.html`)

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section above
- Open an issue on GitHub
- Review the console logs for error messages
