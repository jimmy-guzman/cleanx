import picomatch from "picomatch";
import { isDynamicPattern } from "tinyglobby";

import type { CleanxOptions } from "../options";

import { inferWorkspaces } from "./infer-workspaces";
import { mergeConfigs } from "./merge-configs";

interface ResolveWorkspaceConfigsOptions {
  cliConfig: Partial<CleanxOptions>;
  cwd: string;
  profileConfig: Partial<CleanxOptions>;
  rootConfig: CleanxOptions;
}

export async function resolveWorkspaceConfigs({
  cliConfig,
  cwd,
  profileConfig,
  rootConfig,
}: ResolveWorkspaceConfigsOptions) {
  const inferredWorkspaces = await inferWorkspaces(cwd);
  const inferredDirs = Object.keys(inferredWorkspaces);
  const userOverrides = rootConfig.workspaces ?? {};

  const workspaceConfigs = inferredDirs.map((dir) => {
    return {
      config: mergeConfigs({
        cli: cliConfig,
        profile: profileConfig,
        root: rootConfig,
        workspace: {},
      }),
      dir,
    };
  });

  for (const [pattern, override] of Object.entries(userOverrides)) {
    if (pattern === ".") continue;

    const matches = isDynamicPattern(pattern)
      ? inferredDirs.filter((dir) => {
          return picomatch(pattern)(dir);
        })
      : inferredDirs.includes(pattern)
        ? [pattern]
        : [];

    for (const dir of matches) {
      const entry = workspaceConfigs.find((w) => {
        return w.dir === dir;
      });

      if (entry) {
        entry.config = mergeConfigs({
          cli: cliConfig,
          profile: profileConfig,
          root: rootConfig,
          workspace: override,
        });
      }
    }
  }

  const nonRootDirs = workspaceConfigs
    .map((w) => {
      return w.dir;
    })
    .filter((dir) => {
      return dir !== cwd;
    });

  const rootOverride = userOverrides["."] ?? {};
  const rootMergedConfig = mergeConfigs({
    cli: cliConfig,
    profile: profileConfig,
    root: {
      ...rootConfig,
      exclude: [...(rootConfig.exclude ?? []), ...nonRootDirs],
    },
    workspace: rootOverride,
  });

  return [{ config: rootMergedConfig, dir: cwd }, ...workspaceConfigs];
}
