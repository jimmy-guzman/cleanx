import { basename } from "pathe";

import { buildIgnoreMap } from "./build-ignore-map";
import { filterFilesToDelete } from "./filter-files-to-delete";
import { getAllGitignoreFiles } from "./get-all-gitignore-files";

interface ResolvePathsOptions {
  dir: string;
  exclude: string[];
  include: string[];
  onProgress: (
    phase: "filtering" | "gitignore" | "scanning",
    current?: number,
    total?: number,
  ) => void;
}

export async function resolvePaths(options: ResolvePathsOptions) {
  const { dir, exclude, include, onProgress } = options;

  onProgress("gitignore");

  const allGitignoreFiles = await getAllGitignoreFiles(dir);

  if (allGitignoreFiles.length === 0) {
    return [];
  }

  onProgress("scanning");

  const { fdir } = await import("fdir");

  const scanFiles = new fdir()
    .withFullPaths()
    .withDirs()
    .exclude((dirPath) => basename(dirPath) === ".git")
    .crawl(dir)
    .withPromise();

  const [ignoreMap, allFiles] = await Promise.all([
    buildIgnoreMap(allGitignoreFiles),
    scanFiles,
  ]);

  onProgress("filtering", 0, allFiles.length);

  return filterFilesToDelete(
    allFiles,
    dir,
    exclude,
    include,
    ignoreMap,
    (current, total) => {
      onProgress("filtering", current, total);
    },
  );
}
