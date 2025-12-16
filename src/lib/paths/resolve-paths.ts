import { basename } from "node:path";

import { fdir } from "fdir";
import ignore from "ignore";

import { buildIgnoreMap } from "./build-ignore-map";
import { filterFilesToDelete } from "./filter-files-to-delete";
import { getAllGitignoreFiles } from "./get-all-gitignore-files";

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

  const allGitignoreFiles = await getAllGitignoreFiles(dir);

  if (allGitignoreFiles.length === 0) {
    return [];
  }

  onProgress("scanning");

  const [ignoreMap, allFiles] = await Promise.all([
    buildIgnoreMap(allGitignoreFiles),
    new fdir()
      .withFullPaths()
      .withDirs()
      .exclude((dirPath) => basename(dirPath) === ".git")
      .crawl(dir)
      .withPromise(),
  ]);

  onProgress("filtering", 0, allFiles.length);

  const excludeIgnore = exclude.length > 0 ? ignore().add(exclude) : null;

  return filterFilesToDelete(
    allFiles,
    dir,
    excludeIgnore,
    ignoreMap,
    (current, total) => {
      onProgress("filtering", current, total);
    },
  );
}
