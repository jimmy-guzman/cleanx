import { rm } from "node:fs/promises";
import { setImmediate } from "node:timers/promises";

import {
  BATCH_SIZE_DIVISOR,
  MAX_CONCURRENCY,
  MIN_CONCURRENCY,
  PROGRESS_UPDATE_INTERVAL,
  SMALL_BATCH_THRESHOLD,
} from "../constants";

interface DeletePathsOptions {
  isDryRun?: boolean;
  onProgress?: (deleted: number, total: number) => void;
}

export async function deletePaths(
  paths: string[],
  { isDryRun = false, onProgress }: DeletePathsOptions,
) {
  if (isDryRun) return;

  const total = paths.length;

  if (total <= SMALL_BATCH_THRESHOLD) {
    await Promise.allSettled(
      paths.map((path) => rm(path, { force: true, recursive: true })),
    );

    onProgress?.(total, total);

    return;
  }

  const concurrency = Math.min(
    MAX_CONCURRENCY,
    Math.max(MIN_CONCURRENCY, Math.floor(total / BATCH_SIZE_DIVISOR)),
  );
  const batches: string[][] = [];

  for (let i = 0; i < total; i += concurrency) {
    batches.push(paths.slice(i, i + concurrency));
  }

  let deleted = 0;

  for (const [batchIndex, batch] of batches.entries()) {
    await Promise.allSettled(
      batch.map((path) => rm(path, { force: true, recursive: true })),
    );

    deleted += batch.length;

    if (
      batchIndex % PROGRESS_UPDATE_INTERVAL === 0 ||
      batchIndex === batches.length - 1
    ) {
      onProgress?.(deleted, total);
    }

    if (batch.length === concurrency) {
      await setImmediate();
    }
  }
}
