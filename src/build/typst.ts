import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import type { BuildSummary, CaptureManifest, Chapter, RunbookConfig } from "../shared/types.js";
import { RunbookError } from "../shared/errors.js";
import { readText, writeText } from "../shared/fs.js";
import { matchScreenshot, createScreenshotPattern } from "../shared/screenshot-pattern.js";

const execFileAsync = promisify(execFile);

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "screenshot"; id: string; caption?: string; widthPercent?: number };

type RenderUnit =
  | { type: "plain"; blocks: MarkdownBlock[] }
  | {
      type: "sticky-lead";
      lead: MarkdownBlock[];
      screenshot: Extract<MarkdownBlock, { type: "screenshot" }>;
    };

function escapeTypstText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/#/g, "\\#")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/"/g, '\\"');
}

function parseMarkdown(body: string): MarkdownBlock[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const screenshotMatch = matchScreenshot(line);
    if (screenshotMatch) {
      blocks.push({
        type: "screenshot",
        id: screenshotMatch.id,
        caption: screenshotMatch.caption,
        widthPercent: screenshotMatch.widthPercent
      });
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim()
      });
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (!candidate || candidate.startsWith("- ") || candidate.startsWith("#")) {
        break;
      }
      if (createScreenshotPattern("i").test(candidate)) {
        break;
      }
      paragraph.push(candidate);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function renderBlock(
  block: MarkdownBlock,
  manifest: CaptureManifest,
  typstSourcePath: string
): string {
  switch (block.type) {
    case "heading":
      return `${"=".repeat(block.level)} ${escapeTypstText(block.text)}`;
    case "paragraph":
      return escapeTypstText(block.text);
    case "list":
      return block.items.map((item) => `- ${escapeTypstText(item)}`).join("\n");
    case "screenshot": {
      const entry = manifest.entries.find((candidate) => candidate.id === block.id);
      if (!entry) {
        throw new RunbookError(`Unable to resolve screenshot "${block.id}" during Typst render`);
      }
      const relativePath = path
        .relative(path.dirname(typstSourcePath), entry.path)
        .split(path.sep)
        .join("/");
      const caption = block.caption ? `[${escapeTypstText(block.caption)}]` : "none";
      const width = block.widthPercent ? `${block.widthPercent}%` : "100%";
      return `#runbook_figure("${relativePath}", caption: ${caption}, width: ${width})`;
    }
  }
}

function renderBlocks(
  blocks: MarkdownBlock[],
  manifest: CaptureManifest,
  typstSourcePath: string
): string {
  return blocks
    .map((block) => renderBlock(block, manifest, typstSourcePath))
    .join("\n\n");
}

function createRenderUnits(blocks: MarkdownBlock[]): RenderUnit[] {
  const units: RenderUnit[] = [];
  let index = 0;

  while (index < blocks.length) {
    const current = blocks[index];

    if (current.type === "heading") {
      const lead: MarkdownBlock[] = [current];
      let cursor = index + 1;

      while (cursor < blocks.length) {
        const candidate = blocks[cursor];
        if (candidate.type !== "paragraph" && candidate.type !== "list") {
          break;
        }
        lead.push(candidate);
        cursor += 1;
      }

      const next = blocks[cursor];
      if (next?.type === "screenshot") {
        units.push({
          type: "sticky-lead",
          lead,
          screenshot: next
        });
        index = cursor + 1;
        continue;
      }
    }

    if (
      (current.type === "paragraph" || current.type === "list") &&
      blocks[index + 1]?.type === "screenshot"
    ) {
      units.push({
        type: "sticky-lead",
        lead: [current],
        screenshot: blocks[index + 1] as Extract<MarkdownBlock, { type: "screenshot" }>
      });
      index += 2;
      continue;
    }

    units.push({ type: "plain", blocks: [current] });
    index += 1;
  }

  return units;
}

function renderUnit(
  unit: RenderUnit,
  manifest: CaptureManifest,
  typstSourcePath: string
): string {
  if (unit.type === "plain") {
    return renderBlocks(unit.blocks, manifest, typstSourcePath);
  }

  const lead = renderBlocks(unit.lead, manifest, typstSourcePath);
  const screenshot = renderBlock(unit.screenshot, manifest, typstSourcePath);
  return `#runbook_lead_in[\n${lead}\n]\n\n${screenshot}`;
}

export async function renderTypstSource(
  config: RunbookConfig,
  chapters: Chapter[],
  manifest: CaptureManifest
): Promise<string> {
  const templateSource = await readText(config.paths.templateFile);
  const logoSource = config.paths.logoFile ?? path.join(config.paths.assetsDir, "logo.svg");
  const logoPath = path
    .relative(path.dirname(config.paths.typstSourceFile), logoSource)
    .split(path.sep)
    .join("/");

  const chapterMarkup = chapters
    .map((chapter) => {
      const blocks = parseMarkdown(chapter.body);
      const units = createRenderUnits(blocks);
      return units
        .map((unit) => renderUnit(unit, manifest, config.paths.typstSourceFile))
        .join("\n\n");
    })
    .join("\n\n#pagebreak()\n\n");

  return [
    templateSource,
    "",
    `#runbook_cover("${escapeTypstText(config.title)}", "${escapeTypstText(config.version)}", "${escapeTypstText(manifest.generatedAt)}", "${logoPath}")`,
    "",
    "#pagebreak()",
    "#outline(title: [Contents])",
    "",
    "#pagebreak()",
    chapterMarkup
  ].join("\n");
}

export async function emitPdfArtifact(
  config: RunbookConfig,
  chapters: Chapter[],
  manifest: CaptureManifest
): Promise<BuildSummary> {
  const typstSource = await renderTypstSource(config, chapters, manifest);
  await writeText(config.paths.typstSourceFile, typstSource);

  try {
    await execFileAsync("typst", [
      "compile",
      "--root",
      process.cwd(),
      config.paths.typstSourceFile,
      config.paths.outputFile
    ]);
  } catch (error) {
    if (error instanceof Error) {
      throw new RunbookError(`Typst compile failed: ${error.message}`);
    }
    throw new RunbookError("Typst compile failed");
  }

  return {
    chapters: chapters.length,
    flows: new Set(manifest.entries.map((entry) => entry.flowId)).size,
    screenshots: manifest.entries.length,
    outputFile: config.paths.outputFile
  };
}
