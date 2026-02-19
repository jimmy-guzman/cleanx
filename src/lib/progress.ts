import { dim, INFO, ws } from "./colors";

const cursorUp = (lines: number) => `\u001B[${lines}A`;
const cursorDown = (lines: number) => `\u001B[${lines}B`;
const CLEAR_LINE = "\r\u001B[K";

type LineUpdater = (workspaceDir: string, content: string) => void;

export function createLineUpdater(
  workspacePaths: string[],
  workspaceLines: Map<string, number>,
): LineUpdater {
  return (workspaceDir: string, content: string) => {
    const lineIndex = workspaceLines.get(workspaceDir);

    if (lineIndex === undefined) return;

    const linesToMove = workspacePaths.length - lineIndex;

    process.stdout.write(cursorUp(linesToMove));
    process.stdout.write(CLEAR_LINE);
    process.stdout.write(content);
    process.stdout.write(cursorDown(linesToMove));
  };
}

export function createPreparingProgress(
  updateLine: LineUpdater,
  workspaceDir: string,
) {
  return (
    phase: "filtering" | "gitignore" | "scanning",
    current?: number,
    total?: number,
  ) => {
    if (phase === "gitignore") {
      updateLine(
        workspaceDir,
        `${INFO} Reading .gitignore in ${ws(workspaceDir)}`,
      );
    } else if (phase === "scanning") {
      updateLine(workspaceDir, `${INFO} Scanning ${ws(workspaceDir)}`);
    } else if (typeof current === "number" && typeof total === "number") {
      const percent = total > 0 ? Math.floor((current / total) * 100) : 100;

      updateLine(
        workspaceDir,
        `${INFO} Filtering ${ws(workspaceDir)} ${dim(`${current}/${total} (${percent}%)`)}`,
      );
    }
  };
}

export function createCleaningProgress(
  updateLine: LineUpdater,
  workspaceDir: string,
) {
  return (deleted: number, total: number) => {
    const percent = total > 0 ? Math.floor((deleted / total) * 100) : 100;

    updateLine(
      workspaceDir,
      `${INFO} Cleaning ${ws(workspaceDir)} ${dim(`${deleted}/${total} (${percent}%)`)}`,
    );
  };
}
