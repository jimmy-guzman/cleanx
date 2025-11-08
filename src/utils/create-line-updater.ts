const cursorUp = (lines: number) => `\u001B[${lines}A`;
const cursorDown = (lines: number) => `\u001B[${lines}B`;
const CLEAR_LINE = "\r\u001B[K";

export function createLineUpdater(
  workspacePaths: string[],
  workspaceLines: Map<string, number>,
) {
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
