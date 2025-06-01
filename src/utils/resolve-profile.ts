import type { CleanxOptions } from "../options";

import { BUILTIN_PROFILES } from "../constants";

interface ResolveProfileOptions {
  profile: string;
  rootConfig: CleanxOptions;
}

export function resolveProfile({ profile, rootConfig }: ResolveProfileOptions) {
  const builtin = BUILTIN_PROFILES[profile] ?? {};
  const userOverride = rootConfig.profiles?.[profile] ?? {};

  return {
    ...builtin,
    ...userOverride,
  };
}
