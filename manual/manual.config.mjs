const config = {
  productName: "Runbook",
  title: "Runbook Sample Manual",
  version: "0.1.0-dev",
  baseUrl: "http://localhost:3000",
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  timezone: "UTC",
  theme: {
    primary: "#0f172a",
    accent: "#d97706",
    muted: "#475569"
  },
  paths: {
    chaptersDir: "manual/chapters",
    flowsDir: "manual/flows",
    assetsDir: "manual/assets",
    templateFile: "manual/template/manual.typ",
    outputDir: "dist",
    typstSourceFile: "dist/manual.typ",
    screenshotsDir: "dist/screenshots",
    reportsDir: "dist/reports",
    captureReportFile: "dist/reports/capture-report.json",
    manifestFile: "dist/screenshots/manifest.json",
    outputFile: "dist/manual.pdf"
  }
};

export default config;
