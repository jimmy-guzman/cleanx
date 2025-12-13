#!/usr/bin/env node
import { parseArgs } from "node:util";

import { description, name, version } from "package.json";

import { excludePatterns } from "./lib/exclude-patterns";
import { log } from "./lib/logging/log";

const { values } = parseArgs({
  allowPositionals: false,
  options: {
    "cwd": {
      default: process.cwd(),
      type: "string",
    },
    "dry-run": {
      default: false,
      short: "d",
      type: "boolean",
    },
    "exclude": {
      default: [],
      multiple: true,
      short: "e",
      type: "string",
    },
    "help": {
      short: "h",
      type: "boolean",
    },
    "include": {
      default: [],
      multiple: true,
      short: "i",
      type: "string",
    },
    "version": {
      short: "v",
      type: "boolean",
    },
  },
  strict: true,
});

if (values.help) {
  log.message(`
${name} v${version}

${description}

Usage:
  ${name} [options]

Options:
      --cwd <path>          Set working directory
  -d, --dry-run             Show what would be deleted without actually deleting
  -e, --exclude <pattern>   Patterns to exclude from deletion (can be used multiple times)
  -i, --include <pattern>   Patterns to include for deletion even if excluded (can be used multiple times)
  -h, --help                Show this help message
  -v, --version             Show version number

Examples:
  ${name} --dry-run
  ${name} --exclude 'node_modules/**' --include 'node_modules/.cache/**'
  ${name} -e '*.log' -e '.env.*' -i '.env.example'
`);
  process.exit(0);
}

if (values.version) {
  log.message(version);

  process.exit(0);
}

const { runClean } = await import("./commands/run-clean.js");

await runClean({
  cwd: values.cwd,
  dryRun: values["dry-run"],
  exclude: excludePatterns(values.exclude, values.include),
});
