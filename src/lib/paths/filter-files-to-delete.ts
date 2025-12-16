import { relative, sep } from "node:path";

import type { Ignore } from "ignore";

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

  const sortedEntries = [...ignoreMap.entries()].toSorted(
    ([a], [b]) => b.split(sep).length - a.split(sep).length,
  );

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];

    if (!filePath) continue;

    if (i % 100 === 0 || i === allFiles.length - 1) {
      onProgress(i + 1, allFiles.length);
    }

    if (shouldExcludeFile(filePath, dir, excludeIg)) {
      continue;
    }

    if (shouldDeleteFile(filePath, sortedEntries)) {
      pathsToDelete.push(filePath);
    }
  }

  return pathsToDelete;
}
