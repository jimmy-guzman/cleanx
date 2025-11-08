import { rm } from "node:fs/promises";

interface DeletePathsOptions {
  isDryRun: boolean;
  onProgress?: (current: number, total: number, path: string) => void;
}

export async function deletePaths(
  paths: string[],
  { isDryRun, onProgress }: DeletePathsOptions,
) {
  for (const [index, path] of paths.entries()) {
    onProgress?.(index + 1, paths.length, path);

    if (isDryRun) continue;

    try {
      await rm(path, { force: true, recursive: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      throw new Error(`Failed to delete ${path}: ${message}`, { cause: error });
    }
  }
}
