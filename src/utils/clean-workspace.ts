import { createDeletionProgressHandler } from "./create-deletion-progress-handler";
import { createProgressHandler } from "./create-progress-handler";
import { deletePaths } from "./delete-paths";
import { dim, ERROR, SUCCESS, suffix, WARN, ws } from "./logger";
import { resolvePaths } from "./resolve-paths";

interface CleanWorkspaceOptions {
  dryRun: boolean;
  exclude: string[];
  updateLine: (workspaceDir: string, content: string) => void;
}

export async function cleanWorkspace(
  workspaceDir: string,
  { dryRun, exclude, updateLine }: CleanWorkspaceOptions,
) {
  try {
    const paths = await resolvePaths({
      dir: workspaceDir,
      exclude,
      onProgress: createProgressHandler(updateLine, workspaceDir),
    });

    if (paths.length === 0) {
      updateLine(
        workspaceDir,
        `${WARN} No gitignored files in ${ws(workspaceDir)}`,
      );

      return { skipped: true, success: false };
    }

    const showProgress = paths.length > 100;

    await deletePaths(paths, {
      isDryRun: dryRun,
      onProgress: showProgress
        ? createDeletionProgressHandler(updateLine, workspaceDir)
        : undefined,
    });

    updateLine(
      workspaceDir,
      `${SUCCESS} Cleaned ${ws(workspaceDir)} ${dim(`${paths.length} paths`)}${suffix(dryRun)}`,
    );

    return { skipped: false, success: true };
  } catch (error) {
    updateLine(
      workspaceDir,
      `${ERROR} Failed ${ws(workspaceDir)}: ${error instanceof Error ? error.message : String(error)}`,
    );

    return { skipped: false, success: false };
  }
}
