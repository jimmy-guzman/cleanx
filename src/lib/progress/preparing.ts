import { dim, INFO, ws } from "@/lib/colors";

import type { LineUpdater } from "./line-updater";

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
