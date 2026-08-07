export type LayerMeta = {
  layerId: string;
  layerName: string;
};

export type CanvasDocument = {
  version?: string;
  objects: FabricObjectJson[];
  background?: string;
  backgroundImage?: unknown;
};

export type FabricObjectJson = {
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  opacity?: number;
  visible?: boolean;
  selectable?: boolean;
  evented?: boolean;
  scaleX?: number;
  scaleY?: number;
  data?: LayerMeta;
  filters?: unknown[];
  [key: string]: unknown;
};

export type MeteorProject = {
  format: "meteor-project";
  version: 1;
  app: "photo";
  name: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
  canvas: CanvasDocument;
};

export const DEFAULT_CANVAS_WIDTH = 1920;
export const DEFAULT_CANVAS_HEIGHT = 1080;

export function createEmptyCanvas(
  width = DEFAULT_CANVAS_WIDTH,
  height = DEFAULT_CANVAS_HEIGHT,
): CanvasDocument {
  const layerId = `layer-bg-${Date.now()}`;
  return {
    version: "6.5.0",
    background: "#ffffff",
    objects: [
      {
        type: "Rect",
        left: 0,
        top: 0,
        width,
        height,
        fill: "#ffffff",
        selectable: false,
        evented: false,
        data: { layerId, layerName: "背景" },
      },
    ],
  };
}

export function createProject(
  name: string,
  width = DEFAULT_CANVAS_WIDTH,
  height = DEFAULT_CANVAS_HEIGHT,
): MeteorProject {
  const now = new Date().toISOString();
  return {
    format: "meteor-project",
    version: 1,
    app: "photo",
    name,
    width,
    height,
    createdAt: now,
    updatedAt: now,
    canvas: createEmptyCanvas(width, height),
  };
}

export function extractLayers(canvas: CanvasDocument) {
  return [...canvas.objects]
    .map((obj, index) => ({
      id: obj.data?.layerId ?? `layer-${index}`,
      name: obj.data?.layerName ?? `レイヤー ${index + 1}`,
      type: obj.type ?? "Unknown",
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      opacity: typeof obj.opacity === "number" ? obj.opacity : 1,
    }))
    .reverse();
}

export function nextLayerId() {
  return `layer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
