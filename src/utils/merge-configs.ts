import type { CleanxOptions } from "../options";

import { dedupe } from "./dedupe";

interface MergeConfigsOptions {
  cli: Partial<CleanxOptions>;
  profile: Partial<CleanxOptions>;
  root: CleanxOptions;
  workspace: Partial<CleanxOptions>;
}

export function mergeConfigs({
  cli,
  profile,
  root,
  workspace,
}: MergeConfigsOptions) {
  return {
    dryRun: cli.dryRun ?? root.dryRun ?? profile.dryRun ?? false,
    exclude: dedupe([
      ...(profile.exclude ?? []),
      ...(root.exclude ?? []),
      ...(workspace.exclude ?? []),
      ...(cli.exclude ?? []),
    ]),
    include: dedupe([
      ...(profile.include ?? []),
      ...(root.include ?? []),
      ...(workspace.include ?? []),
      ...(cli.include ?? []),
    ]),
  };
}
