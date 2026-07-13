import type { PlanTier } from "./types";

export type PlanLimits = {
  maxLayers: number;
  maxCanvasWidth: number;
  maxCanvasHeight: number;
  exportFormats: string[];
  watermarkOnExport: boolean;
  cloudStorageGb: number;
  aiFeatures: boolean;
  batchExport: boolean;
  advancedFilters: boolean;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxLayers: Infinity,
    maxCanvasWidth: 16384,
    maxCanvasHeight: 16384,
    exportFormats: ["png", "jpeg", "webp", "svg", "psd"],
    watermarkOnExport: false,
    cloudStorageGb: 100,
    aiFeatures: true,
    batchExport: true,
    advancedFilters: true,
  },
  pro: {
    maxLayers: Infinity,
    maxCanvasWidth: 16384,
    maxCanvasHeight: 16384,
    exportFormats: ["png", "jpeg", "webp", "svg", "psd"],
    watermarkOnExport: false,
    cloudStorageGb: 100,
    aiFeatures: true,
    batchExport: true,
    advancedFilters: true,
  },
};

export const PRICING = {
  free: { price: 0, label: "無料" },
  pro: { price: 1480, label: "¥1,480/月" },
} as const;

export function canAddLayer(tier: PlanTier, currentLayers: number): boolean {
  return currentLayers < PLAN_LIMITS[tier].maxLayers;
}

export function canUseCanvasSize(
  tier: PlanTier,
  width: number,
  height: number,
): boolean {
  const limits = PLAN_LIMITS[tier];
  return width <= limits.maxCanvasWidth && height <= limits.maxCanvasHeight;
}
