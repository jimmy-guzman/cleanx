import { getPackages } from "@manypkg/get-packages";

export const getWorkspacePaths = async (cwd: string) => {
  const { packages, rootPackage } = await getPackages(cwd);

  const seen = new Set<string>();
  const paths: string[] = [];

  if (rootPackage?.dir) {
    seen.add(rootPackage.dir);
    paths.push(rootPackage.dir);
  }

  for (const { dir } of packages) {
    if (dir && !seen.has(dir)) {
      seen.add(dir);
      paths.push(dir);
    }
  }

  return paths;
};
