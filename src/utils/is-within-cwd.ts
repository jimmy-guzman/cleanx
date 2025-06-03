/**
 * Checks if a relative path is within the current working directory
 * (not the root directory and not outside the cwd)
 */
export function isWithinCwd(relativePath: string): boolean {
  return (
    relativePath !== "" &&
    relativePath !== "." &&
    !relativePath.startsWith("..")
  );
}
