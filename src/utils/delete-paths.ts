import { rm } from "node:fs/promises";

interface DeletePathsOptions {
  isDryRun: boolean;
  onProgress?: (current: number, total: number, path: string) => void;
}

export async function deletePaths(
  paths: string[],
  { isDryRun, onProgress }: DeletePathsOptions,
) {
  let completed = 0;

  await Promise.all(
    paths.map(async (path) => {
      if (isDryRun) return;

      try {
        await rm(path, { force: true, recursive: true });

        onProgress?.(++completed, paths.length, path);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        throw new Error(`Failed to delete ${path}: ${message}`, {
          cause: error,
        });
      }
    }),
  );
}
