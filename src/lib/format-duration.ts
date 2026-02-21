export function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;

  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;

  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;

  return `${Math.round(ms / 3_600_000)}h`;
}
