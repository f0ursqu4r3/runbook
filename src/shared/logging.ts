type Level = "info" | "warn" | "error";

function write(level: Level, message: string): void {
  const prefix = level.toUpperCase().padEnd(5, " ");
  const line = `[${prefix}] ${message}`;
  if (level === "error") {
    console.error(line);
    return;
  }
  console.log(line);
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
