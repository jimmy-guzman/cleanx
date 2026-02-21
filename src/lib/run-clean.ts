import { cleanWorkspace } from "./clean-workspace";
import { dim, suffix } from "./colors";
import { formatDuration } from "./format-duration";
import { getWorkspacePaths } from "./get-workspace-paths";
import { log } from "./log";
import { plural } from "./plural";
import { createLineUpdater } from "./progress";

interface RunCleanOptions {
  cwd: string;
  dryRun: boolean;
  exclude: string[];
  include: string[];
}

const CURSOR_HIDE = "\u001B[?25l";
const CURSOR_SHOW = "\u001B[?25h";

export async function runClean({
  cwd,
  dryRun,
  exclude,
  include,
}: RunCleanOptions) {
  const startTime = performance.now();
  const workspacePaths = await getWorkspacePaths(cwd);
  const totalWorkspaces = workspacePaths.length;

  log.line();
  log.info(
    `Cleaning ${totalWorkspaces} ${plural(totalWorkspaces, "workspace")} ${suffix(dryRun)}`,
  );

  const workspaceLines = new Map<string, number>();

  for (const [index, path] of workspacePaths.entries()) {
    workspaceLines.set(path, index);
    log.line();
  }

  process.stdout.write(CURSOR_HIDE);

  const updateLine = createLineUpdater(workspacePaths, workspaceLines);

  let results: { skipped: boolean; success: boolean }[] = [];

  try {
    results = await Promise.all(
      workspacePaths.map((workspaceDir) => {
        return cleanWorkspace(workspaceDir, {
          dryRun,
          exclude,
          include,
          updateLine,
        });
      }),
    );
  } finally {
    process.stdout.write(CURSOR_SHOW);
  }

  const successes = results.filter((result) => result.success);

  const endTime = performance.now();
  const duration = endTime - startTime;

  log.line();
  log.success(
    `Cleaned ${successes.length} ${plural(successes.length, "workspace")} successfully in ${dim(formatDuration(duration))}${suffix(dryRun)}`,
  );
}
