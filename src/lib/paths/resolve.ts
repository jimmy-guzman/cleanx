import ignore from "ignore";

import {
  buildIgnoreMap,
  filterFilesToDelete,
  findLocalGitignoreFiles,
  findParentGitignoreFiles,
  scanFiles,
} from "./helpers";

interface ResolvePathsOptions {
  dir: string;
  exclude: string[];
  onProgress: (
    phase: "filtering" | "gitignore" | "scanning",
    current?: number,
    total?: number,
  ) => void;
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
