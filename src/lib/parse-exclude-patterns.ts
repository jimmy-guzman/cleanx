function normalizeExcludePattern(pattern: string) {
  const normalized = pattern.replaceAll("\\", "/");

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

export function parseExcludePatterns(patterns: string[]) {
  const exclude: string[] = [];
  const include: string[] = [];

  for (const pattern of patterns) {
    if (pattern.startsWith("!")) {
      include.push(pattern.slice(1).replaceAll("\\", "/"));
    } else {
      exclude.push(normalizeExcludePattern(pattern));
    }
  }

  return { exclude, include };
}
