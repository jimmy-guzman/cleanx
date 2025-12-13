/**
 * Generates an array of exclude patterns with negated include patterns.
 *
 * @param exclude Array of patterns to exclude
 *
 * @param include Array of patterns to include
 *
 * @returns Array of exclude patterns with negated include patterns
 */
export const excludePatterns = (exclude: string[], include: string[]) => {
  return [
    ...exclude,
    ...include.flatMap((pattern) => {
      const normalized = pattern.replaceAll("\\", "/");

      if (normalized.endsWith("/**")) {
        return [`!${normalized.slice(0, -3)}`, `!${normalized}`];
      }

      return [`!${normalized}`];
    }),
  ];
};
