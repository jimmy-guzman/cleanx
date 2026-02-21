import { glob, readdir, readFile } from "node:fs/promises";

import { dirname, join, resolve } from "pathe";

async function findWorkspaceRoot(cwd: string) {
  let current = resolve(cwd);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- loop breaks via return or parent check
  while (true) {
    const entries = await readdir(current);

    if (entries.includes("package.json")) {
      return current;
    }

    const parent = dirname(current);

    if (parent === current) break;

    current = parent;
  }

  return cwd;
}

async function readJsonFile(filePath: string) {
  try {
    const content = await readFile(filePath, "utf8");

    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function readTextFile(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Parses the "packages" field from a pnpm-workspace.yaml file.
 *
 * Supports the following YAML constructs:
 * - Block sequences:     `packages:\n  - 'packages/*'`
 * - Flow sequences:      `packages: ['packages/*', 'apps/*']`
 * - Empty arrays:        `packages: []`
 * - Single/double quotes and unquoted values
 * - Comments within block sequences
 *
 * This is intentionally not a full YAML parser to avoid a heavy dependency.
 */
function parsePnpmWorkspaceYaml(content: string): string[] {
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]?.trim() ?? "";

    const match = /^packages:(.*)$/.exec(trimmed);

    if (!match) continue;

    const inline = match[1]?.trim() ?? "";

    if (inline === "[]") return [];

    if (inline.startsWith("[")) {
      return parseFlowSequence(inline);
    }

    if (!inline) {
      return parseBlockSequence(lines, i + 1);
    }
  }

  return [];
}

function parseFlowSequence(value: string): string[] {
  const inner = value.slice(1, value.lastIndexOf("]")).trim();

  if (!inner) return [];

  return inner
    .split(",")
    .map((item) => item.trim().replaceAll(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function parseBlockSequence(lines: string[], start: number): string[] {
  const patterns: string[] = [];

  for (let i = start; i < lines.length; i++) {
    const trimmed = lines[i]?.trim() ?? "";

    if (trimmed.startsWith("- ")) {
      const pattern = trimmed
        .slice(2)
        .trim()
        .replaceAll(/^["']|["']$/g, "");

      if (pattern) {
        patterns.push(pattern);
      }
    } else if (trimmed && !trimmed.startsWith("#")) {
      break;
    }
  }

  return patterns;
}

async function getWorkspacePatterns(root: string): Promise<string[]> {
  const pnpmWorkspace = await readTextFile(join(root, "pnpm-workspace.yaml"));

  if (pnpmWorkspace) {
    return parsePnpmWorkspaceYaml(pnpmWorkspace);
  }

  const packageJson = await readJsonFile(join(root, "package.json"));

  if (packageJson) {
    const { workspaces } = packageJson;

    if (Array.isArray(workspaces)) {
      return workspaces as string[];
    }

    if (
      typeof workspaces === "object" &&
      workspaces !== null &&
      "packages" in workspaces &&
      Array.isArray((workspaces as { packages: unknown }).packages)
    ) {
      return (workspaces as { packages: string[] }).packages;
    }
  }

  for (const denoConfig of ["deno.json", "deno.jsonc"]) {
    const denoJson = await readJsonFile(join(root, denoConfig));

    if (denoJson?.workspace) {
      if (Array.isArray(denoJson.workspace)) {
        return denoJson.workspace as string[];
      }

      if (
        typeof denoJson.workspace === "object" &&
        "members" in denoJson.workspace &&
        Array.isArray((denoJson.workspace as { members: unknown }).members)
      ) {
        return (denoJson.workspace as { members: string[] }).members;
      }
    }
  }

  return [];
}

async function expandPatterns(root: string, patterns: string[]) {
  const dirs = new Set<string>();

  for (const pattern of patterns) {
    if (!pattern.startsWith("!")) {
      for await (const entry of glob(pattern, { cwd: root })) {
        const fullPath = resolve(root, entry);

        try {
          const entries = await readdir(fullPath);

          if (entries.includes("package.json")) {
            dirs.add(fullPath);
          }
        } catch {
          // Not a directory or doesn't exist, skip
        }
      }
    }
  }

  for (const pattern of patterns) {
    if (pattern.startsWith("!")) {
      const negatedPattern = pattern.slice(1);

      for await (const entry of glob(negatedPattern, { cwd: root })) {
        dirs.delete(resolve(root, entry));
      }
    }
  }

  return dirs;
}

export async function getWorkspacePaths(cwd: string) {
  const root = await findWorkspaceRoot(cwd);
  const patterns = await getWorkspacePatterns(root);

  if (patterns.length === 0) {
    return [root];
  }

  const workspaceDirs = await expandPatterns(root, patterns);
  const paths = [root, ...workspaceDirs];

  return [...new Set(paths)];
}
