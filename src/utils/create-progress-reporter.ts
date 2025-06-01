import { blue, gray } from "ansis";

import { PERCENTAGE_MULTIPLIER, PROGRESS_LOG_INTERVAL } from "../constants";
import { logger } from "./logger";

/**
 * Creates a progress reporting function for file deletion operations.
 * Only logs progress when significant milestones are reached to avoid spam.
 *
 * @param dir - Directory being cleaned (for display purposes)
 *
 * @returns Progress callback function or undefined if not needed
 */
export function createProgressReporter(dir: string) {
  let lastLoggedPercent = 0;

  return (deleted: number, total: number) => {
    const percent = Math.floor((deleted / total) * PERCENTAGE_MULTIPLIER);

    if (
      percent >= lastLoggedPercent + PROGRESS_LOG_INTERVAL ||
      deleted === total
    ) {
      logger.info(
        `Cleaning ${blue(dir)} ${gray(`${deleted}/${total} paths (${percent}%)`)}`,
      );
      lastLoggedPercent = percent;
    }
  };
}
