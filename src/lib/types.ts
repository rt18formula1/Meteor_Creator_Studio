export type PlanTier = "free" | "pro";

export type AppStatus = "available" | "coming-soon" | "beta";

export type CreativeApp = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: "photo" | "vector" | "video" | "layout" | "audio";
  href: string;
  status: AppStatus;
  iconColor: string;
  accentColor: string;
};

export type ToolId =
  | "select"
  | "brush"
  | "eraser"
  | "text"
  | "rectangle"
  | "ellipse"
  | "eyedropper";
