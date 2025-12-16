export function normalizeExcludePattern(pattern: string) {
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

  const lastSegment = normalized.split("/").pop() ?? "";

  if (lastSegment.includes(".")) {
    return normalized;
  }

  if (normalized.endsWith("/")) {
    return `${normalized}**`;
  }

  return `${normalized}/**`;
}
