import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { GardenState } from '@core/index';
import { createInitialGardenState } from '@core/index';

const fileName = 'garden-state.json';
const storageDir = path.join(os.homedir(), '.garden-productivity-game');
const storagePath = path.join(storageDir, fileName);

export const ensureStorageDir = async () => {
  await fs.mkdir(storageDir, { recursive: true });
  return storageDir;
};

export const loadGardenState = async (): Promise<GardenState> => {
  try {
    const data = await fs.readFile(storagePath, 'utf-8');
    return JSON.parse(data) as GardenState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const initial = createInitialGardenState();
      await saveGardenState(initial);
      return initial;
    }
    throw error;
  }
};

export const saveGardenState = async (state: GardenState) => {
  await ensureStorageDir();
  await fs.writeFile(storagePath, JSON.stringify(state, null, 2), 'utf-8');
};
