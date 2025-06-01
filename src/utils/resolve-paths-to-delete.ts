import { glob } from "tinyglobby";

interface ResolvePathsToDeleteOptions {
  dir: string;
  exclude: string[];
  include: string[];
}

export async function resolvePathsToDelete({
  dir,
  exclude,
  include,
}: ResolvePathsToDeleteOptions) {
  const paths = await glob(include, {
    absolute: true,
    cwd: dir,
    dot: true,
    ignore: exclude,
  });

  return paths;
}
