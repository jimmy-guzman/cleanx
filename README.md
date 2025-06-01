# cleanx

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jimmy-guzman/cleanx/cd.yml?style=flat-square&logo=github-actions)
[![version](https://img.shields.io/npm/v/cleanx.svg?logo=npm&style=flat-square)](https://www.npmjs.com/package/cleanx)
[![downloads](https://img.shields.io/npm/dm/cleanx.svg?logo=npm&style=flat-square)](http://www.npmtrends.com/cleanx)

> Configurable cleaning tool for JavaScript/TypeScript projects

## Usage

```bash
npx cleanx
```

## Features

- **Highly configurable** - Custom profiles, patterns, and workspace-specific rules
- Works with single projects and monorepos
- Built-in cleaning profiles with sensible defaults
- Dry-run mode to preview changes
- Smart exclude patterns protect important files

## Installation

```bash
pnpm add -D cleanx
```

## Profiles

**`default`** - Cleans build outputs, keeps `node_modules`

```
dist/, build/, out/, coverage/, .cache/, .turbo/, .next/, etc.
```

**`full`** - Includes `node_modules/`

```bash
cleanx --profile=full
```

## Configuration

Flexible configuration via `cleanx.config.ts`:

```ts
import { defineConfig } from "cleanx";

export default defineConfig({
  include: ["dist", ".turbo"],
  exclude: [".env", "important-file.json"],
  profiles: {
    ci: {
      include: ["coverage", ".cache"],
    },
  },
  workspaces: {
    "apps/*": {
      exclude: ["public/uploads"],
    },
  },
});
```

## CLI Options

```bash
USAGE cleanx [OPTIONS]

OPTIONS

             --config    Path to config file
                --cwd    Set working directory
             --dryRun    Show what would be deleted without actually deleting
  --profile="default"    Cleaning profile to use
```
