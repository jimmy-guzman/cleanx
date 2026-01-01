import escalade from "escalade";
import { join } from "pathe";
import { glob } from "tinyglobby";

const GITIGNORE_FILENAME = ".gitignore";
const GIT_FILENAME = ".git";

async function findLocalGitignoreFiles(dir: string) {
  return glob([GITIGNORE_FILENAME, `**/${GITIGNORE_FILENAME}`], {
    absolute: true,
    cwd: dir,
    dot: true,
    ignore: ["**/node_modules/**", `**/${GIT_FILENAME}/**`],
  });
}

async function findParentGitignoreFiles(dir: string) {
  const parentGitignoreFiles: string[] = [];
  const startDir = dir;

  await escalade(dir, (dir, names) => {
    if (dir !== startDir && names.includes(GITIGNORE_FILENAME)) {
      parentGitignoreFiles.push(join(dir, GITIGNORE_FILENAME));
    }

    return names.includes(GIT_FILENAME) && GIT_FILENAME;
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
