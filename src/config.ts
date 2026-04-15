import path from "node:path";
import { pathToFileURL } from "node:url";

import { RunbookConfigSchema } from "./config-schema.js";
import { ValidationError } from "./shared/errors.js";
import type { RunbookConfig } from "./shared/types.js";

const DEFAULT_CONFIG_PATH = "manual/manual.config.mjs";

export async function loadConfig(configPath = DEFAULT_CONFIG_PATH): Promise<RunbookConfig> {
  const absolutePath = path.resolve(configPath);
  const module = await import(pathToFileURL(absolutePath).href);
  const result = RunbookConfigSchema.safeParse(module.default);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("\n");
    throw new ValidationError(`Invalid config at ${absolutePath}:\n${issues}`);
  }

  return result.data as RunbookConfig;
}
