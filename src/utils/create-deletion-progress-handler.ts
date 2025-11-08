import { dim, INFO, ws } from "./logger";

export function createDeletionProgressHandler(
  updateLine: (workspaceDir: string, content: string) => void,
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
