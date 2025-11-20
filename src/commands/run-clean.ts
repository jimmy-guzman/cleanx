import { ms } from "ms";

import { cleanWorkspace } from "@/lib/clean-workspace";
import { dim, suffix } from "@/lib/colors";
import { getWorkspacePaths } from "@/lib/get-workspace-paths";
import { log } from "@/lib/logging/log";
import { createLineUpdater } from "@/lib/progress/line-updater";
import { plural } from "@/lib/utils/plural";

interface RunCleanOptions {
  cwd: string;
  dryRun: boolean;
  exclude: string[];
}

const CURSOR_HIDE = "\u001B[?25l";
const CURSOR_SHOW = "\u001B[?25h";

export async function runClean({ cwd, dryRun, exclude }: RunCleanOptions) {
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

  let results: PromiseSettledResult<{ skipped: boolean; success: boolean }>[] =
    [];

  try {
    results = await Promise.allSettled(
      workspacePaths.map((workspaceDir) => {
        return cleanWorkspace(workspaceDir, { dryRun, exclude, updateLine });
      }),
    );
  } finally {
    process.stdout.write(CURSOR_SHOW);
  }

  const successes = results.filter(
    (r) => r.status === "fulfilled" && r.value.success,
  );

  const endTime = performance.now();
  const duration = endTime - startTime;

  log.line();
  log.success(
    `Cleaned ${successes.length} ${plural(successes.length, "workspace")} successfully in ${dim(ms(duration))}${suffix(dryRun)}`,
  );
}
