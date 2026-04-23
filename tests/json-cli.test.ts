import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "runbook-json-"));
  tempRoots.push(root);
  return root;
}

test("help supports json mode", async () => {
  const { stdout } = await execFileAsync("bun", ["run", "src/cli.ts", "help", "--json"], {
    cwd: process.cwd()
  });
  const result = JSON.parse(stdout) as {
    ok: boolean;
    command: string;
    result: { commands: string[] };
  };

  expect(result.ok).toBe(true);
  expect(result.command).toBe("help");
  expect(result.result.commands).toContain("build");
});

test("init returns machine-readable paths", async () => {
  const root = await makeTempRoot();
  const target = path.join(root, "acme-manual");

  const { stdout } = await execFileAsync(
    process.execPath,
    ["run", "src/cli.ts", "init", target, "--json"],
    { cwd: process.cwd() }
  );
  const result = JSON.parse(stdout) as {
    ok: boolean;
    command: string;
    result: { configPath: string; createdPaths: string[] };
  };

  expect(result.ok).toBe(true);
  expect(result.command).toBe("init");
  expect(result.result.configPath).toContain("manual.config.mjs");
  expect(result.result.createdPaths).toHaveLength(6);
});

test("doctor failures return structured checks in json mode", async () => {
  const root = await makeTempRoot();
  const target = path.join(root, "broken-manual");

  await execFileAsync(process.execPath, ["run", "src/cli.ts", "init", target, "--json"], {
    cwd: process.cwd()
  });

  const configPath = path.join(target, "manual.config.mjs");
  const env = { ...process.env, PATH: "" };

  await expect(
    execFileAsync(
      process.execPath,
      ["run", "src/cli.ts", "doctor", "--config", configPath, "--json"],
      { cwd: process.cwd(), env }
    )
  ).rejects.toMatchObject({
    stdout: expect.stringContaining('"ok": false')
  });

  try {
    await execFileAsync(
      process.execPath,
      ["run", "src/cli.ts", "doctor", "--config", configPath, "--json"],
      { cwd: process.cwd(), env }
    );
  } catch (error) {
    const stdout = (error as { stdout: string }).stdout;
    const payload = JSON.parse(stdout) as {
      ok: boolean;
      command: string;
      error: {
        name: string;
        details?: {
          ok: boolean;
          checks: Array<{ label: string; ok: boolean }>;
        };
      };
    };

    expect(payload.ok).toBe(false);
    expect(payload.command).toBe("doctor");
    expect(payload.error.name).toBe("CommandResultError");
    expect(payload.error.details?.ok).toBe(false);
    expect(payload.error.details?.checks.some((check) => check.label === "Typst" && check.ok === false)).toBe(true);
  }
});
