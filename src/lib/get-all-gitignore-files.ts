import { access, glob } from "node:fs/promises";
import { dirname, join } from "node:path";

const GITIGNORE_FILENAME = ".gitignore";
const GIT_FILENAME = ".git";

async function findLocalGitignoreFiles(dir: string) {
  const results: string[] = [];

  for await (const entry of glob(
    [GITIGNORE_FILENAME, `**/${GITIGNORE_FILENAME}`],
    {
      cwd: dir,
      exclude: (fileName) => {
        return fileName === "node_modules" || fileName === GIT_FILENAME;
      },
    },
  )) {
    results.push(join(dir, entry));
  }

  return results;
}

async function findParentGitignoreFiles(dir: string) {
  const parentGitignoreFiles: string[] = [];

  let current = dirname(dir);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- loop breaks via return or parent check
  while (true) {
    const hasGitignore = await access(join(current, GITIGNORE_FILENAME))
      .then(() => true)
      .catch(() => false);

    if (hasGitignore) {
      parentGitignoreFiles.push(join(current, GITIGNORE_FILENAME));
    }

    const hasGit = await access(join(current, GIT_FILENAME))
      .then(() => true)
      .catch(() => false);

    if (hasGit) break;

    const parent = dirname(current);

    if (parent === current) break;

    current = parent;
  }

  return parentGitignoreFiles;
}

export async function getAllGitignoreFiles(dir: string) {
  const [localGitignoreFiles, parentGitignoreFiles] = await Promise.all([
    findLocalGitignoreFiles(dir),
    findParentGitignoreFiles(dir),
  ]);

  return [...parentGitignoreFiles.toReversed(), ...localGitignoreFiles];
}
