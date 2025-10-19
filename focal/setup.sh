#!/bin/bash

echo "🚀 Setting up Focal Productivity Tracker..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check for OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OpenAI API key not found in environment variables"
    echo "   Please set your API key:"
    echo "   export OPENAI_API_KEY='your-api-key-here'"
    echo ""
    echo "   Or create a .env file with:"
    echo "   OPENAI_API_KEY=your-api-key-here"
    echo ""
    echo "   The app will work with rule-based analysis without LLM features."
fi

echo ""
echo "🎉 Setup complete! To start the app:"
echo "   npm start"
echo ""
echo "   For development mode:"
echo "   npm run dev"
echo ""
echo "📋 Don't forget to grant permissions when prompted:"
echo "   - Screen Recording"
echo "   - Accessibility"
echo "   - Automation"
