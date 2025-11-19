import { rm } from "node:fs/promises";

interface DeletePathsOptions {
  isDryRun: boolean;
  onProgress?: (current: number, total: number, path: string) => void;
}

export async function deletePaths(
  paths: string[],
  { isDryRun, onProgress }: DeletePathsOptions,
) {
  const getNextCompleted = (() => {
    let completed = 0;

    return () => ++completed;
  })();

  await Promise.all(
    paths.map(async (path) => {
      if (isDryRun) {
        onProgress?.(getNextCompleted(), paths.length, path);

        return;
      }

      try {
        await rm(path, { force: true, recursive: true });

        onProgress?.(getNextCompleted(), paths.length, path);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        throw new Error(`Failed to delete ${path}: ${message}`, {
          cause: error,
        });
      }
    }),
  );
}
