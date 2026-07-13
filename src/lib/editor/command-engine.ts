import {
  type CanvasDocument,
  type FabricObjectJson,
  extractLayers,
  nextLayerId,
} from "./document";

export type EditorCommand =
  | {
      type: "add_text";
      text: string;
      x: number;
      y: number;
      fontSize?: number;
      color?: string;
      layerName?: string;
    }
  | {
      type: "add_rectangle";
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      stroke?: string;
      layerName?: string;
    }
  | {
      type: "add_ellipse";
      x: number;
      y: number;
      radius: number;
      fill?: string;
      layerName?: string;
    }
  | { type: "remove_layer"; layerId: string }
  | { type: "set_layer_visibility"; layerId: string; visible: boolean }
  | { type: "set_layer_opacity"; layerId: string; opacity: number }
  | { type: "rename_layer"; layerId: string; name: string }
  | { type: "set_background"; color: string }
  | { type: "clear_layers" }
  | {
      type: "apply_filter";
      layerId: string;
      filter: "brightness" | "contrast" | "blur" | "grayscale" | "saturate";
      value?: number;
    }
  | { type: "list_layers" };

export type CommandResult = {
  command: EditorCommand["type"];
  success: boolean;
  message: string;
  layerId?: string;
};

export type ExecuteOptions = {
  maxLayers?: number;
};

function findObjectIndex(canvas: CanvasDocument, layerId: string) {
  return canvas.objects.findIndex((obj) => obj.data?.layerId === layerId);
}

function isBackgroundLayer(obj: FabricObjectJson) {
  return obj.data?.layerName === "背景" && obj.selectable === false;
}

export function executeCommands(
  inputCanvas: CanvasDocument,
  commands: EditorCommand[],
  options: ExecuteOptions = {},
): { canvas: CanvasDocument; results: CommandResult[]; layers: ReturnType<typeof extractLayers> } {
  const canvas: CanvasDocument = structuredClone(inputCanvas);
  const results: CommandResult[] = [];
  const maxLayers = options.maxLayers ?? Infinity;

  for (const command of commands) {
    if (command.type === "list_layers") {
      results.push({
        command: command.type,
        success: true,
        message: `${canvas.objects.length} layers`,
      });
      continue;
    }

    if (command.type === "set_background") {
      canvas.background = command.color;
      const bg = canvas.objects.find(isBackgroundLayer);
      if (bg) bg.fill = command.color;
      results.push({ command: command.type, success: true, message: "Background updated" });
      continue;
    }

    if (command.type === "clear_layers") {
      canvas.objects = canvas.objects.filter(isBackgroundLayer);
      results.push({ command: command.type, success: true, message: "Layers cleared" });
      continue;
    }

    if (command.type === "remove_layer") {
      const index = findObjectIndex(canvas, command.layerId);
      if (index === -1) {
        results.push({ command: command.type, success: false, message: "Layer not found" });
        continue;
      }
      if (isBackgroundLayer(canvas.objects[index])) {
        results.push({ command: command.type, success: false, message: "Cannot remove background" });
        continue;
      }
      canvas.objects.splice(index, 1);
      results.push({ command: command.type, success: true, message: "Layer removed", layerId: command.layerId });
      continue;
    }

    if (command.type === "set_layer_visibility") {
      const obj = canvas.objects.find((o) => o.data?.layerId === command.layerId);
      if (!obj) {
        results.push({ command: command.type, success: false, message: "Layer not found" });
        continue;
      }
      obj.visible = command.visible;
      results.push({ command: command.type, success: true, message: "Visibility updated", layerId: command.layerId });
      continue;
    }

    if (command.type === "set_layer_opacity") {
      const obj = canvas.objects.find((o) => o.data?.layerId === command.layerId);
      if (!obj) {
        results.push({ command: command.type, success: false, message: "Layer not found" });
        continue;
      }
      obj.opacity = Math.min(1, Math.max(0, command.opacity));
      results.push({ command: command.type, success: true, message: "Opacity updated", layerId: command.layerId });
      continue;
    }

    if (command.type === "rename_layer") {
      const obj = canvas.objects.find((o) => o.data?.layerId === command.layerId);
      if (!obj) {
        results.push({ command: command.type, success: false, message: "Layer not found" });
        continue;
      }
      obj.data = { ...(obj.data ?? { layerId: command.layerId }), layerName: command.name };
      results.push({ command: command.type, success: true, message: "Layer renamed", layerId: command.layerId });
      continue;
    }

    if (command.type === "apply_filter") {
      const obj = canvas.objects.find((o) => o.data?.layerId === command.layerId);
      if (!obj) {
        results.push({ command: command.type, success: false, message: "Layer not found" });
        continue;
      }
      const filterMap: Record<string, { type: string; [key: string]: unknown }> = {
        brightness: { type: "Brightness", brightness: command.value ?? 0.1 },
        contrast: { type: "Contrast", contrast: command.value ?? 0.1 },
        blur: { type: "Blur", blur: command.value ?? 0.2 },
        grayscale: { type: "Grayscale" },
        saturate: { type: "Saturation", saturation: command.value ?? 0.5 },
      };
      const filter = filterMap[command.filter];
      if (!filter) {
        results.push({ command: command.type, success: false, message: "Unknown filter" });
        continue;
      }
      obj.filters = [...(obj.filters ?? []), filter];
      results.push({ command: command.type, success: true, message: `Filter ${command.filter} applied`, layerId: command.layerId });
      continue;
    }

    // Add operations — check layer limit
    if (canvas.objects.length >= maxLayers) {
      results.push({
        command: command.type,
        success: false,
        message: `Layer limit reached (${maxLayers})`,
      });
      continue;
    }

    const layerId = nextLayerId();

    if (command.type === "add_text") {
      canvas.objects.push({
        type: "IText",
        left: command.x,
        top: command.y,
        text: command.text,
        fontSize: command.fontSize ?? 32,
        fill: command.color ?? "#000000",
        fontFamily: "Inter, sans-serif",
        data: { layerId, layerName: command.layerName ?? "テキスト" },
      });
      results.push({ command: command.type, success: true, message: "Text added", layerId });
      continue;
    }

    if (command.type === "add_rectangle") {
      canvas.objects.push({
        type: "Rect",
        left: command.x,
        top: command.y,
        width: command.width,
        height: command.height,
        fill: command.fill ?? "#3b82f6",
        stroke: command.stroke,
        strokeWidth: command.stroke ? 2 : 0,
        data: { layerId, layerName: command.layerName ?? "矩形" },
      });
      results.push({ command: command.type, success: true, message: "Rectangle added", layerId });
      continue;
    }

    if (command.type === "add_ellipse") {
      canvas.objects.push({
        type: "Circle",
        left: command.x - command.radius,
        top: command.y - command.radius,
        radius: command.radius,
        fill: command.fill ?? "#3b82f6",
        data: { layerId, layerName: command.layerName ?? "楕円" },
      });
      results.push({ command: command.type, success: true, message: "Ellipse added", layerId });
    }
  }

  return { canvas, results, layers: extractLayers(canvas) };
}
