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
  const userOverrides = rootConfig.workspaces ?? {};

  const workspaceConfigs = inferredWorkspaces.map((workspace) => {
    const otherWorkspaceExclusions = inferredWorkspaces
      .filter((other) => {
        return other.dir !== workspace.dir;
      })
      .map((other) => {
        return `*(../)**/${other.packageJson.name}/**/*`;
      });

    return {
      config: mergeConfigs({
        cli: cliConfig,
        profile: profileConfig,
        root: rootConfig,
        workspace: { exclude: otherWorkspaceExclusions },
      }),
      dir: workspace.dir,
    };
  });

  const inferredDirs = inferredWorkspaces.map((workspace) => {
    return workspace.dir;
  });

  for (const [pattern, override] of Object.entries(userOverrides)) {
    if (pattern === ".") continue;

    const matchingDirs = isDynamicPattern(pattern)
      ? inferredDirs.filter((dir) => {
          return picomatch(pattern)(dir);
        })
      : inferredDirs.includes(pattern)
        ? [pattern]
        : [];

    for (const dir of matchingDirs) {
      const workspaceConfig = workspaceConfigs.find((config) => {
        return config.dir === dir;
      });

      if (workspaceConfig) {
        workspaceConfig.config = mergeConfigs({
          cli: cliConfig,
          profile: profileConfig,
          root: rootConfig,
          workspace: override,
        });
      }
    }
  }

  const workspaceExclusions = inferredWorkspaces.flatMap((workspace) => {
    return [workspace.dir, `**/${workspace.packageJson.name}/**/*`];
  });

  const rootResult = {
    config: mergeConfigs({
      cli: cliConfig,
      profile: profileConfig,
      root: {
        ...rootConfig,
        exclude: [...(rootConfig.exclude ?? []), ...workspaceExclusions],
      },
      workspace: userOverrides["."] ?? {},
    }),
    dir: cwd,
  };

  return [rootResult, ...workspaceConfigs];
}
