import { dim, INFO, ws } from "./logger";

export function createProgressHandler(
  updateLine: (workspaceDir: string, content: string) => void,
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
