import { deletePaths } from "./delete-paths";
import { dim, ERROR, INFO, SUCCESS, suffix, WARN, ws } from "./logger";
import { resolvePaths } from "./resolve-paths";

function createProgressHandler(
  updateLine: (workspaceDir: string, content: string) => void,
  workspaceDir: string,
) {
  return (
    phase: "filtering" | "gitignore" | "scanning",
    current?: number,
    total?: number,
  ) => {
    if (phase === "gitignore") {
      updateLine(
        workspaceDir,
        `${INFO} Reading .gitignore in ${ws(workspaceDir)}`,
      );
    } else if (phase === "scanning") {
      updateLine(workspaceDir, `${INFO} Scanning ${ws(workspaceDir)}`);
    } else if (current && total) {
      const percent = Math.floor((current / total) * 100);

      updateLine(
        workspaceDir,
        `${INFO} Filtering ${ws(workspaceDir)} ${dim(`${current}/${total} (${percent}%)`)}`,
      );
    }
  };
}

function createDeletionProgressHandler(
  updateLine: (workspaceDir: string, content: string) => void,
  workspaceDir: string,
) {
  return (deleted: number, total: number) => {
    const percent = Math.floor((deleted / total) * 100);

    updateLine(
      workspaceDir,
      `${INFO} Cleaning ${ws(workspaceDir)} ${dim(`${deleted}/${total} (${percent}%)`)}`,
    );
  };
}

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
