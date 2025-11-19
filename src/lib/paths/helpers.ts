import { access, readFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";

import type { Ignore } from "ignore";

import { fdir } from "fdir";
import ignore from "ignore";
import { glob } from "tinyglobby";

import { shouldDeleteFile } from "./should-delete-file";

export async function findLocalGitignoreFiles(dir: string) {
  return glob([".gitignore", "**/.gitignore"], {
    absolute: true,
    cwd: dir,
    dot: true,
    ignore: ["**/node_modules/**", "**/.git/**"],
  });
}

export async function findParentGitignoreFiles(dir: string) {
  const parentGitignoreFiles: string[] = [];
  let currentDir = dir;
  let parentDir = join(currentDir, "..");

  while (parentDir !== currentDir) {
    const parentGitignore = join(parentDir, ".gitignore");

    try {
      await access(parentGitignore);

      parentGitignoreFiles.push(parentGitignore);
    } catch {
      // No gitignore at this level, continue up
    }

    // Stop at git root (if .git directory exists)
    try {
      await access(join(parentDir, ".git"));

      break; // Found git root, stop here
    } catch {
      // Not git root, continue up
    }

    currentDir = parentDir;
    parentDir = join(currentDir, "..");
  }

  return parentGitignoreFiles;
}

export async function buildIgnoreMap(gitignoreFiles: string[]) {
  const ignoreMap = new Map<string, Ignore>();

  for (const gitignorePath of gitignoreFiles) {
    const gitignoreDir = dirname(gitignorePath);
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

export async function scanFiles(dir: string) {
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

export function filterFilesToDelete(
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
