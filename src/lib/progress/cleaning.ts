import { dim, INFO, ws } from "@/lib/colors";

import type { LineUpdater } from "./line-updater";

export function createCleaningProgress(
  updateLine: LineUpdater,
  workspaceDir: string,
) {
  return (deleted: number, total: number) => {
    const percent = Math.floor((deleted / total) * 100);

    updateLine(
      workspaceDir,
      `${INFO} Cleaning ${ws(workspaceDir)} ${dim(`${deleted}/${total} (${percent}%)`)}`,
    );
  };
}
