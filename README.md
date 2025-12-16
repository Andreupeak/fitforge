# FitForge PWA - AI-Powered Fitness App

A feature-rich Progressive Web App for workout tracking, exercise guidance, and AI-powered fitness coaching.

## Features

- 🏋️ **Smart Workout Generator** - AI creates personalized routines based on your goals
- 📚 **Exercise Library** - 1,300+ exercises with animated GIF demonstrations
- 🤖 **AI Coach** - Chat with your personal fitness advisor (OpenAI powered)
- 📊 **Progress Tracking** - Streak calendar, weight charts, workout history
- 💤 **Recovery Hub** - Estimated recovery times and recommendations
- 🏆 **Gamification** - XP, levels, and achievements
- 📱 **PWA** - Install on your iPhone for offline access and auto-updates

## Quick Deploy to Render

### Option 1: Blueprint Deploy (Easiest)

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your GitHub repo
5. Render will auto-detect `render.yaml` and set up everything
6. Add your environment variables when prompted

### Option 2: Manual Deploy

1. Push to GitHub
2. Create a new **Web Service** on Render
3. Connect your repo
4. Configure:
   - **Build Command**: `npm install && npm run build && cd server && npm install`
   - **Start Command**: `cd server && npm start`
5. Add Environment Variables:
   - `RAPIDAPI_KEY` - Your RapidAPI key for ExerciseDB
   - `OPENAI_API_KEY` - Your OpenAI API key

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RAPIDAPI_KEY` | RapidAPI key for ExerciseDB API | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI Coach | Yes |
| `PORT` | Server port (default: 3000) | No |

## Getting Your API Keys

### RapidAPI (ExerciseDB)
1. Go to [RapidAPI ExerciseDB](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
2. Sign up / Log in
3. Subscribe to the API (free tier available)
4. Copy your `X-RapidAPI-Key` from the code snippets

### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

## Installing on iPhone

1. Open the deployed Render URL in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**
5. Open FitForge from your home screen!

## Auto-Updates

The PWA automatically checks for updates. When an update is available:
- A banner will appear at the top
- Tap the banner to refresh and get the latest version
- No need to reinstall from Safari!

## Project Structure

```
├── server/
│   ├── index.js          # Express backend with API routes
│   └── package.json
├── src/
│   ├── App.jsx           # Main React app
│   ├── main.jsx          # Entry point
│   ├── index.css         # Global styles
│   └── components/
│       ├── Navigation.jsx
│       ├── WorkoutGenerator.jsx
│       ├── ExerciseLibrary.jsx
│       ├── WorkoutPlayer.jsx
│       ├── ProgressDashboard.jsx
│       ├── AICoach.jsx
│       └── Profile.jsx
├── public/
│   └── icons/            # PWA icons
├── index.html
├── vite.config.js
├── render.yaml           # Render deployment config
└── package.json
```

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Express.js
- **PWA**: Vite PWA Plugin
- **APIs**: ExerciseDB (RapidAPI), OpenAI
- **Styling**: Vanilla CSS with CSS Variables
- **Hosting**: Render.com

## License

MIT
