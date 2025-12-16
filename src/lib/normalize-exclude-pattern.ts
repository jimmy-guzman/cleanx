export function normalizeExcludePattern(pattern: string) {
  const normalized = pattern.replaceAll("\\", "/");

  if (normalized.includes("**")) {
    return normalized;
  }

  if (normalized.endsWith("/")) {
    return `${normalized}**`;
  }

  return `${normalized}/**`;
}
