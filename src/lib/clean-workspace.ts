import { dim, ERROR, SUCCESS, suffix, WARN, ws } from "@/lib/colors";
import { resolvePaths } from "@/lib/paths/resolve-paths";
import { createCleaningProgress } from "@/lib/progress/cleaning";
import { createPreparingProgress } from "@/lib/progress/preparing";

import { deletePaths } from "./delete-paths";

interface CleanWorkspaceOptions {
  dryRun: boolean;
  exclude: string[];
  include: string[];
  updateLine: (workspaceDir: string, content: string) => void;
}

export async function cleanWorkspace(
  workspaceDir: string,
  { dryRun, exclude, include, updateLine }: CleanWorkspaceOptions,
) {
  try {
    const paths = await resolvePaths({
      dir: workspaceDir,
      exclude,
      include,
      onProgress: createPreparingProgress(updateLine, workspaceDir),
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
        ? createCleaningProgress(updateLine, workspaceDir)
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
