export enum LogLevel {
  silent = 0,
  normal = 1,
  verbose = 2,
  debug = 3,
}

export class Logger {
  private readonly level: LogLevel;
  private stepCount = 0;
  private totalSteps = 0;

  constructor(level: LogLevel = LogLevel.silent) {
    this.level = level;
  }

  setTotalSteps(total: number): void {
    this.totalSteps = total;
    this.stepCount = 0;
  }

  info(msg: string): void {
    if (this.level >= LogLevel.normal) {
      process.stderr.write(`${msg}\n`);
    }
  }

  verbose(msg: string): void {
    if (this.level >= LogLevel.verbose) {
      process.stderr.write(`${msg}\n`);
    }
  }

  debug(msg: string): void {
    if (this.level >= LogLevel.debug) {
      process.stderr.write(`${msg}\n`);
    }
  }

  step(name: string, detail?: string): void {
    if (this.level < LogLevel.verbose) {
      return;
    }

    this.stepCount++;
    const counter = this.totalSteps > 0
      ? `[step ${this.stepCount}/${this.totalSteps}]`
      : `[step ${this.stepCount}]`;
    const suffix = detail ? `: ${detail}` : "";
    process.stderr.write(`${counter} ${name}${suffix}\n`);
  }

  timing(label: string, ms: number): void {
    if (this.level >= LogLevel.debug) {
      process.stderr.write(`${label}: ${Math.round(ms)}ms\n`);
    }
  }

  stat(label: string, value: string | number): void {
    if (this.level >= LogLevel.verbose) {
      process.stderr.write(`${label}: ${value}\n`);
    }
  }
}

export function createLogger(level: LogLevel = LogLevel.silent): Logger {
  return new Logger(level);
}
