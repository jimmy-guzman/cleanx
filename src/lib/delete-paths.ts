import { rm } from "node:fs/promises";

import { getErrorMessage } from "./get-error-message";

interface DeletePathsOptions {
  dryRun: boolean;
  onProgress?: (current: number, total: number, path: string) => void;
}

export async function deletePaths(
  paths: string[],
  { dryRun, onProgress }: DeletePathsOptions,
) {
  const getNextCompleted = (() => {
    let completed = 0;

    return () => ++completed;
  })();

  await Promise.all(
    paths.map(async (path) => {
      if (dryRun) {
        onProgress?.(getNextCompleted(), paths.length, path);

        return;
      }

      try {
        await rm(path, { force: true, recursive: true });

        onProgress?.(getNextCompleted(), paths.length, path);
      } catch (error) {
        throw new Error(`Failed to delete ${path}: ${getErrorMessage(error)}`, {
          cause: error,
        });
      }
    }),
  );
}
