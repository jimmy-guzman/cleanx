import { relative, sep } from "node:path";

import type { Ignore } from "ignore";

export function shouldDeleteFile(
  filePath: string,
  ignoreMap: Map<string, Ignore>,
) {
  const entries = [...ignoreMap.entries()].toSorted(
    ([a], [b]) => b.split(sep).length - a.split(sep).length,
  );

  for (const [gitignoreDir, ig] of entries) {
    const relativeToGitignore = relative(gitignoreDir, filePath);

    if (relativeToGitignore.startsWith("..") || !relativeToGitignore) {
      continue;
    }

    if (ig.ignores(relativeToGitignore)) {
      return true;
    }
  }

  return false;
}
