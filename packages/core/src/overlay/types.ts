export interface OverlayImage {
  buffer: Buffer;
  x: number;
  y: number;
}

export interface CursorConfig {
  svg?: string;
  size?: number;
  visible?: boolean;
}

export interface HudConfig {
  background?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  borderRadius?: number;
  position?: "top" | "bottom";
  padding?: number;
}

export const DEFAULT_HUD_CONFIG: Required<HudConfig> = {
  background: "rgba(0,0,0,0.75)",
  color: "#fff",
  fontSize: 14,
  fontFamily: "monospace",
  borderRadius: 6,
  position: "bottom",
  padding: 16,
};

export const DEFAULT_CURSOR_CONFIG: Required<Omit<CursorConfig, "svg">> = {
  size: 20,
  visible: true,
};
