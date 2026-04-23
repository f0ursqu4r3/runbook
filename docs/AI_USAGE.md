# Runbook For AI Agents

Runbook now supports a machine-readable CLI mode intended for agents and automation.

## Use `--json`

Pass `--json` to any CLI command to suppress human log lines and emit a single JSON object on stdout.

Examples:

```bash
runbook init manuals/acme --json
runbook doctor --config manuals/acme/manual.config.mjs --json
runbook check --config manuals/acme/manual.config.mjs --json
runbook build --config manuals/acme/manual.config.mjs --json
```

Success shape:

```json
{
  "ok": true,
  "command": "doctor",
  "result": {
    "configPath": "manual/manual.config.mjs",
    "ok": true,
    "checks": [
      {
        "label": "Config file",
        "ok": true,
        "detail": "/abs/path/manual/manual.config.mjs"
      }
    ]
  }
}
```

Failure shape:

```json
{
  "ok": false,
  "command": "doctor",
  "error": {
    "name": "CommandResultError",
    "message": "Doctor found 1 issue",
    "details": {
      "configPath": "manual/manual.config.mjs",
      "ok": false,
      "checks": [
        {
          "label": "Typst",
          "ok": false,
          "detail": "spawn typst ENOENT",
          "fix": "Install Typst and ensure `typst --version` works."
        }
      ]
    }
  }
}
```

## Suggested agent flow

1. Run `init --json` when no manual profile exists yet.
2. Run `doctor --json` before attempting expensive capture or build work.
3. Use `check --json` for structure-only validation.
4. Use `capture --json` to inspect `manifestFile` and `reportFile`.
5. Use `build --json` when the profile is ready to produce the final PDF.

## High-value result fields

- `init`: `configPath`, `targetDir`, `createdPaths`
- `doctor`: `ok`, `checks`
- `check`: `chapters`, `flows`, `screenshotReferences`
- `capture`: `manifestFile`, `reportFile`, `screenshots`
- `build`: `outputFile`, `typstSourceFile`, `manifestFile`, `reportFile`

## Notes

- A non-zero process exit code still indicates failure.
- On `doctor` failure, `error.details.checks` is the canonical structured diagnostic payload.
- `capture` and `build` continue to write artifacts to disk exactly as they do in human-facing mode.
