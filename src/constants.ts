import type { CleanxOptions } from "./options";

/**
 * Threshold for small batches that can be processed all at once without batching.
 * Files counts below this will use Promise.allSettled for all paths simultaneously.
 */
export const SMALL_BATCH_THRESHOLD = 50;

/**
 * Minimum concurrency level for batch processing.
 * Ensures at least this many files are processed in parallel even for small jobs.
 */
export const MIN_CONCURRENCY = 4;

/**
 * Maximum concurrency level for batch processing.
 * Prevents overwhelming the system with too many simultaneous file operations.
 */
export const MAX_CONCURRENCY = 12;

/**
 * Divisor used to calculate optimal batch size based on total file count.
 * Formula: Math.floor(total / BATCH_SIZE_DIVISOR)
 * A higher value results in smaller batches and lower concurrency.
 */
export const BATCH_SIZE_DIVISOR = 200;

/**
 * How often to report progress during batch processing (in batch intervals).
 * Progress will be reported every N batches, plus always on the final batch.
 */
export const PROGRESS_UPDATE_INTERVAL = 10;

/**
 * Minimum number of files required before showing progress updates.
 * Below this threshold, operations complete quickly enough that progress isn't needed.
 */
export const PROGRESS_THRESHOLD = 100;

/**
 * Minimum percentage increment required before logging progress.
 * Prevents spam by only logging when progress increases by at least this amount.
 */
export const PROGRESS_LOG_INTERVAL = 20;

/**
 * Multiplier to convert decimal progress (0-1) to percentage (0-100).
 * Used for progress reporting calculations.
 */
export const PERCENTAGE_MULTIPLIER = 100;

export const BUILTIN_PROFILES: Record<string, Partial<CleanxOptions>> = {
  default: {
    exclude: [
      ".env",
      ".env.*",
      "package.json",
      ".git",
      "**/.git/**/*",
      "node_modules",
    ],
    include: [
      "dist",
      "build",
      "out",
      "coverage",
      ".tmp",
      ".temp",
      ".cache",
      ".turbo",
      ".next",
      "storybook-static",
      ".vite",
      ".nuxt",
      ".svelte-kit",
      ".eslintcache",
      ".vercel",
      ".vinxi",
      ".output",
      "playwright-report",
      "test-results",
      "*.tsbuildinfo",
    ],
  },
  full: {
    exclude: [".env", ".env.*", "package.json", ".git", "**/.git/**/*"],
    include: [
      "dist",
      "build",
      "out",
      "coverage",
      ".tmp",
      ".temp",
      ".cache",
      ".turbo",
      ".next",
      "storybook-static",
      ".vite",
      ".nuxt",
      ".svelte-kit",
      "*.tsbuildinfo",
      ".eslintcache",
      ".vercel",
      ".vinxi",
      ".output",
      "playwright-report",
      "test-results",
      "node_modules",
    ],
  },
};
