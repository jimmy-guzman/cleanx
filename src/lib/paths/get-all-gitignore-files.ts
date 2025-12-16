import { join } from "node:path";

import escalade from "escalade";
import { glob } from "tinyglobby";

async function findLocalGitignoreFiles(dir: string) {
  return glob([".gitignore", "**/.gitignore"], {
    absolute: true,
    cwd: dir,
    dot: true,
    ignore: ["**/node_modules/**", "**/.git/**"],
  });
}

async function findParentGitignoreFiles(dir: string) {
  const parentGitignoreFiles: string[] = [];

  await escalade(dir, (dir, names) => {
    if (names.includes(".gitignore")) {
      parentGitignoreFiles.push(join(dir, ".gitignore"));
    }

    if (names.includes(".git")) {
      return ".git";
    }

    return undefined;
  });

  return parentGitignoreFiles;
}

export async function getAllGitignoreFiles(dir: string) {
  const [localGitignoreFiles, parentGitignoreFiles] = await Promise.all([
    findLocalGitignoreFiles(dir),
    findParentGitignoreFiles(dir),
  ]);

  return [...parentGitignoreFiles.toReversed(), ...localGitignoreFiles];
}
