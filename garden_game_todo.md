# ðŸª´ Garden Productivity Game â€” Development TODO

## ðŸ§­ 1. Project Setup

- [x] Initialize project (Electron or Tauri â€” pick one)
- [x] Set up TypeScript for type safety
- [x] Install UI library (React / Vue / Svelte) for frontend rendering
- [x] Set up project structure:
  - [x] `core/` â†’ game logic
  - [x] `ui/` â†’ garden customization + overlay
  - [x] `tracker/` â†’ productivity logic (later)
  - [x] `storage/` â†’ save/load

## ðŸŒ± 2. Core Garden Game Engine

- [x] Create `GardenGame` class to handle:
  - [x] Planting, growth, harvesting
  - [x] Currency system
  - [x] Growth multiplier control
  - [x] Timestamps for offline growth
- [x] Define data models:
  - [x] `Plant` (id, type, plantedAt, growthDuration, progress)
  - [x] `Plot` (id, plant or empty)
  - [x] `Inventory` (currency, seeds, decorations)
  - [x] `GardenState`
- [x] Implement:
  - [x] `plantSeed(plotId, seedType)`
  - [x] `harvestCrop(plotId)`
  - [x] `addCurrency(amount)`
  - [x] `setGrowthMultiplier(multiplier)`
  - [x] `tick(deltaTime)`
  - [x] `getGardenState() / save / load`
- [x] Add basic save/load to local storage or file

## ðŸ§  3. Garden Customization UI

- [x] Create main window UI with:
  - [x] Garden grid (plots)
  - [x] Seed shop menu
  - [x] Inventory display (currency, items)
  - [x] Planting and harvesting interactions
- [x] Implement drag & drop for placing plants/decor
- [x] Add plot expansion system (unlock new plots with currency)
- [x] Add decorations (trees, fences, paths — no function at first)
- [x] Add simple UI animations (plant sprouting, growth stages)

## ðŸŒ¿ 4. Growth Visualization

- [x] Design plant growth stages (e.g. seed → sprout → bloom)
- [x] Implement rendering logic based on plant `progress`
- [x] Add `tick` loop that updates visual growth every few seconds
- [x] Add smooth animations for growing / harvesting
- [ ] Handle overlay and garden UI sharing the same state

## ðŸ¾ 5. Overlay System (Desktop Pet Style)

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

## ðŸ§° 6. User Settings & Persistence

- [ ] Add user settings file (JSON or SQLite):
  - [ ] Overlay position
  - [ ] Overlay size
  - [ ] Selected plant/decoration styles
- [ ] Auto-save garden state on exit
- [ ] Auto-load on launch
- [ ] Add backup / reset option

## ðŸª™ 7. Productivity Hooks (Future Phase)

*(Optional at this stage â€” can be mocked during dev)*

- [ ] Stub `productivityTracker` module:
  - [ ] `getProductivityMultiplier()` mock
  - [ ] Simulate productive time increasing growth multiplier
- [ ] Expose API between tracker and `GardenGame`:
  - [ ] `garden.setGrowthMultiplier(value)`
- [ ] (Later) Replace with real tracking logic

## ðŸ§‘â€ðŸ¤â€ðŸ§‘ 8. Polish & UX

- [ ] Add simple tutorial / onboarding for planting
- [ ] Add satisfying harvest animation + sound
- [ ] Add simple background music toggle
- [ ] Add streak bonuses or daily login bonus
- [ ] Add simple garden themes (day/night, different soil colors)
- [ ] Add pause/disable overlay option

## ðŸ§ª 9. Testing & Packaging

- [ ] Write unit tests for `GardenGame` logic
- [ ] Test overlay on multiple OS (Windows/Mac/Linux if needed)
- [ ] Check CPU/RAM usage of background growth tick
- [ ] Build app package for Windows (and others if needed)
- [ ] Test auto-launch and persistence

## ðŸŒ 10. Stretch Goals (Future Features)

- [ ] Multi-player or friend gardens
- [ ] Rare seeds or events
- [ ] Weather effects or day/night cycle
- [ ] In-game achievements
- [ ] Mobile companion app
- [ ] AI assistant plant buddy ðŸŒ±ðŸ¤–



