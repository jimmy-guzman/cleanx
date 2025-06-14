import { blue, gray, yellow } from "ansis";

import { PROGRESS_THRESHOLD } from "../constants";
import { createProgressReporter } from "../utils/create-progress-reporter";
import { deletePaths } from "../utils/delete-paths";
import { formatDuration } from "../utils/format-duration";
import { logger } from "../utils/logger";
import { plural } from "../utils/plural";
import { resolveConfigs } from "../utils/resolve-configs";
import { resolvePathsToDelete } from "../utils/resolve-paths-to-delete";

interface RunCleanOptions {
  config?: string;
  cwd?: string;
  dryRun?: boolean;
  exclude?: string[];
  include?: string[];
  profile: string;
}

export async function runClean(options: RunCleanOptions) {
  const startTime = performance.now();
  const cwd = options.cwd ?? process.cwd();

  const { dryRun: isDryRun, workspaces } = await resolveConfigs({
    config: options.config,
    cwd,
    dryRun: options.dryRun,
    exclude: options.exclude,
    include: options.include,
    profile: options.profile,
  });

  // eslint-disable-next-line no-console -- this is for a blank line before output
  console.log();

  if (isDryRun) {
    logger.warn(
      `Cleaning ${workspaces.length} ${plural(workspaces.length, "workspace")} in dry run mode`,
    );
  } else {
    logger.info(
      `Cleaning ${workspaces.length} ${plural(workspaces.length, "workspace")}`,
    );
  }

  const results = await Promise.allSettled(
    workspaces.map(async (workspace) => {
      const paths = await resolvePathsToDelete({
        dir: workspace.dir,
        exclude: workspace.config.exclude,
        include: workspace.config.include,
      });

      if (paths.length === 0) {
        logger.warn(`Skipping ${workspace.dir}`);

        return { skipped: true, success: false };
      }

      try {
        const showProgress = paths.length > PROGRESS_THRESHOLD;

        await deletePaths(paths, {
          isDryRun,
          onProgress: showProgress
            ? createProgressReporter(workspace.dir)
            : undefined,
        });

        const dryRunSuffix = isDryRun ? yellow(" (dry run)") : "";

        logger.success(
          `Cleaned ${blue(workspace.dir)} ${gray(`${paths.length} paths`)}${dryRunSuffix}`,
        );

        return { skipped: false, success: true };
      } catch (error) {
        logger.error(
          `Failed to clean ${workspace.dir}: ${error instanceof Error ? error.message : String(error)}`,
        );

        return { skipped: false, success: false };
      }
    }),
  );

  const successes = results.filter((r) => {
    return r.status === "fulfilled" && r.value.success;
  });

  const endTime = performance.now();
  const duration = endTime - startTime;
  const dryRunSuffix = isDryRun ? yellow(" (dry run)") : "";

  logger.success(
    `Cleaned ${successes.length} ${plural(successes.length, "workspace")} successfully in ${gray(formatDuration(duration))}${dryRunSuffix}`,
  );
}
