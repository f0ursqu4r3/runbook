import path from "node:path";
import { pathToFileURL } from "node:url";

import { RunbookConfigSchema } from "./config-schema.js";
import { ValidationError } from "./shared/errors.js";
import type { RunbookConfig } from "./shared/types.js";

const DEFAULT_CONFIG_PATH = "manual/manual.config.mjs";

function expandPathTemplates(config: RunbookConfig): RunbookConfig {
  const expand = (value: string): string => value.replaceAll("{version}", config.version);

  return {
    ...config,
    paths: {
      ...config.paths,
      chaptersDir: expand(config.paths.chaptersDir),
      flowsDir: expand(config.paths.flowsDir),
      assetsDir: expand(config.paths.assetsDir),
      logoFile: config.paths.logoFile ? expand(config.paths.logoFile) : undefined,
      templateFile: expand(config.paths.templateFile),
      outputDir: expand(config.paths.outputDir),
      typstSourceFile: expand(config.paths.typstSourceFile),
      screenshotsDir: expand(config.paths.screenshotsDir),
      reportsDir: expand(config.paths.reportsDir),
      captureReportFile: expand(config.paths.captureReportFile),
      manifestFile: expand(config.paths.manifestFile),
      outputFile: expand(config.paths.outputFile)
    }
  };
}

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

  return expandPathTemplates(result.data as RunbookConfig);
}
