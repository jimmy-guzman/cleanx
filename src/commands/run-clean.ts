import { getPackages } from "@manypkg/get-packages";
import { ms } from "ms";

import { cleanWorkspace } from "@/utils/clean-workspace";
import { createLineUpdater } from "@/utils/create-line-updater";
import { dim, log, suffix } from "@/utils/logger";
import { plural } from "@/utils/plural";

interface RunCleanOptions {
  cwd: string;
  dryRun: boolean;
  exclude: string[];
}

const CURSOR_HIDE = "\u001B[?25l";
const CURSOR_SHOW = "\u001B[?25h";

export async function runClean({ cwd, dryRun, exclude }: RunCleanOptions) {
  const startTime = performance.now();
  const { packages, rootPackage } = await getPackages(cwd);
  const workspacePaths = [
    ...new Set([rootPackage, ...packages].flatMap((pkg) => pkg?.dir ?? [])),
  ];
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

  const results = await Promise.allSettled(
    workspacePaths.map((workspaceDir) => {
      return cleanWorkspace(workspaceDir, { dryRun, exclude, updateLine });
    }),
  );

  process.stdout.write(CURSOR_SHOW);

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
