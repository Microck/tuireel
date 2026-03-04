import { dirname, isAbsolute, resolve } from "node:path";

import chokidar from "chokidar";

import { loadConfig, type OutputFormat, type TuireelConfig } from "./config/index.js";
import { record } from "./recorder.js";
import { debounce } from "./utils/debounce.js";
import { resolveOutputPath } from "./utils/output-path.js";

interface WatchAndRecordOptions {
  format?: OutputFormat;
}

type ResolvedSoundConfig = TuireelConfig["sound"];

function resolveSoundConfig(
  sound: ResolvedSoundConfig,
  resolvedConfigPath: string,
): ResolvedSoundConfig {
  if (!sound || !sound.track || sound.track.trim().length === 0) {
    return sound;
  }

  return {
    ...sound,
    track: isAbsolute(sound.track)
      ? sound.track
      : resolve(dirname(resolvedConfigPath), sound.track),
  } satisfies NonNullable<ResolvedSoundConfig>;
}

function resolveRecordConfig(
  config: TuireelConfig,
  configPath: string,
  options: WatchAndRecordOptions,
): TuireelConfig {
  const selectedFormat = options.format ?? config.format;

  return {
    ...config,
    format: selectedFormat,
    output: selectedFormat ? resolveOutputPath(config.output, selectedFormat) : config.output,
    sound: resolveSoundConfig(config.sound, configPath),
  } satisfies TuireelConfig;
}

async function runRecordCycle(configPath: string, options: WatchAndRecordOptions): Promise<void> {
  const configs = await loadConfig(configPath);

  for (const [index, config] of configs.entries()) {
    const resolvedConfig = resolveRecordConfig(config, configPath, options);

    if (configs.length > 1) {
      console.log(`[${index + 1}/${configs.length}] Recording: ${resolvedConfig.output}`);
    }

    await record(resolvedConfig);
    console.log(`Recording complete: ${resolvedConfig.output}`);
  }
}

export async function watchAndRecord(
  configPath: string,
  options: WatchAndRecordOptions = {},
): Promise<void> {
  const resolvedConfigPath = resolve(process.cwd(), configPath);
  let recording = false;

  const watcher = chokidar.watch(resolvedConfigPath, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
    },
  });

  let watcherClosed = false;
  const closeWatcher = async (): Promise<void> => {
    if (watcherClosed) {
      return;
    }

    watcherClosed = true;
    await watcher.close();
  };

  const rerun = debounce(async () => {
    if (recording) {
      console.log("Skipping - recording in progress");
      return;
    }

    recording = true;
    console.log("Config changed, re-recording...");

    try {
      await runRecordCycle(resolvedConfigPath, options);
      console.log("\u2713 Re-recorded successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Re-record failed: ${message}`);
    } finally {
      recording = false;
    }
  }, 500);

  watcher.on("change", () => {
    void rerun();
  });

  const watchLoop = new Promise<void>((resolveWatch, rejectWatch) => {
    const cleanupHandlers = (): void => {
      process.off("SIGINT", handleSigint);
      watcher.off("error", handleError);
    };

    const handleSigint = (): void => {
      cleanupHandlers();
      void closeWatcher().then(resolveWatch).catch(rejectWatch);
    };

    const handleError = (error: unknown): void => {
      const normalizedError = error instanceof Error ? error : new Error(String(error));

      cleanupHandlers();
      void closeWatcher()
        .then(() => {
          rejectWatch(normalizedError);
        })
        .catch(() => {
          rejectWatch(normalizedError);
        });
    };

    process.on("SIGINT", handleSigint);
    watcher.on("error", handleError);
  });

  try {
    recording = true;
    await runRecordCycle(resolvedConfigPath, options);
    recording = false;
    await watchLoop;
  } finally {
    await closeWatcher().catch(() => {
      // Best-effort watcher shutdown.
    });
  }
}
