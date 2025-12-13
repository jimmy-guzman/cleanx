# cleanx

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jimmy-guzman/cleanx/cd.yml?style=flat-square&logo=github-actions)
[![version](https://img.shields.io/npm/v/cleanx.svg?logo=npm&style=flat-square)](https://www.npmjs.com/package/cleanx)
[![downloads](https://img.shields.io/npm/dm/cleanx.svg?logo=npm&style=flat-square)](http://www.npmtrends.com/cleanx)
[![Install Size][install-size-badge]][packagephobia]

> Clean gitignored files safely across workspaces

## Usage

```bash
pnpx cleanx
```

## Features

- **Gitignore-based cleaning** - Uses your existing `.gitignore` patterns
- Works with single projects and monorepos
- Dry-run mode to preview changes
- Exclude patterns to protect specific files
- Include patterns to override exclusions

## Installation

```bash
pnpm add -D cleanx
```

## CLI Options

```bash
Clean gitignored files safely across workspaces

Usage:
  cleanx [options]

Options:
      --cwd <path>          Set working directory
  -d, --dry-run             Show what would be deleted without actually deleting
  -e, --exclude <pattern>   Patterns to exclude from deletion (can be used multiple times)
  -i, --include <pattern>   Patterns to include for deletion even if excluded (can be used multiple times)
  -h, --help                Show this help message
  -v, --version             Show version number
```

## Examples

```bash
# Preview what will be deleted
pnpx cleanx --dry-run

# Exclude specific patterns
pnpx cleanx --exclude '*.log' --exclude '.env.local'

# Or use shorthand
pnpx cleanx -e '*.env' -e 'node_modules/**'

# Include patterns to override exclusions
# This excludes node_modules but still cleans the .cache folder inside it
pnpx cleanx --exclude 'node_modules/**' --include 'node_modules/.cache/**'

# Shorthand version
pnpx cleanx -e 'node_modules/**' -i 'node_modules/.cache/**'

# Advanced: exclude all .env files except .env.example
pnpx cleanx -e '.env*' -i '.env.example'

# Alternative: use negation patterns (requires single quotes)
pnpx cleanx -e 'node_modules/**' -e '!node_modules/.cache/**'
```

> [!NOTE]
> Use `--include` to override exclusions. If you prefer negation patterns (starting with `!`), use single quotes to prevent shell interpretation.

[packagephobia]: https://packagephobia.com/result?p=cleanx
[install-size-badge]: https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json%3Fp=cleanx&query=$.install.pretty&label=install%20size&style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDggMTA4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzAwNjgzOCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzMyZGU4NSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxwYXRoIGZpbGw9InVybCgjYSkiIGQ9Ik0yMS42NjcgNzMuODA5VjMzLjg2N2wyOC4zMy0xNi4xODggMjguMzM3IDE2LjE4OFY2Ni4xM0w0OS45OTcgODIuMzIxIDM1IDczLjc1VjQxLjYwNGwxNC45OTctOC41N0w2NSA0MS42MDR2MTYuNzg4bC0xNS4wMDMgOC41NzEtMS42NjMtLjk1di0xNi42NzJsOC4zODItNC43OTItNi43MTktMy44MzgtOC4zMyA0Ljc2M1Y2OS44OGw4LjMzIDQuNzYyIDIxLjY3LTEyLjM4M1YzNy43MzdsLTIxLjY3LTEyLjM3OS0yMS42NjMgMTIuMzc5djM5Ljg4TDQ5Ljk5NyA5MCA4NSA3MFYzMEw0OS45OTcgMTAgMTUgMzB2NDB6Ii8+PC9zdmc+
