import { z } from "zod";

export const RunbookConfigSchema = z.object({
  productName: z.string().min(1),
  title: z.string().min(1),
  version: z.string().min(1),
  baseUrl: z.string().url(),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive()
  }),
  locale: z.string().min(2),
  timezone: z.string().min(1),
  captureConcurrency: z.number().int().positive().optional(),
  theme: z.object({
    primary: z.string().min(1),
    accent: z.string().min(1),
    muted: z.string().min(1)
  }),
  paths: z.object({
    chaptersDir: z.string().min(1),
    flowsDir: z.string().min(1),
    assetsDir: z.string().min(1),
    templateFile: z.string().min(1),
    outputDir: z.string().min(1),
    typstSourceFile: z.string().min(1),
    screenshotsDir: z.string().min(1),
    reportsDir: z.string().min(1),
    captureReportFile: z.string().min(1),
    manifestFile: z.string().min(1),
    outputFile: z.string().min(1)
  })
});

export type ValidatedRunbookConfig = z.infer<typeof RunbookConfigSchema>;
