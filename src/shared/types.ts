import type { Page } from "playwright";

export type RunbookConfig = {
  productName: string;
  title: string;
  version: string;
  baseUrl: string;
  viewport: { width: number; height: number };
  locale: string;
  timezone: string;
  theme: {
    primary: string;
    accent: string;
    muted: string;
  };
  paths: {
    chaptersDir: string;
    flowsDir: string;
    assetsDir: string;
    templateFile: string;
    outputDir: string;
    typstSourceFile: string;
    screenshotsDir: string;
    reportsDir: string;
    captureReportFile: string;
    manifestFile: string;
    outputFile: string;
  };
};

export type Chapter = {
  path: string;
  title: string;
  body: string;
  screenshotRefs: ScreenshotReference[];
};

export type ScreenshotReference = {
  id: string;
  caption?: string;
};

export type Annotation = {
  type: "arrow" | "box" | "step" | "label" | "redact";
  target: string;
  label?: string;
  text?: string;
  color?: string;
  side?: "top" | "right" | "bottom" | "left";
  number?: number;
};

export type ShotOptions = {
  fullPage?: boolean;
};

export type FlowContext = {
  page: Page;
  annotate: (annotations: Annotation[]) => Promise<void>;
  clearAnnotations: () => Promise<void>;
  shot: (id: string, options?: ShotOptions) => Promise<void>;
  step: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
};

export type FlowFile = {
  path: string;
  id: string;
  screenshots: string[];
  run: (ctx: FlowContext) => Promise<void>;
};

export type CaptureManifestEntry = {
  id: string;
  flowId: string;
  path: string;
  step?: string;
  caption?: string;
};

export type CaptureManifest = {
  generatedAt: string;
  entries: CaptureManifestEntry[];
};

export type BuildSummary = {
  chapters: number;
  flows: number;
  screenshots: number;
  outputFile: string;
};
