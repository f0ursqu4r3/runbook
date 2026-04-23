type Level = "info" | "warn" | "error";
type LogMode = "text" | "silent";
type ProgressState = {
  label: string;
  total: number;
  current: number;
  detail?: string;
};

export type ProgressHandle = {
  advance: (detail?: string) => void;
  set: (current: number, detail?: string) => void;
  setTotal: (total: number, detail?: string) => void;
  finish: (detail?: string) => void;
  fail: (detail?: string) => void;
};

let logMode: LogMode = "text";
let progressEnabled = true;
let activeProgress: ProgressState | null = null;
let lastProgressWidth = 0;

export function setLogMode(mode: LogMode): void {
  logMode = mode;
}

export function setProgressEnabled(enabled: boolean): void {
  progressEnabled = enabled;
}

function canRenderProgress(): boolean {
  return logMode === "text" && progressEnabled && Boolean(process.stderr.isTTY);
}

function clearProgressLine(): void {
  if (!canRenderProgress() || lastProgressWidth === 0) {
    return;
  }
  process.stderr.write(`\r${" ".repeat(lastProgressWidth)}\r`);
  lastProgressWidth = 0;
}

function formatProgress(state: ProgressState): string {
  const width = 24;
  const safeTotal = Math.max(1, state.total);
  const clamped = Math.max(0, Math.min(state.current, safeTotal));
  const filled = Math.round((clamped / safeTotal) * width);
  const bar = `${"#".repeat(filled)}${"-".repeat(width - filled)}`;
  const suffix = state.detail ? ` ${state.detail}` : "";
  return `${state.label} [${bar}] ${clamped}/${safeTotal}${suffix}`;
}

function renderProgress(): void {
  if (!canRenderProgress() || activeProgress === null) {
    return;
  }
  const line = formatProgress(activeProgress);
  const width = Math.max(lastProgressWidth, line.length);
  lastProgressWidth = width;
  process.stderr.write(`\r${line.padEnd(width)}`);
}

function write(level: Level, message: string): void {
  if (logMode === "silent") {
    return;
  }
  clearProgressLine();
  const prefix = level.toUpperCase().padEnd(5, " ");
  const line = `[${prefix}] ${message}`;
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
  renderProgress();
}

export function startProgress(label: string, total: number, detail?: string): ProgressHandle {
  if (!canRenderProgress()) {
    return {
      advance: () => undefined,
      set: () => undefined,
      setTotal: () => undefined,
      finish: () => undefined,
      fail: () => undefined
    };
  }

  activeProgress = {
    label,
    total: Math.max(1, total),
    current: 0,
    detail
  };
  renderProgress();

  return {
    advance(nextDetail?: string): void {
      if (activeProgress === null) return;
      activeProgress.current = Math.min(activeProgress.total, activeProgress.current + 1);
      activeProgress.detail = nextDetail ?? activeProgress.detail;
      renderProgress();
    },
    set(current: number, nextDetail?: string): void {
      if (activeProgress === null) return;
      activeProgress.current = Math.max(0, Math.min(activeProgress.total, current));
      activeProgress.detail = nextDetail ?? activeProgress.detail;
      renderProgress();
    },
    setTotal(total: number, nextDetail?: string): void {
      if (activeProgress === null) return;
      activeProgress.total = Math.max(1, total);
      activeProgress.current = Math.min(activeProgress.current, activeProgress.total);
      activeProgress.detail = nextDetail ?? activeProgress.detail;
      renderProgress();
    },
    finish(nextDetail?: string): void {
      if (activeProgress === null) return;
      activeProgress.current = activeProgress.total;
      activeProgress.detail = nextDetail ?? activeProgress.detail;
      renderProgress();
      process.stderr.write("\n");
      activeProgress = null;
      lastProgressWidth = 0;
    },
    fail(nextDetail?: string): void {
      if (activeProgress === null) return;
      activeProgress.detail = nextDetail ?? activeProgress.detail;
      renderProgress();
      process.stderr.write("\n");
      activeProgress = null;
      lastProgressWidth = 0;
    }
  };
}

export const log = {
  info(message: string): void {
    write("info", message);
  },
  warn(message: string): void {
    write("warn", message);
  },
  error(message: string): void {
    write("error", message);
  }
};
