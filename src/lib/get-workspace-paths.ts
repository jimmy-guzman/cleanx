import { glob, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

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

function parsePnpmWorkspaceYaml(content: string): string[] {
  const patterns: string[] = [];
  const lines = content.split("\n");

  let inPackages = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "packages:" || trimmed === "packages: []") {
      inPackages = trimmed !== "packages: []";
      continue;
    }

    if (inPackages) {
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
    const isNegation = pattern.startsWith("!");

    if (isNegation) {
      const negatedPattern = pattern.slice(1);

      for await (const entry of glob(negatedPattern, { cwd: root })) {
        dirs.delete(resolve(root, entry));
      }
    } else {
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
