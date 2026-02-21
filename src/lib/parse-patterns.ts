import { normalize } from "pathe";

function normalizeExcludePattern(pattern: string) {
  const normalized = normalize(pattern);

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
  const { expand } = await import("brace-expansion");

  const exclude: string[] = [];
  const include: string[] = [];

  for (const pattern of excludePatterns) {
    const normalized = normalize(pattern);

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
    const normalized = normalize(pattern);

    include.push(...expand(normalized));
  }

  return { exclude, include };
}
