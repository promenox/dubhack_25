import { createInitialGardenState, GardenState, Plant, PlantType } from "./index";

export interface GardenStorage {
	load(): Promise<GardenState>;
	save(state: GardenState): Promise<void>;
}

export interface SeedDefinition {
	type: PlantType;
	displayName: string;
	description: string;
	growthDuration: number; // seconds
	harvestReward: number;
	seedCost: number;
	icon: string;
}

type LibraryPlantType = PlantType;

export const SEED_LIBRARY: Record<LibraryPlantType, SeedDefinition> = {
	seedling: {
		type: "seedling",
		displayName: "Morning Sprout",
		description: "Quick-growing beginner plant.",
		growthDuration: 60,
		harvestReward: 5,
		seedCost: 2,
		icon: "seedling.svg",
	},
	blossom: {
		type: "blossom",
		displayName: "Blooming Lilac",
		description: "Balanced growth and reward.",
		growthDuration: 300,
		harvestReward: 20,
		seedCost: 5,
		icon: "blossom.svg",
	},
	evergreen: {
		type: "evergreen",
		displayName: "Evergreen Sapling",
		description: "Slow grower with generous harvest.",
		growthDuration: 600,
		harvestReward: 50,
		seedCost: 10,
		icon: "evergreen.svg",
	},
	rose: {
		type: "rose",
		displayName: "Crimson Rose",
		description: "Short bloom with a bold harvest bonus.",
		growthDuration: 1200,
		harvestReward: 70,
		seedCost: 30,
		icon: "rose.svg",
	},
	lavender: {
		type: "lavender",
		displayName: "Moonlit Lavender",
		description: "A calming mid-length grower with steady returns.",
		growthDuration: 1800,
		harvestReward: 150,
		seedCost: 90,
		icon: "lavender.svg",
	},
	beanstalk: {
		type: "beanstalk",
		displayName: "Skyward Beanstalk",
		description: "Tall climber with a hearty harvest for patient gardeners.",
		growthDuration: 3600,
		harvestReward: 300,
		seedCost: 150,
		icon: "beanstalk.svg",
	},
	sixtyseven: {
		type: "sixtyseven",
		displayName: "Six Sevenium",
		description: "A curious numerical bloom that adds quirky prosperity.",
		growthDuration: 420,
		harvestReward: 67,
		seedCost: 42,
		icon: "sixtyseven.svg",
	},
};

type Listener = (state: GardenState) => void;

interface TickOptions {
	skipPersistence?: boolean;
}

const DEFAULT_UNLOCK_COST = 50;

const createId = () => `plant-${Math.random().toString(36).slice(2, 10)}`;

export class GardenGame {
	private state: GardenState;
	private listeners: Set<Listener> = new Set();
	private growthMultiplier = 1;
	private lock = Promise.resolve();

	private constructor(private readonly storage: GardenStorage, initialState: GardenState) {
		this.state = initialState;
	}

	static async create(storage: GardenStorage): Promise<GardenGame> {
		const stored = await storage.load().catch(() => createInitialGardenState());

		const initial = stored ?? createInitialGardenState();
		const game = new GardenGame(storage, initial);
		game.applyOfflineGrowth();
		await game.persistState();
		return game;
	}

	subscribe(listener: Listener) {
		this.listeners.add(listener);
		listener(this.cloneState());
		return () => {
			this.listeners.delete(listener);
		};
	}

	getGardenState(): GardenState {
		return this.cloneState();
	}

	getMultiplier() {
		return this.growthMultiplier;
	}

	async plantSeed(plotId: string, seedType: PlantType) {
		const definition = SEED_LIBRARY[seedType];
		if (!definition) {
			throw new Error(`Unknown seed type: ${seedType}`);
		}

		const plot = this.state.plots.find((item) => item.id === plotId);
		if (!plot) {
			throw new Error(`Plot not found: ${plotId}`);
		}

		if (plot.plant) {
			throw new Error("Plot already occupied");
		}

		const availableSeeds = this.state.inventory.seeds[seedType] ?? 0;
		if (availableSeeds <= 0) {
			throw new Error("No seeds available");
		}

		const newPlant: Plant = {
			id: createId(),
			type: seedType,
			plantedAt: Date.now(),
			growthDuration: definition.growthDuration,
			progress: 0,
		};

		plot.plant = newPlant;
		this.state.inventory.seeds[seedType] = availableSeeds - 1;

		await this.persistAndNotify();
	}

	async harvestCrop(plotId: string) {
		const plot = this.state.plots.find((item) => item.id === plotId);
		if (!plot || !plot.plant) {
			throw new Error("No plant to harvest");
		}

		if (plot.plant.progress < 1) {
			throw new Error("Plant is not ready to harvest");
		}

		const definition = SEED_LIBRARY[plot.plant.type];
		plot.plant = null;
		this.addCurrency(definition.harvestReward);

		await this.persistAndNotify();
	}

	addCurrency(amount: number) {
		this.state.inventory.currency = Math.max(0, this.state.inventory.currency + amount);
	}

	async unlockPlot(cost = DEFAULT_UNLOCK_COST) {
		if (this.state.inventory.currency < cost) {
			throw new Error("Not enough currency to unlock plot");
		}

		const nextIndex = this.state.plots.length + 1;
		this.state.inventory.currency -= cost;
		this.state.plots.push({
			id: `plot-${nextIndex}`,
			plant: null,
		});

		await this.persistAndNotify();
	}

	async buySeed(seedType: PlantType) {
		const definition = SEED_LIBRARY[seedType];
		if (this.state.inventory.currency < definition.seedCost) {
			throw new Error("Not enough currency for this seed");
		}

		this.state.inventory.currency -= definition.seedCost;
		this.state.inventory.seeds[seedType] = (this.state.inventory.seeds[seedType] ?? 0) + 1;

		await this.persistAndNotify();
	}

	setGrowthMultiplier(multiplier: number) {
		this.growthMultiplier = Math.max(0, multiplier);
	}

	async tick(deltaTimeSeconds: number, options: TickOptions = {}) {
		const delta = Math.max(0, deltaTimeSeconds);
		if (delta === 0) {
			return;
		}

		let hasGrowingPlants = false;
		this.state.plots.forEach((plot) => {
			if (!plot.plant) return;
			const plant = plot.plant;
			if (plant.progress >= 1) return;

			hasGrowingPlants = true;
			const effectiveDuration = Math.max(1, plant.growthDuration / this.growthMultiplier);
			const increment = delta / effectiveDuration;
			plant.progress = Math.min(1, plant.progress + increment);
		});

		// Debug log when plants are growing
		if (hasGrowingPlants && Math.random() < 0.1) {
			// Log 10% of the time to avoid spam
			console.log(`[Tick] Multiplier: ${this.growthMultiplier.toFixed(1)}x`);
		}

		this.state.lastUpdatedAt = Date.now();

		if (!options.skipPersistence) {
			await this.persistAndNotify();
		} else {
			this.notify();
		}
	}

	private applyOfflineGrowth() {
		const now = Date.now();
		const elapsedMs = Math.max(0, now - this.state.lastUpdatedAt);
		if (elapsedMs === 0) return;
		const elapsedSeconds = elapsedMs / 1000;
		this.tick(elapsedSeconds, { skipPersistence: true }).catch((error) => {
			console.error("Failed to apply offline growth", error);
		});
	}

	private async persistAndNotify() {
		await this.enqueue(async () => {
			await this.persistState();
			this.notify();
		});
	}

	private async persistState() {
		this.state.lastUpdatedAt = Date.now();
		await this.storage.save(this.state);
	}

	private notify() {
		const snapshot = this.cloneState();
		this.listeners.forEach((listener) => {
			listener(snapshot);
		});
	}

	private cloneState(): GardenState {
		return JSON.parse(JSON.stringify(this.state)) as GardenState;
	}

	private enqueue(task: () => Promise<void>) {
		this.lock = this.lock.then(task, task);
		return this.lock;
	}
}
