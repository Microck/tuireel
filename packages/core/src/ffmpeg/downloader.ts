import { execFile } from "node:child_process";
import { constants } from "node:fs";
import {
  access,
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  open,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const LOCK_WAIT_INTERVAL_MS = 250;
const LOCK_TIMEOUT_MS = 60_000;

const FFMPEG_CACHE_DIR = join(homedir(), ".tuireel", "bin");
const FFMPEG_BINARY_NAME = "ffmpeg";
const FFMPEG_LOCK_FILE = ".ffmpeg.lock";

export interface FfmpegPlatform {
  os: "darwin" | "linux";
  arch: "arm64" | "x64";
}

export function getFfmpegPath(): string {
  return join(FFMPEG_CACHE_DIR, FFMPEG_BINARY_NAME);
}

export function detectPlatform(): FfmpegPlatform {
  if (process.platform !== "darwin" && process.platform !== "linux") {
    throw new Error(`Unsupported platform: ${process.platform}. Try: tuireel supports macOS and Linux only. On Windows, use WSL.`);
  }

  if (process.arch !== "arm64" && process.arch !== "x64") {
    throw new Error(`Unsupported architecture: ${process.arch}. Try: tuireel supports x64 and arm64 only.`);
  }

  return {
    os: process.platform,
    arch: process.arch,
  };
}

export function getDownloadUrl(platform: FfmpegPlatform): string {
  if (platform.os === "darwin") {
    return "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip";
  }

  const archSegment = platform.arch === "x64" ? "linux64" : "linuxarm64";
  return `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-${archSegment}-gpl.tar.xz`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function isExecutable(path: string): Promise<boolean> {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function acquireLock(
  lockPath: string,
  ffmpegPath: string,
): Promise<() => Promise<void>> {
  const start = Date.now();

  while (true) {
    if (await isExecutable(ffmpegPath)) {
      return async () => {};
    }

    try {
      const handle = await open(lockPath, "wx");

      return async () => {
        await handle.close();
        await rm(lockPath, { force: true });
      };
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;
      if (errno.code !== "EEXIST") {
        throw error;
      }

      if (Date.now() - start > LOCK_TIMEOUT_MS) {
        throw new Error(`Timed out waiting for ffmpeg download lock: ${lockPath}. Try: delete the lock file manually and retry, or install ffmpeg via your system package manager.`);
      }

      await sleep(LOCK_WAIT_INTERVAL_MS);
    }
  }
}

async function downloadArchive(url: string, destinationPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ffmpeg archive from ${url} (HTTP ${response.status}). Try: check your internet connection, or install ffmpeg manually and add it to PATH.`);
  }

  const archiveBuffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destinationPath, archiveBuffer);
}

async function extractArchive(archivePath: string, outputDirectory: string): Promise<void> {
  if (archivePath.endsWith(".zip")) {
    await execFileAsync("unzip", ["-o", archivePath, "-d", outputDirectory]);
    return;
  }

  await execFileAsync("tar", ["-xJf", archivePath, "-C", outputDirectory]);
}

async function findFfmpegBinary(directory: string): Promise<string | null> {
  const directCandidate = join(directory, FFMPEG_BINARY_NAME);
  if (await pathExists(directCandidate)) {
    return directCandidate;
  }

  const binCandidate = join(directory, "bin", FFMPEG_BINARY_NAME);
  if (await pathExists(binCandidate)) {
    return binCandidate;
  }

  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const nestedResult = await findFfmpegBinary(join(directory, entry.name));
    if (nestedResult) {
      return nestedResult;
    }
  }

  return null;
}

async function verifyBinary(binaryPath: string): Promise<void> {
  await execFileAsync(binaryPath, ["-version"]);
}

export async function ensureFfmpeg(): Promise<string> {
  const ffmpegPath = getFfmpegPath();
  if (await isExecutable(ffmpegPath)) {
    return ffmpegPath;
  }

  await mkdir(FFMPEG_CACHE_DIR, { recursive: true });
  const lockPath = join(FFMPEG_CACHE_DIR, FFMPEG_LOCK_FILE);
  const releaseLock = await acquireLock(lockPath, ffmpegPath);

  try {
    if (await isExecutable(ffmpegPath)) {
      return ffmpegPath;
    }

    const platform = detectPlatform();
    const downloadUrl = getDownloadUrl(platform);
    const archiveExtension = downloadUrl.endsWith(".zip") ? "zip" : "tar.xz";
    const tempDirectory = await mkdtemp(join(tmpdir(), "tuireel-ffmpeg-"));
    const archivePath = join(tempDirectory, `ffmpeg.${archiveExtension}`);

    try {
      console.error("[tuireel] downloading ffmpeg...");
      await downloadArchive(downloadUrl, archivePath);

      console.error("[tuireel] extracting ffmpeg...");
      await extractArchive(archivePath, tempDirectory);

      const extractedBinary = await findFfmpegBinary(tempDirectory);
      if (!extractedBinary) {
        throw new Error("Downloaded ffmpeg archive did not contain a binary. Try: install ffmpeg manually via your system package manager (e.g., 'brew install ffmpeg' or 'apt install ffmpeg').");
      }

      await copyFile(extractedBinary, ffmpegPath);
      await chmod(ffmpegPath, 0o755);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }

    await verifyBinary(ffmpegPath);
    console.error("[tuireel] ffmpeg ready.");

    return ffmpegPath;
  } finally {
    await releaseLock();
  }
}
