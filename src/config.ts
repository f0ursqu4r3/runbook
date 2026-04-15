import path from "node:path";
import { pathToFileURL } from "node:url";

import type { RunbookConfig } from "./shared/types.js";

const DEFAULT_CONFIG_PATH = "manual/manual.config.mjs";

export async function loadConfig(configPath = DEFAULT_CONFIG_PATH): Promise<RunbookConfig> {
  const absolutePath = path.resolve(configPath);
  const module = await import(pathToFileURL(absolutePath).href);
  return module.default as RunbookConfig;
}
