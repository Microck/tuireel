import sharp from "sharp";

import {
  DEFAULT_HUD_CONFIG,
  type HudConfig,
  type OverlayImage,
} from "./types.js";

export interface RenderHudOptions {
  labels: string[];
  opacity: number;
  frameWidth: number;
  frameHeight: number;
  config?: HudConfig;
}

type HudItem =
  | { kind: "badge"; label: string; width: number }
  | { kind: "plus"; width: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function asPositiveNumber(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    return fallback;
  }

  return value;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function renderTransparentPixel(): Promise<Buffer> {
  return sharp({
    create: {
      width: 1,
      height: 1,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
}

export async function renderHud(options: RenderHudOptions): Promise<OverlayImage> {
  const labels = options.labels.map((label) => label.trim()).filter(Boolean);
  if (labels.length === 0) {
    return {
      buffer: await renderTransparentPixel(),
      x: 0,
      y: 0,
    };
  }

  const config: Required<HudConfig> = {
    ...DEFAULT_HUD_CONFIG,
    ...options.config,
  };

  const opacity = clamp(Number.isFinite(options.opacity) ? options.opacity : 0, 0, 1);
  const fontSize = Math.round(asPositiveNumber(config.fontSize, DEFAULT_HUD_CONFIG.fontSize));
  const borderRadius = Math.round(asPositiveNumber(config.borderRadius, DEFAULT_HUD_CONFIG.borderRadius));
  const edgePadding = Math.round(asPositiveNumber(config.padding, DEFAULT_HUD_CONFIG.padding));

  const badgeHeight = Math.round(fontSize * 2.2);
  const itemGap = Math.max(6, Math.round(fontSize * 0.45));
  const plusWidth = Math.max(8, Math.round(fontSize * 0.9));
  const innerPadX = Math.max(6, Math.round(fontSize * 0.7));
  const innerPadY = Math.max(4, Math.round(fontSize * 0.45));

  const items: HudItem[] = [];
  labels.forEach((label, index) => {
    const badgeWidth = Math.round(
      Math.max(fontSize * 2, label.length * fontSize * 0.7),
    );
    items.push({ kind: "badge", label, width: badgeWidth });
    if (index < labels.length - 1) {
      items.push({ kind: "plus", width: plusWidth });
    }
  });

  const contentWidth = items.reduce((sum, item) => sum + item.width, 0) + itemGap * (items.length - 1);
  const width = Math.max(1, Math.ceil(contentWidth + innerPadX * 2));
  const height = Math.max(1, Math.ceil(badgeHeight + innerPadY * 2));

  const badgeY = innerPadY;
  const textY = badgeY + badgeHeight / 2;
  const fontFamily = escapeXml(config.fontFamily);
  const textColor = escapeXml(config.color);
  const badgeBackground = escapeXml(config.background);

  const parts: string[] = [
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`,
    `<g opacity="${opacity.toFixed(3)}">`,
  ];

  let cursorX = innerPadX;
  for (const item of items) {
    if (item.kind === "badge") {
      const centerX = cursorX + item.width / 2;
      const radius = Math.min(borderRadius, badgeHeight / 2);
      parts.push(
        `<rect x="${cursorX}" y="${badgeY}" width="${item.width}" height="${badgeHeight}" rx="${radius}" ry="${radius}" fill="${badgeBackground}"/>`,
      );
      parts.push(
        `<text x="${centerX}" y="${textY}" fill="${textColor}" font-size="${fontSize}" font-family="${fontFamily}" text-anchor="middle" dominant-baseline="middle">${escapeXml(item.label)}</text>`,
      );
    } else {
      const centerX = cursorX + item.width / 2;
      parts.push(
        `<text x="${centerX}" y="${textY}" fill="${textColor}" font-size="${fontSize}" font-family="${fontFamily}" text-anchor="middle" dominant-baseline="middle">+</text>`,
      );
    }

    cursorX += item.width + itemGap;
  }

  parts.push("</g>");
  parts.push("</svg>");

  const buffer = await sharp(Buffer.from(parts.join(""))).png().toBuffer();

  const safeFrameWidth = Math.max(1, Math.round(asPositiveNumber(options.frameWidth, width)));
  const safeFrameHeight = Math.max(1, Math.round(asPositiveNumber(options.frameHeight, height)));
  const x = clamp(Math.round((safeFrameWidth - width) / 2), 0, Math.max(0, safeFrameWidth - width));
  const y = config.position === "top"
    ? edgePadding
    : safeFrameHeight - height - edgePadding;

  return {
    buffer,
    x,
    y: clamp(Math.round(y), 0, Math.max(0, safeFrameHeight - height)),
  };
}
