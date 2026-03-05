import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const brandingLogoLight = path.join(repoRoot, "assets", "branding", "logo-light.svg");
const brandingLogoDark = path.join(repoRoot, "assets", "branding", "logo-dark.svg");
const brandingFavicon = path.join(repoRoot, "assets", "branding", "favicon.svg");

const docsLogoLight = path.join(repoRoot, "docs", "images", "logo-light.svg");
const docsLogoDark = path.join(repoRoot, "docs", "images", "logo-dark.svg");
const docsFavicon = path.join(repoRoot, "docs", "images", "favicon.svg");

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
    palette.secondary,
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
    assertEqual("docs/docs.json.logo.light", logo?.light, "/images/logo-light.svg");
    assertEqual("docs/docs.json.logo.dark", logo?.dark, "/images/logo-dark.svg");
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

assertFileByteEqual(docsLogoLight, brandingLogoLight);
assertFileByteEqual(docsLogoDark, brandingLogoDark);
assertFileByteEqual(docsFavicon, brandingFavicon);

try {
  const readme = readUtf8(readmePath);
  if (!readme.includes("assets/branding/logo-light.svg")) {
    fail("README.md must reference assets/branding/logo-light.svg");
  }
  if (!readme.includes("assets/branding/logo-dark.svg")) {
    fail("README.md must reference assets/branding/logo-dark.svg");
  }
} catch (err) {
  fail(`failed to read README.md (${String(err)})`);
}

if (errors.length > 0) {
  for (const message of errors) {
    // Keep output grep-friendly in CI.
    console.error(`ERROR: ${message}`);
  }
  process.exit(1);
}

console.log("Brand system verification passed.");
