import { plural } from "./plural";

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const DECIMAL_PLACES = 1;

export function formatDuration(ms: number) {
  if (ms < MS_PER_SECOND) {
    return `${Math.round(ms)}ms`;
  }

  const totalSeconds = ms / MS_PER_SECOND;

  if (totalSeconds < SECONDS_PER_MINUTE) {
    const displaySeconds = Number(totalSeconds.toFixed(DECIMAL_PLACES));

    return `${totalSeconds.toFixed(DECIMAL_PLACES)} ${plural(displaySeconds, "second")}`;
  }

  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const remainingSeconds = Math.round(totalSeconds % SECONDS_PER_MINUTE);

  if (remainingSeconds >= SECONDS_PER_MINUTE) {
    const adjustedMinutes =
      minutes + Math.floor(remainingSeconds / SECONDS_PER_MINUTE);
    const adjustedSeconds = remainingSeconds % SECONDS_PER_MINUTE;

    if (adjustedSeconds === 0) {
      return `${adjustedMinutes} ${plural(adjustedMinutes, "minute")}`;
    }

    return `${adjustedMinutes}m ${adjustedSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} ${plural(minutes, "minute")}`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}
