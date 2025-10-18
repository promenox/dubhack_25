# 🪴 Garden Productivity Game — Development TODO

## 🧭 1. Project Setup
- [ ] Initialize project (Electron or Tauri — pick one)
- [ ] Set up TypeScript for type safety
- [ ] Install UI library (React / Vue / Svelte) for frontend rendering
- [ ] Set up project structure:
  - `core/` → game logic
  - `ui/` → garden customization + overlay
  - `tracker/` → productivity logic (later)
  - `storage/` → save/load

## 🌱 2. Core Garden Game Engine
- [ ] Create `GardenGame` class to handle:
  - [ ] Planting, growth, harvesting
  - [ ] Currency system
  - [ ] Growth multiplier control
  - [ ] Timestamps for offline growth
- [ ] Define data models:
  - [ ] `Plant` (id, type, plantedAt, growthDuration, progress)
  - [ ] `Plot` (id, plant or empty)
  - [ ] `Inventory` (currency, seeds, decorations)
  - [ ] `GardenState`
- [ ] Implement:
  - [ ] `plantSeed(plotId, seedType)`
  - [ ] `harvestCrop(plotId)`
  - [ ] `addCurrency(amount)`
  - [ ] `setGrowthMultiplier(multiplier)`
  - [ ] `tick(deltaTime)`
  - [ ] `getGardenState() / save / load`
- [ ] Add basic save/load to local storage or file

## 🧠 3. Garden Customization UI
- [ ] Create main window UI with:
  - [ ] Garden grid (plots)
  - [ ] Seed shop menu
  - [ ] Inventory display (currency, items)
  - [ ] Planting and harvesting interactions
- [ ] Implement drag & drop for placing plants/decor
- [ ] Add plot expansion system (unlock new plots with currency)
- [ ] Add decorations (trees, fences, paths — no function at first)
- [ ] Add simple UI animations (plant sprouting, growth stages)

## 🌿 4. Growth Visualization
- [ ] Design plant growth stages (e.g. seed → sprout → bloom)
- [ ] Implement rendering logic based on plant `progress`
- [ ] Add `tick` loop that updates visual growth every few seconds
- [ ] Add smooth animations for growing / harvesting
- [ ] Handle overlay and garden UI sharing the same state

## 🐾 5. Overlay System (Desktop Pet Style)
- [ ] Create lightweight overlay window:
  - [ ] Transparent background
  - [ ] Always-on-top option
  - [ ] Movable and resizable by user
- [ ] Add positioning presets:
  - [ ] Top left
  - [ ] Bottom right
  - [ ] Manual drag
- [ ] Render simplified visualization of garden (or single plant/mascot)
- [ ] Sync with core game state to reflect live growth
- [ ] Implement show/hide hotkey

## 🧰 6. User Settings & Persistence
- [ ] Add user settings file (JSON or SQLite):
  - [ ] Overlay position
  - [ ] Overlay size
  - [ ] Selected plant/decoration styles
- [ ] Auto-save garden state on exit
- [ ] Auto-load on launch
- [ ] Add backup / reset option

## 🪙 7. Productivity Hooks (Future Phase)
*(Optional at this stage — can be mocked during dev)*

- [ ] Stub `productivityTracker` module:
  - [ ] `getProductivityMultiplier()` mock
  - [ ] Simulate productive time increasing growth multiplier
- [ ] Expose API between tracker and `GardenGame`:
  - [ ] `garden.setGrowthMultiplier(value)`
- [ ] (Later) Replace with real tracking logic

## 🧑‍🤝‍🧑 8. Polish & UX
- [ ] Add simple tutorial / onboarding for planting
- [ ] Add satisfying harvest animation + sound
- [ ] Add simple background music toggle
- [ ] Add streak bonuses or daily login bonus
- [ ] Add simple garden themes (day/night, different soil colors)
- [ ] Add pause/disable overlay option

## 🧪 9. Testing & Packaging
- [ ] Write unit tests for `GardenGame` logic
- [ ] Test overlay on multiple OS (Windows/Mac/Linux if needed)
- [ ] Check CPU/RAM usage of background growth tick
- [ ] Build app package for Windows (and others if needed)
- [ ] Test auto-launch and persistence

## 🌍 10. Stretch Goals (Future Features)
- [ ] Multi-player or friend gardens
- [ ] Rare seeds or events
- [ ] Weather effects or day/night cycle
- [ ] In-game achievements
- [ ] Mobile companion app
- [ ] AI assistant plant buddy 🌱🤖
