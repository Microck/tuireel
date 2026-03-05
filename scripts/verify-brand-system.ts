import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

type Palette = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function readUtf8(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function readBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}

function readJson<T>(filePath: string): T {
  const raw = readUtf8(filePath);
  return JSON.parse(raw) as T;
}

function normalizeRelative(p: string): string {
  return p.split(path.sep).join("/");
}

const errors: string[] = [];
function fail(message: string) {
  errors.push(message);
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTruthy(label: string, value: unknown) {
  if (!value) {
    fail(`${label}: expected value to be set`);
  }
}

function assertFileByteEqual(leftPath: string, rightPath: string) {
  const leftRel = normalizeRelative(path.relative(repoRoot, leftPath));
  const rightRel = normalizeRelative(path.relative(repoRoot, rightPath));

  let left: Buffer;
  let right: Buffer;

  try {
    left = readBuffer(leftPath);
  } catch (err) {
    fail(`missing file: ${leftRel} (${String(err)})`);
    return;
  }

  try {
    right = readBuffer(rightPath);
  } catch (err) {
    fail(`missing file: ${rightRel} (${String(err)})`);
    return;
  }

  if (!left.equals(right)) {
    fail(`asset drift: ${leftRel} != ${rightRel} (files differ)`);
  }
}

const palettePath = path.join(repoRoot, "assets", "branding", "palette.json");
const docsJsonPath = path.join(repoRoot, "docs", "docs.json");
const readmePath = path.join(repoRoot, "README.md");

const brandingLogo = path.join(repoRoot, "assets", "branding", "logo.svg");
const brandingFavicon = path.join(repoRoot, "assets", "branding", "favicon.svg");
const brandingBanner = path.join(repoRoot, "assets", "branding", "banner.png");
const brandingOgImage = path.join(repoRoot, "assets", "branding", "og-image.png");

const docsLogo = path.join(repoRoot, "docs", "images", "logo.svg");
const docsFavicon = path.join(repoRoot, "docs", "images", "favicon.svg");

const deprecatedLogoVariants = ["dark", "light"] as const;
type DeprecatedLogoVariant = (typeof deprecatedLogoVariants)[number];

function logoVariantSvg(variant: DeprecatedLogoVariant): string {
  return `logo-${variant}.svg`;
}

let palette: Palette | null = null;
try {
  palette = readJson<Palette>(palettePath);
} catch (err) {
  fail(`failed to read palette json: assets/branding/palette.json (${String(err)})`);
}

if (palette) {
  const expectedKeys = ["background", "surface", "primary", "secondary", "accent"] as const;
  const actualKeys = Object.keys(palette).sort();
  const sortedExpected = [...expectedKeys].sort();

  assertEqual(
    "assets/branding/palette.json keys",
    JSON.stringify(actualKeys),
    JSON.stringify(sortedExpected),
  );

  assertEqual("palette.background", palette.background, "#141015");
  assertEqual("palette.surface", palette.surface, "#1C346D");
  assertEqual("palette.primary", palette.primary, "#18AAA7");
  assertEqual("palette.secondary", palette.secondary, "#F5ECD9");
  assertEqual("palette.accent", palette.accent, "#C1263B");
}

type DocsJson = {
  theme?: string;
  colors?: { primary?: string; light?: string; dark?: string };
  background?: { color?: { light?: string; dark?: string } };
  logo?: { light?: string; dark?: string } | string;
  favicon?: { light?: string; dark?: string } | string;
};

let docsJson: DocsJson | null = null;
try {
  docsJson = readJson<DocsJson>(docsJsonPath);
} catch (err) {
  fail(`failed to read docs json: docs/docs.json (${String(err)})`);
}

if (docsJson && palette) {
  assertTruthy("docs/docs.json.theme", docsJson.theme);
  assertTruthy("docs/docs.json.colors.primary", docsJson.colors?.primary);
  assertTruthy("docs/docs.json.colors.light", docsJson.colors?.light);
  assertTruthy("docs/docs.json.colors.dark", docsJson.colors?.dark);
  assertTruthy("docs/docs.json.background.color.light", docsJson.background?.color?.light);
  assertTruthy("docs/docs.json.background.color.dark", docsJson.background?.color?.dark);

  assertEqual("docs/docs.json.colors.primary", docsJson.colors?.primary, palette.primary);
  assertEqual("docs/docs.json.colors.light", docsJson.colors?.light, palette.primary);
  assertEqual("docs/docs.json.colors.dark", docsJson.colors?.dark, palette.accent);
  assertEqual(
    "docs/docs.json.background.color.light",
    docsJson.background?.color?.light,
    palette.background,
  );
  assertEqual(
    "docs/docs.json.background.color.dark",
    docsJson.background?.color?.dark,
    palette.background,
  );
}

if (docsJson) {
  const logo = docsJson.logo;
  if (typeof logo === "string") {
    fail(
      `docs/docs.json.logo: expected { light, dark } object, got string ${JSON.stringify(logo)}`,
    );
  } else {
    assertEqual("docs/docs.json.logo.light", logo?.light, "/images/logo.svg");
    assertEqual("docs/docs.json.logo.dark", logo?.dark, "/images/logo.svg");
  }

  const favicon = docsJson.favicon;
  if (typeof favicon === "string") {
    fail(
      `docs/docs.json.favicon: expected { light, dark } object, got string ${JSON.stringify(favicon)}`,
    );
  } else {
    assertEqual("docs/docs.json.favicon.light", favicon?.light, "/images/favicon.svg");
    assertEqual("docs/docs.json.favicon.dark", favicon?.dark, "/images/favicon.svg");
  }
}

assertFileByteEqual(docsLogo, brandingLogo);
assertFileByteEqual(docsFavicon, brandingFavicon);

if (!fs.existsSync(brandingLogo)) {
  fail("missing file: assets/branding/logo.svg");
}

try {
  const readme = readUtf8(readmePath);
  if (readme.includes("<picture>")) {
    fail("README.md must not contain a <picture> logo block");
  }
  for (const variant of deprecatedLogoVariants) {
    const ref = `assets/branding/${logoVariantSvg(variant)}`;
    if (readme.includes(ref)) {
      fail(`README.md must not reference ${ref}`);
    }
  }
  if (!readme.includes("assets/branding/logo.svg")) {
    fail("README.md must reference assets/branding/logo.svg");
  }
  if (!readme.includes("assets/branding/banner.png")) {
    fail("README.md must reference assets/branding/banner.png");
  }
} catch (err) {
  fail(`failed to read README.md (${String(err)})`);
}

for (const variant of deprecatedLogoVariants) {
  const brandingVariant = path.join(repoRoot, "assets", "branding", logoVariantSvg(variant));
  if (fs.existsSync(brandingVariant)) {
    fail(
      `deprecated file must not exist: ${normalizeRelative(path.relative(repoRoot, brandingVariant))}`,
    );
  }

  const docsVariant = path.join(repoRoot, "docs", "images", logoVariantSvg(variant));
  if (fs.existsSync(docsVariant)) {
    fail(
      `deprecated file must not exist: ${normalizeRelative(path.relative(repoRoot, docsVariant))}`,
    );
  }
}

async function verifyPngDimensions(filePath: string, expected: { width: number; height: number }) {
  const rel = normalizeRelative(path.relative(repoRoot, filePath));

  try {
    const metadata = await sharp(filePath).metadata();
    assertEqual(`${rel} width`, metadata.width, expected.width);
    assertEqual(`${rel} height`, metadata.height, expected.height);
  } catch (err) {
    fail(`failed to read PNG metadata: ${rel} (${String(err)})`);
  }
}

function verifyBrandingGeneratorSource() {
  try {
    const generatorPath = path.join(repoRoot, "scripts", "generate-branding.ts");
    const generator = readUtf8(generatorPath);
    if (!generator.includes("palette.json")) {
      fail("scripts/generate-branding.ts must read assets/branding/palette.json");
    }
    if (
      generator.includes("#0F172A") ||
      generator.includes("#06B6D4") ||
      generator.includes("#E2E8F0")
    ) {
      fail("scripts/generate-branding.ts must not hardcode the old palette");
    }
  } catch (err) {
    fail(`failed to read scripts/generate-branding.ts (${String(err)})`);
  }
}

async function main() {
  verifyBrandingGeneratorSource();
  await verifyPngDimensions(brandingBanner, { width: 1280, height: 640 });
  await verifyPngDimensions(brandingOgImage, { width: 1200, height: 630 });

  if (errors.length > 0) {
    for (const message of errors) {
      // Keep output grep-friendly in CI.
      console.error(`ERROR: ${message}`);
    }
    process.exit(1);
  }

  console.log("Brand system verification passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
