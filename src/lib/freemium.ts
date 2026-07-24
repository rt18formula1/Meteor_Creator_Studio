import type { PlanTier } from "./types";
import type { CanvasDocument } from "./editor/document";

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

export const PLAN_DESIGN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxLayers: 5,
    maxCanvasWidth: 1920,
    maxCanvasHeight: 1080,
    exportFormats: ["png", "jpeg"],
    watermarkOnExport: true,
    cloudStorageGb: 2,
    aiFeatures: true,
    batchExport: false,
    advancedFilters: false,
  },
  pro: PLAN_LIMITS.pro,
};

export const DEVELOPMENT_UNLOCKED = true;

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

export function getCanvasDimensions(canvas: CanvasDocument): {
  width: number;
  height: number;
} {
  const backgroundLayer = canvas.objects.find(
    (obj) => obj.data?.layerName === "背景" && obj.selectable === false,
  );
  const width =
    typeof backgroundLayer?.width === "number"
      ? backgroundLayer.width * (typeof backgroundLayer.scaleX === "number" ? backgroundLayer.scaleX : 1)
      : 0;
  const height =
    typeof backgroundLayer?.height === "number"
      ? backgroundLayer.height * (typeof backgroundLayer.scaleY === "number" ? backgroundLayer.scaleY : 1)
      : 0;

  return { width, height };
}

export function getPlanLimitMeta(tier: PlanTier) {
  const limits = PLAN_LIMITS[tier];
  const designedLimits = PLAN_DESIGN_LIMITS[tier];

  return {
    tier,
    developmentUnlocked: DEVELOPMENT_UNLOCKED,
    maxLayers: limits.maxLayers === Infinity ? null : limits.maxLayers,
    maxCanvasWidth: limits.maxCanvasWidth,
    maxCanvasHeight: limits.maxCanvasHeight,
    exportFormats: limits.exportFormats,
    watermarkOnExport: limits.watermarkOnExport,
    cloudStorageGb: limits.cloudStorageGb,
    aiFeatures: limits.aiFeatures,
    batchExport: limits.batchExport,
    advancedFilters: limits.advancedFilters,
    designedLimits: {
      maxLayers: designedLimits.maxLayers === Infinity ? null : designedLimits.maxLayers,
      maxCanvasWidth: designedLimits.maxCanvasWidth,
      maxCanvasHeight: designedLimits.maxCanvasHeight,
      exportFormats: designedLimits.exportFormats,
      watermarkOnExport: designedLimits.watermarkOnExport,
      cloudStorageGb: designedLimits.cloudStorageGb,
      aiFeatures: designedLimits.aiFeatures,
      batchExport: designedLimits.batchExport,
      advancedFilters: designedLimits.advancedFilters,
    },
  };
}
