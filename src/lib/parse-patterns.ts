const windowsNormalize = (pattern: string) => pattern.replaceAll("\\", "/");

function normalizeExcludePattern(pattern: string) {
  const normalized = windowsNormalize(pattern);

  if (normalized.includes("**")) {
    return normalized;
  }

  if (
    normalized.includes("*") ||
    normalized.includes("?") ||
    normalized.includes("[")
  ) {
    return normalized;
  }

  if (normalized.split("/").pop()?.includes(".")) {
    return normalized;
  }

  if (normalized.endsWith("/")) {
    return `${normalized}**`;
  }

  return `${normalized}/**`;
}

export async function parsePatterns(
  excludePatterns: string[],
  includePatterns: string[],
) {
  const { default: expand } = await import("brace-expansion");

  const exclude: string[] = [];
  const include: string[] = [];

  for (const pattern of excludePatterns) {
    const normalized = windowsNormalize(pattern);

    if (normalized.startsWith("!")) {
      const withoutBang = normalized.slice(1);

      include.push(...expand(withoutBang));
    } else {
      const expanded = expand(normalized);

      for (const expandedPattern of expanded) {
        exclude.push(normalizeExcludePattern(expandedPattern));
      }
    }
  }

  for (const pattern of includePatterns) {
    const normalized = windowsNormalize(pattern);

    include.push(...expand(normalized));
  }

  return { exclude, include };
}
