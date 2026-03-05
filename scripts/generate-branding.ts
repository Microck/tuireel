#!/usr/bin/env tsx
/**
 * generate-branding.ts
 *
 * Generates banner.png (1280x640) and og-image.png (1200x630) from the
 * project logo SVG. Uses Sharp (already a dependency of @tuireel/core).
 *
 * Usage:  npx tsx scripts/generate-branding.ts
 */

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRANDING_DIR = resolve(__dirname, "../assets/branding");

type Palette = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
};

const palette = JSON.parse(readFileSync(resolve(BRANDING_DIR, "palette.json"), "utf8")) as Palette;

// Brand colors (drift-resistant; sourced from assets/branding/palette.json)
const BG = palette.background;
const TITLE_COLOR = palette.primary;
const TAGLINE_COLOR = palette.secondary;

// Read the favicon SVG (icon-only, better for compositing)
const logoSvg = readFileSync(resolve(BRANDING_DIR, "favicon.svg"), "utf-8");

interface ImageSpec {
  name: string;
  width: number;
  height: number;
}

const specs: ImageSpec[] = [
  { name: "banner.png", width: 1280, height: 640 },
  { name: "og-image.png", width: 1200, height: 630 },
];

async function generateImage(spec: ImageSpec): Promise<void> {
  const { name, width, height } = spec;
  const iconSize = Math.round(height * 0.28);
  const titleSize = Math.round(height * 0.11);
  const taglineSize = Math.round(height * 0.045);

  // Rasterise the logo SVG at target size
  const iconPng = await sharp(Buffer.from(logoSvg)).resize(iconSize, iconSize).png().toBuffer();

  // Build text overlay as an SVG so we don't need system fonts
  const textSvg =
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    .title { font-family: system-ui, -apple-system, sans-serif; font-weight: 700; }
    .tagline { font-family: system-ui, -apple-system, sans-serif; font-weight: 400; }
  </style>
  <text x="${width / 2}" y="${height / 2 + iconSize / 2 + titleSize + 10}"
        text-anchor="middle" class="title"
        font-size="${titleSize}" fill="${TITLE_COLOR}" letter-spacing="-1">tuireel</text>
  <text x="${width / 2}" y="${height / 2 + iconSize / 2 + titleSize + taglineSize + 20}"
        text-anchor="middle" class="tagline"
        font-size="${taglineSize}" fill="${TAGLINE_COLOR}">Scripted TUI demo recorder</text>
</svg>`);

  const iconTop = Math.round(height / 2 - iconSize / 2 - titleSize * 0.6);
  const iconLeft = Math.round(width / 2 - iconSize / 2);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BG,
    },
  })
    .composite([
      { input: iconPng, top: iconTop, left: iconLeft },
      { input: textSvg, top: 0, left: 0 },
    ])
    .png()
    .toFile(resolve(BRANDING_DIR, name));

  console.log(`✓ ${name} (${width}×${height})`);
}

async function main() {
  console.log("Generating branding assets...\n");
  for (const spec of specs) {
    await generateImage(spec);
  }
  console.log(`\nDone — files written to ${BRANDING_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
