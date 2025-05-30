# cleanx

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jimmy-guzman/cleanx/cd.yml?style=flat-square&logo=github-actions)
[![version](https://img.shields.io/npm/v/cleanx.svg?logo=npm&style=flat-square)](https://www.npmjs.com/package/cleanx)
[![downloads](https://img.shields.io/npm/dm/cleanx.svg?logo=npm&style=flat-square)](http://www.npmtrends.com/cleanx)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://semantic-release.gitbook.io/semantic-release)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square&logo=prettier)](https://github.com/prettier/prettier)

> 🍱 another opinionated TypeScript library starter

---

## 🛠️ Usage

```bash
npx cleanx
```

By default, this will:

1. Apply the built-in `default` cleaning profile
2. Detect workspaces using your package manager
3. Clean the **root project** and each **workspace**
4. Load and merge `cleanx.config.ts|js` from the root and each workspace
5. Respect profile settings and override logic

---

## ✨ Features

- **Zero config required** — works out of the box with smart defaults
- **Optional config** — override or expand with `cleanx.config.ts` or `.js`
- **Monorepo support** — auto-detects workspaces via `pnpm`, `npm`, or `yarn`
- **Workspace-level overrides** — each workspace extends the root config
- **Profiles** — safely switch between cleaning modes or define your own
- **Safe by default** — dry-run mode, confirmation prompts, and protected paths
- **Fast** — instant startup with Bun or Node, zero runtime dependencies

---

## 📦 Installation

```bash
pnpm add -D cleanx
```

---

## 🧹 Profiles

Profiles control what gets cleaned. `cleanx` includes two built-in profiles:

| Name      | Description                                           |
| --------- | ----------------------------------------------------- |
| `default` | Safe cleaning (no `node_modules`)                     |
| `full`    | Includes everything in `default` plus `node_modules/` |

### Use a profile:

```bash
cleanx use default
cleanx use full --dry-run
```

Or:

```bash
cleanx --profile=full
```

---

## 🧩 Define or Override Profiles

```ts
// cleanx.config.ts
import { defineCleanxConfig } from "cleanx";

export default defineCleanxConfig({
  profiles: {
    default: {
      include: ["dist", ".turbo"],
      exclude: [".env", ".git"],
      dryRun: true,
    },
    full: {
      include: ["dist", "node_modules"],
      confirm: true,
    },
    ci: {
      include: [".next", "coverage", ".cache"],
      dryRun: false,
    },
  },
});
```

---

## 📋 List Profiles

```bash
cleanx ls
# or
cleanx list
```

---

## ⚙️ Config Format (Optional)

```ts
export default defineCleanxConfig({
  include: ["dist", ".turbo"],
  exclude: [".env", ".git"],
  dryRun: true,
  confirm: false,
});
```

Workspace configs extend the root config and override values.

---

## 🧠 Defaults (Always Applied)

### `include` paths:

```
dist/
build/
out/
coverage/
.tmp/
.temp/
.cache/
.turbo/
.next/
.storybook/
```

### `exclude` paths:

```
.env
.env.*         # e.g. .env.local
package.json
.git
node_modules/  # excluded unless using the full profile
```

---

## 🧪 CLI Options

```bash
cleanx [options]

Options:
  --profile <name>   Use a named cleaning profile
  --dry-run          Preview deletions without deleting
  --confirm          Prompt before deletion
  --force            Skip confirmation prompt
  --no-workspaces    Clean only the current directory
  --cwd <path>       Set working directory
  --include <path>   Add paths to include (merges with config)
  --exclude <path>   Add paths to exclude (merges with config)
  --config <file>    Manually specify config file
  --version          Show version
  --help             Show help
```

---

## ✅ Example

```bash
cleanx use full --dry-run
```

```
[cleanx] apps/web/.next
[cleanx] packages/ui/dist
[cleanx] packages/utils/node_modules
[cleanx] Done in 68ms (dry run)
```
