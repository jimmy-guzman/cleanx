# cleanx

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jimmy-guzman/cleanx/cd.yml?style=flat-square&logo=github-actions)
[![version](https://img.shields.io/npm/v/cleanx.svg?logo=npm&style=flat-square)](https://www.npmjs.com/package/cleanx)
[![downloads](https://img.shields.io/npm/dm/cleanx.svg?logo=npm&style=flat-square)](http://www.npmtrends.com/cleanx)

> Clean gitignored files safely across workspaces

## Usage

```bash
npx cleanx
```

## Features

- **Gitignore-based cleaning** - Uses your existing `.gitignore` patterns
- Works with single projects and monorepos
- Dry-run mode to preview changes
- Exclude patterns to protect specific files

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
  -c, --config <path>       Path to config file
      --cwd <path>          Set working directory
  -d, --dry-run             Show what would be deleted without actually deleting
  -e, --exclude <pattern>   Patterns to exclude from deletion (can be used multiple times)
  -h, --help                Show this help message
  -v, --version             Show version number
```

## Examples

```bash
# Preview what will be deleted
npx cleanx --dry-run

# Exclude specific patterns
npx cleanx --exclude "*.log" --exclude ".env.local"
```
