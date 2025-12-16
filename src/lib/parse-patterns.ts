import expand from "brace-expansion";

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

export function parsePatterns(
  excludePatterns: string[],
  includePatterns: string[],
) {
  const exclude: string[] = [];
  const include: string[] = [];

  for (const pattern of excludePatterns) {
    if (pattern.startsWith("!")) {
      const withoutBang = windowsNormalize(pattern.slice(1));

      include.push(...expand(withoutBang));
    } else {
      exclude.push(normalizeExcludePattern(pattern));
    }
  }

  for (const pattern of includePatterns) {
    const normalized = windowsNormalize(pattern);

    include.push(...expand(normalized));
  }

  return { exclude, include };
}
