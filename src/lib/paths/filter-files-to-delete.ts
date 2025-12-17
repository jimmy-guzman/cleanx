import type { Ignore } from "ignore";

import { relative, sep } from "node:path";

function shouldDeleteFile(filePath: string, sortedEntries: [string, Ignore][]) {
  for (const [gitignoreDir, ignorer] of sortedEntries) {
    const relativeToGitignore = relative(gitignoreDir, filePath);

    if (relativeToGitignore.startsWith("..") || !relativeToGitignore) {
      continue;
    }

    if (ignorer.ignores(relativeToGitignore)) {
      return true;
    }
  }

  return false;
}

async function shouldExcludeFile(
  relativePath: string,
  exclude: string[],
  include: string[],
) {
  if (!relativePath) return false;

  const normalizedPath = relativePath.replaceAll(sep, "/");

  const { default: zeptomatch } = await import("zeptomatch");

  const isExcluded = exclude.some((pattern) => {
    return zeptomatch(pattern, normalizedPath);
  });

  if (!isExcluded) return false;

  const isIncluded = include.some((pattern) => {
    return zeptomatch(pattern, normalizedPath);
  });

  return !isIncluded;
}

export async function filterFilesToDelete(
  allFiles: string[],
  dir: string,
  exclude: string[],
  include: string[],
  ignoreMap: Map<string, Ignore>,
  onProgress: (current: number, total: number) => void,
) {
  const pathsToDelete: string[] = [];
  const total = allFiles.length;

  const sortedEntries = [...ignoreMap.entries()].toSorted(
    ([a], [b]) => b.split(sep).length - a.split(sep).length,
  );

  const hasExclusions = exclude.length > 0;

  for (let i = 0; i < total; i++) {
    const filePath = allFiles[i];

    if (!filePath) continue;

    if (i % 100 === 0 || i === total - 1) {
      onProgress(i + 1, total);
    }

    if (hasExclusions) {
      const relativePath = relative(dir, filePath);

      if (await shouldExcludeFile(relativePath, exclude, include)) {
        continue;
      }
    }

    if (shouldDeleteFile(filePath, sortedEntries)) {
      pathsToDelete.push(filePath);
    }
  }

  return pathsToDelete;
}
