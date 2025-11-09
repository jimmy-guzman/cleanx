import { readFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";

import type { Ignore } from "ignore";

import { fdir } from "fdir";
import ignore from "ignore";
import { glob } from "tinyglobby";

interface ResolvePathsOptions {
  dir: string;
  exclude: string[];
  onProgress: (
    phase: "filtering" | "gitignore" | "scanning",
    current?: number,
    total?: number,
  ) => void;
}

async function findLocalGitignoreFiles(dir: string) {
  return glob([".gitignore", "**/.gitignore"], {
    absolute: true,
    cwd: dir,
    dot: true,
    ignore: ["**/node_modules/**", "**/.git/**"],
  });
}

async function findParentGitignoreFiles(dir: string) {
  const parentGitignoreFiles: string[] = [];
  let currentDir = dir;
  let parentDir = join(currentDir, "..");

  while (parentDir !== currentDir) {
    const parentGitignore = join(parentDir, ".gitignore");

    try {
      await readFile(parentGitignore, "utf8");

      parentGitignoreFiles.push(parentGitignore);
    } catch {
      // No gitignore at this level, continue up
    }

    // Stop at git root (if .git directory exists)
    try {
      const gitDir = join(parentDir, ".git");

      await readFile(join(gitDir, "config"), "utf8");

      break; // Found git root, stop here
    } catch {
      // Not git root, continue up
    }

    currentDir = parentDir;
    parentDir = join(currentDir, "..");
  }

  return parentGitignoreFiles;
}

async function buildIgnoreMap(gitignoreFiles: string[]) {
  const ignoreMap = new Map<string, Ignore>();

  for (const gitignorePath of gitignoreFiles) {
    const gitignoreDir = gitignorePath.replace(/\.gitignore$/, "");
    const ig = ignore();

    try {
      const content = await readFile(gitignorePath, "utf8");

      ig.add(content);
      ignoreMap.set(gitignoreDir, ig);
    } catch {
      continue;
    }
  }

  return ignoreMap;
}

async function scanFiles(dir: string) {
  return new fdir()
    .withFullPaths()
    .withDirs()
    .exclude((dirPath) => basename(dirPath) === ".git")
    .crawl(dir)
    .withPromise();
}

function shouldExcludeFile(
  filePath: string,
  baseDir: string,
  excludeIg: Ignore | null,
) {
  if (!excludeIg) return false;

  const relativePath = relative(baseDir, filePath);

  return Boolean(relativePath && excludeIg.ignores(relativePath));
}

function shouldDeleteFile(filePath: string, ignoreMap: Map<string, Ignore>) {
  for (const [gitignoreDir, ig] of ignoreMap.entries()) {
    const relativeToGitignore = relative(gitignoreDir, filePath);

    // Skip if path is outside gitignore directory or is the directory itself
    if (relativeToGitignore.startsWith("..") || !relativeToGitignore) {
      continue;
    }

    if (ig.ignores(relativeToGitignore)) {
      return true;
    }
  }

  return false;
}

function filterFilesToDelete(
  allFiles: string[],
  dir: string,
  excludeIg: Ignore | null,
  ignoreMap: Map<string, Ignore>,
  onProgress: (current: number, total: number) => void,
) {
  const pathsToDelete: string[] = [];

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];

    if (!filePath) continue;

    if (i % 100 === 0 || i === allFiles.length - 1) {
      onProgress(i + 1, allFiles.length);
    }

    if (shouldExcludeFile(filePath, dir, excludeIg)) {
      continue;
    }

    if (shouldDeleteFile(filePath, ignoreMap)) {
      pathsToDelete.push(filePath);
    }
  }

  return pathsToDelete;
}

export async function resolvePaths(options: ResolvePathsOptions) {
  const { dir, exclude = [], onProgress } = options;

  onProgress("gitignore");

  const [localGitignoreFiles, parentGitignoreFiles] = await Promise.all([
    findLocalGitignoreFiles(dir),
    findParentGitignoreFiles(dir),
  ]);

  const allGitignoreFiles = [
    ...parentGitignoreFiles.toReversed(),
    ...localGitignoreFiles,
  ];

  if (allGitignoreFiles.length === 0) {
    return [];
  }

  const ignoreMap = await buildIgnoreMap(allGitignoreFiles);

  onProgress("scanning");

  const allFiles = await scanFiles(dir);

  onProgress("filtering", 0, allFiles.length);

  const excludeIg = exclude.length > 0 ? ignore().add(exclude) : null;

  return filterFilesToDelete(
    allFiles,
    dir,
    excludeIg,
    ignoreMap,
    (current, total) => {
      onProgress("filtering", current, total);
    },
  );
}
