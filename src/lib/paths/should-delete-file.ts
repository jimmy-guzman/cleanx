import { relative, sep } from "node:path";

import type { Ignore } from "ignore";

export function shouldDeleteFile(
  filePath: string,
  ignoreMap: Map<string, Ignore>,
) {
  // Sort entries by path depth (deepest first) to ensure most specific .gitignore takes precedence
  const entries = [...ignoreMap.entries()].toSorted(
    ([a], [b]) => b.split(sep).length - a.split(sep).length,
  );

  for (const [gitignoreDir, ig] of entries) {
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
