import sharp from "sharp";

const DEFAULT_CURSOR_SIZE = 20;

function defaultCursorSvg(size: number): string {
  const center = size / 2;
  const radius = Math.max(2, center - 2);
  const shadowRadius = radius + 1;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="cursor-shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <circle cx="${center}" cy="${center}" r="${shadowRadius}" fill="none" filter="url(#cursor-shadow)"/>
  <circle cx="${center}" cy="${center}" r="${radius}" fill="#ffffff" stroke="#111111" stroke-width="1.4"/>
</svg>
`.trim();
}

export interface RenderCursorOptions {
  svg?: string;
  size?: number;
}

export async function renderCursor(
  options: RenderCursorOptions = {},
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const requestedSize = options.size ?? DEFAULT_CURSOR_SIZE;
  const size = Number.isFinite(requestedSize) && requestedSize > 0
    ? Math.round(requestedSize)
    : DEFAULT_CURSOR_SIZE;
  const svg = options.svg ?? defaultCursorSvg(size);

  const buffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

  return {
    buffer,
    width: size,
    height: size,
  };
}
