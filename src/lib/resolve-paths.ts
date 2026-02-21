import type { Ignore } from "ignore";

import { readFile } from "node:fs/promises";

import { basename, dirname } from "pathe";

import { filterFilesToDelete } from "./filter-files-to-delete";
import { getAllGitignoreFiles } from "./get-all-gitignore-files";
import { getErrorMessage } from "./get-error-message";

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

async function buildIgnoreMap(gitignoreFiles: string[]) {
  const { default: ignore } = await import("ignore");
  const ignoreMap = new Map<string, Ignore>();
  const warnings: string[] = [];

  const results = await Promise.allSettled(
    gitignoreFiles.map(async (gitignorePath) => {
      const content = await readFile(gitignorePath, "utf8");

      return { content, path: gitignorePath };
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { content, path } = result.value;
      const ignorer = ignore().add(content);

      ignoreMap.set(dirname(path), ignorer);
    } else {
      warnings.push(
        `Failed to read gitignore: ${getErrorMessage(result.reason)}`,
      );
    }
  }

  return { ignoreMap, warnings };
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

  const [{ ignoreMap, warnings }, allFiles] = await Promise.all([
    buildIgnoreMap(allGitignoreFiles),
    scanFiles,
  ]);

  for (const warning of warnings) {
    const { log } = await import("./log");

    log.warn(warning);
  }

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
