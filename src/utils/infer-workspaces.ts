import { relative } from "node:path";

import { getPackages } from "@manypkg/get-packages";

import type { CleanxOptions } from "../options";

import { isWithinCwd } from "./is-within-cwd";

export async function inferWorkspaces(cwd: string) {
  try {
    const { packages } = await getPackages(cwd);
    const workspaces: Record<string, Partial<CleanxOptions>> = {};

    for (const pkg of packages) {
      const relativePath = relative(cwd, pkg.dir);

      if (isWithinCwd(relativePath)) {
        workspaces[relativePath] = {};
      }
    }

    return workspaces;
  } catch {
    return {};
  }
}
