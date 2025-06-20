import { getPackages } from "@manypkg/get-packages";

export async function inferWorkspaces(cwd: string) {
  try {
    const { packages, rootPackage } = await getPackages(cwd);

    return packages.filter((pkg) => pkg.dir !== rootPackage?.dir);
  } catch {
    return [];
  }
}
