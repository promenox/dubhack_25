export interface ProductivitySnapshot {
  timestamp: number;
  multiplier: number;
}

let latestMultiplier = 1;

export const getProductivityMultiplier = () => latestMultiplier;

export const setProductivityMultiplier = (multiplier: number) => {
  latestMultiplier = multiplier;
};
