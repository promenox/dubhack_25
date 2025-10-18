# Garden Productivity Game

Electron-based desktop productivity companion with a cozy garden theme. Built with TypeScript and React to support a modular game engine, customizable UI, and future productivity hooks.

## Development

- `npm install` - install dependencies
- `npm run dev` - start Vite, compile the Electron main process, and launch the app with live reload

## Build

- `npm run build` - compile the main process and bundle the renderer for production
- `npm start` - run the packaged build locally (after `npm run build`)

## Project Structure

```
src/
  core/      # Game data models and logic
  main/      # Electron main process
  preload/   # Context bridge exposed to renderer
  storage/   # Persistence helpers
  tracker/   # Productivity multiplier stubs
  ui/        # React renderer (garden visualization + UI)
```

Legacy greetings from the team:

- Hello World from Michael!
- Hello from Smayan
- Hello from Benny
