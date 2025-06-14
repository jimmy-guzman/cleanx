import picomatch from "picomatch";
import { isDynamicPattern } from "tinyglobby";

import { BUILTIN_PROFILES } from "../constants";
import { dedupe } from "./dedupe";
import { inferWorkspaces } from "./infer-workspaces";
import { loadConfig } from "./load-config";

interface ResolveConfigsOptions {
  config?: string;
  cwd: string;
  dryRun?: boolean;
  exclude?: string[];
  include?: string[];
  profile: string;
}

export async function resolveConfigs(options: ResolveConfigsOptions) {
  const rootConfig = await loadConfig({
    configPath: options.config,
    cwd: options.cwd,
  });

  const builtinProfile = BUILTIN_PROFILES[options.profile] ?? {};
  const userProfileOverride = rootConfig.profiles?.[options.profile] ?? {};
  const mergedProfileConfig = {
    ...builtinProfile,
    ...userProfileOverride,
  };

  const discoveredWorkspaces = await inferWorkspaces(options.cwd);

  const workspaceConfigs = discoveredWorkspaces.map((workspace) => {
    const workspaceIsolationExclusions = discoveredWorkspaces
      .filter((other) => {
        return other.dir !== workspace.dir;
      })
      .map((other) => {
        return `*(../)**/${other.packageJson.name}/**/*`;
      });

    const config = {
      exclude: dedupe([
        ...(mergedProfileConfig.exclude ?? []),
        ...(rootConfig.exclude ?? []),
        ...workspaceIsolationExclusions,
        ...(options.exclude ?? []),
      ]),
      include: dedupe([
        ...(mergedProfileConfig.include ?? []),
        ...(rootConfig.include ?? []),
        ...(options.include ?? []),
      ]),
    };

    return { config, dir: workspace.dir };
  });

  const userWorkspaceOverrides = rootConfig.workspaces ?? {};

  for (const [pattern, override] of Object.entries(userWorkspaceOverrides)) {
    if (pattern === ".") continue;

    const matchingWorkspaceDirs = isDynamicPattern(pattern)
      ? workspaceConfigs
          .filter((wc) => {
            return picomatch(pattern)(wc.dir);
          })
          .map((wc) => {
            return wc.dir;
          })
      : workspaceConfigs.some((wc) => {
            return wc.dir === pattern;
          })
        ? [pattern]
        : [];

    for (const dir of matchingWorkspaceDirs) {
      const targetWorkspace = workspaceConfigs.find((wc) => {
        return wc.dir === dir;
      });

      if (targetWorkspace) {
        targetWorkspace.config = {
          exclude: dedupe([
            ...targetWorkspace.config.exclude,
            ...(override.exclude ?? []),
          ]),
          include: dedupe([
            ...targetWorkspace.config.include,
            ...(override.include ?? []),
          ]),
        };
      }
    }
  }

  const workspaceProtectionExclusions = discoveredWorkspaces.flatMap(
    (workspace) => {
      return [workspace.dir, `**/${workspace.packageJson.name}/**/*`];
    },
  );

  const rootWorkspaceOverride = userWorkspaceOverrides["."] ?? {};
  const rootWorkspaceConfig = {
    config: {
      exclude: dedupe([
        ...(mergedProfileConfig.exclude ?? []),
        ...(rootConfig.exclude ?? []),
        ...workspaceProtectionExclusions,
        ...(rootWorkspaceOverride.exclude ?? []),
        ...(options.exclude ?? []),
      ]),
      include: dedupe([
        ...(mergedProfileConfig.include ?? []),
        ...(rootConfig.include ?? []),
        ...(rootWorkspaceOverride.include ?? []),
        ...(options.include ?? []),
      ]),
    },
    dir: options.cwd,
  };

  const resolvedDryRun =
    options.dryRun ?? rootConfig.dryRun ?? mergedProfileConfig.dryRun ?? false;

  return {
    dryRun: resolvedDryRun,
    workspaces: [rootWorkspaceConfig, ...workspaceConfigs],
  };
}
