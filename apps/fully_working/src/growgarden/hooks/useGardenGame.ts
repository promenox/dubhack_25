import { useEffect, useRef, useState } from "react";
import {
  GardenGame,
  type GardenState,
  SEED_LIBRARY,
  type PlantType,
} from "../../core";
import { createLocalStorageAdapter } from "../../storage/localStorageAdapter";
import { getProductivityMultiplier, setProductivityMultiplier } from "../tracker";

type GameAction =
  | { type: "plant"; plotId: string; seedType: PlantType }
  | { type: "harvest"; plotId: string }
  | { type: "buySeed"; seedType: PlantType }
  | { type: "unlockPlot" }
  | { type: "setMultiplier"; value: number };

export interface GameError {
  message: string;
  type: GameAction["type"];
  plotId?: string;
}

export const useGardenGame = () => {
  const gameRef = useRef<GardenGame | null>(null);
  const [state, setState] = useState<GardenState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<GameError | null>(null);
  const [multiplier, setMultiplier] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const storage = createLocalStorageAdapter();
        const game = await GardenGame.create(storage);
        if (!isMounted) return;
        gameRef.current = game;
        game.subscribe((nextState) => {
          setState(nextState);
          try {
            window.gardenApi.emitGardenState(nextState);
          } catch (err) {
            console.error("Failed to broadcast garden state to overlay", err);
          }
        });
        setIsReady(true);
      } catch (err) {
        console.error("Failed to initialize GardenGame", err);
        if (isMounted) {
          setError({ message: "Unable to initialize garden", type: "plant" });
        }
      }
    };

    bootstrap().catch((err) => console.error(err));

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !gameRef.current) return;
    const interval = window.setInterval(() => {
      try {
        const trackerMult = getProductivityMultiplier();
        const currentMult = gameRef.current!.getMultiplier();
        if (trackerMult !== currentMult) {
          console.log(`[Game Loop] Updating multiplier from ${currentMult} to ${trackerMult}`);
          gameRef.current!.setGrowthMultiplier(trackerMult);
          setMultiplier(trackerMult);
        }
      } catch (err) {
        console.error("[Game Loop] Error reading tracker multiplier:", err);
      }

      gameRef.current
        ?.tick(1)
        .catch((err) => console.error("Tick failed", err));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isReady]);

  const dispatch = async (action: GameAction) => {
    if (!gameRef.current) return;
    setError(null);

    try {
      switch (action.type) {
        case "plant":
          await gameRef.current.plantSeed(action.plotId, action.seedType);
          break;
        case "harvest":
          await gameRef.current.harvestCrop(action.plotId);
          break;
        case "buySeed":
          await gameRef.current.buySeed(action.seedType);
          break;
        case "unlockPlot":
          await gameRef.current.unlockPlot();
          break;
        case "setMultiplier":
          gameRef.current.setGrowthMultiplier(action.value);
          setMultiplier(action.value);
          setProductivityMultiplier(action.value);
          console.log(`[Dispatch] Set multiplier to ${action.value} (synced to tracker)`);
          break;
        default:
          break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      const context: GameError = { message, type: action.type };
      if (action.type === "plant") {
        context.plotId = action.plotId;
      }
      setError(context);
    }
  };

  return {
    state,
    isReady,
    error,
    dispatch,
    seeds: SEED_LIBRARY,
    multiplier,
  };
};

