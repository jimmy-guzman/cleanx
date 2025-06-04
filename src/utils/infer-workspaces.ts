import { getPackages } from "@manypkg/get-packages";

import type { CleanxOptions } from "../options";

export async function inferWorkspaces(cwd: string) {
  try {
    const { packages, rootPackage } = await getPackages(cwd);
    const workspaces: Record<string, Partial<CleanxOptions>> = {};

    for (const pkg of packages) {
      if (pkg.dir === rootPackage?.dir) {
        continue;
      }

      workspaces[pkg.dir] = {};
    }

    return workspaces;
  } catch {
    return {};
  }
}
